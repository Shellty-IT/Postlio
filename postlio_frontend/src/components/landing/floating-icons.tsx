'use client';

import { motion } from 'framer-motion';
import {
    Facebook,
    Instagram,
    Linkedin,
    Sparkles,
    Zap,
    Calendar,
    BarChart3,
    MessageSquare,
    Image
} from 'lucide-react';

const floatingIcons = [
    { Icon: Facebook, color: '#1877F2', x: '10%', y: '20%', delay: 0 },
    { Icon: Instagram, color: '#E4405F', x: '85%', y: '15%', delay: 0.5 },
    { Icon: Linkedin, color: '#0A66C2', x: '75%', y: '70%', delay: 1 },
    { Icon: Sparkles, color: '#8B5CF6', x: '15%', y: '65%', delay: 1.5 },
    { Icon: Zap, color: '#F59E0B', x: '90%', y: '45%', delay: 2 },
    { Icon: Calendar, color: '#10B981', x: '5%', y: '45%', delay: 2.5 },
    { Icon: BarChart3, color: '#3B82F6', x: '20%', y: '85%', delay: 3 },
    { Icon: MessageSquare, color: '#A78BFA', x: '80%', y: '85%', delay: 3.5 },
    { Icon: Image, color: '#EC4899', x: '50%', y: '5%', delay: 4 },
];

export function FloatingIcons() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {floatingIcons.map(({ Icon, color, x, y, delay }, index) => (
                <motion.div
                    key={index}
                    className="absolute"
                    style={{ left: x, top: y }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: delay + 0.5, duration: 0.5 }}
                >
                    <motion.div
                        className="relative"
                        animate={{
                            y: [0, -15, 0],
                            rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                            duration: 4 + index * 0.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    >
                        {/* Glow effect */}
                        <div
                            className="absolute inset-0 blur-xl opacity-30"
                            style={{ backgroundColor: color }}
                        />

                        {/* Icon container */}
                        <div
                            className="relative p-3 rounded-2xl bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 shadow-lg"
                        >
                            <Icon
                                className="w-5 h-5 md:w-6 md:h-6"
                                style={{ color }}
                            />
                        </div>
                    </motion.div>
                </motion.div>
            ))}
        </div>
    );
}