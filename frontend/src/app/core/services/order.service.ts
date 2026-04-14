import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Order } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(private api: ApiService) {}

  getOrders(): Observable<Order[]> {
    return this.api.get<Order[]>('orders');
  }

  getOrder(id: string): Observable<Order> {
    return this.api.get<Order>(`orders/${id}`);
  }
}
