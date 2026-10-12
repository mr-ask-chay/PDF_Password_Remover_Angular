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
  // Inspect browser providers without inheriting TestBed's global providers.
  const browserInjector = () =>
    createEnvironmentInjector(config.providers, TestBed.inject(EnvironmentInjector));

  it('uses the shared SEO title strategy in the browser', () => {
    expect(browserInjector().get(TitleStrategy)).toBeInstanceOf(SeoTitleStrategy);
  });

  it('does not register unused Angular animations providers', () => {
    const injector = browserInjector();
    expect(injector.get(ANIMATION_MODULE_TYPE, null, { self: true })).toBeNull();
  });
});
