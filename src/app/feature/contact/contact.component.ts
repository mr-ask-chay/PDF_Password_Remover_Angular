import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="container-lg py-5">
      <nav aria-label="Breadcrumb" class="mb-3">
        <a routerLink="/">Home</a>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Contact</span>
      </nav>

      <header class="mb-4">
        <p class="text-uppercase text-secondary small fw-semibold mb-2">
          Support and feedback
        </p>
        <h1 class="display-5 fw-bold">Contact Unclasp</h1>
        <p class="lead text-body-secondary">
          Send questions, accessibility feedback, or a report about a problem
          with a supported tool.
        </p>
      </header>

      <section aria-labelledby="contact-details">
        <h2 id="contact-details" class="h3">Contact the developer</h2>
        <p>
          Unclasp is maintained by Sai Krishna Chaitanya. For support, contact
          me by email or use the public project page.
        </p>
        <ul>
          <li>
            Email:
            <a href="mailto:saikrishnachaitanya61&#64;gmail.com">
              saikrishnachaitanya61&#64;gmail.com
            </a>
          </li>
          <li>
            Project:
            <a href="https://github.com/mr-ask-chay/PDF_Password_Remover_Angular">
              Unclasp on GitHub
            </a>
          </li>
          <li><a routerLink="/about">About the developer and product notes</a></li>
        </ul>
        <p class="small text-body-secondary">
          Please do not email PDFs, passwords, API secrets, or other sensitive
          information.
        </p>
      </section>
    </article>
  `,
})
export class ContactComponent {}
