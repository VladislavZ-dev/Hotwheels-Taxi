import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverRequestComponent } from './driver-request.component';

describe('DriverRequestComponent', () => {
  let component: DriverRequestComponent;
  let fixture: ComponentFixture<DriverRequestComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DriverRequestComponent]
    });
    fixture = TestBed.createComponent(DriverRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
