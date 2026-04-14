import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { EventService } from '../../../core/services/event.service';
import { FloristEvent } from '../../../shared/models/api.models';

@Component({
  selector: 'app-event-list',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
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
              <button mat-icon-button color="primary" (click)="viewEvent(event.id)">
                <mat-icon>visibility</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteEvent(event)">
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
    private router: Router
  ) {}

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.eventService.getEvents().subscribe({
      next: (events) => {
        this.events = events;
      },
      error: (err) => {
        console.error('Error loading events:', err);
      }
    });
  }

  createEvent() {
    this.router.navigate(['/events', 'new']);
  }

  viewEvent(id: string) {
    this.router.navigate(['/events', id]);
  }

  deleteEvent(event: FloristEvent) {
    if (confirm(`Are you sure you want to delete "${event.name}"?`)) {
      this.eventService.deleteEvent(event.id).subscribe({
        next: () => {
          this.loadEvents();
        },
        error: (err) => {
          console.error('Error deleting event:', err);
        }
      });
    }
  }
}
