import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { PLATFORM_ID } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  const originalLocalStorage = globalThis.localStorage;

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true
    });
  });

  beforeEach(async () => {
    const mockLocalStorage = {
      getItem: jasmine.createSpy('getItem').and.returnValue(null),
      setItem: jasmine.createSpy('setItem'),
      clear: jasmine.createSpy('clear')
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true
    });

    await TestBed.configureTestingModule({
      imports: [HeaderComponent, RouterTestingModule],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: ActivatedRoute, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with system theme', () => {
    expect(component.currentPref).toBe('system');
    expect(component.label).toBe('System');
  });

  it('should toggle theme correctly', () => {
    // System -> Dark
    component.toggleTheme();
    expect(component.currentPref).toBe('dark');
    expect(component.label).toBe('Dark');

    // Dark -> Light
    component.toggleTheme();
    expect(component.currentPref).toBe('light');
    expect(component.label).toBe('Light');

    // Light -> System
    component.toggleTheme();
    expect(component.currentPref).toBe('system');
    expect(component.label).toBe('System');
  });

  describe('mobile menu', () => {
    const toggle = () =>
      fixture.nativeElement.querySelector('.navbar-toggler') as HTMLButtonElement;
    const collapse = () =>
      fixture.nativeElement.querySelector('#navMain') as HTMLElement;

    it('starts closed with aria-expanded=false', () => {
      expect(component.menuOpen).toBeFalse();
      expect(toggle().getAttribute('aria-expanded')).toBe('false');
      expect(collapse().classList).not.toContain('show');
    });

    it('opens and closes when the toggle is clicked', () => {
      toggle().click();
      fixture.detectChanges();
      expect(collapse().classList).toContain('show');
      expect(toggle().getAttribute('aria-expanded')).toBe('true');

      toggle().click();
      fixture.detectChanges();
      expect(collapse().classList).not.toContain('show');
      expect(toggle().getAttribute('aria-expanded')).toBe('false');
    });

    it('closes when a navigation link is clicked', () => {
      component.toggleMenu();
      fixture.detectChanges();
      (collapse().querySelector('a.nav-link') as HTMLAnchorElement).click();
      fixture.detectChanges();
      expect(component.menuOpen).toBeFalse();
    });

    it('closes on Escape and returns focus to the toggle', () => {
      component.toggleMenu();
      fixture.detectChanges();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();
      expect(component.menuOpen).toBeFalse();
      expect(document.activeElement).toBe(toggle());
    });

    it('does not rely on Bootstrap collapse JS attributes', () => {
      expect(toggle().hasAttribute('data-bs-toggle')).toBeFalse();
    });
  });

  it('should apply theme to document', () => {


    component.toggleTheme(); // System -> Dark
    expect(document.documentElement.dataset['bsTheme']).toBe('dark');

    component.toggleTheme(); // Dark -> Light
    expect(document.documentElement.dataset['bsTheme']).toBe('light');
  });
});
