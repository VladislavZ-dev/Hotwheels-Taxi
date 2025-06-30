import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Price } from './price';
import { catchError, firstValueFrom, map, Observable, of, tap } from 'rxjs';
import { Trip } from './trip';
import { Driver } from './driver';
import { Taxi } from './taxi';
import { DriverService } from './driver.service';
import { Person } from './person';
import { DateService } from './date.service';

@Injectable({
  providedIn: 'root'
})
export class TripService {

  private pricesUrl = 'http://10.101.151.25:3076/prices';
  private tripsUrl = 'http://10.101.151.25:3076/trips';
  private serverUrl = 'http://10.101.151.25:3076/';
  private personUrl = 'http://10.101.151.25:3076/person';
  
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };
  currentView: 'summary' | 'byDriver' | 'byTaxi' | 'tripDetails' = 'summary';
  selectedMetric: 'trips' | 'hours' | 'distance' = 'trips';
  
  startDate: string = this.formatDateForInput(new Date());
  endDate: string = this.formatDateForInput(new Date());
  
  totalTrips: number = 0;
  totalHours: number = 0;
  totalDistance: number = 0;
  
  driversBreakdown: {driver: Driver, trips: number, hours: number, distance: number}[] = [];
  taxisBreakdown: {taxi: Taxi, trips: number, hours: number, distance: number}[] = [];
  tripsDetails: Trip[] = [];
  private allTrips: Trip[] = [];
  
  selectedDriver: Driver | null = null;
  selectedTaxi: Taxi | null = null;

  constructor(private http: HttpClient, private driverService: DriverService) { 
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    this.startDate = this.formatDateForInput(startOfDay);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    this.endDate = this.formatDateForInput(endOfDay);
    
    console.log(`Initial date range: ${this.startDate} to ${this.endDate}`);
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  
  private parseInputDate(dateString: string): Date {
    if (!dateString) return new Date();
    return new Date(dateString);
  }

  getStartDate(): Date {
    return this.parseInputDate(this.startDate);
  }
  
  getEndDate(): Date {
    return this.parseInputDate(this.endDate);
  }
  getCurrentView(): 'summary' | 'byDriver' | 'byTaxi' | 'tripDetails' {
    return this.currentView;
  }

  getSelectedMetric(): 'trips' | 'hours' | 'distance' {
    return this.selectedMetric;
  }

  setStartDate(date: string | Date): void {
    if (typeof date === 'string') {
      this.startDate = date;
    } else {
      this.startDate = this.formatDateForInput(date);
    }
  }
  
  setEndDate(date: string | Date): void {
    if (typeof date === 'string') {
      this.endDate = date;
    } else {
      this.endDate = this.formatDateForInput(date);
    }
  }
  getTotalTrips(): number {
    return this.totalTrips;
  }

  getTotalHours(): number {
    return this.totalHours;
  }

  getTotalDistance(): number {
    return this.totalDistance;
  }

  getDriversBreakdown(): {driver: Driver, trips: number, hours: number, distance: number}[] {
    return this.driversBreakdown;
  }

  getTaxisBreakdown(): {taxi: Taxi, trips: number, hours: number, distance: number}[] {
    return this.taxisBreakdown;
  }

  getTripsDetails(): Trip[] {
    return [...this.allTrips];
  }

  getSelectedDriver(): Driver | null {
    return this.selectedDriver;
  }

  getSelectedTaxi(): Taxi | null {
    return this.selectedTaxi;
  }

  async loadSummaryData(): Promise<void> {
    try {
      const allDrivers = await this.driverService.getDrivers().toPromise() || [];
      const startDateObj = this.parseInputDate(this.startDate);
      const endDateObj = this.parseInputDate(this.endDate);
      
      console.log('Loading summary data with date range:');
      console.log(`- Input strings: "${this.startDate}" to "${this.endDate}"`);
      console.log(`- Parsed dates: ${startDateObj.toString()} to ${endDateObj.toString()}`);
      console.log(`- Hours: start=${startDateObj.getHours()}, end=${endDateObj.getHours()}`);

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const offset = -new Date().getTimezoneOffset() / 60;
      const offsetSign = offset >= 0 ? '+' : '';
      console.log(`Current timezone: ${timezone} (UTC${offsetSign}${offset})`);
  
      const trips = await this.getTripsByDateRange(startDateObj, endDateObj);
      console.log(`Retrieved ${trips.length} trips`);
      
      this.tripsDetails = await this.enrichTripsWithDrivers(trips);
      
      this.allTrips = [...this.tripsDetails];
      
      this.calculateSummaryData();
      this.currentView = 'summary';
    } catch (error) {
      console.error('Error loading summary data:', error);
    }
  }

  async getPersonById(personId: string): Promise<Person> {
    return firstValueFrom(this.http.get<Person>(`${this.personUrl}/${personId}`));
  }

  async enrichTripsWithDrivers(trips: Trip[]): Promise<Trip[]> {
    const enrichedTrips = [];
    
    for (const trip of trips) {
      if (trip.driver?.person && typeof trip.driver.person === 'object' && trip.driver.person.name) {
        enrichedTrips.push(trip);
        continue;
      }
      
      try {
        if (trip.driver?.person && typeof trip.driver.person === 'string') {
          const personId = trip.driver.person;
          const personDetails = await this.getPersonById(personId);
          const enrichedTrip = {
            ...trip,
            driver: {
              ...trip.driver,
              person: personDetails
            }
          };
          
          enrichedTrips.push(enrichedTrip);
        } else {
          if (trip.driver?.person && typeof trip.driver.person === 'object' && trip.driver.person._id) {
            const personId = trip.driver.person._id;
            const personDetails = await this.getPersonById(personId);
            
            const enrichedTrip = {
              ...trip,
              driver: {
                ...trip.driver,
                person: personDetails
              }
            };
            
            enrichedTrips.push(enrichedTrip);
          } else {
            enrichedTrips.push(trip);
          }
        }
      } catch (error) {
        console.error(`Error fetching person details for trip ${trip.sequence}:`, error);
        enrichedTrips.push(trip);
      }
    }   
    return enrichedTrips;
  }

  private calculateSummaryData(): void {
    this.totalTrips = this.tripsDetails.length;
    this.totalHours = this.tripsDetails.reduce((sum, trip) => sum + (trip.time || 0), 0);
    this.totalDistance = this.tripsDetails.reduce((sum, trip) => sum + (trip.distance || 0), 0);
    
    const driverMap = new Map<string, {
      driver: Driver, 
      trips: number, 
      hours: number, 
      distance: number
    }>();
    
    this.tripsDetails.forEach(trip => {
      const driver = trip.driver;
      if (!driver) {
        console.warn('Trip missing driver:', trip);
        return;
      }
      
      const driverKey = driver.person?.nif 
        ? `nif_${driver.person.nif}` 
         : JSON.stringify(driver);
      
      if (!driverMap.has(driverKey)) {
        driverMap.set(driverKey, {
          driver: {...driver},
          trips: 0,
          hours: 0,
          distance: 0
        });
      }
      
      const driverData = driverMap.get(driverKey)!;
      driverData.trips++;
      driverData.hours += trip.time || 0;
      driverData.distance += trip.distance || 0;
    });
    
    this.driversBreakdown = Array.from(driverMap.values());
    
    const taxiMap = new Map<string, {
      taxi: Taxi,
      trips: number,
      hours: number,
      distance: number,
      drivers: Map<string, Driver> 
    }>();
    
    this.tripsDetails.forEach(trip => {
      const taxiId = trip.taxi?.licensePlate;
      if (!taxiId) {
        console.warn('Trip missing taxi license plate:', trip);
        return;
      }
      
      if (!taxiMap.has(taxiId)) {
        taxiMap.set(taxiId, {
          taxi: {...trip.taxi},
          trips: 0,
          hours: 0,
          distance: 0,
          drivers: new Map()
        });
      }
      
      const taxiData = taxiMap.get(taxiId)!;
      taxiData.trips++;
      taxiData.hours += trip.time || 0;
      taxiData.distance += trip.distance || 0;
      
      if (trip.driver) {
        const driverKey = trip.driver.person?.nif 
          ? `nif_${trip.driver.person.nif}` 
          : JSON.stringify(trip.driver);
        
        if (!taxiData.drivers.has(driverKey)) {
          taxiData.drivers.set(driverKey, {...trip.driver});
        }
      }
    });
    
    this.taxisBreakdown = Array.from(taxiMap.values()).map(item => ({
      taxi: item.taxi,
      trips: item.trips,
      hours: item.hours,
      distance: item.distance,
      driverCount: item.drivers.size,
      drivers: Array.from(item.drivers.values())
    }));
  }

  updateDateRange(): void {
    this.loadSummaryData();
  }

  getPriceTable(): Observable<Price> {
      return this.http.get<Price>(this.pricesUrl)
        .pipe(
          tap(_ => console.log('fetched price table')),
          catchError(this.handleError<Price>('getPriceTable'))
        );
    }

  calculateEstimatedPrice(distance: number, comfort: string, isNightTime = false): Observable<number> {
    return new Observable<number>(observer => {
      this.getPriceTable().subscribe(rates => {

        const estimatedMinutes = distance * 4;
        
        const baseRate = comfort === 'luxurious' ? rates.luxurious : rates.basic;
        
        const rateMultiplier = isNightTime ? (1 + rates.nightFee / 100) : 1;
        
        const estimatedPrice = estimatedMinutes * baseRate * rateMultiplier;
        
        observer.next(estimatedPrice);
        observer.complete();
      });
    });
  }
  
  getTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.tripsUrl)
      .pipe(
        tap(_ => console.log('fetched trips')),
        catchError(this.handleError<Trip[]>('getTrips', []))
      );
    }

  getTripsByDriver(nif : number) : Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.tripsUrl}/${nif}`)
      .pipe(
        tap(_ => console.log('fetched trips')),
        catchError(this.handleError<Trip[]>('getTrips', []))
      );
  }

  public async getTripsByDateRange(startDate: Date, endDate: Date): Promise<Trip[]> {
    const startUTC = this.formatUTCDateForServer(startDate);
    const endUTC = this.formatUTCDateForServer(endDate);
    
    console.log(`Original local dates: ${startDate.toString()} to ${endDate.toString()}`);
    console.log(`Sending to server (UTC): ${startUTC} to ${endUTC}`);
    
    return this.http.get<Trip[]>(`${this.tripsUrl}/by-date?startDate=${encodeURIComponent(startUTC)}&endDate=${encodeURIComponent(endUTC)}`)
      .pipe(
        map((response: any) => {
          const tripsData = Array.isArray(response) ? response : (response.trips || []);
          console.log(`Received ${tripsData.length} trips from server`);
          return tripsData.map((trip: any) => this.mapTrip(trip));
        }),
        catchError(error => {
          console.error('Error fetching trips:', error);
          return of([]); 
        })
      )
      .toPromise()
      .then(trips => trips || []); 
  }
  
  private formatUTCDateForServer(date: Date): string {
    const year = date.getFullYear();     
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');     
    const hours = String(date.getHours()).padStart(2, '0');   
    const minutes = String(date.getMinutes()).padStart(2, '0'); 
    const seconds = String(date.getSeconds()).padStart(2, '0'); 
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

  private mapTrip(data: any): Trip {
    return new Trip(
      data.sequence,
      data.numPeople,
      data.period,
      data.route,
      data.totalCost,
      data.shift,
      data.driver,
      data.taxi,
      data.distance,
      data.time,
      data.client
    );
  }
 
  registerNewTrip(trip: any): Observable<Trip> {
      return this.http.post<Trip>(this.serverUrl + 'trip', trip, this.httpOptions).pipe(
        tap((newTrip: Trip) => console.log(`added trip w/ sequence number =${newTrip.sequence}`)),
        catchError(this.handleError<Trip>('registerNewTrip'))
      );
    }

  private handleError<T>(operation = 'operation', result?: T) {
      return (error: any): Observable<T> => {
        console.error(error); 
        console.log(`${operation} failed: ${error.message}`);
  
        return of(result as T);
      };
  }

  formatHours(minutes: number): string {
    const hoursInt = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hoursInt}h ${remainingMinutes}m`;
  }

  formatDistance(km: number): string {
    return `${km.toFixed(1)} km`;
  }

  // Add these functions to your TripService class

/**
 * Calculates the total number of trips from all trips in the database
 * @returns Promise<number> - Total number of trips
 */
async calculateTotalTrips(): Promise<number> {
  try {
    const allTrips = await firstValueFrom(this.getTrips());
    return allTrips.length;
  } catch (error) {
    console.error('Error calculating total trips:', error);
    return 0;
  }
}

/**
 * Calculates the total hours from all trips in the database
 * @returns Promise<number> - Total hours in minutes
 */
async calculateTotalHours(): Promise<number> {
  try {
    const allTrips = await firstValueFrom(this.getTrips());
    return allTrips.reduce((total, trip) => total + (trip.time || 0), 0);
  } catch (error) {
    console.error('Error calculating total hours:', error);
    return 0;
  }
}

/**
 * Calculates the total distance from all trips in the database
 * @returns Promise<number> - Total distance in kilometers
 */
async calculateTotalDistance(): Promise<number> {
  try {
    const allTrips = await firstValueFrom(this.getTrips());
    return allTrips.reduce((total, trip) => total + (trip.distance || 0), 0);
  } catch (error) {
    console.error('Error calculating total distance:', error);
    return 0;
  }
}

/**
 * Calculates all totals at once for better performance
 * @returns Promise<{trips: number, hours: number, distance: number}>
 */
async calculateAllTotals(): Promise<{trips: number, hours: number, distance: number}> {
  try {
    const allTrips = await firstValueFrom(this.getTrips());
    
    const totals = allTrips.reduce((acc, trip) => {
      acc.trips += 1;
      acc.hours += trip.time || 0;
      acc.distance += trip.distance || 0;
      return acc;
    }, { trips: 0, hours: 0, distance: 0 });
    
    return totals;
  } catch (error) {
    console.error('Error calculating all totals:', error);
    return { trips: 0, hours: 0, distance: 0 };
  }
}
}