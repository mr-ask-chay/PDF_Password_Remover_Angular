import { Inject, Injectable, InjectionToken } from '@angular/core';
import { protectWithQpdf } from './qpdf-unlock';
import {
  MAX_PROTECT_BYTES,
  ProtectRequest,
  ProtectWorkerMessage,
  QPDF_WASM_PATH,
} from './protect-protocol';

export const PROTECT_WORKER_FACTORY = new InjectionToken<() => Worker>('PROTECT_WORKER_FACTORY', {
  providedIn: 'root',
  factory: () => () => new Worker(new URL('./protect.worker', import.meta.url), { type: 'module' }),
});

@Injectable({ providedIn: 'root' })
export class PdfProtectService {
  constructor(@Inject(PROTECT_WORKER_FACTORY) private readonly createWorker: () => Worker) {}

  async protect(file: Blob, userPassword: string, ownerPassword: string): Promise<{ blob: Blob; warnings: boolean }> {
    if (!file.size || file.size > MAX_PROTECT_BYTES) {
      throw new Error('Choose a PDF between 1 byte and 20 MB.');
    }
    if (!/^[\x20-\x7E]{8,127}$/.test(userPassword) || !/^[\x20-\x7E]{8,127}$/.test(ownerPassword)) {
      throw new Error('Use separate passwords of 8 to 127 printable ASCII characters.');
    }
    if (userPassword === ownerPassword) {
      throw new Error('The open password and owner password must be different.');
    }

    const bytes = await file.arrayBuffer();
    const worker = this.createWorker();
    return new Promise<{ blob: Blob; warnings: boolean }>((resolve, reject) => {
      let settled = false;
      const finish = (error?: Error, output?: ArrayBuffer, warnings = false) => {
        if (settled) return;
        settled = true;
        worker.terminate();
        if (error) reject(error);
        else resolve({ blob: new Blob([output!], { type: 'application/pdf' }), warnings });
      };

      worker.onmessage = ({ data }: MessageEvent<ProtectWorkerMessage>) => {
        if (data.ok) {
          finish(undefined, data.bytes, data.warnings);
          return;
        }
        const messages = {
          invalid_pdf: 'Could not read this PDF. It may be damaged or unsupported.',
          already_encrypted: 'Unlock this PDF before applying a new password.',
          engine_error: 'The browser could not protect this PDF.',
          engine_load_failed: 'The local PDF protection engine could not be loaded.',
        };
        finish(new Error(messages[data.code]));
      };
      worker.onerror = (event: ErrorEvent) => {
        const detail = event.message ? `: ${event.message}` : '';
        finish(new Error(`The local PDF protection worker failed${detail}.`));
      };

      const request: ProtectRequest = {
        bytes,
        userPassword,
        ownerPassword,
        wasmUrl: new URL(QPDF_WASM_PATH, location.origin).href,
      };
      worker.postMessage(request, [bytes]);
    });
  }
}
