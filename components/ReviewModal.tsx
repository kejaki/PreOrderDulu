'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { supabase } from '@/lib/supabase';
import { Star, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    merchantId: string;
    orderId?: string; // Optional: Link to specific order
}

const PREDEFINED_TAGS = [
    "Rasa Enak",
    "Harga Terjangkau",
    "Porsi Besar",
    "Kemasan Rapi",
    "Pelayanan Ramah",
    "Pengiriman Cepat"
];

export function ReviewModal({ isOpen, onClose, merchantId, orderId }: ReviewModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [comment, setComment] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(prev => prev.filter(t => t !== tag));
        } else {
            setSelectedTags(prev => [...prev, tag]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            toast.error('Mohon berikan bintang (1-5)');
            return;
        }
        if (!name.trim()) {
            toast.error('Mohon isi nama anda');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('reviews')
                .insert({
                    merchant_id: merchantId,
                    order_id: orderId || null,
                    rating,
                    reviewer_name: name,
                    reviewer_email: email,
                    comment,
                    tags: selectedTags
                });

            if (error) throw error;

            toast.success('Terima kasih atas ulasan Anda!');
            onClose();
            // Reset form
            setRating(0);
            setName('');
            setEmail('');
            setComment('');
            setSelectedTags([]);
        } catch (error) {
            console.error(error);
            toast.error('Gagal mengirim ulasan');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center mb-4">
                                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-slate-900">
                                        Beri Ulasan
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                                        <X size={24} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Star Rating */}
                                    <div className="flex justify-center gap-2 mb-6">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className="transition-transform hover:scale-110 focus:outline-none"
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                onClick={() => setRating(star)}
                                            >
                                                <Star
                                                    size={32}
                                                    className={`${star <= (hoverRating || rating)
                                                            ? 'fill-yellow-400 text-yellow-400'
                                                            : 'text-slate-300'
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    {/* Identity */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Nama *</label>
                                            <Input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Nama Anda"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Email <span className="font-normal text-slate-400">(Opsional)</span></label>
                                            <Input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="email@contoh.com"
                                            />
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2">Apa yang Anda suka?</label>
                                        <div className="flex flex-wrap gap-2">
                                            {PREDEFINED_TAGS.map(tag => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => toggleTag(tag)}
                                                    className={`
                                                        px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                                                        ${selectedTags.includes(tag)
                                                            ? 'bg-rose-100 text-rose-600 border-rose-200'
                                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}
                                                    `}
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Ulasan Lengkap</label>
                                        <textarea
                                            rows={3}
                                            className="w-full rounded-xl border-slate-200 focus:border-primary-500 focus:ring-primary-500 text-sm p-3"
                                            placeholder="Ceritakan pengalaman Anda..."
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            type="submit"
                                            className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
                                            Kirim Ulasan
                                        </Button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
