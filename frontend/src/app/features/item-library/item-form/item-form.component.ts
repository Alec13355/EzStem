import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ItemService } from '../../../core/services/item.service';
import { VendorService } from '../../../core/services/vendor.service';
import { Item, Vendor } from '../../../shared/models/api.models';

@Component({
  selector: 'app-item-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit Item' : 'Add Item' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" required>
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Cost Per Stem</mat-label>
          <input matInput type="number" formControlName="costPerStem" required step="0.01" min="0.01">
          @if (form.get('costPerStem')?.hasError('required') && form.get('costPerStem')?.touched) {
            <mat-error>Cost per stem is required</mat-error>
          }
          @if (form.get('costPerStem')?.hasError('min')) {
            <mat-error>Cost must be at least $0.01</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Vendor</mat-label>
          <mat-select formControlName="vendorId">
            <mat-option [value]="null">None</mat-option>
            @for (vendor of vendors; track vendor.id) {
              <mat-option [value]="vendor.id">{{ vendor.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Image URL</mat-label>
          <input matInput formControlName="imageUrl">
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="2"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!form.valid">
        {{ isEdit ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-form-field {
      margin-bottom: 16px;
    }
  `]
})
export class ItemFormComponent implements OnInit {
  form: FormGroup;
  isEdit = false;
  vendors: Vendor[] = [];

  constructor(
    private fb: FormBuilder,
    private itemService: ItemService,
    private vendorService: VendorService,
    public dialogRef: MatDialogRef<ItemFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Item | null
  ) {
    this.isEdit = !!data;
    this.form = this.fb.group({
      name: [data?.name || '', Validators.required],
      description: [data?.description || ''],
      costPerStem: [data?.costPerStem || 0, [Validators.required, Validators.min(0.01)]],
      vendorId: [data?.vendorId || null],
      imageUrl: [data?.imageUrl || ''],
      notes: [data?.notes || '']
    });
  }

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

  onSave() {
    if (this.form.valid) {
      const itemData = this.form.value;
      const request = this.isEdit
        ? this.itemService.updateItem(this.data!.id, itemData)
        : this.itemService.createItem(itemData);

      request.subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Error saving item:', err);
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
