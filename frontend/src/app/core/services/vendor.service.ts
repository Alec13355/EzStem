import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Vendor, PagedResponse } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class VendorService {
  constructor(private api: ApiService) {}

  getVendors(page: number = 1, pageSize: number = 100): Observable<PagedResponse<Vendor>> {
    return this.api.get<PagedResponse<Vendor>>('vendors', { pageNumber: page, pageSize });
  }

  createVendor(data: Partial<Vendor>): Observable<Vendor> {
    return this.api.post<Vendor>('vendors', data);
  }

  updateVendor(id: string, data: Partial<Vendor>): Observable<Vendor> {
    return this.api.put<Vendor>(`vendors/${id}`, data);
  }

  deleteVendor(id: string): Observable<void> {
    return this.api.delete<void>(`vendors/${id}`);
  }
}
