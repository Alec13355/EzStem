import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { OrderService } from '../../../core/services/order.service';
import { Order, VendorOrderGroup } from '../../../shared/models/api.models';

@Component({
  selector: 'app-order-detail',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCardModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Order Details</h1>
        <div>
          <button mat-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Back
          </button>
          <button mat-raised-button color="primary" (click)="exportOrder()">
            <mat-icon>download</mat-icon>
            Export
          </button>
        </div>
      </div>

      @if (order) {
        <mat-card class="mb-3">
          <mat-card-header>
            <mat-card-title>Order Information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div><strong>Order ID:</strong> {{ order.id }}</div>
              <div><strong>Event ID:</strong> {{ order.eventId }}</div>
              <div><strong>Status:</strong> {{ order.status }}</div>
              <div><strong>Created:</strong> {{ order.createdAt | date:'medium' }}</div>
            </div>
          </mat-card-content>
        </mat-card>

        @for (vendorGroup of vendorGroups; track vendorGroup.vendorId) {
          <mat-card class="mb-3">
            <mat-card-header>
              <mat-card-title>{{ vendorGroup.vendorName }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="vendorGroup.lineItems" class="mat-elevation-z2">
                <ng-container matColumnDef="itemName">
                  <th mat-header-cell *matHeaderCellDef>Item</th>
                  <td mat-cell *matCellDef="let item">{{ item.item?.name }}</td>
                </ng-container>

                <ng-container matColumnDef="quantityNeeded">
                  <th mat-header-cell *matHeaderCellDef>Qty Needed</th>
                  <td mat-cell *matCellDef="let item">{{ item.quantityNeeded }}</td>
                </ng-container>

                <ng-container matColumnDef="bundleInfo">
                  <th mat-header-cell *matHeaderCellDef>Bundles</th>
                  <td mat-cell *matCellDef="let item">
                    {{ getBundleDisplay(item) }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="quantityOrdered">
                  <th mat-header-cell *matHeaderCellDef>Qty Ordered</th>
                  <td mat-cell *matCellDef="let item">{{ item.quantityOrdered }}</td>
                </ng-container>

                <ng-container matColumnDef="cost">
                  <th mat-header-cell *matHeaderCellDef>Cost</th>
                  <td mat-cell *matCellDef="let item">
                    <span class="currency">{{ (item.quantityOrdered * item.costPerUnit) | number:'1.2-2' }}</span>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="lineItemColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: lineItemColumns;"></tr>
              </table>

              <div class="vendor-total">
                <strong>Vendor Total:</strong>
                <strong class="currency">{{ vendorGroup.totalCost | number:'1.2-2' }}</strong>
              </div>
            </mat-card-content>
          </mat-card>
        }

        <mat-card>
          <mat-card-content>
            <div class="grand-total">
              <strong>Grand Total:</strong>
              <strong class="currency">{{ calculateGrandTotal() | number:'1.2-2' }}</strong>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      font-size: 14px;
    }

    table {
      width: 100%;
    }

    .vendor-total {
      display: flex;
      justify-content: space-between;
      padding: 16px;
      font-size: 16px;
      border-top: 2px solid #e0e0e0;
      margin-top: 8px;
    }

    .grand-total {
      display: flex;
      justify-content: space-between;
      font-size: 20px;
      padding: 8px;
    }
  `]
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  vendorGroups: VendorOrderGroup[] = [];
  lineItemColumns = ['itemName', 'quantityNeeded', 'bundleInfo', 'quantityOrdered', 'cost'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOrder(id);
    }
  }

  loadOrder(id: string) {
    this.orderService.getOrder(id).subscribe({
      next: (order) => {
        this.order = order;
        this.groupByVendor();
      },
      error: (err) => {
        console.error('Error loading order:', err);
      }
    });
  }

  groupByVendor() {
    if (!this.order?.lineItems) return;

    const vendorMap = new Map<string, VendorOrderGroup>();

    this.order.lineItems.forEach(item => {
      const vendorId = item.vendorId || 'no-vendor';
      const vendorName = item.vendor?.name || 'No Vendor';

      if (!vendorMap.has(vendorId)) {
        vendorMap.set(vendorId, {
          vendorId,
          vendorName,
          lineItems: [],
          totalCost: 0
        });
      }

      const group = vendorMap.get(vendorId)!;
      group.lineItems.push(item);
      group.totalCost += item.quantityOrdered * item.costPerUnit;
    });

    this.vendorGroups = Array.from(vendorMap.values());
  }

  getBundleDisplay(item: any): string {
    return `${item.quantityNeeded} stems`;
  }

  calculateGrandTotal(): number {
    return this.vendorGroups.reduce((sum, group) => sum + group.totalCost, 0);
  }

  exportOrder() {
    window.print();
  }

  goBack() {
    this.router.navigate(['/orders']);
  }
}
