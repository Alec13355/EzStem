import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { VendorService } from '../../../core/services/vendor.service';
import { Vendor } from '../../../shared/models/api.models';
import { VendorFormComponent } from '../vendor-form/vendor-form.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-vendor-list',
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
    MatProgressSpinnerModule,
    EmptyStateComponent
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Vendors</h1>
        <button mat-raised-button color="primary" (click)="addVendor()">
          <mat-icon>add</mat-icon>
          <span>Add Vendor</span>
        </button>
      </div>

      <mat-form-field class="search-field full-width">
        <mat-label>Search vendors</mat-label>
        <input matInput [(ngModel)]="searchTerm" (input)="onSearchChange()" placeholder="Search by name...">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      @if (loading) {
        <div class="loading-spinner">
          <mat-spinner></mat-spinner>
        </div>
      } @else {
        @if (vendors.length > 0) {
        <table mat-table [dataSource]="vendors" class="mat-elevation-z2">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let vendor">{{ vendor.name }}</td>
          </ng-container>

          <ng-container matColumnDef="contactEmail">
            <th mat-header-cell *matHeaderCellDef>Contact Email</th>
            <td mat-cell *matCellDef="let vendor">{{ vendor.contactEmail || 'N/A' }}</td>
          </ng-container>

          <ng-container matColumnDef="notes">
            <th mat-header-cell *matHeaderCellDef>Notes</th>
            <td mat-cell *matCellDef="let vendor">{{ vendor.notes || '' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let vendor">
              <div class="action-buttons">
                <button mat-icon-button color="primary" class="action-btn" (click)="editVendor(vendor)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" class="action-btn" (click)="deleteVendor(vendor)">
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
            [icon]="'🏪'"
            [title]="'No vendors yet'"
            [message]="'Add your wholesale vendors.'"
            [actionLabel]="'Add Vendor'"
            [actionCallback]="openAddVendorDialog">
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

    table {
      width: 100%;
      margin-bottom: 16px;
    }

    button mat-icon {
      margin-right: 4px;
    }

    .action-btn {
      width: 44px !important;
      height: 44px !important;
      line-height: 44px !important;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }
  `]
})
export class VendorListComponent implements OnInit {
  vendors: Vendor[] = [];
  openAddVendorDialog = () => this.addVendor();
  displayedColumns = ['name', 'contactEmail', 'notes', 'actions'];
  loading = true;
  totalCount = 0;
  pageSize = 10;
  pageNumber = 1;
  searchTerm = '';
  private searchSubject = new Subject<string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private vendorService: VendorService,
    private dialog: MatDialog
  ) {
    this.searchSubject.pipe(
      debounceTime(200),
      distinctUntilChanged()
    ).subscribe(() => {
      this.pageNumber = 1;
      this.loadVendors();
    });
  }

  ngOnInit() {
    this.loadVendors();
  }

  loadVendors() {
    this.loading = true;
    this.vendorService.getVendors(this.pageNumber, this.pageSize)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          this.vendors = response.items ?? [];
          this.totalCount = response.totalCount;
        },
        error: (err) => {
          console.error('Error loading vendors:', err);
        }
      });
  }

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  onPageChange(event: PageEvent) {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadVendors();
  }

  addVendor() {
    const dialogRef = this.dialog.open(VendorFormComponent, {
      width: '600px',
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadVendors();
      }
    });
  }

  editVendor(vendor: Vendor) {
    const dialogRef = this.dialog.open(VendorFormComponent, {
      width: '600px',
      data: vendor
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadVendors();
      }
    });
  }

  deleteVendor(vendor: Vendor) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: { message: `Delete "${vendor.name}"? This cannot be undone.` }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.vendorService.deleteVendor(vendor.id).subscribe({
          next: () => {
            this.loadVendors();
          },
          error: (err) => {
            console.error('Error deleting vendor:', err);
          }
        });
      }
    });
  }
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Delete Vendor</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">Delete</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDeleteDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { message: string }) {}
}
