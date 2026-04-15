import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EventService } from '../../../core/services/event.service';
import { FloristEvent } from '../../../shared/models/api.models';

@Component({
  selector: 'app-event-list',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule
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

      <table mat-table [dataSource]="events" class="mat-elevation-z2">
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
export class EventListComponent implements OnInit {
  events: FloristEvent[] = [];
  displayedColumns = ['name', 'date', 'client', 'status', 'actions'];

  constructor(
    private eventService: EventService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.eventService.getEvents().subscribe({
      next: (response) => {
        this.events = response.items ?? [];
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
