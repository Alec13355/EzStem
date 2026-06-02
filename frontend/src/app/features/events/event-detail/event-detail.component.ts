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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { EventService } from '../../../core/services/event.service';
import { MatDividerModule } from '@angular/material/divider';
import { EventItemService } from '../../../core/services/event-item.service';
import { EventItemSupplyService } from '../../../core/services/event-item-supply.service';
import { EventFlowerService } from '../../../core/services/event-flower.service';
import { EventRecipeService } from '../../../core/services/event-recipe.service';
import { MasterFlowerService } from '../../../core/services/master-flower.service';
import {
  FloristEvent,
  EventItem,
  EventItemSupply,
  EventFlower,
  MasterFlower,
  CreateEventItemRequest,
  UpdateEventItemRequest,
  CreateEventItemSupplyRequest,
  CreateEventFlowerRequest,
  UpdateEventFlowerRequest,
  CreateEventItemFlowerRequest,
  EventRecipeSummaryResponse,
  RecipeItemSummary,
  RecipeLineItem,
  EventFlowerImportResult
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
    MatCheckboxModule,
    MatExpansionModule,
    RouterModule,
    MatDividerModule
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
                <div class="action-buttons">
                  <input #pdfInput type="file" accept=".pdf" style="display: none" (change)="onPdfSelected($event)">
                  <button mat-raised-button color="accent" (click)="toggleMasterPicker()">
                    <mat-icon>{{ showMasterPicker() ? 'close' : 'list' }}</mat-icon>
                    {{ showMasterPicker() ? 'Cancel' : 'Add from Master List' }}
                  </button>
                  <button mat-raised-button color="accent" (click)="pdfInput.click()" [disabled]="uploadingPdf()">
                    <mat-icon>upload_file</mat-icon>
                    {{ uploadingPdf() ? 'Importing...' : 'Import PDF' }}
                  </button>
                  <button mat-raised-button color="primary" (click)="toggleAddFlower()">
                    {{ showAddFlower() ? 'Cancel' : 'Add Flower' }}
                  </button>
                </div>
              </div>

              @if (showMasterPicker()) {
                <mat-card class="master-picker">
                  <mat-card-header>
                    <mat-card-title>Select from Master Flower List</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    @if (loadingMaster()) {
                      <div class="loading-container">
                        <p>Loading master flowers...</p>
                      </div>
                    } @else {
                      @for (category of masterCategories(); track category) {
                        <div class="master-category">
                          <h4>{{ category }}</h4>
                          <table mat-table [dataSource]="masterFlowersByCategory()[category]" class="master-flowers-table">
                            <ng-container matColumnDef="select">
                              <th mat-header-cell *matHeaderCellDef>Select</th>
                              <td mat-cell *matCellDef="let flower">
                                <mat-checkbox 
                                  [checked]="selectedMasterIds().has(flower.id)"
                                  (change)="toggleMasterSelection(flower.id)">
                                </mat-checkbox>
                              </td>
                            </ng-container>

                            <ng-container matColumnDef="name">
                              <th mat-header-cell *matHeaderCellDef>Name</th>
                              <td mat-cell *matCellDef="let flower">{{ flower.name }}</td>
                            </ng-container>

                            <ng-container matColumnDef="unit">
                              <th mat-header-cell *matHeaderCellDef>Unit</th>
                              <td mat-cell *matCellDef="let flower">{{ flower.unit }}</td>
                            </ng-container>

                            <ng-container matColumnDef="cost">
                              <th mat-header-cell *matHeaderCellDef>Cost/Unit</th>
                              <td mat-cell *matCellDef="let flower">{{ formatCurrency(flower.costPerUnit) }}</td>
                            </ng-container>

                            <ng-container matColumnDef="priceOverride">
                              <th mat-header-cell *matHeaderCellDef>Price Override</th>
                              <td mat-cell *matCellDef="let flower">
                                @if (selectedMasterIds().has(flower.id)) {
                                  <input matInput 
                                    type="number" 
                                    step="0.01" 
                                    placeholder="Optional"
                                    class="price-override-input"
                                    [value]="masterPriceOverrides()[flower.id] || ''"
                                    (input)="updatePriceOverride(flower.id, $event)">
                                }
                              </td>
                            </ng-container>

                            <tr mat-header-row *matHeaderRowDef="masterPickerColumns"></tr>
                            <tr mat-row *matRowDef="let row; columns: masterPickerColumns;"></tr>
                          </table>
                        </div>
                      }
                      
                      <div class="master-picker-actions">
                        <button mat-raised-button 
                          color="primary" 
                          (click)="addSelectedFromMaster()" 
                          [disabled]="selectedMasterIds().size === 0">
                          Add Selected ({{ selectedMasterIds().size }})
                        </button>
                      </div>
                    }
                  </mat-card-content>
                </mat-card>
              }

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
                      @if (flower.masterFlowerId) {
                        <mat-icon class="master-indicator" title="From master list">bookmark</mat-icon>
                      }
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
                      @if (flower.masterFlowerId) {
                        <mat-checkbox [(ngModel)]="syncToMaster" class="sync-checkbox">
                          Sync to master
                        </mat-checkbox>
                      }
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
                  @for (itemSummary of recipeSummary()!.items; track itemSummary.eventItemId; let i = $index) {
                    <mat-card class="recipe-card">
                      <mat-card-header>
                        @if (itemSummary.flowers.length > 0) {
                          <div class="budget-status-bar" [class.over-budget]="itemSummary.totalRawCost > getItemBudget(itemSummary)">
                            <span class="budget-label">💰 Budget: {{ formatCurrency(getItemBudget(itemSummary)) }}</span>
                            <span class="budget-divider">|</span>
                            <span class="running-label">Running: {{ formatCurrency(itemSummary.totalRawCost) }}</span>
                            <span class="budget-divider">|</span>
                            <span class="status-label">{{ itemSummary.totalRawCost > getItemBudget(itemSummary) ? '❌ Over Budget' : '✅ In Budget' }}</span>
                          </div>
                        }
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

                  <!-- Amount to Order -->
                  @if (recipeSummary()?.flowerProcurement?.length) {
                    <mat-card class="order-summary-card">
                      <mat-card-header>
                        <mat-card-title>🌸 Amount to Order</mat-card-title>
                        <mat-card-subtitle>Total stems and bunches needed across all arrangements</mat-card-subtitle>
                      </mat-card-header>
                      <mat-card-content>
                        <table mat-table [dataSource]="recipeSummary()!.flowerProcurement!" class="order-summary-table mat-elevation-z1">
                          <ng-container matColumnDef="flowerName">
                            <th mat-header-cell *matHeaderCellDef>Flower</th>
                            <td mat-cell *matCellDef="let line"><strong>{{ line.flowerName }}</strong></td>
                          </ng-container>

                          <ng-container matColumnDef="totalStems">
                            <th mat-header-cell *matHeaderCellDef>Total Stems</th>
                            <td mat-cell *matCellDef="let line">{{ line.totalStemsNeeded }}</td>
                          </ng-container>

                          <ng-container matColumnDef="bunchesNeeded">
                            <th mat-header-cell *matHeaderCellDef>Bunches to Order</th>
                            <td mat-cell *matCellDef="let line">{{ line.bunchesNeeded }}</td>
                          </ng-container>

                          <ng-container matColumnDef="totalCost">
                            <th mat-header-cell *matHeaderCellDef>Total Cost</th>
                            <td mat-cell *matCellDef="let line">{{ formatCurrency(line.totalCost) }}</td>
                          </ng-container>

                          <tr mat-header-row *matHeaderRowDef="orderSummaryColumns"></tr>
                          <tr mat-row *matRowDef="let row; columns: orderSummaryColumns;"></tr>
                        </table>
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
          <!-- Tab 5: Supplies -->
          <mat-tab label="Supplies">
            <div class="tab-content">
              <h2>Supplies</h2>
              <p class="tab-desc">Non-flower costs per arrangement (vases, ribbon, etc.). These reduce your profit.</p>

              @if (items().length === 0) {
                <div class="empty-state">Add items first, then come back to add supplies for each one.</div>
              } @else {
                @for (item of items(); track item.id) {
                  <mat-card class="supply-item-card">
                    <mat-card-header>
                      <mat-card-title>{{ item.name }}</mat-card-title>
                      <mat-card-subtitle>
                        {{ formatCurrency(item.price) }} × {{ item.quantity }}
                        @if (item.totalSupplyCost > 0) {
                          — <span class="supply-cost-label">{{ formatCurrency(item.totalSupplyCost) }}/item · {{ formatCurrency(item.totalSupplyCost * item.quantity) }} total</span>
                        }
                      </mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      @if (item.supplies && item.supplies.length > 0) {
                        <table mat-table [dataSource]="item.supplies" class="supplies-table">
                          <ng-container matColumnDef="name">
                            <th mat-header-cell *matHeaderCellDef>Supply</th>
                            <td mat-cell *matCellDef="let supply">{{ supply.name }}</td>
                          </ng-container>
                          <ng-container matColumnDef="costPerUnit">
                            <th mat-header-cell *matHeaderCellDef>Cost/Unit</th>
                            <td mat-cell *matCellDef="let supply">{{ formatCurrency(supply.costPerUnit) }}</td>
                          </ng-container>
                          <ng-container matColumnDef="qty">
                            <th mat-header-cell *matHeaderCellDef>Qty per Item</th>
                            <td mat-cell *matCellDef="let supply">{{ supply.quantity }}</td>
                          </ng-container>
                          <ng-container matColumnDef="lineTotal">
                            <th mat-header-cell *matHeaderCellDef>Per Item</th>
                            <td mat-cell *matCellDef="let supply">{{ formatCurrency(supply.lineTotalCost) }}</td>
                          </ng-container>
                          <ng-container matColumnDef="grandTotal">
                            <th mat-header-cell *matHeaderCellDef>Event Total</th>
                            <td mat-cell *matCellDef="let supply"><strong>{{ formatCurrency(supply.lineTotalCost * item.quantity) }}</strong></td>
                          </ng-container>
                          <ng-container matColumnDef="supplyActions">
                            <th mat-header-cell *matHeaderCellDef></th>
                            <td mat-cell *matCellDef="let supply">
                              <button mat-icon-button (click)="deleteSupply(item.id, supply.id)">
                                <mat-icon>delete</mat-icon>
                              </button>
                            </td>
                          </ng-container>
                          <tr mat-header-row *matHeaderRowDef="supplyColumns"></tr>
                          <tr mat-row *matRowDef="let row; columns: supplyColumns;"></tr>
                        </table>
                      }

                      @if (addingSupplyForItemId() === item.id) {
                        <div class="supply-add-row">
                          <mat-form-field class="supply-field">
                            <mat-label>Supply Name</mat-label>
                            <input matInput [(ngModel)]="newSupply.name" placeholder="e.g. Vases, Ribbon">
                          </mat-form-field>
                          <mat-form-field class="supply-field supply-field--sm">
                            <mat-label>Cost/Unit</mat-label>
                            <input matInput [(ngModel)]="newSupply.costPerUnit" type="number" step="0.01">
                            <span matSuffix>$</span>
                          </mat-form-field>
                          <mat-form-field class="supply-field supply-field--xs">
                            <mat-label>Qty per item</mat-label>
                            <input matInput [(ngModel)]="newSupply.quantity" type="number">
                          </mat-form-field>
                          <button mat-raised-button color="primary" (click)="createSupply(item.id)">Add</button>
                          <button mat-button (click)="cancelAddSupply()">Cancel</button>
                        </div>
                      } @else {
                        <button mat-stroked-button style="margin-top:12px" (click)="showAddSupplyFor(item.id)">
                          <mat-icon>add</mat-icon> Add Supply
                        </button>
                      }
                    </mat-card-content>
                  </mat-card>
                }

                <div class="supplies-event-total">
                  <span>Total Supplies (all items):</span>
                  <strong>{{ formatCurrency(totalEventSupplyCost()) }}</strong>
                </div>
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

    .supply-item-card {
      margin-bottom: 16px;
    }

    .supply-cost-label {
      color: #e65100;
      font-weight: 500;
    }

    .supply-add-row {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
      padding: 12px;
      background: #fafafa;
      border-radius: 4px;
      margin-top: 12px;
    }

    .supply-field { width: 180px; }
    .supply-field--sm { width: 120px; }
    .supply-field--xs { width: 90px; }

    .supplies-table {
      width: 100%;
    }

    .supplies-event-total {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
      padding: 12px 16px;
      background: #fff3e0;
      border-radius: 4px;
      font-size: 15px;
    }

    .tab-desc {
      color: #555;
      margin: 0 0 20px;
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

    .master-picker {
      margin-bottom: 24px;
    }

    .master-category {
      margin-bottom: 24px;
    }

    .master-category h4 {
      margin: 16px 0 8px 0;
      color: #666;
    }

    .master-flowers-table {
      width: 100%;
    }

    .price-override-input {
      width: 100px;
      border: 1px solid #ccc;
      padding: 4px;
      border-radius: 4px;
    }

    .master-picker-actions {
      margin-top: 24px;
      text-align: right;
    }

    .master-indicator {
      font-size: 18px;
      height: 18px;
      width: 18px;
      vertical-align: middle;
      margin-left: 8px;
      color: #4caf50;
    }

    .sync-checkbox {
      margin-right: 8px;
    }

    .budget-status-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 20px;
      background: #e8f5e9;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 8px;
      flex-wrap: wrap;
      width: 100%;
    }

    .budget-status-bar.over-budget {
      background: #ffebee;
      color: #c62828;
    }

    .budget-divider {
      opacity: 0.4;
    }

    .order-summary-card {
      margin-top: 24px;
      margin-bottom: 24px;
      border-left: 4px solid #43a047;
    }

    .order-summary-table {
      width: 100%;
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
  addingSupplyForItemId = signal<string | null>(null);

  totalEventSupplyCost = computed(() =>
    this.items().reduce((sum, i) => sum + (i.totalSupplyCost ?? 0) * i.quantity, 0)
  );


  // Master flower picker state
  showMasterPicker = signal(false);
  masterFlowers = signal<MasterFlower[]>([]);
  uploadingPdf = signal(false);
  masterCategories = computed(() => [...new Set(this.masterFlowers().map(f => f.category))].sort());
  masterFlowersByCategory = computed(() => {
    const grouped: Record<string, MasterFlower[]> = {};
    for (const f of this.masterFlowers()) {
      if (!grouped[f.category]) grouped[f.category] = [];
      grouped[f.category].push(f);
    }
    return grouped;
  });
  selectedMasterIds = signal<Set<string>>(new Set());
  masterPriceOverrides = signal<Record<string, number>>({});
  loadingMaster = signal(false);
  syncToMaster = false;

  // Table columns
  itemColumns = ['name', 'price', 'quantity', 'actions'];
  supplyColumns = ['name', 'costPerUnit', 'qty', 'lineTotal', 'grandTotal', 'supplyActions'];
  flowerColumns = ['name', 'pricePerStem', 'bunchSize', 'actions'];
  recipeColumns = ['flower', 'stemsPerUnit', 'totalStems', 'costPerBunch', 'lineCost', 'actions'];
  orderSummaryColumns = ['flowerName', 'totalStems', 'bunchesNeeded', 'totalCost'];
  masterPickerColumns = ['select', 'name', 'unit', 'cost', 'priceOverride'];

  // Form data
  eventId: string = '';
  eventName: string = '';
  eventDate: string = '';
  clientName: string = '';
  totalBudget: number = 0;
  profitMultiple: number = 2.5;

  newItem: CreateEventItemRequest = { name: '', price: 0, quantity: 1 };
  newSupply: CreateEventItemSupplyRequest = { name: '', costPerUnit: 0, quantity: 1 };
  newFlower: CreateEventFlowerRequest = { name: '', pricePerStem: 0, bunchSize: 10 };
  newRecipeEntry: CreateEventItemFlowerRequest = { eventFlowerId: '', stemsNeeded: 0 };

  editItem: UpdateEventItemRequest = {};
  editFlower: UpdateEventFlowerRequest = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private eventItemService: EventItemService,
    private eventItemSupplyService: EventItemSupplyService,
    private eventFlowerService: EventFlowerService,
    private eventRecipeService: EventRecipeService,
    private masterFlowerService: MasterFlowerService,
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
        this.items.update(items => items.map(i => {
          if (i.id !== itemId) return i;
          // Preserve existing supplies from local state since backend returns them too
          return { ...updatedItem, supplies: updatedItem.supplies ?? i.supplies };
        }));
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

  // Supply methods
  showAddSupplyFor(itemId: string) {
    this.addingSupplyForItemId.set(itemId);
    this.newSupply = { name: '', costPerUnit: 0, quantity: 1 };
  }

  cancelAddSupply() {
    this.addingSupplyForItemId.set(null);
    this.newSupply = { name: '', costPerUnit: 0, quantity: 1 };
  }

  createSupply(itemId: string) {
    if (!this.newSupply.name || this.newSupply.costPerUnit <= 0 || this.newSupply.quantity <= 0) {
      this.showError('Please fill all supply fields with valid values');
      return;
    }
    this.eventItemSupplyService.createSupply(this.eventId, itemId, this.newSupply).subscribe({
      next: (supply) => {
        this.items.update(items => items.map(i => {
          if (i.id !== itemId) return i;
          const supplies = [...(i.supplies ?? []), supply];
          const totalSupplyCost = supplies.reduce((sum, s) => sum + s.lineTotalCost, 0);
          return { ...i, supplies, totalSupplyCost };
        }));
        this.cancelAddSupply();
        this.showSuccess('Supply added');
      },
      error: () => this.showError('Failed to add supply')
    });
  }

  deleteSupply(itemId: string, supplyId: string) {
    this.eventItemSupplyService.deleteSupply(this.eventId, itemId, supplyId).subscribe({
      next: () => {
        this.items.update(items => items.map(i => {
          if (i.id !== itemId) return i;
          const supplies = (i.supplies ?? []).filter(s => s.id !== supplyId);
          const totalSupplyCost = supplies.reduce((sum, s) => sum + s.lineTotalCost, 0);
          return { ...i, supplies, totalSupplyCost };
        }));
        this.showSuccess('Supply removed');
      },
      error: () => this.showError('Failed to remove supply')
    });
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

  onPdfSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.[0]) return;
    const file = input.files[0];

    this.uploadingPdf.set(true);
    this.eventFlowerService.importFromPdf(this.eventId, file).subscribe({
      next: (result: EventFlowerImportResult) => {
        this.uploadingPdf.set(false);
        const msg = result.errors.length > 0
          ? `Imported ${result.imported}, skipped ${result.skipped}. Errors: ${result.errors.join(', ')}`
          : `Imported ${result.imported} flower${result.imported !== 1 ? 's' : ''}, skipped ${result.skipped}`;
        this.snackBar.open(msg, 'Close', { duration: 5000 });
        this.loadFlowers();
        input.value = '';
      },
      error: () => {
        this.uploadingPdf.set(false);
        this.showError('PDF import failed');
        input.value = '';
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
    this.syncToMaster = false;
  }

  saveFlowerEdit(flowerId: string) {
    const currentFlower = this.flowers().find(f => f.id === flowerId);
    
    this.eventFlowerService.updateFlower(this.eventId, flowerId, this.editFlower).subscribe({
      next: (updatedFlower) => {
        this.flowers.set(this.flowers().map(f => f.id === flowerId ? updatedFlower : f));
        this.showSuccess('Flower updated successfully');
        
        // Sync to master list if checkbox was checked and flower has masterFlowerId
        if (this.syncToMaster && currentFlower?.masterFlowerId && this.editFlower.pricePerStem != null) {
          this.masterFlowerService.update(currentFlower.masterFlowerId, { 
            costPerUnit: this.editFlower.pricePerStem 
          }).subscribe({
            next: () => {
              this.showSuccess('Master list updated');
            },
            error: () => {
              this.showError('Flower updated but failed to sync to master list');
            }
          });
        }
        
        this.editingFlowerId.set(null);
        this.syncToMaster = false;
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
    // Tab index 3 is Recipes (0=Overview, 1=Items, 2=Flowers, 3=Recipes, 4=Supplies)
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

  // Master flower picker methods
  toggleMasterPicker() {
    if (!this.showMasterPicker()) {
      this.loadMasterFlowers();
    }
    this.showMasterPicker.update(v => !v);
  }

  loadMasterFlowers() {
    this.loadingMaster.set(true);
    this.masterFlowerService.getAll().subscribe({
      next: (flowers) => {
        this.masterFlowers.set(flowers.filter(f => f.isActive));
        this.loadingMaster.set(false);
      },
      error: () => {
        this.showError('Failed to load master flowers');
        this.loadingMaster.set(false);
      }
    });
  }

  toggleMasterSelection(id: string) {
    const current = new Set(this.selectedMasterIds());
    if (current.has(id)) {
      current.delete(id);
      // Also remove price override
      const overrides = { ...this.masterPriceOverrides() };
      delete overrides[id];
      this.masterPriceOverrides.set(overrides);
    } else {
      current.add(id);
    }
    this.selectedMasterIds.set(current);
  }

  updatePriceOverride(id: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    const overrides = { ...this.masterPriceOverrides() };
    if (isNaN(value) || value <= 0) {
      delete overrides[id];
    } else {
      overrides[id] = value;
    }
    this.masterPriceOverrides.set(overrides);
  }

  addSelectedFromMaster() {
    const selections = Array.from(this.selectedMasterIds()).map(id => ({
      masterFlowerId: id,
      pricePerStemOverride: this.masterPriceOverrides()[id]
    }));
    
    if (selections.length === 0) {
      this.showError('Please select at least one flower');
      return;
    }
    
    this.eventFlowerService.addFromMaster(this.eventId, { selections }).subscribe({
      next: (flowers) => {
        this.flowers.update(f => [...f, ...flowers]);
        this.selectedMasterIds.set(new Set());
        this.masterPriceOverrides.set({});
        this.showMasterPicker.set(false);
        this.showSuccess(`Added ${flowers.length} flowers from master list`);
      },
      error: () => {
        this.showError('Failed to add flowers from master list');
      }
    });
  }

  // Utility methods
  getItemBudget(item: RecipeItemSummary): number {
    return item.totalRevenue / (this.profitMultiple || 2.5);
  }

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
