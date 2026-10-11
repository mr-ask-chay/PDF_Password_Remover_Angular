/// <reference lib="webworker" />
import createQpdf from '@neslinesli93/qpdf-wasm';
import { compressWithQpdf, QpdfFactory } from './qpdf-unlock';
import type { CompressRequest, CompressWorkerMessage } from './compress-protocol';

const post = (message: CompressWorkerMessage, transfer: Transferable[] = []) =>
  postMessage(message, transfer);

addEventListener('message', async ({ data }: MessageEvent<CompressRequest>) => {
  try {
    const result = await compressWithQpdf(
      createQpdf as unknown as QpdfFactory,
      data.wasmUrl,
      new Uint8Array(data.bytes)
    );
    if (result.ok) {
      const bytes = result.bytes.slice().buffer;
      post({ type: 'result', ok: true, bytes, reduced: result.reduced, warnings: result.warnings }, [bytes]);
    } else {
      post({ type: 'result', ok: false, code: result.code });
    }
  } catch {
    post({ type: 'result', ok: false, code: 'engine_load_failed' });
  }
});
