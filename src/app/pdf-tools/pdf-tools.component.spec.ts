import { TestBed } from '@angular/core/testing';
import { PDFDocument } from 'pdf-lib';
import { RouterTestingModule } from '@angular/router/testing';
import { PdfToolsComponent } from './pdf-tools.component';
import { parsePageSelection, PdfToolsService } from './pdf-tools.service';
import { PdfRenderService } from './pdf-render.service';

describe('PdfToolsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfToolsComponent, RouterTestingModule],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(PdfToolsComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should keep the initial selection text blank until a file is picked', () => {
    const fixture = TestBed.createComponent(PdfToolsComponent);
    const component = fixture.componentInstance;
    expect(component.mergeStatus).toBe('');
    expect(component.splitStatus).toBe('');
    expect(component.status).toBe('');
  });
});

describe('PdfToolsService', () => {
  it('should merge multiple PDFs into a single PDF blob', async () => {
    const service = new PdfToolsService();
    const first = await PDFDocument.create();
    const firstPage = first.addPage();
    firstPage.drawText('first');

    const second = await PDFDocument.create();
    const secondPage = second.addPage();
    secondPage.drawText('second');

    const fileA = new File([await first.save()], 'first.pdf', { type: 'application/pdf' });
    const fileB = new File([await second.save()], 'second.pdf', { type: 'application/pdf' });

    const merged = await service.mergePdfFiles([fileA, fileB]);
    expect(merged.type).toBe('application/pdf');
    const mergedDocument = await PDFDocument.load(await merged.arrayBuffer());
    expect(mergedDocument.getPageCount()).toBe(2);
  });

  it('should split a PDF to keep only selected pages', async () => {
    const service = new PdfToolsService();
    const doc = await PDFDocument.create();
    const page1 = doc.addPage();
    page1.drawText('one');
    const page2 = doc.addPage();
    page2.drawText('two');
    const page3 = doc.addPage();
    page3.drawText('three');

    const file = new File([await doc.save()], 'pages.pdf', { type: 'application/pdf' });
    const split = await service.splitPdfFile(file, '2-3');

    expect(split.type).toBe('application/pdf');
    const splitDocument = await PDFDocument.load(await split.arrayBuffer());
    expect(splitDocument.getPageCount()).toBe(2);
  });

  it('should split the full document into separate parts', async () => {
    const file = await asPdfFile(await createPdf(4));
    const parts = await new PdfToolsService().splitPdfIntoParts(file, '1-2;3-4');
    expect(parts.length).toBe(2);
    expect(await Promise.all(parts.map(async (part) =>
      (await PDFDocument.load(await part.arrayBuffer())).getPageCount()
    ))).toEqual([2, 2]);
    await expectAsync(new PdfToolsService().splitPdfIntoParts(file, '1-3;3-4'))
      .toBeRejectedWithError(/every page exactly once/);
  });

  it('should parse page ranges and reject invalid ones', () => {
    expect(parsePageSelection('1-3,5,7')).toEqual([1, 2, 3, 5, 7]);
    expect(parsePageSelection('2, 2-2, 5')).toEqual([2, 5]);
    expect(() => parsePageSelection('0,abc')).toThrowError();
  });

  it('should remove selected pages and preserve the remaining page count', async () => {
    const service = new PdfToolsService();
    const source = await createPdf(4);
    const result = await service.removePages(await asPdfFile(source), '2,4');
    expect((await PDFDocument.load(await result.arrayBuffer())).getPageCount()).toBe(2);
  });

  it('should reorder pages and reject incomplete orders', async () => {
    const service = new PdfToolsService();
    const document = await PDFDocument.create();
    document.addPage([300, 600]);
    document.addPage([400, 600]);
    document.addPage([500, 600]);
    const file = await asPdfFile(document);
    const result = await service.reorderPages(file, '3,1,2');
    const reordered = await PDFDocument.load(await result.arrayBuffer());
    expect(reordered.getPageCount()).toBe(3);
    expect(reordered.getPage(0).getWidth()).toBe(500);
    expect(reordered.getPage(1).getWidth()).toBe(300);
    expect(reordered.getPage(2).getWidth()).toBe(400);
    await expectAsync(service.reorderPages(file, '1,2')).toBeRejectedWithError(/every page exactly once/);
  });

  it('should rotate pages and apply crop boxes', async () => {
    const service = new PdfToolsService();
    const file = await asPdfFile(await createPdf(1));
    const rotated = await service.rotatePages(file, 90);
    expect((await PDFDocument.load(await rotated.arrayBuffer())).getPage(0).getRotation().angle).toBe(90);

    const cropped = await service.cropPages(file, 300, 400);
    const page = (await PDFDocument.load(await cropped.arrayBuffer())).getPage(0);
    expect(page.getCropBox().width).toBe(300);
    expect(page.getCropBox().height).toBe(400);
  });

  it('should add page numbers and text watermarks without changing page count', async () => {
    const service = new PdfToolsService();
    const file = await asPdfFile(await createPdf(2));
    const numbered = await service.addPageNumbers(file);
    const watermarked = await service.addWatermark(file, 'TEST');
    expect((await PDFDocument.load(await numbered.arrayBuffer())).getPageCount()).toBe(2);
    expect((await PDFDocument.load(await watermarked.arrayBuffer())).getPageCount()).toBe(2);
    await expectAsync(service.addWatermark(file, '')).toBeRejectedWithError(/watermark text/);
  });

  it('should add selectable text at a validated position on the chosen page', async () => {
    const document = await PDFDocument.create();
    document.addPage([300, 400]);
    document.addPage([300, 400]);
    const file = await asPdfFile(document);
    const service = new PdfToolsService();
    const result = await service.addTextOverlay(file, 2, 'Added note', 40, 50, 14);
    const updatedFile = new File([result], 'overlay.pdf', { type: 'application/pdf' });
    const extracted = await new PdfRenderService().extractMarkdown(updatedFile);
    expect(await extracted.text()).toContain('Added note');
    await expectAsync(service.addTextOverlay(file, 3, 'Too far', 40, 50, 14))
      .toBeRejectedWithError(/between 1 and 2/);
    await expectAsync(service.addTextOverlay(file, 1, 'Outside', 290, 390, 14))
      .toBeRejectedWithError(/fit inside the selected page/);
  });

  it('should update PDF metadata fields', async () => {
    const service = new PdfToolsService();
    const file = await asPdfFile(await createPdf(1));
    const result = await service.editMetadata(file, {
      title: 'Private title',
      author: 'Test author',
      subject: 'Test subject',
      keywords: 'alpha, beta',
    });
    const updated = await PDFDocument.load(await result.arrayBuffer());
    expect(updated.getTitle()).toBe('Private title');
    expect(updated.getAuthor()).toBe('Test author');
    expect(updated.getSubject()).toBe('Test subject');
    expect(updated.getKeywords()).toBe('alpha beta');
  });

  it('should update and preserve PDF text form fields', async () => {
    const document = await PDFDocument.create();
    document.addPage([612, 792]);
    document.getForm().createTextField('customer.name').setText('Before');
    const file = await asPdfFile(document);
    const service = new PdfToolsService();

    expect(await service.getTextFormFields(file)).toEqual([
      { name: 'customer.name', value: 'Before' },
    ]);
    const output = await service.fillTextFormFields(file, { 'customer.name': 'After' });
    const reopened = await PDFDocument.load(await output.arrayBuffer());
    expect(reopened.getForm().getTextField('customer.name').getText()).toBe('After');
  });

  it('should create one PDF page per selected PNG image', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const context = canvas.getContext('2d');
    expect(context).toBeTruthy();
    context!.fillStyle = '#245';
    context!.fillRect(0, 0, 2, 2);
    const png = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG fixture generation failed')), 'image/png')
    );
    const files = [
      new File([png], 'one.png', { type: 'image/png' }),
      new File([png], 'two.png', { type: 'image/png' }),
    ];

    const result = await new PdfToolsService().imagesToPdf(files);
    expect((await PDFDocument.load(await result.arrayBuffer())).getPageCount()).toBe(2);
  });

  it('should provide a safe error for invalid PDF input', async () => {
    const invalid = new File(['not a PDF'], 'invalid.pdf', { type: 'application/pdf' });
    await expectAsync(new PdfToolsService().selectPages(invalid, '1'))
      .toBeRejectedWithError('Could not read this PDF. It may be damaged, unsupported, or password-protected.');
  });

  it('should enforce page-selection bounds and preserve at least one page', async () => {
    const service = new PdfToolsService();
    const file = await asPdfFile(await createPdf(2));
    await expectAsync(service.selectPages(file, '3')).toBeRejectedWithError(/between 1 and 2/);
    await expectAsync(service.removePages(file, '1-2')).toBeRejectedWithError(/At least one page/);
  });
});

describe('PdfRenderService', () => {
  it('should export selectable text as Markdown and compare text without a server', async () => {
    const docA = await createPdfWithText('alpha text');
    const docB = await createPdfWithText('beta text');
    const fileA = await asPdfFile(docA);
    const fileB = await asPdfFile(docB);
    const renderer = new PdfRenderService();

    const markdown = await renderer.extractMarkdown(fileA);
    expect(markdown.type).toContain('text/markdown');
    expect(await markdown.text()).toContain('alpha text');

    const comparison = await renderer.compareText(fileA, fileB);
    const report = await comparison.text();
    expect(report).toContain('- alpha text');
    expect(report).toContain('+ beta text');
  });

  it('should render PDF pages as JPG blobs', async () => {
    const file = await asPdfFile(await createPdfWithText('render fixture'));
    const images = await new PdfRenderService().renderJpegPages(file);
    expect(images.length).toBe(1);
    expect(images[0].blob.type).toBe('image/jpeg');
    expect(images[0].blob.size).toBeGreaterThan(0);
  });
});

async function createPdf(pageCount: number): Promise<PDFDocument> {
  const document = await PDFDocument.create();
  for (let index = 0; index < pageCount; index += 1) document.addPage([612, 792]);
  return document;
}

async function createPdfWithText(text: string): Promise<PDFDocument> {
  const document = await PDFDocument.create();
  const page = document.addPage([612, 792]);
  const font = await document.embedFont('Helvetica');
  page.drawText(text, { x: 40, y: 700, font });
  return document;
}

async function asPdfFile(document: PDFDocument): Promise<File> {
  return new File([await document.save()], 'test.pdf', { type: 'application/pdf' });
}
