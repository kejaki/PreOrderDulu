'use client';

import { useState, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { CheckCircle, ChefHat, ChevronRight, Smartphone, MapPin, List } from 'lucide-react';
import Link from 'next/link';

const SLIDE_COUNT = 2;
const AUTO_DELAY = 5000;

export function HomeBanner() {
    const [index, setIndex] = useState(0);
    const dragX = useMotionValue(0);

    useEffect(() => {
        const intervalRef = setInterval(() => {
            const x = dragX.get();
            if (x === 0) {
                setIndex((pv) => (pv + 1) % SLIDE_COUNT);
            }
        }, AUTO_DELAY);

        return () => clearInterval(intervalRef);
    }, [dragX]);

    const onDragEnd = () => {
        const x = dragX.get();
        if (x <= -50 && index < SLIDE_COUNT - 1) {
            setIndex((pv) => pv + 1);
        } else if (x >= 50 && index > 0) {
            setIndex((pv) => pv - 1);
        }
    };

    return (
        <div className="relative overflow-hidden w-full rounded-2xl md:max-w-md mx-auto mb-6 shrink-0 shadow-lg">
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                style={{ x: dragX }}
                animate={{ translateX: `-${index * 100}%` }}
                transition={{ type: 'spring', mass: 3, stiffness: 400, damping: 50 }}
                onDragEnd={onDragEnd}
                className="flex cursor-grab active:cursor-grabbing w-full"
            >
                {/* SLIDE 1: User Onboarding */}
                <div className="w-full shrink-0 relative bg-gradient-to-br from-rose-500 to-red-600 p-6 text-white flex flex-col justify-center min-h-[180px]">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Smartphone size={120} />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold mb-3 leading-tight">Pesan Makan<br />Tanpa Login!</h2>
                        <div className="space-y-2 text-sm font-medium">
                            <div className="flex items-center gap-2">
                                <div className="bg-white/20 p-1 rounded-full"><List size={14} /></div>
                                <span>1. Pilih Menu</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="bg-white/20 p-1 rounded-full"><Smartphone size={14} /></div>
                                <span>2. Isi WhatsApp</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="bg-white/20 p-1 rounded-full"><MapPin size={14} /></div>
                                <span>3. Lacak Pesanan</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SLIDE 2: Merchant Recruitment */}
                <div className="w-full shrink-0 relative bg-gradient-to-br from-slate-700 to-slate-900 p-6 text-white flex flex-col justify-center min-h-[180px]">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ChefHat size={120} />
                    </div>
                    <div className="relative z-10 w-full">
                        <h2 className="text-2xl font-bold mb-1">Kamu Jago Masak?</h2>
                        <p className="text-slate-200 text-sm mb-4 max-w-[80%]">Buka toko online-mu sekarang. Gratis & verifikasi cepat.</p>
                        <Link href="/merchant/register">
                            <button className="bg-white text-slate-900 px-5 py-2 rounded-full font-bold text-sm shadow-md flex items-center gap-2 hover:bg-slate-100 transition-colors">
                                Daftar Mitra <ChevronRight size={16} />
                            </button>
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Dots Indicator */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-20">
                {Array.from({ length: SLIDE_COUNT }).map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setIndex(idx)}
                        className={`h-1.5 rounded-full transition-all ${idx === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
