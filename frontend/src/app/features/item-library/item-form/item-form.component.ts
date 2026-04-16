import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatCheckboxModule
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
          <mat-label>Bundle Size</mat-label>
          <input matInput type="number" formControlName="bundleSize" required step="1" min="1">
          @if (form.get('bundleSize')?.hasError('required') && form.get('bundleSize')?.touched) {
            <mat-error>Bundle size is required</mat-error>
          }
          @if (form.get('bundleSize')?.hasError('min')) {
            <mat-error>Bundle size must be at least 1</mat-error>
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

        <div class="image-upload-section">
          <label class="upload-label">Item Photo</label>

          @if (imagePreviewUrl) {
            <div class="image-preview">
              <img [src]="imagePreviewUrl" alt="Item preview" style="max-width:200px; max-height:200px; border-radius:8px; object-fit:cover;">
              <button mat-icon-button type="button" (click)="removeImage()" matTooltip="Remove image">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          }

          <div class="drop-zone"
               [class.drag-over]="isDragging"
               (dragover)="onDragOver($event)"
               (dragleave)="isDragging = false"
               (drop)="onDrop($event)"
               (click)="fileInput.click()">
            <mat-icon>cloud_upload</mat-icon>
            <span>Drop image here or click to browse</span>
            <small>JPG, PNG, WebP · Max 5MB</small>
          </div>

          <input #fileInput type="file" accept="image/jpeg,image/png,image/webp" style="display:none"
                 (change)="onFileSelected($event)">

          @if (isUploading) {
            <mat-progress-bar mode="indeterminate" style="margin-top:8px;"></mat-progress-bar>
          }
          @if (uploadError) {
            <mat-error>{{ uploadError }}</mat-error>
          }
        </div>

        <mat-form-field class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="2"></textarea>
        </mat-form-field>

        <div class="seasonal-section">
          <mat-checkbox formControlName="isSeasonalItem">Seasonal Item?</mat-checkbox>

          @if (form.get('isSeasonalItem')?.value) {
            <div class="month-fields">
              <mat-form-field style="width:48%; margin-right:4%">
                <mat-label>Season Start Month</mat-label>
                <mat-select formControlName="seasonalStartMonth">
                  @for (month of months; track month.value) {
                    <mat-option [value]="month.value">{{ month.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field style="width:48%">
                <mat-label>Season End Month</mat-label>
                <mat-select formControlName="seasonalEndMonth">
                  @for (month of months; track month.value) {
                    <mat-option [value]="month.value">{{ month.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
          }
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      @if (!isEdit) {
        <button mat-stroked-button color="accent" (click)="onSaveAndAddMore()" [disabled]="!form.valid">
          Add & Add More
        </button>
      }
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!form.valid">
        {{ isEdit ? 'Update' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-form-field {
      margin-bottom: 16px;
    }
    .image-upload-section {
      margin-bottom: 16px;
    }
    .upload-label {
      display: block;
      font-size: 12px;
      color: rgba(0,0,0,0.6);
      margin-bottom: 8px;
    }
    .image-preview {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .drop-zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 24px;
      border: 2px dashed #bdbdbd;
      border-radius: 8px;
      cursor: pointer;
      color: #757575;
      transition: border-color 0.2s, background-color 0.2s;
    }
    .drop-zone:hover {
      border-color: #1976d2;
      background-color: #e3f2fd;
      color: #1976d2;
    }
    .drop-zone.drag-over {
      border-color: #1976d2;
      background-color: #bbdefb;
      color: #1976d2;
    }
    .drop-zone mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
    }
    .seasonal-section { margin-bottom: 16px; }
    .month-fields { display: flex; margin-top: 12px; }
  `]
})
export class ItemFormComponent implements OnInit {
  form: FormGroup;
  isEdit = false;
  vendors: Vendor[] = [];
  hasAddedItems = false;
  imagePreviewUrl: string | null = null;
  isDragging = false;
  isUploading = false;
  uploadError: string | null = null;

  readonly months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

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
      bundleSize: [data?.bundleSize || 1, [Validators.required, Validators.min(1)]],
      vendorId: [data?.vendorId || null],
      imageUrl: [data?.imageUrl ?? null],
      notes: [data?.notes || ''],
      isSeasonalItem: [data?.isSeasonalItem ?? false],
      seasonalStartMonth: [data?.seasonalStartMonth ?? null],
      seasonalEndMonth: [data?.seasonalEndMonth ?? null]
    });
  }

  ngOnInit() {
    this.loadVendors();
    this.imagePreviewUrl = this.form.get('imageUrl')?.value ?? null;
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
    this.dialogRef.close(this.hasAddedItems);
  }

  onSaveAndAddMore() {
    if (this.form.valid) {
      const itemData = this.form.value;
      this.itemService.createItem(itemData).subscribe({
        next: () => {
          // Reset form but keep dialog open
          this.form.reset({
            name: '',
            description: '',
            costPerStem: 0,
            bundleSize: 1,
            vendorId: null,
            imageUrl: null,
            notes: '',
            isSeasonalItem: false,
            seasonalStartMonth: null,
            seasonalEndMonth: null
          });
          this.form.markAsPristine();
          this.form.markAsUntouched();
          this.imagePreviewUrl = null;
          // Signal to the list that at least one item was added (so it refreshes on dialog close)
          this.hasAddedItems = true;
        },
        error: (err) => {
          console.error('Error saving item:', err);
        }
      });
    }
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.handleFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.handleFile(file);
  }

  handleFile(file: File): void {
    this.uploadError = null;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.uploadError = 'Only JPG, PNG, and WebP images are allowed.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.uploadError = 'File must be 5MB or less.';
      return;
    }

    const reader = new FileReader();
    reader.onload = e => this.imagePreviewUrl = e.target?.result as string;
    reader.readAsDataURL(file);

    this.isUploading = true;
    this.itemService.uploadImage(file).subscribe({
      next: ({ url }) => {
        this.isUploading = false;
        this.form.patchValue({ imageUrl: url });
        this.imagePreviewUrl = url;
      },
      error: () => {
        this.isUploading = false;
        this.uploadError = 'Upload failed. Please try again.';
      }
    });
  }

  removeImage(): void {
    this.imagePreviewUrl = null;
    this.form.patchValue({ imageUrl: null });
  }
}
