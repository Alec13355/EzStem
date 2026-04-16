import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Item, PagedResponse } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  constructor(private api: ApiService) {}

  getItems(page: number = 1, pageSize: number = 10, search?: string): Observable<PagedResponse<Item>> {
    const params: any = { page, pageSize };
    if (search) {
      params.search = search;
    }
    return this.api.get<PagedResponse<Item>>('items', params);
  }

  getItem(id: string): Observable<Item> {
    return this.api.get<Item>(`items/${id}`);
  }

  createItem(data: Partial<Item>): Observable<Item> {
    return this.api.post<Item>('items', data);
  }

  updateItem(id: string, data: Partial<Item>): Observable<Item> {
    return this.api.put<Item>(`items/${id}`, data);
  }

  deleteItem(id: string): Observable<void> {
    return this.api.delete<void>(`items/${id}`);
  }

  uploadImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<{ url: string }>('items/upload-image', formData);
  }
}
