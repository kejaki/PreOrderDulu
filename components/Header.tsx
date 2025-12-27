'use client';

import { Logo } from '@/components/Logo';
import { useLocationStore } from '@/store/useLocationStore';
import { MapPin, Search, User, Bike } from 'lucide-react';
import Link from 'next/link';

export function Header() {
    const { latitude, longitude } = useLocationStore();
    const locationAddress = latitude && longitude
        ? `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
        : 'Detecting location...';

    return (
        <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
                <Link href="/">
                    <Logo variant="full" width={140} height={35} />
                </Link>

                <div className="flex items-center gap-3">
                    <Link
                        href="/order/lookup"
                        className="p-2 bg-gray-50 text-slate-700 rounded-full hover:bg-gray-100 transition-colors"
                        title="Lacak Pesanan"
                    >
                        <Bike size={20} />
                    </Link>
                </div>
            </div>

            {/* Location Sub-header */}
            <div className="bg-secondary-50 px-4 py-2 border-b border-gray-100">
                <div className="max-w-md mx-auto flex items-center gap-2">
                    <MapPin className="text-primary-DEFAULT" size={14} />
                    <span className="text-xs text-gray-500 font-medium truncate">
                        {locationAddress}
                    </span>
                </div>
            </div>
        </div>
    );
}
