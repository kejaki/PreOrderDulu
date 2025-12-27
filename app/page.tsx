'use client';

import { useEffect, useState } from 'react';
import { useLocationStore } from '@/store/useLocationStore';
import { getNearbyMerchants, getMerchantsBySearch, type Merchant } from '@/lib/supabase';
import { calculateDistance, getCurrentLocation } from '@/lib/geolocation';
import MerchantCard from '@/components/MerchantCard';
import { CartButton } from '@/components/CartButton';
import { Skeleton } from '@/components/ui/Skeleton';
import {
    Search,
    MapPin,
    Navigation,
    Bike,
    ShoppingBag,
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
    { id: 'nasi', label: 'Nasi', icon: Pizza }, // Pizza as placeholder for food
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
    const { latitude, longitude, setLocation, isLoading: isLocLoading } = useLocationStore();
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
    const [locationAddress, setLocationAddress] = useState('Detecting location...');

    //1. Initial Location Detect
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
                // Successfully got user location
                setLocation(loc.latitude, loc.longitude);
                const data = await getNearbyMerchants(loc.latitude, loc.longitude);
                setMerchants(data);
                setLocationAddress(`Lat: ${loc.latitude.toFixed(4)}, Lng: ${loc.longitude.toFixed(4)}`);
            } else {
                // Geolocation failed, use default fallback
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
        // Simple logic for dummy category filtering since categories aren't in DB yet
        return merchant.business_description?.toLowerCase().includes(selectedCategory.toLowerCase());
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gray-50 pb-24 font-sans"
        >
            {/* Header Content */}
            <div className="max-w-md mx-auto px-4 pt-6 pb-2 transition-colors">
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
                            className="px-3 py-2 bg-primary-DEFAULT text-white rounded-xl font-bold text-sm shadow-md hover:bg-primary-700 transition-all flex items-center gap-1.5 active:scale-95"
                        >
                            <Search size={16} />
                            Cek Pesanan
                        </Link>
                        <Link href="/merchant/login" className="p-2 bg-white border border-gray-200 rounded-full text-secondary-DEFAULT hover:bg-gray-100 transition-colors shadow-sm">
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
                <div className="sticky top-4 z-40 mb-6 bg-gray-50 py-1 transition-colors">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-DEFAULT transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Cari resto atau menu..."
                            className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl focus:ring-2 focus:ring-primary-DEFAULT transition-all font-medium text-gray-900 placeholder:text-gray-400 shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Service Toggle */}
                <div className="bg-gray-200/50 p-1 rounded-2xl flex mb-8">
                    <button
                        onClick={() => setDeliveryMode('delivery')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${deliveryMode === 'delivery'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500'
                            }`}
                    >
                        <Bike size={18} />
                        Pengantaran
                    </button>
                    <button
                        onClick={() => setDeliveryMode('pickup')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${deliveryMode === 'pickup'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500'
                            }`}
                    >
                        <ShoppingBag size={18} />
                        Ambil Sendiri
                    </button>
                </div>

                {/* Category Grid */}
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className="flex flex-col items-center gap-2 min-w-[70px] shrink-0 group"
                        >
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${selectedCategory === cat.id
                                ? 'bg-primary-DEFAULT text-white shadow-lg shadow-primary-200 scale-110 ring-4 ring-primary-50'
                                : 'bg-white text-gray-600 group-hover:bg-gray-50 shadow-sm'
                                }`}>
                                <cat.icon size={24} />
                            </div>
                            <span className={`text-xs font-bold ${selectedCategory === cat.id ? 'text-gray-900' : 'text-gray-500'
                                }`}>
                                {cat.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Merchant List Section */}
            <main className="max-w-md mx-auto px-4 py-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Resto di Sekitarmu</h3>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="text-primary-DEFAULT text-sm font-bold"
                    >
                        Lihat Semua
                    </motion.button>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex gap-4 p-3 bg-white rounded-xl border border-gray-100">
                                <Skeleton className="h-[100px] w-[100px] rounded-lg" />
                                <div className="flex-1 space-y-3">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-4 w-1/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <motion.div layout className="grid gap-4">
                        <AnimatePresence>
                            {filteredMerchants.map((merchant) => (
                                <motion.div
                                    layout
                                    key={merchant.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
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
                            <div className="text-center py-16 bg-gray-50 rounded-3xl">
                                <div className="text-5xl mb-4">🍜</div>
                                <h3 className="text-lg font-bold text-gray-900">Belum ada merchant</h3>
                                <p className="text-gray-500 text-sm px-8">Coba cek kategori lain atau cari resto favoritmu!</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </main>

            <CartButton />
        </motion.div>
    );
}
