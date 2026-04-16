import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
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
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
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
          <input matInput [formControl]="searchControl" placeholder="Name or client...">
          @if (searchControl.value) {
            <button matSuffix mat-icon-button (click)="searchControl.setValue('')"><mat-icon>close</mat-icon></button>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:160px">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="statusFilter">
            <mat-option value="">All Statuses</mat-option>
            @for (s of eventStatuses; track s) {
              <mat-option [value]="s">{{ s }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:160px">
          <mat-label>From Date</mat-label>
          <input matInput [matDatepicker]="fromPicker" [formControl]="dateFromFilter">
          <mat-datepicker-toggle matSuffix [for]="fromPicker"></mat-datepicker-toggle>
          <mat-datepicker #fromPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:160px">
          <mat-label>To Date</mat-label>
          <input matInput [matDatepicker]="toPicker" [formControl]="dateToFilter">
          <mat-datepicker-toggle matSuffix [for]="toPicker"></mat-datepicker-toggle>
          <mat-datepicker #toPicker></mat-datepicker>
        </mat-form-field>
      </div>

      @if (searchControl.value || statusFilter.value || dateFromFilter.value || dateToFilter.value) {
        <mat-chip-set style="margin-bottom:12px">
          @if (searchControl.value) {
            <mat-chip (removed)="searchControl.setValue('')">
              Search: {{ searchControl.value }}
              <button matChipRemove><mat-icon>cancel</mat-icon></button>
            </mat-chip>
          }
          @if (statusFilter.value) {
            <mat-chip (removed)="statusFilter.setValue('')">
              Status: {{ statusFilter.value }}
              <button matChipRemove><mat-icon>cancel</mat-icon></button>
            </mat-chip>
          }
          @if (dateFromFilter.value) {
            <mat-chip (removed)="dateFromFilter.setValue(null)">
              From: {{ dateFromFilter.value | date:'shortDate' }}
              <button matChipRemove><mat-icon>cancel</mat-icon></button>
            </mat-chip>
          }
          @if (dateToFilter.value) {
            <mat-chip (removed)="dateToFilter.setValue(null)">
              To: {{ dateToFilter.value | date:'shortDate' }}
              <button matChipRemove><mat-icon>cancel</mat-icon></button>
            </mat-chip>
          }
        </mat-chip-set>
      }

      @if (isLoading) {
        <div class="loading-spinner">
          <mat-spinner></mat-spinner>
        </div>
      } @else if (filteredEvents.length > 0) {
      <table mat-table [dataSource]="filteredEvents" class="mat-elevation-z2">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let event">{{ event.name }}</td>
        </ng-container>

        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Date</th>
          <td mat-cell *matCellDef="let event">{{ event.eventDate | date:'short' }}</td>
        </ng-container>

        <ng-container matColumnDef="client">
          <th mat-header-cell *matHeaderCellDef>Client</th>
          <td mat-cell *matCellDef="let event">{{ event.clientName || 'N/A' }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let event">
            <mat-chip [class]="'status-' + event.status.toLowerCase()">
              {{ event.status }}
            </mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let event">
            <div class="action-buttons">
              <button mat-icon-button color="accent" class="action-btn" (click)="editEvent(event.id)" aria-label="Edit event">
                <mat-icon>edit</mat-icon>
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
    }

    .action-btn {
      width: 44px !important;
      height: 44px !important;
    }

    .status-draft { background-color: #e0e0e0; }
    .status-confirmed { background-color: #81c784; }
    .status-ordered { background-color: #64b5f6; }
    .status-completed { background-color: #9e9e9e; }
  `]
})
export class EventListComponent implements OnInit, OnDestroy {
  events: FloristEvent[] = [];
  filteredEvents: FloristEvent[] = [];
  searchControl = new FormControl('');
  statusFilter = new FormControl('');
  dateFromFilter = new FormControl<Date | null>(null);
  dateToFilter = new FormControl<Date | null>(null);
  readonly eventStatuses = ['Draft', 'Confirmed', 'Ordered', 'Completed'];
  createNewEvent = () => this.createEvent();
  displayedColumns = ['name', 'date', 'client', 'status', 'actions'];
  isLoading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private eventService: EventService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadEvents();

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['q']) this.searchControl.setValue(params['q'], { emitEvent: false });
      if (params['status']) this.statusFilter.setValue(params['status'], { emitEvent: false });
      this.applyFilters();
    });

    this.searchControl.valueChanges.pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());
    this.statusFilter.valueChanges.pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());
    this.dateFromFilter.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());
    this.dateToFilter.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());
  }

  applyFilters() {
    const q = (this.searchControl.value || '').toLowerCase();
    const status = this.statusFilter.value || '';
    const dateFrom = this.dateFromFilter.value;
    const dateTo = this.dateToFilter.value;
    this.filteredEvents = this.events.filter(e => {
      const matchesSearch = !q || e.name.toLowerCase().includes(q) || (e.clientName || '').toLowerCase().includes(q);
      const matchesStatus = !status || e.status === status;
      const eventDate = new Date(e.eventDate);
      const matchesFrom = !dateFrom || eventDate >= dateFrom;
      const matchesTo = !dateTo || eventDate <= dateTo;
      return matchesSearch && matchesStatus && matchesFrom && matchesTo;
    });
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  loadEvents() {
    this.isLoading = true;
    this.eventService.getEvents()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.events = response.items ?? [];
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error loading events:', err);
        }
      });
  }

  createEvent() {
    this.router.navigate(['/events', 'new']);
  }

  editEvent(id: string) {
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
