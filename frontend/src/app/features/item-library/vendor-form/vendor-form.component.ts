import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { VendorService } from '../../../core/services/vendor.service';
import { Vendor } from '../../../shared/models/api.models';

@Component({
  selector: 'app-vendor-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit Vendor' : 'Add Vendor' }}</h2>
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
          <mat-label>Contact Email</mat-label>
          <input matInput type="email" formControlName="contactEmail">
          @if (form.get('contactEmail')?.hasError('email')) {
            <mat-error>Please enter a valid email address</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!form.valid || loading">
        {{ isEdit ? 'Update' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-form-field {
      margin-bottom: 16px;
    }
  `]
})
export class VendorFormComponent {
  form: FormGroup;
  isEdit = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private vendorService: VendorService,
    public dialogRef: MatDialogRef<VendorFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Vendor | null
  ) {
    this.isEdit = !!data;
    this.form = this.fb.group({
      name: [data?.name || '', Validators.required],
      contactEmail: [data?.contactEmail || '', Validators.email],
      notes: [data?.notes || '']
    });
  }

  onSave() {
    if (this.form.valid) {
      this.loading = true;
      const vendorData = this.form.value;
      const request = this.isEdit
        ? this.vendorService.updateVendor(this.data!.id, vendorData)
        : this.vendorService.createVendor(vendorData);

      request.subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Error saving vendor:', err);
          this.loading = false;
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
