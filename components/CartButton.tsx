'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { CartSheet } from './CartSheet';

export function CartButton() {
    const { getItemCount, getTotal } = useCartStore();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const count = getItemCount();
    const total = getTotal();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => setIsMounted(true), []);

    if (!isMounted) return null;

    return (
        <>
            <AnimatePresence>
                {count > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className="fixed bottom-6 right-6 z-40"
                    >
                        <motion.button
                            onClick={() => setIsCartOpen(true)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-primary-DEFAULT text-white shadow-lg shadow-primary-500/30 rounded-full px-6 py-3 flex items-center gap-3 font-bold text-lg min-w-[160px] justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <ShoppingBag size={24} />
                                    <motion.span
                                        key={count}
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="absolute -top-2 -right-2 bg-accent-DEFAULT text-secondary-900 text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-primary-500"
                                    >
                                        {count}
                                    </motion.span>
                                </div>
                                <span>Cart</span>
                            </div>

                            <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-mono">
                                Rp{(total / 1000).toFixed(0)}k
                            </span>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            <CartSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    );
}
