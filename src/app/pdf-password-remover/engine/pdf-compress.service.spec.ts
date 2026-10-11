import { TestBed } from '@angular/core/testing';
import {
  COMPRESS_WORKER_FACTORY,
  PdfCompressService,
} from './pdf-compress.service';
import {
  CompressRequest,
  CompressWorkerMessage,
  MAX_COMPRESS_BYTES,
} from './compress-protocol';
import { QPDF_WASM_PATH } from './protect-protocol';

class FakeCompressWorker {
  onmessage: ((event: MessageEvent<CompressWorkerMessage>) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  request: { data: CompressRequest; transfer: Transferable[] } | null = null;
  terminated = false;

  postMessage(data: CompressRequest, transfer: Transferable[]): void {
    this.request = { data, transfer };
  }

  terminate(): void {
    this.terminated = true;
  }

  reply(data: CompressWorkerMessage): void {
    this.onmessage?.({ data } as MessageEvent<CompressWorkerMessage>);
  }
}

describe('PdfCompressService', () => {
  let workers: FakeCompressWorker[];
  let service: PdfCompressService;
  const flushWorker = async (index: number) => {
    for (let attempt = 0; attempt < 100 && !workers[index]?.request; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  };

  beforeEach(() => {
    workers = [];
    TestBed.configureTestingModule({
      providers: [{
        provide: COMPRESS_WORKER_FACTORY,
        useValue: () => {
          const worker = new FakeCompressWorker();
          workers.push(worker);
          return worker as unknown as Worker;
        },
      }],
    });
    service = TestBed.inject(PdfCompressService);
  });

  it('transfers the file to a same-origin worker and returns its result', async () => {
    const result = service.compress(new Blob(['%PDF-1.7 fixture']));
    await flushWorker(0);
    const request = workers[0].request;
    expect(request).not.toBeNull();
    if (!request) return;
    expect(new URL(request.data.wasmUrl).origin).toBe(location.origin);
    expect(request.data.wasmUrl).toContain(QPDF_WASM_PATH);
    expect(request.transfer).toEqual([request.data.bytes]);
    workers[0].reply({
      type: 'result',
      ok: true,
      bytes: new Uint8Array([37, 80, 68, 70]).buffer,
      reduced: true,
      warnings: false,
    });
    const output = await result;
    expect(output.blob.type).toBe('application/pdf');
    expect(output.reduced).toBeTrue();
    expect(workers[0].terminated).toBeTrue();
  });

  it('rejects empty and oversized files before creating a worker', async () => {
    await expectAsync(service.compress(new Blob([]))).toBeRejectedWithError(/between 1 byte and 20 MB/);
    const oversized = {
      size: MAX_COMPRESS_BYTES + 1,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    } as Blob;
    await expectAsync(service.compress(oversized)).toBeRejectedWithError(/between 1 byte and 20 MB/);
    expect(workers.length).toBe(0);
  });

  it('reports encrypted inputs and worker failures', async () => {
    const encrypted = service.compress(new Blob(['%PDF-1.7 fixture']));
    await flushWorker(0);
    workers[0].reply({ type: 'result', ok: false, code: 'already_encrypted' });
    await expectAsync(encrypted).toBeRejectedWithError(/Unlock this PDF/);

    const failure = service.compress(new Blob(['%PDF-1.7 fixture']));
    await flushWorker(1);
    workers[1].onerror?.({});
    await expectAsync(failure).toBeRejectedWithError(/compression worker failed/);
  });
});
