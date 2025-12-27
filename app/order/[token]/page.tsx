'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase, type Order } from '@/lib/supabase';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { MessageCircle, Check, ChefHat, Bike, PackageCheck, MapPin, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function OrderTrackingPage() {
    const params = useParams();
    const token = params.token as string;
    const [order, setOrder] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!token) return;

        // Fetch initial order
        const fetchOrder = async () => {
            const { data } = await supabase
                .from('orders')
                .select(`*, merchants(*), order_items(*)`)
                .eq('tracking_token', token)
                .single();
            if (data) setOrder(data);
            setIsLoading(false);
        };
        fetchOrder();

        // Subscribe
        const sub = supabase.channel('tracking').on('postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'orders', filter: `tracking_token=eq.${token}` },
            (payload) => setOrder((prev: any) => ({ ...prev, ...payload.new }))
        ).subscribe();

        return () => { supabase.removeChannel(sub); };
    }, [token]);

    if (isLoading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
    if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>;

    const steps = [
        { id: 'pending', label: 'Order Sent', icon: PackageCheck },
        { id: 'accepted', label: 'Cooking', icon: ChefHat },  // Simplifying states for UI
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
            className="min-h-screen bg-background p-6 space-y-8"
        >
            <div className="text-center space-y-1">
                <h1 className="text-2xl font-bold text-secondary-900">Track Order</h1>
                <p className="text-secondary-500 text-sm font-mono">#{order.tracking_token}</p>
            </div>

            {/* Timeline Card */}
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-secondary-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-400 to-accent-400 opacity-20" />

                {activeIndex === -1 ? (
                    <div className="text-center text-red-500 font-bold py-8">Order Cancelled / Rejected</div>
                ) : (
                    <div className="space-y-8 relative">
                        {/* Vertical Line */}
                        <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-secondary-100 -z-0" />

                        {steps.map((step, idx) => {
                            const isActive = idx === activeIndex;
                            const isCompleted = idx < activeIndex;

                            return (
                                <div key={step.id} className="flex items-center gap-4 relative z-10">
                                    <div className={`
                           w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500
                           ${isActive || isCompleted ? 'bg-primary-DEFAULT border-primary-100 text-white' : 'bg-white border-secondary-100 text-secondary-300'}
                        `}>
                                        {isActive ? (
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ repeat: Infinity, duration: 2 }}
                                            >
                                                <step.icon size={20} />
                                            </motion.div>
                                        ) : (
                                            <step.icon size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className={`font-bold transition-colors ${isActive || isCompleted ? 'text-secondary-900' : 'text-secondary-300'}`}>
                                            {step.label}
                                        </h3>
                                        {isActive && (
                                            <motion.p
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-xs text-primary-600 font-medium"
                                            >
                                                {order.status === 'pending' && 'Waiting for merchant...'}
                                                {order.status === 'accepted' && 'Preparing your food...'}
                                                {order.status === 'cooking' && 'Cooking in progress...'}
                                                {order.status === 'delivering' && 'Driver is heading to you!'}
                                                {order.status === 'completed' && 'Enjoy your meal!'}
                                            </motion.p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Merchant / Chat Info */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-secondary-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-secondary-50 w-12 h-12 rounded-full flex items-center justify-center text-xl">
                        👨‍🍳
                    </div>
                    <div>
                        <h3 className="font-bold text-secondary-900 text-sm">{order.merchants?.merchant_name}</h3>
                        <p className="text-xs text-secondary-500">Merchant</p>
                    </div>
                </div>
                {order.merchants?.phone && (
                    <a
                        href={`https://wa.me/${order.merchants.phone}`}
                        target="_blank"
                        className="bg-green-500 text-white p-3 rounded-xl shadow-lg shadow-green-500/30 hover:bg-green-600 transition-colors"
                    >
                        <MessageCircle size={20} />
                    </a>
                )}
            </div>

            {/* Order Details Accordion (Simplified) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-secondary-100">
                <h3 className="font-bold text-secondary-900 mb-4 border-b pb-2">Order Details</h3>
                <div className="space-y-3">
                    {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-secondary-600 font-medium">{item.quantity}x {item.item_name}</span>
                            <span className="text-secondary-900 font-bold">Rp {item.subtotal.toLocaleString()}</span>
                        </div>
                    ))}
                    <div className="pt-4 mt-4 border-t border-dashed border-secondary-200 flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary-DEFAULT">Rp {order.total_amount.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <Link href="/" className="block text-center text-secondary-400 text-sm py-4">
                Back to Home
            </Link>

        </motion.div>
    );
}
