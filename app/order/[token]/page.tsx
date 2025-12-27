'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase, type Order } from '@/lib/supabase';
import ReviewModal from '@/components/ReviewModal';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { MessageCircle, Check, ChefHat, Bike, PackageCheck, MapPin, Store, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function OrderTrackingPage() {
    const params = useParams();
    const token = params.token as string;
    const [order, setOrder] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);

    useEffect(() => {
        if (!token) return;

        // Fetch initial order and check for review
        const fetchData = async () => {
            const { data: orderData } = await supabase
                .from('orders')
                .select(`*, merchants(*), order_items(*)`)
                .eq('tracking_token', token)
                .single();

            if (orderData) {
                setOrder(orderData);

                // Check if already reviewed
                const { data: reviewData } = await supabase
                    .from('reviews')
                    .select('id')
                    .eq('order_id', orderData.id)
                    .single();

                if (reviewData) setHasReviewed(true);
            }
            setIsLoading(false);
        };
        fetchData();

        // Subscribe
        const sub = supabase.channel('tracking').on('postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'orders', filter: `tracking_token=eq.${token}` },
            (payload) => setOrder((prev: any) => ({ ...prev, ...payload.new }))
        ).subscribe();

        return () => { supabase.removeChannel(sub); };
    }, [token]);

    // Show review modal when order just completed
    useEffect(() => {
        if (order?.status === 'completed' && !hasReviewed) {
            const timer = setTimeout(() => setShowReviewModal(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [order?.status, hasReviewed]);

    if (isLoading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
    if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>;

    const steps = [
        { id: 'pending', label: 'Order Sent', icon: PackageCheck },
        { id: 'accepted', label: 'Cooking', icon: ChefHat },
        { id: 'delivering', label: 'On The Way', icon: Bike },
        { id: 'completed', label: 'Arrived', icon: Check },
    ];

    // Map database status to step index
    let activeIndex = 0;
    if (['accepted', 'cooking', 'ready'].includes(order.status)) activeIndex = 1;
    if (order.status === 'delivering') activeIndex = 2;
    if (order.status === 'completed') activeIndex = 3;
    if (['rejected', 'cancelled'].includes(order.status)) activeIndex = -1;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="min-h-screen bg-background p-6 space-y-6 pb-24"
        >
            <div className="text-center space-y-1 pt-4">
                <h1 className="text-2xl font-bold text-secondary-900">Track Order</h1>
                <p className="text-secondary-500 text-sm font-mono tracking-wider">#{order.tracking_token}</p>
            </div>

            {/* Timeline Card */}
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-secondary-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-400 to-accent-400 opacity-20" />

                {activeIndex === -1 ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4">🛑</div>
                        <h3 className="text-lg font-bold text-red-500">Order Cancelled / Rejected</h3>
                        <p className="text-secondary-500 text-sm mt-1">Chat merchant for details.</p>
                    </div>
                ) : (
                    <div className="space-y-8 relative py-4">
                        {/* Vertical Line */}
                        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-secondary-100 -z-0" />

                        {steps.map((step, idx) => {
                            const isActive = idx === activeIndex;
                            const isCompleted = idx < activeIndex;

                            return (
                                <div key={step.id} className="flex items-start gap-4 relative z-10">
                                    <div className={`
                            w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-700 shrink-0
                            ${isActive || isCompleted ? 'bg-primary-DEFAULT border-primary-100 text-white shadow-lg shadow-primary-200' : 'bg-white border-secondary-50 text-secondary-200'}
                        `}>
                                        {isActive ? (
                                            <motion.div
                                                animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                                                transition={{ repeat: Infinity, duration: 3 }}
                                            >
                                                <step.icon size={20} />
                                            </motion.div>
                                        ) : (
                                            <step.icon size={20} />
                                        )}
                                    </div>
                                    <div className="pt-2 flex-1">
                                        <h3 className={`font-bold text-sm transition-colors ${isActive || isCompleted ? 'text-secondary-900' : 'text-secondary-300'}`}>
                                            {step.label}
                                        </h3>
                                        {isActive && (
                                            <motion.p
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-[11px] text-primary-600 font-bold mt-0.5"
                                            >
                                                {order.status === 'pending' && 'Waiting for merchant to confirm...'}
                                                {['accepted', 'cooking', 'ready'].includes(order.status) && 'Preparing your delicious meal...'}
                                                {order.status === 'delivering' && 'Driver is heading your way!'}
                                                {order.status === 'completed' && 'Enjoy your meal! 🍱'}
                                            </motion.p>
                                        )}
                                    </div>
                                    {isCompleted && (
                                        <div className="bg-primary-50 p-1 rounded-full mt-2">
                                            <Check size={12} className="text-primary-DEFAULT" />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Review Success Info */}
            {hasReviewed && order.status === 'completed' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-accent-50 p-4 rounded-2xl border border-accent-100 flex items-center gap-3"
                >
                    <div className="bg-accent-500 text-white p-2 rounded-full">
                        <Star size={16} fill="white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-secondary-900">Review Terkirim!</p>
                        <p className="text-xs text-secondary-600">Terima kasih atas masukan kamu.</p>
                    </div>
                </motion.div>
            )}

            {/* Merchant / Chat Info */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-secondary-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-secondary-50 w-12 h-12 rounded-full flex items-center justify-center text-xl overflow-hidden">
                        {order.merchants?.profile_photo_url ? (
                            <img src={order.merchants.profile_photo_url} alt="Merchant" className="w-full h-full object-cover" />
                        ) : (
                            '👨‍🍳'
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-secondary-900 text-sm">{order.merchants?.merchant_name}</h3>
                        <p className="text-xs text-secondary-500">Merchant Hubungi via WA</p>
                    </div>
                </div>
                {order.merchants?.phone && (
                    <a
                        href={`https://wa.me/${order.merchants.phone}`}
                        target="_blank"
                        className="bg-green-500 text-white p-3 rounded-xl shadow-lg shadow-green-400/30 hover:bg-green-600 transition-colors"
                    >
                        <MessageCircle size={20} />
                    </a>
                )}
            </div>

            {/* Manual Review Toggle (if completed but not reviewed) */}
            {order.status === 'completed' && !hasReviewed && (
                <button
                    onClick={() => setShowReviewModal(true)}
                    className="w-full py-4 bg-primary-DEFAULT text-white rounded-2xl font-bold shadow-lg shadow-primary-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    <Star size={20} fill="white" />
                    Beri Ulasan Sekarang
                </button>
            )}

            {/* Order Details Accordion */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-secondary-100">
                <h3 className="font-bold text-secondary-900 mb-4 border-b border-secondary-50 pb-2">Pesanan Kamu</h3>
                <div className="space-y-3">
                    {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-secondary-600 font-medium">{item.quantity}x <span className="text-secondary-900">{item.item_name}</span></span>
                            <span className="text-secondary-900 font-bold">Rp {item.subtotal.toLocaleString()}</span>
                        </div>
                    ))}
                    <div className="pt-4 mt-4 border-t border-dashed border-secondary-100 flex justify-between font-bold text-lg">
                        <span className="text-secondary-900">Total Akhir</span>
                        <span className="text-primary-DEFAULT">Rp {order.total_amount.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <Link href="/" className="block text-center text-secondary-400 text-sm py-4 hover:text-primary-DEFAULT transition-colors">
                Kembali ke Beranda
            </Link>

            <ReviewModal
                isOpen={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                orderId={order.id}
                merchantId={order.merchant_id}
                onSuccess={() => setHasReviewed(true)}
            />
        </motion.div>
    );
}
