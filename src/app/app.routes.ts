import { Routes } from '@angular/router';

/**
 * SEO: `title` → <title>, `data.description` → meta description,
 * `data.index: false` → noindex + no canonical (see SeoTitleStrategy).
 * Keep src/sitemap.xml in sync with the indexable routes below.
 */
export const routes: Routes = [
  {
    path: 'docs',
    loadComponent: () =>
      import('./pdf-password-remover/api-docs/api-docs.component').then(
        (m) => m.ApiDocsComponent
      ),
    title: 'PDF Password Removal API — Developer Docs',
    data: {
      description:
        'Developer reference for the PDF password removal API: HMAC-SHA256 request signing, rate limits, error responses, and ready-to-run Python, Node.js and Go examples.',
    },
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./pdf-password-remover/privacy/privacy.component').then(
        (m) => m.PrivacyComponent
      ),
    title: 'Privacy Policy — PDF Password Remover',
    data: {
      description:
        'How the PDF Password Remover handles your files and passwords, what is deleted after processing, and how advertising cookies are used on this site.',
    },
  },
  {
    path: 'pdf-password-remover',
    loadComponent: () =>
      import('./pdf-password-remover/remover-page/remover-page.component').then(
        (m) => m.RemoverPageComponent
      ),
    title: 'Remove Password from PDF — Free Online PDF Unlocker',
    data: {
      description:
        'Remove the open password from a PDF when you know the password. Upload the file, enter its password and download an unlocked copy. Free, no account needed.',
    },
  },
  {
    path: '',
    loadComponent: () =>
      import('./feature/landing/landing.component').then(
        (m) => m.LandingComponent
      ),
    title: 'PDF Password Remover & Developer Tools — Free, No Sign-up',
    data: {
      description:
        'Unlock a password-protected PDF you have the password for, free and without an account. Plus a PDF unlock API for developers and open-source developer tools.',
    },
  },
  {
    // Placeholder ("Coming soon") — kept reachable but not indexed until the tool exists.
    path: 'image/select-image',
    loadComponent: () =>
      import('./image-compressor/select-image/select-image.component').then(
        (m) => m.SelectImageComponent
      ),
    title: 'Image Compressor — Coming Soon',
    data: {
      description: 'An in-browser image compressor is in development.',
      index: false,
    },
  },
  {
    path: '**',
    loadComponent: () =>
      import('./feature/page-not-found/page-not-found.component').then(
        (m) => m.PageNotFoundComponent
      ),
    title: 'Page Not Found',
    data: {
      description: 'Sorry, the page you’re looking for doesn’t exist.',
      index: false,
    },
  },
];
