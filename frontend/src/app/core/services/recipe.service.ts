import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Recipe, PagedResponse } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  constructor(private api: ApiService) {}

  getRecipes(page = 1, pageSize = 100, search?: string): Observable<PagedResponse<Recipe>> {
    const params: any = { page, pageSize };
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

  getRecipePricing(recipeId: string): Observable<any> {
    return this.api.get<any>(`recipes/${recipeId}/pricing`);
  }

  scaleRecipe(recipeId: string, factor: number): Observable<Recipe> {
    return this.api.post<Recipe>(`recipes/${recipeId}/scale`, { factor });
  }
}
