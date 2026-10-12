import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="container-lg py-5">
      <nav aria-label="Breadcrumb" class="mb-3">
        <a routerLink="/">Home</a>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">About</span>
      </nav>

      <header class="mb-4">
        <p class="text-uppercase text-secondary small fw-semibold mb-2">
          About the maker
        </p>
        <h1 class="display-5 fw-bold">About Sai Krishna Chaitanya</h1>
        <p class="lead text-body-secondary">
          I build Unclasp and other practical browser tools and developer
          utilities.
        </p>
      </header>

      <section aria-labelledby="about-work">
        <h2 id="about-work" class="h3">What I work on</h2>
        <p>
          I created Unclasp, a collection of PDF tools, alongside projects
          including Git Commit Summary, an Angular i18n demonstration, and
          StartMyDev. My work focuses on useful, clearly scoped software and
          documenting how each tool behaves.
        </p>
        <p>
          I’m Sai Krishna Chaitanya
          (<a href="https://linktr.ee/mr_ask_chay">&#64;mr_ask_chay</a>).
          You can review my public work on
          <a href="https://github.com/mr-ask-chay">GitHub</a> or
          <a href="mailto:saikrishnachaitanya61&#64;gmail.com">contact me</a>.
        </p>
      </section>

      <section class="mt-5" aria-labelledby="other-projects">
        <h2 id="other-projects" class="h3">Other projects and tools</h2>
        <p class="text-body-secondary">
          In addition to Unclasp, these are the independent tools and demos previously featured on the home page.
        </p>
        <div class="row g-3">
          <div class="col-md-6">
            <article class="h-100 rounded-4 border bg-body p-4">
              <div class="d-flex align-items-center gap-3 mb-3">
                <img src="/assets/images/git_summary-64.webp" alt="" width="56" height="56" loading="lazy" decoding="async" class="rounded-3 flex-shrink-0" />
                <h3 class="h5 mb-0">Git Commit Summary</h3>
              </div>
              <p class="text-body-secondary">
                A command-line tool that summarizes Git commits with file and line changes and detects newly added functions.
              </p>
              <a href="https://github.com/mr-ask-chay/git-commit-summary">
                View Git Commit Summary on GitHub
              </a>
            </article>
          </div>
          <div class="col-md-6">
            <article class="h-100 rounded-4 border bg-body p-4">
              <div class="d-flex align-items-center gap-3 mb-3">
                <img src="/assets/images/internationalization-64.webp" alt="" width="56" height="56" loading="lazy" decoding="async" class="rounded-3 flex-shrink-0" />
                <h3 class="h5 mb-0">Angular i18n Helper</h3>
              </div>
              <p class="text-body-secondary">
                A live demonstration project for extracting, managing, and previewing Angular translations.
              </p>
              <a href="https://internationalization-d2aa6.web.app/en/">
                Open the Angular i18n Helper demo
              </a>
            </article>
          </div>
          <div class="col-md-6">
            <article class="h-100 rounded-4 border bg-body p-4">
              <div class="d-flex align-items-center gap-3 mb-3">
                <img src="/assets/images/start_my_dev_logo-64.webp" alt="" width="56" height="56" loading="lazy" decoding="async" class="rounded-3 flex-shrink-0" />
                <h3 class="h5 mb-0">StartMyDev</h3>
              </div>
              <p class="text-body-secondary">
                Configure and download PowerShell scripts to launch frontend, backend, or full-stack projects.
              </p>
              <div class="d-flex flex-wrap gap-3">
                <a href="https://start-my-dev-dashboard.vercel.app/">Open StartMyDev</a>
                <a href="https://start-my-dev-dashboard.vercel.app/docs">Read its documentation</a>
              </div>
            </article>
          </div>
          <div class="col-md-6">
            <article class="h-100 rounded-4 border bg-body p-4">
              <div class="d-flex align-items-center gap-3 mb-3">
                <img src="/assets/images/pdf_icon-64.webp" alt="" width="56" height="56" loading="lazy" decoding="async" class="rounded-3 flex-shrink-0" />
                <h3 class="h5 mb-0">Unclasp PDF tools</h3>
              </div>
              <p class="text-body-secondary">
                The PDF-focused product on this site, including password removal and the supported PDF Tools Studio operations.
              </p>
              <div class="d-flex flex-wrap gap-3">
                <a routerLink="/pdf-password-remover">PDF Password Remover</a>
                <a routerLink="/pdf-tools">PDF Tools Studio</a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="editorial-method" class="mt-5 pt-4" aria-labelledby="editorial-method-title">
        <h2 id="editorial-method-title" class="h3">How product information is maintained</h2>
        <p>
          Tool descriptions are based on the operations currently available in
          the application. Limitations are stated where a feature is partial;
          for example, text overlays do not remove existing PDF content, and
          text extraction does not perform OCR. Automated test results and
          manual browser checks are described separately rather than treated as
          interchangeable evidence.
        </p>
        <p>
          Website PDF tools process supported files in browser code. The
          separate developer API uploads files for server-side processing. See
          the <a routerLink="/privacy">privacy policy</a> and
          <a routerLink="/terms">terms of use</a> for details.
        </p>
        <p class="small text-body-secondary mb-0">
          Page reviewed
          <time datetime="2026-10-12">October 12, 2026</time>.
        </p>
      </section>
    </article>
  `,
})
export class AboutComponent {}
