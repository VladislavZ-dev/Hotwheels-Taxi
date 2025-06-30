import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Shift } from './shift';

@Injectable({ providedIn: 'root' })
export class ShiftService {
  private baseUrl = 'http://10.101.151.25:3076';
  private shiftUrl = `${this.baseUrl}/shift`;
  private shiftsUrl = `${this.baseUrl}/shifts`;

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(private http: HttpClient) { }
 
  getShifts(): Observable<Shift[]> {
    const url = `${this.shiftUrl}s`;
    return this.http.get<Shift[]>(url)
      .pipe(
        tap(_=> console.log('Fetched shifts')),
      );
  }

  registerShift(shift : Shift): Observable<Shift> {
    return this.http.post<Shift>(this.shiftUrl, shift, this.httpOptions).pipe(
        tap((shift: Shift) => console.log(`added shift`)));
  }

  getFutureShifts(driverNif?: number): Observable<Shift[]> {
    let params = new HttpParams();
    if (driverNif) {
      params = params.append('driverNif', driverNif);
    }
    
    const url = `${this.shiftsUrl}/future`;
    return this.http.get<Shift[]>(url, { params })
      .pipe(
        tap(_ => console.log('Fetched future shifts')),
        catchError(this.handleError<Shift[]>('getFutureShifts', []))
      );
  }

  getOngoingShifts(driverNif?: number): Observable<Shift[]> {
    let params = new HttpParams();
    if (driverNif) {
      params = params.append('driverNif', driverNif);
    }
    
    const url = `${this.shiftsUrl}/ongoing`;
    return this.http.get<Shift[]>(url, { params })
      .pipe(
        tap(_ => console.log('Fetched ongoing shifts')),
        catchError(this.handleError<Shift[]>('getOngoingShifts', []))
      );
  }

  getPastShifts(driverNif?: number): Observable<Shift[]> {
    let params = new HttpParams();
    if (driverNif) {
      params = params.append('driverNif', driverNif);
    }
    
    const url = `${this.shiftsUrl}/past`;
    return this.http.get<Shift[]>(url, { params })
      .pipe(
        tap(_ => console.log('Fetched past shifts')),
        catchError(this.handleError<Shift[]>('getPastShifts', []))
      );
  }

  checkDriverAvailability(driverLicense: string, start: string, end: string): Observable<{ success: boolean, 
    hasOverlap: boolean, overlaps?: any[], message?: string}> {
    const params = new HttpParams()
        .set('driversLicense', driverLicense)
        .set('start', start)
        .set('end', end);

    return this.http.get<{success: boolean, hasOverlap: boolean, overlaps?: any[], message?: string}>(
        `${this.shiftsUrl}/check-availability`,
        { params }
    ).pipe(
        catchError(error => {
            return of({success: false, hasOverlap: true, message: 'Error checking availability'});
        })
    );
}

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
}
