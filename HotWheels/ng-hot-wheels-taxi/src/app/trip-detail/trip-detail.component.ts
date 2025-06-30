import { Component } from '@angular/core';
import { TripService } from '../trip.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-trip-detail',
  templateUrl: './trip-detail.component.html',
  styleUrls: ['./trip-detail.component.css']
})
export class TripDetailComponent {
  trips: any[] = [];

  constructor(private tripService: TripService, private authService : AuthService) {}

  ngOnInit(): void {
    if (!this.authService.currentDriver?.person?.nif){
      throw new Error ("Drivers nif is undefined!")
    }
    this.tripService.getTripsByDriver(this.authService.currentDriver?.person?.nif).subscribe(
      (trips) => {
        this.trips = trips.sort((a, b) => {
        return new Date(b.period.beginning).getTime() - new Date(a.period.beginning).getTime();
      });
      },
      (error) => {
        console.error('Error fetching trips', error);
      }
    );
  }
}
