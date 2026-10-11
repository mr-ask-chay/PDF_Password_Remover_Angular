import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { environment } from '../../../environments/environment';

const ADSENSE_CLIENT_ID = 'ca-pub-7945845389175063';
const ADSENSE_SCRIPT_URL =
  `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;

@Injectable({ providedIn: 'root' })
export class AdsenseLoaderService {
  private loaded = false;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  load(enabled = environment.enableAds): void {
    if (!enabled || !isPlatformBrowser(this.platformId) || this.loaded) return;

    const script = this.document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = ADSENSE_SCRIPT_URL;
    script.dataset['unclaspAdsense'] = 'true';
    this.document.head.appendChild(script);
    this.loaded = true;
  }
}
