'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getMerchantById, getMenuItems, type Merchant, type MenuItem } from '@/lib/supabase';
import { useCartStore } from '@/store/useCartStore';
import { CartButton } from '@/components/CartButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { MapPin, ArrowLeft, Star, Plus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function MerchantDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const { items: cartItems, addItem } = useCartStore();

    useEffect(() => {
        async function loadData() {
            if (!id) return;

            const [merchantData, menuData] = await Promise.all([
                getMerchantById(id),
                getMenuItems(id)
            ]);

            setMerchant(merchantData);
            setMenuItems(menuData);
            setIsLoading(false);
        }

        loadData();
    }, [id]);

    const handleAddItem = (item: MenuItem) => {
        if (!merchant) return;
        addItem(item, merchant.id, merchant.merchant_name);
    };

    // Group items
    const categorizedItems = menuItems.reduce((acc, item) => {
        const category = item.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
    }, {} as Record<string, MenuItem[]>);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-24 space-y-4">
                <Skeleton className="h-64 w-full" />
                <div className="p-4 space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="grid gap-4 mt-8">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    if (!merchant) return <div className="p-8 text-center">Merchant not found</div>;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen bg-background pb-32"
        >
            {/* Hero Header */}
            <div className="relative h-64 bg-secondary-900 overflow-hidden">
                {merchant.profile_photo_url ? (
                    <Image
                        src={merchant.profile_photo_url}
                        alt={merchant.merchant_name}
                        fill
                        className="object-cover opacity-60"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20">🍱</div>
                )}

                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent z-10">
                    <Link href="/">
                        <button className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                    </Link>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-secondary-900 to-transparent">
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-3xl font-bold text-white mb-2"
                    >
                        {merchant.merchant_name}
                    </motion.h1>

                    <div className="flex flex-wrap items-center gap-3 text-white/90 text-sm">
                        <Badge variant={merchant.is_open ? 'success' : 'danger'} size="sm">
                            {merchant.is_open ? 'OPEN' : 'CLOSED'}
                        </Badge>
                        <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded backdrop-blur-sm">
                            <Star size={14} className="text-accent-DEFAULT fill-accent-DEFAULT" /> 4.8
                        </span>
                        <span className="flex items-center gap-1">
                            <MapPin size={14} className="text-primary-DEFAULT" />
                            {merchant.address_text}
                        </span>
                    </div>
                </div>
            </div>

            {/* Menu Sections */}
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
                {Object.entries(categorizedItems).map(([category, items]) => (
                    <div key={category}>
                        <h2 className="text-xl font-bold text-secondary-900 mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-primary-DEFAULT rounded-full block"></span>
                            {category}
                        </h2>
                        <div className="grid gap-4">
                            {items.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    whileHover={{ y: -2 }}
                                    className="bg-white rounded-2xl p-4 shadow-sm border border-secondary-100 flex gap-4 overflow-hidden"
                                >
                                    {/* Item Image */}
                                    <div className="relative w-24 h-24 flex-shrink-0 bg-secondary-50 rounded-xl overflow-hidden">
                                        {item.photo_url ? (
                                            <Image
                                                src={item.photo_url}
                                                alt={item.item_name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-2xl opacity-50">🍲</div>
                                        )}
                                    </div>

                                    {/* Item Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                        <div>
                                            <h3 className="font-bold text-secondary-900 text-lg leading-tight line-clamp-1">{item.item_name}</h3>
                                            <p className="text-xs text-secondary-500 line-clamp-2 mt-1">{item.description}</p>
                                        </div>

                                        <div className="flex items-center justify-between mt-2">
                                            <div className="font-bold text-primary-600 text-lg">
                                                Rp {item.price.toLocaleString('id-ID')}
                                            </div>

                                            <motion.button
                                                whileTap={{ scale: 0.8 }}
                                                onClick={() => handleAddItem(item)}
                                                disabled={!merchant.is_open || !item.is_available}
                                                className="w-8 h-8 flex items-center justify-center bg-secondary-900 text-white rounded-full hover:bg-primary-DEFAULT disabled:opacity-50 disabled:hover:bg-secondary-900 transition-colors shadow-lg"
                                            >
                                                <Plus size={18} />
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}

                {menuItems.length === 0 && (
                    <div className="py-12 text-center text-secondary-400">
                        <p>No menu items available yet.</p>
                    </div>
                )}
            </div>

            <CartButton />
        </motion.div>
    );
}
