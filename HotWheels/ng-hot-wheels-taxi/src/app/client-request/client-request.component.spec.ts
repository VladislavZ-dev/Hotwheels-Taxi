import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientRequestComponent } from './client-request.component';

describe('ClientRequest', () => {
  let component: ClientRequestComponent;
  let fixture: ComponentFixture<ClientRequestComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ClientRequestComponent]
    });
    fixture = TestBed.createComponent(ClientRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
