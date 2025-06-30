import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TaxiComponent } from './taxi/taxi.component';
import { DriverComponent } from './driver/driver.component';
import { TripDetailComponent } from './trip-detail/trip-detail.component';
import { TripFormComponent } from './trip-form/trip-form.component';
import { TaxiDetailComponent } from './taxi-detail/taxi-detail.component';
import { AddressComponent } from './address/address.component';
import { PriceComponent } from './price/price.component';
import { TripSimulatorComponent } from './trip-simulator/trip-simulator.component';
import { SelectorComponent } from './selector/selector.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { DriverDashboardComponent } from './driver-dashboard/driver-dashboard.component';
import { ClientDashboardComponent } from './client-dashboard/client-dashboard.component';
import { ClientLayoutComponent } from './client-layout/client-layout.component';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { DriverLayoutComponent } from './driver-layout/driver-layout.component';
import { ClientRequestComponent } from './client-request/client-request.component';
import { DriverRequestComponent } from './driver-request/driver-request.component';
import { DriverSelectionComponent } from './driver-selection/driver-selection.component';
import { ReserveTaxiComponent } from './reserve-taxi/reserve-taxi.component';
import { ShiftListComponent } from './shift-list/shift-list.component';
import { ReportViewComponent } from './report-view/report-view.component';

@NgModule({
  declarations: [
    AppComponent,
    TaxiComponent,
    DriverComponent,
    TripDetailComponent,
    TripFormComponent,
    TaxiDetailComponent,
    AddressComponent,
    PriceComponent,
    TripSimulatorComponent,
    SelectorComponent,
    AdminDashboardComponent,
    DriverDashboardComponent,
    ClientDashboardComponent,
    ClientLayoutComponent,
    AdminLayoutComponent,
    DriverLayoutComponent,
    ClientRequestComponent,
    DriverRequestComponent,
    DriverSelectionComponent,
    ReserveTaxiComponent,
    ShiftListComponent,
    ReportViewComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
