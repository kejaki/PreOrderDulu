'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, type MenuItem, type Merchant } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { LogOut, Plus, Power, Package, ChefHat, Bike, CheckCircle, XCircle, Store, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MerchantDashboard() {
    const router = useRouter();
    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');

    // Load Merchant Profile
    useEffect(() => {
        async function loadSession() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/merchant/login');
                return;
            }

            const { data: merchantData, error } = await supabase
                .from('merchants')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error || !merchantData) {
                console.error('Merchant load error:', error);
                return;
            }

            setMerchant(merchantData);
            setIsLoading(false);
        }
        loadSession();
    }, [router]);

    // Toggle Store Status
    const toggleStatus = async () => {
        if (!merchant) return;
        const newStatus = !merchant.is_open;
        setMerchant({ ...merchant, is_open: newStatus }); // Optimistic
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
                            <p className="text-xs text-secondary-500 font-medium">Dashboard</p>
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
            {/* Pending Section */}
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

            {/* Active Section */}
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
                ${isPending ? 'border-l-yellow-400' : 'border-l-primary-DEFAULT'}
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
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', price: '', description: '', category: '' });

    useEffect(() => {
        async function fetchMenu() {
            const { data } = await supabase.from('menu_items').select('*').eq('merchant_id', merchantId).order('created_at');
            if (data) setItems(data as MenuItem[]);
        }
        fetchMenu();
    }, [merchantId]);

    const toggleAvailability = async (id: string, current: boolean) => {
        setItems(items.map(i => i.id === id ? { ...i, is_available: !current } : i));
        await supabase.from('menu_items').update({ is_available: !current }).eq('id', id);
    };

    const addItem = async () => {
        if (!newItem.name || !newItem.price) return;
        const { data } = await supabase.from('menu_items').insert({
            merchant_id: merchantId,
            item_name: newItem.name,
            price: parseInt(newItem.price),
            description: newItem.description,
            category: newItem.category || 'Other',
            is_available: true
        }).select().single();

        if (data) {
            setItems([...items, data as MenuItem]);
            setIsAdding(false);
            setNewItem({ name: '', price: '', description: '', category: '' });
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <span className="bg-orange-100 text-orange-700 p-2 rounded-lg"><Coffee size={24} /></span>
                    <h2 className="text-xl font-bold text-secondary-900">Menu Management</h2>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)}>
                    <Plus size={18} className="mr-2" /> Add New Item
                </Button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white p-6 rounded-2xl shadow-lg mb-6 border border-primary-100 overflow-hidden"
                    >
                        <h3 className="font-bold mb-4 text-primary-DEFAULT">Add New Menu Item</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Input label="Name" placeholder="e.g. Nasi Goreng" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
                            <Input label="Price" type="number" placeholder="15000" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} />
                            <Input label="Category" placeholder="e.g. Makanan Berat" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} />
                            <Input label="Description" placeholder="Description..." value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="secondary" onClick={() => setIsAdding(false)}>Cancel</Button>
                            <Button onClick={addItem}>Save & Publish</Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map(item => (
                    <div key={item.id} className={`bg-white p-5 rounded-2xl shadow-sm border transition-all ${!item.is_available ? 'opacity-60 border-secondary-100 bg-secondary-50' : 'border-secondary-200 hover:border-primary-300 hover:shadow-md'}`}>
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-secondary-900 text-lg leading-tight">{item.item_name}</h3>
                            <Badge variant="info" size="sm" className="bg-secondary-100 text-secondary-600 border-secondary-200">{item.category}</Badge>
                        </div>
                        <p className="text-sm text-secondary-500 mb-4 line-clamp-2 min-h-[40px]">{item.description || 'No description'}</p>
                        <div className="flex items-center justify-between mt-auto">
                            <span className="font-bold text-primary-DEFAULT text-lg">Rp {item.price.toLocaleString()}</span>
                            <button
                                onClick={() => toggleAvailability(item.id, item.is_available)}
                                className={`
                                   p-2 rounded-lg transition-colors
                                   ${item.is_available
                                        ? 'text-green-600 bg-green-50 hover:bg-green-100'
                                        : 'text-secondary-400 bg-secondary-100 hover:bg-secondary-200'}
                                `}
                                title="Toggle Availability"
                            >
                                {item.is_available ? <CheckCircle size={20} /> : <XCircle size={20} />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
