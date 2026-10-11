import { TestBed } from '@angular/core/testing';
import {
  ANIMATION_MODULE_TYPE,
  createEnvironmentInjector,
  EnvironmentInjector,
} from '@angular/core';
import { TitleStrategy } from '@angular/router';
import { config } from './app.config.browser';
import { SeoTitleStrategy } from './core/seo/seo-title.strategy';

describe('app.config.browser', () => {
  // Resolve providers from the browser config alone (the global test setup
  // provides its own animation module, which would otherwise mask ours).
  const browserInjector = () =>
    createEnvironmentInjector(config.providers, TestBed.inject(EnvironmentInjector));

  it('uses the shared SEO title strategy in the browser', () => {
    expect(browserInjector().get(TitleStrategy)).toBeInstanceOf(SeoTitleStrategy);
  });

  it('registers the animations provider for Angular Material', () => {
    // provideAnimations() resolves to 'NoopAnimations' only when the global
    // ngServerMode flag is set (the Karma bundle sets it via platform-server
    // specs); the real browser bundle gets 'BrowserAnimations'.
    const expected = (globalThis as any).ngServerMode ? 'NoopAnimations' : 'BrowserAnimations';
    expect(browserInjector().get(ANIMATION_MODULE_TYPE, null, { self: true })).toBe(expected);
  });
});
