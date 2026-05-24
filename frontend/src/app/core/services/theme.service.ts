import { Injectable, signal } from '@angular/core';
import { UserTheme, PageTheme } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private settings = signal<UserTheme>({ pages: {} });

  readonly PAGE_DEFAULTS: Record<string, PageTheme> = {
    recipes: { primaryBackground: '#f5f7f5', cardBackground: '#ffffff' },
    events: { primaryBackground: '#f5f7f5', cardBackground: '#ffffff' },
    masterFlowers: { primaryBackground: '#f5f7f5', cardBackground: '#ffffff' },
    pricing: { primaryBackground: '#f5f7f5', cardBackground: '#ffffff' },
  };

  readonly FONT_SIZE_DEFAULT = 16;
  readonly FONT_SIZE_MIN = 12;
  readonly FONT_SIZE_MAX = 24;

  applyTheme(theme: UserTheme): void {
    for (const [page, defaults] of Object.entries(this.PAGE_DEFAULTS)) {
      const pageTheme = theme.pages?.[page] ?? {};
      document.documentElement.style.setProperty(
        `--page-${page}-bg-primary`,
        pageTheme.primaryBackground ?? defaults.primaryBackground!
      );
      document.documentElement.style.setProperty(
        `--page-${page}-bg-card`,
        pageTheme.cardBackground ?? defaults.cardBackground!
      );
    }
    
    // Apply global font size
    const fontSize = theme.globalFontSize ?? this.FONT_SIZE_DEFAULT;
    document.documentElement.style.setProperty('--app-font-size', `${fontSize}px`);
    
    this.settings.set(theme);
  }

  currentSettings = this.settings.asReadonly();
}
