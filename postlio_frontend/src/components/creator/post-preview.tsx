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
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PostPreviewProps {
    content: string;
    platforms: Platform[];
    imageUrl?: string;
    brandName?: string;
    brandLogo?: string;
}

// Facebook Preview
function FacebookPreview({ content, imageUrl, brandName, brandLogo }: Omit<PostPreviewProps, 'platforms'>) {
    return (
        <div className="bg-white dark:bg-[#242526] rounded-lg overflow-hidden shadow">
            {/* Header */}
            <div className="flex items-center gap-3 p-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold overflow-hidden">
                    {brandLogo ? (
                        <Image
                            src={brandLogo}
                            alt={brandName || 'Brand'}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        brandName?.charAt(0) || 'P'
                    )}
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-sm text-[#050505] dark:text-[#E4E6EB]">
                        {brandName || 'Twoja Marka'}
                    </p>
                    <p className="text-xs text-[#65676B] dark:text-[#B0B3B8]">Teraz · 🌐</p>
                </div>
                <MoreHorizontal className="h-5 w-5 text-[#65676B]" />
            </div>

            {/* Content */}
            <div className="px-3 pb-3">
                <p className="text-sm text-[#050505] dark:text-[#E4E6EB] whitespace-pre-wrap">
                    {content || 'Podgląd Twojego posta pojawi się tutaj...'}
                </p>
            </div>

            {/* Image */}
            {imageUrl && (
                <div className="relative aspect-video bg-muted">
                    <Image
                        src={imageUrl}
                        alt="Post image"
                        fill
                        className="object-cover"
                    />
                </div>
            )}

            {/* Actions */}
            <div className="px-3 py-2 border-t border-[#CED0D4] dark:border-[#3E4042]">
                <div className="flex justify-around">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] transition-colors">
                        <ThumbsUp className="h-5 w-5 text-[#65676B] dark:text-[#B0B3B8]" />
                        <span className="text-sm font-medium text-[#65676B] dark:text-[#B0B3B8]">Lubię to</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] transition-colors">
                        <MessageCircle className="h-5 w-5 text-[#65676B] dark:text-[#B0B3B8]" />
                        <span className="text-sm font-medium text-[#65676B] dark:text-[#B0B3B8]">Komentarz</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] transition-colors">
                        <Share2 className="h-5 w-5 text-[#65676B] dark:text-[#B0B3B8]" />
                        <span className="text-sm font-medium text-[#65676B] dark:text-[#B0B3B8]">Udostępnij</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// Instagram Preview
function InstagramPreview({ content, imageUrl, brandName, brandLogo }: Omit<PostPreviewProps, 'platforms'>) {
    return (
        <div className="bg-white dark:bg-black rounded-lg overflow-hidden border border-[#DBDBDB] dark:border-[#262626]">
            {/* Header */}
            <div className="flex items-center gap-3 p-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] p-0.5">
                    <div className="h-full w-full rounded-full bg-white dark:bg-black flex items-center justify-center overflow-hidden">
                        {brandLogo ? (
                            <Image
                                src={brandLogo}
                                alt={brandName || 'Brand'}
                                width={28}
                                height={28}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-xs font-bold">{brandName?.charAt(0) || 'P'}</span>
                        )}
                    </div>
                </div>
                <p className="font-semibold text-sm flex-1">{brandName?.toLowerCase().replace(/\s/g, '') || 'twoja_marka'}</p>
                <MoreHorizontal className="h-5 w-5" />
            </div>

            {/* Image */}
            <div className="relative aspect-square bg-muted">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt="Post image"
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Instagram className="h-12 w-12" />
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                        <Heart className="h-6 w-6" />
                        <MessageCircle className="h-6 w-6" />
                        <Send className="h-6 w-6" />
                    </div>
                    <Bookmark className="h-6 w-6" />
                </div>

                {/* Content */}
                <div>
                    <p className="text-sm">
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

// LinkedIn Preview
function LinkedInPreview({ content, imageUrl, brandName, brandLogo }: Omit<PostPreviewProps, 'platforms'>) {
    return (
        <div className="bg-white dark:bg-[#1B1F23] rounded-lg overflow-hidden border border-[#E0E0E0] dark:border-[#38434F]">
            {/* Header */}
            <div className="flex items-start gap-3 p-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold overflow-hidden">
                    {brandLogo ? (
                        <Image
                            src={brandLogo}
                            alt={brandName || 'Brand'}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        brandName?.charAt(0) || 'P'
                    )}
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-sm">{brandName || 'Twoja Marka'}</p>
                    <p className="text-xs text-[#666666] dark:text-[#FFFFFFA6]">1,234 obserwujących</p>
                    <p className="text-xs text-[#666666] dark:text-[#FFFFFFA6]">Teraz · 🌐</p>
                </div>
                <MoreHorizontal className="h-5 w-5 text-[#666666]" />
            </div>

            {/* Content */}
            <div className="px-4 pb-3">
                <p className="text-sm whitespace-pre-wrap">
                    {content || 'Podgląd Twojego posta pojawi się tutaj...'}
                </p>
            </div>

            {/* Image */}
            {imageUrl && (
                <div className="relative aspect-video bg-muted">
                    <Image
                        src={imageUrl}
                        alt="Post image"
                        fill
                        className="object-cover"
                    />
                </div>
            )}

            {/* Stats */}
            <div className="px-4 py-2 flex items-center gap-1 text-xs text-[#666666] dark:text-[#FFFFFFA6]">
        <span className="flex -space-x-1">
          <span className="h-4 w-4 rounded-full bg-[#0A66C2] flex items-center justify-center">
            <ThumbsUp className="h-2.5 w-2.5 text-white" />
          </span>
          <span className="h-4 w-4 rounded-full bg-[#E7A33E] flex items-center justify-center">
            <Heart className="h-2.5 w-2.5 text-white" />
          </span>
        </span>
                <span>24</span>
            </div>

            {/* Actions */}
            <div className="px-2 py-1 border-t border-[#E0E0E0] dark:border-[#38434F]">
                <div className="flex justify-around">
                    <button className="flex items-center gap-2 px-4 py-3 rounded hover:bg-[#F0F0F0] dark:hover:bg-[#38434F] transition-colors">
                        <ThumbsUp className="h-5 w-5 text-[#666666] dark:text-[#FFFFFFA6]" />
                        <span className="text-sm font-medium text-[#666666] dark:text-[#FFFFFFA6]">Lubię to</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-3 rounded hover:bg-[#F0F0F0] dark:hover:bg-[#38434F] transition-colors">
                        <MessageCircle className="h-5 w-5 text-[#666666] dark:text-[#FFFFFFA6]" />
                        <span className="text-sm font-medium text-[#666666] dark:text-[#FFFFFFA6]">Komentarz</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-3 rounded hover:bg-[#F0F0F0] dark:hover:bg-[#38434F] transition-colors">
                        <Share2 className="h-5 w-5 text-[#666666] dark:text-[#FFFFFFA6]" />
                        <span className="text-sm font-medium text-[#666666] dark:text-[#FFFFFFA6]">Udostępnij</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// Main Component
export function PostPreview({ content, platforms, imageUrl, brandName, brandLogo }: PostPreviewProps) {
    const platformIcons: Record<Platform, React.ReactNode> = {
        facebook: <Facebook className="h-4 w-4" />,
        instagram: <Instagram className="h-4 w-4" />,
        linkedin: <Linkedin className="h-4 w-4" />,
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium">Podgląd</h3>

            <Tabs defaultValue={platforms[0]} className="w-full">
                <TabsList className="w-full justify-start bg-muted/50">
                    {platforms.map((platform) => (
                        <TabsTrigger
                            key={platform}
                            value={platform}
                            className={cn(
                                'gap-2 capitalize',
                                platform === 'facebook' && 'data-[state=active]:text-[#1877F2]',
                                platform === 'instagram' && 'data-[state=active]:text-[#E4405F]',
                                platform === 'linkedin' && 'data-[state=active]:text-[#0A66C2]'
                            )}
                        >
                            {platformIcons[platform]}
                            {platform}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="facebook" className="mt-4">
                    <FacebookPreview content={content} imageUrl={imageUrl} brandName={brandName} brandLogo={brandLogo} />
                </TabsContent>
                <TabsContent value="instagram" className="mt-4">
                    <InstagramPreview content={content} imageUrl={imageUrl} brandName={brandName} brandLogo={brandLogo} />
                </TabsContent>
                <TabsContent value="linkedin" className="mt-4">
                    <LinkedInPreview content={content} imageUrl={imageUrl} brandName={brandName} brandLogo={brandLogo} />
                </TabsContent>
            </Tabs>
        </div>
    );
}