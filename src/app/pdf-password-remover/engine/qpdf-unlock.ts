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

export type QpdfProtectResult =
  | { ok: true; bytes: Uint8Array; warnings: boolean }
  | { ok: false; code: 'invalid_pdf' | 'already_encrypted' | 'engine_error' };

export type QpdfCompressResult =
  | { ok: true; bytes: Uint8Array; reduced: boolean; warnings: boolean }
  | { ok: false; code: 'invalid_pdf' | 'already_encrypted' | 'engine_error' };

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

export async function protectWithQpdf(
  createQpdf: QpdfFactory,
  wasmUrl: string,
  bytes: Uint8Array,
  userPassword: string,
  ownerPassword: string
): Promise<QpdfProtectResult> {
  const messages: string[] = [];
  const collect = (...a: unknown[]) => { messages.push(a.join(' ')); };
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

  try {
    q.FS.mkdir('/work');
    q.FS.writeFile(IN, bytes);
    q.FS.writeFile(PW, userPassword);
    const run = (args: string[]) => {
      messages.length = 0;
      return q.callMain(args);
    };

    const inputCheck = run(['--check', IN]);
    if (inputCheck !== 0 && inputCheck !== 3) {
      return {
        ok: false,
        code: hasEncryptionKey(bytes) ? 'already_encrypted' : 'invalid_pdf',
      };
    }
    const encrypted = run(['--encrypt', userPassword, ownerPassword, '256', '--', IN, OUT]);
    if (encrypted !== 0 && encrypted !== 3) {
      return { ok: false, code: 'engine_error' };
    }
    const outputCheck = run([`--password-file=${PW}`, '--requires-password', OUT]);
    if (outputCheck !== 3) {
      return { ok: false, code: 'engine_error' };
    }
    return {
      ok: true,
      bytes: q.FS.readFile(OUT),
      warnings: inputCheck === 3 || encrypted === 3,
    };
  } finally {
    for (const file of [IN, OUT, PW]) {
      try { q.FS.unlink(file); } catch { /* not created */ }
    }
  }
}

export async function compressWithQpdf(
  createQpdf: QpdfFactory,
  wasmUrl: string,
  bytes: Uint8Array
): Promise<QpdfCompressResult> {
  if (hasEncryptionKey(bytes)) return { ok: false, code: 'already_encrypted' };

  const collect = (..._a: unknown[]): void => undefined;
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

  const inputPath = '/compress/in.pdf';
  const outputPath = '/compress/out.pdf';
  try {
    q.FS.mkdir('/compress');
    q.FS.writeFile(inputPath, bytes);
    const checkInput = q.callMain(['--check', inputPath]);
    if (checkInput !== 0 && checkInput !== 3) {
      return { ok: false, code: 'invalid_pdf' };
    }
    const compression = q.callMain([
      '--object-streams=generate',
      '--recompress-flate',
      '--compression-level=9',
      inputPath,
      outputPath,
    ]);
    if (compression !== 0 && compression !== 3) {
      return { ok: false, code: 'engine_error' };
    }
    const checkOutput = q.callMain(['--check', outputPath]);
    if (checkOutput !== 0 && checkOutput !== 3) {
      return { ok: false, code: 'engine_error' };
    }
    const compressed = q.FS.readFile(outputPath);
    const reduced = compressed.length < bytes.length;
    return {
      ok: true,
      bytes: reduced ? compressed : bytes.slice(),
      reduced,
      warnings: checkInput === 3 || compression === 3 || checkOutput === 3,
    };
  } finally {
    for (const path of [inputPath, outputPath]) {
      try { q.FS.unlink(path); } catch { /* not created */ }
    }
  }
}

function hasEncryptionKey(bytes: Uint8Array): boolean {
  const marker = [0x2f, 0x45, 0x6e, 0x63, 0x72, 0x79, 0x70, 0x74];
  for (let i = 0; i <= bytes.length - marker.length; i += 1) {
    if (marker.every((value, offset) => bytes[i + offset] === value)) {
      const next = bytes[i + marker.length];
      if (
        next === undefined ||
        next <= 0x20 ||
        [0x28, 0x29, 0x3c, 0x3e, 0x5b, 0x5d, 0x7b, 0x7d, 0x2f, 0x25].includes(next)
      ) {
        return true;
      }
    }
  }
  return false;
}

function classify(messages: string[], fallback: UnlockErrorCode | ''): UnlockErrorCode | '' {
  const text = messages.join('\n');
  if (/invalid password/i.test(text)) return 'incorrect_password';
  if (/unsupported encryption|unknown encryption|security handler/i.test(text)) return 'unsupported_encryption';
  if (text && fallback === '') return 'invalid_pdf';
  return fallback;
}
