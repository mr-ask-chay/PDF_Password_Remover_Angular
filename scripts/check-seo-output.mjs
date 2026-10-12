import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const browserOutput = resolve(process.argv[2] ?? 'dist/pdf-removal/browser');
const routes = [
  '/',
  '/about',
  '/contact',
  '/docs',
  '/pdf-password-remover',
  '/pdf-tools',
  '/privacy',
  '/terms',
];
const nonIndexableRoutes = ['/image/select-image'];
const pdfToolHeadings = [
  'Merge PDF',
  'Compress PDF',
  'Split PDF',
  'JPG / PNG to PDF',
  'PDF to JPG',
  'PDF to Markdown',
  'Compare PDF text',
  'PDF page tools',
  'PDF Forms',
  'Protect PDF',
];

function readText(path) {
  assert.ok(existsSync(path), `Expected build output: ${path}`);
  return readFileSync(path, 'utf8');
}

function routeHtmlPath(route) {
  return route === '/'
    ? join(browserOutput, 'index.html')
    : join(browserOutput, route.slice(1), 'index.html');
}

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(
      ([, name, doubleQuoted, singleQuoted]) => [
        name.toLowerCase(),
        doubleQuoted ?? singleQuoted,
      ]
    )
  );
}

function metaTags(html) {
  return [...html.matchAll(/<meta\b[^>]*>/gi)].map(([tag]) => attributes(tag));
}

const productionEnvironment = readText(
  resolve('src/environments/environment.prod.ts')
);
const configuredSiteUrl = productionEnvironment.match(/siteUrl:\s*'([^']+)'/);
assert.ok(configuredSiteUrl, 'Production siteUrl must be configured.');
const siteUrl = configuredSiteUrl[1].replace(/\/+$/, '');

const titles = new Set();
const descriptions = new Set();
for (const route of routes) {
  const html = readText(routeHtmlPath(route));
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const metas = metaTags(html);
  const description = metas.find((tag) => tag.name === 'description')?.content;
  const robots = metas.find((tag) => tag.name === 'robots')?.content;
  const canonicals = [
    ...html.matchAll(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi),
  ];
  const canonical = canonicals[0] ? attributes(canonicals[0][0]).href : undefined;

  assert.ok(title, `${route}: prerendered title is missing.`);
  assert.ok(
    description && description.length >= 40,
    `${route}: useful meta description is missing.`
  );
  assert.equal(robots, 'index, follow', `${route}: indexable page must allow indexing.`);
  assert.equal(canonicals.length, 1, `${route}: expected exactly one canonical link.`);
  assert.equal(
    canonical,
    `${siteUrl}${route === '/' ? '/' : route}`,
    `${route}: canonical mismatch.`
  );
  assert.match(html, /<h1\b/i, `${route}: prerendered page content is missing.`);
  assert.ok(!titles.has(title), `${route}: title is not unique.`);
  assert.ok(!descriptions.has(description), `${route}: description is not unique.`);
  titles.add(title);
  descriptions.add(description);
}

for (const route of nonIndexableRoutes) {
  const html = readText(routeHtmlPath(route));
  const robots = metaTags(html).find((tag) => tag.name === 'robots')?.content;
  const canonicals = [
    ...html.matchAll(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi),
  ];
  assert.equal(robots, 'noindex, follow', `${route}: placeholder must not be indexed.`);
  assert.equal(canonicals.length, 0, `${route}: non-indexable route must not have a canonical.`);
}

const toolsHtml = readText(routeHtmlPath('/pdf-tools'));
for (const heading of pdfToolHeadings) {
  assert.ok(
    toolsHtml.includes(heading),
    `/pdf-tools: prerendered content is missing "${heading}".`
  );
}

const sitemap = readText(resolve('src/sitemap.xml'));
const sitemapUrls = [
  ...sitemap.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g),
].map(([, url]) => url);
assert.equal(
  sitemapUrls.length,
  routes.length,
  'Sitemap must list every indexable route exactly once.'
);
assert.deepEqual(
  new Set(sitemapUrls),
  new Set(routes.map((route) => `${siteUrl}${route === '/' ? '/' : route}`)),
  'Sitemap routes must match the indexable prerendered routes.'
);
for (const route of nonIndexableRoutes) {
  assert.ok(
    !sitemapUrls.includes(`${siteUrl}${route}`),
    `Sitemap must not include non-indexable placeholder route ${route}.`
  );
}

const robotsTxt = readText(resolve('src/robots.txt'));
assert.match(robotsTxt, /User-agent:\s*\*/i);
assert.match(robotsTxt, /Allow:\s*\//i);
assert.ok(
  robotsTxt.includes(`Sitemap: ${siteUrl}/sitemap.xml`),
  'robots.txt must point to the production sitemap.'
);

console.log(`SEO output check passed for ${routes.length} prerendered indexable routes.`);
