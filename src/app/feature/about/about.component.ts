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
          You can review my public work on
          <a href="https://github.com/mr-ask-chay">GitHub</a> or
          <a href="mailto:saikrishnachaitanya61&#64;gmail.com">contact me</a>.
        </p>
      </section>

      <section id="editorial-method" aria-labelledby="editorial-method-title">
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
