import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Item } from '../../models/api.models';

@Component({
  selector: 'app-item-picker-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatListModule, MatFormFieldModule, MatInputModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Select Replacement Item</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" style="width:100%; margin-bottom:16px">
        <mat-label>Search items</mat-label>
        <input matInput [(ngModel)]="search" placeholder="Type to filter...">
      </mat-form-field>
      <mat-nav-list>
        @for (item of filteredItems; track item.id) {
          <mat-list-item (click)="select(item)" [class.selected]="item.id === data.currentItemId">
            <span matListItemTitle>{{ item.name }}</span>
            <span matListItemLine>{{ item.costPerStem | currency }}/stem · {{ item.vendorName ?? 'No vendor' }}</span>
          </mat-list-item>
        }
      </mat-nav-list>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
    </mat-dialog-actions>
  `,
  styles: ['.selected { background: #e3f2fd; }']
})
export class ItemPickerDialogComponent {
  search = '';

  get filteredItems(): Item[] {
    return this.data.items.filter(i => i.name.toLowerCase().includes(this.search.toLowerCase()));
  }

  constructor(
    public dialogRef: MatDialogRef<ItemPickerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { currentItemId: string; items: Item[] }
  ) {}

  select(item: Item): void {
    this.dialogRef.close(item);
  }
}
