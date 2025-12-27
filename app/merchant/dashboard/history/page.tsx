'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, Download, ArrowLeft, Search, FileSpreadsheet, ChevronDown, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { downloadFinancialReport } from '@/utils/generateExcel';
import { downloadPDFReport } from '@/utils/generatePDF';
import toast from 'react-hot-toast';

export default function TransactionHistoryPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [merchant, setMerchant] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);

    // Filters
    // Default: Start of month to End of today
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [startDate, setStartDate] = useState(startOfMonth.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/merchant/login'); return; }

            const { data: m } = await supabase.from('merchants').select('id, merchant_name').eq('id', user.id).single();
            if (m) {
                setMerchant(m);
                fetchTransactions(m.id);
            }
        };
        load();
    }, [startDate, endDate]); // Refetch when dates change

    const fetchTransactions = async (merchantId: string) => {
        setIsLoading(true);

        // Ensure end date includes the full day (23:59:59)
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
            .from('orders')
            .select(`
                id, created_at, guest_name, total_amount, status, order_type,
                order_items ( id, item_name, quantity, item_price, subtotal )
            `)
            .eq('merchant_id', merchantId)
            // Filter completed only? Usually yes for "History"
            // Or maybe all finished statuses (completed, cancelled, rejected)
            // User asked for "Data Table showing completed orders"
            .eq('status', 'completed')
            .gte('created_at', new Date(startDate).toISOString())
            .lte('created_at', endDateTime.toISOString())
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            toast.error('Gagal mengambil data transaksi');
        } else {
            setTransactions(data || []);
        }
        setIsLoading(false);
    };

    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

    const handleExportExcel = async () => {
        if (transactions.length === 0) {
            toast.error('Tidak ada data untuk diekspor');
            return;
        }

        setIsExporting(true);
        setIsExportDropdownOpen(false);
        try {
            await downloadFinancialReport(
                transactions,
                merchant?.merchant_name || 'Merchant',
                new Date(startDate),
                new Date(endDate)
            );
            toast.success('Laporan Excel berhasil diunduh!');
        } catch (error) {
            console.error(error);
            toast.error('Gagal membuat laporan Excel');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPDF = async () => {
        if (transactions.length === 0) {
            toast.error('Tidak ada data untuk diekspor');
            return;
        }

        setIsExporting(true);
        setIsExportDropdownOpen(false);
        try {
            downloadPDFReport(
                transactions,
                merchant?.merchant_name || 'Merchant',
                new Date(startDate),
                new Date(endDate)
            );
            toast.success('Laporan PDF berhasil diunduh!');
        } catch (error) {
            console.error(error);
            toast.error('Gagal membuat laporan PDF');
        } finally {
            setIsExporting(false);
        }
    };

    const totalRevenue = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="secondary" onClick={() => router.back()} className="px-3">
                            <ArrowLeft size={20} />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Riwayat Transaksi</h1>
                            <p className="text-slate-500 text-sm">Laporan penjualan dan arsip pesanan selesai.</p>
                        </div>
                    </div>
                </div>

                {/* Controls Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 grid md:grid-cols-[1fr_auto] gap-6 items-end">
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Calendar size={16} /> Filter Periode
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="w-full sm:w-auto">
                                <label className="text-xs text-slate-500 mb-1 block">Dari Tanggal</label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="w-full sm:w-auto">
                                <label className="text-xs text-slate-500 mb-1 block">Sampai Tanggal</label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="text-right mb-1">
                            <span className="text-sm text-slate-500">Total Pendapatan (Periode Ini)</span>
                            <div className="text-2xl font-bold text-primary-DEFAULT">
                                Rp {totalRevenue.toLocaleString('id-ID')}
                            </div>
                        </div>
                        <div className="relative">
                            <Button
                                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                                disabled={isLoading || transactions.length === 0 || isExporting}
                                className="w-full md:w-auto bg-primary-600 hover:bg-primary-700 text-white min-w-[180px] justify-between"
                            >
                                {isExporting ? (
                                    <span className="flex items-center"><Download className="animate-bounce mr-2" size={18} /> Memproses...</span>
                                ) : (
                                    <>
                                        <span className="flex items-center"><Download size={18} className="mr-2" /> Export Laporan</span>
                                        <ChevronDown size={16} className={`ml-2 transition-transform ${isExportDropdownOpen ? 'rotate-180' : ''}`} />
                                    </>
                                )}
                            </Button>

                            {/* Dropdown Menu */}
                            {isExportDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    <div className="p-1">
                                        <button
                                            onClick={handleExportExcel}
                                            className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors text-left"
                                        >
                                            <div className="mr-3 bg-green-100 p-1.5 rounded-lg text-green-600">
                                                <FileSpreadsheet size={18} />
                                            </div>
                                            <div>
                                                <div className="font-medium">Download Excel</div>
                                                <div className="text-[10px] text-slate-400">Format .xlsx spreadsheet</div>
                                            </div>
                                        </button>
                                        <button
                                            onClick={handleExportPDF}
                                            className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors text-left"
                                        >
                                            <div className="mr-3 bg-red-100 p-1.5 rounded-lg text-red-600">
                                                <FileText size={18} />
                                            </div>
                                            <div>
                                                <div className="font-medium">Download PDF</div>
                                                <div className="text-[10px] text-slate-400">Format .pdf dokumen</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Click Outside Overlay */}
                            {isExportDropdownOpen && (
                                <div
                                    className="fixed inset-0 z-40 bg-transparent"
                                    onClick={() => setIsExportDropdownOpen(false)}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-slate-700">Tanggal</th>
                                    <th className="px-6 py-4 font-bold text-slate-700">ID Pesanan</th>
                                    <th className="px-6 py-4 font-bold text-slate-700">Pelanggan</th>
                                    <th className="px-6 py-4 font-bold text-slate-700">Detail Item</th>
                                    <th className="px-6 py-4 font-bold text-slate-700 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    // Skeleton Rows
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-48"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20 ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : transactions.length > 0 ? (
                                    transactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-slate-600">
                                                {format(new Date(t.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                                #{t.id.substring(0, 8)}...
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {t.guest_name}
                                                <Badge variant="default" className="ml-2 text-[10px] bg-slate-100 text-slate-700 hover:bg-slate-200">
                                                    {t.order_type === 'delivery' ? 'Deliv' : 'Pick'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={t.order_items.map((i: any) => `${i.quantity}x ${i.item_name}`).join(', ')}>
                                                {t.order_items.map((i: any) => (
                                                    <span key={i.id} className="inline-block bg-slate-100 px-2 py-0.5 rounded text-xs mr-1 mb-1 border border-slate-200">
                                                        <b>{i.quantity}x</b> {i.item_name}
                                                    </span>
                                                ))}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-primary-DEFAULT">
                                                Rp {t.total_amount.toLocaleString('id-ID')}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center">
                                                <Search size={48} className="mb-4 opacity-20" />
                                                <p className="font-medium">Tidak ada transaksi pada periode ini.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
