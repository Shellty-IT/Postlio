/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            // ============================================
            // AI Image Providers
            // ============================================
            // Pollinations AI
            {
                protocol: 'https',
                hostname: 'image.pollinations.ai',
            },
            // HuggingFace
            {
                protocol: 'https',
                hostname: '*.huggingface.co',
            },
            {
                protocol: 'https',
                hostname: 'huggingface.co',
            },
            // ClipDrop
            {
                protocol: 'https',
                hostname: 'clipdrop-api.co',
            },
            {
                protocol: 'https',
                hostname: '*.clipdrop-api.co',
            },

            // ============================================
            // Social Media Platforms
            // ============================================
            // Facebook - profile pictures
            {
                protocol: 'https',
                hostname: 'platform-lookaside.fbsbx.com',
            },
            {
                protocol: 'https',
                hostname: '*.fbsbx.com',
            },
            {
                protocol: 'https',
                hostname: 'graph.facebook.com',
            },
            {
                protocol: 'https',
                hostname: '*.facebook.com',
            },
            {
                protocol: 'https',
                hostname: 'scontent.*.fbcdn.net',
            },
            {
                protocol: 'https',
                hostname: '*.fbcdn.net',
            },
            // Instagram
            {
                protocol: 'https',
                hostname: '*.cdninstagram.com',
            },
            {
                protocol: 'https',
                hostname: '*.instagram.com',
            },
            // LinkedIn
            {
                protocol: 'https',
                hostname: '*.licdn.com',
            },
            {
                protocol: 'https',
                hostname: 'media.licdn.com',
            },

            // ============================================
            // Other Sources
            // ============================================
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: '*.githubusercontent.com',
            },
        ],
    },
};

export default nextConfig;