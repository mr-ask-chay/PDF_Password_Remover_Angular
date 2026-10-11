import { ApplicationConfig } from '@angular/core';
import {
  provideRouter,
  TitleStrategy,
  withInMemoryScrolling,
} from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { SeoTitleStrategy } from './core/seo/seo-title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      })
    ),
    { provide: TitleStrategy, useClass: SeoTitleStrategy },
    // Reuse the prerendered DOM instead of re-rendering it (no flash / layout shift).
    // Event replay is intentionally not enabled: it injects inline scripts that
    // the production CSP (script-src without 'unsafe-inline') blocks.
    provideClientHydration(),
    provideHttpClient(withFetch())
  ],
};
