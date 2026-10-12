# Unclasp site structure and route audit

## Updated summary

The product page now leads with a product-focused message instead of a biography-led homepage. The site keeps a dedicated About route for the founder and product story, while the landing page focuses on how Unclasp works, what it does, and how to get started.

## Route architecture

The app currently exposes these public routes:

- `/` — landing page and PDF tool overview
- `/pdf-tools` — directory and browser-based PDF tool workflow
- `/pdf-password-remover` — password-removal flow
- `/about` — founder and product background
- `/contact` — contact route
- `/docs` — API documentation for the server-side developer API
- `/privacy` — privacy policy
- `/terms` — terms of use
- `/image/select-image` — placeholder/noindex route
- `**` — noindex not-found page

## Homepage structure

The landing page now follows the intended hierarchy:

1. Global header with compact navigation and a theme toggle
2. Product-focused hero explaining the value of Unclasp
3. Tool directory section covering the current browser workflow categories
4. Clear workflow section explaining how a user completes a task
5. Helpful information for privacy and documentation
6. Shared footer with product, resource, and legal links

## About page separation

The About page remains a dedicated narrative page for the founder, product intent, and editorial/testing approach. It no longer competes with the landing page for product discovery.

## Shared layout and design system

The site uses a single shared header and footer across the public routes with a consistent Bootstrap-based design system, responsive spacing, and accessible focus treatment.

## Evidence in code

- `src/app/app.routes.ts` defines the canonical public route map.
- `src/app/header/header.component.html` provides the reusable site header.
- `src/app/footer/footer.component.html` provides the reusable site footer.
- `src/app/feature/landing/landing.component.html` keeps the homepage focused on product value and tool discovery.
- `src/app/feature/about/about.component.ts` keeps the story and editorial details in a dedicated place.

## Remaining checks

The repo already records that the current production build uses prerendering and route-aware metadata. Additional live deployment validation should still be done in Vercel after release to confirm canonical URLs and indexability in a real environment.
