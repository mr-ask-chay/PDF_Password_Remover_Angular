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
        'How the PDF Password Remover handles your files and passwords: the website tool works in your browser, the developer API on our server, plus browser storage, Google Fonts and AdSense.',
    },
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./pdf-password-remover/terms/terms.component').then(
        (m) => m.TermsComponent
      ),
    title: 'Terms of Use — PDF Password Remover',
    data: {
      description:
        'Terms for using the free PDF Password Remover and its developer API: permitted use, processing limits, availability and liability.',
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
        'Remove the open password from a PDF when you know the password — in your browser, without uploading the file. Free, no account needed.',
    },
  },
  {
    path: 'pdf-tools',
    loadComponent: () =>
      import('./pdf-tools/pdf-tools.component').then((m) => m.PdfToolsComponent),
    title: 'Free PDF Tools — Merge, Split, Rotate & Edit Pages Locally',
    data: {
      description:
        'Merge and split PDFs, edit pages, convert images, render PDF pages to JPG, extract selectable text to Markdown, and compare PDF text locally in your browser.',
    },
  },
  {
    path: '',
    loadComponent: () =>
      import('./feature/landing/landing.component').then(
        (m) => m.LandingComponent
      ),
    title: 'Unclasp — Browser-First PDF Tools and Password Remover',
    data: {
      description:
        'Unclasp is a browser-first PDF toolkit for unlocking, editing, and converting supported documents locally. A separate developer API processes PDFs on its server.',
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
