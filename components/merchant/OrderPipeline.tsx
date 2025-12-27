'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChefHat, CheckCircle, Package, ArrowRight, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface OrderPipelineProps {
    orders: any[];
    onUpdateStatus: (orderId: string, status: string) => void;
}

export function OrderPipeline({ orders, onUpdateStatus }: OrderPipelineProps) {
    const [activeTab, setActiveTab] = useState<'pending' | 'process' | 'ready'>('pending');

    const pendingOrders = orders.filter(o => o.status === 'pending');
    const processOrders = orders.filter(o => ['accepted', 'cooking'].includes(o.status));
    const readyOrders = orders.filter(o => o.status === 'ready' || o.status === 'delivering');

    const tabs = [
        { id: 'pending', label: 'Baru Masuk', icon: Clock, count: pendingOrders.length, color: 'text-orange-600', bg: 'bg-orange-50' },
        { id: 'process', label: 'Diproses', icon: ChefHat, count: processOrders.length, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'ready', label: 'Siap Ambil', icon: CheckCircle, count: readyOrders.length, color: 'text-green-600', bg: 'bg-green-50' },
    ];

    const currentOrders = activeTab === 'pending' ? pendingOrders
        : activeTab === 'process' ? processOrders
            : readyOrders;

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px] flex flex-col">
            {/* Custom Tab Header */}
            <div className="flex border-b border-slate-100 p-2 gap-2 bg-slate-50/50">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all relative flex items-center justify-center gap-2
                            ${activeTab === tab.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:bg-slate-100'}
                        `}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="pipeline-tab"
                                className="absolute inset-0 border-2 border-primary-500/10 rounded-xl"
                            />
                        )}
                        <tab.icon size={16} className={activeTab === tab.id ? tab.color : ''} />
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${tab.bg} ${tab.color}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="p-6 flex-1 bg-slate-50/30 overflow-y-auto">
                <AnimatePresence mode='popLayout'>
                    {currentOrders.length > 0 ? (
                        <div className="grid gap-4">
                            {currentOrders.map((order) => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onUpdateStatus={onUpdateStatus}
                                    pipelineStage={activeTab}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                            <Package size={48} className="mb-4 opacity-20" />
                            <p className="font-medium">Tidak ada pesanan di tahap ini</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function OrderCard({ order, onUpdateStatus, pipelineStage }: { order: any, onUpdateStatus: any, pipelineStage: string }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 group hover:shadow-md transition-all"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-600">
                        {order.guest_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-lg">{order.guest_name}</h4>
                        <p className="text-xs font-mono text-slate-400">#{order.tracking_token.substring(0, 6)} • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
                <Badge variant={pipelineStage === 'pending' ? 'warning' : 'default'} className="uppercase text-[10px]">
                    {order.status}
                </Badge>
            </div>

            {/* Order Items */}
            <div className="space-y-2 mb-5 bg-slate-50 p-3 rounded-xl">
                {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-slate-700">
                            <span className="font-bold text-slate-900 mr-2">{item.quantity}x</span>
                            {item.item_name}
                        </span>
                    </div>
                ))}
                {order.guest_notes && (
                    <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg mt-2 font-medium border border-amber-100">
                        Note: {order.guest_notes}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                <div className="font-bold text-primary-DEFAULT">
                    Rp {order.total_amount.toLocaleString()}
                </div>

                <div className="flex gap-2">
                    {/* Pending Actions */}
                    {pipelineStage === 'pending' && (
                        <>
                            <button
                                onClick={() => onUpdateStatus(order.id, 'rejected')}
                                className="px-4 py-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 text-sm font-bold flex items-center transition-colors"
                            >
                                <X size={16} className="mr-1" /> Tolak
                            </button>
                            <button
                                onClick={() => onUpdateStatus(order.id, 'accepted')}
                                className="px-4 py-2 rounded-lg text-white bg-primary-DEFAULT hover:bg-primary-700 text-sm font-bold flex items-center shadow-md shadow-primary-200 transition-all active:scale-95"
                            >
                                <CheckCircle size={16} className="mr-1" /> Terima
                            </button>
                        </>
                    )}

                    {/* Process Actions */}
                    {pipelineStage === 'process' && (
                        order.status === 'accepted' ? (
                            <button
                                onClick={() => onUpdateStatus(order.id, 'cooking')}
                                className="px-5 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 text-sm font-bold flex items-center shadow-md shadow-blue-200"
                            >
                                <ChefHat size={16} className="mr-2" /> Mulai Masak
                            </button>
                        ) : (
                            <button
                                onClick={() => onUpdateStatus(order.id, 'ready')}
                                className="px-5 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 text-sm font-bold flex items-center shadow-md shadow-green-200"
                            >
                                <Package size={16} className="mr-2" /> Selesai Masak
                            </button>
                        )
                    )}

                    {/* Ready Actions */}
                    {pipelineStage === 'ready' && (
                        <button
                            onClick={() => onUpdateStatus(order.id, 'completed')}
                            className="px-5 py-2 rounded-lg text-white bg-slate-900 hover:bg-slate-800 text-sm font-bold flex items-center shadow-lg transition-all active:scale-95"
                        >
                            Sudah Diambil <ArrowRight size={16} className="ml-2" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
