import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DriverService } from '../driver.service';
import { AuthService } from '../auth.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-driver-selection',
  templateUrl: './driver-selection.component.html',
  styleUrls: ['./driver-selection.component.css']
})
export class DriverSelectionComponent {
  driverForm = this.fb.group({
    nif: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]]
  });

  drivers$ = this.driverService.getDrivers();
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private driverService: DriverService,
    private authService: AuthService
  ) {}

  onSubmitNif() {
    if (this.driverForm.valid) {
      const nif = +this.driverForm.value.nif!;
      this.errorMessage = null;
      
      this.driverService.getDriver(nif).pipe(
        catchError(error => {
          console.error('Error fetching driver:', error);
          this.errorMessage = 'Driver not found. Please check your NIF.';
          return of(null);
        })
      ).subscribe(driver => {
        if (driver) {
          this.authService.login(driver);
          this.router.navigate(['/driver/driver-dashboard']);
        } else if (!this.errorMessage) {
          this.errorMessage = 'Driver not found. Please check your NIF.';
        }
      });
    }
  }

  selectDriver(nif: number) {
    this.driverService.getDriver(nif).subscribe(driver => {
      console.log('Selected driver:', driver);
      if (driver) {
        this.authService.login(driver);
        this.router.navigate(['/driver/driver-dashboard']);
      }
    });
  }
}
