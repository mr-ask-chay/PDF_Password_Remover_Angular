import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RemovePasswordComponent } from './remove-password.component';
import { TokenService } from '../../core/token.service';
import { PdfBackendService } from 'src/app/core/service/pdf_backend_service/pdfBackend.service';
import { throwError, of } from 'rxjs';
import { PLATFORM_ID } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { REMOVE_ERROR_MESSAGES } from './remove-password-errors';

describe('RemovePasswordComponent', () => {
  const TEST_PASSWORD_FIXTURE = 'test-fixture-pwd-123';

  let component: RemovePasswordComponent;
  let fixture: ComponentFixture<RemovePasswordComponent>;
  let tokenService: jasmine.SpyObj<TokenService>;
  let pdfBackendService: jasmine.SpyObj<PdfBackendService>;


  beforeEach(async () => {
    const mockTokenService = jasmine.createSpyObj('TokenService', ['getReqToken']);
    const mockPdfBackendService = jasmine.createSpyObj('PdfBackendService', ['removePassword']);

    await TestBed.configureTestingModule({
      imports: [RemovePasswordComponent, NoopAnimationsModule],
      providers: [
        { provide: TokenService, useValue: mockTokenService },
        { provide: PdfBackendService, useValue: mockPdfBackendService },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    tokenService = TestBed.inject(TokenService) as jasmine.SpyObj<TokenService>;
    pdfBackendService = TestBed.inject(PdfBackendService) as jasmine.SpyObj<PdfBackendService>;


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

  it('should show error when no file is selected', () => {
    const mockInput = document.createElement('input');
    mockInput.type = 'file';

    component.onSubmit(mockInput);

    expect(component.status).toBe('Please choose a PDF and enter password.');
  });

  it('should show error when no password is entered', () => {
    const mockInput = document.createElement('input');
    mockInput.type = 'file';
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    mockInput.files = dataTransfer.files;

    component.password = '';
    component.onSubmit(mockInput);

    expect(component.status).toBe('Please choose a PDF and enter password.');
  });

  it('should show error for non-PDF files', () => {
    const mockInput = document.createElement('input');
    mockInput.type = 'file';
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    mockInput.files = dataTransfer.files;

    component.password = TEST_PASSWORD_FIXTURE;
    component.onSubmit(mockInput);

    expect(component.status).toBe('Only PDF files are supported.');
  });

  it('should handle token service error', (done) => {
    const mockInput = document.createElement('input');
    mockInput.type = 'file';
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    mockInput.files = dataTransfer.files;

    component.password = TEST_PASSWORD_FIXTURE;

    tokenService.getReqToken.and.returnValue(
      throwError(() => ({ status: 0, error: new ProgressEvent('error') }))
    );

    component.onSubmit(mockInput);

    setTimeout(() => {
      expect(component.loading).toBeFalse();
      expect(component.status).toBe(REMOVE_ERROR_MESSAGES.network);
      done();
    }, 100);
  });

  it('should handle successful PDF processing', (done) => {
    const mockInput = document.createElement('input');
    mockInput.type = 'file';
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    mockInput.files = dataTransfer.files;

    component.password = TEST_PASSWORD_FIXTURE;

    const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
    tokenService.getReqToken.and.returnValue(of({ req_token: 'test-token' }));
    pdfBackendService.removePassword.and.returnValue(of(mockBlob));

    component.onSubmit(mockInput);

    setTimeout(() => {
      expect(component.loading).toBeFalse();
      expect(component.status).toBe('Done! Click to download.');
      expect(component.downloadHref).toBeTruthy();
      done();
    }, 100);
  });

  it('should handle PDF processing error with retry', (done) => {
    const mockInput = document.createElement('input');
    mockInput.type = 'file';
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    mockInput.files = dataTransfer.files;

    component.password = TEST_PASSWORD_FIXTURE;

    tokenService.getReqToken.and.returnValue(of({ req_token: 'test-token' }));
    pdfBackendService.removePassword.and.returnValue(
      throwError(() => ({ headers: { get: () => 'bad_token' } }))
    );

    component.onSubmit(mockInput);

    setTimeout(() => {
      expect(tokenService.getReqToken).toHaveBeenCalledTimes(2); // Initial + retry
      done();
    }, 200);
  });

  it('should handle unexpected response type', (done) => {
    const mockInput = document.createElement('input');
    mockInput.type = 'file';
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    mockInput.files = dataTransfer.files;

    component.password = TEST_PASSWORD_FIXTURE;

    tokenService.getReqToken.and.returnValue(of({ req_token: 'test-token' }));
    pdfBackendService.removePassword.and.returnValue(of('not a blob' as any));

    component.onSubmit(mockInput);

    setTimeout(() => {
      expect(component.status).toBe('Unexpected response.');
      done();
    }, 100);
  });

  it('should handle error with blob payload', (done) => {
    const mockInput = document.createElement('input');
    mockInput.type = 'file';
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    mockInput.files = dataTransfer.files;

    component.password = TEST_PASSWORD_FIXTURE;

    const errorBlob = new Blob([JSON.stringify({ error: 'Test error' })], { type: 'application/json' });
    tokenService.getReqToken.and.returnValue(of({ req_token: 'test-token' }));
    pdfBackendService.removePassword.and.returnValue(
      throwError(() => ({ status: 400, error: errorBlob }))
    );

    component.onSubmit(mockInput);

    setTimeout(() => {
      expect(component.loading).toBeFalse();
      // Unknown backend codes get the generic message, never the raw text.
      expect(component.status).toBe(REMOVE_ERROR_MESSAGES.unknown);
      expect(component.status).not.toContain('Test error');
      done();
    }, 200);
  });

  describe('safe error messages', () => {
    const pdfInput = () => {
      const input = document.createElement('input');
      input.type = 'file';
      const dt = new DataTransfer();
      dt.items.add(new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' }));
      input.files = dt.files;
      return input;
    };
    const failWith = (status: number, body: object) => {
      tokenService.getReqToken.and.returnValue(of({ req_token: 'test-token' }));
      pdfBackendService.removePassword.and.returnValue(
        throwError(() => ({
          status,
          error: new Blob([JSON.stringify(body)], { type: 'application/json' }),
        }))
      );
    };

    it('maps "Incorrect password" to a friendly message', (done) => {
      failWith(400, { error: 'Incorrect password' });
      component.password = TEST_PASSWORD_FIXTURE;
      component.onSubmit(pdfInput());
      setTimeout(() => {
        expect(component.status).toBe(REMOVE_ERROR_MESSAGES.incorrect_password);
        done();
      }, 100);
    });

    it('never shows raw exception text from a 500 response', (done) => {
      failWith(500, { error: 'processing_error', message: 'EOF marker not found' });
      component.password = TEST_PASSWORD_FIXTURE;
      component.onSubmit(pdfInput());
      setTimeout(() => {
        expect(component.status).toBe(REMOVE_ERROR_MESSAGES.processing_failed);
        expect(component.status).not.toContain('EOF');
        done();
      }, 100);
    });
  });

  describe('object URL cleanup', () => {
    let createSpy: jasmine.Spy;
    let revokeSpy: jasmine.Spy;

    beforeEach(() => {
      let n = 0;
      createSpy = spyOn(URL, 'createObjectURL').and.callFake(() => `blob:test-${++n}`);
      revokeSpy = spyOn(URL, 'revokeObjectURL');
      tokenService.getReqToken.and.returnValue(of({ req_token: 'test-token' }));
      pdfBackendService.removePassword.and.returnValue(of(new Blob(['%PDF'], { type: 'application/pdf' })));
      component.password = TEST_PASSWORD_FIXTURE;
    });

    const submit = () => {
      const input = document.createElement('input');
      input.type = 'file';
      const dt = new DataTransfer();
      dt.items.add(new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' }));
      input.files = dt.files;
      component.onSubmit(input);
    };

    it('keeps the current URL valid until the next submission', () => {
      submit();
      expect(component.downloadHref).toBe('blob:test-1');
      expect(revokeSpy).not.toHaveBeenCalled();

      submit();
      expect(revokeSpy).toHaveBeenCalledOnceWith('blob:test-1');
      expect(component.downloadHref).toBe('blob:test-2');
      expect(createSpy).toHaveBeenCalledTimes(2);
    });

    it('revokes the remaining URL when the component is destroyed', () => {
      submit();
      fixture.destroy();
      expect(revokeSpy).toHaveBeenCalledOnceWith('blob:test-1');
    });
  });

  it('announces status changes through a polite live region', () => {
    const region: HTMLElement = fixture.nativeElement.querySelector('[role="status"]');
    expect(region).toBeTruthy();
    expect(region.getAttribute('aria-live')).toBe('polite');
  });
});
