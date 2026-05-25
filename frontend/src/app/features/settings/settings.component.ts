import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { ThemeService } from '../../core/services/theme.service';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { OrgService } from '../../core/services/org.service';
import { UserTheme, PageTheme, OrgResponse, OrgMemberResponse } from '../../shared/models/api.models';

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
    MatProgressSpinnerModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule
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
        <mat-tab-group>

          <!-- Appearance Tab -->
          <mat-tab label="Appearance">
            <div class="tab-content">
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
            </div>
          </mat-tab>

          <!-- Team Tab -->
          <mat-tab label="Team">
            <div class="tab-content">

              <!-- Active Org Banner -->
              @if (orgService.activeOrgId()) {
                <div class="active-org-banner">
                  <mat-icon>group</mat-icon>
                  <span>Active org: <strong>{{ getActiveOrgName() }}</strong></span>
                  <button mat-button (click)="clearActiveOrg()">Switch to personal</button>
                </div>
              }

              <!-- Create Org -->
              <mat-card class="settings-section">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>add_business</mat-icon>
                    Create a Team
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <p class="description">Create a new team to share your events, flowers, and recipes with others.</p>
                  <div class="create-org-row">
                    <mat-form-field appearance="outline" class="org-name-field">
                      <mat-label>Team name</mat-label>
                      <input matInput [(ngModel)]="newOrgName" placeholder="e.g. Smith Florals">
                    </mat-form-field>
                    <button mat-raised-button color="primary" [disabled]="!newOrgName.trim() || creatingOrg()" (click)="createOrg()">
                      {{ creatingOrg() ? 'Creating...' : 'Create' }}
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- My Orgs -->
              @if (orgs().length > 0) {
                <mat-card class="settings-section">
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon>groups</mat-icon>
                      My Teams
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    @for (org of orgs(); track org.id) {
                      <div class="org-row">
                        <div class="org-info">
                          <div class="org-row-name">
                            {{ org.name }}
                            @if (org.isOwner) { <span class="badge owner">Owner</span> }
                            @if (orgService.activeOrgId() === org.id) { <span class="badge active">Active</span> }
                          </div>
                          <div class="org-meta">Created {{ org.createdAt | date:'mediumDate' }}</div>
                        </div>
                        <div class="org-actions">
                          @if (orgService.activeOrgId() !== org.id) {
                            <button mat-stroked-button (click)="switchToOrg(org)">Switch</button>
                          }
                          @if (org.isOwner) {
                            <button mat-stroked-button color="primary" (click)="generateInvite(org)">
                              <mat-icon>link</mat-icon>
                              Invite Link
                            </button>
                          }
                        </div>
                      </div>

                      <!-- Members list (owner only) -->
                      @if (org.isOwner && membersMap()[org.id]) {
                        <div class="members-list">
                          @for (member of membersMap()[org.id]; track member.id) {
                            @if (member.status === 'Active') {
                              <div class="member-row">
                                <mat-icon class="member-icon">person</mat-icon>
                                <span class="member-id">{{ member.userId === currentUserId() ? 'You' : (member.userId ?? 'Pending') }}</span>
                                <span class="member-role">{{ member.role }}</span>
                                @if (member.role !== 'Owner') {
                                  <button mat-icon-button color="warn" (click)="removeMember(org, member)" title="Remove member">
                                    <mat-icon>person_remove</mat-icon>
                                  </button>
                                }
                              </div>
                            }
                          }
                        </div>
                        <mat-divider></mat-divider>
                      }
                    }
                  </mat-card-content>
                </mat-card>
              }

              <!-- Invite Link Display -->
              @if (lastInviteUrl()) {
                <mat-card class="settings-section invite-card">
                  <mat-card-content>
                    <div class="invite-display">
                      <mat-icon>link</mat-icon>
                      <div class="invite-link-area">
                        <p class="invite-label">Share this link — anyone with it can join your team:</p>
                        <div class="invite-link-row">
                          <code class="invite-link">{{ lastInviteUrl() }}</code>
                          <button mat-icon-button (click)="copyInviteLink()" title="Copy link">
                            <mat-icon>{{ copied() ? 'check' : 'content_copy' }}</mat-icon>
                          </button>
                        </div>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              }

            </div>
          </mat-tab>

        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px;
    }

    .header { margin-bottom: 24px; }
    .header h1 { margin: 0; }

    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .tab-content { padding: 24px 0; }

    .settings-section { margin-bottom: 24px; }

    mat-card-header { margin-bottom: 16px; }

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

    .page-section:last-of-type { border-bottom: none; }

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

    .font-size-section { padding: 16px 0; }

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

    /* Team tab styles */
    .active-org-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #e8f5e9;
      border: 1px solid #a5d6a7;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
    }

    .active-org-banner mat-icon { color: #2e7d32; }

    .create-org-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .org-name-field { flex: 1; }

    .org-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .org-row:last-of-type { border-bottom: none; }

    .org-row-name {
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .org-meta {
      font-size: 12px;
      color: #888;
      margin-top: 2px;
    }

    .org-actions {
      display: flex;
      gap: 8px;
    }

    .badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 500;
    }

    .badge.owner { background: #fff3e0; color: #e65100; }
    .badge.active { background: #e8f5e9; color: #2e7d32; }

    .members-list {
      margin: 8px 0 8px 16px;
    }

    .member-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
      font-size: 14px;
      color: #555;
    }

    .member-icon { font-size: 18px; width: 18px; height: 18px; color: #888; }
    .member-id { flex: 1; }
    .member-role { font-size: 12px; color: #888; }

    .invite-card { background: #f1f8e9; }

    .invite-display {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .invite-display mat-icon { color: #558b2f; margin-top: 4px; }

    .invite-link-area { flex: 1; }
    .invite-label { margin: 0 0 8px 0; color: #555; font-size: 14px; }

    .invite-link-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .invite-link {
      font-size: 12px;
      background: #fff;
      padding: 6px 10px;
      border-radius: 4px;
      border: 1px solid #c5e1a5;
      word-break: break-all;
      flex: 1;
    }
  `]
})
export class SettingsComponent implements OnInit {
  loading = signal(false);
  saving = signal(false);
  draftTheme = signal<UserTheme>({ pages: {} });

  // Team tab
  orgs = signal<OrgResponse[]>([]);
  membersMap = signal<Record<string, OrgMemberResponse[]>>({});
  newOrgName = '';
  creatingOrg = signal(false);
  lastInviteUrl = signal<string | null>(null);
  copied = signal(false);
  currentUserId = signal<string | null>(null);

  constructor(
    public themeService: ThemeService,
    private userSettingsService: UserSettingsService,
    public orgService: OrgService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadSettings();
    this.loadOrgs();
  }

  loadSettings() {
    this.loading.set(true);
    this.userSettingsService.getSettings().subscribe({
      next: (settings) => {
        this.draftTheme.set(settings.theme);
        this.loading.set(false);
      },
      error: () => {
        this.draftTheme.set({ pages: {} });
        this.loading.set(false);
      }
    });
  }

  loadOrgs() {
    this.orgService.getMyOrgs().subscribe({
      next: (orgs) => {
        this.orgs.set(orgs);
        orgs.filter(o => o.isOwner).forEach(o => this.loadMembers(o.id));
      },
      error: () => {}
    });
  }

  loadMembers(orgId: string) {
    this.orgService.getMembers(orgId).subscribe({
      next: (members) => {
        this.membersMap.update(m => ({ ...m, [orgId]: members }));
        const me = members.find(m => m.role === 'Owner');
        if (me?.userId) this.currentUserId.set(me.userId);
      },
      error: () => {}
    });
  }

  getActiveOrgName(): string {
    const id = this.orgService.activeOrgId();
    return this.orgs().find(o => o.id === id)?.name ?? id ?? '';
  }

  switchToOrg(org: OrgResponse) {
    this.orgService.setActiveOrg(org.id, org.name);
    this.snackBar.open(`Switched to ${org.name}`, 'Dismiss', { duration: 3000 });
  }

  clearActiveOrg() {
    this.orgService.setActiveOrg(null);
    this.snackBar.open('Switched to personal workspace', 'Dismiss', { duration: 3000 });
  }

  createOrg() {
    const name = this.newOrgName.trim();
    if (!name) return;
    this.creatingOrg.set(true);
    this.orgService.createOrg(name).subscribe({
      next: (org) => {
        this.newOrgName = '';
        this.creatingOrg.set(false);
        this.orgService.setActiveOrg(org.id, org.name);
        this.loadOrgs();
        this.snackBar.open(`Team "${org.name}" created!`, 'Dismiss', { duration: 3000 });
      },
      error: () => {
        this.creatingOrg.set(false);
        this.snackBar.open('Failed to create team.', 'Dismiss', { duration: 4000 });
      }
    });
  }

  generateInvite(org: OrgResponse) {
    this.orgService.createInvite(org.id).subscribe({
      next: (invite) => {
        this.lastInviteUrl.set(invite.inviteUrl);
      },
      error: () => {
        this.snackBar.open('Failed to generate invite link.', 'Dismiss', { duration: 4000 });
      }
    });
  }

  copyInviteLink() {
    const url = this.lastInviteUrl();
    if (url) {
      navigator.clipboard.writeText(url).then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      });
    }
  }

  removeMember(org: OrgResponse, member: OrgMemberResponse) {
    if (!confirm('Remove this member from your team?')) return;
    this.orgService.removeMember(org.id, member.id).subscribe({
      next: () => {
        this.loadMembers(org.id);
        this.snackBar.open('Member removed.', 'Dismiss', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to remove member.', 'Dismiss', { duration: 4000 });
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
    this.draftTheme.update(theme => {
      const updated = { ...theme };
      if (!updated.pages[page]) updated.pages[page] = {};
      updated.pages[page] = { ...updated.pages[page], [property]: input.value };
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
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Failed to save settings. Please try again.', 'Dismiss', { duration: 4000 });
      }
    });
  }
}
