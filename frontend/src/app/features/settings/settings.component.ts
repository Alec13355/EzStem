import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ThemeService } from '../../core/services/theme.service';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { UserTheme, PageTheme } from '../../shared/models/api.models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Settings</h1>
      </div>

      @if (loading()) {
        <div class="loading-spinner">
          <mat-spinner></mat-spinner>
        </div>
      } @else {
        <!-- Typography Section -->
        <mat-card class="settings-section">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>text_fields</mat-icon>
              Typography
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="description">Adjust the global font size across the entire application.</p>
            
            <div class="font-size-section">
              <div class="font-size-row">
                <label>Global Font Size</label>
                <input type="range" 
                       [min]="themeService.FONT_SIZE_MIN" 
                       [max]="themeService.FONT_SIZE_MAX" 
                       [step]="1"
                       [value]="draftTheme().globalFontSize ?? themeService.FONT_SIZE_DEFAULT"
                       (input)="onFontSizeChange($event)">
                <span class="font-size-value">{{ draftTheme().globalFontSize ?? themeService.FONT_SIZE_DEFAULT }}px</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Color Theme Section -->
        <mat-card class="settings-section">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>palette</mat-icon>
              Color Theme Customization
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="description">Customize background colors for each page. Changes apply immediately after saving.</p>

            <div class="page-section">
              <h3>Events Page</h3>
              <div class="color-row">
                <label>Primary Background</label>
                <input type="color" [value]="getPageColor('events', 'primaryBackground')" 
                       (input)="onColorChange('events', 'primaryBackground', $event)">
                <span class="hex-value">{{ getPageColor('events', 'primaryBackground') }}</span>
              </div>
              <div class="color-row">
                <label>Card Background</label>
                <input type="color" [value]="getPageColor('events', 'cardBackground')" 
                       (input)="onColorChange('events', 'cardBackground', $event)">
                <span class="hex-value">{{ getPageColor('events', 'cardBackground') }}</span>
              </div>
            </div>

            <div class="page-section">
              <h3>Master Flowers Page</h3>
              <div class="color-row">
                <label>Primary Background</label>
                <input type="color" [value]="getPageColor('masterFlowers', 'primaryBackground')" 
                       (input)="onColorChange('masterFlowers', 'primaryBackground', $event)">
                <span class="hex-value">{{ getPageColor('masterFlowers', 'primaryBackground') }}</span>
              </div>
              <div class="color-row">
                <label>Card Background</label>
                <input type="color" [value]="getPageColor('masterFlowers', 'cardBackground')" 
                       (input)="onColorChange('masterFlowers', 'cardBackground', $event)">
                <span class="hex-value">{{ getPageColor('masterFlowers', 'cardBackground') }}</span>
              </div>
            </div>

            <div class="page-section">
              <h3>Recipes Page</h3>
              <div class="color-row">
                <label>Primary Background</label>
                <input type="color" [value]="getPageColor('recipes', 'primaryBackground')" 
                       (input)="onColorChange('recipes', 'primaryBackground', $event)">
                <span class="hex-value">{{ getPageColor('recipes', 'primaryBackground') }}</span>
              </div>
              <div class="color-row">
                <label>Card Background</label>
                <input type="color" [value]="getPageColor('recipes', 'cardBackground')" 
                       (input)="onColorChange('recipes', 'cardBackground', $event)">
                <span class="hex-value">{{ getPageColor('recipes', 'cardBackground') }}</span>
              </div>
            </div>

            <div class="page-section">
              <h3>Pricing Page</h3>
              <div class="color-row">
                <label>Primary Background</label>
                <input type="color" [value]="getPageColor('pricing', 'primaryBackground')" 
                       (input)="onColorChange('pricing', 'primaryBackground', $event)">
                <span class="hex-value">{{ getPageColor('pricing', 'primaryBackground') }}</span>
              </div>
              <div class="color-row">
                <label>Card Background</label>
                <input type="color" [value]="getPageColor('pricing', 'cardBackground')" 
                       (input)="onColorChange('pricing', 'cardBackground', $event)">
                <span class="hex-value">{{ getPageColor('pricing', 'cardBackground') }}</span>
              </div>
            </div>

            <div class="actions">
              <button mat-raised-button (click)="resetToDefaults()">
                <mat-icon>restore</mat-icon>
                Reset to Defaults
              </button>
              <button mat-raised-button color="primary" (click)="saveSettings()" [disabled]="saving()">
                <mat-icon>save</mat-icon>
                {{ saving() ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px;
    }

    .header {
      margin-bottom: 24px;
    }

    .header h1 {
      margin: 0;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .settings-section {
      margin-bottom: 24px;
    }

    mat-card-header {
      margin-bottom: 16px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .description {
      color: #666;
      margin-bottom: 24px;
    }

    .page-section {
      margin-bottom: 32px;
      padding-bottom: 32px;
      border-bottom: 1px solid #e0e0e0;
    }

    .page-section:last-of-type {
      border-bottom: none;
    }

    .page-section h3 {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 18px;
    }

    .color-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 12px;
    }

    .color-row label {
      min-width: 160px;
      font-weight: 500;
    }

    .color-row input[type="color"] {
      width: 80px;
      height: 40px;
      border: 1px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
    }

    .hex-value {
      font-family: monospace;
      font-size: 14px;
      color: #666;
      min-width: 80px;
    }

    .font-size-section {
      padding: 16px 0;
    }

    .font-size-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .font-size-row label {
      min-width: 160px;
      font-weight: 500;
    }

    .font-size-row input[type="range"] {
      flex: 1;
      height: 6px;
      border-radius: 3px;
      background: #e0e0e0;
      outline: none;
      cursor: pointer;
    }

    .font-size-row input[type="range"]::-webkit-slider-thumb {
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #43a047;
      cursor: pointer;
    }

    .font-size-row input[type="range"]::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #43a047;
      cursor: pointer;
      border: none;
    }

    .font-size-value {
      font-family: monospace;
      font-size: 14px;
      color: #666;
      min-width: 50px;
      text-align: right;
    }

    .actions {
      display: flex;
      gap: 16px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e0e0e0;
    }
  `]
})
export class SettingsComponent implements OnInit {
  loading = signal(false);
  saving = signal(false);
  draftTheme = signal<UserTheme>({ pages: {} });

  constructor(
    public themeService: ThemeService,
    private userSettingsService: UserSettingsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.loading.set(true);
    this.userSettingsService.getSettings().subscribe({
      next: (settings) => {
        this.draftTheme.set(settings.theme);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading settings:', err);
        // Initialize with defaults if no settings exist
        this.draftTheme.set({ pages: {} });
        this.loading.set(false);
      }
    });
  }

  getPageColor(page: string, property: 'primaryBackground' | 'cardBackground'): string {
    const pageTheme = this.draftTheme().pages?.[page];
    const color = pageTheme?.[property];
    const defaultColor = this.themeService.PAGE_DEFAULTS[page]?.[property];
    return color ?? defaultColor ?? '#f5f7f5';
  }

  onColorChange(page: string, property: 'primaryBackground' | 'cardBackground', event: Event) {
    const input = event.target as HTMLInputElement;
    const color = input.value;
    
    this.draftTheme.update(theme => {
      const updated = { ...theme };
      if (!updated.pages[page]) {
        updated.pages[page] = {};
      }
      updated.pages[page] = { ...updated.pages[page], [property]: color };
      return updated;
    });
  }

  onFontSizeChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    this.draftTheme.update(t => ({ ...t, globalFontSize: value }));
    this.themeService.applyTheme(this.draftTheme());
  }

  resetToDefaults() {
    if (confirm('Reset all colors to default values?')) {
      this.draftTheme.set({ pages: {} });
      this.snackBar.open('Colors reset to defaults. Click Save to apply.', 'Dismiss', { duration: 3000 });
    }
  }

  saveSettings() {
    this.saving.set(true);
    this.userSettingsService.updateSettings({ theme: this.draftTheme() }).subscribe({
      next: (settings) => {
        this.themeService.applyTheme(settings.theme);
        this.saving.set(false);
        this.snackBar.open('Settings saved successfully!', 'Dismiss', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error saving settings:', err);
        this.saving.set(false);
        this.snackBar.open('Failed to save settings. Please try again.', 'Dismiss', { duration: 4000 });
      }
    });
  }
}
