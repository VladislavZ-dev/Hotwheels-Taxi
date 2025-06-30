import { Component, OnInit } from '@angular/core';
import { Driver } from '../driver';
import { DriverService } from '../driver.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as Papa from 'papaparse';
import { switchMap } from 'rxjs';
import { ShiftService } from '../shift.service';

@Component({
  selector: 'app-driver',
  templateUrl: './driver.component.html',
  styleUrls: ['./driver.component.css']
})
export class DriverComponent implements OnInit {
  driverForm!: FormGroup;
  drivers: Driver[] = [];
  currentYear: number = new Date().getFullYear();
  genders = ['Male', 'Female'];
  postalCodeMap: Record<string, string> = {};
  showForm = false;
  isEditing = false;
  errorMessage: string = '';
  showError = false;
  originalDriverNif: number = 0;

  constructor(
    private driverService: DriverService,
    private shiftService: ShiftService,
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadDrivers();
    this.loadPostalCodeData();
  }

  initForm() {
    this.driverForm = this.fb.group({
      person: this.fb.group({
        nif: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
        name: ['', Validators.required],
        gender: ['', Validators.required],
      }),
      birthYear: ['', [
        Validators.required, 
        Validators.min(1900), 
        Validators.max(this.currentYear)
      ]],
      driversLicense: ['', Validators.required],
      address: this.fb.group({
        street: ['', Validators.required],
        doorNumber: ['', [
          Validators.required, 
          Validators.pattern(/^[0-9]+$/)
        ]],
        postCode: ['', [
          Validators.required, 
          Validators.pattern(/^\d{4}-\d{3}$/)
        ]],
        locality: ['', Validators.required]
      })
    });

    this.setupPostalCodeListener();
  }

  private loadPostalCodeData(): void {
    this.http.get('assets/codigos_postais.csv', { responseType: 'text' }).subscribe({
      next: (csvData) => {
        Papa.parse(csvData, {
          header: true,
          delimiter: ',',
          complete: (result) => {
            result.data.forEach((row: any) => {
              if (row.num_cod_postal && row.ext_cod_postal && row.desig_postal) {
                const fullPostalCode = `${row.num_cod_postal.trim()}-${row.ext_cod_postal.trim()}`;
                this.postalCodeMap[fullPostalCode] = row.desig_postal.trim();
              }
            });
            console.log(`Loaded ${Object.keys(this.postalCodeMap).length} postal codes`);
          },
          error: () => {
            console.error('Error parsing CSV:');
            this.showErrorMessage('Failed to load postal code data. Some features may not work properly.');
          }
        });
      },
      error: (error) => {
        console.error('Error loading CSV file:', error);
        this.showErrorMessage('Failed to load postal code data. Some features may not work properly.');
      }
    });
  }

  private setupPostalCodeListener(): void {
    const postCodeControl = this.driverForm.get('address.postCode');
    
    postCodeControl?.valueChanges.subscribe({
      next: (postCode) => {
        if (!postCode || postCode.length < 8) return;
        
        const locality = this.postalCodeMap[postCode];
        if (locality) {
          this.driverForm.get('address.locality')?.setValue(locality, { emitEvent: false });
        } else {
          console.warn(`No locality found for postal code: ${postCode}`);
          this.driverForm.get('address.locality')?.setValue('', { emitEvent: false });
        }
      },
      error: (err) => {
        console.error('Error in postal code listener:', err);
      }
    });
  }

  formatPostalCode(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 4) {
      value = value.substring(0, 4) + '-' + value.substring(4, 7);
    }
    
    input.value = value;
    this.driverForm.get('address.postCode')?.setValue(value, { emitEvent: true });
  }
  
  loadDrivers(): void {
    this.driverService.getDrivers()
      .subscribe({
        next: (drivers) => {
          this.drivers = drivers.reverse();
          this.hideErrorMessage();
        },
        error: (err) => {
          console.error('Error loading drivers', err);
          this.showErrorMessage('Failed to load drivers. Please try again later.');
        }
      });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.isEditing = false;
      this.initForm();
      this.hideErrorMessage();
    }
  }

  onSubmit(): void {
    if (this.driverForm.invalid) {
      console.error('Form is invalid', this.driverForm.errors);
      return;
    }
  
    const driverData = this.driverForm.value;
    const driver: Driver = {
      birthYear: driverData.birthYear,
      driversLicense: driverData.driversLicense,
      person: {
        nif: driverData.person.nif,
        name: driverData.person.name,
        gender: driverData.person.gender,
      },
      address: driverData.address
    };
  
    if (this.isEditing) {
      this.driverService.updateDriver(driver)
        .subscribe({
          next: (updatedDriver) => {
            const index = this.drivers.findIndex(d => d.person?.nif === this.originalDriverNif);
            if (index !== -1) {
              this.drivers[index] = updatedDriver;
            }
            this.resetForm();
          },
          error: (err) => {
            console.error('Error updating driver', err);
            this.showErrorMessage('Error updating driver. Please try again.');
          }
        });
    } else {
      this.driverService.addDriver(driver)
        .subscribe({
          next: (newDriver) => {
            this.drivers.unshift(newDriver);
            this.resetForm();
          },
          error: (err) => {
            console.error('Error adding driver', err);
            if (err.status === 409) {
              this.showErrorMessage('A driver with this NIF already exists.');
            } else {
              this.showErrorMessage('Error adding driver. Please try again.');
            }
          }
        });
    }
  }
  
  editDriver(driver: Driver): void {
    if (!driver.person?.nif) return;
    
    this.isEditing = true;
    this.showForm = true;
    this.originalDriverNif = driver.person.nif;
    this.hideErrorMessage();
    
    this.driverForm.patchValue({
      person: {
        nif: driver.person.nif,
        name: driver.person.name,
        gender: driver.person.gender
      },
      birthYear: driver.birthYear,
      driversLicense: driver.driversLicense,
      address: {
        street: driver.address?.street,
        doorNumber: driver.address?.doorNumber,
        postCode: driver.address?.postCode,
        locality: driver.address?.locality
      }
    });

    if (driver.address?.postCode) {
      this.driverForm.get('address.postCode')?.updateValueAndValidity();
    }
  }

  deleteDriver(driver: Driver): void {
    if (!driver.person?.nif) return;
  
    if (confirm(`Are you sure you want to delete driver ${driver.person.name} (NIF: ${driver.person.nif})?`)) {

      this.shiftService.getOngoingShifts(Number(driver.person.nif)).pipe(

        switchMap(ongoingShifts => {
          if (ongoingShifts.length > 0) {
            throw { status: 403, message: 'Cannot delete driver with ongoing shifts' };
          }
          return this.shiftService.getPastShifts(Number(driver.person?.nif));
        }),

        switchMap(pastShifts => {
          if (pastShifts.length > 0) {
            throw { status: 403, message: 'Cannot delete driver with shift history' };
          }
          return this.driverService.deleteDriver(driver.person?.nif);
        })
      ).subscribe({
        next: () => {
          this.drivers = this.drivers.filter(d => d.person?.nif !== driver.person?.nif);
          this.hideErrorMessage();
        },
        error: (err) => {
          console.error('Error deleting driver', err);
          if (err.status === 403) {
            this.showErrorMessage(err.message || 'Cannot delete driver with assigned shifts');
          } else {
            this.showErrorMessage('Error deleting driver. Please try again.');
          }
        }
      });
    }
  }

  resetForm(): void {
    this.driverForm.reset();
    this.isEditing = false;
    this.showForm = false;
    this.originalDriverNif = 0;
    this.hideErrorMessage();
  }

  showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.showError = true;
  }

  hideErrorMessage(): void {
    this.errorMessage = '';
    this.showError = false;
  }
}