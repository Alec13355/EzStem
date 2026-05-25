import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { UserSettingsService } from './core/services/user-settings.service';
import { OrgService } from './core/services/org.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly authService = inject(AuthService);
  readonly orgService = inject(OrgService);
  private themeService = inject(ThemeService);
  private userSettingsService = inject(UserSettingsService);
  constructor() {
    // Load and apply user theme on app init
    this.authService.isAuthenticated() && this.loadUserTheme();
  }

  private loadUserTheme() {
    this.userSettingsService.getSettings().subscribe({
      next: (settings) => {
        this.themeService.applyTheme(settings.theme);
      },
      error: (err) => {
        console.log('No user settings found, using defaults');
      }
    });
  }

  signOut() {
    this.authService.signOut();
  }
}
