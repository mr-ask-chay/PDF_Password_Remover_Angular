import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { appConfig } from './app.config';

/** Browser-only providers, layered on the shared appConfig (mirrors app.config.server.ts). */
const browserConfig: ApplicationConfig = {
  providers: [
    // Angular Material components rely on the animations module in the browser.
    provideAnimations(),
  ],
};

export const config = mergeApplicationConfig(appConfig, browserConfig);
