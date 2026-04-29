import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { 
  EventItemFlower, 
  CreateEventItemFlowerRequest, 
  UpdateEventItemFlowerRequest,
  EventRecipeSummaryResponse
} from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class EventRecipeService {
  constructor(private api: ApiService) {}

  getRecipe(eventId: string, itemId: string): Observable<EventItemFlower[]> {
    return this.api.get<EventItemFlower[]>(`events/${eventId}/event-items/${itemId}/recipe`);
  }

  addFlowerToRecipe(eventId: string, itemId: string, data: CreateEventItemFlowerRequest): Observable<EventItemFlower> {
    return this.api.post<EventItemFlower>(`events/${eventId}/event-items/${itemId}/recipe`, data);
  }

  updateRecipeEntry(eventId: string, itemId: string, entryId: string, data: UpdateEventItemFlowerRequest): Observable<EventItemFlower> {
    return this.api.put<EventItemFlower>(`events/${eventId}/event-items/${itemId}/recipe/${entryId}`, data);
  }

  deleteRecipeEntry(eventId: string, itemId: string, entryId: string): Observable<void> {
    return this.api.delete<void>(`events/${eventId}/event-items/${itemId}/recipe/${entryId}`);
  }

  getEventRecipeSummary(eventId: string): Observable<EventRecipeSummaryResponse> {
    return this.api.get<EventRecipeSummaryResponse>(`events/${eventId}/recipe-summary`);
  }
}
