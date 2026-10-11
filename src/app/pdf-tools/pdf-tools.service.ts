import { Injectable } from '@angular/core';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';

export const MAX_PDF_BYTES = 20 * 1024 * 1024;
export const MAX_MERGE_BYTES = 40 * 1024 * 1024;
export const MAX_PDF_PAGES = 500;
export const MAX_MERGE_FILES = 20;
export const MAX_SPLIT_PARTS = 20;

export interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
}

export function parsePageSelection(raw: string): number[] {
  const trimmed = (raw || '').trim();
  if (!trimmed) return [];
  if (trimmed.length > 5000) throw new Error('Page selection is too long.');

  const parsed = new Set<number>();
  for (const chunk of trimmed.split(',')) {
    const segment = chunk.trim();
    if (!segment) throw new Error('Page selection contains an empty item.');

    const range = /^(\d+)\s*-\s*(\d+)$/.exec(segment);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (start < 1 || end < start || end - start + 1 > MAX_PDF_PAGES) {
        throw new Error(`Page ranges must be ascending and no longer than ${MAX_PDF_PAGES} pages.`);
      }
      for (let page = start; page <= end; page += 1) {
        parsed.add(page);
        if (parsed.size > MAX_PDF_PAGES) {
          throw new Error(`Select no more than ${MAX_PDF_PAGES} pages at a time.`);
        }
      }
      continue;
    }

    if (!/^\d+$/.test(segment) || Number(segment) < 1) {
      throw new Error('Use page numbers and ascending ranges, for example 1-3,5,8.');
    }
    parsed.add(Number(segment));
    if (parsed.size > MAX_PDF_PAGES) {
      throw new Error(`Select no more than ${MAX_PDF_PAGES} pages at a time.`);
    }
  }

  return [...parsed];
}

@Injectable({ providedIn: 'root' })
export class PdfToolsService {
  async mergePdfFiles(files: File[]): Promise<Blob> {
    if (!files.length) throw new Error('Please select at least one PDF file.');
    if (files.length > MAX_MERGE_FILES) {
      throw new Error(`Merge no more than ${MAX_MERGE_FILES} PDF files at a time.`);
    }
    if (files.some((file) => file.size > MAX_PDF_BYTES) ||
        files.reduce((total, file) => total + file.size, 0) > MAX_MERGE_BYTES) {
      throw new Error('The selected files exceed the 40 MB total processing limit.');
    }
    files.forEach((file) => this.assertPdfFile(file));

    const output = await PDFDocument.create();
    let totalPages = 0;
    for (const file of files) {
      const source = await this.loadPdf(file);
      totalPages += source.getPageCount();
      this.assertPageLimit(totalPages);
      const pages = await output.copyPages(source, source.getPageIndices());
      pages.forEach((page) => output.addPage(page));
    }
    return this.toBlob(await output.save());
  }

  async splitPdfFile(file: File, selection: string): Promise<Blob> {
    return this.selectPages(file, selection);
  }

  async splitPdfIntoParts(file: File, rawParts: string): Promise<Blob[]> {
    const source = await this.loadPdf(file);
    const groups = rawParts.split(';').map((part) => part.trim());
    if (groups.length < 2 || groups.length > MAX_SPLIT_PARTS || groups.some((part) => !part)) {
      throw new Error(`Define 2 to ${MAX_SPLIT_PARTS} page ranges, separated by semicolons.`);
    }

    const resolved = groups.map((group) => this.resolveSelection(group, source.getPageCount()));
    const allIndices = resolved.flat();
    if (allIndices.length !== source.getPageCount() ||
        new Set(allIndices).size !== source.getPageCount() ||
        source.getPageIndices().some((index) => !allIndices.includes(index))) {
      throw new Error('Split ranges must include every page exactly once without overlaps.');
    }

    const outputs: Blob[] = [];
    for (const indices of resolved) {
      const output = await PDFDocument.create();
      const pages = await output.copyPages(source, indices);
      pages.forEach((page) => output.addPage(page));
      outputs.push(this.toBlob(await output.save()));
    }
    return outputs;
  }

  async selectPages(file: File, selection: string): Promise<Blob> {
    const source = await this.loadPdf(file);
    const indices = this.resolveSelection(selection, source.getPageCount());
    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, indices);
    pages.forEach((page) => output.addPage(page));
    return this.toBlob(await output.save());
  }

  async removePages(file: File, selection: string): Promise<Blob> {
    const source = await this.loadPdf(file);
    const remove = new Set(this.resolveSelection(selection, source.getPageCount()));
    const keep = source.getPageIndices().filter((index) => !remove.has(index));
    if (!keep.length) throw new Error('At least one page must remain in the PDF.');
    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, keep);
    pages.forEach((page) => output.addPage(page));
    return this.toBlob(await output.save());
  }

  async reorderPages(file: File, order: string): Promise<Blob> {
    const source = await this.loadPdf(file);
    const indices = this.resolveSelection(order, source.getPageCount());
    if (indices.length !== source.getPageCount()) {
      throw new Error(`Enter every page exactly once (1-${source.getPageCount()}).`);
    }
    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, indices);
    pages.forEach((page) => output.addPage(page));
    return this.toBlob(await output.save());
  }

  async rotatePages(file: File, rotation: number): Promise<Blob> {
    if (![90, 180, 270].includes(rotation)) throw new Error('Choose a rotation of 90, 180, or 270 degrees.');
    const pdf = await this.loadPdf(file);
    pdf.getPages().forEach((page) => page.setRotation(degrees((page.getRotation().angle + rotation) % 360)));
    return this.toBlob(await pdf.save());
  }

  async cropPages(file: File, width: number, height: number): Promise<Blob> {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new Error('Enter positive crop width and height in PDF points.');
    }
    const pdf = await this.loadPdf(file);
    for (const page of pdf.getPages()) {
      const box = page.getMediaBox();
      if (width > box.width || height > box.height) {
        throw new Error('Crop dimensions cannot exceed the page size.');
      }
      page.setCropBox(box.x, box.y, width, height);
    }
    return this.toBlob(await pdf.save());
  }

  async addPageNumbers(file: File): Promise<Blob> {
    const pdf = await this.loadPdf(file);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    pdf.getPages().forEach((page, index) => {
      const { width } = page.getSize();
      page.drawText(String(index + 1), {
        x: width / 2 - 6, y: 20, size: 10, font, color: rgb(0.2, 0.2, 0.2),
      });
    });
    return this.toBlob(await pdf.save());
  }

  async addWatermark(file: File, text: string): Promise<Blob> {
    const watermark = text.trim();
    if (!watermark || watermark.length > 100) {
      throw new Error('Enter watermark text of 1 to 100 characters.');
    }
    const pdf = await this.loadPdf(file);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    for (const page of pdf.getPages()) {
      const { width, height } = page.getSize();
      page.drawText(watermark, {
        x: width / 2 - font.widthOfTextAtSize(watermark, 28) / 2,
        y: height / 2, size: 28, font, color: rgb(0.5, 0.5, 0.5), opacity: 0.35,
        rotate: degrees(-35),
      });
    }
    return this.toBlob(await pdf.save());
  }

  async editMetadata(file: File, metadata: PdfMetadata): Promise<Blob> {
    const values = [metadata.title, metadata.author, metadata.subject, metadata.keywords];
    if (values.some((value) => value.length > 200)) {
      throw new Error('Each metadata field must be 200 characters or fewer.');
    }
    const pdf = await this.loadPdf(file);
    pdf.setTitle(metadata.title.trim());
    pdf.setAuthor(metadata.author.trim());
    pdf.setSubject(metadata.subject.trim());
    pdf.setKeywords(metadata.keywords.split(',').map((keyword) => keyword.trim()).filter(Boolean));
    return this.toBlob(await pdf.save());
  }

  async imagesToPdf(files: File[]): Promise<Blob> {
    if (!files.length) throw new Error('Choose at least one JPG or PNG image.');
    if (files.length > MAX_MERGE_FILES || files.reduce((total, file) => total + file.size, 0) > MAX_MERGE_BYTES) {
      throw new Error('Use no more than 20 images or 40 MB total at a time.');
    }
    const output = await PDFDocument.create();
    for (const file of files) {
      if (file.size === 0 || file.size > MAX_PDF_BYTES) throw new Error('Each image must be smaller than 20 MB.');
      const name = file.name.toLowerCase();
      let image;
      try {
        if (file.type === 'image/jpeg' || name.endsWith('.jpg') || name.endsWith('.jpeg')) {
          image = await output.embedJpg(await file.arrayBuffer());
        } else if (file.type === 'image/png' || name.endsWith('.png')) {
          image = await output.embedPng(await file.arrayBuffer());
        } else {
          throw new Error('Only JPG and PNG images are supported.');
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'Only JPG and PNG images are supported.') throw error;
        throw new Error('An image could not be read. Use a valid JPG or PNG image.');
      }
      const page = output.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      this.assertPageLimit(output.getPageCount());
    }
    return this.toBlob(await output.save());
  }

  private async loadPdf(file: File): Promise<PDFDocument> {
    this.assertPdfFile(file);
    if (file.size === 0) throw new Error('The selected file is empty.');
    if (file.size > MAX_PDF_BYTES) throw new Error('PDFs must be 20 MB or smaller.');
    let pdf: PDFDocument;
    try {
      pdf = await PDFDocument.load(await file.arrayBuffer());
    } catch {
      throw new Error('Could not read this PDF. It may be damaged, unsupported, or password-protected.');
    }
    this.assertPageLimit(pdf.getPageCount());
    return pdf;
  }

  private assertPdfFile(file: File): void {
    if (!file || (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf'))) {
      throw new Error('Please choose a valid PDF file.');
    }
  }

  private assertPageLimit(count: number): void {
    if (count > MAX_PDF_PAGES) throw new Error(`PDFs are limited to ${MAX_PDF_PAGES} pages per operation.`);
  }

  private resolveSelection(selection: string, pageCount: number): number[] {
    const pages = parsePageSelection(selection);
    if (!pages.length) throw new Error('Enter at least one page number or range such as 1-3,5,8.');
    if (pages.some((page) => page > pageCount)) {
      throw new Error(`Page numbers must be between 1 and ${pageCount}.`);
    }
    return pages.map((page) => page - 1);
  }

  private toBlob(bytes: Uint8Array): Blob {
    return new Blob([bytes as BlobPart], { type: 'application/pdf' });
  }
}
