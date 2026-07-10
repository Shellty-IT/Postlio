// src/components/creator/post-preview.tsx

'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Platform } from '@/types';
import {
    Facebook,
    Instagram,
    Linkedin,
    Heart,
    MessageCircle,
    Share2,
    Send,
    Bookmark,
    ThumbsUp,
    MoreHorizontal,
    Film,
    Play,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PostPreviewProps {
    content: string;
    platforms: Platform[];
    imageUrl?: string;
    videoUrl?: string;
    brandName?: string;
    brandLogo?: string;
}

function PreviewMedia({ imageUrl, videoUrl, aspectRatio = 'video' }: { imageUrl?: string; videoUrl?: string; aspectRatio?: 'video' | 'square' }) {
    const aspectClass = aspectRatio === 'square' ? 'aspect-square' : 'aspect-video';

    if (videoUrl) {
        return (
            <div className={`relative ${aspectClass} bg-black overflow-hidden`}>
                <video
                    src={videoUrl}
                    controls
                    playsInline
                    className="absolute inset-0 w-full h-full object-contain"
                />
                <div className="absolute top-2 left-2 pointer-events-none">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px]">
                        <Film className="w-2.5 h-2.5" />
                        Wideo
                    </div>
                </div>
            </div>
        );
    }

    if (imageUrl) {
        return (
            <div className={`relative ${aspectClass} bg-muted overflow-hidden`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={imageUrl}
                    alt="Post image"
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                />
            </div>
        );
    }

    return null;
}

function FacebookPreview({ content, imageUrl, videoUrl, brandName, brandLogo }: Omit<PostPreviewProps, 'platforms'>) {
    const hasMedia = !!imageUrl || !!videoUrl;

    return (
        <div className="bg-white dark:bg-[#242526] rounded-lg overflow-hidden shadow">
            <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xs sm:text-sm overflow-hidden flex-shrink-0">
                    {brandLogo ? (
                        <Image
                            src={brandLogo}
                            alt={brandName || 'Brand'}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                            unoptimized
                        />
                    ) : (
                        brandName?.charAt(0) || 'P'
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs sm:text-sm text-[#050505] dark:text-[#E4E6EB] truncate">
                        {brandName || 'Twoja Marka'}
                    </p>
                    <p className="text-[10px] xs:text-xs text-[#65676B] dark:text-[#B0B3B8]">Teraz · 🌐</p>
                </div>
                <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5 text-[#65676B] flex-shrink-0" />
            </div>

            <div className="px-2.5 sm:px-3 pb-2.5 sm:pb-3">
                <p className="text-xs sm:text-sm text-[#050505] dark:text-[#E4E6EB] whitespace-pre-wrap">
                    {content || 'Podgląd Twojego posta pojawi się tutaj...'}
                </p>
            </div>

            {hasMedia && <PreviewMedia imageUrl={imageUrl} videoUrl={videoUrl} aspectRatio="video" />}

            <div className="px-2 sm:px-3 py-1.5 sm:py-2 border-t border-[#CED0D4] dark:border-[#3E4042]">
                <div className="flex justify-around">
                    <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] transition-colors">
                        <ThumbsUp className="h-4 w-4 sm:h-5 sm:w-5 text-[#65676B] dark:text-[#B0B3B8]" />
                        <span className="text-[10px] xs:text-xs sm:text-sm font-medium text-[#65676B] dark:text-[#B0B3B8]">Lubię to</span>
                    </button>
                    <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] transition-colors">
                        <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#65676B] dark:text-[#B0B3B8]" />
                        <span className="hidden xs:inline text-xs sm:text-sm font-medium text-[#65676B] dark:text-[#B0B3B8]">Komentarz</span>
                    </button>
                    <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] transition-colors">
                        <Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#65676B] dark:text-[#B0B3B8]" />
                        <span className="hidden xs:inline text-xs sm:text-sm font-medium text-[#65676B] dark:text-[#B0B3B8]">Udostępnij</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

function InstagramPreview({ content, imageUrl, videoUrl, brandName, brandLogo }: Omit<PostPreviewProps, 'platforms'>) {
    const hasMedia = !!imageUrl || !!videoUrl;

    return (
        <div className="bg-white dark:bg-black rounded-lg overflow-hidden border border-[#DBDBDB] dark:border-[#262626]">
            <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] p-0.5">
                    <div className="h-full w-full rounded-full bg-white dark:bg-black flex items-center justify-center overflow-hidden">
                        {brandLogo ? (
                            <Image
                                src={brandLogo}
                                alt={brandName || 'Brand'}
                                width={28}
                                height={28}
                                className="h-full w-full object-cover"
                                unoptimized
                            />
                        ) : (
                            <span className="text-[10px] xs:text-xs font-bold">{brandName?.charAt(0) || 'P'}</span>
                        )}
                    </div>
                </div>
                <p className="font-semibold text-xs sm:text-sm flex-1 truncate">{brandName?.toLowerCase().replace(/\s/g, '') || 'twoja_marka'}</p>
                <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            </div>

            <div className="relative aspect-square bg-muted">
                {videoUrl ? (
                    <>
                        <video
                            src={videoUrl}
                            controls
                            playsInline
                            className="absolute inset-0 w-full h-full object-contain bg-black"
                        />
                        <div className="absolute top-2 right-2 pointer-events-none">
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px]">
                                <Play className="w-2.5 h-2.5" />
                                Reels
                            </div>
                        </div>
                    </>
                ) : imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageUrl}
                        alt="Post image"
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Instagram className="h-8 w-8 sm:h-12 sm:w-12" />
                    </div>
                )}
            </div>

            <div className="p-2.5 sm:p-3">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
                        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                        <Send className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <Bookmark className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>

                <div>
                    <p className="text-xs sm:text-sm">
            <span className="font-semibold mr-1">
              {brandName?.toLowerCase().replace(/\s/g, '') || 'twoja_marka'}
            </span>
                        {content || 'Podgląd Twojego posta pojawi się tutaj...'}
                    </p>
                </div>
            </div>
        </div>
    );
}

function LinkedInPreview({ content, imageUrl, videoUrl, brandName, brandLogo }: Omit<PostPreviewProps, 'platforms'>) {
    const hasMedia = !!imageUrl || !!videoUrl;

    return (
        <div className="bg-white dark:bg-[#1B1F23] rounded-lg overflow-hidden border border-[#E0E0E0] dark:border-[#38434F]">
            <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4">
                <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xs sm:text-sm overflow-hidden flex-shrink-0">
                    {brandLogo ? (
                        <Image
                            src={brandLogo}
                            alt={brandName || 'Brand'}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                            unoptimized
                        />
                    ) : (
                        brandName?.charAt(0) || 'P'
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs sm:text-sm truncate">{brandName || 'Twoja Marka'}</p>
                    <p className="text-[10px] xs:text-xs text-[#666666] dark:text-[#FFFFFFA6]">1,234 obserwujących</p>
                    <p className="text-[10px] xs:text-xs text-[#666666] dark:text-[#FFFFFFA6]">Teraz · 🌐</p>
                </div>
                <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5 text-[#666666] flex-shrink-0" />
            </div>

            <div className="px-3 sm:px-4 pb-2.5 sm:pb-3">
                <p className="text-xs sm:text-sm whitespace-pre-wrap">
                    {content || 'Podgląd Twojego posta pojawi się tutaj...'}
                </p>
            </div>

            {hasMedia && <PreviewMedia imageUrl={imageUrl} videoUrl={videoUrl} aspectRatio="video" />}

            <div className="px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1 text-[10px] xs:text-xs text-[#666666] dark:text-[#FFFFFFA6]">
        <span className="flex -space-x-1">
          <span className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-[#0A66C2] flex items-center justify-center">
            <ThumbsUp className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white" />
          </span>
          <span className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-[#E7A33E] flex items-center justify-center">
            <Heart className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white" />
          </span>
        </span>
                <span>24</span>
            </div>

            <div className="px-1.5 sm:px-2 py-1 border-t border-[#E0E0E0] dark:border-[#38434F]">
                <div className="flex justify-around">
                    <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded hover:bg-[#F0F0F0] dark:hover:bg-[#38434F] transition-colors">
                        <ThumbsUp className="h-4 w-4 sm:h-5 sm:w-5 text-[#666666] dark:text-[#FFFFFFA6]" />
                        <span className="text-[10px] xs:text-xs sm:text-sm font-medium text-[#666666] dark:text-[#FFFFFFA6]">Lubię to</span>
                    </button>
                    <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded hover:bg-[#F0F0F0] dark:hover:bg-[#38434F] transition-colors">
                        <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#666666] dark:text-[#FFFFFFA6]" />
                        <span className="hidden xs:inline text-xs sm:text-sm font-medium text-[#666666] dark:text-[#FFFFFFA6]">Komentarz</span>
                    </button>
                    <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded hover:bg-[#F0F0F0] dark:hover:bg-[#38434F] transition-colors">
                        <Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#666666] dark:text-[#FFFFFFA6]" />
                        <span className="hidden xs:inline text-xs sm:text-sm font-medium text-[#666666] dark:text-[#FFFFFFA6]">Udostępnij</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export function PostPreview({ content, platforms, imageUrl, videoUrl, brandName, brandLogo }: PostPreviewProps) {
    const platformIcons: Record<Platform, React.ReactNode> = {
        facebook: <Facebook className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
        instagram: <Instagram className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
        linkedin: <Linkedin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
    };

    return (
        <div className="space-y-3 sm:space-y-4">
            <h3 className="mono-label">Podgląd</h3>

            <Tabs defaultValue={platforms[0]} className="w-full">
                <TabsList className="w-full justify-start bg-white/[0.03] border border-white/[0.06]">
                    {platforms.map((platform) => (
                        <TabsTrigger
                            key={platform}
                            value={platform}
                            className={cn(
                                'gap-1.5 sm:gap-2 text-xs sm:text-sm capitalize',
                                platform === 'facebook' && 'data-[state=active]:text-[#1877F2]',
                                platform === 'instagram' && 'data-[state=active]:text-[#E4405F]',
                                platform === 'linkedin' && 'data-[state=active]:text-[#0A66C2]'
                            )}
                        >
                            {platformIcons[platform]}
                            <span className="hidden xs:inline">{platform}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="facebook" className="mt-3 sm:mt-4">
                    <FacebookPreview content={content} imageUrl={imageUrl} videoUrl={videoUrl} brandName={brandName} brandLogo={brandLogo} />
                </TabsContent>
                <TabsContent value="instagram" className="mt-3 sm:mt-4">
                    <InstagramPreview content={content} imageUrl={imageUrl} videoUrl={videoUrl} brandName={brandName} brandLogo={brandLogo} />
                </TabsContent>
                <TabsContent value="linkedin" className="mt-3 sm:mt-4">
                    <LinkedInPreview content={content} imageUrl={imageUrl} videoUrl={videoUrl} brandName={brandName} brandLogo={brandLogo} />
                </TabsContent>
            </Tabs>
        </div>
    );
}