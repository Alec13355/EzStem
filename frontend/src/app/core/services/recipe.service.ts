import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Recipe, PagedResponse, ScaleRecipeResponse, RecipeCostResponse } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  constructor(private api: ApiService) {}

  getRecipes(page = 1, pageSize = 100, search?: string): Observable<PagedResponse<Recipe>> {
    const params: { page: number; pageSize: number; search?: string } = { page, pageSize };
    if (search) params.search = search;
    return this.api.get<PagedResponse<Recipe>>('recipes', params);
  }

  getRecipe(id: string): Observable<Recipe> {
    return this.api.get<Recipe>(`recipes/${id}`);
  }

  createRecipe(data: Partial<Recipe>): Observable<Recipe> {
    return this.api.post<Recipe>('recipes', data);
  }

  updateRecipe(id: string, data: Partial<Recipe>): Observable<Recipe> {
    return this.api.put<Recipe>(`recipes/${id}`, data);
  }

  deleteRecipe(id: string): Observable<void> {
    return this.api.delete<void>(`recipes/${id}`);
  }

  addItemToRecipe(recipeId: string, itemId: string, quantity: number): Observable<Recipe> {
    return this.api.post<Recipe>(`recipes/${recipeId}/items`, { itemId, quantity });
  }

  removeItemFromRecipe(recipeId: string, itemId: string): Observable<void> {
    return this.api.delete<void>(`recipes/${recipeId}/items/${itemId}`);
  }

  getRecipeCost(recipeId: string): Observable<{ totalCost: number }> {
    return this.api.get<{ totalCost: number }>(`recipes/${recipeId}/cost`);
  }

  getRecipePricing(recipeId: string): Observable<RecipeCostResponse> {
    return this.api.get<RecipeCostResponse>(`recipes/${recipeId}/pricing`);
  }

  scaleRecipe(recipeId: string, factor: number): Observable<ScaleRecipeResponse> {
    return this.api.get<ScaleRecipeResponse>(`recipes/${recipeId}/scale`, { factor });
  }

  duplicateRecipe(recipeId: string): Observable<Recipe> {
    return this.api.post<Recipe>(`recipes/${recipeId}/duplicate`, {});
  }
}
