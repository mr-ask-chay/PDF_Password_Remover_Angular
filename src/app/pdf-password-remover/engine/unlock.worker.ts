/// <reference lib="webworker" />
/**
 * Web Worker that unlocks a PDF locally with qpdf (WebAssembly).
 * It makes no network requests except loading the engine's .wasm file from
 * this site. Each job runs in a fresh worker that is terminated afterwards.
 */
import createQpdf from '@neslinesli93/qpdf-wasm';
import { unlockWithQpdf, QpdfFactory } from './qpdf-unlock';
import type { UnlockRequest, UnlockWorkerMessage } from './unlock-protocol';

const post = (msg: UnlockWorkerMessage, transfer: Transferable[] = []) =>
  postMessage(msg, transfer);

addEventListener('message', async ({ data }: MessageEvent<UnlockRequest>) => {
  try {
    post({ type: 'progress', stage: 'loading-engine' });
    const result = await unlockWithQpdf(
      createQpdf as unknown as QpdfFactory,
      data.wasmUrl,
      new Uint8Array(data.bytes),
      data.password,
      () => post({ type: 'progress', stage: 'unlocking' })
    );
    if (result.ok) {
      const out = result.bytes.slice().buffer; // detach from the wasm heap
      post({ type: 'result', ok: true, bytes: out, repaired: result.repaired }, [out]);
    } else {
      post({ type: 'result', ok: false, code: result.code });
    }
  } catch (err) {
    const text = String((err as Error)?.message ?? err);
    post({
      type: 'result',
      ok: false,
      code: /memory|OOM|allocation|RangeError/i.test(text)
        ? 'out_of_memory'
        : /wasm|WebAssembly|fetch|compile|instantiate/i.test(text)
          ? 'engine_load_failed'
          : 'unknown',
    });
  }
});
