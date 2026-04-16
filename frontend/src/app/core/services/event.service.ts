import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { FloristEvent, EventSummary, Order, PagedResponse, ProductionSheetResponse } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  constructor(private api: ApiService) {}

  getEvents(page = 1, pageSize = 100, search?: string): Observable<PagedResponse<FloristEvent>> {
    const params: any = { page, pageSize };
    if (search) params.search = search;
    return this.api.get<PagedResponse<FloristEvent>>('events', params);
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

  getProductionSheet(eventId: string): Observable<ProductionSheetResponse> {
    return this.api.get<ProductionSheetResponse>(`events/${eventId}/production-sheet`);
  }
}
