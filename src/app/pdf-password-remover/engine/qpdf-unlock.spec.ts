import { compressWithQpdf, QpdfFactory, QpdfInstance, protectWithQpdf } from './qpdf-unlock';

describe('protectWithQpdf', () => {
  function createFactory(inputCheck = 0, passwordCheck = 3) {
    const calls: string[][] = [];
    const files = new Map<string, Uint8Array | string>();
    const output = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55]);
    const instance: QpdfInstance = {
      callMain: (args) => {
        calls.push(args);
        if (args[0] === '--check') return inputCheck;
        if (args[0] === '--encrypt') {
          files.set(args[args.length - 1], output);
          return 0;
        }
        if (args.includes('--requires-password')) return passwordCheck;
        return 2;
      },
      FS: {
        mkdir: () => undefined,
        writeFile: (path, data) => files.set(path, data),
        readFile: (path) => {
          const data = files.get(path);
          if (!(data instanceof Uint8Array)) throw new Error('Missing output');
          return data;
        },
        unlink: (path) => {
          files.delete(path);
        },
      },
    };
    const factory: QpdfFactory = async () => instance;
    return { factory, calls, output };
  }

  it('verifies the encrypted output with the supplied password', async () => {
    const { factory, calls, output } = createFactory();
    const result = await protectWithQpdf(
      factory,
      '/assets/qpdf.wasm',
      new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55]),
      'User-open-2026!',
      'Owner-admin-2026!'
    );

    expect(result.ok).toBeTrue();
    if (result.ok) {
      expect(Array.from(result.bytes)).toEqual(Array.from(output));
      expect(result.warnings).toBeFalse();
    }
    expect(calls[calls.length - 1]).toEqual([
      '--password-file=/work/password.txt',
      '--requires-password',
      '/work/out.pdf',
    ]);
    expect(calls.some((args) => args[0] === '--is-encrypted')).toBeFalse();
  });

  describe('compressWithQpdf', () => {
    function createFactory(output: number[]) {
      const calls: string[][] = [];
      const files = new Map<string, Uint8Array | string>();
      const instance: QpdfInstance = {
        callMain: (args) => {
          calls.push(args);
          if (args[0] === '--check') return 0;
          if (args[0] === '--object-streams=generate') {
            files.set(args[args.length - 1], new Uint8Array(output));
            return 0;
          }
          return 2;
        },
        FS: {
          mkdir: () => undefined,
          writeFile: (path, data) => files.set(path, data),
          readFile: (path) => {
            const data = files.get(path);
            if (!(data instanceof Uint8Array)) throw new Error('Missing optimized output');
            return data;
          },
          unlink: (path) => {
            files.delete(path);
          },
        },
      };
      const factory: QpdfFactory = async () => instance;
      return { factory, calls };
    }

    it('uses lossless compression and keeps the smaller validated output', async () => {
      const { factory, calls } = createFactory([37, 80, 68, 70]);
      const input = new Uint8Array(20).fill(1);
      const result = await compressWithQpdf(factory, '/assets/qpdf.wasm', input);

      expect(result.ok).toBeTrue();
      if (result.ok) {
        expect(result.reduced).toBeTrue();
        expect(Array.from(result.bytes)).toEqual([37, 80, 68, 70]);
      }
      expect(calls[1]).toEqual([
        '--object-streams=generate',
        '--recompress-flate',
        '--compression-level=9',
        '/compress/in.pdf',
        '/compress/out.pdf',
      ]);
    });

    it('never replaces an input with a larger compressed output', async () => {
      const { factory } = createFactory(new Array(24).fill(2));
      const input = new Uint8Array(20).fill(1);
      const result = await compressWithQpdf(factory, '/assets/qpdf.wasm', input);

      expect(result.ok).toBeTrue();
      if (result.ok) {
        expect(result.reduced).toBeFalse();
        expect(Array.from(result.bytes)).toEqual(Array.from(input));
      }
    });

    it('refuses encrypted input before starting qpdf', async () => {
      const factory = jasmine.createSpy('qpdf factory') as QpdfFactory;
      const input = new Uint8Array([37, 80, 68, 70, 10, 47, 69, 110, 99, 114, 121, 112, 116, 32, 49]);
      const result = await compressWithQpdf(factory, '/assets/qpdf.wasm', input);

      expect(result).toEqual({ ok: false, code: 'already_encrypted' });
      expect(factory).not.toHaveBeenCalled();
    });
  });

  it('rejects output when qpdf cannot confirm the supplied password', async () => {
    const { factory } = createFactory(0, 2);
    const result = await protectWithQpdf(
      factory,
      '/assets/qpdf.wasm',
      new Uint8Array([37, 80, 68, 70]),
      'User-open-2026!',
      'Owner-admin-2026!'
    );

    expect(result).toEqual({ ok: false, code: 'engine_error' });
  });

  it('distinguishes encrypted input from unreadable PDF input', async () => {
    const encrypted = createFactory(2);
    const encryptedResult = await protectWithQpdf(
      encrypted.factory,
      '/assets/qpdf.wasm',
      new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55, 10, 47, 69, 110, 99, 114, 121, 112, 116, 32, 49]),
      'User-open-2026!',
      'Owner-admin-2026!'
    );
    const malformed = createFactory(2);
    const malformedResult = await protectWithQpdf(
      malformed.factory,
      '/assets/qpdf.wasm',
      new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55]),
      'User-open-2026!',
      'Owner-admin-2026!'
    );

    expect(encryptedResult).toEqual({ ok: false, code: 'already_encrypted' });
    expect(malformedResult).toEqual({ ok: false, code: 'invalid_pdf' });
  });
});
