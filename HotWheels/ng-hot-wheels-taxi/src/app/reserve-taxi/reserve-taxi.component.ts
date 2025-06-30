import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Taxi } from '../taxi';
import { TaxiService } from '../taxi.service';
import { ShiftService } from '../shift.service';
import { Shift } from '../shift';
import { Period } from '../period';
import { AuthService } from '../auth.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-reserve-taxi',
  templateUrl: './reserve-taxi.component.html',
  styleUrls: ['./reserve-taxi.component.css']
})
export class ReserveTaxiComponent {
  periodForm: FormGroup;
  availableTaxis: Taxi[] = [];
  isTaxiList = false;
  shiftAdded = false;
  formData: { beginningHour: Date; endingHour: Date } | null = null;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private taxiService: TaxiService,
    private shiftService: ShiftService,
    private authService: AuthService
  ) {
    this.periodForm = this.fb.group({
      beginningHour: [null, [Validators.required, this.futureDateValidator()]],
      endingHour: [null, Validators.required]
    }, { validators: this.timeRangeValidator });
  }

  private futureDateValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = new Date(control.value);
      return value < new Date() ? { pastDate: true } : null;
    };
  }

  private timeRangeValidator(group: AbstractControl): ValidationErrors | null {
    const begin = group.get('beginningHour')?.value;
    const end = group.get('endingHour')?.value;
    
    if (!begin || !end) return null;
    
    const beginDate = new Date(begin);
    const endDate = new Date(end);
    const durationHours = (endDate.getTime() - beginDate.getTime()) / (1000 * 60 * 60);
    
    if (beginDate >= endDate) return { timeOrder: true };
    if (durationHours > 8) return { maxDuration: true };
    
    return null;
  }

  async onSubmitPeriod() {
    if (this.periodForm.invalid) {
        this.errorMessage = 'Please fill all required fields correctly';
        return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
        const beginning = new Date(this.periodForm.value.beginningHour);
        const ending = new Date(this.periodForm.value.endingHour);
        
        if (beginning >= ending) {
            this.errorMessage = 'End time must be after start time';
            this.isLoading = false;
            return;
        }

        const driver = this.authService.currentDriver;
        if (!driver) {
            this.errorMessage = 'Driver information not available';
            this.isLoading = false;
            return;
        }

        try {
            const response = await lastValueFrom(
                this.shiftService.checkDriverAvailability(
                    driver.driversLicense,
                    beginning.toISOString(),
                    ending.toISOString()
                )
            );
            
            if (response.hasOverlap) {
                this.errorMessage = 'Shift overlaps with existing shifts:\n';
                if (response.overlaps && response.overlaps.length > 0) {
                    response.overlaps.forEach((overlap, index) => {
                        let beginStr = 'unknown', endStr = 'unknown';
                        
                        if (overlap.period && overlap.period.beginning && overlap.period.ending) {
                            beginStr = new Date(overlap.period.beginning).toLocaleString();
                            endStr = new Date(overlap.period.ending).toLocaleString();
                        } else if (overlap.beginning && overlap.ending) {
                            beginStr = new Date(overlap.beginning).toLocaleString();
                            endStr = new Date(overlap.ending).toLocaleString();
                        }
                        
                        this.errorMessage += `• Shift ${index + 1}: ${beginStr} - ${endStr}\n`;
                    });
                } else {
                    this.errorMessage += '• Overlapping shift (details not available)\n';
                }
                this.isLoading = false;
                return;
            }
        } catch (error) {
            this.errorMessage = 'Error checking shift availability';
            this.isLoading = false;
            return;
        }

        this.formData = {
            beginningHour: beginning,
            endingHour: ending
        };
        this.isTaxiList = true;
        this.getAvailableTaxis();

    } catch (error) {
        this.errorMessage = 'An unexpected error occurred. Please try again.';
    } finally {
        this.isLoading = false;
    }
  }

  getAvailableTaxis() {
    if (!this.formData) return;

    const beginningHour = this.formData.beginningHour.toISOString();
    const endingHour = this.formData.endingHour.toISOString();

    this.taxiService.getAvailableTaxis(beginningHour, endingHour).subscribe({
      next: (taxis) => {
        this.availableTaxis = taxis;
      },
      error: (error) => {
        console.error('Error fetching available taxis:', error);
      }
    });
  }

  selectTaxi(taxi: Taxi) {
    const driver = this.authService.currentDriver;
    if (!driver || !this.formData) {
      console.error('Missing required data to create shift');
      return;
    }

    const period: Period = {
      beginning: this.formData.beginningHour,
      ending: this.formData.endingHour
    };

    const shift: Shift = {
      period: period,
      driver: driver,
      taxi: taxi
    };

    this.shiftService.registerShift(shift).subscribe({
      next: () => {
        this.shiftAdded = true;
        this.availableTaxis = [];
      },
      error: (err) => {
        console.error('Error adding shift', err);
        if (err.status === 409) { 
          this.errorMessage = 'Shift overlaps with existing shifts. Please choose a different time.';
          this.isTaxiList = false;
        }
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.periodForm.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  getValidationMessage(field: string): string {
    const control = this.periodForm.get(field);
    
    if (!control || !control.errors) return '';
    
    if (control.errors['required']) {
      return 'This field is required';
    }
    if (control.errors['pastDate']) {
      return 'Start time cannot be in the past';
    }
    
    return '';
  }

  get formErrors(): string[] {
    const errors: string[] = [];
    const formErrors = this.periodForm.errors;

    if (!formErrors) return errors;

    if (formErrors['timeOrder']) {
      errors.push('Start time must be before end time');
    }
    if (formErrors['maxDuration']) {
      errors.push('Duration cannot exceed 8 hours');
    }
    if (this.errorMessage) {
      errors.push(this.errorMessage);
    }

    return errors;
  }
}