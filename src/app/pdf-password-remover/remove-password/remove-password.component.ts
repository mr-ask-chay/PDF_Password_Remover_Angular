import { Component, Inject, OnDestroy, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TokenService } from '../../core/token.service';
import { PdfBackendService } from 'src/app/core/service/pdf_backend_service/pdfBackend.service';
import {
  classifyRemoveError,
  readErrorCode,
  removeErrorMessage,
  RETRYABLE_TOKEN_CODES,
} from './remove-password-errors';

@Component({
  selector: 'app-remove-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './remove-password.component.html',
  styleUrls: ['./remove-password.component.scss'],
})
export class RemovePasswordComponent implements OnDestroy {
  loading = false;
  status = '';
  password = '';
  showPassword = false;
  downloadHref: string | null = null;

  private readonly isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private readonly tokenService: TokenService,
    private readonly pdfApi: PdfBackendService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnDestroy(): void {
    this.setDownloadHref(null);
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

  onSubmit(fileInput: HTMLInputElement) {
    if (!this.isBrowser) return;

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
    this.status = 'Processing…';
    this.attempt(file, pwd, false);
  }

  private attempt(file: File, pwd: string, isRetry: boolean) {
    this.tokenService.getReqToken().subscribe({
      next: ({ req_token }) => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('password', pwd);

        this.pdfApi.removePassword(fd, req_token).subscribe({
          next: (blob: Blob) => {
            this.loading = false;
            if (!(blob instanceof Blob)) {
              this.status = 'Unexpected response.';
              return;
            }
            this.setDownloadHref(URL.createObjectURL(blob));
            this.status = 'Done! Click to download.';
          },
          error: (err) => {
            readErrorCode(err).then((code) => {
              if (!isRetry && code && RETRYABLE_TOKEN_CODES.includes(code)) {
                this.attempt(file, pwd, true);
                return;
              }
              this.fail(err, code);
            });
          },
        });
      },
      error: (err) => {
        readErrorCode(err).then((code) => this.fail(err, code));
      },
    });
  }


  /** Shows a safe, user-facing message; never raw server text. */
  private fail(err: any, code: string | null): void {
    this.loading = false;
    const status = typeof err?.status === 'number' ? err.status : undefined;
    this.status = removeErrorMessage(classifyRemoveError(status, code));
  }
}
