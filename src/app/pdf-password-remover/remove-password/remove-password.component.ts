import { Component, Inject, OnDestroy, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PdfUnlockService } from '../engine/pdf-unlock.service';
import { removeErrorMessage } from './remove-password-errors';

export const STATUS_DONE = 'Done! Click to download.';

/**
 * Removes a PDF password locally: the file and password are handed to a Web
 * Worker in this tab (qpdf WebAssembly). Nothing is uploaded, and there is no
 * server fallback if local processing fails.
 */
@Component({
  selector: 'app-remove-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './remove-password.component.html',
  styleUrls: ['./remove-password.component.scss'],
})
export class RemovePasswordComponent implements OnDestroy {
  readonly doneMessage = STATUS_DONE;
  loading = false;
  status = '';
  password = '';
  showPassword = false;
  downloadHref: string | null = null;

  private readonly isBrowser: boolean;
  private abort?: AbortController;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private readonly unlocker: PdfUnlockService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnDestroy(): void {
    this.abort?.abort(); // stops and terminates any running worker
    this.setDownloadHref(null);
    this.password = '';
  }

  /**
   * Replaces the download link, revoking the previous object URL. The current
   * URL stays valid until the next submission or until the component is
   * destroyed, so the user can download (or re-download) the result.
   */
  private setDownloadHref(url: string | null): void {
    if (this.downloadHref && this.downloadHref !== url) {
      URL.revokeObjectURL(this.downloadHref);
    }
    this.downloadHref = url;
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  cancel(): void {
    this.abort?.abort();
  }

  async onSubmit(fileInput: HTMLInputElement): Promise<void> {
    if (!this.isBrowser || this.loading) return;

    const file = fileInput.files?.[0] || null;
    const pwd = (this.password || '').trim();
    this.setDownloadHref(null);
    this.status = '';

    if (!file || !pwd) {
      this.status = 'Please choose a PDF and enter password.';
      return;
    }
    if (
      file.type !== 'application/pdf' &&
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
      this.status = 'Only PDF files are supported.';
      return;
    }

    this.loading = true;
    this.status = 'Preparing…';
    const abort = (this.abort = new AbortController());
    try {
      const result = await this.unlocker.unlock(file, pwd, {
        signal: abort.signal,
        onProgress: (stage) => {
          this.status = stage === 'loading-engine'
            ? 'Loading the PDF engine…'
            : 'Unlocking in your browser…';
        },
      });
      if (abort.signal.aborted && !result.ok && result.code !== 'cancelled') return;
      if (result.ok) {
        const blob = new Blob([result.bytes as BlobPart], { type: 'application/pdf' });
        result.bytes.fill(0); // the Blob holds its own copy; wipe ours
        this.setDownloadHref(URL.createObjectURL(blob));
        this.status = result.repaired
          ? `${STATUS_DONE} (Some damaged parts of the file were repaired — please check it.)`
          : STATUS_DONE;
        this.password = ''; // don't keep the password around after success
      } else {
        this.status = removeErrorMessage(result.code);
      }
    } finally {
      this.loading = false;
      if (this.abort === abort) this.abort = undefined;
    }
  }
}
