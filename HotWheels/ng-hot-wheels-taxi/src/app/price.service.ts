import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Price } from './price'
import { ExtendedRequest } from './extended-request';
import { Coordinates } from './request.service';

@Injectable({ providedIn: 'root' })
export class PriceService {

  private priceUrl = 'http://10.101.151.25:3076/price';

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(private http: HttpClient) {}

  createPrices(price: Price): Observable<Price> {
    const url = `${this.priceUrl}s`;
    return this.http.post<Price>(url, price, this.httpOptions);
  }

  getPrices(): Observable<Price> {
    const url = `${this.priceUrl}s`;
    return this.http.get<Price>(url);
  }

  updatePrices(price: Price): Observable <any> {
    const url = `${this.priceUrl}s`;
    return this.http.put<Price>(url, price, this.httpOptions );
  }

  getBasic(): Observable<number> {
    return this.http.get<{ basic: number }>(`${this.priceUrl}/basic`).pipe(map(response => response.basic));
  }

  getLuxurious(): Observable<number> {
    return this.http.get<{ luxurious: number }>(`${this.priceUrl}/luxurious`).pipe(map(response => response.luxurious));
  }

  getNightFee(): Observable<number> {
    return this.http.get<{ nightFee: number }>(`${this.priceUrl}/nightFee`).pipe(map(response => response.nightFee));
  }

  updateBasic(basic: number): Observable<any> {
    return this.http.put(`${this.priceUrl}/basic`, { basic }, this.httpOptions);
  }

  updateLuxurious(luxurious: number): Observable<any> {
    return this.http.put(`${this.priceUrl}/luxurious`, { luxurious }, this.httpOptions);
  }

  updateNightFee(NightFee: number): Observable<any> {
    return this.http.put(`${this.priceUrl}/nightFee`, { NightFee }, this.httpOptions);
  }

  public calculateTripCost(trip_distance: number, comfort: string | undefined, start: Date): Promise<number> {
    return new Promise((resolve, reject) => {
      const duration = this.calculateEstimatedMinutes(trip_distance);
      let cost = 0;
    
      let normalMinutes = 0;
      let nightMinutes = 0;
  
      if (!start) {
        return reject(new Error('Start time is undefined'));
      }
    
      for (let i = 0; i < duration; i++) {
        const current = new Date(start.getTime() + i * 60 * 1000);
        const hour = current.getHours();
        if (hour >= 21 || hour < 6) nightMinutes++;
        else normalMinutes++;
      }
    
      this.getPrices().subscribe({
        next: (prices) => {
          let ratePerMinute = 0;
      
          if (comfort === "basic") {
            ratePerMinute = prices.basic;
          } else if (comfort === "luxury") {
            ratePerMinute = prices.luxurious;
          } else {
            return reject(new Error('Invalid comfort level'));
          }
      
          const nightFeeMultiplier = 1 + prices.nightFee / 100;
      
          cost = (normalMinutes * ratePerMinute) + (nightMinutes * ratePerMinute * nightFeeMultiplier);
          resolve(cost);
        },
        error: (err) => {
          reject(err);
        }
      });
    });
  }

  calculateDistance(lat1: number , lon1 : number, lat2 : number, lon2 : number) {

    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
}

  public formatCost(value: number | undefined | null): string {
    return typeof value === 'number' ? value.toFixed(2) : '0.00';
  }

  public calculateEstimatedMinutes(distanceKm: number | undefined): number {
    if (!distanceKm || distanceKm <= 0) {
      return 1;
    }
    return Math.round(distanceKm * 4);
  }

  public formatEstimatedTime(minutes: number | undefined): string {
    if (!minutes) return 'N/A';
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);
    
    if (hours > 0) {
      if (remainingMinutes > 0) {
        return `${hours}h ${remainingMinutes}m`;
      }
      return `${hours}h`;
    }
    return `${remainingMinutes}m`;
}

calculatePriceByTimes(start: Date, end: Date, comfort: string): Observable<number> {
  return new Observable(observer => {
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      observer.error("Invalid time range");
      return;
    }

    const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    let normalMinutes = 0;
    let nightMinutes = 0;

    for (let i = 0; i < totalMinutes; i++) {
      const current = new Date(start.getTime() + i * 60 * 1000);
      const hour = current.getHours();
      if (hour >= 21 || hour < 6) nightMinutes++;
      else normalMinutes++;
    }

    this.getPrices().subscribe({
      next: (prices) => {
        let ratePerMinute = 0;
        if (comfort === 'basic') ratePerMinute = prices.basic;
        else if (comfort === 'luxury') ratePerMinute = prices.luxurious;
        else {
          observer.error('Invalid comfort level');
          return;
        }

        const nightFeeMultiplier = 1 + prices.nightFee / 100;
        const cost = (normalMinutes * ratePerMinute) + (nightMinutes * ratePerMinute * nightFeeMultiplier);
        observer.next(cost);
        observer.complete();
      },
      error: (err) => observer.error(err)
    });
  });
}
}
