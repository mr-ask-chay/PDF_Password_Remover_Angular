/**
 * Maps backend/network failures to safe, user-facing messages.
 *
 * Only error codes and HTTP statuses that the Flask backend actually produces
 * (see PDF_Password_Remover_Flask/app.py) are matched. Raw server text is
 * never shown to the user.
 */
export type RemoveErrorKind =
  | 'incorrect_password'
  | 'not_pdf'
  | 'missing_input'
  | 'too_many_pages'
  | 'too_large'
  | 'rate_limited'
  | 'timeout'
  | 'processing_failed'
  | 'session'
  | 'blocked'
  | 'server_unavailable'
  | 'network'
  | 'unknown';

export const REMOVE_ERROR_MESSAGES: Record<RemoveErrorKind, string> = {
  incorrect_password:
    'Incorrect password. Passwords are case-sensitive — please check it and try again.',
  not_pdf: 'This file is not a PDF. Please choose a .pdf file.',
  missing_input: 'Please choose a PDF and enter its password.',
  too_many_pages: 'This PDF has too many pages to process here.',
  too_large: 'This file is too large to process. Please try a smaller PDF.',
  rate_limited: 'Too many requests. Please wait a moment and try again.',
  timeout:
    'Processing took too long and was stopped. Please try again, or try a smaller PDF.',
  processing_failed:
    'We couldn’t unlock this PDF. The file may be damaged or use a format we don’t support yet.',
  session: 'Your session expired. Please try again.',
  blocked: 'This request was blocked. Please reload the page and try again.',
  server_unavailable:
    'The processing server is starting up or temporarily unavailable. Please try again in a few seconds.',
  network:
    'Couldn’t reach the processing server. Check your connection and try again.',
  unknown: 'Something went wrong. Please try again.',
};

/** Request-token failures that warrant one automatic retry with a fresh token. */
export const RETRYABLE_TOKEN_CODES = ['bad_token', 'expired', 'replayed', 'ip_mismatch'];

const CODE_MAP: Record<string, RemoveErrorKind> = {
  'incorrect password': 'incorrect_password',
  'only pdf files are supported': 'not_pdf',
  'missing file or password': 'missing_input',
  'pdf too large': 'too_many_pages',
  payload_too_large: 'too_large',
  processing_timeout: 'timeout',
  daily_quota_exceeded: 'rate_limited',
  processing_error: 'processing_failed',
  origin_not_allowed: 'blocked',
  bad_token: 'session',
  expired: 'session',
  replayed: 'session',
  ip_mismatch: 'session',
};

/**
 * @param status HTTP status (0 = network failure / CORS; undefined = non-HTTP error)
 * @param code   backend `error` field, if one could be read
 */
export function classifyRemoveError(
  status: number | undefined,
  code?: string | null
): RemoveErrorKind {
  const known = code ? CODE_MAP[code.trim().toLowerCase()] : undefined;
  if (known) return known;

  switch (status) {
    case 0:
      return 'network';
    case 413:
      return 'too_large';
    case 429:
      return 'rate_limited';
    case 502:
    case 503:
      return 'server_unavailable';
    case 504:
      return 'timeout';
    default:
      return 'unknown';
  }
}

export function removeErrorMessage(kind: RemoveErrorKind): string {
  return REMOVE_ERROR_MESSAGES[kind];
}

/**
 * Extracts the backend `error` code from an HttpErrorResponse-like object.
 * The response body may be a Blob (responseType: 'blob'), parsed JSON or text.
 */
export async function readErrorCode(err: any): Promise<string | null> {
  try {
    const hdr = err?.headers?.get?.('X-Error-Reason');
    if (typeof hdr === 'string' && hdr) return hdr;

    const payload = err?.error;
    if (typeof Blob !== 'undefined' && payload instanceof Blob) {
      if (!(payload.type || '').includes('application/json')) return null;
      const obj = await new Response(payload).json().catch(() => null);
      return typeof obj?.error === 'string' ? obj.error : null;
    }
    if (payload && typeof payload === 'object' && typeof payload.error === 'string') {
      return payload.error;
    }
  } catch {
    /* fall through */
  }
  return null;
}
