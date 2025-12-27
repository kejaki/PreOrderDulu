import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface OrderItem {
    item_name: string;
    quantity: number;
    subtotal: number;
}

interface Order {
    id: string;
    created_at: string;
    guest_name: string;
    total_amount: number;
    order_items: OrderItem[];
}

export const downloadPDFReport = (
    orders: Order[],
    merchantName: string,
    period: string
) => {
    // 1. Initialize jsPDF (A4, Portrait)
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // 2. Add Header
    // Merchant Name
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(merchantName, 14, 20);

    // Period Title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Laporan Penjualan: ${period}`, 14, 28);

    // Date Generated
    doc.setFontSize(10);
    doc.setTextColor(100);
    const dateGenerated = format(new Date(), 'd MMMM yyyy HH:mm', { locale: id });
    doc.text(`Dibuat pada: ${dateGenerated}`, 14, 34);

    // 3. Prepare Table Data
    const tableColumn = ["No", "ID Pesanan", "Tanggal", "Pelanggan", "Menu Dipesan", "Total (Rp)"];
    const tableRows: any[] = [];
    let grandTotal = 0;

    orders.forEach((order, index) => {
        const orderDate = format(new Date(order.created_at), 'dd/MM/yy HH:mm');
        const itemsSummary = order.order_items
            .map(item => `${item.item_name} (${item.quantity}x)`)
            .join(', ');

        // Currency formatting for the table cell
        const totalFormatted = new Intl.NumberFormat('id-ID').format(order.total_amount);

        tableRows.push([
            index + 1,
            order.id.slice(0, 8).toUpperCase(),
            orderDate,
            order.guest_name,
            itemsSummary,
            totalFormatted
        ]);

        grandTotal += order.total_amount;
    });

    // 4. Generate Table
    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        headStyles: {
            fillColor: [225, 29, 72], // Rose-600 hashtag #E11D48 -> RGB(225, 29, 72)
            textColor: 255,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' }, // No
            1: { cellWidth: 25 }, // ID
            2: { cellWidth: 25 }, // Date
            3: { cellWidth: 35 }, // Customer
            4: { cellWidth: 'auto' }, // Items
            5: { cellWidth: 30, halign: 'right' } // Total
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252] // Slate-50
        }
    });

    // 5. Add Footer (Grand Total)
    const finalY = (doc as any).lastAutoTable.finalY || 40;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);

    const grandTotalFormatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
    }).format(grandTotal);

    doc.text(`TOTAL PENDAPATAN: ${grandTotalFormatted}`, 14, finalY + 10);

    // 6. Save PDF
    // Filename: laporan_penjualan_[TIMESTAMP].pdf
    const timestamp = format(new Date(), 'yyyyMMdd_HHmm');
    doc.save(`laporan_penjualan_${timestamp}.pdf`);
};
