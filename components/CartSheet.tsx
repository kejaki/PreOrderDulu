'use client';

import { useCartStore } from '@/store/useCartStore';
import { X, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export function CartSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { items, incrementItem, decrementItem, removeItem, updateNote, getTotal, clearCart } = useCartStore();
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

    const handleRemoveItem = (itemId: string, itemName: string) => {
        removeItem(itemId);
        toast.success(`${itemName} removed from cart`);
    };

    const handleIncrement = (itemId: string) => {
        incrementItem(itemId);
        toast.success('Quantity updated');
    };

    const handleDecrement = (itemId: string) => {
        decrementItem(itemId);
        toast.success('Quantity updated');
    };

    const handleClearCart = () => {
        if (confirm('Are you sure you want to clear your cart?')) {
            clearCart();
            toast.success('Cart cleared');
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black z-40"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="text-primary-DEFAULT" size={24} />
                                <h2 className="text-xl font-bold text-gray-900">Keranjang Saya</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X size={24} className="text-gray-600" />
                            </button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {items.length === 0 ? (
                                <div className="text-center py-20">
                                    <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500">Keranjang kosong</p>
                                    <p className="text-sm text-gray-400 mt-2">Tambahkan item dari merchant</p>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: 100 }}
                                        className="bg-gray-50 rounded-2xl p-4 space-y-3"
                                    >
                                        {/* Item Info & Trash */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900">{item.item_name}</h3>
                                                <p className="text-sm text-primary-DEFAULT font-semibold mt-1">
                                                    Rp {item.price.toLocaleString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveItem(item.id, item.item_name)}
                                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} className="text-red-500" />
                                            </button>
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleDecrement(item.id)}
                                                className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 border border-gray-200"
                                            >
                                                <Minus size={16} className="text-gray-700" />
                                            </button>
                                            <span className="text-lg font-bold text-gray-900 w-8 text-center">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => handleIncrement(item.id)}
                                                className="w-8 h-8 bg-primary-DEFAULT rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95"
                                            >
                                                <Plus size={16} className="text-white" />
                                            </button>
                                        </div>

                                        {/* Notes Section */}
                                        <div>
                                            {editingNoteId === item.id ? (
                                                <div className="space-y-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Catatan: misal 'Tidak pedas'"
                                                        defaultValue={item.notes || ''}
                                                        onBlur={(e) => {
                                                            updateNote(item.id, e.target.value);
                                                            setEditingNoteId(null);
                                                            if (e.target.value) toast.success('Note saved');
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                updateNote(item.id, e.currentTarget.value);
                                                                setEditingNoteId(null);
                                                                if (e.currentTarget.value) toast.success('Note saved');
                                                            }
                                                        }}
                                                        autoFocus
                                                        className="w-full px-3 py-2 border border-primary-DEFAULT rounded-lg text-sm focus:ring-2 focus:ring-primary-200 focus:outline-none"
                                                    />
                                                    <p className="text-xs text-gray-500">Tekan Enter untuk simpan</p>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setEditingNoteId(item.id)}
                                                    className="text-xs text-gray-600 hover:text-primary-DEFAULT transition-colors flex items-center gap-1"
                                                >
                                                    {item.notes ? (
                                                        <>
                                                            <span className="font-medium">📝 {item.notes}</span>
                                                            <span className="text-gray-400">(Klik untuk edit)</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-500">+ Tambah catatan</span>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {/* Subtotal */}
                                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                            <span className="text-xs text-gray-500 font-medium">Subtotal</span>
                                            <span className="text-sm font-bold text-gray-900">
                                                Rp {(item.price * item.quantity).toLocaleString()}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="border-t border-gray-200 p-4 space-y-3 bg-white">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700 font-semibold">Total</span>
                                    <span className="text-2xl font-bold text-primary-DEFAULT">
                                        Rp {getTotal().toLocaleString()}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleClearCart}
                                        className="flex-1 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-100 transition-colors"
                                    >
                                        Clear Cart
                                    </button>
                                    <Link href="/checkout" className="flex-1" onClick={onClose}>
                                        <button className="w-full py-3 bg-primary-DEFAULT text-white font-bold rounded-xl shadow-lg shadow-primary-200 hover:bg-primary-600 transition-colors active:scale-95">
                                            Checkout
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
