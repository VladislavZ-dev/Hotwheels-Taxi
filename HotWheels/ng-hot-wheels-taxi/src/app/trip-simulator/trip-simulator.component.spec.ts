import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripSimulatorComponent } from './trip-simulator.component';

describe('TripSimulatorComponent', () => {
  let component: TripSimulatorComponent;
  let fixture: ComponentFixture<TripSimulatorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TripSimulatorComponent]
    });
    fixture = TestBed.createComponent(TripSimulatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
