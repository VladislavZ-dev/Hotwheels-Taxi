import { Component, OnInit } from '@angular/core';
import { Taxi } from '../taxi';
import { TaxiService } from '../taxi.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import carData from '../../assets/car_brands_models.json';

@Component({
  selector: 'app-taxis',
  templateUrl: './taxi.component.html',
  styleUrls: ['./taxi.component.css']
})
export class TaxiComponent implements OnInit {
  taxis: Taxi[] = [];
  taxiForm!: FormGroup;
  showForm = false;
  isEditing = false;
  errorMessage: string = '';
  showError = false;

  brands: string[] = Object.keys(carData);
  models: string[] = [];

  confortLevels = ['luxury', 'basic'];

  currentYear: number = new Date().getFullYear();

  constructor(
    private taxiService: TaxiService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.loadTaxis();
    this.initForm();

    this.taxiForm.get('brand')?.valueChanges.subscribe(brand => {
      this.models = carData[brand as keyof typeof carData] || []; 
      this.taxiForm.get('model')?.reset();
    });
  }

  loadTaxis(): void {
    this.taxiService.getTaxis()
      .subscribe({
        next: (taxis) => {
          this.taxis = taxis.reverse();
        },
        error: (err) => {
          console.error('Error loading taxis', err);
          this.showErrorMessage('Failed to load taxis. Please try again later.');
        }
      });
  }

  initForm() {
    this.taxiForm = this.fb.group({
      licensePlate: ['', [
        Validators.required,
        Validators.pattern(/^([A-Z]{2}-\d{2}-[A-Z]{2}|\d{2}-[A-Z]{2}-[A-Z]{2}|[A-Z]{2}-[A-Z]{2}-\d{2}|[A-Z]{2}-\d{2}-\d{2}|\d{2}-[A-Z]{2}-\d{2}|\d{2}-\d{2}-[A-Z]{2})$/)
      ]],
      brand: ['', Validators.required],
      model: ['', Validators.required],
      confortLevel: ['', Validators.required],
      acquisitionYear: ['', [
        Validators.required,
        Validators.min(1900),
        Validators.max(this.currentYear)  
      ]]
    });
  }

  formatLicensePlate(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (value.length > 2) value = value.substring(0, 2) + '-' + value.substring(2);
    if (value.length > 5) value = value.substring(0, 5) + '-' + value.substring(5);
    if (value.length > 8) value = value.substring(0, 8);
    
    input.value = value;
    this.taxiForm.get('licensePlate')?.setValue(value);
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
    if (this.taxiForm.valid) {
      const taxiData: Taxi = this.taxiForm.value;
      this.hideErrorMessage();
      
      if (this.isEditing) {
        if (taxiData.confortLevel !== this.originalComfortLevel) {
          console.log('Comfort level changed from', this.originalComfortLevel, 'to', taxiData.confortLevel);
          this.taxiService.hasTaxiMadeTrips(taxiData.licensePlate)
            .subscribe({
              next: (hasMadeTrips) => {
                if (hasMadeTrips) {
                  this.showErrorMessage('Cannot update comfort level because this taxi has already made trips with clients.');
                } else {
                  this.processUpdate(taxiData);
                }
              },
              error: () => {
                console.error('Error checking if taxi made trips');
                this.processUpdate(taxiData);
              }
            });
        } else {
          this.processUpdate(taxiData);
        }
      } else {
        this.taxiService.addTaxi(taxiData)
          .subscribe({
            next: (newTaxi) => {
              this.taxis.unshift(newTaxi);
              this.resetForm();
            },
            error: (err) => {
              console.error('Error adding taxi', err);
              this.showErrorMessage('Error adding taxi. Please try again.');
            }
          });
      }
    }
  }
    private processUpdate(taxiData: Taxi): void {
    this.taxiService.updateTaxi(taxiData)
      .subscribe({
        next: (response) => {
          // Update the taxi in the list
          const index = this.taxis.findIndex(t => t.licensePlate === taxiData.licensePlate);
          if (index !== -1) {
            this.taxis[index] = { ...response };
          }
          this.resetForm();
        },
        error: (err) => {
          console.error('Error updating taxi', err);
          if (err.status === 403) {
            this.showErrorMessage('Cannot update comfort level because this taxi has already made trips with clients.');
          } else {
            this.showErrorMessage('Error updating taxi. Please try again.');
          }
        }
      });
  }

  resetForm(): void {
    this.taxiForm.reset();
    this.isEditing = false;
    this.showForm = false;
    this.hideErrorMessage();
  }

  editTaxi(taxi: Taxi): void {
    this.isEditing = true;
    this.showForm = true;
    this.hideErrorMessage();
    this.originalComfortLevel = taxi.confortLevel;
    
    this.taxiForm.patchValue({
      licensePlate: taxi.licensePlate,
      brand: taxi.brand,
      model: taxi.model,
      confortLevel: taxi.confortLevel,
      acquisitionYear: taxi.acquisitionYear
    });

    if (taxi.brand) {
      this.models = carData[taxi.brand as keyof typeof carData] || [];
    }
  }

  private originalComfortLevel: string = '';

  deleteTaxi(taxi: Taxi): void {
    if (confirm(`Are you sure you want to delete taxi ${taxi.licensePlate}?`)) {
      if (!taxi.licensePlate) return;
      
      this.taxiService.deleteTaxi(taxi.licensePlate)
        .subscribe({
          next: () => {
            this.taxis = this.taxis.filter(t => t.licensePlate !== taxi.licensePlate);
            this.hideErrorMessage();
          },
          error: (err) => {
            console.error('Error deleting taxi', err);
            if (err.status === 403) {
              this.showErrorMessage('Cannot delete this taxi because it has already been assigned to driver shifts.');
            } else {
              this.showErrorMessage('Error deleting taxi. Please try again.');
            }
          }
        });
    }
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