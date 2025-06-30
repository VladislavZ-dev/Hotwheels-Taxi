import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateService {

  startOfLocalDay(baseDate: Date = new Date()): Date {
    const date = new Date(baseDate);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  endOfLocalDay(baseDate: Date = new Date()): Date {
    const date = new Date(baseDate);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatLocalDateTime(date: Date): string {
    const datePart = this.formatLocalDate(date);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${datePart}T${hours}:${minutes}`;
  }

  parseLocalDate(dateString: string): Date {
    if (!dateString) return new Date();

    const [datePart, timePart] = dateString.includes('T') ?
      dateString.split('T') : [dateString, '00:00'];

    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    return new Date(year, month - 1, day, hours || 0, minutes || 0, 0);
  }
}
