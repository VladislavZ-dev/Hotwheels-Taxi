import { Component, OnInit } from '@angular/core';
import { TaxiService } from '../taxi.service';
import { DriverService } from '../driver.service';
import { PriceService } from '../price.service';
import { TripService } from '../trip.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: [ './admin-dashboard.component.css' ]
})
export class AdminDashboardComponent implements OnInit {
  numberOfTaxis: number = 0;
  numberOfDrivers: number = 0;
  basicPrice: number = 0;
  luxuryPrice: number = 0;
  nightFee: number = 0;
  totalTrips: number = 0;
  totalHours: number = 0;
  totalDistance: number = 0;

  constructor(private taxiService: TaxiService, private driverService: DriverService, private priceService: PriceService, public tripService : TripService) { }


  async ngOnInit(): Promise<void> {
    await this.loadSummaryData();
    this.getNumberOfTaxis();
    this.getNumberOfDrivers();
    this.getBasicPrice();
    this.getLuxuryPrice();
    this.getNightFee();
  }

  async loadSummaryData(): Promise<void> {
    await this.tripService.loadSummaryData();
    this.totalTrips = await this.tripService.calculateTotalTrips();
    this.totalHours = await this.tripService.calculateTotalHours();
    this.totalDistance = await this.tripService.calculateTotalDistance();
  }

  getNumberOfTaxis(): void{
    this.taxiService.getNumberTaxis().subscribe(numberOfTaxis => this.numberOfTaxis = numberOfTaxis);
  }

  getNumberOfDrivers(): void{
    this.driverService.getNumberDrivers().subscribe(numberOfDrivers => this.numberOfDrivers = numberOfDrivers);
  }

  getBasicPrice(): void{
    this.priceService.getBasic().subscribe(basicPrice => this.basicPrice = basicPrice);
  }

  getLuxuryPrice(): void{
    this.priceService.getLuxurious().subscribe(luxuryPrice => this.luxuryPrice = luxuryPrice);
  }

  getNightFee(): void{
    this.priceService.getNightFee().subscribe(nightFee => this.nightFee = nightFee);
  }
  
}