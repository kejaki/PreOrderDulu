'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface Review {
    id: string;
    rating: number;
    reviewer_name: string;
    comment: string;
    tags: string[];
    created_at: string;
}

interface MerchantReviewsProps {
    merchantId: string;
}

export function MerchantReviews({ merchantId }: MerchantReviewsProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (merchantId) {
            fetchReviews();
            fetchSummary();
        }
    }, [merchantId]);

    const fetchSummary = async () => {
        const { data, error } = await supabase.rpc('get_merchant_review_summary', {
            p_merchant_id: merchantId
        });
        if (data && data.length > 0) {
            setSummary(data[0]);
        }
    };

    const fetchReviews = async () => {
        const { data } = await supabase
            .from('reviews')
            .select('id, rating, reviewer_name, comment, tags, created_at')
            .eq('merchant_id', merchantId)
            .order('created_at', { ascending: false })
            .limit(10); // Limit to latest 10 for now

        if (data) {
            setReviews(data);
        }
        setIsLoading(false);
    };

    if (isLoading) return <div className="h-24 bg-slate-50 animate-pulse rounded-xl" />;

    // Helper to render stars
    const renderStars = (rating: number) => (
        <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    size={14}
                    className={`${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`}
                />
            ))}
        </div>
    );

    return (
        <div className="space-y-6">

            {/* Summary Header */}
            {summary && summary.total_reviews > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-2 mb-1">
                        <Star size={32} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-4xl font-extrabold text-slate-900">{summary.average_rating}</span>
                    </div>
                    <p className="text-sm text-slate-500">
                        Dari {summary.total_reviews} ulasan pelanggan
                    </p>
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare size={18} /> Ulasan Terbaru
                </h3>

                {reviews.length > 0 ? (
                    reviews.map((review) => (
                        <div key={review.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="font-bold text-slate-900 text-sm">{review.reviewer_name}</div>
                                    <div className="text-xs text-slate-400">
                                        {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: id })}
                                    </div>
                                </div>
                                {renderStars(review.rating)}
                            </div>

                            {/* Tags */}
                            {review.tags && review.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {review.tags.map(tag => (
                                        <span key={tag} className="text-[10px] font-medium px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Comment */}
                            {review.comment && (
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    "{review.comment}"
                                </p>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
                        <p className="text-slate-500 text-sm">Belum ada ulasan.</p>
                        <p className="text-xs text-slate-400 mt-1">Jadilah yang pertama memberikan penilaian!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
