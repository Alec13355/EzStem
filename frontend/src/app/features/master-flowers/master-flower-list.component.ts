import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MasterFlowerService } from '../../core/services/master-flower.service';
import { MasterFlower, CreateMasterFlowerRequest } from '../../shared/models/api.models';

@Component({
  selector: 'app-master-flower-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatTableModule, MatSelectModule, MatCardModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatExpansionModule, MatCheckboxModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Master Flower List</h1>
        <div class="header-actions">
          <input #fileInput type="file" accept=".pdf" style="display: none" (change)="onFileSelected($event)">
          <button mat-raised-button color="accent" (click)="fileInput.click()" [disabled]="uploading()">
            <mat-icon>upload_file</mat-icon>
            {{ uploading() ? 'Uploading...' : 'Upload PDF' }}
          </button>
          <button mat-raised-button color="primary" (click)="toggleAddForm()">
            <mat-icon>{{ showAddForm() ? 'close' : 'add' }}</mat-icon>
            {{ showAddForm() ? 'Cancel' : 'Add Flower' }}
          </button>
        </div>
      </div>

      @if (uploading()) {
        <div class="upload-status">
          <mat-spinner diameter="24"></mat-spinner>
          <span>Processing PDF...</span>
        </div>
      }

      @if (showAddForm()) {
        <mat-card class="add-form">
          <mat-card-content>
            <h3>New Flower</h3>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Name</mat-label>
                <input matInput [(ngModel)]="addForm.name">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Unit</mat-label>
                <mat-select [(ngModel)]="addForm.unit">
                  <mat-option value="Bunch">Bunch</mat-option>
                  <mat-option value="Stem">Stem</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Cost per Unit</mat-label>
                <input matInput [(ngModel)]="addForm.costPerUnit" type="number" step="0.01">
                <span matSuffix>$</span>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Units per Bunch</mat-label>
                <input matInput [(ngModel)]="addForm.unitsPerBunch" type="number">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Category</mat-label>
                <input matInput [(ngModel)]="addForm.category">
              </mat-form-field>
              <button mat-raised-button color="primary" (click)="addFlower()">Save</button>
            </div>
          </mat-card-content>
        </mat-card>
      }

      @if (loading()) {
        <div class="loading-spinner">
          <mat-spinner></mat-spinner>
        </div>
      } @else {
        @for (category of categories(); track category) {
          <mat-card class="category-section">
            <mat-card-header>
              <mat-card-title>{{ category }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="flowersByCategory()[category]" class="flowers-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let flower">
                    @if (editingId() === flower.id) {
                      <input matInput [(ngModel)]="editForm.name" class="inline-edit">
                    } @else {
                      {{ flower.name }}
                    }
                  </td>
                </ng-container>

                <ng-container matColumnDef="unit">
                  <th mat-header-cell *matHeaderCellDef>Unit</th>
                  <td mat-cell *matCellDef="let flower">
                    @if (editingId() === flower.id) {
                      <mat-select [(ngModel)]="editForm.unit" class="inline-edit">
                        <mat-option value="Bunch">Bunch</mat-option>
                        <mat-option value="Stem">Stem</mat-option>
                      </mat-select>
                    } @else {
                      {{ flower.unit }}
                    }
                  </td>
                </ng-container>

                <ng-container matColumnDef="costPerUnit">
                  <th mat-header-cell *matHeaderCellDef>Cost/Unit</th>
                  <td mat-cell *matCellDef="let flower">
                    @if (editingId() === flower.id) {
                      <input matInput [(ngModel)]="editForm.costPerUnit" type="number" step="0.01" class="inline-edit">
                    } @else {
                      {{ formatCurrency(flower.costPerUnit) }}
                    }
                  </td>
                </ng-container>

                <ng-container matColumnDef="unitsPerBunch">
                  <th mat-header-cell *matHeaderCellDef>Units/Bunch</th>
                  <td mat-cell *matCellDef="let flower">
                    @if (editingId() === flower.id) {
                      <input matInput [(ngModel)]="editForm.unitsPerBunch" type="number" class="inline-edit">
                    } @else {
                      {{ flower.unitsPerBunch }}
                    }
                  </td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let flower">
                    @if (editingId() === flower.id) {
                      <button mat-icon-button (click)="saveEdit(flower.id)" title="Save">
                        <mat-icon>save</mat-icon>
                      </button>
                      <button mat-icon-button (click)="cancelEdit()" title="Cancel">
                        <mat-icon>cancel</mat-icon>
                      </button>
                    } @else {
                      <button mat-icon-button (click)="startEdit(flower)" title="Edit">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" (click)="deleteFlower(flower.id)" title="Delete">
                        <mat-icon>delete</mat-icon>
                      </button>
                    }
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </mat-card-content>
          </mat-card>
        }

        @if (flowers().length === 0) {
          <div class="empty-state">
            <p>No flowers in your master list yet.</p>
            <p>Add flowers manually or upload a PDF to get started.</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header h1 {
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .upload-status {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: #e3f2fd;
      border-radius: 4px;
      margin-bottom: 24px;
    }

    .add-form {
      margin-bottom: 24px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      align-items: center;
    }

    .form-row mat-form-field {
      flex: 1;
      min-width: 150px;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .category-section {
      margin-bottom: 24px;
    }

    .flowers-table {
      width: 100%;
    }

    .inline-edit {
      width: 100%;
      border: 1px solid #ccc;
      padding: 4px;
      border-radius: 4px;
    }

    .empty-state {
      text-align: center;
      padding: 64px 24px;
      color: #666;
    }

    .empty-state p {
      margin: 8px 0;
    }
  `]
})
export class MasterFlowerListComponent implements OnInit {
  flowers = signal<MasterFlower[]>([]);
  loading = signal(false);
  uploading = signal(false);
  
  categories = computed(() => {
    const cats = new Set(this.flowers().map(f => f.category));
    return Array.from(cats).sort();
  });
  
  flowersByCategory = computed(() => {
    const grouped: Record<string, MasterFlower[]> = {};
    for (const f of this.flowers()) {
      if (!grouped[f.category]) grouped[f.category] = [];
      grouped[f.category].push(f);
    }
    return grouped;
  });
  
  showAddForm = signal(false);
  editingId = signal<string | null>(null);
  
  editForm: { name: string; unit: 'Bunch' | 'Stem'; costPerUnit: number; unitsPerBunch: number; category: string } = {
    name: '', unit: 'Bunch', costPerUnit: 0, unitsPerBunch: 10, category: ''
  };
  
  addForm: CreateMasterFlowerRequest = {
    name: '', unit: 'Bunch', costPerUnit: 0, unitsPerBunch: 10, category: ''
  };

  displayedColumns = ['name', 'unit', 'costPerUnit', 'unitsPerBunch', 'actions'];
  
  constructor(
    private masterFlowerService: MasterFlowerService,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit() {
    this.loadFlowers();
  }
  
  loadFlowers() {
    this.loading.set(true);
    this.masterFlowerService.getAll().subscribe({
      next: (flowers) => {
        this.flowers.set(flowers);
        this.loading.set(false);
      },
      error: (err) => {
        this.snackBar.open('Failed to load flowers', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }
  
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.[0]) return;
    const file = input.files[0];
    
    this.uploading.set(true);
    this.masterFlowerService.importFromPdf(file).subscribe({
      next: (result) => {
        this.uploading.set(false);
        const msg = result.errors.length > 0 
          ? `Imported ${result.imported}, skipped ${result.skipped}. Errors: ${result.errors.join(', ')}`
          : `Imported ${result.imported} flowers, skipped ${result.skipped}`;
        this.snackBar.open(msg, 'Close', { duration: 5000 });
        this.loadFlowers();
        input.value = '';
      },
      error: (err) => {
        this.uploading.set(false);
        this.snackBar.open('PDF import failed', 'Close', { duration: 3000 });
        input.value = '';
      }
    });
  }

  toggleAddForm() {
    this.showAddForm.update(v => !v);
    if (this.showAddForm()) {
      this.addForm = { name: '', unit: 'Bunch', costPerUnit: 0, unitsPerBunch: 10, category: '' };
    }
  }

  addFlower() {
    if (!this.addForm.name || !this.addForm.category || this.addForm.costPerUnit <= 0 || this.addForm.unitsPerBunch <= 0) {
      this.snackBar.open('Please fill all fields with valid values', 'Close', { duration: 3000 });
      return;
    }

    this.masterFlowerService.create(this.addForm).subscribe({
      next: (flower) => {
        this.flowers.update(f => [...f, flower]);
        this.snackBar.open('Flower added successfully', 'Close', { duration: 3000 });
        this.toggleAddForm();
      },
      error: (err) => {
        this.snackBar.open('Failed to add flower', 'Close', { duration: 3000 });
      }
    });
  }

  startEdit(flower: MasterFlower) {
    this.editingId.set(flower.id);
    this.editForm = {
      name: flower.name,
      unit: flower.unit,
      costPerUnit: flower.costPerUnit,
      unitsPerBunch: flower.unitsPerBunch,
      category: flower.category
    };
  }

  saveEdit(id: string) {
    this.masterFlowerService.update(id, this.editForm).subscribe({
      next: (updatedFlower) => {
        this.flowers.update(f => f.map(flower => flower.id === id ? updatedFlower : flower));
        this.snackBar.open('Flower updated successfully', 'Close', { duration: 3000 });
        this.editingId.set(null);
      },
      error: (err) => {
        this.snackBar.open('Failed to update flower', 'Close', { duration: 3000 });
      }
    });
  }

  cancelEdit() {
    this.editingId.set(null);
  }

  deleteFlower(id: string) {
    if (!confirm('Delete this flower from the master list?')) return;

    this.masterFlowerService.delete(id).subscribe({
      next: () => {
        this.flowers.update(f => f.filter(flower => flower.id !== id));
        this.snackBar.open('Flower deleted successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open('Failed to delete flower', 'Close', { duration: 3000 });
      }
    });
  }

  formatCurrency(value: number): string {
    return '$' + value.toFixed(2);
  }
}
