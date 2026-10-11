import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { AppConfig } from '../config/app.config';
import { DEFAULT_TITLE, SeoTitleStrategy } from './seo-title.strategy';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('SeoTitleStrategy', () => {
  let router: Router;
  let doc: Document;
  let meta: Meta;
  let title: Title;

  const canonical = () =>
    doc.head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null;

  beforeEach(() => {
    spyOn(AppConfig, 'getSiteURL').and.returnValue('https://example.test/');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: '',
            component: DummyComponent,
            title: 'Home',
            data: {
              description: 'Home desc',
              faq: [{ question: 'Question?', answer: 'Answer.' }],
            },
          },
          { path: 'tool', component: DummyComponent, title: 'Tool', data: { description: 'Tool desc' } },
          { path: 'untitled', component: DummyComponent },
          { path: '**', component: DummyComponent, title: 'Not found', data: { index: false } },
        ]),
        { provide: TitleStrategy, useClass: SeoTitleStrategy },
      ],
    });
    router = TestBed.inject(Router);
    doc = TestBed.inject(DOCUMENT);
    meta = TestBed.inject(Meta);
    title = TestBed.inject(Title);
  });

  afterEach(() => {
    doc.head.querySelector('link[rel="canonical"]')?.remove();
    doc.getElementById('route-faq-schema')?.remove();
  });

  it('sets title, description, robots and canonical for an indexable page', async () => {
    await router.navigateByUrl('/tool?utm_source=x#faq');
    expect(title.getTitle()).toBe('Tool');
    expect(meta.getTag('name="description"')?.content).toBe('Tool desc');
    expect(meta.getTag('name="robots"')?.content).toBe('index, follow');
    expect(meta.getTag('property="og:url"')?.content).toBe('https://example.test/tool');
    expect(meta.getTag('property="og:type"')?.content).toBe('website');
    expect(meta.getTag('name="twitter:title"')?.content).toBe('Tool');
    expect(canonical()).toBe('https://example.test/tool');
  });

  it('uses the site root as canonical for the home page', async () => {
    await router.navigateByUrl('/');
    expect(canonical()).toBe('https://example.test/');
    const schema = JSON.parse(
      doc.getElementById('route-faq-schema')?.textContent ?? '{}'
    );
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity[0].name).toBe('Question?');
    expect(schema.mainEntity[0].acceptedAnswer.text).toBe('Answer.');
  });

  it('removes route-specific FAQ structured data on routes without FAQs', async () => {
    await router.navigateByUrl('/');
    expect(doc.getElementById('route-faq-schema')).not.toBeNull();
    await router.navigateByUrl('/tool');
    expect(doc.getElementById('route-faq-schema')).toBeNull();
  });

  it('falls back to defaults when a route has no title', async () => {
    await router.navigateByUrl('/untitled');
    expect(title.getTitle()).toBe(DEFAULT_TITLE);
  });

  it('sets noindex and removes canonical for non-indexable routes', async () => {
    await router.navigateByUrl('/tool');
    expect(canonical()).not.toBeNull();
    await router.navigateByUrl('/missing-page');
    expect(meta.getTag('name="robots"')?.content).toBe('noindex, follow');
    expect(canonical()).toBeNull();
  });

  it('never emits a meta tag named canonical', async () => {
    await router.navigateByUrl('/tool');
    expect(meta.getTag('name="canonical"')).toBeNull();
  });
});
