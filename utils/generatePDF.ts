import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Transaction {
    id: string;
    created_at: string;
    guest_name: string;
    total_amount: number;
    order_items: any[];
    order_type: string;
}

// Helper: Format Currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

// Helper: Load Image as Base64
const loadImage = async (url: string): Promise<string | null> => {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn('Failed to load logo', e);
        return null;
    }
};

export const downloadPDFReport = async (
    transactions: Transaction[],
    merchantName: string,
    startDate: Date,
    endDate: Date
) => {
    // --- 1. DATA PROCESSING (BI LOGIC) ---
    const totalRevenue = transactions.reduce((sum, t) => sum + t.total_amount, 0);
    const totalTransactions = transactions.length;
    const aov = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Menu Performance Aggregation
    const menuPerformance: Record<string, { qty: number, revenue: number }> = {};

    transactions.forEach(t => {
        t.order_items.forEach((item: any) => {
            const current = menuPerformance[item.item_name] || { qty: 0, revenue: 0 };
            menuPerformance[item.item_name] = {
                qty: current.qty + item.quantity,
                revenue: current.revenue + (item.subtotal || (item.price * item.quantity))
            };
        });
    });

    // Sort Best Sellers
    const sortedMenu = Object.entries(menuPerformance)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5); // Take Top 5


    // --- 2. PDF GENERATION ---
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- Header ---
    const logoBase64 = await loadImage('/logo-icon.png');
    if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 14, 10, 15, 15);
    }

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(merchantName, 35, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    const periodStr = `Periode: ${format(startDate, 'dd MMM yyyy', { locale: id })} - ${format(endDate, 'dd MMM yyyy', { locale: id })}`;
    doc.text(periodStr, 35, 24);

    // --- Executive Summary Cards ---
    const startY = 35;
    const cardWidth = (pageWidth - 28 - 10) / 3; // 3 cards, 14 margin left/right, 5 gap
    const cardHeight = 25;

    // Helper to draw card
    const drawCard = (x: number, title: string, value: string, color: string = '#000000') => {
        doc.setFillColor(248, 250, 252); // Slate-50
        doc.roundedRect(x, startY, cardWidth, cardHeight, 3, 3, 'F');

        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(title, x + 5, startY + 8);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(color);
        doc.text(value, x + 5, startY + 18);
    };

    drawCard(14, 'Total Omzet Bersih', formatCurrency(totalRevenue), '#E11D48'); // Rose-600
    drawCard(14 + cardWidth + 5, 'Total Transaksi', `${totalTransactions} Pesanan`);
    drawCard(14 + (cardWidth + 5) * 2, 'Rata-rata Order (AOV)', formatCurrency(aov));

    // --- Table 1: Top 5 Best Sellers ---
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('🏆 5 Menu Terlaris', 14, startY + cardHeight + 15);

    autoTable(doc, {
        startY: startY + cardHeight + 20,
        head: [['Rank', 'Nama Menu', 'Qty Terjual', 'Kontribusi']],
        body: sortedMenu.map((item, idx) => [
            idx + 1,
            item.name,
            `${item.qty} Porsi`,
            formatCurrency(item.revenue)
        ]),
        theme: 'grid',
        headStyles: { fillColor: [225, 29, 72], textColor: 255, fontStyle: 'bold' }, // Rose-600
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
            0: { halign: 'center', width: 20 }, // Rank
            2: { halign: 'center' }, // Qty
            3: { halign: 'right' } // Revenue
        }
    });

    // --- Table 2: Transaction History ---
    const finalY = (doc as any).lastAutoTable.finalY + 15;

    doc.setFontSize(12);
    doc.text('📋 Detail Riwayat Transaksi', 14, finalY);

    const tableRows = transactions.map((t, index) => [
        index + 1,
        t.id.slice(0, 8).toUpperCase(),
        format(new Date(t.created_at), 'dd/MM/yy HH:mm'),
        t.guest_name,
        t.order_items.map((i: any) => `${i.quantity}x ${i.item_name}`).join(', '),
        formatCurrency(t.total_amount)
    ]);

    autoTable(doc, {
        startY: finalY + 5,
        head: [['No', 'ID Order', 'Waktu', 'Pelanggan', 'Items', 'Total']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: 255 }, // Slate-900
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
            0: { halign: 'center', width: 10 },
            5: { halign: 'right' }
        },
        didDrawPage: (data) => {
            // Footer with page number
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                `Halaman ${data.pageNumber} - Dicetak pada ${format(new Date(), 'dd MMM yyyy HH:mm', { locale: id })}`,
                data.settings.margin.left,
                doc.internal.pageSize.height - 10
            );
        }
    });

    // Save PDF
    const fileName = `Laporan_BI_${merchantName.replace(/\s+/g, '_')}_${format(startDate, 'yyyyMMdd')}.pdf`;
    doc.save(fileName);
};
