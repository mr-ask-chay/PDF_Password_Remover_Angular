import { Inject, Injectable, InjectionToken } from '@angular/core';
import {
  CompressRequest,
  CompressWorkerMessage,
  MAX_COMPRESS_BYTES,
} from './compress-protocol';
import { QPDF_WASM_PATH } from './protect-protocol';

export const COMPRESS_WORKER_FACTORY = new InjectionToken<() => Worker>('COMPRESS_WORKER_FACTORY', {
  providedIn: 'root',
  factory: () => () => new Worker(new URL('./compress.worker', import.meta.url), { type: 'module' }),
});

@Injectable({ providedIn: 'root' })
export class PdfCompressService {
  constructor(@Inject(COMPRESS_WORKER_FACTORY) private readonly createWorker: () => Worker) {}

  async compress(file: Blob): Promise<{ blob: Blob; reduced: boolean; warnings: boolean }> {
    if (!file.size || file.size > MAX_COMPRESS_BYTES) {
      throw new Error('Choose a PDF between 1 byte and 20 MB.');
    }

    const bytes = await file.arrayBuffer();
    const worker = this.createWorker();
    return new Promise<{ blob: Blob; reduced: boolean; warnings: boolean }>((resolve, reject) => {
      let settled = false;
      const finish = (
        error?: Error,
        output?: ArrayBuffer,
        reduced = false,
        warnings = false
      ) => {
        if (settled) return;
        settled = true;
        worker.terminate();
        if (error) reject(error);
        else if (output) resolve({ blob: new Blob([output], { type: 'application/pdf' }), reduced, warnings });
        else reject(new Error('The compression worker returned no PDF output.'));
      };

      worker.onmessage = ({ data }: MessageEvent<CompressWorkerMessage>) => {
        if (data.ok) {
          finish(undefined, data.bytes, data.reduced, data.warnings);
          return;
        }
        const messages = {
          invalid_pdf: 'Could not read this PDF. It may be damaged or unsupported.',
          already_encrypted: 'Unlock this PDF before compressing it.',
          engine_error: 'The browser could not optimize this PDF.',
          engine_load_failed: 'The local PDF compression engine could not be loaded.',
        };
        finish(new Error(messages[data.code]));
      };
      worker.onerror = () => finish(new Error('The local PDF compression worker failed.'));

      const request: CompressRequest = {
        bytes,
        wasmUrl: new URL(QPDF_WASM_PATH, location.origin).href,
      };
      worker.postMessage(request, [bytes]);
    });
  }
}
