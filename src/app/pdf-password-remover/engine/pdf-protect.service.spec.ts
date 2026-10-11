import { TestBed } from '@angular/core/testing';
import { PdfProtectService, PROTECT_WORKER_FACTORY } from './pdf-protect.service';
import {
  MAX_PROTECT_BYTES,
  ProtectRequest,
  ProtectWorkerMessage,
  QPDF_WASM_PATH,
} from './protect-protocol';

class FakeProtectWorker {
  onmessage: ((event: MessageEvent<ProtectWorkerMessage>) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  requests: Array<{ data: ProtectRequest; transfer: Transferable[] }> = [];
  terminated = false;
  postMessage(data: ProtectRequest, transfer: Transferable[]): void {
    this.requests.push({ data, transfer });
  }
  terminate(): void {
    this.terminated = true;
  }
  reply(data: ProtectWorkerMessage): void {
    this.onmessage?.({ data } as MessageEvent<ProtectWorkerMessage>);
  }
}

describe('PdfProtectService', () => {
  let workers: FakeProtectWorker[];
  let service: PdfProtectService;
  const pdf = () => new Blob(['%PDF-1.7 fixture']);
  const flush = async (workerIndex = 0) => {
    for (let attempt = 0; attempt < 100 && !workers[workerIndex]?.requests.length; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  };

  beforeEach(() => {
    workers = [];
    TestBed.configureTestingModule({
      providers: [{
        provide: PROTECT_WORKER_FACTORY,
        useValue: () => {
          const worker = new FakeProtectWorker();
          workers.push(worker);
          return worker as unknown as Worker;
        },
      }],
    });

    service = TestBed.inject(PdfProtectService);
  });

  it('transfers the document and password values only to a same-origin worker', async () => {
    const result = service.protect(pdf(), 'User-open-2026!', 'Owner-admin-2026!');
    await flush();
    const { data, transfer } = workers[0].requests[0];
    expect(data.userPassword).toBe('User-open-2026!');
    expect(data.ownerPassword).toBe('Owner-admin-2026!');
    expect(new URL(data.wasmUrl).origin).toBe(location.origin);
    expect(data.wasmUrl).toContain(QPDF_WASM_PATH);
    expect(transfer).toEqual([data.bytes]);
    workers[0].reply({
      type: 'result',
      ok: true,
      bytes: new Uint8Array([37, 80, 68, 70]).buffer,
      warnings: false,
    });
    expect((await result).blob.type).toBe('application/pdf');
    expect(workers[0].terminated).toBeTrue();
  });

  it('rejects weak, equal, and oversized inputs before starting a worker', async () => {
    await expectAsync(service.protect(pdf(), 'short', 'Owner-admin-2026!'))
      .toBeRejectedWithError(/8 to 127/);
    await expectAsync(service.protect(pdf(), 'Same-pass-2026!', 'Same-pass-2026!'))
      .toBeRejectedWithError(/must be different/);
    const oversized = {
      size: MAX_PROTECT_BYTES + 1,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    } as Blob;
    await expectAsync(service.protect(oversized, 'User-open-2026!', 'Owner-admin-2026!'))
      .toBeRejectedWithError(/20 MB/);
    expect(workers.length).toBe(0);
  });

  it('reports malformed and already-encrypted documents returned by the worker', async () => {
    const malformed = service.protect(pdf(), 'User-open-2026!', 'Owner-admin-2026!');
    await flush();
    workers[0].reply({ type: 'result', ok: false, code: 'invalid_pdf' });
    await expectAsync(malformed).toBeRejectedWithError(/damaged or unsupported/);

    const encrypted = service.protect(pdf(), 'User-open-2026!', 'Owner-admin-2026!');
    await flush(1);
    workers[1].reply({ type: 'result', ok: false, code: 'already_encrypted' });
    await expectAsync(encrypted).toBeRejectedWithError(/Unlock this PDF/);
  });

  it('does not make HTTP requests from the page during the worker workflow', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.callThrough();
    const xhrSpy = spyOn(XMLHttpRequest.prototype, 'open').and.callThrough();
    const result = service.protect(pdf(), 'User-open-2026!', 'Owner-admin-2026!');
    await flush();
    workers[0].reply({ type: 'result', ok: false, code: 'engine_error' });
    await expectAsync(result).toBeRejectedWithError(/could not protect/);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrSpy).not.toHaveBeenCalled();
  });
});
