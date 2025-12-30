'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { FeatureCard } from './feature-card';
import {
    Sparkles,
    Calendar,
    Palette,
    Zap,
    BarChart3,
    Users
} from 'lucide-react';

const features = [
    {
        icon: Sparkles,
        title: 'Autopilot AI',
        description: 'Ustaw harmonogram i pozwól AI tworzyć treści automatycznie. Ty zatwierdzasz, my publikujemy.',
        gradient: 'bg-gradient-to-br from-violet-500/5 to-purple-500/5',
    },
    {
        icon: Palette,
        title: 'Brand Voice DNA',
        description: 'Zdefiniuj unikalny głos marki. AI nauczy się Twojego stylu i będzie pisać jak Ty.',
        gradient: 'bg-gradient-to-br from-pink-500/5 to-rose-500/5',
    },
    {
        icon: Calendar,
        title: 'Smart Kalendarz',
        description: 'Planuj posty z wyprzedzeniem. Drag & drop, widok tygodniowy i miesięczny, automatyczne publikowanie.',
        gradient: 'bg-gradient-to-br from-blue-500/5 to-cyan-500/5',
    },
    {
        icon: Zap,
        title: 'Multi-Provider AI',
        description: 'Wybierz swojego ulubionego dostawcę AI. Gemini, Groq, lub inny - Ty decydujesz.',
        gradient: 'bg-gradient-to-br from-yellow-500/5 to-orange-500/5',
    },
    {
        icon: BarChart3,
        title: 'Analityka & Insights',
        description: 'Śledź zaangażowanie, zasięgi i trendy. Dowiedz się, co działa najlepiej dla Twojej marki.',
        gradient: 'bg-gradient-to-br from-green-500/5 to-emerald-500/5',
    },
    {
        icon: Users,
        title: 'Multi-Platform',
        description: 'Facebook, Instagram, LinkedIn - zarządzaj wszystkimi kanałami z jednego miejsca.',
        gradient: 'bg-gradient-to-br from-indigo-500/5 to-blue-500/5',
    },
];

export function FeaturesSection() {
    return (
        <section id="features" className="py-24 md:py-32 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl -z-10" />

            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <Badge
                            variant="secondary"
                            className="mb-4 px-4 py-2 bg-primary/10 text-primary border-primary/20"
                        >
                            Funkcje
                        </Badge>
                    </motion.div>

                    <motion.h2
                        className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        Wszystko czego potrzebujesz do{' '}
                        <span className="text-primary">sukcesu w social media</span>
                    </motion.h2>

                    <motion.p
                        className="text-lg text-muted-foreground"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        Postlio łączy moc sztucznej inteligencji z intuicyjnym interfejsem,
                        dając Ci pełną kontrolę nad obecnością Twojej marki w sieci.
                    </motion.p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {features.map((feature, index) => (
                        <FeatureCard
                            key={index}
                            icon={feature.icon}
                            title={feature.title}
                            description={feature.description}
                            gradient={feature.gradient}
                            index={index}
                        />
                    ))}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    className="mt-16 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                >
                    <p className="text-muted-foreground mb-4">
                        I to dopiero początek. Odkryj wszystkie możliwości.
                    </p>
                    <motion.a
                        href="/register"
                        className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
                        whileHover={{ x: 5 }}
                    >
                        Rozpocznij darmowy okres próbny
                        <span>→</span>
                    </motion.a>
                </motion.div>
            </div>
        </section>
    );
}