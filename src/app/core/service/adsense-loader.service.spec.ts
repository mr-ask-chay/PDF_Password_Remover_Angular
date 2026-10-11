import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { AdsenseLoaderService } from './adsense-loader.service';

describe('AdsenseLoaderService', () => {
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdsenseLoaderService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    document = TestBed.inject(DOCUMENT);
    document.querySelectorAll('script[data-unclasp-adsense]').forEach((script) => script.remove());
  });

  it('does not add a third-party script when ads are disabled', () => {
    TestBed.inject(AdsenseLoaderService).load(false);
    expect(document.querySelector('script[data-unclasp-adsense]')).toBeNull();
  });

  it('loads the configured script only once when explicitly enabled', () => {
    const loader = TestBed.inject(AdsenseLoaderService);
    const appendSpy = spyOn(document.head, 'appendChild').and.callFake((node) => node);
    loader.load(true);
    loader.load(true);

    expect(appendSpy).toHaveBeenCalledTimes(1);
    const script = appendSpy.calls.argsFor(0)[0] as HTMLScriptElement;
    expect(script.src).toContain('ca-pub-7945845389175063');
  });
});
