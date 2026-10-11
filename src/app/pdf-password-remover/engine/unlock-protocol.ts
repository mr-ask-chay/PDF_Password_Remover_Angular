/**
 * Message protocol between the PDF unlock service and its Web Worker.
 * Document bytes and passwords only ever travel between the page and the
 * worker in this browser tab — never to a server.
 */
export type UnlockErrorCode =
  | 'incorrect_password'
  | 'not_encrypted'
  | 'unsupported_encryption'
  | 'invalid_pdf'
  | 'too_large'
  | 'out_of_memory'
  | 'unsupported_browser'
  | 'engine_load_failed'
  | 'cancelled'
  | 'unknown';

export interface UnlockRequest {
  bytes: ArrayBuffer;
  password: string;
  /** Absolute URL of qpdf.wasm (same origin). */
  wasmUrl: string;
}

export type UnlockWorkerMessage =
  | { type: 'progress'; stage: 'loading-engine' | 'unlocking' }
  | { type: 'result'; ok: true; bytes: ArrayBuffer; repaired: boolean }
  | { type: 'result'; ok: false; code: UnlockErrorCode };

export type UnlockOutcome =
  | { ok: true; bytes: Uint8Array; repaired: boolean }
  | { ok: false; code: UnlockErrorCode };

/** Pinned engine version; the wasm is self-hosted under this path. */
export const QPDF_WASM_PATH = '/assets/vendor/qpdf-0.3.0/qpdf.wasm';

/** Client-side input limit (the previous server limit was 25 MB). */
export const MAX_PDF_BYTES = 100 * 1024 * 1024;
