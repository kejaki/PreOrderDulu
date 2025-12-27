'use client';

import { useEffect, useState } from 'react';
import { useLocationStore } from '@/store/useLocationStore';
import { getNearbyMerchants, getMerchantsBySearch, type Merchant } from '@/lib/supabase';
import { calculateDistance, formatDistance, getCurrentLocation } from '@/lib/geolocation';
import MerchantCard from '@/components/MerchantCard';
import { CartButton } from '@/components/CartButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { Search, MapPin, Filter, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
    const { latitude, longitude, setLocation, isLoading: isLocLoading, error: locError } = useLocationStore();
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | '1km' | '3km' | '5km'>('all');
    const [locationAddress, setLocationAddress] = useState('Detecting location...');

    // 1. Initial Location Detect
    useEffect(() => {
        async function initLocation() {
            // Use cached location if available
            if (latitude && longitude) {
                setIsLoading(true);
                const data = await getNearbyMerchants(latitude, longitude);
                setMerchants(data);
                setLocationAddress(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`); // Placeholder rev-geo
                setIsLoading(false);
                return;
            }

            // Detect new
            const loc = await getCurrentLocation();
            if (loc) {
                setLocation(loc.latitude, loc.longitude);
                const data = await getNearbyMerchants(loc.latitude, loc.longitude);
                setMerchants(data);
                setLocationAddress(`Lat: ${loc.latitude.toFixed(4)}, Lng: ${loc.latitude.toFixed(4)}`);
            }
            setIsLoading(false);
        }

        initLocation();
    }, [latitude, longitude, setLocation]);

    // 2. Search Handler
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!latitude || !longitude) return;

            setIsLoading(true);
            if (searchQuery.trim()) {
                const results = await getMerchantsBySearch(searchQuery, latitude, longitude);
                setMerchants(results);
            } else {
                const results = await getNearbyMerchants(latitude, longitude);
                setMerchants(results);
            }
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, latitude, longitude]);

    // 3. Filter Logic
    const filteredMerchants = merchants.filter(merchant => {
        if (!latitude || !longitude) return true;
        if (activeFilter === 'all') return true;

        // We need strict distance if available, otherwise calc it
        // The RPC returns 'dist_meters', but type definition might handle it.
        // For client-side filter:
        const distKm = calculateDistance(latitude, longitude, merchant.latitude, merchant.longitude);

        if (activeFilter === '1km') return distKm <= 1;
        if (activeFilter === '3km') return distKm <= 3;
        if (activeFilter === '5km') return distKm <= 5;
        return true;
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-background pb-24"
        >
            {/* Header */}
            <header className="bg-white sticky top-0 z-30 shadow-sm border-b border-secondary-100">
                <div className="max-w-md mx-auto px-4 py-4 space-y-4">

                    {/* Top Bar: Brand & Location */}
                    <div className="flex justify-between items-center">
                        <motion.h1
                            whileHover={{ scale: 1.05 }}
                            className="text-2xl font-bold text-primary-DEFAULT tracking-tight"
                        >
                            PreOrder<span className="text-secondary-900">Dulu</span>
                        </motion.h1>

                        <Link href="/merchant/register" className="text-xs font-semibold text-secondary-500 hover:text-primary-DEFAULT transition-colors">
                            Jadi Mitra?
                        </Link>
                    </div>

                    {/* Location Bar */}
                    <div className="flex items-center gap-2 text-sm text-secondary-600 bg-secondary-50 p-2 rounded-lg">
                        <MapPin size={16} className="text-primary-DEFAULT shrink-0" />
                        <span className="truncate flex-1">{locationAddress}</span>
                        <button onClick={() => window.location.reload()} className="p-1 hover:bg-secondary-200 rounded">
                            <Navigation size={14} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-secondary-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari makan apa hari ini?"
                            className="w-full pl-10 pr-4 py-3 bg-secondary-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-DEFAULT transition-all font-medium text-secondary-900 placeholder:text-secondary-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {['all', '1km', '3km', '5km'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter as any)}
                                className={`
                  px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all
                  ${activeFilter === filter
                                        ? 'bg-primary-DEFAULT text-white shadow-lg shadow-primary-500/30'
                                        : 'bg-white border border-secondary-200 text-secondary-600 hover:bg-secondary-50'}
                `}
                            >
                                {filter === 'all' ? 'Semua' : `< ${filter}`}
                            </button>
                        ))}
                    </div>

                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-md mx-auto px-4 py-6">

                {isLoading ? (
                    <div className="grid gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="h-40 w-full rounded-2xl" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <motion.div layout className="grid gap-6">
                        <AnimatePresence>
                            {filteredMerchants.map((merchant) => (
                                <motion.div
                                    layout
                                    key={merchant.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <MerchantCard
                                        merchant={merchant}
                                        distance={
                                            latitude && longitude
                                                ? calculateDistance(latitude, longitude, merchant.latitude, merchant.longitude)
                                                : undefined
                                        }
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {filteredMerchants.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4">😔</div>
                                <h3 className="text-lg font-bold text-secondary-900">Belum ada merchant</h3>
                                <p className="text-secondary-500 text-sm">Coba ubah lokasi atau filter pencarian kamu.</p>
                            </div>
                        )}
                    </motion.div>
                )}

            </main>

            <CartButton />
        </motion.div>
    );
}

// Helper to fix missing Link import if I used it above
import Link from 'next/link'; 
