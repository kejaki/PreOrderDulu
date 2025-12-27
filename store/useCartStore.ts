import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MenuItem } from '@/lib/supabase';

interface CartItem extends MenuItem {
    quantity: number;
    merchantId: string;
    merchantName: string;
    notes?: string;
}

interface CartState {
    items: CartItem[];
    merchantId: string | null;
    merchantName: string | null;
    orderType: 'delivery' | 'pickup';
    addItem: (item: MenuItem, merchantId: string, merchantName: string) => void;
    removeItem: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    incrementItem: (itemId: string) => void;
    decrementItem: (itemId: string) => void;
    updateNote: (itemId: string, notes: string) => void;
    setOrderType: (type: 'delivery' | 'pickup') => void;
    clearCart: () => void;
    getTotal: () => number;
    getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            merchantId: null,
            merchantName: null,
            orderType: 'delivery',

            addItem: (item, merchantId, merchantName) => {
                const { items, merchantId: currentMerchantId } = get();

                // If cart has items from different merchant, clear it
                if (currentMerchantId && currentMerchantId !== merchantId) {
                    if (!confirm('Your cart contains items from another merchant. Clear cart and add this item?')) {
                        return;
                    }
                    set({ items: [], merchantId: null, merchantName: null });
                }

                const existingItem = items.find((i) => i.id === item.id);

                if (existingItem) {
                    set({
                        items: items.map((i) =>
                            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                        ),
                    });
                } else {
                    set({
                        items: [...items, { ...item, quantity: 1, merchantId, merchantName }],
                        merchantId,
                        merchantName,
                    });
                }
            },

            removeItem: (itemId) => {
                const { items } = get();
                const newItems = items.filter((i) => i.id !== itemId);
                set({
                    items: newItems,
                    merchantId: newItems.length > 0 ? get().merchantId : null,
                    merchantName: newItems.length > 0 ? get().merchantName : null,
                });
            },

            updateQuantity: (itemId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(itemId);
                    return;
                }

                set({
                    items: get().items.map((i) =>
                        i.id === itemId ? { ...i, quantity } : i
                    ),
                });
            },

            incrementItem: (itemId) => {
                const { items } = get();
                set({
                    items: items.map((i) =>
                        i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i
                    ),
                });
            },

            decrementItem: (itemId) => {
                const { items } = get();
                const item = items.find((i) => i.id === itemId);
                if (item && item.quantity > 1) {
                    set({
                        items: items.map((i) =>
                            i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
                        ),
                    });
                } else {
                    // If quantity is 1, remove the item
                    get().removeItem(itemId);
                }
            },

            updateNote: (itemId, notes) => {
                set({
                    items: get().items.map((i) =>
                        i.id === itemId ? { ...i, notes } : i
                    ),
                });
            },

            setOrderType: (type) => {
                set({ orderType: type });
            },

            clearCart: () => {
                set({ items: [], merchantId: null, merchantName: null });
            },

            getTotal: () => {
                return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
            },

            getItemCount: () => {
                return get().items.reduce((count, item) => count + item.quantity, 0);
            },
        }),
        {
            name: 'cart-storage',
        }
    )
);
