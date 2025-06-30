import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxiDetailComponent } from './taxi-detail.component';

describe('TaxiDetailComponent', () => {
  let component: TaxiDetailComponent;
  let fixture: ComponentFixture<TaxiDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TaxiDetailComponent]
    });
    fixture = TestBed.createComponent(TaxiDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
