import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaxiService } from '../taxi.service';
import { Taxi } from '../taxi';

@Component({
  selector: 'app-taxi-detail',
  templateUrl: './taxi-detail.component.html',
})
export class TaxiDetailComponent implements OnInit {
  taxiForm!: FormGroup;
  brand: string[] = ['Toyota', 'Mercedes', 'Renault', 'BMW'];
  model: string[] = ['Prius', 'Classe E', 'Clio', 'Série 3'];
  currentYear = new Date().getFullYear();
  taxis: Taxi[] = [];

  constructor(
    private fb: FormBuilder,
    private taxiService: TaxiService
  ) {}

  ngOnInit() {
    this.taxiForm = this.fb.group({
      licensePlate: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d-]+$/)]],
      brand: ['', Validators.required],
      model: ['', Validators.required],
      confortLevel: ['', [Validators.required, Validators.pattern(/^RIA\s?16$/i)]],
      acquisitionYear: ['', [Validators.required, Validators.max(this.currentYear)]]
    });

    this.loadTaxis();
  }

  onSubmit() {
    if (this.taxiForm.valid) {
      const newTaxi: Taxi = this.taxiForm.value;
      this.taxiService.addTaxi(newTaxi).subscribe(taxi => {
        this.taxis.unshift(taxi);
        this.taxiForm.reset();
      });
    }
  }

  loadTaxis() {
    this.taxiService.getTaxis().subscribe(taxis => {
      this.taxis = taxis.sort((a: any, b: any) =>
        (b as any).createdAt?.localeCompare((a as any).createdAt) || 0
      );
    });
  }
}
