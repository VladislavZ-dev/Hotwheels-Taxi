import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RequestService } from '../request.service';
import { TripService } from '../trip.service';
import { AuthService } from '../auth.service';
import { ExtendedRequest } from '../extended-request';
import { PriceService } from '../price.service';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { TaxiService } from '../taxi.service';
import { Taxi } from '../taxi';
import { Shift } from '../shift';
import { Period } from '../period';
import { ShiftService } from '../shift.service';

@Component({
  selector: 'app-trip-form',
  templateUrl: './trip-form.component.html',
  styleUrls: ['./trip-form.component.css']
})
export class TripFormComponent implements OnInit {
  tripForm: FormGroup;
  tripRequests: ExtendedRequest[] = [];
  selectedRequest: ExtendedRequest | null = null;
  calculatingData: boolean = false;
  availableTaxis: Taxi[] = []; 

  tripSubmitted: boolean = false;
  tripSuccess: boolean = false;
  errorMessage: string = '';
  
  constructor(
    private fb: FormBuilder, 
    private requestService: RequestService, 
    private tripService: TripService, 
    private authService: AuthService,
    private priceService: PriceService,
    private taxiService: TaxiService,
    private shiftService: ShiftService,
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router
  ) {
    this.tripForm = this.fb.group({
      passengers: [null, Validators.required],
      departureLocation: ['', Validators.required],
      arrivalLocation: ['', Validators.required],
      departureTime: ['', Validators.required],
      arrivalTime: ['', Validators.required],
      taxi_plate: ['', Validators.required], 
      shift_id: ['', Validators.required]    
    });
  }

  ngOnInit(): void {
    if (!this.authService.currentDriver?.person?.nif) {
      throw new Error("Driver's nif is undefined");
    }
  
    const now = new Date();
    const beginningHour = now.toISOString();
    const endingHour = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours from now

    this.shiftService.getOngoingShifts(this.authService.currentDriver.person.nif).subscribe(shift => {
      if (shift) {
        this.tripForm.patchValue({
          shift_id: shift[0],
          taxi_plate: shift[0].taxi.licensePlate
        });
        this.availableTaxis = [{ licensePlate: shift[0].taxi.licensePlate } as Taxi];
      } else {
        console.warn('No active shift found for driver');
        this.taxiService.getAvailableTaxis(beginningHour, endingHour).subscribe(taxis => {
          this.availableTaxis = taxis;
        });
      }
    });
  
    this.requestService.getAllDriverRequestsByNif(this.authService.currentDriver.person.nif).subscribe((requests) => {
      this.tripRequests = requests.filter(r => r.status === 'client_confirmed') as unknown as ExtendedRequest[];
    });
  }

  async onRequestSelect(event: Event) {
    const target = event.target as HTMLSelectElement;
    const requestId = target.value;

    const req = this.tripRequests.find(r => r._id === requestId);
    if (!req) return;

    this.selectedRequest = req;
    
    this.tripSubmitted = false;
    this.tripSuccess = false;
    this.errorMessage = '';
    this.calculatingData = true;
    
    this.tripForm.patchValue({
      passengers: req.passengers,
      departureLocation: req.pickup.address.street + ", " + req.pickup.address.doorNumber + ", " + req.pickup.address.postCode 
      + ", " + req.pickup.address.locality,
      arrivalLocation: req.destination.address.street + ", " + req.destination.address.doorNumber + ", " + req.destination.address.postCode 
      + ", " + req.destination.address.locality,
      departureTime: new Date(req.timestamps.requested).toISOString().slice(0, 16),
      arrivalTime: new Date().toISOString().slice(0, 16)
    });
    
    await this.calculateMissingRequestDataAsync(req);
    
    this.calculatingData = false;
 
    this.changeDetectorRef.detectChanges();
    
    console.log('Selected request with all data calculated:', this.selectedRequest);
  }

  async calculateMissingRequestDataAsync(request: ExtendedRequest): Promise<void> {
    console.log('Calculating missing data for request:', request);
    
    if (!request.trip_distance && request.pickup?.coordinates && request.destination?.coordinates) {
      request.trip_distance = this.priceService.calculateDistance(
        request.pickup.coordinates.lat,
        request.pickup.coordinates.lng,
        request.destination.coordinates.lat,
        request.destination.coordinates.lng
      );
      
      console.log('Calculated trip_distance:', request.trip_distance);
    } else if (!request.trip_distance) {

      console.log('No coordinates available for distance calculation, using time-based estimate');
      const departureTime = new Date(this.tripForm.value.departureTime);
      const arrivalTime = new Date(this.tripForm.value.arrivalTime);
      const timeDiffMinutes = (arrivalTime.getTime() - departureTime.getTime()) / (1000 * 60);
      request.trip_distance = timeDiffMinutes / 4;
      console.log('Time-based trip_distance estimate:', request.trip_distance);
    }

    if (request.trip_distance && request.trip_distance > 0) {
      if (!request.trip_price) {
        try {
          const price = await this.priceService.calculateTripCost(
            request.trip_distance,
            request.comfort || 'standard',
            new Date()
          );
          
          request.trip_price = price;  
          console.log('Calculated trip_price:', request.trip_price);
        } catch (error) {
          console.error('Error calculating trip price:', error);
        }
      }
    }
    
    const index = this.tripRequests.findIndex(r => r._id === request._id);
    if (index !== -1) {
      this.tripRequests[index] = request;
    }
    
    console.log('Request data after calculations:', request);
  }

  calculateMissingRequestData(request: ExtendedRequest): void {
    this.calculateMissingRequestDataAsync(request);
  }

  async onSubmit() {
    if (!this.tripForm.valid || !this.selectedRequest) {
      console.error('Form is invalid or no request selected');
      this.showError('Please fill in all required fields and select a request.');
      return;
    }
    
    if (this.calculatingData) {
      console.log('Still calculating data, please wait...');
      this.showError('Still calculating trip data, please wait a moment and try again.');
      return;
    }
    
    const depart = this.tripForm.value.departureLocation.split(", ");
    const arrive = this.tripForm.value.arrivalLocation.split(", ");
    
    const departureTime = new Date(this.tripForm.value.departureTime);
    const arrivalTime = new Date(this.tripForm.value.arrivalTime);

    const comfortLevel = this.selectedRequest.comfort || 'standard';
    const taxi_plate = this.tripForm.value.taxi_plate;

    let tripDistance = this.selectedRequest.trip_distance;
    console.log('Trip distance for submission:', tripDistance);

    let tripPrice = this.selectedRequest.trip_price;
    console.log('Trip price for submission:', tripPrice);

    if (tripDistance === undefined || tripDistance === null) {
      if (this.selectedRequest.pickup?.coordinates && this.selectedRequest.destination?.coordinates) {
        tripDistance = this.priceService.calculateDistance(
          this.selectedRequest.pickup.coordinates.lat,
          this.selectedRequest.pickup.coordinates.lng,
          this.selectedRequest.destination.coordinates.lat,
          this.selectedRequest.destination.coordinates.lng
        );
      } else {
        const timeDiffMinutes = (arrivalTime.getTime() - departureTime.getTime()) / (1000 * 60);
        tripDistance = timeDiffMinutes / 4;
      }
      console.log('Last-minute calculated trip distance:', tripDistance);
    }
    
    try {
      if (!tripPrice) {
        tripPrice = await firstValueFrom(this.priceService.calculatePriceByTimes(departureTime, arrivalTime, comfortLevel));
        console.log('Final calculated trip price:', tripPrice);
      }
      const newTrip = {
        numPeople: this.tripForm.value.passengers,
        departure_address: {
          street: depart[0] || '',
          doorNumber: depart[1] || '',
          postCode: depart[2] || '',
          locality: depart[3] || ''
        },
        arrival_address: {
          street: arrive[0] || '',
          doorNumber: arrive[1] || '',
          postCode: arrive[2] || '',
          locality: arrive[3] || ''
        },
        departure_time: departureTime,
        arrival_time: arrivalTime,
        driver_nif: this.authService.currentDriver?.person?.nif,
        totalCost: tripPrice,           
        distance: tripDistance,         
        requestId: this.selectedRequest._id,
        taxi_plate: taxi_plate,
        shift_id: this.tripForm.value.shift_id || null 
      };
      
      console.log('Final newTrip object for submission:', newTrip);
      
      const response = await firstValueFrom(this.tripService.registerNewTrip(newTrip));
      console.log('Trip successfully registered!', response);
      
      if (!this.selectedRequest._id) {
        throw new Error("Request ID is undefined");
      }
      
      try {
        console.log('Attempting to complete request with ID:', this.selectedRequest._id);
        const completeResponse = await firstValueFrom(this.requestService.completeRequest(this.selectedRequest._id));
        console.log('Request completed successfully:', completeResponse);
      } catch (completeError) {
        console.error('Error completing request:', completeError);
      }
      
      this.tripSubmitted = true;
      this.tripSuccess = true;
      
    } catch (error) {
      console.error('Error in trip submission process:', error);
      this.showError('Failed to register the trip. Please try again later.');
    }
  }

  showError(message: string) {
    this.tripSubmitted = true;
    this.tripSuccess = false;
    this.errorMessage = message;
    this.changeDetectorRef.detectChanges();
  }
  
  goToDashboard() {
    this.router.navigate(['/driver/driver-dashboard']);
  }
  
  retrySubmission() {
    this.tripSubmitted = false;
    this.tripSuccess = false;
    this.errorMessage = '';
    this.changeDetectorRef.detectChanges();
  }
}