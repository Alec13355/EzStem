import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { EventService } from '../../core/services/event.service';
import { PnlEventItem, PnlResponse } from '../../shared/models/api.models';

@Component({
  selector: 'app-pnl',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  template: `
    <div class="pnl-container">
      <h1>Profit & Loss</h1>

      @if (loading()) {
        <div class="loading"><mat-spinner></mat-spinner></div>
      } @else if (pnl()) {
        <!-- Summary cards -->
        <div class="summary-grid">
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-label">Expected Revenue</div>
              <div class="summary-value">{{ fmt(pnl()!.summary.totalExpectedRevenue) }}</div>
              <div class="summary-sub">All active events</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="summary-card accent">
            <mat-card-content>
              <div class="summary-label">Expected Profit</div>
              <div class="summary-value">{{ fmt(pnl()!.summary.totalExpectedProfit) }}</div>
              <div class="summary-sub">Revenue minus flower budget</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-label">Realized Revenue</div>
              <div class="summary-value">{{ fmt(pnl()!.summary.totalActualRevenue) }}</div>
              <div class="summary-sub">{{ pnl()!.summary.completedEventsCount }} completed event(s)</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="summary-card" [class.accent]="pnl()!.summary.totalActualProfit >= 0" [class.warn]="pnl()!.summary.totalActualProfit < 0">
            <mat-card-content>
              <div class="summary-label">Realized Profit</div>
              <div class="summary-value">{{ fmt(pnl()!.summary.totalActualProfit) }}</div>
              <div class="summary-sub">Completed events only</div>
            </mat-card-content>
          </mat-card>
        </div>

        <mat-tab-group>
          <!-- Expected profits tab -->
          <mat-tab label="Expected Future Profits">
            <div class="tab-content">
              <p class="tab-desc">
                All events, assuming the profit multiple is met on goods costs.
                Completed events are included so you can compare expected vs. actual.
              </p>
              @if (pnl()!.all.length === 0) {
                <p class="empty">No events yet.</p>
              } @else {
                <table mat-table [dataSource]="pnl()!.all" class="pnl-table mat-elevation-z1">
                  <ng-container matColumnDef="event">
                    <th mat-header-cell *matHeaderCellDef>Event</th>
                    <td mat-cell *matCellDef="let row">
                      <div class="event-name">{{ row.eventName }}
                        @if (row.isCompleted) {
                          <span class="badge completed">Completed</span>
                        }
                      </div>
                      <div class="event-date">{{ row.eventDate | date:'mediumDate' }}</div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="revenue">
                    <th mat-header-cell *matHeaderCellDef>Revenue</th>
                    <td mat-cell *matCellDef="let row">{{ fmt(row.totalRevenue) }}</td>
                  </ng-container>

                  <ng-container matColumnDef="flowerCost">
                    <th mat-header-cell *matHeaderCellDef>Flower Budget</th>
                    <td mat-cell *matCellDef="let row">{{ fmt(row.expectedFlowerCost) }}</td>
                  </ng-container>

                  <ng-container matColumnDef="supplyCost">
                    <th mat-header-cell *matHeaderCellDef>Supplies</th>
                    <td mat-cell *matCellDef="let row">
                      @if (row.totalSupplyCost > 0) {
                        <span class="supply-cost">{{ fmt(row.totalSupplyCost) }}</span>
                      } @else {
                        <span style="color:#bbb">—</span>
                      }
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="expectedProfit">
                    <th mat-header-cell *matHeaderCellDef>Expected Profit</th>
                    <td mat-cell *matCellDef="let row" [class.profit-positive]="row.expectedProfit >= 0" [class.profit-negative]="row.expectedProfit < 0">
                      {{ fmt(row.expectedProfit) }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let row">{{ row.status }}</td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="expectedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: expectedColumns;" [class.row-completed]="row.isCompleted"></tr>
                </table>
              }
            </div>
          </mat-tab>

          <!-- Actual profits tab -->
          <mat-tab label="Actual Realized Profits">
            <div class="tab-content">
              <p class="tab-desc">
                Only events you have manually marked as complete, using the actual costs you entered.
              </p>
              @if (pnl()!.completed.length === 0) {
                <p class="empty">No completed events yet. Mark an event as complete from its event page.</p>
              } @else {
                <table mat-table [dataSource]="pnl()!.completed" class="pnl-table mat-elevation-z1">
                  <ng-container matColumnDef="event">
                    <th mat-header-cell *matHeaderCellDef>Event</th>
                    <td mat-cell *matCellDef="let row">
                      <div class="event-name">{{ row.eventName }}</div>
                      <div class="event-date">Completed {{ row.completedAt | date:'mediumDate' }}</div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="revenue">
                    <th mat-header-cell *matHeaderCellDef>Revenue</th>
                    <td mat-cell *matCellDef="let row">{{ fmt(row.totalRevenue) }}</td>
                  </ng-container>

                  <ng-container matColumnDef="actualCost">
                    <th mat-header-cell *matHeaderCellDef>Actual Cost</th>
                    <td mat-cell *matCellDef="let row">{{ fmt(row.actualCost ?? 0) }}</td>
                  </ng-container>

                  <ng-container matColumnDef="actualSupplyCost">
                    <th mat-header-cell *matHeaderCellDef>Supplies</th>
                    <td mat-cell *matCellDef="let row">
                      @if (row.totalSupplyCost > 0) {
                        <span class="supply-cost">{{ fmt(row.totalSupplyCost) }}</span>
                      } @else {
                        <span style="color:#bbb">—</span>
                      }
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actualProfit">
                    <th mat-header-cell *matHeaderCellDef>Actual Profit</th>
                    <td mat-cell *matCellDef="let row" [class.profit-positive]="(row.actualProfit ?? 0) >= 0" [class.profit-negative]="(row.actualProfit ?? 0) < 0">
                      {{ fmt(row.actualProfit ?? 0) }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="margin">
                    <th mat-header-cell *matHeaderCellDef>Margin</th>
                    <td mat-cell *matCellDef="let row">
                      {{ row.totalRevenue > 0 ? (((row.actualProfit ?? 0) / row.totalRevenue) * 100 | number:'1.1-1') + '%' : '—' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="receipt">
                    <th mat-header-cell *matHeaderCellDef>Receipt</th>
                    <td mat-cell *matCellDef="let row">
                      @if (row.receiptUrl) {
                        <a [href]="row.receiptUrl" target="_blank" rel="noopener">
                          <mat-icon style="font-size:20px;height:20px;width:20px;vertical-align:middle">receipt</mat-icon>
                        </a>
                      } @else {
                        <span style="color:#bbb">—</span>
                      }
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="actualColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: actualColumns;"></tr>
                </table>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      } @else if (error()) {
        <p class="error">{{ error() }}</p>
      }
    </div>
  `,
  styles: [`
    .pnl-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    h1 { margin-bottom: 24px; }

    .loading {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .summary-card mat-card-content {
      padding: 16px;
    }

    .summary-label {
      font-size: 13px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: .5px;
    }

    .summary-value {
      font-size: 28px;
      font-weight: 700;
      margin: 4px 0;
    }

    .summary-sub {
      font-size: 12px;
      color: #888;
    }

    .summary-card.accent { border-top: 3px solid #43a047; }
    .summary-card.warn   { border-top: 3px solid #e53935; }

    .tab-content {
      padding: 24px 0;
    }

    .tab-desc {
      color: #555;
      margin: 0 0 16px;
    }

    .pnl-table {
      width: 100%;
    }

    .event-name {
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .event-date {
      font-size: 12px;
      color: #888;
    }

    .badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 500;
    }

    .badge.completed {
      background: #e8f5e9;
      color: #388e3c;
    }

    .profit-positive { color: #2e7d32; font-weight: 600; }
    .profit-negative { color: #c62828; font-weight: 600; }

    .supply-cost { color: #e65100; font-weight: 500; }

    .row-completed td { opacity: 0.75; }

    .empty {
      text-align: center;
      color: #888;
      font-style: italic;
      padding: 32px;
    }

    .error { color: #c62828; padding: 16px; }
  `]
})
export class PnlComponent implements OnInit {
  loading = signal(false);
  pnl = signal<PnlResponse | null>(null);
  error = signal<string | null>(null);

  expectedColumns = ['event', 'revenue', 'flowerCost', 'supplyCost', 'expectedProfit', 'status'];
  actualColumns = ['event', 'revenue', 'actualCost', 'actualSupplyCost', 'actualProfit', 'margin', 'receipt'];

  constructor(private eventService: EventService) {}

  ngOnInit() {
    this.loading.set(true);
    this.eventService.getPnl().subscribe({
      next: (data) => {
        this.pnl.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load P&L data.');
        this.loading.set(false);
      }
    });
  }

  fmt(value: number): string {
    return '$' + (value ?? 0).toFixed(2);
  }
}
