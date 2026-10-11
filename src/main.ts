import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.browser';

// Uses the same providers as the server/prerender (appConfig) so that routing,
// SEO metadata, scrolling, HTTP and hydration behave identically in the browser.
bootstrapApplication(AppComponent, config).catch((err) => console.error(err));
