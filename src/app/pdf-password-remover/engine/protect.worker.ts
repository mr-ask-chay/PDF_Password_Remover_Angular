/// <reference lib="webworker" />
import createQpdf from '@neslinesli93/qpdf-wasm';
import { protectWithQpdf, QpdfFactory } from './qpdf-unlock';
import type { ProtectRequest, ProtectWorkerMessage } from './protect-protocol';

const post = (message: ProtectWorkerMessage, transfer: Transferable[] = []) =>
  postMessage(message, transfer);

addEventListener('message', async ({ data }: MessageEvent<ProtectRequest>) => {
  try {
    const result = await protectWithQpdf(
      createQpdf as unknown as QpdfFactory,
      data.wasmUrl,
      new Uint8Array(data.bytes),
      data.userPassword,
      data.ownerPassword
    );
    if (result.ok) {
      const bytes = result.bytes.slice().buffer;
      post({ type: 'result', ok: true, bytes, warnings: result.warnings }, [bytes]);
    } else {
      post({ type: 'result', ok: false, code: result.code });
    }
  } catch {
    post({ type: 'result', ok: false, code: 'engine_load_failed' });
  }
});
