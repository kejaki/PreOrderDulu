'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState } from 'react';
import { useCartStore } from '@/store/useCartStore';

const LocationPicker = dynamic(
    () => import('@/components/MerchantRegistration/LocationPicker').then(mod => mod.LocationPicker),
    {
        ssr: false,
        loading: () => <div className="h-64 bg-secondary-50 animate-pulse rounded-xl" />
    }
);
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MapPin, Phone, User, Store, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { nanoid } from 'nanoid';
import { motion } from 'framer-motion';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, merchantId, merchantName, clearCart, getTotal } = useCartStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        whatsapp: '',
        addressText: '',
        latitude: null as number | null,
        longitude: null as number | null,
        notes: '',
    });

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-background">
                <div className="text-6xl mb-4 animate-bounce">🛒</div>
                <h2 className="text-2xl font-bold text-secondary-900 mb-2">Cart is empty</h2>
                <Link href="/" className="text-primary-DEFAULT font-bold hover:underline">Start Ordering</Link>
            </div>
        );
    }

    const subtotal = getTotal();
    const deliveryFee = 5000;
    const totalAmount = subtotal + deliveryFee;

    const handleSubmit = async () => {
        if (!formData.name || !formData.whatsapp || !formData.latitude) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);

        try {
            const trackingToken = nanoid(10);

            const { data: order, error } = await supabase.from('orders').insert({
                merchant_id: merchantId,
                guest_name: formData.name,
                guest_whatsapp: formData.whatsapp,
                guest_address_text: formData.addressText,
                guest_latitude: formData.latitude,
                guest_longitude: formData.longitude,
                guest_notes: formData.notes,
                status: 'pending',
                payment_method: 'cod', // Defaulting to COD for MVP
                subtotal: subtotal,
                delivery_fee: deliveryFee,
                total_amount: totalAmount,
                tracking_token: trackingToken,
            }).select().single();

            if (error) throw error;

            const orderItems = items.map(item => ({
                order_id: order.id,
                menu_item_id: item.id,
                item_name: item.item_name,
                item_price: item.price,
                quantity: item.quantity,
                subtotal: item.price * item.quantity,
            }));

            await supabase.from('order_items').insert(orderItems);

            clearCart();
            router.push(`/order/${trackingToken}`);

        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="min-h-screen bg-background pb-24"
        >
            {/* Header */}
            <div className="bg-white p-4 sticky top-0 z-40 shadow-sm flex items-center gap-4">
                <Link href={`/merchant/${merchantId}`}>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={24} /></button>
                </Link>
                <h1 className="text-xl font-bold text-secondary-900">Checkout</h1>
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-6">

                {/* Merchant Info */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-secondary-100 flex items-center gap-3">
                    <div className="bg-secondary-50 w-12 h-12 rounded-full flex items-center justify-center text-2xl">
                        🏪
                    </div>
                    <div>
                        <p className="text-xs text-secondary-500 font-medium uppercase tracking-wider">Ordering from</p>
                        <h2 className="text-lg font-bold text-secondary-900">{merchantName}</h2>
                    </div>
                </div>

                {/* Guest Form */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-secondary-100 space-y-5">
                    <div className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-4 top-3.5 text-secondary-400" size={20} />
                            <input
                                type="text"
                                placeholder="Your Name"
                                className="w-full pl-12 pr-4 py-3 bg-secondary-50 border-none rounded-xl focus:ring-2 focus:ring-primary-DEFAULT transition-all font-medium text-secondary-900"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="relative">
                            <Phone className="absolute left-4 top-3.5 text-secondary-400" size={20} />
                            <input
                                type="tel"
                                placeholder="WhatsApp Number"
                                className="w-full pl-12 pr-4 py-3 bg-secondary-50 border-none rounded-xl focus:ring-2 focus:ring-primary-DEFAULT transition-all font-medium text-secondary-900"
                                value={formData.whatsapp}
                                onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="text-sm font-bold text-secondary-900 mb-2 block flex items-center gap-2">
                            <MapPin size={16} className="text-primary-DEFAULT" /> Delivery Location
                        </label>
                        <div className="rounded-xl overflow-hidden border border-secondary-200">
                            <Suspense fallback={<div className="h-64 bg-secondary-50 animate-pulse" />}>
                                <LocationPicker
                                    onLocationSelect={(lat, lng, address) => setFormData({ ...formData, latitude: lat, longitude: lng, addressText: address })}
                                />
                            </Suspense>
                        </div>
                        <textarea
                            placeholder="Specific instructions (e.g. 'Pagar Hitam, Bel sebelah kiri')"
                            className="w-full mt-3 p-3 bg-secondary-50 border-none rounded-xl focus:ring-2 focus:ring-primary-DEFAULT text-sm min-h-[80px]"
                            value={formData.addressText}
                            onChange={e => setFormData({ ...formData, addressText: e.target.value })}
                        />
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-secondary-100">
                    <h3 className="font-bold text-secondary-900 mb-4">Payment Summary</h3>
                    <div className="space-y-2 text-sm text-secondary-600">
                        <div className="flex justify-between">
                            <span>Subtotal ({items.length} items)</span>
                            <span>Rp {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Delivery Fee</span>
                            <span>Rp {deliveryFee.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-dashed border-secondary-200 my-2 pt-2 flex justify-between font-bold text-lg text-secondary-900">
                            <span>Total Pay</span>
                            <span className="text-primary-DEFAULT">Rp {totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* FAB Submit */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-secondary-100 pb-8 z-50">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-primary-DEFAULT text-white h-14 rounded-2xl font-bold text-xl shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Processing...' : (
                        <>
                            Place Order <ChevronRight size={24} />
                        </>
                    )}
                </motion.button>
            </div>

        </motion.div>
    );
}
