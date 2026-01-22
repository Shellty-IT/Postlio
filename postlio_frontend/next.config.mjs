/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
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
            // Opcjonalne - popularne źródła obrazów
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