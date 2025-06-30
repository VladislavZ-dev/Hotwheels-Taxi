import { Component, OnInit } from '@angular/core';
import { TripService } from '../trip.service';
import { DateService } from '../date.service';
import { Driver } from '../driver'; 
import { Taxi } from '../taxi'; 
import { Trip } from '../trip'; 

@Component({
  selector: 'app-report-view',
  templateUrl: './report-view.component.html',
  styleUrls: ['./report-view.component.css']
})
export class ReportViewComponent implements OnInit {

  currentView: 'summary' | 'byDriver' | 'byTaxi' | 'tripDetails' | 'allTrips' = 'summary';
  selectedMetric: 'trips' | 'hours' | 'distance' = 'trips';
  
  startDate: string = this.formatDateForInput(new Date());
  endDate: string = this.formatDateForInput(new Date());
  
  totalTrips: number = 0;
  totalHours: number = 0;
  totalDistance: number = 0;
  
  driversBreakdown: {driver: Driver, trips: number, hours: number, distance: number}[] = [];
  taxisBreakdown: {taxi: Taxi, trips: number, hours: number, distance: number}[] = [];
  

  allTripsData: Trip[] = [];
  tripsDetails: Trip[] = [];
  filteredTrips: Trip[] = [];
  tripFilter: string = '';
  tripSortField: 'startTime' | 'endTime' | 'duration' | 'distance' = 'startTime';
  sortDirection: 'asc' | 'desc' = 'desc';
  itemsPerPage: number = 10;
  currentPage: number = 0;
  paginatedTrips: Trip[][] = [];
  
  
  selectedDriver: Driver | null = null;
  selectedTaxi: Taxi | null = null;
  
  constructor(public tripService: TripService, private dateService: DateService) {
    const startOfDay = this.dateService.startOfLocalDay();
    this.startDate = this.dateService.formatLocalDateTime(startOfDay);
    
    const endOfDay = this.dateService.endOfLocalDay();
    this.endDate = this.dateService.formatLocalDateTime(endOfDay);
  }

  async ngOnInit(): Promise<void> {
    await this.loadSummaryData();
  }

  getDriverNameSafely(driver: Driver | undefined): string {
    if (!driver) return 'Unknown Driver';
    
    if (driver.person && driver.person.name) {
      return driver.person.name;
    } 
    if (driver.driversLicense) {
      return `Driver (${driver.driversLicense})`;
    }
    return 'Unknown Driver';
  }

  async loadSummaryData(): Promise<void> {
    await this.tripService.loadSummaryData();

    this.setCurrentView(this.tripService.getCurrentView());
    this.setSelectedMetric(this.tripService.getSelectedMetric());
    this.setStartDate(this.tripService.getStartDate());
    this.setEndDate(this.tripService.getEndDate());
    this.setTotalTrips(this.tripService.getTotalTrips());
    this.setTotalHours(this.tripService.getTotalHours());
    this.setTotalDistance(this.tripService.getTotalDistance());
    this.setDriversBreakdown(this.tripService.getDriversBreakdown());
    this.setTaxisBreakdown(this.tripService.getTaxisBreakdown());
    
    this.allTripsData = [...this.tripService.getTripsDetails()];
    this.tripsDetails = [...this.allTripsData];
    
    this.setSelectedDriver(this.tripService.getSelectedDriver());
    this.setSelectedTaxi(this.tripService.getSelectedTaxi());
    
    this.filteredTrips = [...this.allTripsData];
    this.sortTrips();
    this.paginateTrips();
  }

  setCurrentView(view: 'summary' | 'byDriver' | 'byTaxi' | 'tripDetails' | 'allTrips'): void {
    this.currentView = view;
  }
  
  setSelectedMetric(metric: 'trips' | 'hours' | 'distance'): void {
    this.selectedMetric = metric;
  }
  
  setTotalTrips(total: number): void {
    this.totalTrips = total;
  }
  
  setTotalHours(hours: number): void {
    this.totalHours = hours;
  }
  
  setTotalDistance(distance: number): void {
    this.totalDistance = distance;
  }
  
  setDriversBreakdown(breakdown: {driver: Driver, trips: number, hours: number, distance: number}[]): void {
    this.driversBreakdown = breakdown;
  }
  
  setTaxisBreakdown(breakdown: {taxi: Taxi, trips: number, hours: number, distance: number}[]): void {
    this.taxisBreakdown = breakdown;
  }
  
  setSelectedDriver(driver: Driver | null): void {
    this.selectedDriver = driver;
  }
  
  setSelectedTaxi(taxi: Taxi | null): void {
    this.selectedTaxi = taxi;
  }

  async showDriverBreakdown(metric: 'trips' | 'hours' | 'distance'): Promise<void> {
    this.selectedMetric = metric;
    
    this.tripsDetails = [...this.allTripsData];
    this.selectedDriver = null;
    this.selectedTaxi = null;
    this.driversBreakdown.sort((a, b) => b[metric] - a[metric]);    
    this.currentView = 'byDriver';
  }

  async showTaxiBreakdown(metric: 'trips' | 'hours' | 'distance'): Promise<void> {
    this.selectedMetric = metric;
    
    this.tripsDetails = [...this.allTripsData];
    this.selectedDriver = null;
    this.selectedTaxi = null;
   
    this.taxisBreakdown.sort((a, b) => b[metric] - a[metric]);
    
    this.currentView = 'byTaxi';
  }

  async showDriverTrips(driver: Driver): Promise<void> {
    this.selectedDriver = driver;
    this.selectedTaxi = null;
    this.tripsDetails = this.allTripsData.filter(trip => {
      if (!trip.driver || !driver.person) return false;
      
      if (typeof trip.driver.person === 'object' && typeof driver.person === 'object') {
        return trip.driver.person?.nif === driver.person?.nif;
      } else {
        throw new Error("nif problems");
      }
    });
    
    this.tripsDetails.sort((a, b) => 
      new Date(b.period.beginning).getTime() - new Date(a.period.beginning).getTime()
    );
    
    this.currentView = 'tripDetails';
  }

  async showTaxiTrips(taxi: Taxi): Promise<void> {
    this.selectedTaxi = taxi;
    this.selectedDriver = null;
    
    this.tripsDetails = this.allTripsData.filter(trip => 
      trip.taxi?.licensePlate === taxi.licensePlate
    );
    
    console.log(`Showing trips for taxi ${taxi.licensePlate}, found ${this.tripsDetails.length} trips`);
    
    this.tripsDetails.sort((a, b) => 
      new Date(b.period.beginning).getTime() - new Date(a.period.beginning).getTime()
    );
    
    this.currentView = 'tripDetails';
  }

  async showAllTrips(): Promise<void> {
    this.selectedDriver = null;
    this.selectedTaxi = null;
    this.tripFilter = '';
    this.currentPage = 0;
    this.filteredTrips = [...this.allTripsData];
    
    this.sortTrips();
    
    this.currentView = 'allTrips';
  }

  filterTrips(): void {
    const searchTerm = this.tripFilter.toLowerCase();
    
    if (!searchTerm) {
      this.filteredTrips = [...this.allTripsData];
    } else {
      this.filteredTrips = this.allTripsData.filter(trip => {
        const driverName = this.getDriverNameSafely(trip.driver).toLowerCase();
        const taxiInfo = `${trip.taxi?.licensePlate || ''} ${trip.taxi?.model || ''}`.toLowerCase();
        const sequenceStr = String(trip.sequence).toLowerCase();
        
        return driverName.includes(searchTerm) || 
               taxiInfo.includes(searchTerm) ||
               sequenceStr.includes(searchTerm);
      });
    }
    
    this.sortTrips();
    this.currentPage = 0; 
  }

  sortTrips(): void {
    this.filteredTrips.sort((a, b) => {
      let comparison = 0;
      
      switch(this.tripSortField) {
        case 'startTime':
          comparison = new Date(a.period.beginning).getTime() - new Date(b.period.beginning).getTime();
          break;
        case 'endTime':
          comparison = new Date(a.period.ending).getTime() - new Date(b.period.ending).getTime();
          break;
        case 'duration':
          comparison = (a.time || 0) - (b.time || 0);
          break;
        case 'distance':
          comparison = (a.distance || 0) - (b.distance || 0);
          break;
      }
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
    
    this.paginateTrips();
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortTrips();
  }

  paginateTrips(): void {
    this.paginatedTrips = [];
    for (let i = 0; i < this.filteredTrips.length; i += this.itemsPerPage) {
      this.paginatedTrips.push(this.filteredTrips.slice(i, i + this.itemsPerPage));
    }
    
    if (this.paginatedTrips.length === 0) {
      this.paginatedTrips = [[]];
    }
    
    if (this.currentPage >= this.paginatedTrips.length) {
      this.currentPage = Math.max(0, this.paginatedTrips.length - 1);
    }
  }

  changePage(pageIndex: number): void {
    if (pageIndex >= 0 && pageIndex < this.paginatedTrips.length) {
      this.currentPage = pageIndex;
    }
  }

  backToSummary(): void {
    this.selectedDriver = null;
    this.selectedTaxi = null;
    this.tripsDetails = [...this.allTripsData];
    this.currentView = 'summary';
  }

  private formatDateForInput(date: Date): string {
    return this.dateService.formatLocalDateTime(date);
  }

  private parseInputDate(dateString: string): Date {
    return this.dateService.parseLocalDate(dateString);
  }

  getDisplayDate(dateString: string): string {
    if (!dateString) return '';
    return dateString;
  }

  onStartDateChange(event: Event): void {
    this.startDate = (event.target as HTMLInputElement).value;
    this.updateDateRange();
  }

  onEndDateChange(event: Event): void {
    this.endDate = (event.target as HTMLInputElement).value;
    this.updateDateRange();
  }

  updateDateRange(): void {
    const startDateObj = this.parseInputDate(this.startDate);
    const endDateObj = this.parseInputDate(this.endDate);
    
    console.log('Updating date range:');
    console.log('- Start string:', this.startDate, '-> Date object:', startDateObj);
    console.log('- End string:', this.endDate, '-> Date object:', endDateObj);
    
    this.tripService.setStartDate(startDateObj);
    this.tripService.setEndDate(endDateObj);
    
    this.loadSummaryData();
  }

  setStartDate(date: Date): void {
    this.startDate = this.dateService.formatLocalDateTime(date);
  }
  
  setEndDate(date: Date): void {
    this.endDate = this.dateService.formatLocalDateTime(date);
  }
} 