import type { UnlockErrorCode } from '../engine/unlock-protocol';

/**
 * User-facing messages for the local (in-browser) unlock engine.
 * Messages never include file names, passwords or document content.
 */
export const REMOVE_ERROR_MESSAGES: Record<UnlockErrorCode, string> = {
  incorrect_password:
    'Incorrect password. Passwords are case-sensitive — please check it and try again.',
  not_encrypted: 'This PDF isn’t password-protected, so there is nothing to remove.',
  unsupported_encryption:
    'This PDF uses a type of protection this tool doesn’t support (for example certificate-based security).',
  invalid_pdf:
    'We couldn’t read this PDF. The file may be damaged or not a valid PDF.',
  too_large: 'This file is too large to process in the browser (limit: 100 MB).',
  out_of_memory:
    'Your browser ran out of memory while processing this PDF. Try closing other tabs or using a computer.',
  unsupported_browser:
    'Your browser can’t run the PDF engine. Please update it or try a recent version of Chrome, Edge, Firefox or Safari.',
  engine_load_failed:
    'The PDF engine couldn’t be loaded. Check your connection and reload the page.',
  cancelled: 'Cancelled.',
  unknown: 'Something went wrong. Please try again.',
};

export function removeErrorMessage(code: UnlockErrorCode): string {
  return REMOVE_ERROR_MESSAGES[code] ?? REMOVE_ERROR_MESSAGES.unknown;
}
