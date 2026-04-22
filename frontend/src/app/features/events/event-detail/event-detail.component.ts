import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, CanDeactivateFn } from '@angular/router';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EventService } from '../../../core/services/event.service';
import { RecipeService } from '../../../core/services/recipe.service';
import { ItemService } from '../../../core/services/item.service';
import { FlexItemService } from '../../../core/services/flex-item.service';
import { FloristEvent, Recipe, EventSummary, FlexItem, Item } from '../../../shared/models/api.models';

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
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>{{ isNew ? 'New Event' : event?.name }}</h1>
        <div class="action-buttons">
          <button mat-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Back
          </button>
          <button mat-stroked-button (click)="downloadProductionSheet()" [disabled]="isNew || isPdfGenerating">
            @if (isPdfGenerating) {
              <mat-icon>hourglass_empty</mat-icon>
            } @else {
              <mat-icon>assignment</mat-icon>
            }
            Production Sheet
          </button>
        </div>
      </div>

      @if (loading()) {
        <div style="display:flex;justify-content:center;padding:32px 0">
          <mat-spinner></mat-spinner>
        </div>
      } @else {

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
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="Draft">Draft</mat-option>
                <mat-option value="Confirmed">Confirmed</mat-option>
                <mat-option value="Ordered">Ordered</mat-option>
                <mat-option value="Completed">Completed</mat-option>
              </mat-select>
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

        <mat-card class="mb-3">
          <mat-card-content>
            <div class="flex-items-header mb-3">
              <span class="flex-section-title">Flex Items</span>
              @if (!isAddingFlexItem) {
                <button mat-raised-button color="accent" (click)="isAddingFlexItem = true">
                  <mat-icon>add</mat-icon>
                  Add Flex Item
                </button>
              }
            </div>

            <div class="info-hint mb-3">
              <mat-icon>info</mat-icon>
              <span>Add individual stems directly to this event — no recipe needed.</span>
            </div>

            @if (flexItems.length > 0) {
              <table mat-table [dataSource]="flexItems" class="mat-elevation-z2 mb-2">
                <ng-container matColumnDef="item">
                  <th mat-header-cell *matHeaderCellDef>Item</th>
                  <td mat-cell *matCellDef="let fi">{{ fi.itemName }}</td>
                </ng-container>

                <ng-container matColumnDef="vendor">
                  <th mat-header-cell *matHeaderCellDef>Vendor</th>
                  <td mat-cell *matCellDef="let fi">{{ fi.vendorName || '—' }}</td>
                </ng-container>

                <ng-container matColumnDef="qty">
                  <th mat-header-cell *matHeaderCellDef>Qty Needed</th>
                  <td mat-cell *matCellDef="let fi">{{ fi.quantityNeeded }}</td>
                </ng-container>

                <ng-container matColumnDef="costPerStem">
                  <th mat-header-cell *matHeaderCellDef>Cost/Stem</th>
                  <td mat-cell *matCellDef="let fi">{{ fi.costPerStem | currency }}</td>
                </ng-container>

                <ng-container matColumnDef="total">
                  <th mat-header-cell *matHeaderCellDef>Total</th>
                  <td mat-cell *matCellDef="let fi">{{ fi.lineTotalCost | currency }}</td>
                </ng-container>

                <ng-container matColumnDef="delete">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let fi">
                    <button mat-icon-button color="warn" (click)="deleteFlexItem(fi)" aria-label="Delete flex item">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="flexColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: flexColumns;"></tr>
              </table>

              <div class="flex-total mb-2">
                <strong>Total flex cost: {{ totalFlexCost | currency }}</strong>
              </div>
            }

            @if (isAddingFlexItem) {
              <form [formGroup]="flexItemForm" (ngSubmit)="addFlexItem()" class="flex-item-form mt-2">
                <mat-form-field style="width: 250px; margin-right: 16px;">
                  <mat-label>Item</mat-label>
                  <mat-select formControlName="itemId" required>
                    @for (item of availableItems; track item.id) {
                      <mat-option [value]="item.id">{{ item.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field style="width: 120px; margin-right: 16px;">
                  <mat-label>Quantity</mat-label>
                  <input matInput type="number" formControlName="quantityNeeded" min="0.1" step="0.1" required>
                </mat-form-field>

                <mat-form-field style="width: 200px; margin-right: 16px;">
                  <mat-label>Notes (optional)</mat-label>
                  <input matInput formControlName="notes">
                </mat-form-field>

                <button mat-raised-button color="primary" type="submit" [disabled]="!flexItemForm.valid">
                  Add
                </button>
                <button mat-button type="button" (click)="isAddingFlexItem = false; flexItemForm.reset({ quantityNeeded: 1 })">
                  Cancel
                </button>
              </form>
            }
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

    .action-buttons {
      display: flex;
      gap: 8px;
      align-items: center;
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

    .flex-items-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .flex-section-title {
      font-size: 20px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }

    .info-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background-color: #e3f2fd;
      border-radius: 4px;
      color: #1565c0;
      font-size: 14px;
    }

    .info-hint mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .flex-item-form {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .flex-total {
      padding: 8px 0;
      font-size: 15px;
    }
  `]
})
export class EventDetailComponent implements OnInit {
  event: FloristEvent | null = null;
  eventForm: FormGroup;
  isNew = false;
  eventLoading = signal(false);
  loading = this.eventLoading;
  availableRecipes: Recipe[] = [];
  availableItems: Item[] = [];
  selectedRecipeId: string = '';
  newRecipeQuantity = 1;
  summary: EventSummary | null = null;
  recipeColumns = ['name', 'quantity', 'unitCost', 'totalCost'];
  seasonalWarnings: string[] = [];
  isPdfGenerating = false;
  flexItems: FlexItem[] = [];
  flexItemForm!: FormGroup;
  isAddingFlexItem = false;
  flexColumns = ['item', 'vendor', 'qty', 'costPerStem', 'total', 'delete'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private eventService: EventService,
    private recipeService: RecipeService,
    private itemService: ItemService,
    private flexItemService: FlexItemService,
    private snackBar: MatSnackBar
  ) {
    this.eventForm = this.fb.group({
      name: ['', Validators.required],
      eventDate: ['', Validators.required],
      clientName: [''],
      status: ['Draft', Validators.required],
      notes: ['']
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.isNew = id === 'new';

    this.flexItemForm = this.fb.group({
      itemId: ['', Validators.required],
      quantityNeeded: [1, [Validators.required, Validators.min(0.1)]],
      notes: ['']
    });

    if (!this.isNew && id) {
      this.loadEvent(id);
      this.loadSummary(id);
    }

    this.loadRecipes();
    this.loadItems();
  }

  loadEvent(id: string) {
    this.eventLoading.set(true);
    this.eventService.getEvent(id)
      .pipe(finalize(() => this.eventLoading.set(false)))
      .subscribe({
        next: (event) => {
          this.event = event;
          this.eventForm.patchValue({
            name: event.name,
            eventDate: event.eventDate,
            clientName: event.clientName,
            status: event.status,
            notes: event.notes
          });
          this.eventForm.markAsPristine();
          this.checkSeasonalItems();
          this.loadFlexItems();
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

  loadItems(): void {
    this.itemService.getItems(1, 1000).subscribe({
      next: (response) => this.availableItems = response.items ?? [],
      error: () => this.snackBar.open('Failed to load items', 'Dismiss', { duration: 3000 })
    });
  }

  loadFlexItems(): void {
    if (!this.event) return;
    this.flexItemService.getFlexItems(this.event.id).subscribe({
      next: items => this.flexItems = items,
      error: () => this.snackBar.open('Failed to load flex items', 'Dismiss', { duration: 3000 })
    });
  }

  get totalFlexCost(): number {
    return this.flexItems.reduce((sum, item) => sum + item.lineTotalCost, 0);
  }

  addFlexItem(): void {
    if (!this.flexItemForm.valid || !this.event) return;
    const { itemId, quantityNeeded, notes } = this.flexItemForm.value;
    this.flexItemService.addFlexItem(this.event.id, itemId, quantityNeeded, notes || undefined).subscribe({
      next: (item) => {
        this.flexItems = [...this.flexItems, item];
        this.flexItemForm.reset({ quantityNeeded: 1 });
        this.isAddingFlexItem = false;
      },
      error: () => this.snackBar.open('Failed to add flex item', 'Dismiss', { duration: 3000 })
    });
  }

  deleteFlexItem(item: FlexItem): void {
    if (!this.event) return;
    this.flexItemService.deleteFlexItem(this.event.id, item.id).subscribe({
      next: () => {
        this.flexItems = this.flexItems.filter(fi => fi.id !== item.id);
      },
      error: () => this.snackBar.open('Failed to delete flex item', 'Dismiss', { duration: 3000 })
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
          this.eventForm.markAsPristine();
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

  async downloadProductionSheet() {
    if (!this.event) return;
    this.isPdfGenerating = true;
    try {
      const sheet = await this.eventService.getProductionSheet(this.event.id).toPromise();
      if (!sheet) return;

      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      let y = 20;

      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`${sheet.eventName} — Production Sheet`, margin, y);
      y += 8;

      // Subtitles
      const formattedDate = new Date(sheet.eventDate).toLocaleDateString();
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`Event Date: ${formattedDate} | Client: ${sheet.clientName ?? 'N/A'}`, margin, y);
      y += 6;
      doc.setTextColor(0);
      doc.text(`Total Stems: ${sheet.totalStemCount}`, margin, y);
      y += 4;

      // Separator
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      // Recipes
      for (const recipe of sheet.recipes) {
        if (y > 255) { doc.addPage(); y = 20; }

        // Recipe header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`\u{1F4CB} ${recipe.recipeName} \u00D7 ${recipe.quantity}`, margin, y);
        y += 6;

        // Notes
        if (recipe.notes) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(80);
          doc.text(`(Note: ${recipe.notes})`, margin + 4, y);
          doc.setTextColor(0);
          y += 5;
        }

        // Table header
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        const col = { item: margin + 2, qty: 120, vendor: 150 };
        doc.text('Item', col.item, y);
        doc.text('Qty', col.qty, y);
        doc.text('Vendor', col.vendor, y);
        y += 2;
        doc.line(margin, y, pageWidth - margin, y);
        y += 5;

        // Table rows
        doc.setFont('helvetica', 'normal');
        for (const li of recipe.items) {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(String(li.itemName), col.item, y);
          doc.text(String(li.quantityNeeded), col.qty, y);
          doc.text(li.vendorName ?? '—', col.vendor, y);
          y += 5;
        }

        doc.line(margin, y, pageWidth - margin, y);
        y += 8;
      }

      // Footer
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120);
      doc.text(`Generated by EzStem · ${new Date().toLocaleDateString()}`, margin, y);

      const safeName = sheet.eventName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      doc.save(`production-sheet-${safeName}-${dateStr}.pdf`);
    } catch (err) {
      console.error('Error generating production sheet:', err);
      this.snackBar.open('Failed to generate production sheet. Please try again.', 'Dismiss', { duration: 4000 });
    } finally {
      this.isPdfGenerating = false;
    }
  }

  goBack() {
    this.router.navigate(['/events']);
  }

  hasUnsavedChanges(): boolean {
    return this.eventForm.dirty;
  }
}

export const eventDetailCanDeactivate: CanDeactivateFn<EventDetailComponent> = (component) => {
  if (component.hasUnsavedChanges()) {
    return confirm('You have unsaved changes. Leave anyway?');
  }
  return true;
};
