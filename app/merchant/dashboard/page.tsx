'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, type MenuItem, type Merchant } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
    LogOut, Plus, Power, Package, ChefHat, Bike,
    CheckCircle, XCircle, Store, Coffee, Image as ImageIcon,
    Trash2, Loader2, Save, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MerchantDashboard() {
    const router = useRouter();
    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');

    useEffect(() => {
        async function loadSession() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/merchant/login');
                return;
            }

            const { data: merchantData, error } = await supabase
                .from('merchants')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error || !merchantData) {
                console.error('Merchant load error:', error);
                // If merchant record doesn't exist, maybe it's not a merchant or signup failed
                return;
            }

            setMerchant(merchantData);
            setIsLoading(false);
        }
        loadSession();
    }, [router]);

    const toggleStatus = async () => {
        if (!merchant) return;
        const newStatus = !merchant.is_open;
        setMerchant({ ...merchant, is_open: newStatus });
        await supabase.from('merchants').update({ is_open: newStatus }).eq('id', merchant.id);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/merchant/login');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-secondary-50 p-6 space-y-6">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <div className="grid gap-6 md:grid-cols-3">
                    <Skeleton className="h-40 col-span-2 rounded-2xl" />
                    <Skeleton className="h-40 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!merchant) return null;

    return (
        <div className="min-h-screen bg-secondary-50">
            {/* Navbar */}
            <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-secondary-100">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary-50 p-2 rounded-xl text-primary-DEFAULT">
                            <Store size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-secondary-900 leading-none">{merchant.merchant_name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                {merchant.is_verified ? (
                                    <Badge size="sm" variant="success" className="text-[10px]">Verified Account</Badge>
                                ) : (
                                    <Badge size="sm" variant="warning" className="text-[10px]">Pending Verification</Badge>
                                )}
                            </div>
                        </div>

                        <div
                            onClick={toggleStatus}
                            className={`
                             ml-4 flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold cursor-pointer transition-all active:scale-95 select-none
                             ${merchant.is_open
                                    ? 'bg-green-100 text-green-700 ring-2 ring-green-500/20'
                                    : 'bg-red-100 text-red-700 ring-2 ring-red-500/20'}
                           `}
                        >
                            <Power size={16} />
                            {merchant.is_open ? 'STORE OPEN' : 'STORE CLOSED'}
                        </div>
                    </div>

                    <Button variant="secondary" size="sm" onClick={handleLogout}>
                        <LogOut size={16} className="mr-2" />
                        Logout
                    </Button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Tabs */}
                <div className="flex space-x-1 mb-8 bg-white p-1 rounded-xl w-fit border border-secondary-100 shadow-sm">
                    {['orders', 'menu'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`
                               px-6 py-2.5 rounded-lg text-sm font-bold transition-all relative
                               ${activeTab === tab ? 'text-primary-900' : 'text-secondary-500 hover:bg-secondary-50'}
                            `}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="active-tab"
                                    className="absolute inset-0 bg-primary-100 rounded-lg -z-0"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                {tab === 'orders' ? <Package size={18} /> : <Coffee size={18} />}
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'orders' ? (
                            <OrdersView merchantId={merchant.id} />
                        ) : (
                            <MenuView merchantId={merchant.id} />
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}

// --- Orders View ---

function OrdersView({ merchantId }: { merchantId: string }) {
    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        const fetchOrders = async () => {
            const { data } = await supabase
                .from('orders')
                .select(`*, order_items (*)`)
                .eq('merchant_id', merchantId)
                .order('created_at', { ascending: false });
            if (data) setOrders(data);
        };
        fetchOrders();

        const sub = supabase.channel('merchant-orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `merchant_id=eq.${merchantId}` }, () => fetchOrders())
            .subscribe();
        return () => { supabase.removeChannel(sub); };
    }, [merchantId]);

    const updateStatus = async (orderId: string, newStatus: string) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    };

    const pendingOrders = orders.filter(o => o.status === 'pending');
    const activeOrders = orders.filter(o => ['accepted', 'cooking', 'ready', 'delivering'].includes(o.status));

    return (
        <div className="space-y-8">
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <span className="bg-yellow-100 text-yellow-700 p-2 rounded-lg"><Package size={24} /></span>
                    <h2 className="text-xl font-bold text-secondary-900">Incoming Orders</h2>
                    <Badge variant="warning" className="ml-auto text-lg px-3">{pendingOrders.length}</Badge>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence>
                        {pendingOrders.map(order => (
                            <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} isPending />
                        ))}
                    </AnimatePresence>
                    {pendingOrders.length === 0 && (
                        <div className="col-span-full py-12 text-center text-secondary-400 bg-white rounded-2xl border border-dashed border-secondary-200">
                            No pending orders right now.
                        </div>
                    )}
                </div>
            </section>

            <section>
                <div className="flex items-center gap-3 mb-4">
                    <span className="bg-blue-100 text-blue-700 p-2 rounded-lg"><ChefHat size={24} /></span>
                    <h2 className="text-xl font-bold text-secondary-900">Active Kitchen</h2>
                    <Badge variant="info" className="ml-auto text-lg px-3">{activeOrders.length}</Badge>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence>
                        {activeOrders.map(order => (
                            <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} />
                        ))}
                    </AnimatePresence>
                </div>
            </section>
        </div>
    );
}

function OrderCard({ order, onUpdateStatus, isPending = false }: { order: any, onUpdateStatus: any, isPending?: boolean }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`
                bg-white rounded-2xl p-5 shadow-sm border-l-4 overflow-hidden relative
                ${isPending ? 'border-l-yellow-400 font-bold' : 'border-l-primary-DEFAULT'}
            `}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-secondary-900 text-lg">{order.guest_name}</h3>
                    <p className="text-xs font-mono text-secondary-500">#{order.tracking_token.substring(0, 6)}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-secondary-400 mb-1">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <Badge size="sm" variant={isPending ? 'warning' : 'info'}>{order.status}</Badge>
                </div>
            </div>

            <div className="bg-secondary-50 rounded-xl p-3 space-y-2 mb-4">
                {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                        <span className="font-medium text-secondary-700"><span className="text-primary-DEFAULT font-bold">{item.quantity}x</span> {item.item_name}</span>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center mb-4 font-bold text-secondary-900">
                <span>Total</span>
                <span className="text-primary-DEFAULT">Rp {order.total_amount.toLocaleString()}</span>
            </div>

            <div className="flex gap-2">
                {isPending ? (
                    <>
                        <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white" onClick={() => onUpdateStatus(order.id, 'accepted')}>Accept</Button>
                        <Button className="flex-1 bg-red-100 text-red-600 hover:bg-red-200" onClick={() => onUpdateStatus(order.id, 'rejected')}>Reject</Button>
                    </>
                ) : (
                    <div className="flex-1 grid gap-2">
                        {order.status === 'accepted' && <Button onClick={() => onUpdateStatus(order.id, 'cooking')}><ChefHat size={18} className="mr-2" /> Cooking</Button>}
                        {order.status === 'cooking' && <Button onClick={() => onUpdateStatus(order.id, 'ready')}><Package size={18} className="mr-2" /> Ready</Button>}
                        {order.status === 'ready' && <Button onClick={() => onUpdateStatus(order.id, 'delivering')}><Bike size={18} className="mr-2" /> Deliver</Button>}
                        {order.status === 'delivering' && <Button className="bg-green-500 hover:bg-green-600" onClick={() => onUpdateStatus(order.id, 'completed')}><CheckCircle size={18} className="mr-2" /> Done</Button>}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// --- Menu View ---

function MenuView({ merchantId }: { merchantId: string }) {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchMenu();
    }, [merchantId]);

    const fetchMenu = async () => {
        const { data } = await supabase.from('menu_items').select('*').eq('merchant_id', merchantId).order('created_at');
        if (data) setItems(data as MenuItem[]);
    };

    const toggleAvailability = async (id: string, current: boolean) => {
        setItems(items.map(i => i.id === id ? { ...i, is_available: !current } : i));
        await supabase.from('menu_items').update({ is_available: !current }).eq('id', id);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        setItems(items.filter(i => i.id !== id));
        await supabase.from('menu_items').delete().eq('id', id);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <span className="bg-orange-100 text-orange-700 p-2 rounded-lg"><Coffee size={24} /></span>
                    <h2 className="text-xl font-bold text-secondary-900">Menu Management</h2>
                </div>
                <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
                    <Plus size={18} className="mr-2" /> Add New Item
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {items.map(item => (
                    <motion.div
                        layout
                        key={item.id}
                        className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col transition-all ${!item.is_available ? 'opacity-70 grayscale' : 'border-secondary-100 hover:shadow-md'}`}
                    >
                        <div className="relative h-40 bg-secondary-100 overflow-hidden">
                            {item.photo_url ? (
                                <img src={item.photo_url} alt={item.item_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-secondary-400">
                                    <ImageIcon size={48} />
                                </div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-1">
                                <button
                                    onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                                    className="p-1.5 bg-white/90 rounded-lg text-secondary-600 hover:text-primary-DEFAULT shadow-sm"
                                >
                                    <ChefHat size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-1.5 bg-white/90 rounded-lg text-secondary-600 hover:text-red-500 shadow-sm"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-secondary-900 text-lg leading-tight">{item.item_name}</h3>
                                <Badge variant="info" size="sm" className="bg-secondary-100 text-secondary-600 border-secondary-200">{item.category}</Badge>
                            </div>
                            <p className="text-sm text-secondary-500 mb-4 line-clamp-2">{item.description || 'No description provided.'}</p>

                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-secondary-50">
                                <span className="font-bold text-primary-DEFAULT text-lg">Rp {item.price.toLocaleString()}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-medium text-secondary-400">
                                        {item.is_available ? 'Available' : 'Sold Out'}
                                    </span>
                                    <button
                                        onClick={() => toggleAvailability(item.id, item.is_available)}
                                        className={`
                                            w-10 h-5 rounded-full transition-colors relative
                                            ${item.is_available ? 'bg-green-500' : 'bg-secondary-300'}
                                        `}
                                    >
                                        <motion.div
                                            animate={{ x: item.is_available ? 20 : 2 }}
                                            className="w-4 h-4 bg-white rounded-full absolute top-0.5"
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <MenuModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={fetchMenu}
                initialData={editingItem}
                merchantId={merchantId}
            />
        </div>
    );
}

interface MenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    initialData: MenuItem | null;
    merchantId: string;
}

function MenuModal({ isOpen, onClose, onSave, initialData, merchantId }: MenuModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        item_name: '',
        price: '',
        description: '',
        categories: [] as string[],
        options: [] as any[],
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const AVAILABLE_CATEGORIES = ['Nasi', 'Ayam', 'Minuman', 'Cemilan', 'Promo', 'Pedas', 'Vegetarian'];

    useEffect(() => {
        if (initialData) {
            setFormData({
                item_name: initialData.item_name,
                price: initialData.price.toString(),
                description: initialData.description || '',
                categories: initialData.categories || [],
                options: initialData.options || [],
            });
            setImagePreview(initialData.photo_url || null);
        } else {
            setFormData({ item_name: '', price: '', description: '', categories: [], options: [] });
            setImagePreview(null);
            setImageFile(null);
        }
    }, [initialData, isOpen]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const toggleCategory = (cat: string) => {
        if (formData.categories.includes(cat)) {
            setFormData({ ...formData, categories: formData.categories.filter(c => c !== cat) });
        } else {
            setFormData({ ...formData, categories: [...formData.categories, cat] });
        }
    };

    const addOptionGroup = () => {
        setFormData({
            ...formData,
            options: [...formData.options, { name: '', required: false, choices: [{ label: '', price: 0 }] }]
        });
    };

    const updateOptionGroup = (index: number, field: string, value: any) => {
        const newOptions = [...formData.options];
        newOptions[index] = { ...newOptions[index], [field]: value };
        setFormData({ ...formData, options: newOptions });
    };

    const removeOptionGroup = (index: number) => {
        setFormData({ ...formData, options: formData.options.filter((_, i) => i !== index) });
    };

    const addChoice = (optionIndex: number) => {
        const newOptions = [...formData.options];
        newOptions[optionIndex].choices.push({ label: '', price: 0 });
        setFormData({ ...formData, options: newOptions });
    };

    const updateChoice = (optionIndex: number, choiceIndex: number, field: string, value: any) => {
        const newOptions = [...formData.options];
        newOptions[optionIndex].choices[choiceIndex] = { ...newOptions[optionIndex].choices[choiceIndex], [field]: value };
        setFormData({ ...formData, options: newOptions });
    };

    const removeChoice = (optionIndex: number, choiceIndex: number) => {
        const newOptions = [...formData.options];
        newOptions[optionIndex].choices = newOptions[optionIndex].choices.filter((_: any, i: number) => i !== choiceIndex);
        setFormData({ ...formData, options: newOptions });
    };

    const handleSave = async () => {
        if (!formData.item_name || !formData.price) return;
        setIsLoading(true);

        try {
            let photo_url = imagePreview;

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${merchantId}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('food-images')
                    .upload(fileName, imageFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('food-images').getPublicUrl(fileName);
                photo_url = data.publicUrl;
            }

            const payload = {
                merchant_id: merchantId,
                item_name: formData.item_name,
                price: parseInt(formData.price),
                description: formData.description,
                categories: formData.categories,
                options: formData.options,
                photo_url: photo_url,
                is_available: true,
                stock: 100,
            };

            if (initialData) {
                await supabase.from('menu_items').update(payload).eq('id', initialData.id);
            } else {
                await supabase.from('menu_items').insert(payload);
            }

            onSave();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Failed to save menu item');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-secondary-DEFAULT/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden relative z-10 my-8"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-primary-50 to-white">
                            <h3 className="text-xl font-bold text-secondary-DEFAULT">
                                {initialData ? '✏️ Edit Menu Item' : '➕ Add New Menu Item'}
                            </h3>
                            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                                <X size={20} className="text-secondary-DEFAULT" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Image Upload */}
                            <div className="flex flex-col items-center">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-48 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-DEFAULT hover:bg-primary-50 transition-all overflow-hidden"
                                >
                                    {imagePreview ? (
                                        <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                    ) : (
                                        <>
                                            <ImageIcon className="text-gray-300 mb-2" size={48} />
                                            <span className="text-sm font-medium text-gray-500">Upload Food Photo</span>
                                        </>
                                    )}
                                </div>
                                <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleImageChange} />
                                {imagePreview && (
                                    <button
                                        onClick={() => { setImagePreview(null); setImageFile(null); }}
                                        className="mt-2 text-xs text-red-500 font-bold hover:underline"
                                    >
                                        Remove Photo
                                    </button>
                                )}
                            </div>

                            {/* Basic Info */}
                            <div className="space-y-4">
                                <Input
                                    label="Menu Name"
                                    placeholder="e.g. Nasi Goreng Spesial"
                                    value={formData.item_name}
                                    onChange={e => setFormData({ ...formData, item_name: e.target.value })}
                                />
                                <Input
                                    label="Base Price (Rp)"
                                    type="number"
                                    placeholder="25000"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                />
                                <div>
                                    <label className="block text-sm font-bold text-secondary-DEFAULT mb-2">Description</label>
                                    <textarea
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent resize-none text-sm"
                                        rows={3}
                                        placeholder="Describe your delicious food..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Multi-Category Tags */}
                            <div className="bg-primary-50 p-4 rounded-2xl border border-primary-100">
                                <label className="block text-sm font-bold text-secondary-DEFAULT mb-3 flex items-center gap-2">
                                    <span className="bg-primary-DEFAULT text-white p-1 rounded">🏷️</span>
                                    Categories (Select Multiple)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {AVAILABLE_CATEGORIES.map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => toggleCategory(cat)}
                                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border-2 ${formData.categories.includes(cat)
                                                    ? 'bg-primary-DEFAULT text-white border-primary-DEFAULT shadow-md scale-105'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-200'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Variants/Options Builder */}
                            <div className="bg-accent-50 p-4 rounded-2xl border border-accent-100">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-sm font-bold text-secondary-DEFAULT flex items-center gap-2">
                                        <span className="bg-accent-DEFAULT text-white p-1 rounded">⚙️</span>
                                        Varian & Tambahan (Optional)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addOptionGroup}
                                        className="px-3 py-1.5 bg-accent-DEFAULT text-white rounded-lg text-xs font-bold hover:bg-accent-600 flex items-center gap-1"
                                    >
                                        <Plus size={14} /> Add Group
                                    </button>
                                </div>

                                {formData.options.map((option, optIdx) => (
                                    <div key={optIdx} className="bg-white p-4 rounded-xl mb-3 border border-gray-200">
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                placeholder="Group Name (e.g., Level Pedas)"
                                                value={option.name}
                                                onChange={e => updateOptionGroup(optIdx, 'name', e.target.value)}
                                                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-DEFAULT"
                                            />
                                            <label className="flex items-center gap-2 px-3 text-xs font-bold text-gray-600 bg-gray-50 rounded-lg">
                                                <input
                                                    type="checkbox"
                                                    checked={option.required}
                                                    onChange={e => updateOptionGroup(optIdx, 'required', e.target.checked)}
                                                    className="w-4 h-4"
                                                />
                                                Required
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => removeOptionGroup(optIdx)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {option.choices.map((choice: any, choiceIdx: number) => (
                                            <div key={choiceIdx} className="flex gap-2 mb-2">
                                                <input
                                                    type="text"
                                                    placeholder="Choice (e.g., Level 1)"
                                                    value={choice.label}
                                                    onChange={e => updateChoice(optIdx, choiceIdx, 'label', e.target.value)}
                                                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-DEFAULT"
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Price"
                                                    value={choice.price}
                                                    onChange={e => updateChoice(optIdx, choiceIdx, 'price', parseInt(e.target.value) || 0)}
                                                    className="w-24 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-DEFAULT"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeChoice(optIdx, choiceIdx)}
                                                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() => addChoice(optIdx)}
                                            className="text-xs text-primary-DEFAULT font-bold hover:underline flex items-center gap-1 mt-2"
                                        >
                                            <Plus size={12} /> Add Choice
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
                            <Button variant="secondary" className="flex-1" onClick={onClose} disabled={isLoading}>Cancel</Button>
                            <Button className="flex-1 bg-primary-DEFAULT hover:bg-primary-700" onClick={handleSave} isLoading={isLoading}>
                                {initialData ? '💾 Update Item' : '➕ Create Item'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
