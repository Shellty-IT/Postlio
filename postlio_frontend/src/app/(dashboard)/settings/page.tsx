// src/app/(dashboard)/settings/page.tsx
'use client';

import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    SettingsHeader,
    SettingsNav,
    ProfileSection,
    AIPreferencesSection,
    NotificationsSection,
    AppearanceSection,
    ConnectedAccountsSection,
    DangerZoneSection,
} from '@/components/settings';
import { useSettingsStore } from '@/store/settings-store';

export default function SettingsPage() {
    const { activeSection } = useSettingsStore();

    // Render active section
    const renderSection = () => {
        switch (activeSection) {
            case 'profile':
                return <ProfileSection />;
            case 'ai':
                return <AIPreferencesSection />;
            case 'notifications':
                return <NotificationsSection />;
            case 'appearance':
                return <AppearanceSection />;
            case 'accounts':
                return <ConnectedAccountsSection />;
            case 'danger':
                return <DangerZoneSection />;
            default:
                return <ProfileSection />;
        }
    };

    return (
        <div className="p-6 h-[calc(100vh-4rem)]">
            {/* Header */}
            <SettingsHeader />

            {/* Main Content */}
            <div className="flex gap-8 mt-6 h-[calc(100%-5rem)]">
                {/* Sidebar Navigation */}
                <aside className="w-72 flex-shrink-0">
                    <div className="sticky top-6">
                        <SettingsNav />
                    </div>
                </aside>

                {/* Content Area */}
                <main className="flex-1 min-w-0">
                    <ScrollArea className="h-full pr-4">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="pb-8"
                        >
                            {renderSection()}
                        </motion.div>
                    </ScrollArea>
                </main>
            </div>
        </div>
    );
}