// src/components/dashboard/ai-activity.tsx
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sparkles, Zap, ImageIcon, MessageSquare } from 'lucide-react';

interface AIActivity {
    id: string;
    type: 'text' | 'image' | 'chat' | 'autopilot';
    description: string;
    provider: string;
    timestamp: Date;
}

const activityConfig = {
    text: {
        icon: <MessageSquare className="h-4 w-4" />,
        color: 'text-primary',
        bg: 'bg-primary/10',
    },
    image: {
        icon: <ImageIcon className="h-4 w-4" />,
        color: 'text-accent',
        bg: 'bg-accent/10',
    },
    chat: {
        icon: <Sparkles className="h-4 w-4" />,
        color: 'text-warning',
        bg: 'bg-warning/10',
    },
    autopilot: {
        icon: <Zap className="h-4 w-4" />,
        color: 'text-success',
        bg: 'bg-success/10',
    },
};

interface AIActivityProps {
    activities?: AIActivity[];
}

export function AIActivity({ activities }: AIActivityProps) {
    // Mock data
    const data: AIActivity[] = activities || [
        {
            id: '1',
            type: 'text',
            description: 'Wygenerowano post dla Facebook',
            provider: 'Gemini 2.5',
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
        },
        {
            id: '2',
            type: 'image',
            description: 'Stworzono grafikę produktową',
            provider: 'Pollinations',
            timestamp: new Date(Date.now() - 45 * 60 * 1000),
        },
        {
            id: '3',
            type: 'autopilot',
            description: 'Zaplanowano 3 posty na tydzień',
            provider: 'Autopilot AI',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
            id: '4',
            type: 'chat',
            description: 'Konwersacja w Kreatorze AI',
            provider: 'Groq Llama',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        },
    ];

    const formatTime = (date: Date) => {
        const minutes = Math.floor((Date.now() - date.getTime()) / 1000 / 60);
        if (minutes < 60) return `${minutes} min temu`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h temu`;
        return `${Math.floor(hours / 24)}d temu`;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Aktywność AI</h2>
                <div className="flex items-center gap-1.5 text-sm text-success">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
                    Online
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2 text-primary mb-1">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-2xl font-bold">127</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Generacji tekstu</p>
                </div>
                <div className="p-3 rounded-xl bg-accent/5 border border-accent/10">
                    <div className="flex items-center gap-2 text-accent mb-1">
                        <ImageIcon className="h-4 w-4" />
                        <span className="text-2xl font-bold">34</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Wygenerowanych obrazów</p>
                </div>
            </div>

            {/* Activity List */}
            <div className="space-y-2">
                {data.map((activity, index) => {
                    const config = activityConfig[activity.type];

                    return (
                        <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <div className={cn('p-1.5 rounded-lg', config.bg, config.color)}>
                                {config.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{activity.description}</p>
                                <p className="text-xs text-muted-foreground">{activity.provider}</p>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatTime(activity.timestamp)}
              </span>
                        </motion.div>
                    );
                })}
            </div>

            {/* Tokens Usage */}
            <div className="p-4 rounded-xl bg-muted/30 border">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Wykorzystanie tokenów</span>
                    <span className="text-sm text-muted-foreground">12,450 / 50,000</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '25%' }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Odnowienie: za 18 dni
                </p>
            </div>
        </div>
    );
}