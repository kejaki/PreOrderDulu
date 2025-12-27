'use client';

import { Merchant } from '@/lib/supabase';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Clock, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface MerchantCardProps {
    merchant: Merchant;
    distance?: number;
}

export default function MerchantCard({ merchant, distance }: MerchantCardProps) {
    return (
        <Link href={`/merchant/${merchant.id}`} className="block group">
            <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex p-3 gap-4"
            >
                {/* Left: Square Image */}
                <div className="relative w-[100px] h-[100px] shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                    {merchant.profile_photo_url ? (
                        <Image
                            src={merchant.profile_photo_url}
                            alt={merchant.merchant_name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-2xl">🏪</div>
                    )}

                    {!merchant.is_open && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white px-2 py-1 rounded bg-black/60">TUTUP</span>
                        </div>
                    )}
                </div>

                {/* Right: Details */}
                <div className="flex-1 flex flex-col justify-start min-w-0">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-900 text-base leading-tight truncate">
                            {merchant.merchant_name}
                        </h3>
                    </div>

                    <p className="text-gray-500 text-xs truncate mb-2 mt-1">
                        {merchant.business_description || 'Pre-order makanan enak'}
                    </p>

                    <div className="mt-auto flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                            {merchant.rating_count && merchant.rating_count > 0 ? (
                                <div className="flex items-center gap-0.5 bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded">
                                    <Star size={12} className="fill-yellow-500 text-yellow-500" />
                                    <span>{merchant.rating_average?.toFixed(1) || '0.0'}</span>
                                    <span className="text-gray-400 ml-0.5">({merchant.rating_count})</span>
                                </div>
                            ) : (
                                <span className="text-gray-400 text-xs">Belum ada rating</span>
                            )}
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-600">
                                {distance !== undefined
                                    ? (distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`)
                                    : '...'
                                }
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">
                                Promo
                            </span>
                            {merchant.merchant_type === 'student' && (
                                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">
                                    Student
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
