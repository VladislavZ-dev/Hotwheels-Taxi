import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReserveTaxiComponent } from './reserve-taxi.component';

describe('ReserveTaxiComponent', () => {
  let component: ReserveTaxiComponent;
  let fixture: ComponentFixture<ReserveTaxiComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReserveTaxiComponent]
    });
    fixture = TestBed.createComponent(ReserveTaxiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
