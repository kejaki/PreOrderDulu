'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/Skeleton'; // Assuming you have a Skeleton component
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';

interface RecommendedMenu {
    id: string;
    name: string;
    price: number;
    image_url: string;
    merchant_id: string;
    merchant_name: string;
    description: string;
}

export function MenuRecommendationSlider() {
    const [menus, setMenus] = useState<RecommendedMenu[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchRecommendations() {
            try {
                const { data, error } = await supabase.rpc('get_recommended_menus', { limit_count: 10 });
                if (error) throw error;
                setMenus(data || []);
            } catch (err) {
                console.error('Error fetching recommendations:', err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchRecommendations();
    }, []);

    if (isLoading) {
        return (
            <div className="mb-8">
                <h3 className="font-bold text-lg text-secondary-DEFAULT mb-4 px-4">Rekomendasi Menu</h3>
                <div className="flex gap-4 overflow-hidden px-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="min-w-[160px] w-[160px]">
                            <Skeleton className="h-[160px] w-full rounded-2xl mb-3" />
                            <Skeleton className="h-4 w-3/4 mb-2" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (menus.length === 0) return null;

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between px-4 mb-4">
                <h3 className="font-bold text-lg text-secondary-DEFAULT">Rekomendasi Menu</h3>
            </div>

            <div className="overflow-x-auto pb-4 scrollbar-hide">
                <div className="flex gap-4 px-4 w-max">
                    {menus.map((menu) => (
                        <Link
                            href={`/merchant/${menu.merchant_id}`}
                            key={menu.id}
                        >
                            <motion.div
                                whileTap={{ scale: 0.95 }}
                                className="w-[160px] flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="h-[160px] w-full relative bg-gray-100">
                                    <img
                                        src={menu.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'}
                                        alt={menu.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c';
                                        }}
                                    />
                                    <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold shadow-sm">
                                        ⭐ 4.8
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h4 className="font-bold text-secondary-DEFAULT truncate text-sm mb-1">{menu.name}</h4>
                                    <p className="text-xs text-gray-500 truncate mb-2">{menu.merchant_name}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-primary-DEFAULT text-sm">
                                            Rp {menu.price.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

