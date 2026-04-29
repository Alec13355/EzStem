import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { EventItem, CreateEventItemRequest, UpdateEventItemRequest } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class EventItemService {
  constructor(private api: ApiService) {}

  getItems(eventId: string): Observable<EventItem[]> {
    return this.api.get<EventItem[]>(`events/${eventId}/event-items`);
  }

  createItem(eventId: string, data: CreateEventItemRequest): Observable<EventItem> {
    return this.api.post<EventItem>(`events/${eventId}/event-items`, data);
  }

  updateItem(eventId: string, itemId: string, data: UpdateEventItemRequest): Observable<EventItem> {
    return this.api.put<EventItem>(`events/${eventId}/event-items/${itemId}`, data);
  }

  deleteItem(eventId: string, itemId: string): Observable<void> {
    return this.api.delete<void>(`events/${eventId}/event-items/${itemId}`);
  }

  getItemsFromLastEvent(eventId: string): Observable<EventItem[]> {
    return this.api.get<EventItem[]>(`events/${eventId}/event-items/from-last-event`);
  }
}
