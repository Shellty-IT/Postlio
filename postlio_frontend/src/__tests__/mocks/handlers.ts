/**
 * MSW (Mock Service Worker) handlers for API mocking in tests.
 *
 * Te handlery są używane do mockowania odpowiedzi API w testach.
 */
import { http, HttpResponse } from 'msw';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// ============================================================
// AUTH HANDLERS
// ============================================================

export const authHandlers = [
    // Login
    http.post(`${API_URL}/auth/login`, async ({ request }) => {
        const formData = await request.formData();
        const email = formData.get('username');
        const password = formData.get('password');

        if (email === 'test@example.com' && password === 'password123') {
            return HttpResponse.json({
                access_token: 'mock-access-token',
                token_type: 'bearer',
                user: {
                    id: 1,
                    email: 'test@example.com',
                    full_name: 'Test User',
                    is_active: true,
                    is_verified: true,
                },
            });
        }

        return HttpResponse.json(
            { detail: 'Incorrect email or password' },
            { status: 401 }
        );
    }),

    // Register
    http.post(`${API_URL}/auth/register`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;

        if (body.email === 'existing@example.com') {
            return HttpResponse.json(
                { detail: 'Email already registered' },
                { status: 400 }
            );
        }

        return HttpResponse.json(
            {
                access_token: 'mock-access-token',
                token_type: 'bearer',
                user: {
                    id: 1,
                    email: body.email,
                    full_name: body.full_name,
                    is_active: true,
                    is_verified: false,
                },
            },
            { status: 201 }
        );
    }),

    // Get current user
    http.get(`${API_URL}/auth/me`, ({ request }) => {
        const authHeader = request.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return HttpResponse.json(
                { detail: 'Not authenticated' },
                { status: 401 }
            );
        }

        return HttpResponse.json({
            id: 1,
            email: 'test@example.com',
            full_name: 'Test User',
            is_active: true,
            is_verified: true,
        });
    }),

    // Logout
    http.post(`${API_URL}/auth/logout`, () => {
        return HttpResponse.json({ message: 'Logged out' });
    }),
];

// ============================================================
// BRANDS HANDLERS
// ============================================================

export const brandsHandlers = [
    // Get all brands
    http.get(`${API_URL}/brands`, () => {
        return HttpResponse.json([
            {
                id: 1,
                name: 'Test Brand',
                description: 'A test brand for testing',
                industry: 'technology',
                voice_dna: {
                    formality: 50,
                    energy: 60,
                    humor: 30,
                },
                is_active: true,
                created_at: '2024-01-01T00:00:00Z',
            },
        ]);
    }),

    // Get single brand
    http.get(`${API_URL}/brands/:id`, ({ params }) => {
        const { id } = params;

        if (id === '999') {
            return HttpResponse.json(
                { detail: 'Brand not found' },
                { status: 404 }
            );
        }

        return HttpResponse.json({
            id: Number(id),
            name: 'Test Brand',
            description: 'A test brand',
            industry: 'technology',
            voice_dna: {
                formality: 50,
                energy: 60,
                humor: 30,
                personality_traits: ['professional', 'innovative'],
                communication_styles: ['informative'],
            },
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
        });
    }),

    // Create brand
    http.post(`${API_URL}/brands`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        return HttpResponse.json(
            {
                id: 2,
                ...body,
                is_active: true,
                created_at: new Date().toISOString(),
            },
            { status: 201 }
        );
    }),

    // Update brand
    http.patch(`${API_URL}/brands/:id`, async ({ params, request }) => {
        const body = await request.json() as Record<string, unknown>;
        return HttpResponse.json({
            id: Number(params.id),
            name: 'Test Brand',
            ...body,
            updated_at: new Date().toISOString(),
        });
    }),

    // Delete brand
    http.delete(`${API_URL}/brands/:id`, () => {
        return new HttpResponse(null, { status: 204 });
    }),
];

// ============================================================
// AUTOPILOT HANDLERS
// ============================================================

export const autopilotHandlers = [
    // Get all configs
    http.get(`${API_URL}/autopilot/configs`, () => {
        return HttpResponse.json([
            {
                id: 1,
                brand_id: 1,
                posts_per_week: 5,
                schedule_days: ['monday', 'wednesday', 'friday'],
                schedule_time: '10:00',
                timezone: 'Europe/Warsaw',
                platforms: ['facebook', 'instagram'],
                categories: ['technology', 'business'],
                creativity_level: 60,
                post_length: 'medium',
                include_images: true,
                include_hashtags: true,
                is_active: true,
                is_paused: false,
                total_generated: 50,
                total_published: 45,
                streak_days: 7,
            },
        ]);
    }),

    // Get single config
    http.get(`${API_URL}/autopilot/configs/:id`, ({ params }) => {
        return HttpResponse.json({
            id: Number(params.id),
            brand_id: 1,
            posts_per_week: 5,
            schedule_days: ['monday', 'wednesday', 'friday'],
            schedule_time: '10:00',
            timezone: 'Europe/Warsaw',
            platforms: ['facebook'],
            categories: ['technology'],
            creativity_level: 60,
            post_length: 'medium',
            include_images: true,
            include_hashtags: true,
            is_active: true,
            is_paused: false,
        });
    }),

    // Create config
    http.post(`${API_URL}/autopilot/configs`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        return HttpResponse.json(
            {
                id: 2,
                ...body,
                is_active: false,
                is_paused: false,
                total_generated: 0,
                total_published: 0,
                created_at: new Date().toISOString(),
            },
            { status: 201 }
        );
    }),

    // Update config
    http.patch(`${API_URL}/autopilot/configs/:id`, async ({ params, request }) => {
        const body = await request.json() as Record<string, unknown>;
        return HttpResponse.json({
            id: Number(params.id),
            ...body,
            updated_at: new Date().toISOString(),
        });
    }),

    // Toggle config
    http.post(`${API_URL}/autopilot/configs/:id/toggle`, async ({ params, request }) => {
        const body = await request.json() as { active: boolean };
        return HttpResponse.json({
            id: Number(params.id),
            is_active: body.active,
            is_paused: false,
        });
    }),

    // Delete config
    http.delete(`${API_URL}/autopilot/configs/:id`, () => {
        return new HttpResponse(null, { status: 204 });
    }),

    // Get queue items
    http.get(`${API_URL}/autopilot/configs/:id/queue`, ({ request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');

        const items = [
            {
                id: 1,
                config_id: 1,
                platform: 'facebook',
                content: 'Test post 1 - technology insights',
                hashtags: ['tech', 'innovation'],
                status: 'pending',
                scheduled_for: new Date(Date.now() + 3600000).toISOString(),
                topic_used: 'AI trends',
                created_at: new Date().toISOString(),
            },
            {
                id: 2,
                config_id: 1,
                platform: 'instagram',
                content: 'Test post 2 - business tips',
                hashtags: ['business', 'tips'],
                image_url: 'https://example.com/image.jpg',
                status: 'approved',
                scheduled_for: new Date(Date.now() + 7200000).toISOString(),
                topic_used: 'Productivity',
                created_at: new Date().toISOString(),
            },
            {
                id: 3,
                config_id: 1,
                platform: 'facebook',
                content: 'Test post 3 - published content',
                status: 'published',
                published_at: new Date(Date.now() - 3600000).toISOString(),
                platform_post_id: 'fb_123456',
            },
        ];

        if (status) {
            return HttpResponse.json(items.filter(item => item.status === status));
        }

        return HttpResponse.json(items);
    }),

    // Approve queue item
    http.post(`${API_URL}/autopilot/queue/:id/approve`, ({ params }) => {
        return HttpResponse.json({
            id: Number(params.id),
            status: 'approved',
            updated_at: new Date().toISOString(),
        });
    }),

    // Reject queue item
    http.post(`${API_URL}/autopilot/queue/:id/reject`, async ({ params, request }) => {
        const body = await request.json() as { notes?: string };
        return HttpResponse.json({
            id: Number(params.id),
            status: 'rejected',
            user_notes: body.notes || null,
            updated_at: new Date().toISOString(),
        });
    }),

    // Update queue item
    http.patch(`${API_URL}/autopilot/queue/:id`, async ({ params, request }) => {
        const body = await request.json() as Record<string, unknown>;
        return HttpResponse.json({
            id: Number(params.id),
            ...body,
            edit_count: 1,
            updated_at: new Date().toISOString(),
        });
    }),

    // Delete queue item
    http.delete(`${API_URL}/autopilot/queue/:id`, () => {
        return new HttpResponse(null, { status: 204 });
    }),

    // Generate posts
    http.post(`${API_URL}/autopilot/configs/:id/generate`, async ({ request }) => {
        const body = await request.json() as { count?: number };
        const count = body.count || 3;

        const items = Array.from({ length: count }, (_, i) => ({
            id: 100 + i,
            platform: i % 2 === 0 ? 'facebook' : 'instagram',
            content: `Generated post ${i + 1} content`,
            hashtags: ['generated', 'ai'],
            status: 'pending',
            scheduled_for: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
        }));

        return HttpResponse.json({
            generated: count,
            errors: [],
            items,
        });
    }),

    // Get stats
    http.get(`${API_URL}/autopilot/configs/:id/stats`, () => {
        return HttpResponse.json({
            pending_count: 5,
            approved_count: 10,
            scheduled_count: 3,
            published_today: 2,
            published_this_week: 8,
            rejection_rate: 5.0,
            average_edit_count: 0.5,
        });
    }),

    // Get social status
    http.get(`${API_URL}/autopilot/configs/:id/social-status`, () => {
        return HttpResponse.json({
            facebook: {
                status: 'connected',
                can_auto_publish: true,
                account_type: 'facebook_page',
                account_name: 'Test Page',
            },
            instagram: {
                status: 'connected',
                can_auto_publish: true,
                account_type: 'instagram_business',
                account_name: 'testbusiness',
            },
        });
    }),
];

// ============================================================
// AI HANDLERS
// ============================================================

export const aiHandlers = [
    // Generate text
    http.post(`${API_URL}/ai/generate`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;

        return HttpResponse.json({
            success: true,
            content: `Wygenerowana treść o temacie: ${body.topic || 'ogólnym'}. 
        To jest przykładowy post stworzony przez AI dla platformy ${body.platform || 'social media'}.
        #postlio #ai #generated`,
            hashtags: ['postlio', 'ai', 'generated', 'socialmedia'],
            provider: 'gemini',
            model: 'gemini-2.5-flash',
        });
    }),

    // Generate image
    http.post(`${API_URL}/ai/generate-image`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;

        return HttpResponse.json({
            success: true,
            image_url: `https://picsum.photos/1024/1024?random=${Date.now()}`,
            provider: 'pollinations',
            prompt_used: body.prompt,
        });
    }),

    // Get providers
    http.get(`${API_URL}/ai/providers`, () => {
        return HttpResponse.json({
            text: [
                { name: 'gemini', available: true, is_default: true, models: ['gemini-2.5-flash'] },
                { name: 'groq', available: true, is_default: false, models: ['llama-3.3-70b'] },
            ],
            image: [
                { name: 'pollinations', available: true, is_default: true },
                { name: 'huggingface', available: true, is_default: false },
            ],
        });
    }),
];

// ============================================================
// SOCIAL HANDLERS
// ============================================================

export const socialHandlers = [
    // Get connected accounts
    http.get(`${API_URL}/social/accounts`, () => {
        return HttpResponse.json([
            {
                id: 1,
                platform: 'facebook',
                account_type: 'facebook_page',
                platform_username: 'testpage',
                page_name: 'Test Page',
                is_active: true,
                posts_published: 25,
                last_used_at: new Date().toISOString(),
            },
            {
                id: 2,
                platform: 'instagram',
                account_type: 'instagram_business',
                platform_username: 'testbusiness',
                is_active: true,
                posts_published: 30,
                last_used_at: new Date().toISOString(),
            },
            {
                id: 3,
                platform: 'linkedin',
                account_type: 'linkedin_profile',
                platform_username: 'testprofile',
                is_active: true,
                posts_published: 15,
            },
        ]);
    }),

    // Disconnect account
    http.delete(`${API_URL}/social/accounts/:id`, () => {
        return new HttpResponse(null, { status: 204 });
    }),

    // OAuth callback (simplified)
    http.get(`${API_URL}/auth/callback/:platform`, ({ params }) => {
        return HttpResponse.json({
            success: true,
            platform: params.platform,
            account: {
                id: 10,
                platform: params.platform,
                platform_username: 'newaccount',
                is_active: true,
            },
        });
    }),
];

// ============================================================
// POSTS HANDLERS
// ============================================================

export const postsHandlers = [
    // Get posts
    http.get(`${API_URL}/posts`, () => {
        return HttpResponse.json([
            {
                id: 1,
                content: 'Manual post content',
                platforms: ['facebook', 'instagram'],
                status: 'draft',
                created_at: new Date().toISOString(),
            },
        ]);
    }),

    // Create post
    http.post(`${API_URL}/posts`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        return HttpResponse.json(
            {
                id: 2,
                ...body,
                status: 'draft',
                created_at: new Date().toISOString(),
            },
            { status: 201 }
        );
    }),

    // Get calendar data
    http.get(`${API_URL}/posts/calendar`, () => {
        // Return posts for the date range
        return HttpResponse.json([
            {
                id: 1,
                content: 'Scheduled post',
                platforms: ['facebook'],
                scheduled_for: new Date(Date.now() + 86400000).toISOString(),
                status: 'scheduled',
            },
        ]);
    }),
];

// ============================================================
// ALL HANDLERS
// ============================================================

export const handlers = [
    ...authHandlers,
    ...brandsHandlers,
    ...autopilotHandlers,
    ...aiHandlers,
    ...socialHandlers,
    ...postsHandlers,
];