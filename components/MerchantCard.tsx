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
        <Link href={`/merchant/${merchant.id}`} className="block">
            <motion.div
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-secondary-100"
            >
                <div className="relative h-40 bg-secondary-50">
                    {merchant.profile_photo_url ? (
                        <Image
                            src={merchant.profile_photo_url}
                            alt={merchant.merchant_name}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-4xl">🏪</div>
                    )}

                    <div className="absolute top-3 right-3 flex gap-2">
                        <Badge variant={merchant.is_open ? 'success' : 'danger'} size="sm" className="shadow-sm backdrop-blur-sm bg-white/90">
                            {merchant.is_open ? 'OPEN' : 'CLOSED'}
                        </Badge>
                    </div>

                    {distance !== undefined && (
                        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-secondary-800 shadow-sm flex items-center gap-1">
                            <MapPin size={12} className="text-primary-500" />
                            {distance < 1
                                ? `${(distance * 1000).toFixed(0)}m`
                                : `${distance.toFixed(1)}km`
                            }
                        </div>
                    )}
                </div>

                <div className="p-4">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-secondary-900 text-lg leading-tight line-clamp-1">
                            {merchant.merchant_name}
                        </h3>
                        <div className="flex items-center gap-1 bg-accent-50 px-1.5 py-0.5 rounded text-xs font-bold text-secondary-800">
                            <Star size={12} className="fill-accent text-accent" />
                            <span>4.8</span>
                        </div>
                    </div>

                    <p className="text-secondary-500 text-sm line-clamp-1 mb-2">
                        {merchant.business_description || 'No description available'}
                    </p>

                    <div className="flex flex-wrap gap-2 text-xs text-secondary-400">
                        {merchant.merchant_type === 'student' && (
                            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                                Student
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <Clock size={12} /> 15-20 min
                        </span>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
