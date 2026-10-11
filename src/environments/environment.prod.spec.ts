import { environment } from './environment.prod';

describe('Environment Prod', () => {
    it('should have production set to true', () => {
        expect(environment.production).toBeTrue();
    });

    it('should have development set to false', () => {
        expect(environment.development).toBeFalse();
    });

    it('should have local set to false', () => {
        expect(environment.local).toBeFalse();
    });

    it('should have apiUrl defined', () => {
        expect(environment.apiUrl).toBeDefined();
        expect(environment.apiUrl).toContain('flask-pdf-pr-main');
    });

    it('should have siteUrl defined', () => {
        expect(environment.siteUrl).toBeDefined();
        expect(environment.siteUrl).toBe('https://pdf-fe-kappa.vercel.app');
    });

    it('should have navigateToi18n defined', () => {
        expect(environment.navigateToi18n).toBeDefined();
        expect(environment.navigateToi18n).toContain('internationalization');
    });
});
