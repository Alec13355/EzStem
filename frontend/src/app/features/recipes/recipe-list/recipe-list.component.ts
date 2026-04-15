import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RecipeService } from '../../../core/services/recipe.service';
import { Recipe } from '../../../shared/models/api.models';

@Component({
  selector: 'app-recipe-list',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule
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
              <button mat-icon-button color="primary" (click)="viewRecipe(recipe.id)">
                <mat-icon>visibility</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteRecipe(recipe)">
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
  `]
})
export class RecipeListComponent implements OnInit {
  recipes: Recipe[] = [];
  displayedColumns = ['name', 'laborCost', 'totalCost', 'itemCount', 'actions'];

  constructor(
    private recipeService: RecipeService,
    private router: Router
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

  deleteRecipe(recipe: Recipe) {
    if (confirm(`Are you sure you want to delete "${recipe.name}"?`)) {
      this.recipeService.deleteRecipe(recipe.id).subscribe({
        next: () => {
          this.loadRecipes();
        },
        error: (err) => {
          console.error('Error deleting recipe:', err);
        }
      });
    }
  }
}
