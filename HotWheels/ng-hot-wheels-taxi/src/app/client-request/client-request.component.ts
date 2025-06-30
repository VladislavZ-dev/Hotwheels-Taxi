import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { RequestService, Coordinates } from '../request.service';
import { Person } from '../person';
import { Address } from '../address';

interface ReverseGeocodeResult {
  road?: string;
  house_number?: string;
  postcode?: string;
  city?: string;
  town?: string;
  village?: string;
}

@Component({
  selector: 'app-client-request',
  templateUrl: './client-request.component.html',
  styleUrls: ['./client-request.component.css']
})
export class ClientRequestComponent implements OnInit, OnDestroy, AfterViewInit {
  requestForm = this.fb.group({
    name: ['', Validators.required],
    nif: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
    gender: ['', Validators.required],
    street: ['', Validators.required],
    doorNumber: ['', Validators.required],
    postCode: ['', Validators.required],
    locality: ['', Validators.required],
    destStreet: ['', Validators.required],
    destDoorNumber: ['', Validators.required],
    destPostCode: ['', Validators.required],
    destLocality: ['', Validators.required],
    passengers: [1, [Validators.required, Validators.min(1)]],
    comfort: ['basic', Validators.required],
    useCurrentLocation: [false],
  });

  requestSubmitted = false;
  requestSuccess = false;
  errorMessage = "";

  @ViewChild('mapContainer') mapContainer!: ElementRef;
  showMap = false;
  private map: any;
  public marker: any;
  currentLocationLoading = false;
  postalCodeMap: Record<string, string> = {};

  constructor(private fb: FormBuilder, private requestService: RequestService) {}

  ngOnInit(): void {
    this.loadPostalCodeData();
    this.setupPostalCodeListener();
    this.setupLocationListener();
  }

  ngOnDestroy() {
    this.cleanupMap();
  }

  goToDashboard() {
    window.location.href = '/client/client-dashboard';
  }

  retryRequest() {
    this.requestSubmitted = false;
    this.errorMessage = '';
  }

  ngAfterViewInit() {
    if (this.showMap) {
      this.initMap();
    }
  }

  private cleanupMap() {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }

  async initMap(): Promise<void> {
    this.cleanupMap();
    
    try {
      const L = await import('leaflet');
      this.map = L.map(this.mapContainer.nativeElement).setView([38.7223, -9.1393], 13);
  
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);
  
      const onMapClick = async (e: any) => {
        if (this.marker) {
          this.map.removeLayer(this.marker);
        }
        
        this.marker = L.marker(e.latlng, {
          draggable: true
        }).addTo(this.map);
      
        await this.updateAddressFromCoords(e.latlng.lat, e.latlng.lng, 'destination');
      
      };
  
      this.map.on('click', onMapClick);
      setTimeout(() => this.map.invalidateSize(), 100);
    } catch (error) {
      console.error('Map initialization error:', error);
    }
  }

  toggleMapSelection(): void {
    this.showMap = !this.showMap;
    
    if (this.showMap) {
      setTimeout(() => {
        this.initMap();
        this.clearDestinationFields();
      }, 0);
    } else {
      this.cleanupMap();
    }
  }
  
  private clearDestinationFields(): void {
    this.requestForm.patchValue({
      destStreet: '',
      destDoorNumber: '',
      destPostCode: '',
      destLocality: ''
    });
  }

  async updateAddressFromCoords(lat: number, lng: number, type: 'pickup' | 'destination'): Promise<void> {
    try {
      const address = await this.reverseGeocode(lat, lng);
      console.log('Reverse geocode result:', address);
      
      console.log('Form before patch:', this.requestForm.value);
  
      if (type === 'destination') {
        this.requestForm.get('destStreet')?.setValue(address.road || 'Unknown', { emitEvent: false });
        this.requestForm.get('destDoorNumber')?.setValue(address.house_number || '1', { emitEvent: false });
        this.requestForm.get('destPostCode')?.setValue(address.postcode || '', { emitEvent: false });
        this.requestForm.get('destLocality')?.setValue(
          address.city || address.town || address.village || 'Unknown',
          { emitEvent: false }
        );
      } else {
        this.requestForm.get('street')?.setValue(address.road || 'Unknown', { emitEvent: false });
        this.requestForm.get('doorNumber')?.setValue(address.house_number || '1', { emitEvent: false });
        this.requestForm.get('postCode')?.setValue(address.postcode || '', { emitEvent: false });
        this.requestForm.get('locality')?.setValue(
          address.city || address.town || address.village || 'Unknown',
          { emitEvent: false }
        );
      }

      console.log('Form after patch:', this.requestForm.value);
      this.requestForm.updateValueAndValidity();
    } catch (error) {
      console.error('Address update failed:', error);
      throw error;
    }
  }

  async confirmMapSelection(): Promise<Coordinates | undefined> {
    if (!this.marker) return undefined;
    
    const latLng = this.marker.getLatLng();
    const coords = { lat: latLng.lat, lng: latLng.lng };
    
    try {
      await this.updateAddressFromCoords(coords.lat, coords.lng, 'destination');
      this.showMap = false;
      return coords;
    } catch (error) {
      console.error('Geocoding failed:', error);
      return undefined;
    }
  }

  private loadPostalCodeData(): void {
  }

  private setupPostalCodeListener(): void {
    const postCodeControl = this.requestForm.get('postCode');
    postCodeControl?.valueChanges.subscribe({
      next: (postCode) => {
        if (!postCode || postCode.length < 8) return;
        const locality = this.postalCodeMap[postCode];
        if (locality) {
          this.requestForm.get('locality')?.setValue(locality, { emitEvent: false });
        }
      }
    });
  }

  private setupLocationListener(): void {
    this.requestForm.get('useCurrentLocation')?.valueChanges.subscribe({
      next: (useCurrentLocation) => {
        if (useCurrentLocation) {
          this.getCurrentLocation();
        } else {
          this.requestForm.patchValue({
            street: '',
            doorNumber: '',
            postCode: '',
            locality: ''
          });
        }
      }
    });
  }

  async getCurrentLocation(): Promise<void> {
    this.currentLocationLoading = true;
  
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      this.currentLocationLoading = false;
      return;
    }
  
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            console.error('Geolocation error:', error);
            alert(`Error getting location: ${error.message}`);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });

      console.log('Got position:', position.coords);
      
      await this.updateAddressFromCoords(
        position.coords.latitude,
        position.coords.longitude,
        'pickup'
      );
      
      this.requestForm.get('useCurrentLocation')?.setValue(true, { emitEvent: false });
    } catch (error) {
      console.error("Geolocation error:", error);
      this.requestForm.get('useCurrentLocation')?.setValue(false, { emitEvent: false });
    } finally {
      this.currentLocationLoading = false;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      console.log('Fetching reverse geocode:', url);
      const response = await fetch(url);
      const data = await response.json();
      console.log('Reverse geocode response:', data);
      return data.address || {};
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return {};
    }
  }

  async onSubmit(): Promise<void> {
    if (this.requestForm.invalid) {
      console.error('Form is invalid');
      Object.values(this.requestForm.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }

    const formData = this.requestForm.value;
    
    const customer = new Person(
      Number(formData.nif!),
      formData.gender!,
      formData.name!
    );

    const pickupAddress = new Address(
      formData.street!,
      Number(formData.doorNumber!),
      formData.postCode!,
      formData.locality!
    );

    const destinationAddress = new Address(
      formData.destStreet!,
      Number(formData.destDoorNumber!),
      formData.destPostCode!,
      formData.destLocality!
    );

    try {
      let pickupCoords: Coordinates | undefined;
      let destinationCoords: Coordinates | undefined;

      if (this.showMap) {
        destinationCoords = await this.confirmMapSelection();
        if (!destinationCoords) {
          alert('Please confirm the map selection first');
          return;
        }
      } else {
        destinationCoords = await this.geocodeAddress(destinationAddress);
      }

      if (this.requestForm.value.useCurrentLocation) {
        pickupCoords = await this.getCurrentCoordinates();
      } else {
        pickupCoords = await this.geocodeAddress(pickupAddress);
      }

      this.requestService.createRequest(
        customer,
        pickupAddress,
        destinationAddress,
        Number(formData.passengers!),
        formData.comfort!,
        pickupCoords,
        destinationCoords
      ).subscribe({
        next: (request) => {
          this.requestSubmitted = true;
          this.requestSuccess = true;
        },
        error: (err) => {
          this.requestSubmitted = true;
          this.requestSuccess = false;
          this.errorMessage = err.message || 'Failed to create request';
        }
      });
    } catch (error) {
      console.error('Error getting coordinates:', error);
      this.requestService.createRequest(
        customer,
        pickupAddress,
        destinationAddress,
        Number(formData.passengers!),
        formData.comfort!
      ).subscribe({
        next: (request) => {
          this.requestSubmitted = true;
          this.requestSuccess = true;
        },
        error: (err) => {
          this.requestSubmitted = true;
          this.requestSuccess = false;
          this.errorMessage = err.message || 'Failed to create request';
        }
      });
    }
  }

  private async getCurrentCoordinates(): Promise<Coordinates | undefined> {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            console.error('Error getting current coordinates:', error);
            resolve(undefined);
          }
        );
      } else {
        resolve(undefined);
      }
    });
  }
  
  private async geocodeAddress(address: Address): Promise<Coordinates | undefined> {
    try {
      const query = `${address.street} ${address.doorNumber}, ${address.postCode} ${address.locality}`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
      console.log('Geocoding address:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      console.log('Geocode response:', data);
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return undefined;
    } catch (error) {
      console.error('Geocoding error:', error);
      return undefined;
    }
  }
}