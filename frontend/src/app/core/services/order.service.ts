import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Order, WasteSummary, PagedResponse } from '../../shared/models/api.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = environment.apiUrl;

  constructor(
    private api: ApiService,
    private http: HttpClient
  ) {}

  getOrders(page = 1, pageSize = 100): Observable<PagedResponse<Order>> {
    return this.api.get<PagedResponse<Order>>('orders', { page, pageSize });
  }

  getOrder(id: string): Observable<Order> {
    return this.api.get<Order>(`orders/${id}`);
  }

  exportOrderCsv(orderId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/orders/${orderId}/export/csv`, {
      responseType: 'blob'
    });
  }

  recordWaste(orderId: string, actualStemsUsed: number): Observable<WasteSummary> {
    return this.api.post<WasteSummary>(`orders/${orderId}/waste`, { actualStemsUsed });
  }

  getWaste(orderId: string): Observable<WasteSummary> {
    return this.api.get<WasteSummary>(`orders/${orderId}/waste`);
  }

  downloadCsv(orderId: string): void {
    this.exportOrderCsv(orderId).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `order-${orderId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
