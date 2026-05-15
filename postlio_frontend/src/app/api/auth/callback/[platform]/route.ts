// src/app/api/auth/callback/[platform]/route.ts
/**
 * OAuth Callback Route dla Social Media platforms.
 *
 * Flow:
 * 1. Użytkownik kliknął "Połącz" -> redirect do platformy
 * 2. Platforma po autoryzacji redirect tutaj z ?code=xxx&state=xxx
 * 3. Ten endpoint redirect do odpowiedniej strony frontend z parametrami
 * 4. Frontend wywołuje API backend /social/oauth/callback
 *
 * Konteksty:
 * - 'onboarding' -> redirect do /onboarding z parametrami
 * - 'settings' -> redirect do /settings z parametrami
 * - 'login' -> redirect do /login z parametrami (social login)
 */

import { NextRequest, NextResponse } from 'next/server';


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type OAuthContext = 'onboarding' | 'settings' | 'login';

export async function GET(
    request: NextRequest,
    { params }: { params: { platform: string } }
) {
    const { platform } = params;
    const searchParams = request.nextUrl.searchParams;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');


    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';


    let context: OAuthContext = 'settings';

    if (state) {
        if (state.startsWith('onboarding_')) {
            context = 'onboarding';
        } else if (state.startsWith('login_')) {
            context = 'login';
        } else if (state.startsWith('settings_')) {
            context = 'settings';
        }
    }


    const getRedirectUrl = (ctx: OAuthContext): string => {
        switch (ctx) {
            case 'onboarding':
                return `${baseUrl}/onboarding`;
            case 'login':
                return `${baseUrl}/login`;
            case 'settings':
            default:
                return `${baseUrl}/settings`;
        }
    };

    const redirectBaseUrl = getRedirectUrl(context);


    if (error) {
        const errorUrl = new URL(redirectBaseUrl);
        errorUrl.searchParams.set('oauth_error', error);
        if (errorDescription) {
            errorUrl.searchParams.set('oauth_error_description', errorDescription);
        }
        errorUrl.searchParams.set('platform', platform);
        errorUrl.searchParams.set('oauth_context', context);
        return NextResponse.redirect(errorUrl.toString());
    }


    if (!code || !state) {
        const errorUrl = new URL(redirectBaseUrl);
        errorUrl.searchParams.set('oauth_error', 'missing_params');
        errorUrl.searchParams.set('oauth_error_description', 'Brak wymaganych parametrów autoryzacji');
        errorUrl.searchParams.set('platform', platform);
        errorUrl.searchParams.set('oauth_context', context);
        return NextResponse.redirect(errorUrl.toString());
    }


    const successUrl = new URL(redirectBaseUrl);
    successUrl.searchParams.set('oauth_success', 'true');
    successUrl.searchParams.set('oauth_code', code);
    successUrl.searchParams.set('oauth_state', state);
    successUrl.searchParams.set('platform', platform);
    successUrl.searchParams.set('oauth_context', context);

    return NextResponse.redirect(successUrl.toString());
}