import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Driver } from './driver';
import { Person } from './person';

@Injectable({ providedIn: 'root' })
export class DriverService {

  private baseUrl = 'http://10.101.151.25:3076/driver';

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(private http: HttpClient) {}

  getDrivers(): Observable<Driver[]> {
    return this.http.get<Driver[]>(`${this.baseUrl}s`)
      .pipe(
        tap(_ => console.log('Fetched drivers')),
        catchError(this.handleError<Driver[]>('getDrivers', []))
      );
  }

  getNumberDrivers() : Observable<number>{
    let taxis = this.getDrivers();
    return taxis.pipe(map(drivers => drivers.length));
  }

  getDriver(nif: number | undefined): Observable<Driver> {
    const url = `${this.baseUrl}/${nif}`;
    return this.http.get<Driver>(url).pipe(
      tap(_ => console.log(`Fetched driver with NIF=${nif}`)),
      catchError(this.handleError<Driver>(`getDriver NIF=${nif}`))
    );
  }

  getPerson(id: string): Observable<Person> {
    const url = `http://10.101.151.25:3076/person/${id}`;
    return this.http.get<Person>(url).pipe(
      tap(_ => console.log(`Fetched person with ID=${id}`)),
      catchError(this.handleError<Person>(`getPerson ID=${id}`))
    );
  }

  addDriver(driver: Driver): Observable<Driver> {
    return this.http.post<Driver>(this.baseUrl, driver, this.httpOptions).pipe(
      tap((newDriver: Driver) =>
        console.log(`Added driver with NIF=${newDriver.person?.nif}`)),
      catchError(this.handleError<Driver>('addDriver'))
    );
  }

  verifyDriver(nif: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/verify?nif=${nif}`).pipe(
      catchError(this.handleError<boolean>('verifyDriver', false))
    );
  }

  deleteDriver(nif: number | undefined): Observable<Driver> {
    const url = `${this.baseUrl}/${nif}`;
    return this.http.delete<Driver>(url, this.httpOptions).pipe(
      tap(_ => console.log(`Deleted driver NIF=${nif}`)),
      catchError(this.handleError<Driver>('deleteDriver'))
    );
  }

  updateDriver(driver: Driver): Observable<Driver> {
    let nif = driver.person?.nif;
    if (!driver.person?.nif){
      throw new Error ("Driver nif undefined")
    }
    const url = `${this.baseUrl}/${driver.person.nif}`;
    return this.http.put<Driver>(url, driver, this.httpOptions).pipe(
      tap(_ => console.log(`Updated driver NIF=${nif}`)),
      catchError(this.handleError<Driver>('updateDriver'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error); // log to console
      console.log(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
}
