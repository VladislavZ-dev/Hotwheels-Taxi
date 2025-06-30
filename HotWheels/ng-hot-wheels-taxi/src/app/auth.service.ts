import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Driver } from './driver';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _isLoggedIn = new BehaviorSubject<boolean>(false);
  private _currentDriver = new BehaviorSubject<Driver | null>(null);

  isLoggedIn$ = this._isLoggedIn.asObservable();
  currentDriver$ = this._currentDriver.asObservable();

  get isLoggedIn(): boolean {
    return this._isLoggedIn.value;
  }

  get currentDriver(): Driver | null {
    return this._currentDriver.value;
  }

  login(driver: Driver) {
    this._isLoggedIn.next(true);
    this._currentDriver.next(driver);
  }

  logout() {
    this._isLoggedIn.next(false);
    this._currentDriver.next(null);
  }
}