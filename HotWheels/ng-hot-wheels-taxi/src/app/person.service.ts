import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Person } from './person';

@Injectable({
  providedIn: 'root'
})
export class PersonService {
  private personsUrl = 'http://10.101.151.25:3076/persons';

  constructor(private http: HttpClient) {}

  getPersonsByIds(ids: string[]): Observable<Person[]> {
    return this.http.get<Person[]>(`${this.personsUrl}?ids=${ids.join(',')}`);
  }
}
