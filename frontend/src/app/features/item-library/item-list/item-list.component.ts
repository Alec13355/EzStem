import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs';
import { ItemService } from '../../../core/services/item.service';
import { VendorService } from '../../../core/services/vendor.service';
import { Item, Vendor } from '../../../shared/models/api.models';
import { ItemFormComponent } from '../item-form/item-form.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-item-list',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    EmptyStateComponent
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Item Library</h1>
        <button mat-raised-button color="primary" (click)="addItem()">
          <mat-icon>add</mat-icon>
          <span>Add Item</span>
        </button>
      </div>

      <mat-form-field class="search-field full-width">
        <mat-label>Search items</mat-label>
        <input matInput [formControl]="searchControl" placeholder="Search by name...">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <div class="filter-row">
        <mat-form-field appearance="outline" style="width:180px">
          <mat-label>Vendor</mat-label>
          <mat-select [formControl]="vendorFilter">
            <mat-option value="">All Vendors</mat-option>
            @for (v of vendors; track v.id) {
              <mat-option [value]="v.id">{{ v.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:160px">
          <mat-label>Seasonal</mat-label>
          <mat-select [formControl]="seasonalFilter">
            <mat-option value="">All Items</mat-option>
            <mat-option value="seasonal">Seasonal Only</mat-option>
            <mat-option value="non-seasonal">Non-Seasonal</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:140px">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="activeFilter">
            <mat-option value="">All</mat-option>
            <mat-option value="active">Active</mat-option>
            <mat-option value="inactive">Inactive</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      @if (vendorFilter.value || seasonalFilter.value || activeFilter.value) {
        <mat-chip-set style="margin-bottom:12px">
          @if (vendorFilter.value) {
            <mat-chip (removed)="vendorFilter.setValue('')">
              Vendor: {{ getVendorName(vendorFilter.value) }}
              <button matChipRemove><mat-icon>cancel</mat-icon></button>
            </mat-chip>
          }
          @if (seasonalFilter.value) {
            <mat-chip (removed)="seasonalFilter.setValue('')">
              {{ seasonalFilter.value === 'seasonal' ? 'Seasonal Only' : 'Non-Seasonal' }}
              <button matChipRemove><mat-icon>cancel</mat-icon></button>
            </mat-chip>
          }
          @if (activeFilter.value) {
            <mat-chip (removed)="activeFilter.setValue('')">
              {{ activeFilter.value === 'active' ? 'Active' : 'Inactive' }}
              <button matChipRemove><mat-icon>cancel</mat-icon></button>
            </mat-chip>
          }
        </mat-chip-set>
      }

      @if (loading) {
        <div class="loading-spinner">
          <mat-spinner></mat-spinner>
        </div>
      } @else {
        @if (filteredItems.length > 0) {
        <table mat-table [dataSource]="filteredItems" class="mat-elevation-z2">
          <ng-container matColumnDef="image">
            <th mat-header-cell *matHeaderCellDef>Image</th>
            <td mat-cell *matCellDef="let item">
              @if (item.imageUrl) {
                <img [src]="item.imageUrl" alt="{{ item.name }}" class="item-image">
              } @else {
                <span style="font-size:24px;" title="No image">🌸</span>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let item">
              <span>{{ item.name }}</span>
              @if (item.isSeasonalItem) {
                <span [class]="'season-chip ' + (isInSeason(item) ? 'in-season' : 'out-season')">
                  {{ isInSeason(item) ? '🌱 In Season' : '❄️ Out of Season' }}
                </span>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="costPerStem">
            <th mat-header-cell *matHeaderCellDef>Cost/Stem</th>
            <td mat-cell *matCellDef="let item">
              <span class="currency">{{ item.costPerStem | currency }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="vendor">
            <th mat-header-cell *matHeaderCellDef>Vendor</th>
            <td mat-cell *matCellDef="let item">{{ item.vendorName || 'N/A' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let item">
              <div class="action-buttons">
                <button mat-icon-button color="primary" (click)="editItem(item)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteItem(item)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <mat-paginator
          [length]="totalCount"
          [pageSize]="pageSize"
          [pageSizeOptions]="[10, 25, 50]"
          (page)="onPageChange($event)">
        </mat-paginator>

        } @else {
          <app-empty-state
            [icon]="'🌺'"
            [title]="'Your item library is empty'"
            [message]="'Add flowers and greenery to your library.'"
            [actionLabel]="'Add Item'"
            [actionCallback]="openAddItemDialog">
          </app-empty-state>
        }
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

    .search-field {
      margin-bottom: 16px;
    }

    .filter-row { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; align-items: center; }

    .item-image {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 4px;
    }

    .item-placeholder {
      color: #ccc;
    }

    table {
      width: 100%;
      margin-bottom: 16px;
    }

    button mat-icon {
      margin-right: 4px;
    }

    .season-chip {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      margin-left: 8px;
      vertical-align: middle;
    }
    .in-season { background: #c8e6c9; color: #2e7d32; }
    .out-season { background: #e3f2fd; color: #1565c0; }
  `]
})
export class ItemListComponent implements OnInit, OnDestroy {
  items: Item[] = [];
  filteredItems: Item[] = [];
  vendors: Vendor[] = [];
  searchControl = new FormControl('');
  vendorFilter = new FormControl('');
  seasonalFilter = new FormControl('');
  activeFilter = new FormControl('');
  openAddItemDialog = () => this.addItem();
  displayedColumns = ['image', 'name', 'costPerStem', 'vendor', 'actions'];
  loading = false;
  totalCount = 0;
  pageSize = 10;
  pageNumber = 1;
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private itemService: ItemService,
    private vendorService: VendorService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.pageNumber = 1;
      this.loadItems();
    });

    this.vendorFilter.valueChanges.pipe(debounceTime(100), takeUntil(this.destroy$))
      .subscribe(() => this.applyClientFilters());
    this.seasonalFilter.valueChanges.pipe(debounceTime(100), takeUntil(this.destroy$))
      .subscribe(() => this.applyClientFilters());
    this.activeFilter.valueChanges.pipe(debounceTime(100), takeUntil(this.destroy$))
      .subscribe(() => this.applyClientFilters());
  }

  ngOnInit() {
    this.loadItems();
    this.vendorService.getVendors(1, 100).subscribe({
      next: (r) => { this.vendors = r.items; }
    });
  }

  loadItems() {
    this.loading = true;
    this.itemService.getItems(this.pageNumber, this.pageSize, this.searchControl.value || '')
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          this.items = response.items ?? [];
          this.totalCount = response.totalCount;
          this.applyClientFilters();
        },
        error: (err) => {
          console.error('Error loading items:', err);
        }
      });
  }

  applyClientFilters() {
    const vendor = this.vendorFilter.value || '';
    const seasonal = this.seasonalFilter.value || '';
    const active = this.activeFilter.value || '';
    this.filteredItems = this.items.filter(item => {
      const matchesVendor = !vendor || item.vendorId === vendor;
      const matchesSeasonal = !seasonal ||
        (seasonal === 'seasonal' && item.isSeasonalItem === true) ||
        (seasonal === 'non-seasonal' && !item.isSeasonalItem);
      const matchesActive = !active ||
        (active === 'active' && item.isActive !== false) ||
        (active === 'inactive' && item.isActive === false);
      return matchesVendor && matchesSeasonal && matchesActive;
    });
  }

  getVendorName(vendorId: string): string {
    return this.vendors.find(v => v.id === vendorId)?.name ?? vendorId;
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  onPageChange(event: PageEvent) {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadItems();
  }

  addItem() {
    const dialogRef = this.dialog.open(ItemFormComponent, {
      width: '600px',
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadItems();
      }
    });
  }

  editItem(item: Item) {
    const dialogRef = this.dialog.open(ItemFormComponent, {
      width: '600px',
      data: item
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadItems();
      }
    });
  }

  deleteItem(item: Item) {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      this.itemService.deleteItem(item.id).subscribe({
        next: () => {
          this.loadItems();
        },
        error: (err) => {
          console.error('Error deleting item:', err);
        }
      });
    }
  }

  isInSeason(item: Item): boolean {
    if (!item.isSeasonalItem) return true;
    const month = new Date().getMonth() + 1;
    if ((item.seasonalStartMonth ?? 1) <= (item.seasonalEndMonth ?? 12)) {
      return month >= (item.seasonalStartMonth ?? 1) && month <= (item.seasonalEndMonth ?? 12);
    }
    return month >= (item.seasonalStartMonth ?? 1) || month <= (item.seasonalEndMonth ?? 12);
  }
}
