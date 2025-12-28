'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ImageUpload } from '@/components/ImageUpload'; // Reusing existing component
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, MessageSquare, Plus, History, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export default function HelpPage() {
    const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
    const [tickets, setTickets] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Form State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [category, setCategory] = useState<string>('Account');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [attachmentUrl, setAttachmentUrl] = useState('');

    useEffect(() => {
        if (activeTab === 'history') {
            fetchTickets();
        }
    }, [activeTab]);

    const fetchTickets = async () => {
        setIsLoadingData(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('support_tickets')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (data) setTickets(data);
        setIsLoadingData(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Anda harus login');

            const { error } = await supabase.from('support_tickets').insert({
                user_id: user.id,
                category,
                subject,
                description,
                attachment_url: attachmentUrl,
                status: 'Open',
                priority: 'Medium'
            });

            if (error) throw error;

            toast.success('Laporan berhasil dikirim!');
            // Reset form
            setSubject('');
            setDescription('');
            setAttachmentUrl('');
            setActiveTab('history');
        } catch (error: any) {
            console.error(error);
            toast.error('Gagal mengirim laporan: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Resolved': return 'bg-green-100 text-green-700';
            case 'In Progress': return 'bg-blue-100 text-blue-700';
            case 'Closed': return 'bg-slate-100 text-slate-700';
            default: return 'bg-yellow-100 text-yellow-700'; // Open
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Resolved': return <CheckCircle size={16} />;
            case 'In Progress': return <Clock size={16} />;
            case 'Closed': return <XCircle size={16} />;
            default: return <AlertCircle size={16} />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

                {/* Header */}
                <div className="bg-white border-b border-slate-100 p-6 text-center">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Pusat Bantuan</h1>
                    <p className="text-slate-500 text-sm">Laporkan kendala atau bug aplikasi di sini.</p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'create'
                                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                                : 'text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        <Plus size={18} /> Buat Laporan
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'history'
                                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                                : 'text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        <History size={18} /> Riwayat Laporan
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'create' ? (
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Kategori Masalah</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {['Account', 'Payment', 'Technical Bug', 'Other'].map((cat) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setCategory(cat)}
                                            className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${category === cat
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Judul Laporan</label>
                                <Input
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Contoh: Tidak bisa login, Error pembayaran..."
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Deskripsi Detail</label>
                                <textarea
                                    className="w-full rounded-xl border-slate-200 focus:border-primary-500 focus:ring-primary-500 p-3 min-h-[120px] text-sm"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Jelaskan kronologi masalah selengkap mungkin..."
                                    required
                                />
                            </div>

                            {/* Screenshot Upload */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Screenshot (Opsional)</label>
                                <div className="max-w-[200px]">
                                    <ImageUpload
                                        label="Upload Bukti"
                                        bucket="support-attachments"
                                        value={attachmentUrl}
                                        onChange={setAttachmentUrl}
                                        aspectRatio="video"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-6 text-lg rounded-xl shadow-lg"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" /> Mengirim...
                                    </>
                                ) : (
                                    'Kirim Laporan'
                                )}
                            </Button>

                        </form>
                    ) : (
                        // HISTORY TAB
                        <div className="space-y-4">
                            {isLoadingData ? (
                                <div className="text-center py-10 text-slate-400">Loading data...</div>
                            ) : tickets.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <MessageSquare size={40} className="mx-auto mb-3 text-slate-300" />
                                    <p className="text-slate-500">Belum ada laporan yang dibuat.</p>
                                </div>
                            ) : (
                                tickets.map((ticket) => (
                                    <div key={ticket.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${ticket.category === 'Technical Bug' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        {ticket.category}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: id })}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-slate-900">{ticket.subject}</h3>
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(ticket.status)}`}>
                                                {getStatusIcon(ticket.status)} {ticket.status}
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 mb-3">
                                            {ticket.description}
                                        </div>

                                        {ticket.attachment_url && (
                                            <a href={ticket.attachment_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline flex items-center gap-1 mb-3">
                                                Lihat Screenshot ↗
                                            </a>
                                        )}

                                        {/* Admin Response */}
                                        {ticket.admin_response && (
                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1">
                                                    👨‍💻 Respon Admin
                                                </h4>
                                                <p className="text-sm text-slate-700 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                    "{ticket.admin_response}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
