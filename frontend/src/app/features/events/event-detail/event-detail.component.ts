import { Component, OnInit } from '@angular/core';
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { EventService } from '../../../core/services/event.service';
import { RecipeService } from '../../../core/services/recipe.service';
import { FloristEvent, Recipe, EventSummary } from '../../../shared/models/api.models';

@Component({
  selector: 'app-event-detail',
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
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>{{ isNew ? 'New Event' : event?.name }}</h1>
        <button mat-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          Back
        </button>
      </div>

      @if (seasonalWarnings.length > 0) {
        <mat-card class="warning-card mb-3">
          <mat-card-content>
            <div class="warning-content">
              <mat-icon color="warn">warning</mat-icon>
              <span>{{ seasonalWarnings.length }} item(s) may not be in season for this event date</span>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <mat-card class="mb-3">
        <mat-card-content>
          <form [formGroup]="eventForm">
            <mat-form-field class="full-width">
              <mat-label>Event Name</mat-label>
              <input matInput formControlName="name" required>
            </mat-form-field>

            <mat-form-field class="full-width">
              <mat-label>Event Date</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="eventDate" required (dateChange)="checkSeasonalItems()">
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>

            <mat-form-field class="full-width">
              <mat-label>Client Name</mat-label>
              <input matInput formControlName="clientName">
            </mat-form-field>

            <mat-form-field class="full-width">
              <mat-label>Notes</mat-label>
              <textarea matInput formControlName="notes" rows="3"></textarea>
            </mat-form-field>

            <button mat-raised-button color="primary" (click)="saveEvent()" [disabled]="!eventForm.valid">
              Save Event
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      @if (!isNew && event) {
        <mat-card class="mb-3">
          <mat-card-header>
            <mat-card-title>Recipes</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="add-recipe-section mb-2">
              <mat-form-field style="width: 300px; margin-right: 16px;">
                <mat-label>Recipe</mat-label>
                <mat-select [(value)]="selectedRecipeId">
                  @for (recipe of availableRecipes; track recipe.id) {
                    <mat-option [value]="recipe.id">{{ recipe.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field style="width: 120px; margin-right: 16px;">
                <mat-label>Quantity</mat-label>
                <input matInput type="number" [(ngModel)]="newRecipeQuantity" min="1" step="1">
              </mat-form-field>

              <button mat-raised-button color="accent" (click)="addRecipeToEvent()">
                <mat-icon>add</mat-icon>
                Add Recipe
              </button>
            </div>

            <table mat-table [dataSource]="event.eventRecipes || []" class="mat-elevation-z2">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Recipe Name</th>
                <td mat-cell *matCellDef="let er">{{ er.recipeName || er.recipe?.name }}</td>
              </ng-container>

              <ng-container matColumnDef="quantity">
                <th mat-header-cell *matHeaderCellDef>Quantity</th>
                <td mat-cell *matCellDef="let er">{{ er.quantity }}</td>
              </ng-container>

              <ng-container matColumnDef="unitCost">
                <th mat-header-cell *matHeaderCellDef>Unit Cost</th>
                <td mat-cell *matCellDef="let er">
                  <span class="currency">{{ er.unitCost || er.recipe?.totalCost || 0 | number:'1.2-2' }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="totalCost">
                <th mat-header-cell *matHeaderCellDef>Total Cost</th>
                <td mat-cell *matCellDef="let er">
                  <span class="currency">{{ er.totalCost || (er.quantity * (er.unitCost || er.recipe?.totalCost || 0)) | number:'1.2-2' }}</span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="recipeColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: recipeColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        @if (summary) {
          <mat-card class="mb-3">
            <mat-card-header>
              <mat-card-title>Event Summary</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="summary-grid">
                <div class="summary-item">
                  <span>Total Items Cost:</span>
                  <span class="currency">{{ summary.totalItemsCost | number:'1.2-2' }}</span>
                </div>
                <div class="summary-item">
                  <span>Total Revenue:</span>
                  <span class="currency">{{ summary.totalRevenue | number:'1.2-2' }}</span>
                </div>
                <div class="summary-item">
                  <span>Total Profit:</span>
                  <span class="currency">{{ summary.totalProfit | number:'1.2-2' }}</span>
                </div>
                <div class="summary-item">
                  <span>Margin:</span>
                  <span [ngClass]="{
                    'margin-high': summary.profitMargin >= 40,
                    'margin-medium': summary.profitMargin >= 25 && summary.profitMargin < 40,
                    'margin-low': summary.profitMargin < 25
                  }">{{ summary.profitMargin | number:'1.1-1' }}%</span>
                </div>
              </div>

              <div class="mt-3">
                <button mat-raised-button color="primary" (click)="generateOrder()">
                  <mat-icon>shopping_cart</mat-icon>
                  Generate Order
                </button>
              </div>
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

    .warning-card {
      background-color: #fff3cd;
      border-left: 4px solid #f57c00;
    }

    .warning-content {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 500;
    }

    .add-recipe-section {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
    }

    table {
      width: 100%;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      font-size: 16px;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 4px;
    }
  `]
})
export class EventDetailComponent implements OnInit {
  event: FloristEvent | null = null;
  eventForm: FormGroup;
  isNew = false;
  availableRecipes: Recipe[] = [];
  selectedRecipeId: string = '';
  newRecipeQuantity = 1;
  summary: EventSummary | null = null;
  recipeColumns = ['name', 'quantity', 'unitCost', 'totalCost'];
  seasonalWarnings: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private eventService: EventService,
    private recipeService: RecipeService
  ) {
    this.eventForm = this.fb.group({
      name: ['', Validators.required],
      eventDate: ['', Validators.required],
      clientName: [''],
      notes: ['']
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.isNew = id === 'new';

    if (!this.isNew && id) {
      this.loadEvent(id);
      this.loadSummary(id);
    }

    this.loadRecipes();
  }

  loadEvent(id: string) {
    this.eventService.getEvent(id).subscribe({
      next: (event) => {
        this.event = event;
        this.eventForm.patchValue({
          name: event.name,
          eventDate: event.eventDate,
          clientName: event.clientName,
          notes: event.notes
        });
        this.checkSeasonalItems();
      },
      error: (err) => {
        console.error('Error loading event:', err);
      }
    });
  }

  loadRecipes() {
    this.recipeService.getRecipes().subscribe({
      next: (response) => {
        this.availableRecipes = response.items ?? [];
      },
      error: (err) => {
        console.error('Error loading recipes:', err);
      }
    });
  }

  loadSummary(id: string) {
    this.eventService.getEventSummary(id).subscribe({
      next: (summary) => {
        this.summary = summary;
      },
      error: (err) => {
        console.error('Error loading summary:', err);
      }
    });
  }

  checkSeasonalItems() {
    this.seasonalWarnings = [];
    
    if (!this.event?.eventRecipes || !this.eventForm.value.eventDate) {
      return;
    }

    const eventDate = new Date(this.eventForm.value.eventDate);
    const eventMonth = eventDate.getMonth() + 1;

    this.event.eventRecipes.forEach(er => {
      er.recipe?.recipeItems.forEach(ri => {
        const item = ri.item;
        if (item?.isSeasonalItem && item.seasonalStartMonth && item.seasonalEndMonth) {
          const isInSeason = this.isMonthInRange(eventMonth, item.seasonalStartMonth, item.seasonalEndMonth);
          if (!isInSeason) {
            this.seasonalWarnings.push(item.name);
          }
        }
      });
    });
  }

  isMonthInRange(month: number, start: number, end: number): boolean {
    if (start <= end) {
      return month >= start && month <= end;
    } else {
      return month >= start || month <= end;
    }
  }

  saveEvent() {
    if (this.eventForm.valid) {
      const eventData = this.eventForm.value;
      const request = this.isNew
        ? this.eventService.createEvent(eventData)
        : this.eventService.updateEvent(this.event!.id, eventData);

      request.subscribe({
        next: (event) => {
          if (this.isNew) {
            this.router.navigate(['/events', event.id]);
          } else {
            this.loadEvent(this.event!.id);
          }
        },
        error: (err) => {
          console.error('Error saving event:', err);
        }
      });
    }
  }

  addRecipeToEvent() {
    if (this.selectedRecipeId && this.event) {
      this.eventService.addRecipeToEvent(this.event.id, this.selectedRecipeId, this.newRecipeQuantity).subscribe({
        next: () => {
          this.loadEvent(this.event!.id);
          this.loadSummary(this.event!.id);
          this.selectedRecipeId = '';
          this.newRecipeQuantity = 1;
        },
        error: (err) => {
          console.error('Error adding recipe:', err);
        }
      });
    }
  }

  generateOrder() {
    if (this.event) {
      this.eventService.generateOrder(this.event.id).subscribe({
        next: (order) => {
          this.router.navigate(['/orders', order.id]);
        },
        error: (err) => {
          console.error('Error generating order:', err);
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/events']);
  }
}
