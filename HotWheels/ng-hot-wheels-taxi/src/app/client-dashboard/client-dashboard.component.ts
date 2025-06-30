import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RequestService } from '../request.service';
import { ShiftService } from '../shift.service';
import { ExtendedRequest } from '../extended-request';
import { PriceService } from '../price.service';


@Component({
  selector: 'app-client-dashboard',
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.css']
})
export class ClientDashboardComponent implements OnInit {
  pendingRequests: ExtendedRequest[] = [];
  driverAcceptedRequests: ExtendedRequest[] = [];
  currentNif: number | undefined = undefined;


  constructor(
    private requestService: RequestService,
    private shiftService: ShiftService,
    private changeDetectorRef: ChangeDetectorRef,
    private priceService: PriceService
    

  ) {}
  ngOnInit(): void {

    this.requestService.currentClient$.subscribe(client => {
      if (client) {
        this.currentNif = client.nif;
        this.loadClientRequests();
      } else {
        this.currentNif = undefined;
        this.pendingRequests = [];
        this.driverAcceptedRequests = [];
      }
    });
  }

  loadClientRequests(): void {
    if (!this.currentNif) {
      console.warn('No NIF available. Cannot load client requests.');
      return;
    }
    console.log('Loading requests for NIF:', this.currentNif);
    
    this.requestService.getAllRequestsByNif(this.currentNif)
      .subscribe(requests => {

        this.pendingRequests = requests.filter(r => r.status === 'pending') as unknown as ExtendedRequest[];
        const acceptedRequests = requests.filter(r => r.status === 'driver_accepted') as unknown as ExtendedRequest[];
        this.driverAcceptedRequests = acceptedRequests;
  
        console.log('Driver accepted requests:', this.driverAcceptedRequests);
        
        this.driverAcceptedRequests.forEach(request => {
          if (request.driver?.info?.person?.nif) {
            const driverNif = request.driver?.info?.person.nif;
            console.log(`Loading shift for driver with NIF: ${driverNif}`);
            
            this.shiftService.getOngoingShifts(driverNif)
              .subscribe({
                next: (shifts) => {
                  console.log(`Received shifts for driver ${driverNif}:`, shifts);
                  
                  if (shifts && shifts.length > 0) {
                    const shift = shifts[0];
                    const index = this.driverAcceptedRequests.findIndex(r => r._id === request._id);
                    
                    if (index !== -1) {

                      const request = this.driverAcceptedRequests[index];

                       if (!request.pickup.coordinates || !request.destination.coordinates) {
                        console.warn('Missing coordinates for request', request._id);
                        return;
                      }

                      const trip_distance = this.priceService.calculateDistance(
                        request.pickup.coordinates.lat,
                        request.pickup.coordinates.lng,
                        request.destination.coordinates.lat,
                        request.destination.coordinates.lng
                      );

                      this.driverAcceptedRequests[index] = { 
                        ...this.driverAcceptedRequests[index], 
                        shift: shift, 
                        trip_distance : trip_distance,
                        
                      };

                      this.priceService.calculateTripCost(trip_distance,this.driverAcceptedRequests[index].comfort , new Date)
                          .then(price => {
                            this.driverAcceptedRequests[index].priceEstimate = price;
                            this.changeDetectorRef.detectChanges();
                          })
                          .catch(error => console.error('Error calculating price:', error));
                      
                      
                      if (shift.taxi) {
                        this.driverAcceptedRequests[index].taxi = shift.taxi;
                        console.log(`Added taxi info to request ${request._id}:`, shift.taxi);
                      }
                      
                      this.changeDetectorRef.detectChanges();
                    }
                  } else {
                    console.warn(`No active shifts found for driver ${driverNif}`);
                  }
                },
                error: (err) => {
                  console.error(`Error fetching shifts for driver ${driverNif}:`, err);
                }
              });
          } else {
            console.warn(`Request ${request._id} has incomplete driver information`);
          }
        });
      });
  }

  cancelRequest(requestId: string | undefined): void {
    if (!confirm('Are you sure you want to cancel this request?')) {
      return;
    }

    this.requestService.cancelRequest(requestId).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(
          req => req._id !== requestId
        );
        alert('Request cancelled successfully');
      },
      error: (err) => {
        console.error('Error cancelling request:', err);
        alert('Failed to cancel request');
      }
    });
  }


  confirmRequest(requestId: string | undefined): void {
    if (!requestId) return;
    
    if (!confirm('Confirm this driver for your ride?')) {
      return;
    }

    this.requestService.clientConfirmsRequest(requestId).subscribe({
      next: () => {
        this.driverAcceptedRequests = this.driverAcceptedRequests.filter(
          req => req._id !== requestId
        );
        alert('Driver confirmed successfully');
      },
      error: (err) => {
        console.error('Error confirming request:', err);
        alert('Failed to confirm driver');
      }
    });
  }

  rejectDriver(requestId: string | undefined): void {
    if (!requestId) return;
    
    if (!confirm('Reject this driver and return to waiting list?')) {
      return;
    }

    this.requestService.clientRejectsDriver(requestId).subscribe({
      next: (updatedRequest) => {
        this.driverAcceptedRequests = this.driverAcceptedRequests.filter(
          req => req._id !== requestId
        );
        this.pendingRequests.push(updatedRequest);
        alert('Driver rejected successfully');
      },
      error: (err) => {
        console.error('Error rejecting driver:', err);
        alert('Failed to reject driver');
      }
    });
  }


}