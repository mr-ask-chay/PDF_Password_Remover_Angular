import { REMOVE_ERROR_MESSAGES, removeErrorMessage } from './remove-password-errors';
import type { UnlockErrorCode } from '../engine/unlock-protocol';

describe('remove-password error messages (local engine)', () => {
  const codes: UnlockErrorCode[] = [
    'incorrect_password', 'not_encrypted', 'unsupported_encryption', 'invalid_pdf', 'too_large',
    'out_of_memory', 'unsupported_browser', 'engine_load_failed', 'cancelled', 'unknown',
  ];

  it('has a message for every engine error code', () => {
    for (const c of codes) expect(removeErrorMessage(c)).withContext(c).toBeTruthy();
  });

  it('only the incorrect-password code mentions an incorrect password', () => {
    for (const c of codes.filter((x) => x !== 'incorrect_password')) {
      expect(REMOVE_ERROR_MESSAGES[c]).withContext(c).not.toMatch(/incorrect password/i);
    }
  });

  it('never promises a server or upload fallback', () => {
    const all = Object.values(REMOVE_ERROR_MESSAGES).join(' ');
    expect(all).not.toMatch(/upload|server/i);
  });

  it('falls back to the generic message for unexpected codes', () => {
    expect(removeErrorMessage('nonsense' as UnlockErrorCode)).toBe(REMOVE_ERROR_MESSAGES.unknown);
  });
});
