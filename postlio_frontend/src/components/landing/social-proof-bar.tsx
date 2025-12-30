'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const logos = [
    { name: 'TechCrunch', opacity: 0.6 },
    { name: 'Forbes', opacity: 0.7 },
    { name: 'Wired', opacity: 0.6 },
    { name: 'ProductHunt', opacity: 0.7 },
    { name: 'TheNextWeb', opacity: 0.6 },
];

const reviews = [
    { platform: 'G2', rating: 4.9, count: '500+' },
    { platform: 'Capterra', rating: 4.8, count: '300+' },
    { platform: 'ProductHunt', rating: 5.0, count: '#1 Product' },
];

export function SocialProofBar() {
    return (
        <section className="py-12 border-y border-border/50 bg-muted/30">
            <div className="container mx-auto px-4">
                {/* Reviews */}
                <motion.div
                    className="flex flex-wrap justify-center items-center gap-8 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    {reviews.map((review, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-3 px-4 py-2 rounded-full bg-background/80 border border-border/50"
                        >
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                                    />
                                ))}
                            </div>
                            <span className="font-semibold text-sm">{review.rating}</span>
                            <span className="text-muted-foreground text-sm">
                {review.count} reviews on {review.platform}
              </span>
                        </div>
                    ))}
                </motion.div>

                {/* Trusted by text */}
                <motion.p
                    className="text-center text-sm text-muted-foreground mb-6"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    Zaufali nam twórcy i marki z całego świata
                </motion.p>

                {/* Logo ticker */}
                <motion.div
                    className="flex justify-center items-center gap-12 flex-wrap"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    {logos.map((logo, index) => (
                        <motion.div
                            key={index}
                            className="text-2xl font-bold text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors cursor-default select-none"
                            style={{ opacity: logo.opacity }}
                            whileHover={{ scale: 1.05 }}
                        >
                            {logo.name}
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}