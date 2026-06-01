import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { EventItemSupply, CreateEventItemSupplyRequest, UpdateEventItemSupplyRequest } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class EventItemSupplyService {
  constructor(private api: ApiService) {}

  getSupplies(eventId: string, itemId: string): Observable<EventItemSupply[]> {
    return this.api.get<EventItemSupply[]>(`events/${eventId}/event-items/${itemId}/supplies`);
  }

  createSupply(eventId: string, itemId: string, data: CreateEventItemSupplyRequest): Observable<EventItemSupply> {
    return this.api.post<EventItemSupply>(`events/${eventId}/event-items/${itemId}/supplies`, data);
  }

  updateSupply(eventId: string, itemId: string, supplyId: string, data: UpdateEventItemSupplyRequest): Observable<EventItemSupply> {
    return this.api.put<EventItemSupply>(`events/${eventId}/event-items/${itemId}/supplies/${supplyId}`, data);
  }

  deleteSupply(eventId: string, itemId: string, supplyId: string): Observable<void> {
    return this.api.delete<void>(`events/${eventId}/event-items/${itemId}/supplies/${supplyId}`);
  }
}
