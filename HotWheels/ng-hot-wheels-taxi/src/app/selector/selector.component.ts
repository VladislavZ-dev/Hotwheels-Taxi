import { Component } from '@angular/core';
import { Router } from '@angular/router'
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-selector',
  templateUrl: './selector.component.html',
  styleUrls: ['./selector.component.css']
})
export class SelectorComponent {

  constructor(private router: Router, private authService : AuthService) {}

  goTo(role: string) {
    if (role === 'driver/driver-selection' && this.authService.isLoggedIn) {
      this.router.navigate(['/driver/driver-dashboard']);
    } else {
      this.router.navigate([`/${role}`]);
    }
  }
}

