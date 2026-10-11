import { Injectable } from '@angular/core';

const MAX_RENDER_PIXELS = 16_000_000;
const MAX_RENDERED_PAGES = 50;
export const MAX_TOTAL_RENDER_PIXELS = 25_000_000;

export interface PdfTextDocument {
  numPages: number;
  getPage(pageNumber: number): Promise<{
    getTextContent(): Promise<{ items: Array<{ str?: string; transform?: number[] }> }>;
    getViewport(options: { scale: number }): { width: number; height: number };
    render(options: {
      canvasContext: CanvasRenderingContext2D;
      viewport: { width: number; height: number };
    }): { promise: Promise<void> };
  }>;
  destroy(): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class PdfRenderService {
  async extractMarkdown(file: File): Promise<Blob> {
    const document = await this.open(file);
    try {
      const sections: string[] = ['# Extracted PDF text', ''];
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        const items = content.items
          .filter((item) => typeof item.str === 'string' && item.str.trim())
          .map((item) => ({
            text: item.str!.replace(/\s+/g, ' ').trim(),
            x: item.transform?.[4] ?? 0,
            y: item.transform?.[5] ?? 0,
          }))
          .sort((left, right) => right.y - left.y || left.x - right.x);
        const lines: string[] = [];
        let currentY: number | undefined;
        let line = '';
        for (const item of items) {
          if (currentY !== undefined && Math.abs(currentY - item.y) > 3) {
            if (line.trim()) lines.push(line.trim());
            line = '';
          } else if (line && item.x > 0) {
            line += ' ';
          }
          line += item.text;
          currentY = item.y;
        }
        if (line.trim()) lines.push(line.trim());
        sections.push(`## Page ${pageNumber}`, '', lines.join('\n'), '');
      }
      return new Blob([sections.join('\n')], { type: 'text/markdown;charset=utf-8' });
    } finally {
      await document.destroy();
    }
  }

  async renderJpegPages(file: File, scale = 1.5): Promise<Array<{ name: string; blob: Blob }>> {
    if (!Number.isFinite(scale) || scale <= 0) {
      throw new Error('Choose a positive, finite image scale.');
    }
    const document = await this.open(file);
    try {
      if (document.numPages > MAX_RENDERED_PAGES) {
        throw new Error(`PDF to JPG is limited to ${MAX_RENDERED_PAGES} pages per operation.`);
      }
      const images: Array<{ name: string; blob: Blob }> = [];
      let remainingPixels = MAX_TOTAL_RENDER_PIXELS;
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        let viewport = page.getViewport({ scale });
        const pagePixelLimit = Math.min(MAX_RENDER_PIXELS, remainingPixels);
        const requestedPixels = Math.ceil(viewport.width) * Math.ceil(viewport.height);
        if (requestedPixels > pagePixelLimit) {
          viewport = page.getViewport({
            scale: scale * Math.sqrt(pagePixelLimit / (viewport.width * viewport.height)) * 0.999,
          });
        }
        const pagePixels = Math.ceil(viewport.width) * Math.ceil(viewport.height);
        if (pagePixels > pagePixelLimit) {
          throw new Error('This PDF exceeds the local image rendering memory limit.');
        }
        remainingPixels -= pagePixels;
        const canvas = globalThis.document.createElement('canvas');
        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));
        try {
          const context = canvas.getContext('2d', { alpha: false });
          if (!context) throw new Error('This browser cannot render PDF pages to images.');
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: context, viewport }).promise;
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((result) =>
              result ? resolve(result) : reject(new Error('Could not create a JPG image.')),
              'image/jpeg',
              0.9
            );
          });
          images.push({
            name: `${file.name.replace(/\.pdf$/i, '') || 'page'}-${String(pageNumber).padStart(3, '0')}.jpg`,
            blob,
          });
        } finally {
          canvas.width = 0;
          canvas.height = 0;
        }
      }
      return images;
    } finally {
      await document.destroy();
    }
  }

  async compareText(firstFile: File, secondFile: File): Promise<Blob> {
    const first = await this.extractPageText(firstFile);
    const second = await this.extractPageText(secondFile);
    const report = [
      'PDF text comparison (page-by-page; not a visual or pixel comparison)',
      `First document: ${firstFile.name}`,
      `Second document: ${secondFile.name}`,
      '',
      ...this.diffPages(first, second),
    ];
    return new Blob([report.join('\n')], { type: 'text/plain;charset=utf-8' });
  }

  private async extractPageText(file: File): Promise<string[]> {
    const document = await this.open(file);
    try {
      const result: string[] = [];
      for (let page = 1; page <= document.numPages; page += 1) {
        const content = await (await document.getPage(page)).getTextContent();
        result.push(content.items.map((item) => item.str || '').join(' ').replace(/\s+/g, ' ').trim());
      }
      return result;
    } finally {
      await document.destroy();
    }
  }

  private diffPages(first: string[], second: string[]): string[] {
    const lines: string[] = [];
    const pageCount = Math.max(first.length, second.length);
    for (let index = 0; index < pageCount; index += 1) {
      const before = first[index] ?? '[page absent]';
      const after = second[index] ?? '[page absent]';
      if (before !== after) {
        lines.push(`Page ${index + 1} differs:`, `- ${before}`, `+ ${after}`, '');
      }
    }
    if (!lines.length) lines.push('No extracted text differences found.');
    return lines;
  }

  private async open(file: File): Promise<PdfTextDocument> {
    if (!file || (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf'))) {
      throw new Error('Please choose a valid PDF file.');
    }
    if (!file.size || file.size > 20 * 1024 * 1024) {
      throw new Error('PDFs must be between 1 byte and 20 MB.');
    }
    try {
      const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc =
        new URL('/assets/vendor/pdfjs-4.10.38/pdf.worker.min.mjs', location.origin).href;
      const loading = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
      const document = await loading.promise;
      if (document.numPages > 500) {
        await document.destroy();
        throw new Error('PDFs are limited to 500 pages per operation.');
      }
      return document;
    } catch (error) {
      if (error instanceof Error && /limited to|valid PDF|20 MB/.test(error.message)) throw error;
      throw new Error('Could not read this PDF. It may be damaged, unsupported, or password-protected.');
    }
  }
}
