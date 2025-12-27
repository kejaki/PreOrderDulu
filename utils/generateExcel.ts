import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { supabase } from '@/lib/supabase';

interface Transaction {
    id: string;
    created_at: string;
    guest_name: string;
    total_amount: number;
    order_items: any[];
    order_type: string;
}

export const downloadFinancialReport = async (
    transactions: Transaction[],
    merchantName: string,
    startDate: Date,
    endDate: Date
) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Penjualan');

    // --- 1. Header Section ---

    // Attempt to fetch logo image
    try {
        // Fetch the logo logic here. Assuming local fetch or base64. 
        // Since we are in browser, we can fetch public URL.
        const logoResponse = await fetch('/logo-icon.png'); // User specified this path
        if (logoResponse.ok) {
            const logoBlob = await logoResponse.blob();
            const logoBuffer = await logoBlob.arrayBuffer();

            const imageId = workbook.addImage({
                buffer: logoBuffer,
                extension: 'png',
            });

            worksheet.addImage(imageId, {
                tl: { col: 0, row: 0 },
                ext: { width: 60, height: 60 }
            });
        }
    } catch (e) {
        console.warn('Could not load logo for report', e);
    }

    // Title
    worksheet.mergeCells('B2:E2');
    const titleCell = worksheet.getCell('B2');
    titleCell.value = `Laporan Penjualan - ${merchantName}`;
    titleCell.font = { size: 16, bold: true, name: 'Arial' };
    titleCell.alignment = { vertical: 'middle' };

    // Period
    worksheet.mergeCells('B3:E3');
    const periodCell = worksheet.getCell('B3');
    const startStr = startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const endStr = endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    periodCell.value = `Periode: ${startStr} - ${endStr}`;
    periodCell.font = { size: 10, italic: true, name: 'Arial' };

    worksheet.addRow([]); // Spacer
    worksheet.addRow([]); // Spacer (Row 5 starting table header)

    // --- 2. Data Table ---

    // Define Columns
    worksheet.columns = [
        { header: 'No', key: 'no', width: 6 },
        { header: 'Tanggal', key: 'date', width: 20 },
        { header: 'ID Pesanan', key: 'id', width: 30 },
        { header: 'Pelanggan', key: 'guest', width: 25 },
        { header: 'Tipe', key: 'type', width: 12 },
        { header: 'Rincian Item', key: 'items', width: 40 },
        { header: 'Total (IDR)', key: 'amount', width: 20 },
    ];

    // Header Styling (Row 6)
    const headerRow = worksheet.getRow(6);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '0F172A' } // Slate-900 (Secondary)
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30;

    // Add Data
    let totalRevenue = 0;
    transactions.forEach((t, index) => {
        const itemSummary = t.order_items.map((i: any) => `${i.quantity}x ${i.item_name}`).join(', ');

        const row = worksheet.addRow({
            no: index + 1,
            date: new Date(t.created_at).toLocaleString('id-ID', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }),
            id: t.id,
            guest: t.guest_name,
            type: t.order_type === 'delivery' ? 'Delivery' : 'Pickup',
            items: itemSummary,
            amount: t.total_amount
        });

        // Row Styling
        row.alignment = { vertical: 'top', wrapText: true };
        row.getCell('amount').numFmt = '"Rp" #,##0';
        row.getCell('amount').alignment = { horizontal: 'right', vertical: 'top' };
        row.getCell('no').alignment = { horizontal: 'center', vertical: 'top' };

        // Add borders
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin', color: { argb: 'E2E8F0' } },
                left: { style: 'thin', color: { argb: 'E2E8F0' } },
                bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
                right: { style: 'thin', color: { argb: 'E2E8F0' } }
            };
        });

        totalRevenue += t.total_amount;
    });

    // --- 3. Footer ---
    worksheet.addRow([]); // Space
    const footerRow = worksheet.addRow(['', '', '', '', '', 'GRAND TOTAL', totalRevenue]);

    // Footer Styling
    const labelCell = footerRow.getCell(6); // 'F'
    labelCell.font = { bold: true, size: 12 };
    labelCell.alignment = { horizontal: 'right' };

    const valueCell = footerRow.getCell(7); // 'G'
    valueCell.numFmt = '"Rp" #,##0';
    valueCell.font = { bold: true, size: 12, color: { argb: 'E11D48' } }; // Rose-600
    valueCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE4E6' } // Rose-100
    };
    valueCell.alignment = { horizontal: 'right' };

    // Generate Buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Save File
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `Laporan_${merchantName.replace(/\s+/g, '_')}_${startStr}_sd_${endStr}.xlsx`;
    saveAs(blob, fileName);
};
