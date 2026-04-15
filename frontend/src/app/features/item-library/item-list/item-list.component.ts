import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { ItemService } from '../../../core/services/item.service';
import { Item } from '../../../shared/models/api.models';
import { ItemFormComponent } from '../item-form/item-form.component';

@Component({
  selector: 'app-item-list',
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatProgressSpinnerModule
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
        <input matInput [(ngModel)]="searchTerm" (input)="onSearchChange()" placeholder="Search by name...">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      @if (loading) {
        <div class="loading-spinner">
          <mat-spinner></mat-spinner>
        </div>
      } @else {
        <table mat-table [dataSource]="items" class="mat-elevation-z2">
          <ng-container matColumnDef="image">
            <th mat-header-cell *matHeaderCellDef>Image</th>
            <td mat-cell *matCellDef="let item">
              @if (item.imageUrl) {
                <img [src]="item.imageUrl" alt="{{ item.name }}" class="item-image">
              } @else {
                <mat-icon class="item-placeholder">image</mat-icon>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let item">{{ item.name }}</td>
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

        @if (!loading && items.length === 0) {
          <div class="empty-state">
            <mat-icon>search_off</mat-icon>
            <p>{{ searchTerm ? 'No items match your search.' : 'No items yet. Add your first item to get started!' }}</p>
          </div>
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

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 24px;
      color: #9e9e9e;
      gap: 12px;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }

      p {
        font-size: 1rem;
        margin: 0;
      }
    }

    button mat-icon {
      margin-right: 4px;
    }
  `]
})
export class ItemListComponent implements OnInit {
  items: Item[] = [];
  displayedColumns = ['image', 'name', 'costPerStem', 'vendor', 'actions'];
  loading = false;
  totalCount = 0;
  pageSize = 10;
  pageNumber = 1;
  searchTerm = '';
  private searchSubject = new Subject<string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private itemService: ItemService,
    private dialog: MatDialog
  ) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.pageNumber = 1;
      this.loadItems();
    });
  }

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    this.loading = true;
    this.itemService.getItems(this.pageNumber, this.pageSize, this.searchTerm)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          this.items = response.items ?? [];
          this.totalCount = response.totalCount;
        },
        error: (err) => {
          console.error('Error loading items:', err);
        }
      });
  }

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

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
}
