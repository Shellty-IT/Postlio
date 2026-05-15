// src/app/page.tsx
import { AnimatedBackground } from '@/components/landing/animated-background';
import { LandingHeader } from '@/components/landing/landing-header';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { HowItWorksSection } from '@/components/landing/how-it-works-section';
import { PricingSection } from '@/components/landing/pricing-section';
import { FAQSection } from '@/components/landing/faq-section';
import { FinalCTASection } from '@/components/landing/final-cta-section';
import { LandingFooter } from '@/components/landing/landing-footer';
import { ScrollToTop } from '@/components/landing/scroll-to-top';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Postlio - AI Social Media Manager | Automatyzacja postów',
    description: 'Twórz i publikuj posty na social media z pomocą sztucznej inteligencji. Autopilot AI, Brand Voice DNA, planowanie treści. Zacznij za darmo!',
    keywords: [
        'social media manager',
        'AI content',
        'automatyzacja postów',
        'Facebook',
        'Instagram',
        'LinkedIn',
        'sztuczna inteligencja',
        'marketing',
        'Postlio',
        'autopilot',
        'Brand Voice DNA',
    ],
    authors: [{ name: 'Postlio Team' }],
    creator: 'Postlio',
    openGraph: {
        title: 'Postlio - AI Social Media Manager',
        description: 'Twórz i publikuj posty na social media z pomocą sztucznej inteligencji. Autopilot AI, Brand Voice DNA, planowanie treści.',
        type: 'website',
        locale: 'pl_PL',
        siteName: 'Postlio',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Postlio - AI Social Media Manager',
        description: 'Twórz i publikuj posty na social media z pomocą AI.',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function LandingPage() {
    return (
        <>
            <main className="relative min-h-screen bg-background">
                {/* Animated Background */}
                <AnimatedBackground />

                {/* Header */}
                <LandingHeader />

                {/* Hero Section */}
                <HeroSection />

                {/* Social Proof Bar - USUNIĘTY (brak statystyk na start) */}
                {/* <SocialProofBar /> */}

                {/* Features Section */}
                <FeaturesSection />

                {/* How It Works Section */}
                <HowItWorksSection />

                {/* Pricing Section */}
                <PricingSection />

                {/* Testimonials Section - USUNIĘTY (brak opinii na start) */}
                {/* <TestimonialsSection /> */}

                {/* FAQ Section */}
                <FAQSection />

                {/* Final CTA Section */}
                <FinalCTASection />
            </main>

            {/* Footer */}
            <LandingFooter />

            {/* Scroll to Top Button */}
            <ScrollToTop />
        </>
    );
}