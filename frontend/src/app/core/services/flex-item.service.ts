import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { FlexItem } from '../../shared/models/api.models';

@Injectable({ providedIn: 'root' })
export class FlexItemService {
  constructor(private api: ApiService) {}

  getFlexItems(eventId: string): Observable<FlexItem[]> {
    return this.api.get<FlexItem[]>(`events/${eventId}/flex-items`);
  }

  addFlexItem(eventId: string, itemId: string, quantityNeeded: number, notes?: string): Observable<FlexItem> {
    return this.api.post<FlexItem>(`events/${eventId}/flex-items`, { itemId, quantityNeeded, notes });
  }

  updateFlexItem(eventId: string, flexItemId: string, quantityNeeded?: number, notes?: string): Observable<FlexItem> {
    return this.api.put<FlexItem>(`events/${eventId}/flex-items/${flexItemId}`, { quantityNeeded, notes });
  }

  deleteFlexItem(eventId: string, flexItemId: string): Observable<void> {
    return this.api.delete<void>(`events/${eventId}/flex-items/${flexItemId}`);
  }
}
