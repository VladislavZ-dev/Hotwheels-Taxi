import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Person } from '../person';
import { DriverService } from '../driver.service';

@Component({
  selector: 'app-driver-dashboard',
  templateUrl: './driver-dashboard.component.html',
  styleUrls: ['./driver-dashboard.component.css']
})
export class DriverDashboardComponent {
  constructor(private driverService: DriverService ,public authService: AuthService) {}
  currentPerson: Person | undefined;
}
