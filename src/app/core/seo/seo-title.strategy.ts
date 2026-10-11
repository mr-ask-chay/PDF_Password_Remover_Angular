import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  TitleStrategy,
} from '@angular/router';
import { AppConfig } from '../config/app.config';

export const DEFAULT_TITLE = 'PDF Password Remover & Developer Tools';
export const DEFAULT_DESCRIPTION =
  'Remove the password from a PDF you have the password for — free, no account needed.';

/**
 * Sets per-route SEO metadata on every navigation (server prerender and browser):
 * title, description, robots, canonical link and Open Graph / Twitter tags.
 *
 * Route config:
 *  - `title`               → document title
 *  - `data.description`    → meta description
 *  - `data.index === false` → `noindex` and no canonical link
 */
@Injectable({ providedIn: 'root' })
export class SeoTitleStrategy extends TitleStrategy {
  private readonly siteUrl = AppConfig.getSiteURL().replace(/\/+$/, '');

  constructor(
    private readonly title: Title,
    private readonly meta: Meta,
    @Inject(DOCUMENT) private readonly document: Document
  ) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const route = this.deepest(snapshot.root);
    const title = this.buildTitle(snapshot) ?? DEFAULT_TITLE;
    const description: string = route.data['description'] ?? DEFAULT_DESCRIPTION;
    const indexable = route.data['index'] !== false;
    const url = this.canonicalUrl(snapshot.url);

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({
      name: 'robots',
      content: indexable ? 'index, follow' : 'noindex, follow',
    });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.setCanonical(indexable ? url : null);
  }

  /** Absolute URL without query string, fragment or trailing slash. */
  canonicalUrl(routerUrl: string): string {
    const path = (routerUrl.split(/[?#]/)[0] || '/').replace(/\/+$/, '');
    return `${this.siteUrl}${path || '/'}`;
  }

  private deepest(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    while (route.firstChild) route = route.firstChild;
    return route;
  }

  private setCanonical(href: string | null): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!href) {
      link?.remove();
      return;
    }
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', href);
  }
}
