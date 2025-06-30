import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Address } from '../address';
import { HttpClient } from '@angular/common/http';
import * as Papa from 'papaparse';

@Component({
  selector: 'app-address',
  templateUrl: './address.component.html'
})
export class AddressComponent implements OnInit {
  @Input() address!: Address;
  @Output() addressChange = new EventEmitter<Address>();

  addressForm!: FormGroup;
  postalCodeMap: Record<string, string> = {};

  constructor(private fb: FormBuilder, private http: HttpClient) {
    console.log('AddressComponent constructor called');
  }

  ngOnInit(): void {
    console.log('AddressComponent ngOnInit started');
    console.log('Initial address input:', this.address);

    this.addressForm = this.fb.group({
      id: [this.address?._id || 0],
      street: [this.address?.street || '', Validators.required],
      doorNumber: [this.address?.doorNumber || '', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      postCode: [
        this.address?.postCode || '',
        [Validators.required, Validators.pattern(/^\d{4}-\d{3}$/)]
      ],
      locality: [this.address?.locality || '', Validators.required],
    });

    console.log('Form initialized:', this.addressForm.value);

    this.loadPostalCodeData();
    this.setupFormListeners();
  }

  private loadPostalCodeData(): void {
    this.http.get('assets/codigos_postais.csv', { responseType: 'text' }).subscribe({
      next: (csvData) => {
        console.log('CSV data loaded successfully');
        Papa.parse(csvData, {
          header: true,
          complete: (result) => {
            console.log('CSV parsing complete, rows found:', result.data.length);
            result.data.forEach((row: any) => {
              if (row.postal_code && row.locality) {
                this.postalCodeMap[row.postal_code.trim()] = row.locality.trim();
              }
            });
            console.log(`Postal code map populated with ${Object.keys(this.postalCodeMap).length} entries`);
          },
          error: () => {
            console.error('Error parsing CSV:');
          }
        });
      },
      error: (error) => {
        console.error('Error loading CSV file:', error);
      }
    });
  }

  private setupFormListeners(): void {
    this.setupPostalCodeListener();
    
    this.addressForm.valueChanges.subscribe(value => {
      console.log('Form value changed:', value);
      this.addressChange.emit(value);
    });
  }

  private setupPostalCodeListener(): void {
    console.log('Setting up postal code listener');
    this.addressForm.get('postCode')?.valueChanges.subscribe(postCode => {
      console.log('Postal code changed:', postCode);
      if (!postCode) return;
      
      const locality = this.postalCodeMap[postCode];
      if (locality) {
        console.log(`Found locality for ${postCode}: ${locality}`);
        this.addressForm.patchValue({ locality }, { emitEvent: false });
      } else {
        console.log(`No locality found for postal code: ${postCode}`);
      }
    });
  }
}