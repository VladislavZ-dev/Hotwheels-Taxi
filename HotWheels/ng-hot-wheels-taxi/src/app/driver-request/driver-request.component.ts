import { Component, OnInit, OnDestroy } from '@angular/core';
import { Coordinates, RequestService } from '../request.service';
import { AuthService } from '../auth.service';
import { Request } from '../request';
import { ShiftService } from '../shift.service';
import { Shift } from '../shift';
import { PriceService } from '../price.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-driver-request',
  templateUrl: './driver-request.component.html',
  styleUrls: ['./driver-request.component.css']
})
export class DriverRequestComponent implements OnInit, OnDestroy {
  requests: Request[] = [];
  pendingRequestsCount: number = 0; 
  currentDriver = this.authService.currentDriver;
  driverCoords?: Coordinates;
  onGoingShifts : Shift[] = [];
  noShift : string = "";
  rejectedRequestIds: string[] = [];
  private rejectionSubscription?: Subscription;
  
  private mockCoords: Coordinates = {
    lat: 38.756734, 
    lng:  -9.155412
  };

  constructor(
    private requestService: RequestService, 
    private authService: AuthService, 
    private shiftService: ShiftService,
    public priceService: PriceService
  ) {}

  ngOnInit() {
    if (this.currentDriver?.person?.nif) {
      this.requestService.getRejectedRequests(this.currentDriver.person.nif).subscribe({
        next: (rejectedIds) => {
          this.rejectedRequestIds = rejectedIds;
          console.log('Initial rejected request IDs:', this.rejectedRequestIds);
          
          this.getDriverLocation();
          this.listenForRejectedRequests();
        }
      });
    } else {
      this.getDriverLocation();
    }
  }

  getDriverLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.driverCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('Using actual coordinates:', this.driverCoords);
          this.loadRequests();
        },
        (error) => {
          console.error('Error getting location:', error);
          this.useMockCoordinates('Geolocation error');
        }
      );
    } else {
      this.useMockCoordinates('Geolocation not supported');
    }
  }

  useMockCoordinates(reason: string) {
    console.warn(`${reason} - Using mock coordinates instead:`, this.mockCoords);
    this.driverCoords = {...this.mockCoords};
    this.loadRequests();
  }

  loadRequests() {
    this.shiftService.getOngoingShifts(this.currentDriver?.person?.nif).subscribe({
      next: (shifts) => {
        this.onGoingShifts = shifts;
        console.log('Ongoing shifts:', this.onGoingShifts);
        
        if (this.onGoingShifts.length === 0) {
          this.noShift = `${this.currentDriver?.person?.name} has no shift scheduled for this time`;
        } else {
          if (!this.driverCoords) {
            this.useMockCoordinates('No coordinates available before request');
          }
          
          this.requestService.getPendingRequests(this.driverCoords).subscribe({
            next: (requests: Request[]) => {
              console.log('All pending requests:', requests.length);
              console.log('Current rejected IDs:', this.rejectedRequestIds);
              
              this.requests = requests.filter(request => {
                const isRejected = this.rejectedRequestIds.includes(request._id as string);
                if (isRejected) {
                  console.log(`Filtering out rejected request: ${request._id}`);
                }
                return !isRejected;
              });
              
              this.pendingRequestsCount = this.requests.length; 
              console.log('After filtering rejected requests:', this.requests.length);
            },
            error: (err) => console.error('Error loading requests:', err)
          });
        }
      },
      error: (err) => {
        console.error('Error loading shifts:', err);
        this.noShift = "Error checking shift status";
      }
    });
  }

  acceptRequest(requestId: string | undefined, requestDistance: number | undefined) {
    if (!requestId) return;
    
    const estimatedMinutes = this.priceService.calculateEstimatedMinutes(requestDistance);
    
    this.requestService.driverAcceptsRequest(
      requestId,
      this.currentDriver,
      estimatedMinutes
    ).subscribe({
      next: (updatedRequest) => {
        console.log('Request accepted:', updatedRequest);
        this.loadRequests();
      },
      error: (err) => console.error('Error accepting request:', err)
    });
  }

  listenForRejectedRequests() {
    if (!this.currentDriver?.person?.nif) return;
    
    console.log('Setting up rejection listener for driver:', this.currentDriver.person.nif);

    this.rejectionSubscription = this.requestService.getRejectedRequests(this.currentDriver.person.nif).subscribe({
      next: (rejectedIds: string[]) => {
        console.log('Rejection update received:', rejectedIds);
        const newRejections = rejectedIds.filter(id => !this.rejectedRequestIds.includes(id));
        if (newRejections.length > 0) {
          console.log('New rejections detected:', newRejections);
        }
        
        this.rejectedRequestIds = rejectedIds;
        
        if (this.requests.length > 0) {
          const beforeCount = this.requests.length;
          
          this.requests = this.requests.filter(request => {
            const requestId = request._id as string;
            return !this.rejectedRequestIds.includes(requestId);
          });
          
          this.pendingRequestsCount = this.requests.length;
          
          if (beforeCount !== this.requests.length) {
            console.log(`Removed ${beforeCount - this.requests.length} rejected requests from display`);
          }
        }
      },
      error: (err) => console.error('Error getting rejected requests:', err)
    });
  }
  
  ngOnDestroy() {
    if (this.rejectionSubscription) {
      this.rejectionSubscription.unsubscribe();
    }
  }
}