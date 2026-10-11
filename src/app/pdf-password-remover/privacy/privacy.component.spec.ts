import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrivacyComponent } from './privacy.component';
import { PLATFORM_ID } from '@angular/core';

describe('PrivacyComponent', () => {
  let component: PrivacyComponent;
  let fixture: ComponentFixture<PrivacyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyComponent],
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }]
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }]
    }).compileComponents();

    const serverFixture = TestBed.createComponent(PrivacyComponent);
    serverFixture.detectChanges();

    expect(serverFixture.componentInstance).toBeTruthy();
  });
});
