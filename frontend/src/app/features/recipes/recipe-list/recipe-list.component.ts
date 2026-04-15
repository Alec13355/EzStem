import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RecipeService } from '../../../core/services/recipe.service';
import { Recipe } from '../../../shared/models/api.models';

@Component({
  selector: 'app-recipe-list',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Recipes</h1>
        <button mat-raised-button color="primary" (click)="createRecipe()">
          <mat-icon>add</mat-icon>
          New Recipe
        </button>
      </div>

      <table mat-table [dataSource]="recipes" class="mat-elevation-z2">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let recipe">{{ recipe.name }}</td>
        </ng-container>

        <ng-container matColumnDef="laborCost">
          <th mat-header-cell *matHeaderCellDef>Labor Cost</th>
          <td mat-cell *matCellDef="let recipe">
            <span class="currency">{{ recipe.laborCost | number:'1.2-2' }}</span>
          </td>
        </ng-container>

        <ng-container matColumnDef="totalCost">
          <th mat-header-cell *matHeaderCellDef>Total Cost</th>
          <td mat-cell *matCellDef="let recipe">
            <span class="currency">{{ recipe.totalCost || 0 | number:'1.2-2' }}</span>
          </td>
        </ng-container>

        <ng-container matColumnDef="itemCount">
          <th mat-header-cell *matHeaderCellDef>Item Count</th>
          <td mat-cell *matCellDef="let recipe">{{ recipe.recipeItems?.length || 0 }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let recipe">
            <div class="action-buttons">
              <button mat-icon-button color="primary" class="action-btn" (click)="viewRecipe(recipe.id)">
                <mat-icon>visibility</mat-icon>
              </button>
              <button mat-icon-button class="action-btn" (click)="duplicateRecipe(recipe)"
                aria-label="Duplicate recipe" [disabled]="duplicatingId === recipe.id">
                <mat-icon>content_copy</mat-icon>
              </button>
              <button mat-icon-button color="warn" class="action-btn" (click)="deleteRecipe(recipe)">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    table {
      width: 100%;
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
export class RecipeListComponent implements OnInit {
  recipes: Recipe[] = [];
  displayedColumns = ['name', 'laborCost', 'totalCost', 'itemCount', 'actions'];
  duplicatingId: string | null = null;

  constructor(
    private recipeService: RecipeService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadRecipes();
  }

  loadRecipes() {
    this.recipeService.getRecipes().subscribe({
      next: (response) => {
        this.recipes = response.items ?? [];
      },
      error: (err) => {
        console.error('Error loading recipes:', err);
      }
    });
  }

  createRecipe() {
    this.router.navigate(['/recipes', 'new']);
  }

  viewRecipe(id: string) {
    this.router.navigate(['/recipes', id]);
  }

  duplicateRecipe(recipe: Recipe) {
    this.duplicatingId = recipe.id;
    this.recipeService.duplicateRecipe(recipe.id).subscribe({
      next: (newRecipe) => {
        this.duplicatingId = null;
        this.router.navigate(['/recipes', newRecipe.id]);
      },
      error: (err) => {
        this.duplicatingId = null;
        console.error('Error duplicating recipe:', err);
        this.snackBar.open('Failed to duplicate recipe. Please try again.', 'Dismiss', { duration: 4000 });
      }
    });
  }

  deleteRecipe(recipe: Recipe) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: { message: `Delete "${recipe.name}"? This cannot be undone.` }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.recipeService.deleteRecipe(recipe.id).subscribe({
          next: () => {
            this.loadRecipes();
          },
          error: (err) => {
            console.error('Error deleting recipe:', err);
            this.snackBar.open('Failed to delete recipe. Please try again.', 'Dismiss', { duration: 4000 });
          }
        });
      }
    });
  }
}

@Component({
  selector: 'app-recipe-confirm-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Delete Recipe</h2>
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
