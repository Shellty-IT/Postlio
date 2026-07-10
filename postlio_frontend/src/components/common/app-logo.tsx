import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AppLogoProps {
    className?: string;
    imageClassName?: string;
}

export function AppLogo({ className, imageClassName }: AppLogoProps) {
    return (
        <span className={cn('inline-flex items-center justify-center', className)}>
            <Image
                src="/postlio.png"
                alt="Postlio"
                width={96}
                height={96}
                className={cn('h-full w-full object-contain', imageClassName)}
            />
        </span>
    );
}
