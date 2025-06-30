import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DriverComponent } from './driver/driver.component';
import { TaxiComponent } from './taxi/taxi.component';
import { TripDetailComponent } from './trip-detail/trip-detail.component';
import { TripSimulatorComponent } from './trip-simulator/trip-simulator.component';
import { PriceComponent } from './price/price.component';
import { SelectorComponent } from './selector/selector.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { ClientDashboardComponent } from './client-dashboard/client-dashboard.component';
import { DriverDashboardComponent } from './driver-dashboard/driver-dashboard.component';
import { ClientLayoutComponent } from './client-layout/client-layout.component';
import { DriverLayoutComponent } from './driver-layout/driver-layout.component';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { TripFormComponent } from './trip-form/trip-form.component';
import { ClientRequestComponent } from './client-request/client-request.component';
import { DriverRequestComponent } from './driver-request/driver-request.component';
import { DriverSelectionComponent } from './driver-selection/driver-selection.component';
import { ReserveTaxiComponent } from './reserve-taxi/reserve-taxi.component';
import { AuthGuard } from './auth.guard';
import { ShiftListComponent } from './shift-list/shift-list.component';
import { ReportViewComponent } from './report-view/report-view.component';

const routes: Routes = [
  { path: '', component: SelectorComponent },
  { path: 'selector', component: SelectorComponent },
  {
    path: 'client',
    component: ClientLayoutComponent,
    children: [
      { path: 'client-dashboard', component: ClientDashboardComponent },
      { path: 'client-request', component: ClientRequestComponent },

    ]
  },
  {
    path: 'driver',
    component: DriverLayoutComponent,
    children: [
      { path: 'driver-selection', component: DriverSelectionComponent },
      { 
        path: '',
        canActivate: [AuthGuard],
        children: [
          { path: 'driver-dashboard', component: DriverDashboardComponent },
          { path: 'past-trips', component: TripDetailComponent },
          { path: 'register-trip-form', component: TripFormComponent },
          { path: 'driver-request', component: DriverRequestComponent },
          { path: 'reserve-taxi', component: ReserveTaxiComponent },
          { path: 'shift-list', component: ShiftListComponent },
          { path: '', redirectTo: 'driver-dashboard', pathMatch: 'full' }
        ]
      }
    ]
  },
  { 
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: 'admin-dashboard', component: AdminDashboardComponent },
      { path: 'drivers', component: DriverComponent },
      { path: 'taxis', component: TaxiComponent },
      { path: 'trip-simulator', component: TripSimulatorComponent },
      { path: 'prices', component: PriceComponent },
      { path: 'reports', component: ReportViewComponent}
    ]
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }


