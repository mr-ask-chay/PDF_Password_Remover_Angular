import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PdfToolsPageComponent } from './pdf-tools-page.component';

describe('PdfToolsPageComponent', () => {
  let fixture: ComponentFixture<PdfToolsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfToolsPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PdfToolsPageComponent);
    fixture.detectChanges();
  });

  it('shows the page description and waits for a deliberate load action', () => {
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
      'Unclasp PDF Tools'
    );
    expect(
      fixture.nativeElement.querySelector('button')?.textContent
    ).toContain('Load PDF tools');
    expect(fixture.nativeElement.querySelector('app-pdf-tools')).toBeNull();
  });
});
