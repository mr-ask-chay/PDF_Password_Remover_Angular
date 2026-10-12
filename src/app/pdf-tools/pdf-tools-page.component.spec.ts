import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PdfToolsPageComponent } from './pdf-tools-page.component';

describe('PdfToolsPageComponent', () => {
  let fixture: ComponentFixture<PdfToolsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfToolsPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PdfToolsPageComponent);
    fixture.detectChanges();
  });

  it('shows the supported PDF tools directly without a separate load action', () => {
    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('h1')?.textContent).toContain(
      'Unclasp PDF Tools'
    );
    expect(page.querySelector('app-pdf-tools')).not.toBeNull();
    const toolHeadings = Array.from(
      page.querySelectorAll<HTMLElement>('.tool-card h2')
    ).map((heading) => heading.textContent?.trim() ?? '');
    expect(toolHeadings.length).toBe(10);
    expect(toolHeadings).toContain('Merge PDF');
    expect(toolHeadings).toContain('Protect PDF');
    expect(page.textContent).not.toContain('Load PDF tools');
  });
});
