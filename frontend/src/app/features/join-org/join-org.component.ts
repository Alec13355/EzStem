import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { OrgService } from '../../core/services/org.service';
import { AuthService } from '../../core/services/auth.service';
import { OrgPreviewResponse } from '../../shared/models/api.models';

@Component({
  selector: 'app-join-org',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="join-container">
      @if (loading()) {
        <div class="loading"><mat-spinner></mat-spinner></div>
      } @else if (error()) {
        <mat-card class="join-card">
          <mat-card-content>
            <div class="error-state">
              <mat-icon class="error-icon">error_outline</mat-icon>
              <h2>Invalid Invite</h2>
              <p>{{ error() }}</p>
              <button mat-raised-button color="primary" (click)="goHome()">Go to Events</button>
            </div>
          </mat-card-content>
        </mat-card>
      } @else if (preview()) {
        <mat-card class="join-card">
          <mat-card-content>
            <div class="join-state">
              <span class="org-icon">🌿</span>
              <h2>You're invited!</h2>
              <p class="org-name">{{ preview()!.orgName }}</p>
              <p class="invite-desc">You've been invited to join this team. Once you join, you'll have full access to their events, flowers, and recipes.</p>
              @if (joining()) {
                <mat-spinner diameter="36"></mat-spinner>
              } @else {
                <button mat-raised-button color="primary" (click)="joinOrg()">
                  <mat-icon>group_add</mat-icon>
                  Join Team
                </button>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .join-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 24px;
    }
    .join-card {
      max-width: 420px;
      width: 100%;
    }
    .loading { display: flex; justify-content: center; }
    .error-state, .join-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 16px 0;
      text-align: center;
    }
    .org-icon { font-size: 48px; }
    .error-icon { font-size: 48px; color: #e53935; width: 48px; height: 48px; }
    .org-name { font-size: 22px; font-weight: 700; color: #2e7d32; margin: 0; }
    .invite-desc { color: #555; margin: 0; }
    h2 { margin: 0; }
  `]
})
export class JoinOrgComponent implements OnInit {
  loading = signal(true);
  joining = signal(false);
  preview = signal<OrgPreviewResponse | null>(null);
  error = signal<string | null>(null);
  private token = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orgService: OrgService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.error.set('No invite token found in the URL.');
      this.loading.set(false);
      return;
    }

    this.orgService.getInvitePreview(this.token).subscribe({
      next: (preview) => {
        this.preview.set(preview);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('This invite link is invalid or has already been used.');
        this.loading.set(false);
      }
    });
  }

  joinOrg() {
    this.joining.set(true);
    this.orgService.acceptInvite(this.token).subscribe({
      next: () => {
        this.router.navigate(['/events']);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to join the team. Please try again.');
        this.joining.set(false);
      }
    });
  }

  goHome() {
    this.router.navigate(['/events']);
  }
}
