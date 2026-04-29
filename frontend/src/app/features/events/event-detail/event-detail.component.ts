import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { EventService } from '../../../core/services/event.service';
import { EventItemService } from '../../../core/services/event-item.service';
import { EventFlowerService } from '../../../core/services/event-flower.service';
import { EventRecipeService } from '../../../core/services/event-recipe.service';
import { 
  FloristEvent, 
  EventItem, 
  EventFlower,
  CreateEventItemRequest,
  UpdateEventItemRequest,
  CreateEventFlowerRequest,
  UpdateEventFlowerRequest,
  CreateEventItemFlowerRequest,
  EventRecipeSummaryResponse,
  RecipeItemSummary,
  RecipeLineItem
} from '../../../shared/models/api.models';

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
    MatSnackBarModule,
    MatTabsModule,
    MatDialogModule,
    RouterModule
  ],
  template: `
    <div class="event-detail-container">
      <div class="header">
        <button mat-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          Back to Events
        </button>
        <h1>{{ event()?.name || 'Event Details' }}</h1>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <p>Loading...</p>
        </div>
      } @else {
        <mat-tab-group (selectedTabChange)="onTabChange($event)">
          <!-- Tab 1: Overview -->
          <mat-tab label="Overview">
            <div class="tab-content">
              <mat-card>
                <mat-card-content>
                  <h2>Event Information</h2>
                  
                  <mat-form-field class="full-width">
                    <mat-label>Event Name</mat-label>
                    <input matInput [(ngModel)]="eventName" [disabled]="savingEvent()">
                  </mat-form-field>

                  <mat-form-field class="full-width">
                    <mat-label>Event Date</mat-label>
                    <input matInput [(ngModel)]="eventDate" type="date" [disabled]="savingEvent()">
                  </mat-form-field>

                  <mat-form-field class="full-width">
                    <mat-label>Client Name</mat-label>
                    <input matInput [(ngModel)]="clientName" [disabled]="savingEvent()">
                  </mat-form-field>

                  <mat-form-field class="full-width">
                    <mat-label>Total Budget</mat-label>
                    <input matInput [(ngModel)]="totalBudget" type="number" step="0.01" [disabled]="savingEvent()">
                    <span matSuffix>$</span>
                  </mat-form-field>

                  <mat-form-field class="full-width">
                    <mat-label>Profit Multiple</mat-label>
                    <input matInput [(ngModel)]="profitMultiple" type="number" step="0.1" [disabled]="savingEvent()">
                    <mat-hint>e.g. 2.5 means sell for 2.5x cost</mat-hint>
                  </mat-form-field>

                  @if (totalBudget && profitMultiple && profitMultiple > 0) {
                    <div class="computed-budget">
                      <strong>Flower Budget:</strong> {{ formatCurrency(totalBudget / profitMultiple) }}
                    </div>
                  }

                  <button mat-raised-button color="primary" (click)="saveEventDetails()" [disabled]="savingEvent()">
                    {{ savingEvent() ? 'Saving...' : 'Save Event' }}
                  </button>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Tab 2: Items (Arrangements) -->
          <mat-tab label="Items">
            <div class="tab-content">
              <div class="tab-header">
                <h2>Event Items</h2>
                <div class="action-buttons">
                  <button mat-raised-button color="accent" (click)="loadItemsFromLastEvent()" [disabled]="loadingLastEvent()">
                    {{ loadingLastEvent() ? 'Loading...' : 'Pre-populate from Last Event' }}
                  </button>
                  <button mat-raised-button color="primary" (click)="toggleAddItem()">
                    {{ showAddItem() ? 'Cancel' : 'Add Item' }}
                  </button>
                </div>
              </div>

              @if (showAddItem()) {
                <mat-card class="add-form">
                  <mat-card-content>
                    <h3>New Item</h3>
                    <mat-form-field>
                      <mat-label>Name</mat-label>
                      <input matInput [(ngModel)]="newItem.name">
                    </mat-form-field>
                    <mat-form-field>
                      <mat-label>Price</mat-label>
                      <input matInput [(ngModel)]="newItem.price" type="number" step="0.01">
                      <span matSuffix>$</span>
                    </mat-form-field>
                    <mat-form-field>
                      <mat-label>Quantity</mat-label>
                      <input matInput [(ngModel)]="newItem.quantity" type="number">
                    </mat-form-field>
                    <button mat-raised-button color="primary" (click)="createItem()">Create</button>
                  </mat-card-content>
                </mat-card>
              }

              <table mat-table [dataSource]="items()" class="items-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let item">
                    @if (editingItemId() === item.id) {
                      <input matInput [(ngModel)]="editItem.name" class="inline-edit">
                    } @else {
                      {{ item.name }}
                    }
                  </td>
                </ng-container>

                <ng-container matColumnDef="price">
                  <th mat-header-cell *matHeaderCellDef>Price</th>
                  <td mat-cell *matCellDef="let item">
                    @if (editingItemId() === item.id) {
                      <input matInput [(ngModel)]="editItem.price" type="number" step="0.01" class="inline-edit">
                    } @else {
                      {{ formatCurrency(item.price) }}
                    }
                  </td>
                </ng-container>

                <ng-container matColumnDef="quantity">
                  <th mat-header-cell *matHeaderCellDef>Quantity</th>
                  <td mat-cell *matCellDef="let item">
                    @if (editingItemId() === item.id) {
                      <input matInput [(ngModel)]="editItem.quantity" type="number" class="inline-edit">
                    } @else {
                      {{ item.quantity }}
                    }
                  </td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let item">
                    @if (editingItemId() === item.id) {
                      <button mat-icon-button (click)="saveItemEdit(item.id)">
                        <mat-icon>save</mat-icon>
                      </button>
                      <button mat-icon-button (click)="cancelItemEdit()">
                        <mat-icon>cancel</mat-icon>
                      </button>
                    } @else {
                      <button mat-icon-button (click)="startEditItem(item)">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button (click)="deleteItem(item.id)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    }
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="itemColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: itemColumns;"></tr>
              </table>

              @if (items().length === 0) {
                <div class="empty-state">No items yet. Add your first item!</div>
              }
            </div>
          </mat-tab>

          <!-- Tab 3: Flowers -->
          <mat-tab label="Flowers">
            <div class="tab-content">
              <div class="tab-header">
                <h2>Event Flowers</h2>
                <button mat-raised-button color="primary" (click)="toggleAddFlower()">
                  {{ showAddFlower() ? 'Cancel' : 'Add Flower' }}
                </button>
              </div>

              @if (showAddFlower()) {
                <mat-card class="add-form">
                  <mat-card-content>
                    <h3>New Flower</h3>
                    <mat-form-field>
                      <mat-label>Name</mat-label>
                      <input matInput [(ngModel)]="newFlower.name">
                    </mat-form-field>
                    <mat-form-field>
                      <mat-label>Price per Stem</mat-label>
                      <input matInput [(ngModel)]="newFlower.pricePerStem" type="number" step="0.01">
                      <span matSuffix>$</span>
                    </mat-form-field>
                    <mat-form-field>
                      <mat-label>Bunch Size</mat-label>
                      <input matInput [(ngModel)]="newFlower.bunchSize" type="number">
                    </mat-form-field>
                    <button mat-raised-button color="primary" (click)="createFlower()">Create</button>
                  </mat-card-content>
                </mat-card>
              }

              <table mat-table [dataSource]="flowers()" class="flowers-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let flower">
                    @if (editingFlowerId() === flower.id) {
                      <input matInput [(ngModel)]="editFlower.name" class="inline-edit">
                    } @else {
                      {{ flower.name }}
                    }
                  </td>
                </ng-container>

                <ng-container matColumnDef="pricePerStem">
                  <th mat-header-cell *matHeaderCellDef>Price per Stem</th>
                  <td mat-cell *matCellDef="let flower">
                    @if (editingFlowerId() === flower.id) {
                      <input matInput [(ngModel)]="editFlower.pricePerStem" type="number" step="0.01" class="inline-edit">
                    } @else {
                      {{ formatCurrency(flower.pricePerStem) }}
                    }
                  </td>
                </ng-container>

                <ng-container matColumnDef="bunchSize">
                  <th mat-header-cell *matHeaderCellDef>Bunch Size</th>
                  <td mat-cell *matCellDef="let flower">
                    @if (editingFlowerId() === flower.id) {
                      <input matInput [(ngModel)]="editFlower.bunchSize" type="number" class="inline-edit">
                    } @else {
                      {{ flower.bunchSize }}
                    }
                  </td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let flower">
                    @if (editingFlowerId() === flower.id) {
                      <button mat-icon-button (click)="saveFlowerEdit(flower.id)">
                        <mat-icon>save</mat-icon>
                      </button>
                      <button mat-icon-button (click)="cancelFlowerEdit()">
                        <mat-icon>cancel</mat-icon>
                      </button>
                    } @else {
                      <button mat-icon-button (click)="startEditFlower(flower)">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button (click)="deleteFlower(flower.id)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    }
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="flowerColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: flowerColumns;"></tr>
              </table>

              @if (flowers().length === 0) {
                <div class="empty-state">No flowers yet. Add your first flower!</div>
              }
            </div>
          </mat-tab>

          <!-- Tab 4: Recipes -->
          <mat-tab label="Recipes">
            <div class="tab-content">
              <h2>Recipe Summary</h2>

              @if (loadingRecipeSummary()) {
                <div class="loading-container">
                  <p>Loading recipe summary...</p>
                </div>
              } @else {
                @if (recipeSummary()) {
                  @for (itemSummary of recipeSummary()!.items; track itemSummary.eventItemId) {
                    <mat-card class="recipe-card">
                      <mat-card-header>
                        <mat-card-title>{{ itemSummary.itemName }}</mat-card-title>
                        <mat-card-subtitle>
                          Customer Price: {{ formatCurrency(itemSummary.customerPrice) }} × {{ itemSummary.quantity }} = {{ formatCurrency(itemSummary.totalRevenue) }}
                        </mat-card-subtitle>
                      </mat-card-header>
                      <mat-card-content>
                        @if (itemSummary.flowers.length > 0) {
                          <table mat-table [dataSource]="itemSummary.flowers" class="recipe-flowers-table">
                            <ng-container matColumnDef="flower">
                              <th mat-header-cell *matHeaderCellDef>Flower</th>
                              <td mat-cell *matCellDef="let line">{{ line.flowerName }}</td>
                            </ng-container>

                            <ng-container matColumnDef="stemsPerUnit">
                              <th mat-header-cell *matHeaderCellDef>Stems/Unit</th>
                              <td mat-cell *matCellDef="let line">{{ line.stemsPerUnit }}</td>
                            </ng-container>

                            <ng-container matColumnDef="totalStems">
                              <th mat-header-cell *matHeaderCellDef>Total Stems</th>
                              <td mat-cell *matCellDef="let line">{{ line.totalStemsNeeded }}</td>
                            </ng-container>

                            <ng-container matColumnDef="bunchSize">
                              <th mat-header-cell *matHeaderCellDef>Bunch Size</th>
                              <td mat-cell *matCellDef="let line">{{ line.bunchSize }}</td>
                            </ng-container>

                            <ng-container matColumnDef="bunchesNeeded">
                              <th mat-header-cell *matHeaderCellDef>Bunches Needed</th>
                              <td mat-cell *matCellDef="let line">{{ line.bunchesNeeded }}</td>
                            </ng-container>

                            <ng-container matColumnDef="costPerBunch">
                              <th mat-header-cell *matHeaderCellDef>Cost per Bunch</th>
                              <td mat-cell *matCellDef="let line">{{ formatCurrency(line.pricePerStem * line.bunchSize) }}</td>
                            </ng-container>

                            <ng-container matColumnDef="lineCost">
                              <th mat-header-cell *matHeaderCellDef>Line Cost</th>
                              <td mat-cell *matCellDef="let line">{{ formatCurrency(line.totalCost) }}</td>
                            </ng-container>

                            <ng-container matColumnDef="actions">
                              <th mat-header-cell *matHeaderCellDef>Actions</th>
                              <td mat-cell *matCellDef="let line">
                                <button mat-icon-button (click)="deleteRecipeEntry(itemSummary.eventItemId, line.eventItemFlowerId)">
                                  <mat-icon>delete</mat-icon>
                                </button>
                              </td>
                            </ng-container>

                            <tr mat-header-row *matHeaderRowDef="recipeColumns"></tr>
                            <tr mat-row *matRowDef="let row; columns: recipeColumns;"></tr>
                          </table>

                          <div class="item-totals">
                            <strong>Item Flower Cost:</strong> {{ formatCurrency(itemSummary.totalRawCost) }}
                          </div>
                        } @else {
                          <p>No flowers in this recipe yet.</p>
                        }

                        <div class="add-flower-to-recipe">
                          @if (showingAddFlowerForItem() === itemSummary.eventItemId) {
                            <div class="inline-add-form">
                              <mat-form-field>
                                <mat-label>Select Flower</mat-label>
                                <mat-select [(ngModel)]="newRecipeEntry.eventFlowerId">
                                  @for (flower of flowers(); track flower.id) {
                                    <mat-option [value]="flower.id">{{ flower.name }}</mat-option>
                                  }
                                </mat-select>
                              </mat-form-field>
                              <mat-form-field>
                                <mat-label>Stems Needed</mat-label>
                                <input matInput [(ngModel)]="newRecipeEntry.stemsNeeded" type="number">
                              </mat-form-field>
                              <button mat-raised-button color="primary" (click)="addFlowerToRecipe(itemSummary.eventItemId)">Add</button>
                              <button mat-button (click)="cancelAddFlowerToRecipe()">Cancel</button>
                            </div>
                          } @else {
                            <button mat-stroked-button (click)="showAddFlowerToRecipe(itemSummary.eventItemId)">
                              <mat-icon>add</mat-icon>
                              Add Flower to Recipe
                            </button>
                          }
                        </div>
                      </mat-card-content>
                    </mat-card>
                  }

                  <!-- Event Totals Summary -->
                  <mat-card class="totals-card" [class.over-budget]="recipeSummary()!.isOverBudget">
                    <mat-card-content>
                      <h3>Event Totals</h3>
                      <div class="totals-grid">
                        <div class="total-item">
                          <span>Flower Budget:</span>
                          <strong>{{ formatCurrency(recipeSummary()!.flowerBudget) }}</strong>
                        </div>
                        <div class="total-item">
                          <span>Total Revenue:</span>
                          <strong>{{ formatCurrency(recipeSummary()!.totalRevenue) }}</strong>
                        </div>
                        <div class="total-item">
                          <span>Total Flower Cost:</span>
                          <strong>{{ formatCurrency(recipeSummary()!.totalFlowerCost) }}</strong>
                        </div>
                        <div class="total-item" [class.over]="recipeSummary()!.isOverBudget" [class.under]="!recipeSummary()!.isOverBudget">
                          <span>Budget Status:</span>
                          <strong>{{ recipeSummary()!.isOverBudget ? 'OVER BUDGET' : 'Under Budget' }}</strong>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>
                } @else {
                  <div class="empty-state">No recipe summary available.</div>
                }
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .event-detail-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .header h1 {
      margin: 0;
      flex: 1;
    }

    .loading-container {
      text-align: center;
      padding: 48px;
    }

    .tab-content {
      padding: 24px 0;
    }

    .tab-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .tab-header h2 {
      margin: 0;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .computed-budget {
      margin: 16px 0;
      padding: 12px;
      background: #e3f2fd;
      border-radius: 4px;
      font-size: 16px;
    }

    .add-form {
      margin-bottom: 16px;
    }

    .add-form mat-form-field {
      margin-right: 16px;
    }

    .items-table, .flowers-table, .recipe-flowers-table {
      width: 100%;
      margin-top: 16px;
    }

    .inline-edit {
      width: 100%;
      border: 1px solid #ccc;
      padding: 4px;
      border-radius: 4px;
    }

    .empty-state {
      text-align: center;
      padding: 48px;
      color: #666;
      font-style: italic;
    }

    .recipe-card {
      margin-bottom: 24px;
    }

    .item-totals {
      margin-top: 16px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 4px;
      text-align: right;
    }

    .add-flower-to-recipe {
      margin-top: 16px;
    }

    .inline-add-form {
      display: flex;
      gap: 16px;
      align-items: center;
      padding: 16px;
      background: #fafafa;
      border-radius: 4px;
    }

    .totals-card {
      margin-top: 24px;
    }

    .totals-card.over-budget {
      border: 2px solid #f44336;
    }

    .totals-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .total-item {
      display: flex;
      justify-content: space-between;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .total-item.over {
      background: #ffebee;
      color: #c62828;
    }

    .total-item.under {
      background: #e8f5e9;
      color: #2e7d32;
    }
  `]
})
export class EventDetailComponent implements OnInit {
  // Signals
  loading = signal(false);
  savingEvent = signal(false);
  loadingLastEvent = signal(false);
  loadingRecipeSummary = signal(false);
  event = signal<FloristEvent | null>(null);
  items = signal<EventItem[]>([]);
  flowers = signal<EventFlower[]>([]);
  recipeSummary = signal<EventRecipeSummaryResponse | null>(null);
  
  showAddItem = signal(false);
  showAddFlower = signal(false);
  editingItemId = signal<string | null>(null);
  editingFlowerId = signal<string | null>(null);
  showingAddFlowerForItem = signal<string | null>(null);

  // Table columns
  itemColumns = ['name', 'price', 'quantity', 'actions'];
  flowerColumns = ['name', 'pricePerStem', 'bunchSize', 'actions'];
  recipeColumns = ['flower', 'stemsPerUnit', 'totalStems', 'bunchSize', 'bunchesNeeded', 'costPerBunch', 'lineCost', 'actions'];

  // Form data
  eventId: string = '';
  eventName: string = '';
  eventDate: string = '';
  clientName: string = '';
  totalBudget: number = 0;
  profitMultiple: number = 2.5;

  newItem: CreateEventItemRequest = { name: '', price: 0, quantity: 1 };
  newFlower: CreateEventFlowerRequest = { name: '', pricePerStem: 0, bunchSize: 10 };
  newRecipeEntry: CreateEventItemFlowerRequest = { eventFlowerId: '', stemsNeeded: 0 };
  
  editItem: UpdateEventItemRequest = {};
  editFlower: UpdateEventFlowerRequest = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private eventItemService: EventItemService,
    private eventFlowerService: EventFlowerService,
    private eventRecipeService: EventRecipeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    if (this.eventId) {
      this.loadEvent();
      this.loadItems();
      this.loadFlowers();
    }
  }

  loadEvent() {
    this.loading.set(true);
    this.eventService.getEvent(this.eventId).subscribe({
      next: (event) => {
        this.event.set(event);
        this.eventName = event.name;
        this.eventDate = event.eventDate ? event.eventDate.split('T')[0] : '';
        this.clientName = event.clientName || '';
        this.totalBudget = event.totalBudget || 0;
        this.profitMultiple = event.profitMultiple || 2.5;
        this.loading.set(false);
      },
      error: (err) => {
        this.showError('Failed to load event');
        this.loading.set(false);
      }
    });
  }

  loadItems() {
    this.eventItemService.getItems(this.eventId).subscribe({
      next: (items) => {
        this.items.set(items);
      },
      error: (err) => {
        this.showError('Failed to load items');
      }
    });
  }

  loadFlowers() {
    this.eventFlowerService.getFlowers(this.eventId).subscribe({
      next: (flowers) => {
        this.flowers.set(flowers);
      },
      error: (err) => {
        this.showError('Failed to load flowers');
      }
    });
  }

  loadRecipeSummary() {
    this.loadingRecipeSummary.set(true);
    this.eventRecipeService.getEventRecipeSummary(this.eventId).subscribe({
      next: (summary) => {
        this.recipeSummary.set(summary);
        this.loadingRecipeSummary.set(false);
      },
      error: (err) => {
        this.showError('Failed to load recipe summary');
        this.loadingRecipeSummary.set(false);
      }
    });
  }

  saveEventDetails() {
    this.savingEvent.set(true);
    const updateData = {
      name: this.eventName,
      eventDate: this.eventDate,
      clientName: this.clientName,
      totalBudget: this.totalBudget,
      profitMultiple: this.profitMultiple
    };
    
    this.eventService.updateEvent(this.eventId, updateData).subscribe({
      next: (event) => {
        this.event.set(event);
        this.showSuccess('Event updated successfully');
        this.savingEvent.set(false);
      },
      error: (err) => {
        this.showError('Failed to update event');
        this.savingEvent.set(false);
      }
    });
  }

  // Items methods
  toggleAddItem() {
    this.showAddItem.set(!this.showAddItem());
    if (this.showAddItem()) {
      this.newItem = { name: '', price: 0, quantity: 1 };
    }
  }

  createItem() {
    if (!this.newItem.name || this.newItem.price <= 0 || this.newItem.quantity <= 0) {
      this.showError('Please fill all item fields with valid values');
      return;
    }

    this.eventItemService.createItem(this.eventId, this.newItem).subscribe({
      next: (item) => {
        this.items.set([...this.items(), item]);
        this.showSuccess('Item created successfully');
        this.toggleAddItem();
      },
      error: (err) => {
        this.showError('Failed to create item');
      }
    });
  }

  startEditItem(item: EventItem) {
    this.editingItemId.set(item.id);
    this.editItem = {
      name: item.name,
      price: item.price,
      quantity: item.quantity
    };
  }

  saveItemEdit(itemId: string) {
    this.eventItemService.updateItem(this.eventId, itemId, this.editItem).subscribe({
      next: (updatedItem) => {
        this.items.set(this.items().map(i => i.id === itemId ? updatedItem : i));
        this.showSuccess('Item updated successfully');
        this.editingItemId.set(null);
      },
      error: (err) => {
        this.showError('Failed to update item');
      }
    });
  }

  cancelItemEdit() {
    this.editingItemId.set(null);
    this.editItem = {};
  }

  deleteItem(itemId: string) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    this.eventItemService.deleteItem(this.eventId, itemId).subscribe({
      next: () => {
        this.items.set(this.items().filter(i => i.id !== itemId));
        this.showSuccess('Item deleted successfully');
      },
      error: (err) => {
        this.showError('Failed to delete item');
      }
    });
  }

  loadItemsFromLastEvent() {
    this.loadingLastEvent.set(true);
    this.eventItemService.getItemsFromLastEvent(this.eventId).subscribe({
      next: (templateItems) => {
        if (templateItems.length === 0) {
          this.showError('No previous event found');
          this.loadingLastEvent.set(false);
          return;
        }

        let created = 0;
        templateItems.forEach((templateItem, index) => {
          const newItemData: CreateEventItemRequest = {
            name: templateItem.name,
            price: templateItem.price,
            quantity: templateItem.quantity
          };

          this.eventItemService.createItem(this.eventId, newItemData).subscribe({
            next: (item) => {
              created++;
              if (created === templateItems.length) {
                this.loadItems();
                this.showSuccess(`${created} items loaded from previous event`);
                this.loadingLastEvent.set(false);
              }
            },
            error: (err) => {
              this.showError('Failed to create some items from template');
              this.loadingLastEvent.set(false);
            }
          });
        });
      },
      error: (err) => {
        this.showError('Failed to load items from last event');
        this.loadingLastEvent.set(false);
      }
    });
  }

  // Flowers methods
  toggleAddFlower() {
    this.showAddFlower.set(!this.showAddFlower());
    if (this.showAddFlower()) {
      this.newFlower = { name: '', pricePerStem: 0, bunchSize: 10 };
    }
  }

  createFlower() {
    if (!this.newFlower.name || this.newFlower.pricePerStem <= 0 || this.newFlower.bunchSize <= 0) {
      this.showError('Please fill all flower fields with valid values');
      return;
    }

    this.eventFlowerService.createFlower(this.eventId, this.newFlower).subscribe({
      next: (flower) => {
        this.flowers.set([...this.flowers(), flower]);
        this.showSuccess('Flower created successfully');
        this.toggleAddFlower();
      },
      error: (err) => {
        this.showError('Failed to create flower');
      }
    });
  }

  startEditFlower(flower: EventFlower) {
    this.editingFlowerId.set(flower.id);
    this.editFlower = {
      name: flower.name,
      pricePerStem: flower.pricePerStem,
      bunchSize: flower.bunchSize
    };
  }

  saveFlowerEdit(flowerId: string) {
    this.eventFlowerService.updateFlower(this.eventId, flowerId, this.editFlower).subscribe({
      next: (updatedFlower) => {
        this.flowers.set(this.flowers().map(f => f.id === flowerId ? updatedFlower : f));
        this.showSuccess('Flower updated successfully');
        this.editingFlowerId.set(null);
      },
      error: (err) => {
        this.showError('Failed to update flower');
      }
    });
  }

  cancelFlowerEdit() {
    this.editingFlowerId.set(null);
    this.editFlower = {};
  }

  deleteFlower(flowerId: string) {
    if (!confirm('Are you sure you want to delete this flower?')) return;

    this.eventFlowerService.deleteFlower(this.eventId, flowerId).subscribe({
      next: () => {
        this.flowers.set(this.flowers().filter(f => f.id !== flowerId));
        this.showSuccess('Flower deleted successfully');
      },
      error: (err) => {
        this.showError('Failed to delete flower');
      }
    });
  }

  // Recipe methods
  onTabChange(event: any) {
    // Tab index 3 is the Recipes tab (0=Overview, 1=Items, 2=Flowers, 3=Recipes)
    if (event.index === 3) {
      this.loadRecipeSummary();
      if (this.flowers().length === 0) {
        this.loadFlowers();
      }
    }
  }

  showAddFlowerToRecipe(itemId: string) {
    this.showingAddFlowerForItem.set(itemId);
    this.newRecipeEntry = { eventFlowerId: '', stemsNeeded: 0 };
  }

  cancelAddFlowerToRecipe() {
    this.showingAddFlowerForItem.set(null);
    this.newRecipeEntry = { eventFlowerId: '', stemsNeeded: 0 };
  }

  addFlowerToRecipe(itemId: string) {
    if (!this.newRecipeEntry.eventFlowerId || this.newRecipeEntry.stemsNeeded <= 0) {
      this.showError('Please select a flower and enter stems needed');
      return;
    }

    this.eventRecipeService.addFlowerToRecipe(this.eventId, itemId, this.newRecipeEntry).subscribe({
      next: () => {
        this.showSuccess('Flower added to recipe');
        this.cancelAddFlowerToRecipe();
        this.loadRecipeSummary();
      },
      error: (err) => {
        this.showError('Failed to add flower to recipe');
      }
    });
  }

  deleteRecipeEntry(itemId: string, entryId: string) {
    if (!confirm('Remove this flower from the recipe?')) return;

    this.eventRecipeService.deleteRecipeEntry(this.eventId, itemId, entryId).subscribe({
      next: () => {
        this.showSuccess('Flower removed from recipe');
        this.loadRecipeSummary();
      },
      error: (err) => {
        this.showError('Failed to remove flower from recipe');
      }
    });
  }

  // Utility methods
  formatCurrency(value: number): string {
    return '$' + value.toFixed(2);
  }

  goBack() {
    this.router.navigate(['/events']);
  }

  showSuccess(message: string) {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  showError(message: string) {
    this.snackBar.open(message, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
  }
}
