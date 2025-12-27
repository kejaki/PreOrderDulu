'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, type Merchant } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
    CheckCircle, XCircle, ShieldCheck,
    FileText, User, MapPin, Eye, ExternalLink,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminVerifyPage() {
    const router = useRouter();
    const [merchants, setMerchants] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedMerchant, setSelectedMerchant] = useState<any | null>(null);

    useEffect(() => {
        async function checkAdmin() {
            const { data: { user } } = await supabase.auth.getUser();

            // For demo/simplicity, check if metadata has admin role
            if (!user || user.user_metadata?.role !== 'admin') {
                setIsAdmin(false);
                setIsLoading(false);
                // Optionally redirect to a login/warning page
                return;
            }

            setIsAdmin(true);
            fetchUnverified();
        }
        checkAdmin();
    }, [router]);

    const fetchUnverified = async () => {
        setIsLoading(true);
        // Fetch merchants joined with kyc_documents
        const { data, error } = await supabase
            .from('merchants')
            .select(`*, kyc_documents (*)`)
            .eq('is_verified', false)
            .order('created_at', { ascending: false });

        if (data) setMerchants(data);
        setIsLoading(false);
    };

    const handleVerify = async (id: string, status: 'approved' | 'rejected') => {
        const { error } = await supabase
            .from('merchants')
            .update({
                is_verified: status === 'approved',
                verification_status: status
            })
            .eq('id', id);

        if (!error) {
            setMerchants(prev => prev.filter(m => m.id !== id));
            setSelectedMerchant(null);
        } else {
            alert('Action failed: ' + error.message);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-secondary-900 p-8 space-y-6">
                <Skeleton className="h-10 w-64 bg-secondary-800" />
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-64 rounded-2xl bg-secondary-800" />
                    <Skeleton className="h-64 rounded-2xl bg-secondary-800" />
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary-900 p-6 text-center">
                <div className="max-w-md space-y-6">
                    <div className="inline-flex p-4 rounded-full bg-red-100 text-red-600 mb-4">
                        <AlertCircle size={48} />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Access Denied</h1>
                    <p className="text-secondary-400">Only administrators can access the verification panel. Please log in with admin credentials.</p>
                    <Button onClick={() => router.push('/merchant/login')}>Back to Login</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary-950 text-secondary-50 pb-12">
            {/* Header */}
            <header className="bg-secondary-900 border-b border-secondary-800 px-8 py-6 sticky top-0 z-40 backdrop-blur-md bg-opacity-80">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary-500 p-3 rounded-2xl">
                            <ShieldCheck size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Seller Verification</h1>
                            <p className="text-sm text-secondary-400">Review and approve new partners</p>
                        </div>
                    </div>
                    <Badge variant="danger" className="py-2 px-4 text-sm bg-red-500/10 text-red-500 border-red-500/20">
                        {merchants.length} Pending Actions
                    </Badge>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-8 py-10">
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* List */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="font-bold text-secondary-400 uppercase tracking-widest text-xs mb-4">Pending List</h2>
                        {merchants.length === 0 ? (
                            <div className="p-12 text-center rounded-3xl border-2 border-dashed border-secondary-800 text-secondary-500">
                                All clear! No pending sellers.
                            </div>
                        ) : (
                            merchants.map(m => (
                                <motion.div
                                    key={m.id}
                                    layoutId={m.id}
                                    onClick={() => setSelectedMerchant(m)}
                                    className={`
                                        p-5 rounded-2xl cursor-pointer transition-all border-2
                                        ${selectedMerchant?.id === m.id
                                            ? 'bg-secondary-900 border-primary-500 shadow-xl'
                                            : 'bg-secondary-900/50 border-secondary-800 hover:border-secondary-600'}
                                    `}
                                >
                                    <h3 className="font-bold text-lg mb-1">{m.merchant_name}</h3>
                                    <div className="flex gap-2 mb-3">
                                        <Badge size="sm" variant="default" className="text-[10px] uppercase">
                                            {m.merchant_type}
                                        </Badge>
                                        <Badge size="sm" variant="info" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">
                                            {m.kyc_documents?.length || 0} Docs
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-secondary-500 space-y-1">
                                        <div className="flex items-center gap-1"><User size={12} /> {m.email}</div>
                                        <div className="flex items-center gap-1"><MapPin size={12} /> {m.address_text.substring(0, 30)}...</div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* Detail Panel */}
                    <div className="lg:col-span-2">
                        <AnimatePresence mode='wait'>
                            {selectedMerchant ? (
                                <motion.div
                                    key={selectedMerchant.id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="bg-secondary-900 rounded-3xl border border-secondary-800 overflow-hidden shadow-2xl flex flex-col h-[75vh]"
                                >
                                    <div className="p-8 border-b border-secondary-800">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h2 className="text-3xl font-bold mb-2">{selectedMerchant.merchant_name}</h2>
                                                <p className="text-secondary-400 text-lg">{selectedMerchant.business_description}</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <Button onClick={() => handleVerify(selectedMerchant.id, 'approved')} className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/20">
                                                    <CheckCircle size={18} className="mr-2" /> APPROVE
                                                </Button>
                                                <Button onClick={() => handleVerify(selectedMerchant.id, 'rejected')} variant="secondary" className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 px-8">
                                                    <XCircle size={18} className="mr-2" /> REJECT
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                        {/* Contact & Location */}
                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div className="space-y-4">
                                                <h4 className="font-bold text-sm text-secondary-500 flex items-center gap-2">
                                                    <FileText size={16} /> SELLER INFORMATION
                                                </h4>
                                                <div className="space-y-3 bg-secondary-950/50 p-6 rounded-2xl border border-secondary-800">
                                                    <InfoRow label="Email" value={selectedMerchant.email} />
                                                    <InfoRow label="Phone" value={selectedMerchant.phone} />
                                                    <InfoRow label="Merchant Type" value={selectedMerchant.merchant_type} highlight />
                                                    {selectedMerchant.merchant_type === 'student' && (
                                                        <>
                                                            <div className="h-px bg-secondary-800 my-4" />
                                                            <InfoRow label="Emergency Contact" value={selectedMerchant.emergency_contact_name} />
                                                            <InfoRow label="Relation" value={selectedMerchant.emergency_contact_relation} />
                                                            <InfoRow label="Contact Phone" value={selectedMerchant.emergency_contact_phone} />
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="font-bold text-sm text-secondary-500 flex items-center gap-2">
                                                    <MapPin size={16} /> STORE LOCATION
                                                </h4>
                                                <div className="bg-secondary-950/50 p-6 rounded-2xl border border-secondary-800 h-full">
                                                    <p className="text-secondary-200 text-sm mb-4 leading-relaxed">{selectedMerchant.address_text}</p>
                                                    <div className="text-xs text-secondary-500">
                                                        Coords: {selectedMerchant.latitude}, {selectedMerchant.longitude}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Documents */}
                                        <div className="space-y-4 pb-10">
                                            <h4 className="font-bold text-sm text-secondary-500 flex items-center gap-2">
                                                <Eye size={16} /> KYC DOCUMENTS
                                            </h4>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                {selectedMerchant.kyc_documents?.map((doc: any) => (
                                                    <div key={doc.id} className="bg-secondary-950 rounded-2xl overflow-hidden border border-secondary-800 group relative">
                                                        <div className="p-3 bg-secondary-800/50 border-b border-secondary-800 flex justify-between items-center">
                                                            <span className="text-xs font-bold uppercase tracking-wider text-primary-400">{doc.document_type}</span>
                                                            <a href={doc.file_url} target="_blank" className="text-secondary-400 hover:text-white transition-colors">
                                                                <ExternalLink size={14} />
                                                            </a>
                                                        </div>
                                                        <div className="aspect-video relative overflow-hidden bg-secondary-900 flex items-center justify-center">
                                                            <img
                                                                src={doc.file_url}
                                                                alt={doc.document_type}
                                                                className="w-full h-full object-contain transition-transform group-hover:scale-105"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!selectedMerchant.kyc_documents || selectedMerchant.kyc_documents.length === 0) && (
                                                    <div className="col-span-full py-10 text-center text-secondary-500 italic">
                                                        No documents uploaded.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-secondary-600 text-center">
                                    <div className="space-y-4">
                                        <ShieldCheck size={80} strokeWidth={1} />
                                        <p className="text-xl">Select a merchant from the list to review</p>
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}

function InfoRow({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) {
    return (
        <div className="flex justify-between items-center text-sm">
            <span className="text-secondary-500">{label}</span>
            <span className={`font-medium ${highlight ? 'text-primary-400 font-bold' : 'text-secondary-100'}`}>{value}</span>
        </div>
    );
}
