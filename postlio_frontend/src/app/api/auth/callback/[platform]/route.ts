// src/app/api/auth/callback/[platform]/route.ts
/**
 * OAuth Callback Route dla Social Media platforms.
 *
 * Flow:
 * 1. Użytkownik kliknął "Połącz" -> redirect do platformy
 * 2. Platforma po autoryzacji redirect tutaj z ?code=xxx&state=xxx
 * 3. Ten endpoint redirect do frontend z parametrami
 * 4. Frontend wywołuje API backend /social/oauth/callback
 */

import { NextRequest, NextResponse } from 'next/server';

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

    // Base URL for redirect
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const settingsUrl = `${baseUrl}/settings`;

    // Handle error from OAuth provider
    if (error) {
        const errorUrl = new URL(settingsUrl);
        errorUrl.searchParams.set('oauth_error', error);
        if (errorDescription) {
            errorUrl.searchParams.set('oauth_error_description', errorDescription);
        }
        errorUrl.searchParams.set('platform', platform);
        return NextResponse.redirect(errorUrl.toString());
    }

    // Validate required params
    if (!code || !state) {
        const errorUrl = new URL(settingsUrl);
        errorUrl.searchParams.set('oauth_error', 'missing_params');
        errorUrl.searchParams.set('oauth_error_description', 'Brak wymaganych parametrów autoryzacji');
        errorUrl.searchParams.set('platform', platform);
        return NextResponse.redirect(errorUrl.toString());
    }

    // Redirect to settings page with success params
    // Frontend będzie obsługiwał wymianę kodu na token
    const successUrl = new URL(settingsUrl);
    successUrl.searchParams.set('oauth_success', 'true');
    successUrl.searchParams.set('oauth_code', code);
    successUrl.searchParams.set('oauth_state', state);
    successUrl.searchParams.set('platform', platform);

    return NextResponse.redirect(successUrl.toString());
}