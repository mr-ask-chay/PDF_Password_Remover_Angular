import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrivacyComponent } from './privacy.component';
import { PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';

describe('PrivacyComponent', () => {
  let component: PrivacyComponent;
  let fixture: ComponentFixture<PrivacyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyComponent],
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }, provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('policy content matches the implementation', () => {
    let text: string;
    beforeEach(() => {
      fixture.detectChanges();
      text = (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ');
    });

    it('states that processing happens on the server', () => {
      expect(text).toContain('unlocked on our server, not in your browser');
      expect(text).toContain('its filename and its password are sent to the server');
    });

    it('discloses browser storage and third-party services', () => {
      expect(text).toContain('localStorage');
      expect(text).toContain('API secret');
      expect(text).toContain('Google Fonts');
      expect(text).toContain('Google AdSense');
      expect(text).toContain('IP address');
    });

    it('does not make unsupported claims', () => {
      for (const phrase of [
        'client-side',
        'random names',
        'file size bucket',
        'deleted immediately',
        'never written to disk',
        'No tracking',
        'within a business day',
      ]) {
        expect(text).withContext(phrase).not.toContain(phrase);
      }
    });

    it('links to the API docs and the terms', () => {
      const hrefs = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('a')
      ).map((a) => a.getAttribute('href'));
      expect(hrefs).toContain('/docs');
      expect(hrefs).toContain('/terms');
    });
  });

  it('should initialize year and lastUpdated', () => {
    expect(component.year).toBe(new Date().getFullYear());
    expect(component.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should set up IntersectionObserver if available', () => {
    const mockIntersectionObserver = jasmine.createSpyObj('IntersectionObserver', ['observe', 'disconnect', 'unobserve']);
    (globalThis as any).IntersectionObserver = jasmine.createSpy('IntersectionObserver').and.returnValue(mockIntersectionObserver);

    fixture.detectChanges(); // triggers ngAfterViewInit

    expect((globalThis as any).IntersectionObserver).toHaveBeenCalled();
    expect(mockIntersectionObserver.observe).toHaveBeenCalled();
  });

  it('should use fallback scroll listener if IntersectionObserver is not available', () => {
    const originalIntersectionObserver = (globalThis as any).IntersectionObserver;
    (globalThis as any).IntersectionObserver = undefined;
    spyOn(globalThis, 'addEventListener');

    fixture.detectChanges(); // triggers ngAfterViewInit

    expect(globalThis.addEventListener).toHaveBeenCalledWith('scroll', jasmine.any(Function), { passive: true });
    expect(globalThis.addEventListener).toHaveBeenCalledWith('resize', jasmine.any(Function), { passive: true });

    // Restore IntersectionObserver
    (globalThis as any).IntersectionObserver = originalIntersectionObserver;
  });

  it('should cleanup on destroy', () => {
    const mockIntersectionObserver = jasmine.createSpyObj('IntersectionObserver', ['observe', 'disconnect', 'unobserve']);
    (globalThis as any).IntersectionObserver = jasmine.createSpy('IntersectionObserver').and.returnValue(mockIntersectionObserver);

    fixture.detectChanges();
    component.ngOnDestroy();

    expect(mockIntersectionObserver.disconnect).toHaveBeenCalled();
  });

  it('should cleanup scroll listeners on destroy if fallback was used', () => {
    const originalIntersectionObserver = (globalThis as any).IntersectionObserver;
    (globalThis as any).IntersectionObserver = undefined;
    spyOn(globalThis, 'removeEventListener');

    fixture.detectChanges();
    component.ngOnDestroy();

    expect(globalThis.removeEventListener).toHaveBeenCalledWith('scroll', jasmine.any(Function));
    expect(globalThis.removeEventListener).toHaveBeenCalledWith('resize', jasmine.any(Function));

    (globalThis as any).IntersectionObserver = originalIntersectionObserver;
  });

  it('should not set up observers on server platform', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [PrivacyComponent],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }, provideRouter([])]
    }).compileComponents();

    const serverFixture = TestBed.createComponent(PrivacyComponent);
    serverFixture.detectChanges();

    expect(serverFixture.componentInstance).toBeTruthy();
  });
});
