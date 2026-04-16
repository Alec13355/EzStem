import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { RecipeService } from '../../../core/services/recipe.service';
import { ItemService } from '../../../core/services/item.service';
import { Recipe, Item, RecipeItem, ScaleRecipeResponse, UpdateRecipeItemRequest } from '../../../shared/models/api.models';
import { ItemPickerDialogComponent } from '../../../shared/components/item-picker-dialog/item-picker-dialog.component';

@Component({
  selector: 'app-recipe-detail',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSelectModule,
    MatCardModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDialogModule,
    ItemPickerDialogComponent
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>{{ isNew ? 'New Recipe' : recipe?.name }}</h1>
        <button mat-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          Back
        </button>
      </div>

      <mat-card class="mb-3">
        <mat-card-content>
          <form [formGroup]="recipeForm">
            <mat-form-field class="full-width">
              <mat-label>Recipe Name</mat-label>
              <input matInput formControlName="name" required>
            </mat-form-field>

            <mat-form-field class="full-width">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="2"></textarea>
            </mat-form-field>

            <mat-form-field class="full-width">
              <mat-label>Labor Cost</mat-label>
              <input matInput type="number" formControlName="laborCost" required step="0.01" min="0">
            </mat-form-field>

            <button mat-raised-button color="primary" (click)="saveRecipe()" [disabled]="!recipeForm.valid">
              Save Recipe
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      @if (!isNew && recipe) {
        <mat-card class="mb-3">
          <mat-card-header>
            <mat-card-title>Recipe Items</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="add-item-section mb-2">
              <mat-form-field style="width: 300px; margin-right: 16px;">
                <mat-label>Item</mat-label>
                <mat-select [(value)]="selectedItemId">
                  @for (item of availableItems; track item.id) {
                    <mat-option [value]="item.id">{{ item.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field style="width: 120px; margin-right: 16px;">
                <mat-label>Quantity</mat-label>
                <input matInput type="number" [(ngModel)]="newItemQuantity" min="1" step="1">
              </mat-form-field>

              <button mat-raised-button color="accent" (click)="addItemToRecipe()">
                <mat-icon>add</mat-icon>
                Add Item
              </button>
            </div>

            <table mat-table [dataSource]="recipe.recipeItems || []" class="mat-elevation-z2">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Item Name</th>
                <td mat-cell *matCellDef="let item">
                  {{ item.itemName || item.item?.name }}
                  @if (!isRecipeItemInSeason(item)) {
                    <span
                      [matTooltip]="(item.itemName || item.item?.name) + ' may be out of season in ' + getCurrentMonthName() + '. Check availability with your vendor.'"
                      style="cursor:help; margin-left:4px">⚠️</span>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="quantity">
                <th mat-header-cell *matHeaderCellDef>Quantity</th>
                <td mat-cell *matCellDef="let item">{{ item.quantity }}</td>
              </ng-container>

              <ng-container matColumnDef="costPerStem">
                <th mat-header-cell *matHeaderCellDef>Cost/Stem</th>
                <td mat-cell *matCellDef="let item">
                  <span class="currency">{{ item.costPerStem | number:'1.2-2' }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="lineTotal">
                <th mat-header-cell *matHeaderCellDef>Line Total</th>
                <td mat-cell *matCellDef="let item">
                  <span class="currency">{{ (item.quantity * item.costPerStem) | number:'1.2-2' }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let item">
                  <button mat-icon-button matTooltip="Swap item" (click)="swapItem(item)">
                    <mat-icon>swap_horiz</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="removeItem(item)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="itemColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: itemColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Cost Summary</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="cost-summary">
              <div class="cost-row">
                <span>Items Cost:</span>
                <span class="currency">{{ calculateItemsCost() | number:'1.2-2' }}</span>
              </div>
              <div class="cost-row">
                <span>Labor Cost:</span>
                <span class="currency">{{ recipe.laborCost | number:'1.2-2' }}</span>
              </div>
              <div class="cost-row total">
                <strong>Total Cost:</strong>
                <strong class="currency">{{ calculateTotalCost() | number:'1.2-2' }}</strong>
              </div>
            </div>

            <div class="scale-section mt-2">
              <mat-form-field style="width: 150px; margin-right: 16px;">
                <mat-label>Scale Factor</mat-label>
                <input matInput type="number" [(ngModel)]="scaleFactor" min="1" step="1" value="1">
              </mat-form-field>
              <button mat-raised-button (click)="scaleRecipe()" [disabled]="isScaling()">
                Scale Recipe
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        @if (scaledPreview()) {
          <mat-card class="mt-3">
            <mat-card-header>
              <mat-card-title>Scaled Preview (×{{ scaledPreview()!.scaleFactor }})</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="scaledPreview()!.scaledItems" class="mat-elevation-z2 mb-3">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Item Name</th>
                  <td mat-cell *matCellDef="let item">{{ item.itemName || item.item?.name }}</td>
                </ng-container>

                <ng-container matColumnDef="quantity">
                  <th mat-header-cell *matHeaderCellDef>Scaled Qty</th>
                  <td mat-cell *matCellDef="let item">{{ item.quantity | number:'1.1-2' }}</td>
                </ng-container>

                <ng-container matColumnDef="lineTotal">
                  <th mat-header-cell *matHeaderCellDef>Line Total</th>
                  <td mat-cell *matCellDef="let item">
                    <span class="currency">{{ (item.lineTotal ?? (item.quantity * item.costPerStem)) | number:'1.2-2' }}</span>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="scaledItemColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: scaledItemColumns;"></tr>
              </table>

              <div class="cost-summary">
                <div class="cost-row">
                  <span>Items Cost:</span>
                  <span class="currency">{{ scaledPreview()!.totalItemsCost | number:'1.2-2' }}</span>
                </div>
                <div class="cost-row">
                  <span>Labor Cost:</span>
                  <span class="currency">{{ scaledPreview()!.laborCost | number:'1.2-2' }}</span>
                </div>
                <div class="cost-row total">
                  <strong>Total Cost:</strong>
                  <strong class="currency">{{ scaledPreview()!.totalCost | number:'1.2-2' }}</strong>
                </div>
              </div>

              <button mat-stroked-button (click)="clearPreview()" class="mt-2">
                <mat-icon>clear</mat-icon>
                Clear Preview
              </button>
            </mat-card-content>
          </mat-card>
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

    .add-item-section {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
    }

    table {
      width: 100%;
    }

    .cost-summary {
      font-size: 16px;
    }

    .cost-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }

    .cost-row.total {
      border-top: 2px solid #333;
      border-bottom: none;
      font-size: 18px;
      margin-top: 8px;
      padding-top: 16px;
    }

    .scale-section {
      display: flex;
      align-items: center;
    }
  `]
})
export class RecipeDetailComponent implements OnInit {
  recipe: Recipe | null = null;
  scaledPreview = signal<ScaleRecipeResponse | null>(null);
  isScaling = signal(false);
  recipeForm: FormGroup;
  isNew = false;
  availableItems: Item[] = [];
  selectedItemId: string = '';
  newItemQuantity = 1;
  scaleFactor = 1;
  itemColumns = ['name', 'quantity', 'costPerStem', 'lineTotal', 'actions'];
  scaledItemColumns = ['name', 'quantity', 'lineTotal'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private recipeService: RecipeService,
    private itemService: ItemService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.recipeForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      laborCost: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.isNew = id === 'new';

    if (!this.isNew && id) {
      this.loadRecipe(id);
    }

    this.loadItems();
  }

  loadRecipe(id: string) {
    this.recipeService.getRecipe(id).subscribe({
      next: (recipe) => {
        this.recipe = recipe;
        this.recipeForm.patchValue({
          name: recipe.name,
          description: recipe.description,
          laborCost: recipe.laborCost
        });
      },
      error: (err) => {
        console.error('Error loading recipe:', err);
      }
    });
  }

  loadItems() {
    this.itemService.getItems(1, 100).subscribe({
      next: (response) => {
        this.availableItems = response.items;
      },
      error: (err) => {
        console.error('Error loading items:', err);
      }
    });
  }

  saveRecipe() {
    if (this.recipeForm.valid) {
      const recipeData = this.recipeForm.value;
      const request = this.isNew
        ? this.recipeService.createRecipe(recipeData)
        : this.recipeService.updateRecipe(this.recipe!.id, recipeData);

      request.subscribe({
        next: (recipe) => {
          if (this.isNew) {
            this.router.navigate(['/recipes', recipe.id]);
          } else {
            this.loadRecipe(this.recipe!.id);
          }
        },
        error: (err) => {
          console.error('Error saving recipe:', err);
        }
      });
    }
  }

  addItemToRecipe() {
    if (this.selectedItemId && this.recipe) {
      this.recipeService.addItemToRecipe(this.recipe.id, this.selectedItemId, this.newItemQuantity).subscribe({
        next: () => {
          this.loadRecipe(this.recipe!.id);
          this.selectedItemId = '';
          this.newItemQuantity = 1;
        },
        error: (err) => {
          console.error('Error adding item:', err);
        }
      });
    }
  }

  removeItem(item: RecipeItem) {
    if (this.recipe) {
      this.recipeService.removeItemFromRecipe(this.recipe.id, item.itemId).subscribe({
        next: () => {
          this.loadRecipe(this.recipe!.id);
        },
        error: (err) => {
          console.error('Error removing item:', err);
        }
      });
    }
  }

  calculateItemsCost(): number {
    if (!this.recipe?.recipeItems) return 0;
    return this.recipe.recipeItems.reduce((sum, item) => sum + (item.quantity * item.costPerStem), 0);
  }

  calculateTotalCost(): number {
    return this.calculateItemsCost() + (this.recipe?.laborCost || 0);
  }

  scaleRecipe() {
    if (!this.recipe || !this.scaleFactor) {
      this.scaledPreview.set(null);
      return;
    }
    if (this.scaleFactor > 0) {
      this.isScaling.set(true);
      this.recipeService.scaleRecipe(this.recipe.id, Math.floor(this.scaleFactor)).subscribe({
        next: (preview) => {
          this.scaledPreview.set(preview);
          this.isScaling.set(false);
        },
        error: (err) => {
          console.error('Error scaling recipe:', err);
          this.isScaling.set(false);
          this.snackBar.open('Failed to scale recipe. Please try again.', 'Dismiss', { duration: 4000 });
        }
      });
    }
  }

  clearPreview() {
    this.scaledPreview.set(null);
    this.scaleFactor = 1;
  }

  goBack() {
    this.router.navigate(['/recipes']);
  }

  async swapItem(recipeItem: RecipeItem): Promise<void> {
    const dialogRef = this.dialog.open(ItemPickerDialogComponent, {
      width: '480px',
      data: { currentItemId: recipeItem.itemId, items: this.availableItems }
    });
    const selected = await firstValueFrom(dialogRef.afterClosed());
    if (!selected || selected.id === recipeItem.itemId) return;

    const request: UpdateRecipeItemRequest = {
      itemId: selected.id,
      costPerStem: selected.costPerStem
    };

    this.recipeService.updateRecipeItem(this.recipe!.id, recipeItem.id, request).subscribe({
      next: () => {
        recipeItem.itemId = selected.id;
        recipeItem.itemName = selected.name;
        recipeItem.costPerStem = selected.costPerStem;
        this.snackBar.open(`Swapped to ${selected.name}`, 'Dismiss', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to swap item', 'Dismiss', { duration: 3000 })
    });
  }

  isRecipeItemInSeason(recipeItem: RecipeItem): boolean {
    const libraryItem = this.availableItems.find(i => i.id === recipeItem.itemId);
    if (!libraryItem?.isSeasonalItem) return true;
    const month = new Date().getMonth() + 1;
    const start = libraryItem.seasonalStartMonth ?? 1;
    const end = libraryItem.seasonalEndMonth ?? 12;
    if (start <= end) return month >= start && month <= end;
    return month >= start || month <= end;
  }

  getCurrentMonthName(): string {
    return new Date().toLocaleString('default', { month: 'long' });
  }
}
