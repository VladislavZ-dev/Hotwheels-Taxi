import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap, map, filter, switchMap } from 'rxjs/operators';
import { Person } from './person';
import { Address } from './address';
import { Request } from './request';
import { Driver } from './driver';

export interface Coordinates {
  lat: number;
  lng: number;
}

@Injectable({ providedIn: 'root' }) 
export class RequestService {
  private baseUrl = 'http://10.101.151.25:3076';
  private requestUrl = `${this.baseUrl}/request`;
  private driver_requestUrl = `${this.baseUrl}/driver-request`;
  private readonly STORAGE_KEY_PREFIX = 'driver_rejected_';
  
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  private _isLoggedIn = new BehaviorSubject<boolean>(false);
  private _currentClient = new BehaviorSubject<Person | null>(null);
  private _pendingRequests = new BehaviorSubject<Request[]>([]);
  
  private _allDriverRejections = new BehaviorSubject<Map<number, string[]>>(new Map());

  isLoggedIn$ = this._isLoggedIn.asObservable();
  currentClient$ = this._currentClient.asObservable();
  pendingRequests$ = this._pendingRequests.asObservable();

  constructor(private http: HttpClient) { 
    const savedClient = localStorage.getItem('currentClient');
    if (savedClient) {
      this._currentClient.next(JSON.parse(savedClient));
      this._isLoggedIn.next(true);
    }
    
    this.loadAllRejectedRequestsFromStorage();
  }

  private loadAllRejectedRequestsFromStorage() {
    const rejectionMap = new Map<number, string[]>();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.STORAGE_KEY_PREFIX)) {
        const driverNif = parseInt(key.replace(this.STORAGE_KEY_PREFIX, ''), 10);
        try {
          const rejectedIds = JSON.parse(localStorage.getItem(key) || '[]');
          rejectionMap.set(driverNif, rejectedIds);
          console.log(`Loaded ${rejectedIds.length} rejected requests for driver ${driverNif} from storage`);
        } catch (e) {
          console.error(`Error parsing rejected requests for driver ${driverNif}:`, e);
        }
      }
    }
    
    this._allDriverRejections.next(rejectionMap);
  }

  private saveRejectedRequestsToStorage(driverNif: number, rejectedIds: string[]) {
    const storageKey = `${this.STORAGE_KEY_PREFIX}${driverNif}`;
    localStorage.setItem(storageKey, JSON.stringify(rejectedIds));
    console.log(`Saved ${rejectedIds.length} rejected requests for driver ${driverNif} to storage`);
  }

  get isLoggedIn(): boolean {
    return this._isLoggedIn.value;
  }

  get currentClient(): Person | null {
    return this._currentClient.value;
  }

  public login(client: Person) {
    this._isLoggedIn.next(true);
    this._currentClient.next(client);
    localStorage.setItem('currentClient', JSON.stringify(client));
  }

  public logout() {
    this._isLoggedIn.next(false);
    this._currentClient.next(null);
    localStorage.removeItem('currentClient');
  }

  public createRequest(
    customer: Person,
    pickupAddress: Address,
    destinationAddress: Address,
    passengers: number,
    comfort: string,
    pickupCoords?: Coordinates,
    destinationCoords?: Coordinates
  ): Observable<Request> {
    const newRequest: Omit<Request, '_id'> = {
      customer,
      pickup: {
        address: pickupAddress,
        coordinates: pickupCoords
      },
      destination: {
        address: destinationAddress,
        coordinates: destinationCoords
      },
      passengers,
      comfort,
      status: 'pending',
      timestamps: {
        requested: new Date()
      }
    };
    this.login(customer);
    return this.http.post<Request>(this.requestUrl, newRequest, this.httpOptions).pipe(
      tap((req: Request) => console.log(`Created request ${req._id}`)),
      catchError(this.handleError<Request>('createRequest'))
    );
  }

  public cancelRequest(requestId: string | undefined): Observable<Request> {
    return this.http.delete<Request>(`${this.requestUrl}/${requestId}`, this.httpOptions).pipe(
      tap(_ => console.log(`Canceled request ${requestId}`)),
      catchError(this.handleError<Request>('cancelRequest'))
    );
  }

  public driverAcceptsRequest(
    requestId: string | undefined,
    driver: Driver | null,
    estimatedArrival: number
  ): Observable<Request> {
    const update = {
        driverId: driver,
        estimatedArrival
    };

    return this.http.patch<Request>(
      `${this.requestUrl}/${requestId}/accept`,
      update,
      this.httpOptions
    ).pipe(
      tap(updated => {
        console.log(`Driver ${driver?.person?.name} accepted request`);
        // Remove the accepted request from pending requests
        const currentPending = this._pendingRequests.value;
        this._pendingRequests.next(currentPending.filter(req => req._id !== requestId));
      }),
      catchError(this.handleError<Request>('driverAcceptsRequest'))
    );
  }

  public clientConfirmsRequest(requestId: string): Observable<Request> {
    return this.http.patch<Request>(
      `${this.requestUrl}/${requestId}/confirm`,
      {
        status: 'client_confirmed',
        'timestamps.clientConfirmed': new Date()
      },
      this.httpOptions
    ).pipe(
      tap(_ => console.log(`Client confirmed request ${requestId}`)),
      catchError(this.handleError<Request>('clientConfirmsRequest'))
    );
  }

  public clientRejectsDriver(requestId: string): Observable<Request> {
    return this.getRequest(requestId).pipe(
      switchMap(request => {
        const rejectedDriverId = request.driver?.info?.person?.nif;
        return this.http.patch<Request>(
          `${this.requestUrl}/${requestId}/reject`,
          {
            status: 'pending',
            driver: null,
            'timestamps.driverAccepted': null
          },
          this.httpOptions
        ).pipe(
          tap(updated => {
            console.log(`Client rejected driver for request ${requestId}`);
            if (rejectedDriverId) {
              this.addRejectedRequest(rejectedDriverId, requestId);
            }
            this.getPendingRequests().subscribe();
          })
        );
      }),
      catchError(this.handleError<Request>('clientRejectsDriver'))
    );
  }
  private addRejectedRequest(driverNif: number, requestId: string) {
    const rejectionMap = new Map(this._allDriverRejections.value);
    let driverRejections = rejectionMap.get(driverNif) || [];
    
    if (!driverRejections.includes(requestId)) {
      driverRejections = [...driverRejections, requestId];
      rejectionMap.set(driverNif, driverRejections);     
      this._allDriverRejections.next(new Map(rejectionMap));
      this.saveRejectedRequestsToStorage(driverNif, driverRejections);
      
      console.log(`Added rejection for driver ${driverNif}: request ${requestId}`);
      console.log(`Current rejections for driver ${driverNif}:`, driverRejections);
    }
  }

  public completeRequest(requestId: string): Observable<Request> {
    return this.http.patch<Request>(
      `${this.requestUrl}/${requestId}/complete`,
      {
        status: 'completed',
        'timestamps.completed': new Date()
      },
      this.httpOptions
    ).pipe(
      tap(_ => console.log(`Completed request ${requestId}`)),
      catchError(this.handleError<Request>('completeRequest'))
    );
  }

  public getAllRequestsByNif(nif: number): Observable<Request[]> {
    return this.http.get<Request[]>(`${this.requestUrl}s/${nif}`).pipe(
      tap(requests => console.log(`Fetched all requests for NIF ${nif}`)),
      catchError(this.handleError<Request[]>('getAllRequestsByNif', []))
    );
  }

  public getAllDriverRequestsByNif(nif: number): Observable<Request[]> {
    return this.http.get<Request[]>(`${this.driver_requestUrl}s/${nif}`).pipe(
      tap(requests => console.log(`Fetched all requests for NIF ${nif}`)),
      catchError(this.handleError<Request[]>('getAllRequestsByNif', []))
    );
  }

  getPendingRequests(driverCoords?: Coordinates): Observable<Request[]> {
    let url = `${this.requestUrl}s?status=pending`;
    if (driverCoords) {
      url += `&lat=${driverCoords.lat}&lng=${driverCoords.lng}`;
    }
    return this.http.get<Request[]>(url).pipe(
      tap(requests => {
        console.log(`Fetched ${requests.length} pending requests`);
        this._pendingRequests.next(requests);
      }),
      catchError(this.handleError<Request[]>('getPendingRequests', []))
    );
  }

  public getPendingRequestsByNif(nif: number): Observable<Request[]> {
    return this.http.get<Request[]>(`${this.requestUrl}/pending/${nif}`).pipe(
      tap(requests => console.log(`Fetched ${requests.length} pending requests for NIF ${nif}`)),
      catchError(this.handleError<Request[]>('getPendingRequestsByNif', []))
    );
  }

  public getDriverAcceptedRequestsByNif(nif: number): Observable<Request[]> {
    return this.http.get<Request[]>(`${this.requestUrl}/accepted/${nif}`).pipe(
      tap(requests => console.log(`Fetched ${requests.length} driver accepted requests for NIF ${nif}`)),
      catchError(this.handleError<Request[]>('getDriverAcceptedRequestsByNif', []))
    );
  }

  public getRequest(requestId: string): Observable<Request> {
    return this.http.get<Request>(`${this.requestUrl}/${requestId}`).pipe(
      tap(_ => console.log(`Fetched request ${requestId}`)),
      catchError(this.handleError<Request>('getRequest'))
    );
  }
  public getRejectedRequests(driverNif?: number): Observable<string[]> {
    if (!driverNif) {
      return of([]);
    }
    return this._allDriverRejections.pipe(
      map(rejectionMap => {
        const rejections = rejectionMap.get(driverNif) || [];
        console.log(`Getting rejected requests for driver ${driverNif}:`, rejections);
        return rejections;
      })
    );
  }
  public getAllRejections(): Observable<Map<number, string[]>> {
    return this._allDriverRejections.asObservable();
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
}