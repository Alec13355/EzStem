import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { OrderService } from '../../../core/services/order.service';
import { Order, VendorOrderGroup, WasteSummary } from '../../../shared/models/api.models';

@Component({
  selector: 'app-order-detail',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Order Details</h1>
        <div class="action-buttons">
          <button mat-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Back
          </button>
          <button mat-stroked-button (click)="downloadCsv()" class="export-btn">
            <mat-icon>download</mat-icon>
            Download Purchase Order CSV
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

        @if (order.wastePercentage !== undefined && order.wastePercentage !== null) {
          <mat-card class="mb-3">
            <mat-card-header>
              <mat-card-title>Waste Analysis</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="waste-display">
                <span>Waste Percentage:</span>
                <span [ngClass]="{
                  'waste-low': order.wastePercentage < 10,
                  'waste-medium': order.wastePercentage >= 10 && order.wastePercentage <= 20,
                  'waste-high': order.wastePercentage > 20
                }">{{ order.wastePercentage | number:'1.1-1' }}%</span>
              </div>
              @if (order.wasteCalculationDate) {
                <div class="waste-date">Calculated: {{ order.wasteCalculationDate | date:'medium' }}</div>
              }
            </mat-card-content>
          </mat-card>
        } @else {
          <mat-card class="mb-3">
            <mat-card-header>
              <mat-card-title>Record Waste</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="waste-form">
                <mat-form-field>
                  <mat-label>Actual Stems Used</mat-label>
                  <input matInput type="number" [formControl]="actualStemsUsedControl" min="0" step="1">
                </mat-form-field>
                <button mat-raised-button color="primary" (click)="recordWaste()" 
                  [disabled]="!actualStemsUsedControl.valid || actualStemsUsedControl.value === null">
                  Submit Waste
                </button>
              </div>
              @if (wasteResult) {
                <div class="waste-result mt-2">
                  <div class="waste-stats">
                    <div><strong>Total Ordered:</strong> {{ wasteResult.totalStemsOrdered }} stems</div>
                    <div><strong>Total Used:</strong> {{ wasteResult.totalStemsUsed }} stems</div>
                    <div>
                      <strong>Waste:</strong>
                      <span [ngClass]="{
                        'waste-low': wasteResult.wasteCategory === 'Low',
                        'waste-medium': wasteResult.wasteCategory === 'Medium',
                        'waste-high': wasteResult.wasteCategory === 'High'
                      }">{{ wasteResult.wastePercentage | number:'1.1-1' }}% ({{ wasteResult.wasteCategory }})</span>
                    </div>
                  </div>
                </div>
              }
            </mat-card-content>
          </mat-card>
        }

        @for (vendorGroup of vendorGroups; track vendorGroup.vendorId) {
          <mat-card class="mb-3">
            <mat-card-header>
              <mat-card-title>{{ vendorGroup.vendorName }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="vendorGroup.items ?? vendorGroup.lineItems ?? []" class="mat-elevation-z2">
                <ng-container matColumnDef="itemName">
                  <th mat-header-cell *matHeaderCellDef>Item</th>
                  <td mat-cell *matCellDef="let item">{{ item.itemName || item.item?.name }}</td>
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
                <strong class="currency">{{ vendorGroup.vendorTotalCost ?? vendorGroup.totalCost ?? 0 | number:'1.2-2' }}</strong>
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

    .waste-form {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .waste-display {
      display: flex;
      justify-content: space-between;
      font-size: 18px;
      padding: 8px;
    }

    .waste-date {
      font-size: 12px;
      color: #666;
      margin-top: 8px;
    }

    .waste-stats {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .export-btn {
      margin-left: 8px;
    }
  `]
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  vendorGroups: VendorOrderGroup[] = [];
  lineItemColumns = ['itemName', 'quantityNeeded', 'bundleInfo', 'quantityOrdered', 'cost'];
  actualStemsUsedControl = new FormControl<number | null>(null);
  wasteResult: WasteSummary | null = null;

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
    if (!this.order) return;
    
    if (this.order.byVendor && this.order.byVendor.length > 0) {
      this.vendorGroups = this.order.byVendor.map(vg => ({
        vendorId: vg.vendorId,
        vendorName: vg.vendorName,
        items: vg.items ?? vg.lineItems ?? [],
        lineItems: vg.items ?? vg.lineItems ?? [],
        vendorTotalCost: vg.vendorTotalCost ?? vg.totalCost ?? 0,
        totalCost: vg.vendorTotalCost ?? vg.totalCost ?? 0
      }));
      return;
    }
    
    if (!this.order?.lineItems) return;

    const vendorMap = new Map<string, VendorOrderGroup>();

    this.order.lineItems.forEach(item => {
      const vendorId = item.vendorId || 'no-vendor';
      const vendorName = item.vendorName ?? item.vendor?.name ?? 'No Vendor';

      if (!vendorMap.has(vendorId)) {
        vendorMap.set(vendorId, {
          vendorId,
          vendorName,
          items: [],
          lineItems: [],
          vendorTotalCost: 0,
          totalCost: 0
        });
      }

      const group = vendorMap.get(vendorId)!;
      group.lineItems!.push(item);
      group.items!.push(item);
      const cost = item.lineTotalCost ?? (item.quantityOrdered * item.costPerUnit);
      group.totalCost = (group.totalCost ?? 0) + cost;
      group.vendorTotalCost = group.totalCost;
    });

    this.vendorGroups = Array.from(vendorMap.values());
  }

  getBundleDisplay(item: any): string {
    return `${item.quantityNeeded} stems`;
  }

  calculateGrandTotal(): number {
    if (this.order?.totalCost !== undefined) return this.order.totalCost;
    return this.vendorGroups.reduce((sum, group) => sum + (group.vendorTotalCost ?? group.totalCost ?? 0), 0);
  }

  downloadCsv() {
    if (this.order) {
      this.orderService.downloadCsv(this.order.id);
    }
  }

  recordWaste() {
    if (this.order && this.actualStemsUsedControl.value !== null) {
      this.orderService.recordWaste(this.order.id, this.actualStemsUsedControl.value).subscribe({
        next: (result) => {
          this.wasteResult = result;
          this.loadOrder(this.order!.id);
        },
        error: (err) => {
          console.error('Error recording waste:', err);
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/orders']);
  }
}
