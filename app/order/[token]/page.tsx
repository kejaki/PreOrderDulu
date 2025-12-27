'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MessageCircle, Check, ChefHat, Bike, PackageCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function OrderTrackingPage() {
    const params = useParams();
    const token = params.token as string;
    const [order, setOrder] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            const { data: orderData } = await supabase
                .from('orders')
                .select(`*, merchants(*), order_items(*)`)
                .eq('tracking_token', token)
                .single();

            if (orderData) setOrder(orderData);
            setIsLoading(false);
        };
        fetchData();

        const sub = supabase.channel('tracking').on('postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'orders', filter: `tracking_token=eq.${token}` },
            (payload) => setOrder((prev: any) => ({ ...prev, ...payload.new }))
        ).subscribe();

        return () => { supabase.removeChannel(sub); };
    }, [token]);

    if (isLoading) return <div className="p-8 text-center">Loading...</div>;
    if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>;

    const steps = [
        { id: 'pending', label: 'Order Sent', icon: PackageCheck },
        { id: 'accepted', label: 'Cooking', icon: ChefHat },
        { id: 'delivering', label: 'On The Way', icon: Bike },
        { id: 'completed', label: 'Arrived', icon: Check },
    ];

    let activeIndex = 0;
    if (['accepted', 'cooking', 'ready'].includes(order.status)) activeIndex = 1;
    if (order.status === 'delivering') activeIndex = 2;
    if (order.status === 'completed') activeIndex = 3;
    if (['rejected', 'cancelled'].includes(order.status)) activeIndex = -1;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gray-50 p-6 space-y-6 pb-24"
        >
            <div className="text-center space-y-1 pt-4">
                <h1 className="text-2xl font-bold text-gray-900">Track Order</h1>
                <p className="text-gray-500 text-sm font-mono">#{order.tracking_token}</p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
                {activeIndex === -1 ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4">🛑</div>
                        <h3 className="text-lg font-bold text-red-500">Order Cancelled / Rejected</h3>
                        <p className="text-gray-500 text-sm mt-1">Contact merchant for details.</p>
                    </div>
                ) : (
                    <div className="space-y-8 relative py-4">
                        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-100" />

                        {steps.map((step, idx) => {
                            const isActive = idx === activeIndex;
                            const isCompleted = idx < activeIndex;

                            return (
                                <div key={step.id} className="flex items-start gap-4 relative z-10">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all shrink-0 ${isActive || isCompleted ? 'bg-primary-DEFAULT border-primary-100 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-300'}`}>
                                        {isActive ? (
                                            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 3 }}>
                                                <step.icon size={20} />
                                            </motion.div>
                                        ) : (
                                            <step.icon size={20} />
                                        )}
                                    </div>
                                    <div className="pt-2 flex-1">
                                        <h3 className={`font-bold text-sm ${isActive || isCompleted ? 'text-gray-900' : 'text-gray-300'}`}>
                                            {step.label}
                                        </h3>
                                        {isActive && (
                                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-primary-600 font-bold mt-0.5">
                                                {order.status === 'pending' && 'Waiting for merchant...'}
                                                {['accepted', 'cooking', 'ready'].includes(order.status) && 'Preparing your meal...'}
                                                {order.status === 'delivering' && 'Driver is on the way!'}
                                                {order.status === 'completed' && 'Enjoy! 🍱'}
                                            </motion.p>
                                        )}
                                    </div>
                                    {isCompleted && (
                                        <div className="bg-primary-50 p-1 rounded-full mt-2">
                                            <Check size={12} className="text-primary-DEFAULT" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center text-xl">
                        {order.merchants?.profile_photo_url ? (
                            <img src={order.merchants.profile_photo_url} alt="Merchant" className="w-full h-full object-cover rounded-full" />
                        ) : '👨‍🍳'}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm">{order.merchants?.merchant_name}</h3>
                        <p className="text-xs text-gray-500">Contact via WhatsApp</p>
                    </div>
                </div>
                {order.merchants?.phone && (
                    <a
                        href={`https://wa.me/${order.merchants.phone}`}
                        target="_blank"
                        className="bg-green-500 text-white p-3 rounded-xl shadow-lg hover:bg-green-600 transition-colors"
                    >
                        <MessageCircle size={20} />
                    </a>
                )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-50 pb-2">Your Order</h3>
                <div className="space-y-3">
                    {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">{item.quantity}x <span className="text-gray-900">{item.item_name}</span></span>
                            <span className="text-gray-900 font-bold">Rp {item.subtotal.toLocaleString()}</span>
                        </div>
                    ))}
                    <div className="pt-4 mt-4 border-t border-dashed border-gray-100 flex justify-between font-bold text-lg">
                        <span className="text-gray-900">Total</span>
                        <span className="text-primary-DEFAULT">Rp {order.total_amount.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <Link href="/" className="block text-center text-gray-400 text-sm py-4 hover:text-primary-DEFAULT transition-colors">
                Back to Home
            </Link>
        </motion.div>
    );
}
