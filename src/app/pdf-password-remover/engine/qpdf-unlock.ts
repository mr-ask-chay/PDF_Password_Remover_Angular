import type { UnlockErrorCode } from './unlock-protocol';

/** The subset of the qpdf Emscripten module used here. */
export interface QpdfInstance {
  callMain(args: string[]): number;
  FS: {
    mkdir(path: string): void;
    writeFile(path: string, data: Uint8Array | string): void;
    readFile(path: string): Uint8Array;
    unlink(path: string): void;
  };
}

export type QpdfFactory = (opts: {
  locateFile: () => string;
  print: (s: string) => void;
  printErr: (s: string) => void;
}) => Promise<QpdfInstance>;

export type QpdfUnlockResult =
  | { ok: true; bytes: Uint8Array; repaired: boolean }
  | { ok: false; code: UnlockErrorCode };

const IN = '/work/in.pdf';
const OUT = '/work/out.pdf';
const PW = '/work/password.txt';

/**
 * Removes the password from a PDF with qpdf (WebAssembly), entirely in memory.
 * qpdf exit codes: 0 = success, 2 = error, 3 = success with warnings.
 * qpdf's messages are collected only to classify failures; they are never
 * logged or returned, and they never contain the password.
 */
export async function unlockWithQpdf(
  createQpdf: QpdfFactory,
  wasmUrl: string,
  bytes: Uint8Array,
  password: string,
  onEngineReady?: () => void
): Promise<QpdfUnlockResult> {
  const messages: string[] = [];
  const collect = (...a: unknown[]) => { messages.push(a.join(' ')); };
  // This qpdf build binds console.log/console.error when the module is created
  // (it ignores print/printErr), so swap them in while creating it. qpdf's
  // messages are then captured here instead of reaching the console.
  const original = { log: console.log, error: console.error };
  console.log = collect;
  console.error = collect;
  let q: QpdfInstance;
  try {
    q = await createQpdf({ locateFile: () => wasmUrl, print: collect, printErr: collect });
  } finally {
    console.log = original.log;
    console.error = original.error;
  }
  onEngineReady?.();

  q.FS.mkdir('/work');
  q.FS.writeFile(IN, bytes);
  // A password file avoids any command-line parsing of the password.
  q.FS.writeFile(PW, password);
  const pw = `--password-file=${PW}`;
  const run = (args: string[]) => {
    messages.length = 0;
    return q.callMain(args);
  };

  try {
    // 1) Does the supplied password open the file?
    //    --requires-password: 3 = encrypted and the password works; 2 = not
    //    encrypted, wrong password, or unreadable (disambiguated below).
    if (run([pw, '--requires-password', IN]) !== 3) {
      const fromMessages = classify(messages, '');
      if (fromMessages === 'incorrect_password' || fromMessages === 'unsupported_encryption') {
        return { ok: false, code: fromMessages };
      }
      // Readable without any password?
      const check = run(['--check', IN]);
      if (check === 0 || check === 3) {
        // Opens with no password: either unencrypted, or encrypted with an
        // empty open password (restrictions only) and the given password is wrong.
        return { ok: false, code: run(['--is-encrypted', IN]) === 0 ? 'incorrect_password' : 'not_encrypted' };
      }
      // Not readable without a password: needs one (so ours was wrong), or is damaged.
      if (run(['--requires-password', IN]) === 0) return { ok: false, code: 'incorrect_password' };
      return { ok: false, code: classify(messages, 'invalid_pdf') || 'invalid_pdf' };
    }

    // 2) Decrypt into a new, unprotected file.
    const rc = run([pw, '--decrypt', IN, OUT]);
    if (rc === 0 || rc === 3) {
      return { ok: true, bytes: q.FS.readFile(OUT), repaired: rc === 3 };
    }
    return { ok: false, code: classify(messages, 'invalid_pdf') || 'invalid_pdf' };
  } finally {
    for (const f of [IN, OUT, PW]) {
      try { q.FS.unlink(f); } catch { /* not created */ }
    }
  }
}

function classify(messages: string[], fallback: UnlockErrorCode | ''): UnlockErrorCode | '' {
  const text = messages.join('\n');
  if (/invalid password/i.test(text)) return 'incorrect_password';
  if (/unsupported encryption|unknown encryption|security handler/i.test(text)) return 'unsupported_encryption';
  if (text && fallback === '') return 'invalid_pdf';
  return fallback;
}
