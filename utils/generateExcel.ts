import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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

    // --- SHEET 1: DETAIL TRANSAKSI ---
    const sheet1 = workbook.addWorksheet('Detail Transaksi');

    // 1. Header (Logo & Title)
    try {
        const logoResponse = await fetch('/logo-icon.png');
        if (logoResponse.ok) {
            const logoBlob = await logoResponse.blob();
            const logoBuffer = await logoBlob.arrayBuffer();
            const imageId = workbook.addImage({
                buffer: logoBuffer,
                extension: 'png',
            });
            sheet1.addImage(imageId, {
                tl: { col: 0, row: 0 },
                ext: { width: 60, height: 60 }
            });
        }
    } catch (e) {
        console.warn('Could not load logo', e);
    }

    sheet1.mergeCells('B2:F2');
    const titleCell = sheet1.getCell('B2');
    titleCell.value = `Laporan Penjualan - ${merchantName}`;
    titleCell.font = { size: 16, bold: true, name: 'Arial' };
    titleCell.alignment = { vertical: 'middle' };

    sheet1.mergeCells('B3:F3');
    const periodCell = sheet1.getCell('B3');
    const startStr = startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const endStr = endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    periodCell.value = `Periode: ${startStr} - ${endStr}`;
    periodCell.font = { size: 10, italic: true, name: 'Arial' };

    sheet1.addRow([]);
    sheet1.addRow([]);

    // 2. Table Header
    sheet1.columns = [
        { header: 'No', key: 'no', width: 6 }, // A
        { header: 'Tanggal', key: 'date', width: 20 }, // B
        { header: 'ID Pesanan', key: 'id', width: 25 }, // C
        { header: 'Pelanggan', key: 'guest', width: 25 }, // D
        { header: 'Rincian Item', key: 'items', width: 45 }, // E
        { header: 'Total (IDR)', key: 'amount', width: 20 }, // F
    ];

    const headerRow = sheet1.getRow(6);
    headerRow.values = ['No', 'Tanggal', 'ID Pesanan', 'Pelanggan', 'Rincian Item', 'Total (IDR)'];
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E11D48' } }; // Rose-600
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30;

    // 3. Data Rows
    let totalRevenue = 0;

    // Aggregation Variables for Sheet 2
    const menuPerformance: Record<string, { qty: number, revenue: number }> = {};

    transactions.forEach((t, index) => {
        // Sheet 1 Data
        const itemSummary = t.order_items.map((i: any) => {
            // Aggregation Logic for Sheet 2
            const current = menuPerformance[i.item_name] || { qty: 0, revenue: 0 };
            menuPerformance[i.item_name] = {
                qty: current.qty + i.quantity,
                revenue: current.revenue + (i.subtotal || (i.price * i.quantity))
            };
            return `${i.quantity}x ${i.item_name}`;
        }).join(', ');

        const row = sheet1.addRow({
            no: index + 1,
            date: new Date(t.created_at).toLocaleString('id-ID', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }),
            id: t.id.slice(0, 8).toUpperCase(),
            guest: t.guest_name,
            items: itemSummary,
            amount: t.total_amount
        });

        // Styling
        row.alignment = { vertical: 'top', wrapText: true };
        row.getCell('amount').numFmt = '"Rp" #,##0';
        row.getCell('amount').alignment = { horizontal: 'right', vertical: 'top' };
        row.getCell('no').alignment = { horizontal: 'center', vertical: 'top' };

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

    // Sheet 1 Footer (Grand Total)
    sheet1.addRow([]);
    const footerRow = sheet1.addRow(['', '', '', '', 'GRAND TOTAL', totalRevenue]);
    footerRow.getCell(6).numFmt = '"Rp" #,##0';
    footerRow.getCell(6).font = { bold: true, size: 12, color: { argb: 'E11D48' } };
    footerRow.getCell(6).alignment = { horizontal: 'right' };
    footerRow.getCell(5).font = { bold: true, size: 12 };
    footerRow.getCell(5).alignment = { horizontal: 'right' };


    // --- SHEET 2: ANALISA BISNIS ---
    const sheet2 = workbook.addWorksheet('Analisa Bisnis');

    // 1. Executive Summary Table (Small)
    sheet2.mergeCells('F2:G2');
    const execTitle = sheet2.getCell('F2');
    execTitle.value = 'Ringkasan Performa';
    execTitle.font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
    execTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } }; // Slate-900
    execTitle.alignment = { horizontal: 'center', vertical: 'middle' };

    const totalTx = transactions.length;
    const aov = totalTx > 0 ? totalRevenue / totalTx : 0;

    const summaryData = [
        ['Total Omzet Bersih', totalRevenue],
        ['Total Transaksi', totalTx],
        ['Rata-rata Order (AOV)', aov]
    ];

    summaryData.forEach((item, idx) => {
        const r = sheet2.getCell(`F${3 + idx}`);
        const v = sheet2.getCell(`G${3 + idx}`);
        r.value = item[0];
        v.value = item[1];

        // Style
        r.font = { bold: true };
        r.border = { bottom: { style: 'thin' }, right: { style: 'thin' }, left: { style: 'thin' } };
        v.border = { bottom: { style: 'thin' }, right: { style: 'thin' }, left: { style: 'thin' } };
        v.alignment = { horizontal: 'right' };

        if (idx !== 1) v.numFmt = '"Rp" #,##0'; // Currency for Revenue & AOV
    });

    sheet2.getColumn('F').width = 25;
    sheet2.getColumn('G').width = 25;


    // 2. Menu Performance Table
    sheet2.getCell('B2').value = 'Performa Menu (Best Seller)';
    sheet2.getCell('B2').font = { size: 14, bold: true };

    // Header
    const menuHeader = sheet2.getRow(4);
    menuHeader.values = [null, 'Ranking', 'Nama Menu', 'Qty Terjual', 'Kontribusi Omzet'];

    // Style Header
    for (let i = 2; i <= 5; i++) {
        const cell = menuHeader.getCell(i);
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E11D48' } };
        cell.alignment = { horizontal: 'center' };
    }

    // Sort Menu Data
    const sortedMenu = Object.entries(menuPerformance)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.qty - a.qty);

    // Render Rows
    sortedMenu.forEach((item, idx) => {
        const rowNum = 5 + idx;
        const row = sheet2.getRow(rowNum);

        row.getCell(2).value = idx + 1; // Rank
        row.getCell(3).value = item.name;
        row.getCell(4).value = item.qty;
        row.getCell(5).value = item.revenue;

        // Visuals: Highlight Top 3
        if (idx < 3) {
            const goldFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } }; // Yellow-100
            for (let i = 2; i <= 5; i++) row.getCell(i).fill = goldFill as any;
        }

        // Borders & Format
        row.getCell(5).numFmt = '"Rp" #,##0';
        for (let i = 2; i <= 5; i++) {
            const cell = row.getCell(i);
            cell.border = { bottom: { style: 'thin', color: { argb: 'E2E8F0' } }, right: { style: 'thin', color: { argb: 'E2E8F0' } }, left: { style: 'thin', color: { argb: 'E2E8F0' } } };
            if (i !== 3) cell.alignment = { horizontal: 'center' }; // Center Rank & Qty
            if (i === 5) cell.alignment = { horizontal: 'right' }; // Right align revenue
        }
    });

    // Column Widths
    sheet2.getColumn(2).width = 10;
    sheet2.getColumn(3).width = 35;
    sheet2.getColumn(4).width = 15;
    sheet2.getColumn(5).width = 25;

    // Generate & Save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `Laporan_BI_${merchantName.replace(/\s+/g, '_')}_${startStr}_sd_${endStr}.xlsx`;
    saveAs(blob, fileName);
};
