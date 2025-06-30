import { Component } from '@angular/core';
import { PriceService } from '../price.service';

@Component({
  selector: 'app-trip-simulator',
  templateUrl: './trip-simulator.component.html',
  styleUrls: ['./trip-simulator.component.css']
})
export class TripSimulatorComponent {
  startTime = '';
  endTime = '';
  comfort = 'basic';
  cost: number | null = null;

  constructor(private priceService: PriceService) {}

  calculateTripCost() {
    const start = new Date(this.startTime);
    const end = new Date(this.endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      alert("Check the trip's schedule.");
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
  
    this.priceService.getPrices().subscribe((prices) => {
      let ratePerMinute = 0;
  
      if (this.comfort === 'basic') {
        ratePerMinute = prices.basic;
      } else if (this.comfort === 'luxurious') {
        ratePerMinute = prices.luxurious;
      } else {
        alert('Invalid confort level.');
        return;
      }
  
      const nightFeeMultiplier = 1 + prices.nightFee / 100;
  
      this.cost = 
        (normalMinutes * ratePerMinute) + 
        (nightMinutes * ratePerMinute * nightFeeMultiplier);
    });
  }

  formatCost(value: number | undefined | null): string {
    return typeof value === 'number' ? value.toFixed(2) : '0.00';
  }
  
}
