import { Component, OnInit, OnDestroy, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs';
import { EventService } from '../../../core/services/event.service';
import { FloristEvent } from '../../../shared/models/api.models';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-event-list',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    EmptyStateComponent
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Events</h1>
        <button mat-raised-button color="primary" (click)="createEvent()">
          <mat-icon>add</mat-icon>
          New Event
        </button>
      </div>

      <div class="filter-row">
        <mat-form-field appearance="outline" style="flex:1; max-width:300px">
          <mat-label>Search</mat-label>
          <input matInput [formControl]="searchControl" placeholder="Event name...">
          @if (searchControl.value) {
            <button matSuffix mat-icon-button (click)="searchControl.setValue('')"><mat-icon>close</mat-icon></button>
          }
        </mat-form-field>
      </div>

      @if (isLoading()) {
        <div class="loading-spinner">
          <mat-spinner></mat-spinner>
        </div>
      } @else if (errorMessage()) {
        <div class="error-state">
          <span>⚠️ {{ errorMessage() }}</span>
          <button mat-button color="primary" (click)="loadEvents()">Retry</button>
        </div>
      } @else if (filteredEvents().length > 0) {
      <table mat-table [dataSource]="filteredEvents()" class="mat-elevation-z2">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let event">{{ event.name }}</td>
        </ng-container>

        <ng-container matColumnDef="budget">
          <th mat-header-cell *matHeaderCellDef>Total Budget</th>
          <td mat-cell *matCellDef="let event">
            {{ event.totalBudget != null ? (event.totalBudget | currency) : '—' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="profitMultiple">
          <th mat-header-cell *matHeaderCellDef>Profit Multiple</th>
          <td mat-cell *matCellDef="let event">
            {{ event.profitMultiple != null ? (event.profitMultiple + 'x') : '—' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let event">
            <div class="action-buttons">
              <button mat-button color="primary" class="action-btn" (click)="openEvent(event.id)">
                Open
              </button>
              <button mat-icon-button color="warn" class="action-btn" (click)="deleteEvent(event)" aria-label="Delete event">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
      } @else {
        <app-empty-state
          [icon]="'🌸'"
          [title]="'No events yet'"
          [message]="'Create your first event to start planning.'"
          [actionLabel]="'Create Event'"
          [actionCallback]="createNewEvent">
        </app-empty-state>
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

    .filter-row { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; align-items: center; }

    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    table {
      width: 100%;
    }

    .action-buttons {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .action-btn {
      height: 44px !important;
    }

    .error-state {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;
      background: #fff3e0;
      border-left: 4px solid #ff9800;
      border-radius: 4px;
    }
  `]
})
export class EventListComponent implements OnInit, OnDestroy {
  events: FloristEvent[] = [];
  filteredEvents = signal<FloristEvent[]>([]);
  searchControl = new FormControl('');
  displayedColumns = ['name', 'budget', 'profitMultiple', 'actions'];
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  createNewEvent = () => this.createEvent();
  private destroy$ = new Subject<void>();

  constructor(
    private eventService: EventService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadEvents();
    this.searchControl.valueChanges.pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());
  }

  applyFilters() {
    const q = (this.searchControl.value || '').toLowerCase();
    this.filteredEvents.set(this.events.filter(e => !q || e.name.toLowerCase().includes(q)));
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  loadEvents() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.eventService.getEvents()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.events = response.items ?? [];
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error loading events:', err);
          this.errorMessage.set('Failed to load events. Please try again.');
        }
      });
  }

  createEvent() {
    const dialogRef = this.dialog.open(CreateEventDialogComponent, { width: '400px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.eventService.createEvent(result).subscribe({
          next: (event) => this.router.navigate(['/events', event.id]),
          error: (err) => {
            console.error('Error creating event:', err);
            this.snackBar.open('Failed to create event. Please try again.', 'Dismiss', { duration: 4000 });
          }
        });
      }
    });
  }

  openEvent(id: string) {
    this.router.navigate(['/events', id]);
  }

  deleteEvent(event: FloristEvent) {
    const dialogRef = this.dialog.open(ConfirmDeleteEventDialogComponent, {
      data: { message: `Delete event "${event.name}"? This action cannot be undone.` }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.eventService.deleteEvent(event.id).subscribe({
          next: () => {
            this.loadEvents();
          },
          error: (err) => {
            console.error('Error deleting event:', err);
            this.snackBar.open('Failed to delete event. Please try again.', 'Dismiss', { duration: 4000 });
          }
        });
      }
    });
  }
}

@Component({
  selector: 'app-create-event-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>New Event</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="Event name">
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Total Budget</mat-label>
          <input matInput type="number" formControlName="totalBudget" placeholder="0.00">
          <span matTextPrefix>$&nbsp;</span>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Profit Multiple</mat-label>
          <input matInput type="number" formControlName="profitMultiple" placeholder="1.0" step="0.1">
          <span matTextSuffix>&nbsp;x</span>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="submit()">Create</button>
    </mat-dialog-actions>
  `,
  styles: [`.form { display: flex; flex-direction: column; gap: 8px; padding-top: 8px; } .full-width { width: 100%; }`]
})
export class CreateEventDialogComponent {
  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    totalBudget: new FormControl<number | null>(null),
    profitMultiple: new FormControl<number>(1.0)
  });

  constructor(private dialogRef: MatDialogRef<CreateEventDialogComponent>) {}

  submit() {
    if (this.form.valid) {
      const { name, totalBudget, profitMultiple } = this.form.value;
      this.dialogRef.close({
        name,
        ...(totalBudget != null ? { totalBudget } : {}),
        ...(profitMultiple != null ? { profitMultiple } : {})
      });
    }
  }
}

@Component({
  selector: 'app-confirm-delete-event-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Delete Event</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">Delete</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDeleteEventDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { message: string }) {}
}
