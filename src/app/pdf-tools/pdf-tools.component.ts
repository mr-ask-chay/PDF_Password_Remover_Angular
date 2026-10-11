import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PdfToolsService } from './pdf-tools.service';
import { PdfRenderService } from './pdf-render.service';
import { PdfProtectService } from '../pdf-password-remover/engine/pdf-protect.service';
import { PdfCompressService } from '../pdf-password-remover/engine/pdf-compress.service';

export type PdfOperation =
  | 'extract'
  | 'remove'
  | 'reorder'
  | 'rotate'
  | 'crop'
  | 'page-numbers'
  | 'watermark'
  | 'text-overlay'
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
  renderedDownloads: Array<{ name: string; url: string }> = [];
  compareFile: File | null = null;
  secondCompareFile: File | null = null;
  imageFiles: File[] = [];
  operation: PdfOperation = 'extract';
  pageSelection = '';
  rotation = 90;
  cropWidth = 500;
  cropHeight = 700;
  watermark = 'UNCLASP';
  overlayText = '';
  overlayPage = 1;
  overlayX = 48;
  overlayY = 48;
  overlaySize = 12;
  metadataTitle = '';
  metadataAuthor = '';
  metadataSubject = '';
  metadataKeywords = '';
  formFile: File | null = null;
  formFields: Array<{ name: string; value: string }> = [];
  formValues: Record<string, string> = {};
  formStatus = '';
  protectFile: File | null = null;
  protectUserPassword = '';
  protectOwnerPassword = '';
  protectStatus = '';
  protecting = false;
  compressFile: File | null = null;
  compressStatus = '';
  compressing = false;
  processing = false;
  status = '';

  constructor(
    private readonly pdfTools: PdfToolsService,
    private readonly renderer: PdfRenderService,
    private readonly pdfProtect: PdfProtectService,
    private readonly pdfCompress: PdfCompressService
  ) {}

  ngOnDestroy(): void {
    this.clearSplitDownloads();
    this.clearRenderedDownloads();
  }

  onMergeFilesSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    this.mergeFiles = files ? Array.from(files) : [];
    this.mergeStatus = this.mergeFiles.length ? `${this.mergeFiles.length} PDF file(s) selected.` : '';
  }

  onPdfSelected(event: Event): void {
    this.clearSplitDownloads();
    this.clearRenderedDownloads();
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

  onCompareFileSelected(event: Event, second: boolean): void {
    const file = (event.target as HTMLInputElement).files?.[0] || null;
    if (second) this.secondCompareFile = file;
    else this.compareFile = file;
  }

  async onFormPdfSelected(event: Event): Promise<void> {
    this.formFile = (event.target as HTMLInputElement).files?.[0] || null;
    this.formFields = [];
    this.formValues = {};
    if (!this.formFile) {
      this.formStatus = '';
      return;
    }
    this.processing = true;
    this.formStatus = 'Reading supported text fields locally…';
    try {
      this.formFields = await this.pdfTools.getTextFormFields(this.formFile);
      this.formValues = Object.fromEntries(this.formFields.map(({ name, value }) => [name, value]));
      this.formStatus = this.formFields.length
        ? `${this.formFields.length} text field(s) ready to edit.`
        : 'No supported text fields found. Checkboxes, lists, and radio buttons are not supported.';
    } catch (error) {
      this.formStatus = this.errorMessage(error);
    } finally {
      this.processing = false;
    }
  }

  async saveFormPdf(): Promise<void> {
    if (!this.formFile || this.processing) return;
    this.processing = true;
    this.formStatus = 'Updating form fields locally…';
    try {
      const result = await this.pdfTools.fillTextFormFields(this.formFile, this.formValues);
      this.downloadBlob(result, 'filled-form.pdf');
      this.formStatus = 'Updated PDF form downloaded. Only text fields are supported.';
    } catch (error) {
      this.formStatus = this.errorMessage(error);
    } finally {
      this.processing = false;
    }
  }

  onProtectFileSelected(event: Event): void {
    this.protectFile = (event.target as HTMLInputElement).files?.[0] || null;
    this.protectStatus = this.protectFile ? `Selected: ${this.protectFile.name}` : '';
  }

  async protectPdf(): Promise<void> {
    if (!this.protectFile || this.protecting) return;
    this.protecting = true;
    this.protectStatus = 'Protecting locally in your browser…';
    try {
      const result = await this.pdfProtect.protect(
        this.protectFile,
        this.protectUserPassword,
        this.protectOwnerPassword
      );
      this.downloadBlob(result.blob, 'protected.pdf');
      this.protectStatus = result.warnings
        ? 'AES-256 protected PDF downloaded with qpdf warnings. Verify it before sharing.'
        : 'AES-256 protected PDF downloaded. Keep both passwords safe.';
    } catch (error) {
      this.protectStatus = this.errorMessage(error);
    } finally {
      this.protectUserPassword = '';
      this.protectOwnerPassword = '';
      this.protecting = false;
    }
  }

  onCompressFileSelected(event: Event): void {
    this.compressFile = (event.target as HTMLInputElement).files?.[0] || null;
    this.compressStatus = this.compressFile ? `Selected: ${this.compressFile.name}` : '';
  }

  async compressPdf(): Promise<void> {
    if (!this.compressFile || this.compressing) return;
    this.compressing = true;
    this.compressStatus = 'Optimizing PDF locally in your browser…';
    try {
      const result = await this.pdfCompress.compress(this.compressFile);
      this.downloadBlob(result.blob, 'compressed.pdf');
      this.compressStatus = result.warnings
        ? 'Optimized PDF downloaded with qpdf warnings. Verify it before sharing.'
        : result.reduced
          ? 'PDF optimized and downloaded.'
          : 'This PDF could not be reduced with lossless optimization; the original PDF was downloaded unchanged.';
    } catch (error) {
      this.compressStatus = this.errorMessage(error);
    } finally {
      this.compressing = false;
    }
  }

  async convertPdfToJpg(): Promise<void> {
    if (!this.pdfFile || this.processing) return;
    this.clearRenderedDownloads();
    this.processing = true;
    this.status = 'Rendering PDF pages locally…';
    try {
      const images = await this.renderer.renderJpegPages(this.pdfFile);
      this.renderedDownloads = images.map(({ name, blob }) => ({ name, url: URL.createObjectURL(blob) }));
      this.status = `${images.length} JPG page image(s) are ready.`;
    } catch (error) {
      this.status = this.errorMessage(error);
    } finally {
      this.processing = false;
    }
  }

  async convertPdfToMarkdown(): Promise<void> {
    if (!this.pdfFile || this.processing) return;
    this.processing = true;
    this.status = 'Extracting selectable text locally…';
    try {
      const markdown = await this.renderer.extractMarkdown(this.pdfFile);
      this.downloadBlob(markdown, `${this.pdfFile.name.replace(/\.pdf$/i, '') || 'document'}.md`);
      this.status = 'Markdown text file downloaded. Scanned pages require OCR and are not transcribed.';
    } catch (error) {
      this.status = this.errorMessage(error);
    } finally {
      this.processing = false;
    }
  }

  async comparePdfs(): Promise<void> {
    if (!this.compareFile || !this.secondCompareFile || this.processing) return;
    this.processing = true;
    this.status = 'Comparing selectable text locally…';
    try {
      const report = await this.renderer.compareText(this.compareFile, this.secondCompareFile);
      this.downloadBlob(report, 'pdf-text-comparison.txt');
      this.status = 'Text comparison report downloaded. This does not compare visual layout.';
    } catch (error) {
      this.status = this.errorMessage(error);
    } finally {
      this.processing = false;
    }
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
        case 'text-overlay':
          result = await this.pdfTools.addTextOverlay(
            this.pdfFile,
            Number(this.overlayPage),
            this.overlayText,
            Number(this.overlayX),
            Number(this.overlayY),
            Number(this.overlaySize)
          );
          name = 'text-overlay.pdf';
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

  private clearRenderedDownloads(): void {
    this.renderedDownloads.forEach(({ url }) => URL.revokeObjectURL(url));
    this.renderedDownloads = [];
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
