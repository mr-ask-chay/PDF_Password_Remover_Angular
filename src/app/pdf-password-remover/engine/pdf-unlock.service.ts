import { Inject, Injectable, InjectionToken } from '@angular/core';
import {
  MAX_PDF_BYTES,
  QPDF_WASM_PATH,
  UnlockOutcome,
  UnlockRequest,
  UnlockWorkerMessage,
} from './unlock-protocol';

/** Creates the unlock worker. Overridden in tests. */
export const UNLOCK_WORKER_FACTORY = new InjectionToken<() => Worker>('UNLOCK_WORKER_FACTORY', {
  providedIn: 'root',
  factory: () => () =>
    new Worker(new URL('./unlock.worker', import.meta.url), { type: 'module' }),
});

export interface UnlockOptions {
  signal?: AbortSignal;
  onProgress?: (stage: 'loading-engine' | 'unlocking') => void;
}

/**
 * Removes PDF passwords locally in the browser. The PDF and password are passed
 * only to a Web Worker in this tab; there is no server request and no upload
 * fallback. The engine (qpdf WebAssembly) is downloaded on first use.
 */
@Injectable({ providedIn: 'root' })
export class PdfUnlockService {
  constructor(@Inject(UNLOCK_WORKER_FACTORY) private readonly createWorker: () => Worker) {}

  /** True when this browser can run the local engine. */
  static isSupported(): boolean {
    return typeof Worker !== 'undefined' && typeof WebAssembly === 'object';
  }

  async unlock(file: Blob, password: string, opts: UnlockOptions = {}): Promise<UnlockOutcome> {
    if (!PdfUnlockService.isSupported()) return { ok: false, code: 'unsupported_browser' };
    if (file.size > MAX_PDF_BYTES) return { ok: false, code: 'too_large' };
    if (opts.signal?.aborted) return { ok: false, code: 'cancelled' };

    let bytes: ArrayBuffer;
    try {
      bytes = await file.arrayBuffer();
    } catch {
      return { ok: false, code: 'out_of_memory' };
    }
    if (opts.signal?.aborted) return { ok: false, code: 'cancelled' };

    let worker: Worker;
    try {
      worker = this.createWorker();
    } catch {
      return { ok: false, code: 'unsupported_browser' };
    }

    return new Promise<UnlockOutcome>((resolve) => {
      let settled = false;
      const finish = (outcome: UnlockOutcome) => {
        if (settled) return;
        settled = true;
        worker.terminate(); // frees the engine and its memory
        opts.signal?.removeEventListener('abort', onAbort);
        resolve(outcome);
      };
      const onAbort = () => finish({ ok: false, code: 'cancelled' });
      opts.signal?.addEventListener('abort', onAbort, { once: true });

      worker.onmessage = ({ data }: MessageEvent<UnlockWorkerMessage>) => {
        if (data.type === 'progress') {
          opts.onProgress?.(data.stage);
        } else if (data.ok) {
          finish({ ok: true, bytes: new Uint8Array(data.bytes), repaired: data.repaired });
        } else {
          finish({ ok: false, code: data.code });
        }
      };
      worker.onerror = () => finish({ ok: false, code: 'engine_load_failed' });

      const request: UnlockRequest = {
        bytes,
        password,
        wasmUrl: new URL(QPDF_WASM_PATH, location.origin).href,
      };
      worker.postMessage(request, [bytes]); // transfer, don't copy
    });
  }
}
