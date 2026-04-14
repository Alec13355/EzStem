import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { FloristEvent, EventSummary, Order } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  constructor(private api: ApiService) {}

  getEvents(): Observable<FloristEvent[]> {
    return this.api.get<FloristEvent[]>('events');
  }

  getEvent(id: string): Observable<FloristEvent> {
    return this.api.get<FloristEvent>(`events/${id}`);
  }

  createEvent(data: Partial<FloristEvent>): Observable<FloristEvent> {
    return this.api.post<FloristEvent>('events', data);
  }

  updateEvent(id: string, data: Partial<FloristEvent>): Observable<FloristEvent> {
    return this.api.put<FloristEvent>(`events/${id}`, data);
  }

  deleteEvent(id: string): Observable<void> {
    return this.api.delete<void>(`events/${id}`);
  }

  addRecipeToEvent(eventId: string, recipeId: string, quantity: number): Observable<FloristEvent> {
    return this.api.post<FloristEvent>(`events/${eventId}/recipes`, { recipeId, quantity });
  }

  getEventSummary(eventId: string): Observable<EventSummary> {
    return this.api.get<EventSummary>(`events/${eventId}/summary`);
  }

  generateOrder(eventId: string): Observable<Order> {
    return this.api.post<Order>(`events/${eventId}/generate-order`, {});
  }
}
