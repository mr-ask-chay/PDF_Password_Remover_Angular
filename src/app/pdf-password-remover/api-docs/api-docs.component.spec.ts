import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApiDocsComponent, signHmacRequest } from './api-docs.component';
import { ApiDocsService } from 'src/app/core/service/pdf-api-docs/api-docs.service';
import { PLATFORM_ID } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

describe('ApiDocsComponent', () => {
  let component: ApiDocsComponent;
  let fixture: ComponentFixture<ApiDocsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApiDocsComponent, HttpClientTestingModule],
      providers: [
        ApiDocsService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ApiDocsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize endpoints on ngOnInit', () => {
    expect(component.endpoints.length).toBeGreaterThan(0);
    expect(component.endpoints[0].id).toBe('remove-password');
  });

  it('should validate partner label - required', () => {
    component.partnerLabel = '';
    expect(component.partnerLabelError).toBe('Partner label is required.');
  });

  it('should validate partner label - lowercase only', () => {
    component.partnerLabel = 'TestLabel';
    expect(component.partnerLabelError).toBe('Use lowercase letters only.');
  });

  it('should validate partner label - format', () => {
    component.partnerLabel = 'test_label!';
    expect(component.partnerLabelError).toBe('1–16 chars; lowercase letters, digits, or hyphens only.');
  });

  it('should validate partner label - valid', () => {
    component.partnerLabel = 'test-label-123';
    expect(component.partnerLabelError).toBe('');
  });

  it('should disable create when busy', () => {
    component.busy = true;
    component.partnerLabel = 'valid-label';
    expect(component.canCreate).toBeFalse();
  });

  it('should enable create when valid and not busy', () => {
    component.busy = false;
    component.partnerLabel = 'valid-label';
    expect(component.canCreate).toBeTrue();
  });

  it('should set and check active tab', () => {
    component.setTab('test-id', 'res');
    expect(component.isActive('test-id', 'res')).toBeTrue();
    expect(component.isActive('test-id', 'req')).toBeFalse();
  });

  it('should set and check active code tab', () => {
    component.setCodeTab('test-id', 'Python');
    expect(component.isCodeTab('test-id', 'Python')).toBeTrue();
    expect(component.isCodeTab('test-id', 'Node.js')).toBeFalse();
  });

  it('should return active code tab label', () => {
    component.setCodeTab('test-id', 'Go');
    expect(component.activeCodeTabLabel('test-id')).toBe('Go');
  });

  it('should return active sample', () => {
    const endpoint = component.endpoints[0];
    component.setCodeTab(endpoint.id, 'Python');
    const sample = component.activeSample(endpoint);
    expect(sample).toContain('import');
  });

  it('should mask values correctly', () => {
    expect(component.mask('1234567890', 4, 4)).toBe('1234••••••••7890');
    expect(component.mask('short', 4, 4)).toBe('short');
    expect(component.mask('', 4, 4)).toBe('');
  });

  it('should handle create key success', async () => {
    const apiDocsService = TestBed.inject(ApiDocsService);
    spyOn(apiDocsService, 'createKey').and.returnValue(of({
      api_key: 'test-key-123',
      api_secret: 'test-secret-456',
      created_at: '2025-01-01T00:00:00Z',
      name: 'test-label',
      label: 'test-label'
    }));

    component.partnerLabel = 'test-label';
    await component.create();

    expect(component.storedKeys.length).toBeGreaterThan(0);
    expect(component.lastCreatedCopySection?.api_secret).toBe('test-secret-456'); // in memory, shown once
    expect(component.partnerLabel).toBe('');
    // The secret must never be persisted.
    expect(Object.keys(component.storedKeys[0])).not.toContain('api_secret');
    expect(localStorage.getItem('pdftools:keys') || '').not.toContain('test-secret-456');
  });

  it('purges API secrets saved by older versions from localStorage', () => {
    localStorage.setItem('pdftools:keys', JSON.stringify([
      { api_key: 'old-key', api_secret: 'old-secret', created_at: '2025-01-01', name: 'legacy' },
    ]));
    component.ngOnInit();
    expect(component.storedKeys).toEqual([{ api_key: 'old-key', name: 'legacy', created_at: '2025-01-01' }]);
    expect(localStorage.getItem('pdftools:keys')).not.toContain('old-secret');
  });

  it('drops malformed localStorage content safely', () => {
    localStorage.setItem('pdftools:keys', '{not json');
    component.ngOnInit();
    expect(component.storedKeys).toEqual([]);
  });

  it('forgets the in-memory secret when the page is left', () => {
    component.lastCreatedCopySection = { api_key: 'k', api_secret: 's', created_at: '', name: '' };
    component.ngOnDestroy();
    expect(component.lastCreatedCopySection).toBeUndefined();
  });

  it('should handle create key error', async () => {
    const apiDocsService = TestBed.inject(ApiDocsService);
    spyOn(apiDocsService, 'createKey').and.returnValue(
      throwError(() => ({ error: { error: 'Create failed' } }))
    );

    component.partnerLabel = 'test-label';
    await component.create();

    expect(component.error).toBe('Create failed');
  });

  it('should copy from copy section and hide after both copied', async () => {
    component.lastCreatedCopySection = {
      api_key: 'test-key',
      api_secret: 'test-secret',
      created_at: '2025-01-01',
      name: 'test'
    };

    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());

    await component.copyFromCopySection('api_key');
    expect(component.copied.api_key).toBeTrue();
    expect(component.lastCreatedCopySection).toBeTruthy();

    await component.copyFromCopySection('api_secret');
    expect(component.copied.api_secret).toBeTrue();
    expect(component.lastCreatedCopySection).toBeUndefined();
  });

  it('signs the delete request with the pasted secret and removes the key', async () => {
    const apiDocsService = TestBed.inject(ApiDocsService);
    const del = spyOn(apiDocsService, 'deleteKey').and.returnValue(of({ ok: true }));
    spyOn(globalThis as any, 'prompt').and.returnValue('test-secret');

    const testKey = { api_key: 'test-key', created_at: '2025-01-01', name: 'test' };
    component.storedKeys = [testKey];

    await component.confirmDelete(testKey);

    expect(del).toHaveBeenCalledOnceWith('test-key', jasmine.stringMatching(/^\d+$/), jasmine.stringMatching(/^[0-9a-f]{64}$/));
    expect(component.storedKeys.length).toBe(0);
  });

  it('does not delete when no secret is provided', async () => {
    const apiDocsService = TestBed.inject(ApiDocsService);
    const del = spyOn(apiDocsService, 'deleteKey');
    spyOn(globalThis as any, 'prompt').and.returnValue(null);

    const testKey = { api_key: 'test-key', created_at: '2025-01-01', name: 'test' };
    component.storedKeys = [testKey];

    await component.confirmDelete(testKey);

    expect(del).not.toHaveBeenCalled();
    expect(component.storedKeys.length).toBe(1);
  });

  it('signHmacRequest matches the backend HMAC scheme (known-answer vector)', async () => {
    // Computed independently with Node crypto and Python hmac (same scheme as app.sign_hmac).
    expect(await signHmacRequest('DELETE', '/api/keys/abc123', '1700000000', 'test-secret'))
      .toBe('620692431278df63c19003dd5de708fec0700c08170feefafc5b3d5934409daa');
  });

  it('never shows raw request URLs or exception text', async () => {
    const apiDocsService = TestBed.inject(ApiDocsService);
    spyOn(apiDocsService, 'createKey').and.returnValue(
      throwError(() => ({ status: 500, message: 'Http failure response for https://internal.example/api/key/generate: 500', error: { error: 'processing_error' } }))
    );
    component.partnerLabel = 'test-label';
    await component.create();
    expect(component.error).toBe('Create failed');
  });

  it('should handle delete key error', async () => {
    const apiDocsService = TestBed.inject(ApiDocsService);
    spyOn(apiDocsService, 'deleteKey').and.returnValue(
      throwError(() => ({ error: 'Delete failed' }))
    );
    spyOn(globalThis as any, 'prompt').and.returnValue('test-secret');

    const testKey = { api_key: 'test-key', created_at: '2025-01-01', name: 'test' };
    component.storedKeys = [testKey];

    await component.confirmDelete(testKey);

    expect(component.error).toBeTruthy();
  });

  it('should scroll to element', () => {
    const mockElement = document.createElement('div');
    mockElement.id = 'test-id';
    spyOn(document, 'getElementById').and.returnValue(mockElement);
    spyOn(mockElement, 'scrollIntoView');

    component.scrollTo('test-id');

    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start'
    });
  });

  it('should handle copy with clipboard API', async () => {
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());

    await component.copy('test-value');

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test-value');
  });

  it('should handle copy fallback without clipboard API', async () => {
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', { value: undefined, writable: true });

    spyOn(document, 'execCommand').and.returnValue(true);

    await component.copy('test-value');

    expect(document.execCommand).toHaveBeenCalledWith('copy');

    Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, writable: true });
  });
});
