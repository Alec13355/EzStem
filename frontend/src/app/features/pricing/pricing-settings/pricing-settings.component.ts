import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { PricingService } from '../../../core/services/pricing.service';
import { PricingConfig } from '../../../shared/models/api.models';

@Component({
  selector: 'app-pricing-settings',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="container">
      <h1>Pricing Settings</h1>

      @if (loading()) {
        <div class="loading-spinner">
          <mat-spinner></mat-spinner>
        </div>
      } @else {
        <mat-card class="info-card">
          <mat-card-content>
            💡 These are your default values for new recipes. You can override them per-recipe when needed.
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Default Pricing Configuration</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="form">
              <mat-form-field class="full-width">
                <mat-label>Default Markup (%)</mat-label>
                <input 
                  matInput 
                  type="number" 
                  formControlName="defaultMarkupPercentage" 
                  required 
                  min="0" 
                  max="500"
                  step="0.1">
                <mat-hint>e.g. 35 means 35% markup</mat-hint>
                @if (form.get('defaultMarkupPercentage')?.hasError('required') && form.get('defaultMarkupPercentage')?.touched) {
                  <mat-error>Markup percentage is required</mat-error>
                }
                @if (form.get('defaultMarkupPercentage')?.hasError('min')) {
                  <mat-error>Markup must be at least 0%</mat-error>
                }
                @if (form.get('defaultMarkupPercentage')?.hasError('max')) {
                  <mat-error>Markup cannot exceed 500%</mat-error>
                }
              </mat-form-field>

              @if (markupPreview) {
                <div class="markup-preview" [class]="markupColorClass">
                  <strong>Preview:</strong> {{ markupPreview }}
                </div>
              }

              <mat-form-field class="full-width">
                <mat-label>Default Labor Rate ($/hr)</mat-label>
                <input 
                  matInput 
                  type="number" 
                  formControlName="defaultLaborRate" 
                  required 
                  min="0" 
                  step="0.01">
                @if (form.get('defaultLaborRate')?.hasError('required') && form.get('defaultLaborRate')?.touched) {
                  <mat-error>Labor rate is required</mat-error>
                }
                @if (form.get('defaultLaborRate')?.hasError('min')) {
                  <mat-error>Labor rate must be at least $0</mat-error>
                }
              </mat-form-field>

              <div class="actions">
                <button 
                  mat-raised-button 
                  color="primary" 
                  (click)="onSave()" 
                  [disabled]="form.invalid || saving()">
                  @if (saving()) {
                    <span>Saving...</span>
                  } @else {
                    <span>Save Settings</span>
                  }
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }

    h1 {
      margin-bottom: 24px;
      font-size: 2rem;
      font-weight: 400;
    }

    mat-card {
      margin-bottom: 24px;
    }

    mat-card-content {
      padding-top: 16px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .markup-preview {
      padding: 12px;
      margin-bottom: 16px;
      border-radius: 4px;
      font-size: 14px;
    }

    .markup-preview.profit-high {
      background-color: #e8f5e9;
      color: #2e7d32;
      border-left: 4px solid #4caf50;
    }

    .markup-preview.profit-medium {
      background-color: #fff3e0;
      color: #e65100;
      border-left: 4px solid #ff9800;
    }

    .markup-preview.profit-low {
      background-color: #f5f5f5;
      color: #616161;
      border-left: 4px solid #9e9e9e;
    }

    .info-card {
      background: #e3f2fd;
      border-left: 4px solid #1976d2;
      margin-bottom: 24px;
    }

    .info-card mat-card-content {
      padding: 16px;
      font-size: 14px;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 48px;
    }
  `]
})
export class PricingSettingsComponent implements OnInit {
  form!: FormGroup;
  loading = signal(false);
  saving = signal(false);
  configId?: string;

  constructor(
    private fb: FormBuilder,
    private pricingService: PricingService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadConfig();
  }

  private initForm(): void {
    this.form = this.fb.group({
      defaultMarkupPercentage: [35, [Validators.required, Validators.min(0), Validators.max(500)]],
      defaultLaborRate: [25, [Validators.required, Validators.min(0)]]
    });

    // Listen to markup changes for preview
    this.form.get('defaultMarkupPercentage')?.valueChanges.subscribe(() => {
      // Trigger preview update
    });
  }

  private loadConfig(): void {
    this.loading.set(true);
    this.pricingService.getPricingConfig()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (config: PricingConfig) => {
          this.configId = config.id;
          this.form.patchValue({
            defaultMarkupPercentage: config.defaultMarkupPercentage,
            defaultLaborRate: config.defaultLaborRate
          });
        },
        error: (err) => {
          this.snackBar.open('Failed to load pricing config', 'Close', { duration: 3000 });
          console.error('Error loading pricing config:', err);
        }
      });
  }

  onSave(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const payload = {
      defaultMarkupPercentage: this.form.value.defaultMarkupPercentage,
      defaultLaborRate: this.form.value.defaultLaborRate
    };

    this.pricingService.updatePricingConfig(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (config: PricingConfig) => {
          this.configId = config.id;
          this.snackBar.open('Pricing settings saved successfully', 'Close', { duration: 3000 });
        },
        error: (err) => {
          this.snackBar.open('Failed to save pricing settings', 'Close', { duration: 5000 });
          console.error('Error saving pricing config:', err);
        }
      });
  }

  get markupPreview(): string {
    const markup = this.form.get('defaultMarkupPercentage')?.value;
    if (markup == null || markup === '') return '';

    const cost = 10;
    const sellPrice = cost * (1 + markup / 100);
    const margin = (markup / (100 + markup)) * 100;
    
    let hint = '';
    if (margin < 25) {
      hint = ' (consider increasing markup)';
    }
    
    return `At ${markup}% markup, a $${cost.toFixed(2)} arrangement sells for $${sellPrice.toFixed(2)}${hint}`;
  }

  get markupColorClass(): string {
    const markup = this.form.get('defaultMarkupPercentage')?.value;
    if (markup == null) return '';

    // Convert markup to profit margin for color coding
    // markup to margin: margin = markup / (1 + markup)
    const margin = (markup / (100 + markup)) * 100;

    if (margin >= 40) return 'profit-high';
    if (margin >= 25) return 'profit-medium';
    return 'profit-low';
  }
}
