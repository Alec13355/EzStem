import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { MasterFlower, CreateMasterFlowerRequest, UpdateMasterFlowerRequest, OcrImportResult } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class MasterFlowerService {
  constructor(private api: ApiService) {}

  getAll(category?: string): Observable<MasterFlower[]> {
    const params = category ? { category } : {};
    return this.api.get<MasterFlower[]>('master-flowers', params);
  }

  getCategories(): Observable<string[]> {
    return this.api.get<string[]>('master-flowers/categories');
  }

  create(request: CreateMasterFlowerRequest): Observable<MasterFlower> {
    return this.api.post<MasterFlower>('master-flowers', request);
  }

  update(id: string, request: UpdateMasterFlowerRequest): Observable<MasterFlower> {
    return this.api.put<MasterFlower>(`master-flowers/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`master-flowers/${id}`);
  }

  importFromPdf(file: File): Observable<OcrImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<OcrImportResult>('master-flowers/import-pdf', formData);
  }
}
