/**
 * Tests for manual-publish-utils.ts.
 *
 * Testuje logikę tworzenia danych do ręcznej publikacji oraz wybór celu
 * (deeplink / share dialog / zwykła strona) dla przycisku "jednego kliknięcia".
 */
import {
    createManualPublishData,
    getShareUrl,
    resolveManualPublishTarget,
} from '@/components/creator/manual-publish-utils';

describe('resolveManualPublishTarget', () => {
    describe('mobile viewport', () => {
        it('prefers the app deeplink for facebook regardless of shareUrl', () => {
            const target = resolveManualPublishTarget({
                platform: 'facebook',
                isMobileViewport: true,
                shareUrl: 'https://www.facebook.com/sharer/sharer.php?quote=x',
            });
            expect(target).toBe('fb://feed');
        });

        it('prefers the app deeplink for instagram (which has no shareUrl)', () => {
            const target = resolveManualPublishTarget({
                platform: 'instagram',
                isMobileViewport: true,
            });
            expect(target).toBe('instagram://camera');
        });

        it('prefers the app deeplink for linkedin', () => {
            const target = resolveManualPublishTarget({
                platform: 'linkedin',
                isMobileViewport: true,
                shareUrl: 'https://www.linkedin.com/sharing/share-offsite/?url=x',
            });
            expect(target).toBe('linkedin://feed');
        });
    });

    describe('desktop viewport', () => {
        it('uses the share dialog URL for facebook when available', () => {
            const target = resolveManualPublishTarget({
                platform: 'facebook',
                isMobileViewport: false,
                shareUrl: 'https://www.facebook.com/sharer/sharer.php?quote=hello',
            });
            expect(target).toBe('https://www.facebook.com/sharer/sharer.php?quote=hello');
        });

        it('uses the share dialog URL for linkedin when available', () => {
            const target = resolveManualPublishTarget({
                platform: 'linkedin',
                isMobileViewport: false,
                shareUrl: 'https://www.linkedin.com/sharing/share-offsite/?url=x&summary=hello',
            });
            expect(target).toBe('https://www.linkedin.com/sharing/share-offsite/?url=x&summary=hello');
        });

        it('falls back to the plain instagram.com URL when there is no shareUrl', () => {
            // Regression: a naive `shareUrl || platform === 'instagram' ? a : b` expression
            // (wrong operator precedence) would send facebook/linkedin here too whenever
            // shareUrl happened to be falsy, or send every platform to instagram.com
            // whenever shareUrl was truthy. This must only ever apply to Instagram.
            const target = resolveManualPublishTarget({
                platform: 'instagram',
                isMobileViewport: false,
            });
            expect(target).toBe('https://www.instagram.com');
        });

        it('never redirects facebook to instagram.com when it has a valid shareUrl', () => {
            const target = resolveManualPublishTarget({
                platform: 'facebook',
                isMobileViewport: false,
                shareUrl: 'https://www.facebook.com/sharer/sharer.php?quote=hello',
            });
            expect(target).not.toBe('https://www.instagram.com');
        });

        it('returns undefined for facebook with no shareUrl (nothing sensible to open)', () => {
            const target = resolveManualPublishTarget({
                platform: 'facebook',
                isMobileViewport: false,
                shareUrl: undefined,
            });
            expect(target).toBeUndefined();
        });

        it('returns undefined for linkedin with no shareUrl', () => {
            const target = resolveManualPublishTarget({
                platform: 'linkedin',
                isMobileViewport: false,
                shareUrl: undefined,
            });
            expect(target).toBeUndefined();
        });
    });
});

describe('getShareUrl', () => {
    it('builds a facebook sharer URL containing the encoded content', () => {
        const url = getShareUrl('facebook', 'hello world');
        expect(url).toContain('https://www.facebook.com/sharer/sharer.php?quote=');
        expect(url).toContain(encodeURIComponent('hello world'));
    });

    it('builds a linkedin share-offsite URL containing the encoded content', () => {
        const url = getShareUrl('linkedin', 'hello world');
        expect(url).toContain('https://www.linkedin.com/sharing/share-offsite/');
        expect(url).toContain(encodeURIComponent('hello world'));
    });

    it('returns undefined for instagram (no web share URL exists)', () => {
        expect(getShareUrl('instagram', 'hello world')).toBeUndefined();
    });
});

describe('createManualPublishData', () => {
    it('formats hashtags with a leading # and appends them to full_content', () => {
        const data = createManualPublishData({
            id: 1,
            content: 'Hello',
            hashtags: ['postlio', '#ai'],
            image_url: null,
            platform: 'facebook',
        });

        expect(data.hashtags).toEqual(['#postlio', '#ai']);
        expect(data.hashtags_string).toBe('#postlio #ai');
        expect(data.full_content).toBe('Hello\n\n#postlio #ai');
    });

    it('full_content equals content when there are no hashtags', () => {
        const data = createManualPublishData({
            id: 1,
            content: 'Hello',
            image_url: null,
            platform: 'facebook',
        });

        expect(data.full_content).toBe('Hello');
    });

    it('computes share_url from the full content (including hashtags), not just the base content', () => {
        const data = createManualPublishData({
            id: 1,
            content: 'Hello',
            hashtags: ['ai'],
            image_url: null,
            platform: 'facebook',
        });

        expect(data.share_url).toContain(encodeURIComponent('Hello\n\n#ai'));
    });

    it('leaves share_url undefined for instagram', () => {
        const data = createManualPublishData({
            id: 1,
            content: 'Hello',
            image_url: null,
            platform: 'instagram',
        });

        expect(data.share_url).toBeUndefined();
    });
});
