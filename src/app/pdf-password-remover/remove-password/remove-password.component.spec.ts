import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RemovePasswordComponent, STATUS_DONE } from './remove-password.component';
import { PdfUnlockService, UnlockOptions } from '../engine/pdf-unlock.service';
import type { UnlockOutcome } from '../engine/unlock-protocol';
import { REMOVE_ERROR_MESSAGES } from './remove-password-errors';

describe('RemovePasswordComponent', () => {
  const TEST_PASSWORD_FIXTURE = 'test-fixture-pwd-123';

  let component: RemovePasswordComponent;
  let fixture: ComponentFixture<RemovePasswordComponent>;
  let unlocker: jasmine.SpyObj<PdfUnlockService>;

  const fileInput = (name = 'test.pdf', type = 'application/pdf') => {
    const input = document.createElement('input');
    input.type = 'file';
    const dt = new DataTransfer();
    dt.items.add(new File(['%PDF-1.7'], name, { type }));
    input.files = dt.files;
    return input;
  };

  beforeEach(async () => {
    unlocker = jasmine.createSpyObj('PdfUnlockService', ['unlock']);
    await TestBed.configureTestingModule({
      imports: [RemovePasswordComponent, NoopAnimationsModule],
      providers: [
        { provide: PdfUnlockService, useValue: unlocker },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RemovePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalse();
    component.toggleShowPassword();
    expect(component.showPassword).toBeTrue();
    component.toggleShowPassword();
    expect(component.showPassword).toBeFalse();
  });

  describe('validation (no engine call)', () => {
    it('requires a file', async () => {
      const input = document.createElement('input');
      input.type = 'file';
      await component.onSubmit(input);
      expect(component.status).toBe('Please choose a PDF and enter password.');
      expect(unlocker.unlock).not.toHaveBeenCalled();
    });

    it('requires a password', async () => {
      component.password = '';
      await component.onSubmit(fileInput());
      expect(component.status).toBe('Please choose a PDF and enter password.');
      expect(unlocker.unlock).not.toHaveBeenCalled();
    });

    it('rejects non-PDF files', async () => {
      component.password = TEST_PASSWORD_FIXTURE;
      await component.onSubmit(fileInput('test.txt', 'text/plain'));
      expect(component.status).toBe('Only PDF files are supported.');
      expect(unlocker.unlock).not.toHaveBeenCalled();
    });
  });

  describe('local unlock', () => {
    it('passes the selected file and password to the local engine only', async () => {
      unlocker.unlock.and.resolveTo({ ok: false, code: 'incorrect_password' });
      component.password = TEST_PASSWORD_FIXTURE;
      const input = fileInput();
      await component.onSubmit(input);
      expect(unlocker.unlock).toHaveBeenCalledOnceWith(input.files![0], TEST_PASSWORD_FIXTURE, jasmine.any(Object));
    });

    it('offers a download only after success and clears the password', async () => {
      unlocker.unlock.and.resolveTo({ ok: true, bytes: new Uint8Array([37, 80, 68, 70]), repaired: false });
      component.password = TEST_PASSWORD_FIXTURE;
      await component.onSubmit(fileInput());
      expect(component.status).toBe(STATUS_DONE);
      expect(component.downloadHref).toMatch(/^blob:/);
      expect(component.password).toBe('');
      expect(component.loading).toBeFalse();
    });

    it('mentions repairs when qpdf had to fix the file', async () => {
      unlocker.unlock.and.resolveTo({ ok: true, bytes: new Uint8Array([1]), repaired: true });
      component.password = TEST_PASSWORD_FIXTURE;
      await component.onSubmit(fileInput());
      expect(component.status.startsWith(STATUS_DONE)).toBeTrue();
      expect(component.status).toContain('repaired');
    });

    for (const code of ['incorrect_password', 'not_encrypted', 'unsupported_encryption', 'invalid_pdf', 'too_large', 'out_of_memory', 'unsupported_browser', 'engine_load_failed'] as const) {
      it(`shows a friendly message and no download for "${code}"`, async () => {
        unlocker.unlock.and.resolveTo({ ok: false, code });
        component.password = TEST_PASSWORD_FIXTURE;
        await component.onSubmit(fileInput());
        expect(component.status).toBe(REMOVE_ERROR_MESSAGES[code]);
        expect(component.downloadHref).toBeNull();
        expect(component.password).toBe(TEST_PASSWORD_FIXTURE); // kept so the user can correct it
      });
    }

    it('reports progress stages in the status region', async () => {
      const seen: string[] = [];
      unlocker.unlock.and.callFake(async (_f: Blob, _p: string, opts: UnlockOptions = {}) => {
        opts.onProgress?.('loading-engine'); seen.push(component.status);
        opts.onProgress?.('unlocking'); seen.push(component.status);
        return { ok: false, code: 'incorrect_password' } as UnlockOutcome;
      });
      component.password = TEST_PASSWORD_FIXTURE;
      await component.onSubmit(fileInput());
      expect(seen).toEqual(['Loading the PDF engine…', 'Unlocking in your browser…']);
    });
  });

  describe('cancellation', () => {
    it('cancel() aborts the running job', async () => {
      let signal: AbortSignal | undefined;
      unlocker.unlock.and.callFake((_f: Blob, _p: string, opts: UnlockOptions = {}) => {
        signal = opts.signal;
        return new Promise<UnlockOutcome>((resolve) =>
          opts.signal!.addEventListener('abort', () => resolve({ ok: false, code: 'cancelled' })));
      });
      component.password = TEST_PASSWORD_FIXTURE;
      const run = component.onSubmit(fileInput());
      expect(component.loading).toBeTrue();
      component.cancel();
      await run;
      expect(signal!.aborted).toBeTrue();
      expect(component.status).toBe('Cancelled.');
      expect(component.loading).toBeFalse();
      expect(component.downloadHref).toBeNull();
    });

    it('destroying the component aborts a running job', () => {
      let signal: AbortSignal | undefined;
      unlocker.unlock.and.callFake((_f: Blob, _p: string, opts: UnlockOptions = {}) => {
        signal = opts.signal;
        return new Promise<UnlockOutcome>(() => { /* never settles */ });
      });
      component.password = TEST_PASSWORD_FIXTURE;
      component.onSubmit(fileInput());
      fixture.destroy();
      expect(signal!.aborted).toBeTrue();
    });

    it('ignores a second submit while a job is running', async () => {
      unlocker.unlock.and.returnValue(new Promise<UnlockOutcome>(() => { /* pending */ }));
      component.password = TEST_PASSWORD_FIXTURE;
      component.onSubmit(fileInput());
      await component.onSubmit(fileInput());
      expect(unlocker.unlock).toHaveBeenCalledTimes(1);
    });
  });

  describe('object URL cleanup', () => {
    let revokeSpy: jasmine.Spy;

    beforeEach(() => {
      let n = 0;
      spyOn(URL, 'createObjectURL').and.callFake(() => `blob:test-${++n}`);
      revokeSpy = spyOn(URL, 'revokeObjectURL');
      unlocker.unlock.and.resolveTo({ ok: true, bytes: new Uint8Array([1]), repaired: false });
    });

    it('keeps the current URL valid until the next submission', async () => {
      component.password = TEST_PASSWORD_FIXTURE;
      await component.onSubmit(fileInput());
      expect(component.downloadHref).toBe('blob:test-1');
      expect(revokeSpy).not.toHaveBeenCalled();

      component.password = TEST_PASSWORD_FIXTURE;
      await component.onSubmit(fileInput());
      expect(revokeSpy).toHaveBeenCalledOnceWith('blob:test-1');
      expect(component.downloadHref).toBe('blob:test-2');
    });

    it('revokes the remaining URL when the component is destroyed', async () => {
      component.password = TEST_PASSWORD_FIXTURE;
      await component.onSubmit(fileInput());
      fixture.destroy();
      expect(revokeSpy).toHaveBeenCalledOnceWith('blob:test-1');
    });
  });

  it('announces status changes through a polite live region', () => {
    const region: HTMLElement = fixture.nativeElement.querySelector('[role="status"]');
    expect(region).toBeTruthy();
    expect(region.getAttribute('aria-live')).toBe('polite');
  });

  it('shows a keyboard-accessible Cancel button while processing', () => {
    unlocker.unlock.and.returnValue(new Promise<UnlockOutcome>(() => { /* pending */ }));
    component.password = TEST_PASSWORD_FIXTURE;
    component.onSubmit(fileInput());
    fixture.detectChanges();
    const cancel = (fixture.nativeElement as HTMLElement).querySelector('.spinner-overlay button') as HTMLButtonElement;
    expect(cancel?.textContent?.trim()).toBe('Cancel');
    expect(cancel.type).toBe('button');
  });
});
