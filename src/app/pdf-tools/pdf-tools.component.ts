import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PdfToolsService } from './pdf-tools.service';

export type PdfOperation =
  | 'extract'
  | 'remove'
  | 'reorder'
  | 'rotate'
  | 'crop'
  | 'page-numbers'
  | 'watermark'
  | 'metadata';

@Component({
  selector: 'app-pdf-tools',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './pdf-tools.component.html',
  styleUrls: ['./pdf-tools.component.scss'],
})
export class PdfToolsComponent implements OnDestroy {
  mergeFiles: File[] = [];
  mergeStatus = '';
  merging = false;

  splitFile: File | null = null;
  pdfFile: File | null = null;
  splitSelection = '';
  splitStatus = '';
  splitDownloads: Array<{ name: string; url: string }> = [];
  imageFiles: File[] = [];
  operation: PdfOperation = 'extract';
  pageSelection = '';
  rotation = 90;
  cropWidth = 500;
  cropHeight = 700;
  watermark = 'UNCLASP';
  metadataTitle = '';
  metadataAuthor = '';
  metadataSubject = '';
  metadataKeywords = '';
  processing = false;
  status = '';

  constructor(private readonly pdfTools: PdfToolsService) {}

  ngOnDestroy(): void {
    this.clearSplitDownloads();
  }

  onMergeFilesSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    this.mergeFiles = files ? Array.from(files) : [];
    this.mergeStatus = this.mergeFiles.length ? `${this.mergeFiles.length} PDF file(s) selected.` : '';
  }

  onPdfSelected(event: Event): void {
    this.clearSplitDownloads();
    this.pdfFile = (event.target as HTMLInputElement).files?.[0] || null;
    this.status = this.pdfFile ? `Selected: ${this.pdfFile.name}` : '';
  }

  onSplitPdfSelected(event: Event): void {
    this.clearSplitDownloads();
    this.splitFile = (event.target as HTMLInputElement).files?.[0] || null;
    this.splitStatus = this.splitFile ? `Selected: ${this.splitFile.name}` : '';
  }

  async splitPdf(): Promise<void> {
    if (this.processing) return;
    if (!this.splitFile) {
      this.splitStatus = 'Choose a PDF file first.';
      return;
    }
    this.clearSplitDownloads();
    this.processing = true;
    this.splitStatus = 'Splitting locally in your browser…';
    try {
      const parts = await this.pdfTools.splitPdfIntoParts(this.splitFile, this.splitSelection);
      this.splitDownloads = parts.map((blob, index) => ({
        name: `part-${index + 1}.pdf`,
        url: URL.createObjectURL(blob),
      }));
      this.splitStatus = `${parts.length} PDF parts are ready to download.`;
    } catch (error) {
      this.splitStatus = this.errorMessage(error);
    } finally {
      this.processing = false;
    }
  }

  onImagesSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    this.imageFiles = files ? Array.from(files) : [];
    this.status = this.imageFiles.length ? `${this.imageFiles.length} image(s) selected.` : '';
  }

  async mergePdfs(): Promise<void> {
    if (this.merging) return;
    this.merging = true;
    this.mergeStatus = 'Merging files locally…';
    try {
      const result = await this.pdfTools.mergePdfFiles(this.mergeFiles);
      this.downloadBlob(result, 'merged-pdf.pdf');
      this.mergeStatus = 'Merged PDF downloaded.';
    } catch (error) {
      this.mergeStatus = this.errorMessage(error);
    } finally {
      this.merging = false;
    }
  }

  async processPdf(): Promise<void> {
    if (this.processing) return;
    if (!this.pdfFile) {
      this.status = 'Choose a PDF file first.';
      return;
    }

    this.processing = true;
    this.status = 'Processing locally in your browser…';
    try {
      let result: Blob;
      let name: string;
      switch (this.operation) {
        case 'extract':
          result = await this.pdfTools.selectPages(this.pdfFile, this.pageSelection);
          name = 'extracted-pages.pdf';
          break;
        case 'remove':
          result = await this.pdfTools.removePages(this.pdfFile, this.pageSelection);
          name = 'pages-removed.pdf';
          break;
        case 'reorder':
          result = await this.pdfTools.reorderPages(this.pdfFile, this.pageSelection);
          name = 'reordered-pages.pdf';
          break;
        case 'rotate':
          result = await this.pdfTools.rotatePages(this.pdfFile, Number(this.rotation));
          name = 'rotated.pdf';
          break;
        case 'crop':
          result = await this.pdfTools.cropPages(this.pdfFile, Number(this.cropWidth), Number(this.cropHeight));
          name = 'cropped.pdf';
          break;
        case 'page-numbers':
          result = await this.pdfTools.addPageNumbers(this.pdfFile);
          name = 'numbered.pdf';
          break;
        case 'watermark':
          result = await this.pdfTools.addWatermark(this.pdfFile, this.watermark);
          name = 'watermarked.pdf';
          break;
        case 'metadata':
          result = await this.pdfTools.editMetadata(this.pdfFile, {
            title: this.metadataTitle,
            author: this.metadataAuthor,
            subject: this.metadataSubject,
            keywords: this.metadataKeywords,
          });
          name = 'metadata-updated.pdf';
          break;
      }
      this.downloadBlob(result, name);
      this.status = 'Finished. Your PDF was created and downloaded.';
    } catch (error) {
      this.status = this.errorMessage(error);
    } finally {
      this.processing = false;
    }
  }

  async convertImages(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    this.status = 'Creating PDF locally in your browser…';
    try {
      const result = await this.pdfTools.imagesToPdf(this.imageFiles);
      this.downloadBlob(result, 'images.pdf');
      this.status = 'Finished. Your PDF was created and downloaded.';
    } catch (error) {
      this.status = this.errorMessage(error);
    } finally {
      this.processing = false;
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Could not process the selected files.';
  }

  private clearSplitDownloads(): void {
    this.splitDownloads.forEach(({ url }) => URL.revokeObjectURL(url));
    this.splitDownloads = [];
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
