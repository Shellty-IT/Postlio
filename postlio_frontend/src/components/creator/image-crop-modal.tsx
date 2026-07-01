// src/components/creator/image-crop-modal.tsx

'use client';

import { useState, useCallback, useEffect } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Check,
    X,
    Square,
    RectangleHorizontal,
    Smartphone,
    Facebook,
    Instagram,
    Linkedin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Platform } from '@/types';

interface ImageCropModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    imageSrc: string;
    onCropComplete: (croppedImageUrl: string) => void;
    initialPlatform?: Platform;
}

interface AspectRatioOption {
    label: string;
    value: number;
    icon: React.ReactNode;
    description: string;
}

const ASPECT_RATIOS: Record<string, AspectRatioOption> = {
    square: {
        label: '1:1',
        value: 1,
        icon: <Square className="h-4 w-4" />,
        description: 'Instagram, Facebook',
    },
    landscape: {
        label: '16:9',
        value: 16 / 9,
        icon: <RectangleHorizontal className="h-4 w-4" />,
        description: 'Facebook, LinkedIn',
    },
    portrait: {
        label: '4:5',
        value: 4 / 5,
        icon: <Smartphone className="h-4 w-4" />,
        description: 'Instagram portrait',
    },
    story: {
        label: '9:16',
        value: 9 / 16,
        icon: <Smartphone className="h-4 w-4 rotate-0" />,
        description: 'Stories, Reels',
    },
};

const PLATFORM_ASPECTS: Record<Platform, string> = {
    instagram: 'square',
    facebook: 'landscape',
    linkedin: 'landscape',
};

async function getCroppedImg(
    imageSrc: string,
    pixelCrop: Area
): Promise<string> {
    const image = new Image();
    image.src = imageSrc;

    await new Promise((resolve) => {
        image.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(URL.createObjectURL(blob));
            }
        }, 'image/jpeg', 0.95);
    });
}

export function ImageCropModal({
                                   open,
                                   onOpenChange,
                                   imageSrc,
                                   onCropComplete,
                                   initialPlatform = 'facebook',
                               }: ImageCropModalProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [selectedAspect, setSelectedAspect] = useState(PLATFORM_ASPECTS[initialPlatform]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewTab, setPreviewTab] = useState<Platform>(initialPlatform);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const aspectRatio = ASPECT_RATIOS[selectedAspect].value;

    const onCropChange = useCallback((location: Point) => {
        setCrop(location);
    }, []);

    const onZoomChange = useCallback((newZoom: number) => {
        setZoom(newZoom);
    }, []);

    const onCropAreaComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleReset = useCallback(() => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
    }, []);

    const handleConfirm = useCallback(async () => {
        if (!croppedAreaPixels) return;

        setIsProcessing(true);
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropComplete(croppedImage);
            onOpenChange(false);
        } catch (error) {
            console.error('Error cropping image:', error);
        } finally {
            setIsProcessing(false);
        }
    }, [croppedAreaPixels, imageSrc, onCropComplete, onOpenChange]);

    const handleCancel = useCallback(() => {
        handleReset();
        onOpenChange(false);
    }, [handleReset, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-[calc(100vw-1rem)] xs:w-[calc(100vw-2rem)] p-0 overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
                <DialogHeader className="p-3 xs:p-4 sm:p-6 pb-0 flex-shrink-0">
                    <DialogTitle className="text-base sm:text-lg">Edytuj obraz</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                        Dostosuj kadr, zoom i proporcje obrazu
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 p-3 xs:p-4 sm:p-6 pt-2 sm:pt-4">
                        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                            <div className="relative h-[220px] xs:h-[260px] sm:h-[320px] lg:h-[400px] bg-black rounded-2xl overflow-hidden border border-white/10">
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={aspectRatio}
                                    onCropChange={onCropChange}
                                    onZoomChange={onZoomChange}
                                    onCropComplete={onCropAreaComplete}
                                    showGrid
                                    classes={{
                                        containerClassName: 'rounded-2xl',
                                    }}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1.5 sm:space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
                                            <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            Przybliżenie
                                        </Label>
                                        <span className="text-xs sm:text-sm text-muted-foreground">
                      {Math.round(zoom * 100)}%
                    </span>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <ZoomOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                        <Slider
                                            value={[zoom]}
                                            min={1}
                                            max={3}
                                            step={0.1}
                                            onValueChange={([value]) => setZoom(value)}
                                            className="flex-1"
                                        />
                                        <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReset}
                                    className="gap-1.5 h-8 sm:h-9 text-xs sm:text-sm"
                                >
                                    <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    Resetuj
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3 sm:space-y-4">
                            <div className="space-y-1.5 sm:space-y-2">
                                <Label className="text-xs sm:text-sm font-medium">Proporcje</Label>
                                <div className="grid grid-cols-4 lg:grid-cols-2 gap-1.5 sm:gap-2">
                                    {Object.entries(ASPECT_RATIOS).map(([key, option]) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedAspect(key)}
                                            className={cn(
                                                'flex flex-col items-center gap-0.5 sm:gap-1 p-2 sm:p-3 rounded-[14px] border transition-all min-h-[44px]',
                                                'hover:bg-white/[0.04] active:bg-white/[0.06]',
                                                selectedAspect === key
                                                    ? 'border-primary/40 bg-primary/[0.06]'
                                                    : 'border-white/[0.07]'
                                            )}
                                        >
                                            <div className={cn(
                                                'p-1 sm:p-2 rounded-md',
                                                selectedAspect === key ? 'bg-primary/10 text-primary' : 'bg-muted'
                                            )}>
                                                {option.icon}
                                            </div>
                                            <span className="text-[10px] xs:text-xs sm:text-sm font-medium">{option.label}</span>
                                            <span className="text-[8px] xs:text-[10px] sm:text-xs text-muted-foreground text-center leading-tight hidden xs:block">
                        {option.description}
                      </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {!isMobile && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Podgląd platformy</Label>
                                    <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as Platform)}>
                                        <TabsList className="grid w-full grid-cols-3">
                                            <TabsTrigger value="facebook" className="gap-1">
                                                <Facebook className="h-3 w-3" />
                                                <span className="hidden sm:inline">FB</span>
                                            </TabsTrigger>
                                            <TabsTrigger value="instagram" className="gap-1">
                                                <Instagram className="h-3 w-3" />
                                                <span className="hidden sm:inline">IG</span>
                                            </TabsTrigger>
                                            <TabsTrigger value="linkedin" className="gap-1">
                                                <Linkedin className="h-3 w-3" />
                                                <span className="hidden sm:inline">LI</span>
                                            </TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="facebook" className="mt-2">
                                            <div className="rounded-lg border bg-white p-2">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-500" />
                                                    <div>
                                                        <div className="text-xs font-medium text-gray-900">Twoja strona</div>
                                                        <div className="text-[10px] text-gray-500">Właśnie teraz</div>
                                                    </div>
                                                </div>
                                                <div
                                                    className="w-full bg-gray-100 rounded overflow-hidden"
                                                    style={{ aspectRatio: '16/9' }}
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={imageSrc}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="instagram" className="mt-2">
                                            <div className="rounded-lg border bg-white p-2">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500" />
                                                    <div className="text-xs font-medium text-gray-900">twoj_profil</div>
                                                </div>
                                                <div
                                                    className="w-full bg-gray-100 rounded overflow-hidden"
                                                    style={{ aspectRatio: '1/1' }}
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={imageSrc}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="linkedin" className="mt-2">
                                            <div className="rounded-lg border bg-white p-2">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-700" />
                                                    <div>
                                                        <div className="text-xs font-medium text-gray-900">Twój profil</div>
                                                        <div className="text-[10px] text-gray-500">Teraz • 🌐</div>
                                                    </div>
                                                </div>
                                                <div
                                                    className="w-full bg-gray-100 rounded overflow-hidden"
                                                    style={{ aspectRatio: '1.91/1' }}
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={imageSrc}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </Tabs>

                                    <p className="text-xs text-muted-foreground text-center">
                                        Podgląd przybliżony. Rzeczywisty wygląd może się różnić.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-3 xs:p-4 sm:p-6 pt-2 sm:pt-0 gap-2 flex-shrink-0 border-t sm:border-t-0">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isProcessing}
                        className="h-9 sm:h-10 text-xs sm:text-sm flex-1 sm:flex-none"
                    >
                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        Anuluj
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className="btn-gradient h-9 sm:h-10 text-xs sm:text-sm flex-1 sm:flex-none"
                    >
                        {isProcessing ? (
                            <>
                                <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Przetwarzanie...
                            </>
                        ) : (
                            <>
                                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                Zastosuj
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ImageCropModal;