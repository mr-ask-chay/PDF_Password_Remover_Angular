import {
  Component,
  ElementRef,
  HostListener,
  Inject,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

type ThemePref = 'system' | 'dark' | 'light';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: true,
  imports: [RouterLink]
})
export class HeaderComponent {
  private readonly KEY = 'theme-pref';
  private readonly isBrowser: boolean;

  currentPref: ThemePref = 'system';
  label = 'System';

  /** Mobile menu state (Angular-controlled; Bootstrap's collapse JS is not loaded). */
  menuOpen = false;
  @ViewChild('menuToggle') private readonly menuToggle?: ElementRef<HTMLButtonElement>;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      const saved = (globalThis.localStorage.getItem(this.KEY) as ThemePref) || 'system';
      this.setPref(saved);
      this.applyTheme();


      globalThis
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', () => {
          if (this.currentPref === 'system') this.applyTheme();
        });
    }
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  /** Escape closes the open menu and returns focus to the toggle button. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.menuOpen) return;
    this.menuOpen = false;
    this.menuToggle?.nativeElement.focus();
  }

  /** Cycle System → Dark → Light */
  toggleTheme(): void {
    if (!this.isBrowser) return;
    let next: ThemePref;
    if (this.currentPref === 'system') {
      next = 'dark';
    } else if (this.currentPref === 'dark') {
      next = 'light';
    } else {
      next = 'system';
    }
    this.setPref(next);
    this.applyTheme();
  }

  /** Set pref + persist + update label */
  private setPref(pref: ThemePref): void {
    this.currentPref = pref;
    if (this.isBrowser) globalThis.localStorage.setItem(this.KEY, pref);

    if (pref === 'system') {
      this.label = 'System';
    } else if (pref === 'dark') {
      this.label = 'Dark';
    } else {
      this.label = 'Light';
    }
  }

  /** Apply resolved theme (dark/light) to <html> for Bootstrap */
  private applyTheme(): void {
    if (!this.isBrowser) return;
    const systemDark = globalThis.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    const theme =
      this.currentPref === 'dark' ||
        (this.currentPref === 'system' && systemDark)
        ? 'dark'
        : 'light';
    document.documentElement.dataset['bsTheme'] = theme;
  }
}
