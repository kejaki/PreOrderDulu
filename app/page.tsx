'use client';

import { useEffect, useState } from 'react';
import { useLocationStore } from '@/store/useLocationStore';
import { getNearbyMerchants, getMerchantsBySearch, type Merchant } from '@/lib/supabase';
import { getCurrentLocation } from '@/lib/geolocation';
import MerchantCard from '@/components/MerchantCard';
import { CartButton } from '@/components/CartButton';
import { Skeleton } from '@/components/ui/Skeleton';
import {
    Search,
    MapPin,
    UtensilsCrossed,
    Coffee,
    Pizza,
    IceCream,
    User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const CATEGORIES = [
    { id: 'all', label: 'Semua', icon: UtensilsCrossed },
    { id: 'nasi', label: 'Nasi', icon: Pizza },
    { id: 'ayam', label: 'Ayam', icon: UtensilsCrossed },
    { id: 'minuman', label: 'Minuman', icon: Coffee },
    { id: 'cemilan', label: 'Cemilan', icon: IceCream },
];

// Default fallback coordinates (Malang, Indonesia)
const DEFAULT_LOCATION = {
    latitude: -7.9666,
    longitude: 112.6326,
    address: 'Malang, Indonesia'
};

export default function Home() {
    const { latitude, longitude, setLocation } = useLocationStore();
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [locationAddress, setLocationAddress] = useState('Detecting location...');

    // 1. Initial Location Detect
    useEffect(() => {
        async function initLocation() {
            // Use cached location if available
            if (latitude && longitude) {
                setIsLoading(true);
                const data = await getNearbyMerchants(latitude, longitude);
                setMerchants(data);
                setLocationAddress(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
                setIsLoading(false);
                return;
            }

            // Try to get current location
            const loc = await getCurrentLocation();
            if (loc) {
                setLocation(loc.latitude, loc.longitude);
                const data = await getNearbyMerchants(loc.latitude, loc.longitude);
                setMerchants(data);
                setLocationAddress(`Lat: ${loc.latitude.toFixed(4)}, Lng: ${loc.longitude.toFixed(4)}`);
            } else {
                console.warn('Geolocation unavailable, using default location (Malang, Indonesia)');
                setLocation(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
                const data = await getNearbyMerchants(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
                setMerchants(data);
                setLocationAddress(DEFAULT_LOCATION.address);
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
        if (selectedCategory === 'all') return true;
        return merchant.business_description?.toLowerCase().includes(selectedCategory.toLowerCase());
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-background pb-24 font-sans"
        >
            {/* Header */}
            <div className="max-w-md mx-auto px-4 pt-6 pb-2">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary-50 p-2 rounded-full">
                            <MapPin className="text-primary-DEFAULT" size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Antar ke</span>
                            <span className="text-sm font-bold text-secondary-DEFAULT truncate max-w-[150px]">{locationAddress}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/order/lookup"
                            className="bg-white border border-gray-200 text-slate-700 px-4 py-2 rounded-full shadow-sm font-medium hover:bg-gray-50 transition-all flex items-center gap-1.5 text-sm"
                        >
                            <Search size={16} />
                            Cek Pesanan
                        </Link>
                        <Link
                            href="/merchant/login"
                            className="p-2 bg-white border border-gray-200 rounded-full text-secondary-DEFAULT hover:bg-gray-100 transition-colors shadow-sm"
                        >
                            <User size={20} />
                        </Link>
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-secondary-DEFAULT leading-tight">
                        Mau makan apa<br />hari ini?
                    </h2>
                </div>

                {/* Sticky Search Bar */}
                <div className="sticky top-4 z-40 mb-6 bg-background/80 backdrop-blur-sm py-1">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-DEFAULT transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Cari resto atau menu..."
                            className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl focus:ring-2 focus:ring-primary-DEFAULT transition-all font-medium text-gray-900 placeholder:text-gray-400 shadow-md"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Category Chips - High Contrast */}
                <div className="mb-8">
                    <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4">
                        {CATEGORIES.map((cat) => (
                            <motion.button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                whileTap={{ scale: 0.95 }}
                                className={`
                                    flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all shrink-0
                                    ${selectedCategory === cat.id
                                        ? 'bg-rose-600 text-white shadow-md border-2 border-rose-600'
                                        : 'bg-white text-slate-700 border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
                                    }
                                `}
                            >
                                <cat.icon size={18} />
                                {cat.label}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Merchant List */}
            <div className="max-w-md mx-auto px-4">
                {isLoading ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-40 w-full rounded-3xl" />
                        ))}
                    </div>
                ) : filteredMerchants.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 shadow-sm">
                        <div className="text-6xl mb-4">🍽️</div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No merchants found</h3>
                        <p className="text-gray-500 text-sm">Try searching in another area or category</p>
                    </div>
                ) : (
                    <motion.div layout className="space-y-6">
                        <AnimatePresence>
                            {filteredMerchants.map((merchant) => (
                                <motion.div
                                    key={merchant.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <MerchantCard merchant={merchant} userLat={latitude || 0} userLng={longitude || 0} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            {/* Cart Button */}
            <CartButton />
        </motion.div>
    );
}
