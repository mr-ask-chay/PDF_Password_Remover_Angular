import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TermsComponent } from './terms.component';

describe('TermsComponent', () => {
  let fixture: ComponentFixture<TermsComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TermsComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('renders a single h1', () => {
    const h1s = el.querySelectorAll('h1');
    expect(h1s.length).toBe(1);
    expect(h1s[0].textContent).toContain('Terms of Use');
  });

  it('covers the required sections', () => {
    const text = el.textContent!.replace(/\s+/g, ' ');
    for (const heading of [
      'Your responsibility for your files',
      'Prohibited use',
      'How processing works and its limits',
      'Availability',
      'No warranty and limitation of liability',
    ]) {
      expect(text).withContext(heading).toContain(heading);
    }
    expect(text).toContain('own or are authorised to modify');
  });

  it('links to the privacy policy and API docs', () => {
    const hrefs = Array.from(el.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/privacy');
    expect(hrefs).toContain('/docs');
  });

  it('shows a fixed last-updated date', () => {
    expect(fixture.componentInstance.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
