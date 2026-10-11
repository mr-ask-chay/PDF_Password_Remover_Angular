import { routes } from './app.routes';

describe('App Routes', () => {
    const find = (path: string) => routes.find(r => r.path === path);

    it('should have routes defined', () => {
        expect(routes).toBeDefined();
        expect(routes.length).toBeGreaterThan(0);
    });

    it('should give every indexable route a title and description', () => {
        for (const path of ['', 'pdf-password-remover', 'pdf-tools', 'docs', 'privacy', 'terms']) {
            const route = find(path);
            expect(route).withContext(path).toBeDefined();
            expect(route?.title).withContext(path).toBeTruthy();
            expect(route?.data?.['description']).withContext(path).toBeTruthy();
            expect(route?.data?.['index']).withContext(path).not.toBe(false);
        }
    });

    it('should have a dedicated PDF password remover route', () => {
        const route = find('pdf-password-remover');
        expect(route?.loadComponent).toBeDefined();
        expect(route?.title).toContain('Remove PDF Password');
    });

    it('should have a browser-first PDF tools route', () => {
        const route = find('pdf-tools');
        expect(route?.loadComponent).toBeDefined();
        expect(route?.title).toContain('PDF Tools');
    });

    it('should have privacy route with title and data', () => {
        const privacyRoute = find('privacy');
        expect(privacyRoute?.title).toBe('Privacy Policy | Unclasp PDF Tools');
        expect(privacyRoute?.data?.['description']).toContain('AdSense');
    });

    it('should have home route', () => {
        const homeRoute = find('');
        expect(homeRoute?.title).toContain('Unclasp');
        expect(homeRoute?.loadComponent).toBeDefined();
    });

    it('should mark the placeholder image page as noindex', () => {
        const imageRoute = find('image/select-image');
        expect(imageRoute).toBeDefined();
        expect(imageRoute?.data?.['index']).toBeFalse();
    });

    it('should have a noindex wildcard route for 404', () => {
        const notFoundRoute = find('**');
        expect(notFoundRoute?.title).toBe('Page Not Found');
        expect(notFoundRoute?.data?.['index']).toBeFalse();
    });

    it('should load components lazily', async () => {
        for (const path of ['docs', 'pdf-password-remover']) {
            const route = find(path);
            const component = await route!.loadComponent!();
            expect(component).withContext(path).toBeDefined();
        }
    });
});
