import { Injectable  } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Taxi } from './taxi';
import { Request } from './request';
import { Driver } from './driver';
import { Address } from './address';
import { Person } from './person';

@Injectable({ providedIn: 'root' })
export class TaxiService {
private baseUrl = 'http://10.101.151.25:3076';
private taxiUrl = `${this.baseUrl}/taxi`;
private requestUrl = `${this.baseUrl}/requests`;
private handleApiError(error: HttpErrorResponse, operation = 'operation') {
  console.error(`${operation} failed:`, error);
  return throwError(() => error);}

httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

constructor(private http: HttpClient) { }

getNumberTaxis() : Observable<number>{
  let taxis = this.getTaxis();
  return taxis.pipe(map(taxis => taxis.length));
}

getTaxis(): Observable<Taxi[]> {
  const url = `${this.taxiUrl}s`;
  return this.http.get<Taxi[]>(url)
    .pipe(
      tap(_=> console.log('Fetched taxis')),
      catchError(this.handleError<Taxi[]>('getTaxis', []))
    );
}

getAvailableTaxis(beginningHour: string, endingHour: string): Observable<Taxi[]> {
  const url = `${this.baseUrl}/shift/available-taxis?beginningHour=${beginningHour}&endingHour=${endingHour}`;
  return this.http.get<Taxi[]>(url).pipe(
    tap(() => console.log('Fetched available taxis')),
    catchError(this.handleError<Taxi[]>('getAvailableTaxis', []))
  );
}


getTaxiNo404<Data>(licensePlate: string): Observable<Taxi> {
  const url = `${this.taxiUrl}/?id=${licensePlate}`;
  return this.http.get<Taxi[]>(url)
    .pipe(
      map(taxies => taxies[0]),
      tap(h => {
        const outcome = h ? 'fetched' : 'did not find';
        console.log(`${outcome} taxi license plate =${licensePlate}`);
      }),
      catchError(this.handleError<Taxi>(`getTaxi license plate=${licensePlate}`))
    );
}

getTaxi(licensePlate: string ): Observable<Taxi> {
  const url = `${this.taxiUrl}/${licensePlate}`;
  return this.http.get<Taxi>(url)
  .pipe(
    tap(_ => console.log(`fetched taxi license plate=${licensePlate}`)),
    catchError(this.handleError<Taxi>(`getTaxi license plate=${licensePlate}`))
  );
}

searchTaxi(term: string): Observable<Taxi[]> {
  if (!term.trim()) {
    return of([]);
  }
  return this.http.get<Taxi[]>(`${this.taxiUrl}/?name=${term}`).pipe(
    tap(x => x.length ?
       console.log(`found taxies matching "${term}"`) :
       console.log(`no taxies matching "${term}"`)),
    catchError(this.handleError<Taxi[]>('searchTaxi', []))
  );
}

addTaxi(taxi: Taxi): Observable<Taxi> {
  return this.http.post<Taxi>(this.taxiUrl, taxi, this.httpOptions).pipe(
    tap((newTaxi: Taxi) => console.log(`added taxi w/ licensePlate=${newTaxi.licensePlate}`)),
    catchError((error: HttpErrorResponse) => this.handleApiError(error, 'addTaxi'))
  );
}

deleteTaxi(licensePlate: string): Observable<Taxi> {
  const url = `${this.taxiUrl}/${licensePlate}`;
  return this.http.delete<Taxi>(url, this.httpOptions).pipe(
    tap(_ => console.log(`deleted taxi license plate=${licensePlate}`)),
    catchError((error: HttpErrorResponse) => this.handleApiError(error, 'deleteTaxi'))
  );
}

updateTaxi(taxi: Taxi): Observable<any> {
  const url = `${this.taxiUrl}/${taxi.licensePlate}`;
  return this.http.put(url, taxi, this.httpOptions).pipe(
    tap(_ => console.log(`updated taxi license plate=${taxi.licensePlate}`)),
    catchError((error: HttpErrorResponse) => this.handleApiError(error, 'updateTaxi'))
  );
}

hasTaxiMadeTrips(licensePlate: string): Observable<boolean> {
  const url = `${this.taxiUrl}/${licensePlate}/has-made-trips`;
  return this.http.get<{hasMadeTrips: boolean}>(url).pipe(
    map(response => response.hasMadeTrips),
    tap(hasMadeTrips => console.log(`Taxi ${licensePlate} has made trips: ${hasMadeTrips}`)),
    catchError((error) => {
      console.error('Error checking if taxi has made trips', error);
      return of(false);
    })
  );
}

private handleError<T>(operation = 'operation', result?: T) {
  return (error: any): Observable<T> => {
    console.error(`${operation} failed: ${error.message}`);
    return new Observable(observer => {
      observer.next(result as T);
      observer.complete();
    });
  };
}
}