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
    User,
    ShoppingBag
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const CATEGORIES = [
    { id: 'all', label: 'Semua', icon: UtensilsCrossed },
    { id: 'nasi', label: 'Nasi', icon: ShoppingBag },
    { id: 'ayam', label: 'Ayam', icon: UtensilsCrossed },
    { id: 'minuman', label: 'Minuman', icon: Coffee },
    { id: 'cemilan', label: 'Cemilan', icon: IceCream },
    { id: 'promo', label: 'Promo', icon: Pizza },
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
        // Simple logic for dummy category filtering since categories are handled loosely
        // In a real app, we'd query by tag/category from DB
        return merchant.business_description?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
            merchant.merchant_name.toLowerCase().includes(selectedCategory.toLowerCase());
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gray-50 pb-24 font-sans"
        >
            {/* Header Content */}
            <div className="max-w-md mx-auto px-4 pt-6 pb-2">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <div className="bg-rose-50 p-2 rounded-full">
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
                            className="px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded-full font-medium text-sm shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <Search size={16} />
                            Cek Pesanan
                        </Link>
                        <Link href="/merchant/login" className="p-2 bg-white border border-gray-200 rounded-full text-slate-700 hover:bg-gray-50 transition-colors shadow-sm">
                            <User size={20} />
                        </Link>
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-secondary-DEFAULT leading-tight">
                        Mau makan apa<br />hari ini?
                    </h2>
                </div>

                {/* Sticky Search Bar */}
                <div className="sticky top-4 z-40 mb-6 transition-colors">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary-DEFAULT transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-4 bg-white border-none rounded-2xl leading-5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT shadow-md transition-shadow"
                            placeholder="Cari makanan atau resto..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Categories - High Contrast Chips */}
                <div className="mb-8 overflow-x-auto pb-4 scrollbar-hide">
                    <div className="flex gap-3 w-max px-1">
                        {CATEGORIES.map((cat) => {
                            const isActive = selectedCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`
                                        flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap
                                        ${isActive
                                            ? 'bg-primary-DEFAULT text-white shadow-md scale-105'
                                            : 'bg-white border border-gray-200 text-slate-700 shadow-sm hover:border-gray-300'
                                        }
                                    `}
                                >
                                    <cat.icon size={18} className={isActive ? 'text-white' : 'text-slate-500'} />
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Merchant List */}
            <div className="max-w-md mx-auto px-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-secondary-DEFAULT">Restoran Terdekat</h3>
                    {filteredMerchants.length > 0 && (
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                            {filteredMerchants.length} Found
                        </span>
                    )}
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                                <Skeleton className="w-24 h-24 rounded-xl" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-4 w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredMerchants.length > 0 ? (
                    <div className="grid gap-5">
                        {filteredMerchants.map((merchant) => (
                            <MerchantCard key={merchant.id} merchant={merchant} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                            <UtensilsCrossed className="text-gray-400" size={32} />
                        </div>
                        <h3 className="font-bold text-secondary-DEFAULT">Yah, belum ada merchant</h3>
                        <p className="text-sm text-gray-500 mt-1">Coba cari area lain atau kategori berbeda</p>
                    </div>
                )}
            </div>

            {/* Floating Cart Button */}
            <CartButton />
        </motion.div>
    );
}
