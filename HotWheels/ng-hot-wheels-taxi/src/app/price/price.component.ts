import { Component } from '@angular/core';
import { PriceService } from '../price.service';
import { Price } from '../price'

@Component({
  selector: 'app-price',
  templateUrl: './price.component.html',
  styleUrls: ['./price.component.css']
})
export class PriceComponent {
  price: Price = { basic: 0, luxurious: 0, nightFee: 0 };
  currentPrice: Price | null = null;
  message = '';

  constructor(private priceService: PriceService) {}

  ngOnInit(): void {
    this.loadCurrentPrice();
  }

  loadCurrentPrice(): void {
    this.priceService.getPrices().subscribe({
      next: (data) => this.currentPrice = data,
      error: () => this.message = 'Error loading current prices.'
    });
  }

  formatPrice(value: number | undefined | null): string {
    return typeof value === 'number' ? value.toFixed(2) : '0.00';
  }

  submit(): void {
    this.priceService.updatePrices(this.price).subscribe({
      next: () => {
        this.message = 'Prices updated successfully!';
        this.loadCurrentPrice();
      },
      error: () => this.message = 'Error updating prices.'
    });
  }
}
