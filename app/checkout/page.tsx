'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';
import { useCartStore } from '@/store/useCartStore';

const LocationPicker = dynamic(
    () => import('@/components/MerchantRegistration/LocationPicker').then(mod => mod.LocationPicker),
    {
        ssr: false,
        loading: () => <div className="h-64 bg-secondary-50 animate-pulse rounded-xl" />
    }
);
import { supabase, getMerchantById, type Merchant } from '@/lib/supabase';
import { ArrowLeft, MapPin, Phone, User, ChevronRight, Bike, ShoppingBag, Clock, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { nanoid } from 'nanoid';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateDeliveryFee } from '@/utils/calculateFee';
import { calculateDistance } from '@/lib/geolocation';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, merchantId, merchantName, clearCart, getTotal, orderType, setOrderType } = useCartStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch merchant details on mount
    useEffect(() => {
        if (merchantId) {
            getMerchantById(merchantId).then(data => {
                if (data) setMerchant(data);
            });
        }
    }, [merchantId]);

    const [formData, setFormData] = useState({
        name: '',
        whatsapp: '',
        addressText: '',
        latitude: null as number | null,
        longitude: null as number | null,
        notes: '',
        pickupTime: '',
    });

    // Recalculate fee when location or order type changes
    const calculateFee = () => {
        if (!merchant || !formData.latitude || !formData.longitude) {
            setDeliveryFee(orderType === 'delivery' ? 0 : 0); // Default 0 to start
            setDistanceInfo(null);
            return;
        };

        const result = calculateDeliveryFee(
            formData.latitude,
            formData.longitude,
            merchant.latitude,
            merchant.longitude,
            orderType
        );

        setDeliveryFee(result.fee);
        setDistanceInfo({
            km: (result.distanceMeters / 1000).toFixed(1),
            isFree: result.isFreeZone
        });
    };

    // Trigger calculation when dependencies change
    // We can't use useEffect easily with nested objects without deep compare, 
    // so we call it where needed or use specific deps
    const updateLocation = (lat: number, lng: number, address: string) => {
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng, addressText: address }));
        // We need to wait for state update or pass values directly. 
        // Better to use useEffect on formData.latitude/longitude
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-background">
                <div className="text-6xl mb-4 animate-bounce">🛒</div>
                <h2 className="text-2xl font-bold text-secondary-DEFAULT mb-2">Cart is empty</h2>
                <Link href="/" className="text-primary-DEFAULT font-bold hover:underline">Start Ordering</Link>
            </div>
        );
    }

    const subtotal = getTotal();
    // Recalculate fee whenever relevant state changes
    useEffect(() => {
        if (merchant && formData.latitude && formData.longitude) {
            const result = calculateDeliveryFee(
                formData.latitude,
                formData.longitude,
                merchant.latitude,
                merchant.longitude,
                orderType
            );
            setDeliveryFee(result.fee);
            setDistanceInfo({
                km: (result.distanceMeters / 1000).toFixed(1),
                isFree: result.isFreeZone
            });
        } else {
            setDeliveryFee(0);
            setDistanceInfo(null);
        }
    }, [merchant, formData.latitude, formData.longitude, orderType]);

    const totalAmount = subtotal + deliveryFee;

    const handleSubmit = async () => {
        // Validation
        if (!formData.name || !formData.whatsapp) {
            alert('Please fill in your name and WhatsApp number');
            return;
        }

        if (orderType === 'delivery' && !formData.latitude) {
            alert('Please select delivery location on the map');
            return;
        }

        if (orderType === 'pickup' && !formData.pickupTime) {
            alert('Please specify your pickup time');
            return;
        }

        setIsSubmitting(true);

        try {
            const trackingToken = nanoid(10);

            const { data: order, error } = await supabase.from('orders').insert({
                merchant_id: merchantId,
                guest_name: formData.name,
                guest_whatsapp: formData.whatsapp,
                guest_address_text: orderType === 'delivery' ? formData.addressText : null,
                guest_latitude: orderType === 'delivery' ? formData.latitude : null,
                guest_longitude: orderType === 'delivery' ? formData.longitude : null,
                guest_notes: formData.notes,
                order_type: orderType,
                pickup_time: orderType === 'pickup' ? formData.pickupTime : null,
                status: 'pending',
                payment_method: 'cod',
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
                item_notes: item.notes || null,
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
            <div className="bg-white p-4 sticky top-0 z-40 shadow-sm border-b border-gray-200 flex items-center gap-4">
                <Link href={`/merchant/${merchantId}`}>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={24} className="text-secondary-DEFAULT" /></button>
                </Link>
                <h1 className="text-xl font-bold text-secondary-DEFAULT">Checkout</h1>
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-6">

                {/* Merchant Info */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-3">
                    <div className="bg-secondary-50 w-12 h-12 rounded-full flex items-center justify-center text-2xl">
                        🏪
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Ordering from</p>
                        <h2 className="text-lg font-bold text-secondary-DEFAULT">{merchantName}</h2>
                    </div>
                </div>

                {/* Segmented Control: Delivery vs Pickup */}
                <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setOrderType('delivery')}
                            className={`py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${orderType === 'delivery'
                                ? 'bg-primary-DEFAULT text-white shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Bike size={18} />
                            Pesan Antar
                        </button>
                        <button
                            onClick={() => setOrderType('pickup')}
                            className={`py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${orderType === 'pickup'
                                ? 'bg-primary-DEFAULT text-white shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <ShoppingBag size={18} />
                            Ambil Sendiri
                        </button>
                    </div>
                </div>

                {/* Guest Form */}
                <motion.div layout className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-5">
                    <div className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Your Name"
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent transition-all font-medium text-secondary-DEFAULT"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="relative">
                            <Phone className="absolute left-4 top-3.5 text-gray-400" size={20} />
                            <input
                                type="tel"
                                placeholder="WhatsApp Number"
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent transition-all font-medium text-secondary-DEFAULT"
                                value={formData.whatsapp}
                                onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Conditional: Delivery Address */}
                    <AnimatePresence mode="wait">
                        {orderType === 'delivery' && (
                            <motion.div
                                key="delivery-section"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="pt-2"
                            >
                                <label className="text-sm font-bold text-secondary-DEFAULT mb-2 block flex items-center gap-2">
                                    <MapPin size={16} className="text-primary-DEFAULT" /> Delivery Location
                                </label>
                                <div className="rounded-xl overflow-hidden border border-gray-200">
                                    <Suspense fallback={<div className="h-64 bg-gray-50 animate-pulse" />}>
                                        <LocationPicker
                                            onLocationSelect={(lat, lng, address) => setFormData({ ...formData, latitude: lat, longitude: lng, addressText: address })}
                                        />
                                    </Suspense>
                                </div>
                                <textarea
                                    placeholder="Specific instructions (e.g. 'Pagar Hitam, Bel sebelah kiri')"
                                    className="w-full mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent text-sm min-h-[80px]"
                                    value={formData.addressText}
                                    onChange={e => setFormData({ ...formData, addressText: e.target.value })}
                                />
                            </motion.div>
                        )}

                        {/* Conditional: Pickup Time */}
                        {orderType === 'pickup' && (
                            <motion.div
                                key="pickup-section"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="pt-2"
                            >
                                <label className="text-sm font-bold text-secondary-DEFAULT mb-2 block flex items-center gap-2">
                                    <Clock size={16} className="text-primary-DEFAULT" /> Waktu Pengambilan
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Jam 12.00, Siang ini, dll"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent font-medium text-secondary-DEFAULT"
                                    value={formData.pickupTime}
                                    onChange={e => setFormData({ ...formData, pickupTime: e.target.value })}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Summary */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-secondary-DEFAULT mb-4">Payment Summary</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>Subtotal ({items.length} items)</span>
                            <span>Rp {subtotal.toLocaleString()}</span>
                        </div>
                        {orderType === 'delivery' && (
                            <div className="flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span>Ongkos Kirim</span>
                                    {distanceInfo && (
                                        <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                                            {distanceInfo.isFree && <ShieldCheck size={10} className="text-green-500" />}
                                            Jarak: {distanceInfo.km}km
                                            {distanceInfo.isFree && <span className="text-green-600 ml-1">(Gratis &lt; 2km)</span>}
                                        </span>
                                    )}
                                </div>
                                {deliveryFee === 0 ? (
                                    <span className="font-bold text-green-600">GRATIS</span>
                                ) : (
                                    <span>Rp {deliveryFee.toLocaleString()}</span>
                                )}
                            </div>
                        )}
                        <div className="border-t border-dashed border-gray-200 my-2 pt-2 flex justify-between font-bold text-lg text-secondary-DEFAULT">
                            <span>Total Pay</span>
                            <span className="text-primary-DEFAULT">Rp {totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* FAB Submit */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 pb-8 z-50">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-primary-DEFAULT text-white h-14 rounded-2xl font-bold text-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
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
