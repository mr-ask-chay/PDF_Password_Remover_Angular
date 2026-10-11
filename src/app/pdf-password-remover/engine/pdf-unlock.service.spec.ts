import { TestBed } from '@angular/core/testing';
import { PdfUnlockService, UNLOCK_WORKER_FACTORY } from './pdf-unlock.service';
import { MAX_PDF_BYTES, QPDF_WASM_PATH, UnlockRequest, UnlockWorkerMessage } from './unlock-protocol';

/** Minimal stand-in for a Worker: records posts, lets the test reply. */
class FakeWorker {
  onmessage: ((e: MessageEvent<UnlockWorkerMessage>) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  posted: { data: UnlockRequest; transfer: Transferable[] }[] = [];
  terminated = false;
  postMessage(data: UnlockRequest, transfer: Transferable[]) { this.posted.push({ data, transfer }); }
  terminate() { this.terminated = true; }
  reply(msg: UnlockWorkerMessage) { this.onmessage?.({ data: msg } as MessageEvent<UnlockWorkerMessage>); }
}

describe('PdfUnlockService', () => {
  let workers: FakeWorker[];
  let service: PdfUnlockService;
  const pdf = () => new Blob(['%PDF-1.7 fake'], { type: 'application/pdf' });
  /** Waits until the service has created a worker and posted the job (file.arrayBuffer() is async). */
  const flush = async () => {
    for (let i = 0; i < 100 && !workers[0]?.posted.length; i++) await new Promise((r) => setTimeout(r, 5));
  };

  beforeEach(() => {
    workers = [];
    TestBed.configureTestingModule({
      providers: [{ provide: UNLOCK_WORKER_FACTORY, useValue: () => { const w = new FakeWorker(); workers.push(w); return w as unknown as Worker; } }],
    });
    service = TestBed.inject(PdfUnlockService);
  });

  it('sends bytes, password and the self-hosted wasm URL to the worker (transferring the buffer)', async () => {
    const run = service.unlock(pdf(), 'pw');
    await flush();
    const { data, transfer } = workers[0].posted[0];
    expect(data.password).toBe('pw');
    expect(data.wasmUrl).toBe(new URL(QPDF_WASM_PATH, location.origin).href);
    expect(new URL(data.wasmUrl).origin).toBe(location.origin);
    expect(transfer).toEqual([data.bytes]);
    workers[0].reply({ type: 'result', ok: false, code: 'incorrect_password' });
    expect(await run).toEqual({ ok: false, code: 'incorrect_password' });
  });

  it('returns the unlocked bytes and terminates the worker', async () => {
    const run = service.unlock(pdf(), 'pw');
    await flush();
    const out = new Uint8Array([37, 80, 68, 70]).buffer;
    workers[0].reply({ type: 'result', ok: true, bytes: out, repaired: false });
    const r = await run;
    expect(r.ok).toBeTrue();
    expect(r.ok && Array.from(r.bytes)).toEqual([37, 80, 68, 70]);
    expect(workers[0].terminated).toBeTrue();
  });

  it('forwards progress stages', async () => {
    const stages: string[] = [];
    const run = service.unlock(pdf(), 'pw', { onProgress: (s) => stages.push(s) });
    await flush();
    workers[0].reply({ type: 'progress', stage: 'loading-engine' });
    workers[0].reply({ type: 'progress', stage: 'unlocking' });
    workers[0].reply({ type: 'result', ok: false, code: 'invalid_pdf' });
    await run;
    expect(stages).toEqual(['loading-engine', 'unlocking']);
  });

  it('aborting terminates the worker and reports "cancelled"', async () => {
    const ctrl = new AbortController();
    const run = service.unlock(pdf(), 'pw', { signal: ctrl.signal });
    await flush();
    ctrl.abort();
    expect(await run).toEqual({ ok: false, code: 'cancelled' });
    expect(workers[0].terminated).toBeTrue();
  });

  it('a worker error maps to engine_load_failed (no fallback)', async () => {
    const run = service.unlock(pdf(), 'pw');
    await flush();
    workers[0].onerror?.({});
    expect(await run).toEqual({ ok: false, code: 'engine_load_failed' });
  });

  it('rejects files over the size limit without starting a worker', async () => {
    const big = { size: MAX_PDF_BYTES + 1, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) } as unknown as Blob;
    expect(await service.unlock(big, 'pw')).toEqual({ ok: false, code: 'too_large' });
    expect(workers.length).toBe(0);
  });

  it('does not start a worker when already aborted', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    expect(await service.unlock(pdf(), 'pw', { signal: ctrl.signal })).toEqual({ ok: false, code: 'cancelled' });
    expect(workers.length).toBe(0);
  });

  it('never makes HTTP requests', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.callThrough();
    const xhrSpy = spyOn(XMLHttpRequest.prototype, 'open').and.callThrough();
    const run = service.unlock(pdf(), 'pw');
    await flush();
    workers[0].reply({ type: 'result', ok: false, code: 'incorrect_password' });
    await run;
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrSpy).not.toHaveBeenCalled();
  });
});
