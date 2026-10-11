export interface CompressRequest {
  bytes: ArrayBuffer;
  wasmUrl: string;
}

export type CompressWorkerMessage =
  | { type: 'result'; ok: true; bytes: ArrayBuffer; reduced: boolean; warnings: boolean }
  | { type: 'result'; ok: false; code: 'invalid_pdf' | 'already_encrypted' | 'engine_error' | 'engine_load_failed' };

export const MAX_COMPRESS_BYTES = 20 * 1024 * 1024;
