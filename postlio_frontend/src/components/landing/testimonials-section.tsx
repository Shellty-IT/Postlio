'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { TestimonialCard } from './testimonial-card';

const testimonials = [
    {
        quote:
            'Postlio odmienił sposób w jaki zarządzam social media mojego sklepu. Autopilot AI oszczędza mi 10+ godzin tygodniowo, a posty są lepsze niż te, które pisałam sama!',
        author: 'Anna Kowalska',
        role: 'Właścicielka',
        company: 'Butik Modowy',
        avatar: 'AK',
        rating: 5,
        featured: true,
    },
    {
        quote:
            'Brand Voice DNA to game-changer. AI naprawdę nauczyło się stylu naszej marki i teraz każdy post brzmi autentycznie.',
        author: 'Michał Nowak',
        role: 'Marketing Manager',
        company: 'TechStartup',
        avatar: 'MN',
        rating: 5,
    },
    {
        quote:
            'Obsługuję 12 klientów i bez Postlio byłoby to niemożliwe. Kalendarz i multi-brand to must-have dla każdej agencji.',
        author: 'Karolina Wiśniewska',
        role: 'CEO',
        company: 'Social Agency',
        avatar: 'KW',
        rating: 5,
    },
    {
        quote:
            'Wreszcie narzędzie, które rozumie polski rynek. Posty są naturalne, nie brzmią jak tłumaczenie z angielskiego.',
        author: 'Piotr Zieliński',
        role: 'Content Creator',
        company: 'Freelancer',
        avatar: 'PZ',
        rating: 5,
    },
    {
        quote:
            'Generowanie obrazów AI to wisienka na torcie. Tworzę kompletne posty w minuty zamiast godzin.',
        author: 'Ewa Dąbrowska',
        role: 'Influencer',
        company: '50K followers',
        avatar: 'ED',
        rating: 5,
    },
    {
        quote:
            'Testowaliśmy wiele narzędzi AI - Postlio wygrało dzięki prostocie obsługi i jakości generowanych treści.',
        author: 'Tomasz Lewandowski',
        role: 'Digital Director',
        company: 'MediaHouse',
        avatar: 'TL',
        rating: 5,
    },
];

export function TestimonialsSection() {
    return (
        <section className="py-24 md:py-32 bg-muted/30 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.02]">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)`,
                        backgroundSize: '32px 32px',
                    }}
                />
            </div>

            <div className="container mx-auto px-4 relative">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
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
                            Opinie klientów
                        </Badge>
                    </motion.div>

                    <motion.h2
                        className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        Dołącz do{' '}
                        <span className="text-primary">10,000+ zadowolonych</span> użytkowników
                    </motion.h2>

                    <motion.p
                        className="text-lg text-muted-foreground"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        Zobacz, co mówią twórcy i marki, które już korzystają z Postlio
                    </motion.p>
                </div>

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, index) => (
                        <TestimonialCard
                            key={index}
                            {...testimonial}
                            index={index}
                        />
                    ))}
                </div>

                {/* Stats bar */}
                <motion.div
                    className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 p-8 rounded-3xl bg-card border border-border/50"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    {[
                        { value: '4.9/5', label: 'Średnia ocena' },
                        { value: '10K+', label: 'Aktywnych użytkowników' },
                        { value: '1M+', label: 'Wygenerowanych postów' },
                        { value: '98%', label: 'Poleca znajomym' },
                    ].map((stat, index) => (
                        <div key={index} className="text-center">
                            <motion.div
                                className="text-3xl md:text-4xl font-bold text-primary mb-1"
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 200,
                                    delay: 0.5 + index * 0.1,
                                }}
                            >
                                {stat.value}
                            </motion.div>
                            <div className="text-sm text-muted-foreground">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}