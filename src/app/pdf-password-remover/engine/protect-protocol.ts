export interface ProtectRequest {
  bytes: ArrayBuffer;
  userPassword: string;
  ownerPassword: string;
  wasmUrl: string;
}

export type ProtectWorkerMessage =
  | { type: 'result'; ok: true; bytes: ArrayBuffer; warnings: boolean }
  | { type: 'result'; ok: false; code: 'invalid_pdf' | 'already_encrypted' | 'engine_error' | 'engine_load_failed' };

export const MAX_PROTECT_BYTES = 20 * 1024 * 1024;
export const QPDF_WASM_PATH = '/assets/vendor/qpdf-0.3.0/qpdf.wasm';
