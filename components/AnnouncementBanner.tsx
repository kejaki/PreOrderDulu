'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Megaphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlobalAnnouncement {
    text: string;
    enabled: boolean;
}

export function AnnouncementBanner() {
    const [announcement, setAnnouncement] = useState<GlobalAnnouncement | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        fetchAnnouncement();

        // Subscribe to changes
        const channel = supabase
            .channel('public:system_settings')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'system_settings',
                    filter: "key=eq.global_announcement"
                },
                (payload) => {
                    if (payload.new && payload.new.value) {
                        setAnnouncement(payload.new.value);
                        setIsVisible(payload.new.value.enabled);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchAnnouncement = async () => {
        const { data } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'global_announcement')
            .single();

        if (data?.value) {
            setAnnouncement(data.value);
            setIsVisible(data.value.enabled);
        }
    };

    if (!announcement || !isVisible || !announcement.enabled || !announcement.text) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-rose-600 text-white relative overflow-hidden"
            >
                <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex-1 flex items-center gap-2">
                            <span className="flex p-1 rounded-lg bg-rose-800">
                                <Megaphone className="h-5 w-5 text-white" aria-hidden="true" />
                            </span>
                            <p className="font-medium text-white truncate text-sm sm:text-base">
                                {announcement.text}
                            </p>
                        </div>
                        <div className="flex-shrink-0 order-2 sm:order-3 sm:ml-3">
                            <button
                                type="button"
                                onClick={() => setIsVisible(false)}
                                className="-mr-1 flex p-1 rounded-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-white sm:-mr-2"
                            >
                                <span className="sr-only">Dismiss</span>
                                <X className="h-5 w-5 text-white" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
