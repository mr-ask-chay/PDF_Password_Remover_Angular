import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RemoverPageComponent } from './remover-page.component';
import { PdfUnlockService } from '../engine/pdf-unlock.service';

describe('RemoverPageComponent', () => {
  let fixture: ComponentFixture<RemoverPageComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemoverPageComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: PdfUnlockService, useValue: jasmine.createSpyObj('PdfUnlockService', ['unlock']) },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RemoverPageComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should render a single page-specific h1', () => {
    const h1s = el.querySelectorAll('h1');
    expect(h1s.length).toBe(1);
    expect(h1s[0].textContent).toContain('Remove a password from a PDF');
  });

  it('should embed the existing remover tool', () => {
    expect(el.querySelector('app-remove-password')).toBeTruthy();
    expect(el.querySelector('input[type="file"]')).toBeTruthy();
  });

  it('should link to the privacy policy and API docs', () => {
    const hrefs = Array.from(el.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/privacy');
    expect(hrefs).toContain('/docs');
    expect(hrefs).toContain('/');
  });
});
