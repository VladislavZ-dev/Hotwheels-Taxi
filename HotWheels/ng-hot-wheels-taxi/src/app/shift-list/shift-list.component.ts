import { Component } from '@angular/core';
import { Shift } from '../shift';
import { ShiftService } from '../shift.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-shift-list',
  templateUrl: './shift-list.component.html',
  styleUrls: ['./shift-list.component.css']
})
export class ShiftListComponent {
  upcomingShifts : Shift[] = [];
  pastShifts : Shift[] = [];
  ongoingShifts : Shift[] = [];

  currentDriver? : number = this.authService.currentDriver?.person?.nif;

  constructor(private shiftService : ShiftService, private authService : AuthService)  {}

  ngOnInit(): void {
    console.log('Current driver NIF:', this.currentDriver);
    this.getUpcomingShifts();
    this.getPastShifts();
    this.getOngoingShifts();
  }

  getUpcomingShifts() {
    this.shiftService.getFutureShifts(this.currentDriver).subscribe({
      next: (shifts) => {
        this.upcomingShifts = shifts;
        console.log('Received upcoming shifts:', shifts);
      },
      error: (err) => {
        console.error('Error fetching shifts:', err);
      }
    });
  }

  getPastShifts() {
    this.shiftService.getPastShifts(this.currentDriver).subscribe({
      next: (shifts) => {
        this.pastShifts = shifts;
      },
      error: (err) => {
        console.error('Error fetching shifts:', err);
      }
    });
  }

  getOngoingShifts() {
    this.shiftService.getOngoingShifts(this.currentDriver).subscribe({
      next: (shifts) => {
        this.ongoingShifts = shifts;
      },
      error: (err) => {
        console.error('Error fetching shifts:', err);
      }
    });
  }
}
