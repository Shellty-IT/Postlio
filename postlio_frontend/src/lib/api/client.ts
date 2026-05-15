// src/lib/api/client.ts
/**
 * Postlio API Client
 *
 * Centralny punkt komunikacji z backendem.
 * Obsługuje autoryzację, odświeżanie tokenów i błędy.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// ============================================================
// TYPY
// ============================================================

export interface ApiError {
    message: string;
    status: number;
    code?: string;
    details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
    data: T;
    success: boolean;
}

interface RequestConfig extends RequestInit {
    skipAuth?: boolean;
    timeout?: number;
}

// ============================================================
// TOKEN MANAGEMENT
// ============================================================

class TokenManager {
    private static ACCESS_TOKEN_KEY = 'postlio_access_token';
    private static REFRESH_TOKEN_KEY = 'postlio_refresh_token';

    static getAccessToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }

    static getRefreshToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    static setTokens(accessToken: string, refreshToken: string): void {
        if (typeof window === 'undefined') return;
        localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }

    static clearTokens(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(this.ACCESS_TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }

    static hasTokens(): boolean {
        return !!this.getAccessToken();
    }
}

// ============================================================
// ERROR HANDLING
// ============================================================

export class ApiException extends Error {
    public status: number;
    public code?: string;
    public details?: Record<string, unknown>;

    constructor(error: ApiError) {
        super(error.message);
        this.name = 'ApiException';
        this.status = error.status;
        this.code = error.code;
        this.details = error.details;
    }

    static isUnauthorized(error: unknown): boolean {
        return error instanceof ApiException && error.status === 401;
    }

    static isNotFound(error: unknown): boolean {
        return error instanceof ApiException && error.status === 404;
    }

    static isValidationError(error: unknown): boolean {
        return error instanceof ApiException && error.status === 422;
    }

    static isServerError(error: unknown): boolean {
        return error instanceof ApiException && error.status >= 500;
    }
}

// ============================================================
// FETCH WITH TIMEOUT
// ============================================================

async function fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number = 30000
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

// ============================================================
// TOKEN REFRESH LOGIC
// ============================================================

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeToTokenRefresh(callback: (token: string) => void): void {
    refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string): void {
    refreshSubscribers.forEach((callback) => callback(token));
    refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<string | null> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) {
            TokenManager.clearTokens();
            return null;
        }

        const data = await response.json();
        TokenManager.setTokens(data.access_token, data.refresh_token);
        return data.access_token;
    } catch {
        TokenManager.clearTokens();
        return null;
    }
}

// ============================================================
// MAIN API CLIENT
// ============================================================

async function apiRequest<T>(
    endpoint: string,
    config: RequestConfig = {}
): Promise<T> {
    const { skipAuth = false, timeout = 30000, ...fetchConfig } = config;

    // Budowanie URL
    const url = endpoint.startsWith('http')
        ? endpoint
        : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    // Budowanie headers
    const headers = new Headers(fetchConfig.headers);

    if (!headers.has('Content-Type') && !(fetchConfig.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    // Dodawanie tokenu autoryzacji
    if (!skipAuth) {
        const token = TokenManager.getAccessToken();
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
    }

    // Wykonanie requestu
    let response: Response;

    try {
        response = await fetchWithTimeout(
            url,
            { ...fetchConfig, headers },
            timeout
        );
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw new ApiException({
                message: 'Request timeout - spróbuj ponownie',
                status: 408,
                code: 'TIMEOUT',
            });
        }
        throw new ApiException({
            message: 'Błąd połączenia z serwerem',
            status: 0,
            code: 'NETWORK_ERROR',
        });
    }

    // Obsługa 401 - próba odświeżenia tokenu
    if (response.status === 401 && !skipAuth) {
        if (!isRefreshing) {
            isRefreshing = true;

            const newToken = await refreshAccessToken();
            isRefreshing = false;

            if (newToken) {
                onTokenRefreshed(newToken);
                // Powtórz request z nowym tokenem
                headers.set('Authorization', `Bearer ${newToken}`);
                response = await fetchWithTimeout(
                    url,
                    { ...fetchConfig, headers },
                    timeout
                );
            } else {
                // Przekieruj do logowania
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                throw new ApiException({
                    message: 'Sesja wygasła - zaloguj się ponownie',
                    status: 401,
                    code: 'SESSION_EXPIRED',
                });
            }
        } else {
            // Czekaj na odświeżenie tokenu przez inny request
            return new Promise((resolve, reject) => {
                subscribeToTokenRefresh(async (token) => {
                    try {
                        headers.set('Authorization', `Bearer ${token}`);
                        const retryResponse = await fetchWithTimeout(
                            url,
                            { ...fetchConfig, headers },
                            timeout
                        );
                        const data = await handleResponse<T>(retryResponse);
                        resolve(data);
                    } catch (error) {
                        reject(error);
                    }
                });
            });
        }
    }

    return handleResponse<T>(response);
}

async function handleResponse<T>(response: Response): Promise<T> {
    // Pusty response (204 No Content)
    if (response.status === 204) {
        return undefined as T;
    }

    // Próba parsowania JSON
    let data: unknown;
    try {
        data = await response.json();
    } catch {
        if (!response.ok) {
            throw new ApiException({
                message: 'Błąd serwera',
                status: response.status,
                code: 'PARSE_ERROR',
            });
        }
        return undefined as T;
    }

    // Obsługa błędów
    if (!response.ok) {
        const errorData = data as Record<string, unknown>;
        throw new ApiException({
            message: (errorData.detail as string) || (errorData.message as string) || 'Wystąpił błąd',
            status: response.status,
            code: errorData.code as string | undefined,
            details: errorData.errors as Record<string, unknown> | undefined,
        });
    }

    return data as T;
}

// ============================================================
// PUBLIC API
// ============================================================

export const apiClient = {
    get: <T>(endpoint: string, config?: RequestConfig) =>
        apiRequest<T>(endpoint, { ...config, method: 'GET' }),

    post: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
        apiRequest<T>(endpoint, {
            ...config,
            method: 'POST',
            body: data instanceof FormData ? data : JSON.stringify(data),
        }),

    put: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
        apiRequest<T>(endpoint, {
            ...config,
            method: 'PUT',
            body: data instanceof FormData ? data : JSON.stringify(data),
        }),

    patch: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
        apiRequest<T>(endpoint, {
            ...config,
            method: 'PATCH',
            body: data instanceof FormData ? data : JSON.stringify(data),
        }),

    delete: <T>(endpoint: string, config?: RequestConfig) =>
        apiRequest<T>(endpoint, { ...config, method: 'DELETE' }),

    // Upload z progress (dla obrazów)
    upload: async <T>(
        endpoint: string,
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<T> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            formData.append('file', file);

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable && onProgress) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    onProgress(percent);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve(JSON.parse(xhr.responseText));
                    } catch {
                        resolve(undefined as T);
                    }
                } else {
                    reject(new ApiException({
                        message: 'Upload failed',
                        status: xhr.status,
                    }));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new ApiException({
                    message: 'Network error during upload',
                    status: 0,
                    code: 'UPLOAD_ERROR',
                }));
            });

            const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
            xhr.open('POST', url);

            const token = TokenManager.getAccessToken();
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }

            xhr.send(formData);
        });
    },
};

// Export TokenManager dla auth store
export { TokenManager };

export default apiClient;