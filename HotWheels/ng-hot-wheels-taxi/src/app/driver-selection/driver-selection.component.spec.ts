import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverSelectionComponent } from './driver-selection.component';

describe('DriverSelectionComponent', () => {
  let component: DriverSelectionComponent;
  let fixture: ComponentFixture<DriverSelectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DriverSelectionComponent]
    });
    fixture = TestBed.createComponent(DriverSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
