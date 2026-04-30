import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { EventFlower, CreateEventFlowerRequest, UpdateEventFlowerRequest, AddFlowersFromMasterRequest } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class EventFlowerService {
  constructor(private api: ApiService) {}

  getFlowers(eventId: string): Observable<EventFlower[]> {
    return this.api.get<EventFlower[]>(`events/${eventId}/event-flowers`);
  }

  createFlower(eventId: string, data: CreateEventFlowerRequest): Observable<EventFlower> {
    return this.api.post<EventFlower>(`events/${eventId}/event-flowers`, data);
  }

  updateFlower(eventId: string, flowerId: string, data: UpdateEventFlowerRequest): Observable<EventFlower> {
    return this.api.put<EventFlower>(`events/${eventId}/event-flowers/${flowerId}`, data);
  }

  deleteFlower(eventId: string, flowerId: string): Observable<void> {
    return this.api.delete<void>(`events/${eventId}/event-flowers/${flowerId}`);
  }

  addFromMaster(eventId: string, request: AddFlowersFromMasterRequest): Observable<EventFlower[]> {
    return this.api.post<EventFlower[]>(`events/${eventId}/event-flowers/from-master`, request);
  }
}
