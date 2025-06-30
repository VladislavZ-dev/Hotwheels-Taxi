import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-driver-layout',
  templateUrl: './driver-layout.component.html',
  styleUrls: ['./driver-layout.component.css']
})
export class DriverLayoutComponent {

  title = 'Hot Wheels Firm';
  isSidebarCollapsed = false;

  constructor(public authService: AuthService, private router: Router) {}

  toggleSidebar() {
    if (this.authService.isLoggedIn) {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }
  }

  get hostClass() {
    return this.authService.isLoggedIn ? 'driver-logged-in' : 'driver-not-logged-in';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/driver/login']);
  }
}
