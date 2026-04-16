import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../shared/models/api.models';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-order-list',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    EmptyStateComponent
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Orders</h1>
      </div>

      @if (orders.length > 0) {
      <table mat-table [dataSource]="orders" class="mat-elevation-z2">
        <ng-container matColumnDef="eventId">
          <th mat-header-cell *matHeaderCellDef>Event</th>
          <td mat-cell *matCellDef="let order">{{ order.eventId }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let order">
            <mat-chip [class]="'status-' + order.status.toLowerCase()">
              {{ order.status }}
            </mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="totalCost">
          <th mat-header-cell *matHeaderCellDef>Total Cost</th>
          <td mat-cell *matCellDef="let order">
            <span class="currency">{{ calculateOrderTotal(order) | number:'1.2-2' }}</span>
          </td>
        </ng-container>

        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef>Created</th>
          <td mat-cell *matCellDef="let order">{{ order.createdAt | date:'short' }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let order">
            <button mat-icon-button color="primary" (click)="viewOrder(order.id)">
              <mat-icon>visibility</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
      } @else {
        <app-empty-state
          [icon]="'📦'"
          [title]="'No orders yet'"
          [message]="'Generate orders from your events.'">
        </app-empty-state>
      }
    </div>
  `,
  styles: [`
    .header {
      margin-bottom: 24px;
    }

    table {
      width: 100%;
    }

    .status-draft { background-color: #e0e0e0; }
    .status-submitted { background-color: #64b5f6; }
    .status-confirmed { background-color: #81c784; }
    .status-received { background-color: #9e9e9e; }
  `]
})
export class OrderListComponent implements OnInit {
  orders: Order[] = [];
  displayedColumns = ['eventId', 'status', 'totalCost', 'createdAt', 'actions'];

  constructor(
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.orderService.getOrders().subscribe({
      next: (response) => {
        this.orders = response.items ?? [];
      },
      error: (err) => {
        console.error('Error loading orders:', err);
      }
    });
  }

  calculateOrderTotal(order: Order): number {
    if (order.totalCost !== undefined) return order.totalCost;
    if (!order.lineItems) return 0;
    return order.lineItems.reduce((sum, item) => sum + (item.quantityOrdered * item.costPerUnit), 0);
  }

  viewOrder(id: string) {
    this.router.navigate(['/orders', id]);
  }
}
