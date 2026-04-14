import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { VendorService } from '../../../core/services/vendor.service';
import { Vendor } from '../../../shared/models/api.models';

@Component({
  selector: 'app-vendor-list',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Vendors</h1>
      </div>

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

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .header {
      margin-bottom: 24px;
    }

    table {
      width: 100%;
    }
  `]
})
export class VendorListComponent implements OnInit {
  vendors: Vendor[] = [];
  displayedColumns = ['name', 'contactEmail', 'notes'];

  constructor(private vendorService: VendorService) {}

  ngOnInit() {
    this.loadVendors();
  }

  loadVendors() {
    this.vendorService.getVendors(1, 100).subscribe({
      next: (response) => {
        this.vendors = response.items;
      },
      error: (err) => {
        console.error('Error loading vendors:', err);
      }
    });
  }
}
