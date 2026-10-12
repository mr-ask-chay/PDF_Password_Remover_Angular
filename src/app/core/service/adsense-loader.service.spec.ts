import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AdsenseLoaderService } from './adsense-loader.service';

describe('AdsenseLoaderService', () => {
  let document: Document;
  let originalProduction: boolean;
  let originalEnableAds: boolean;

  beforeEach(() => {
    originalProduction = environment.production;
    originalEnableAds = environment.enableAds;
    environment.production = false;
    environment.enableAds = false;
    TestBed.configureTestingModule({
      providers: [
        AdsenseLoaderService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    document = TestBed.inject(DOCUMENT);
    document.querySelectorAll('script[data-unclasp-adsense]').forEach((script) => script.remove());
  });

  afterEach(() => {
    environment.production = originalProduction;
    environment.enableAds = originalEnableAds;
  });

  it('does not add a third-party script when ads are disabled', () => {
    TestBed.inject(AdsenseLoaderService).load();
    expect(document.querySelector('script[data-unclasp-adsense]')).toBeNull();
  });

  it('does not load ads in development even if the ad flag is enabled', () => {
    environment.enableAds = true;
    TestBed.inject(AdsenseLoaderService).load();
    expect(document.querySelector('script[data-unclasp-adsense]')).toBeNull();
  });

  it('loads the configured script only once when enabled in production', () => {
    environment.production = true;
    environment.enableAds = true;
    const loader = TestBed.inject(AdsenseLoaderService);
    const appendSpy = spyOn(document.head, 'appendChild').and.callFake((node) => node);
    loader.load();
    loader.load();

    expect(appendSpy).toHaveBeenCalledTimes(1);
    const script = appendSpy.calls.argsFor(0)[0] as HTMLScriptElement;
    expect(script.src).toContain('ca-pub-7945845389175063');
  });
});
