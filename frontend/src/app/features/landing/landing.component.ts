import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="landing">
      <div class="hero">
        <div class="hero-content">
          <mat-icon class="hero-icon">local_florist</mat-icon>
          <h1 class="app-title">EzStem</h1>
          <p class="tagline">Simplify your floral business</p>
          <p class="description">
            Track your flower inventory, build arrangement recipes, plan events,
            and price your work — all in one elegant tool built for florists.
          </p>
          <button mat-raised-button class="signin-btn" (click)="signIn()">
            <mat-icon>login</mat-icon>
            Sign in to get started
          </button>
        </div>
      </div>

      <div class="features">
        <mat-card class="feature-card">
          <mat-card-content>
            <mat-icon class="feature-icon">inventory_2</mat-icon>
            <h3>Item Library</h3>
            <p>Manage your full flower inventory with costs, vendors, and seasonal availability.</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-content>
            <mat-icon class="feature-icon">menu_book</mat-icon>
            <h3>Recipe Builder</h3>
            <p>Create and price arrangement recipes. Know your true cost before you quote.</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-content>
            <mat-icon class="feature-icon">event</mat-icon>
            <h3>Event Planning</h3>
            <p>Plan events, manage orders, and track what you need to order and when.</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .landing {
      min-height: 100vh;
      background: #fff;
    }

    .hero {
      min-height: calc(100vh - 64px);
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(145deg, #f1f8e9 0%, #e8f5e9 40%, #c8e6c9 100%);
      padding: 48px 24px;
      text-align: center;
    }

    .hero-content {
      max-width: 640px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .hero-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #2e7d32;
      filter: drop-shadow(0 4px 12px rgba(46, 125, 50, 0.3));
    }

    .app-title {
      font-size: 3.5rem;
      font-weight: 700;
      color: #1b5e20;
      margin: 0;
      letter-spacing: -1px;
    }

    .tagline {
      font-size: 1.4rem;
      color: #388e3c;
      margin: 0;
      font-weight: 500;
    }

    .description {
      font-size: 1.05rem;
      color: #4e6a50;
      line-height: 1.7;
      margin: 0;
      max-width: 520px;
    }

    .signin-btn {
      margin-top: 8px;
      padding: 12px 32px;
      font-size: 1rem;
      font-weight: 600;
      background-color: #2e7d32 !important;
      color: white !important;
      border-radius: 32px !important;
      height: 52px;
      box-shadow: 0 4px 16px rgba(46, 125, 50, 0.35) !important;
      transition: transform 0.15s ease, box-shadow 0.15s ease;

      mat-icon {
        margin-right: 8px;
      }
    }

    .signin-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(46, 125, 50, 0.45) !important;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 28px;
      padding: 64px 48px;
      background: #fafafa;
      max-width: 1100px;
      margin: 0 auto;
    }

    .feature-card {
      border-radius: 16px !important;
      text-align: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      border: 1px solid #e8f5e9 !important;
    }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(46, 125, 50, 0.15) !important;
    }

    .feature-card mat-card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 32px 24px !important;
    }

    .feature-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #43a047;
      background: #e8f5e9;
      border-radius: 50%;
      padding: 16px;
      box-sizing: content-box;
    }

    .feature-card h3 {
      font-size: 1.2rem;
      font-weight: 600;
      color: #1b5e20;
      margin: 0;
    }

    .feature-card p {
      font-size: 0.95rem;
      color: #5a6b5c;
      line-height: 1.6;
      margin: 0;
    }

    @media (max-width: 600px) {
      .app-title {
        font-size: 2.5rem;
      }

      .features {
        padding: 40px 20px;
      }
    }
  `]
})
export class LandingComponent {
  private authService = inject(AuthService);

  signIn() {
    this.authService.signIn();
  }
}
