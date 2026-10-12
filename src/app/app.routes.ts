import { Routes } from '@angular/router';

/**
 * SEO: `title` → <title>, `data.description` → meta description,
 * `data.index: false` → noindex + no canonical (see SeoTitleStrategy).
 * Keep src/sitemap.xml in sync with the indexable routes below.
 */
export const routes: Routes = [
  {
    path: 'about',
    loadComponent: () =>
      import('./feature/about/about.component').then((m) => m.AboutComponent),
    title: 'About Sai Krishna Chaitanya | Unclasp',
    data: {
      description:
        'Meet Sai Krishna Chaitanya, the developer behind Unclasp PDF tools and independent workflow utilities. Read how features are described and tested.',
    },
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./feature/contact/contact.component').then(
        (m) => m.ContactComponent
      ),
    title: 'Contact Unclasp | PDF Tools Support',
    data: {
      description:
        'Contact Sai Krishna Chaitanya about Unclasp PDF tools, accessibility, privacy, or a problem with a supported feature.',
    },
  },
  {
    path: 'docs',
    loadComponent: () =>
      import('./pdf-password-remover/api-docs/api-docs.component').then(
        (m) => m.ApiDocsComponent
      ),
    title: 'PDF Password API Docs — HMAC Examples | Unclasp',
    data: {
      description:
        'HMAC-SHA256 PDF password API documentation with rate limits, errors, and Python, Node.js, and Go examples. API files are processed on the server.',
    },
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./pdf-password-remover/privacy/privacy.component').then(
        (m) => m.PrivacyComponent
      ),
    title: 'Privacy Policy | Unclasp PDF Tools',
    data: {
      description:
        'Privacy details for Unclasp: browser-side PDF tools, server-processed API uploads, local storage, Google Fonts, and AdSense.',
    },
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./pdf-password-remover/terms/terms.component').then(
        (m) => m.TermsComponent
      ),
    title: 'Terms of Use | Unclasp PDF Tools',
    data: {
      description:
        'Read the terms for Unclasp PDF tools and the developer API, including permitted use, file limits, availability, and liability.',
    },
  },
  {
    path: 'pdf-password-remover',
    loadComponent: () =>
      import('./pdf-password-remover/remover-page/remover-page.component').then(
        (m) => m.RemoverPageComponent
      ),
    title: 'Remove PDF Password — Free Browser Tool | Unclasp',
    data: {
      description:
        'Unlock a PDF when you know its current password. Processing runs in your browser; no password recovery or account is required.',
    },
  },
  {
    path: 'pdf-tools',
    loadComponent: () =>
      import('./pdf-tools/pdf-tools-page.component').then(
        (m) => m.PdfToolsPageComponent
      ),
    title: 'Free PDF Tools: Merge, Split & Edit | Unclasp',
    data: {
      description:
        'Merge, split, rotate, crop, protect, compress, and convert supported PDFs in your browser. Free local PDF tools from Unclasp.',
    },
  },
  {
    path: '',
    loadComponent: () =>
      import('./feature/landing/landing.component').then(
        (m) => m.LandingComponent
      ),
    title: 'Unclasp: Free PDF Tools & Password Remover',
    data: {
      description:
        'Unlock PDFs with a password and use supported PDF tools in your browser. Free, no account required, and local processing.',
      faq: [
        {
          question: 'Do you upload my files?',
          answer:
            'The website’s supported PDF tools process files in your browser and have no application upload fallback. The separate developer API does upload PDF files for server processing. Read the privacy policy for details.',
        },
        {
          question: 'Is it free?',
          answer: 'Yes. The website tools are free and do not require an account.',
        },
        {
          question: 'Can I unlock a PDF without its password?',
          answer:
            'No. The PDF Password Remover requires the current password and does not crack or recover passwords.',
        },
      ],
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
