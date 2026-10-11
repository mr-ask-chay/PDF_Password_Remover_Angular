import {
  classifyRemoveError,
  readErrorCode,
  REMOVE_ERROR_MESSAGES,
  removeErrorMessage,
} from './remove-password-errors';

describe('remove-password error mapping', () => {
  const jsonBlob = (obj: unknown) =>
    new Blob([JSON.stringify(obj)], { type: 'application/json' });

  describe('classifyRemoveError', () => {
    it('maps backend error codes produced by app.py', () => {
      expect(classifyRemoveError(400, 'Incorrect password')).toBe('incorrect_password');
      expect(classifyRemoveError(400, 'Only PDF files are supported')).toBe('not_pdf');
      expect(classifyRemoveError(400, 'Missing file or password')).toBe('missing_input');
      expect(classifyRemoveError(400, 'PDF too large')).toBe('too_many_pages');
      expect(classifyRemoveError(413, 'payload_too_large')).toBe('too_large');
      expect(classifyRemoveError(504, 'processing_timeout')).toBe('timeout');
      expect(classifyRemoveError(500, 'processing_error')).toBe('processing_failed');
      expect(classifyRemoveError(403, 'origin_not_allowed')).toBe('blocked');
      expect(classifyRemoveError(401, 'expired')).toBe('session');
    });

    it('falls back to HTTP status when no code is available', () => {
      expect(classifyRemoveError(0)).toBe('network');
      expect(classifyRemoveError(413)).toBe('too_large');
      expect(classifyRemoveError(429)).toBe('rate_limited');
      expect(classifyRemoveError(502)).toBe('server_unavailable');
      expect(classifyRemoveError(503)).toBe('server_unavailable');
      expect(classifyRemoveError(504)).toBe('timeout');
    });

    it('never labels unknown failures as an incorrect password', () => {
      expect(classifyRemoveError(400, 'something new')).toBe('unknown');
      expect(classifyRemoveError(500)).toBe('unknown');
      expect(classifyRemoveError(undefined)).toBe('unknown');
    });
  });

  it('messages never contain raw backend text', () => {
    const all = Object.values(REMOVE_ERROR_MESSAGES).join(' ');
    expect(all).not.toContain('EOF marker');
    expect(all).not.toContain('processing_error');
    expect(removeErrorMessage('unknown')).toBe('Something went wrong. Please try again.');
  });

  describe('readErrorCode', () => {
    it('reads the error field from a JSON blob body', async () => {
      expect(await readErrorCode({ error: jsonBlob({ error: 'Incorrect password' }) }))
        .toBe('Incorrect password');
    });

    it('ignores non-JSON blob bodies', async () => {
      const html = new Blob(['<html>502 Bad Gateway</html>'], { type: 'text/html' });
      expect(await readErrorCode({ error: html })).toBeNull();
    });

    it('reads an already-parsed JSON body and the X-Error-Reason header', async () => {
      expect(await readErrorCode({ error: { error: 'expired' } })).toBe('expired');
      expect(await readErrorCode({ headers: { get: () => 'bad_token' } })).toBe('bad_token');
    });

    it('returns null when nothing usable is present', async () => {
      expect(await readErrorCode(new Error('boom'))).toBeNull();
      expect(await readErrorCode(undefined)).toBeNull();
    });
  });
});
