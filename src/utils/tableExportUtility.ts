import * as XLSX from 'xlsx';
import { Column } from '../components/common/DataTable.tsx';
import { alerts } from './alerts.ts';

export interface ExportTableOptions<T> {
  data: T[];
  columns: Column<T>[];
  filename?: string;
  title?: string;
  subtitle?: string;
  language?: 'lo' | 'en';
}

/**
 * Extracts plain-text representation from a cell for export.
 */
export function getCellExportValue<T>(item: T, column: Column<T>): string {
  // If item[key] is a primitive, return string
  const rawVal = (item as any)[column.key];

  if (rawVal === undefined || rawVal === null) {
    return '';
  }

  if (typeof rawVal === 'number') {
    return String(rawVal);
  }

  if (typeof rawVal === 'boolean') {
    return rawVal ? 'Yes' : 'No';
  }

  if (typeof rawVal === 'string') {
    return rawVal.trim();
  }

  // Fallback string conversion
  return String(rawVal);
}

/**
 * Helper to escape CSV cell contents.
 */
function escapeCSV(val: any): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exports any table dataset to a CSV file with UTF-8 BOM encoding for Lao/multilingual support.
 */
export async function exportTableToCSV<T extends Record<string, any>>(
  options: ExportTableOptions<T>
): Promise<{ success: boolean; count: number; filename: string }> {
  const { data, columns, filename = 'LHSE_Report', language = 'en' } = options;

  if (!data || data.length === 0) {
    alerts.warning(
      language === 'lo' ? 'ບໍ່ມີຂໍ້ມູນສຳລັບສົ່ງອອກ' : 'No Data to Export',
      language === 'lo' ? 'ຕາຕະລາງຍັງບໍ່ມີຂໍ້ມູນສຳລັບການສົ່ງອອກ CSV' : 'The table contains no records to export.'
    );
    throw new Error('No data to export');
  }

  // Filter out actions column
  const exportableCols = columns.filter((col) => col.key !== 'actions');

  // Headers
  const headerRow = exportableCols.map((c) => escapeCSV(c.header)).join(',');

  // Data Rows
  const dataRows = data.map((item) => {
    return exportableCols
      .map((col) => {
        const val = getCellExportValue(item, col);
        return escapeCSV(val);
      })
      .join(',');
  });

  const csvContent = [headerRow, ...dataRows].join('\r\n');

  // Prepend UTF-8 BOM so spreadsheet apps (Excel, Sheets) correctly decode Lao text
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const dateStr = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${dateStr}.csv`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fullFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);

  return {
    success: true,
    count: data.length,
    filename: fullFilename,
  };
}

/**
 * Generates and downloads a valid PDF binary file for any table dataset via mock handler.
 */
export async function exportTableToPDF<T extends Record<string, any>>(
  options: ExportTableOptions<T>
): Promise<{ success: boolean; count: number; filename: string }> {
  const {
    data,
    columns,
    filename = 'LHSE_Official_Report',
    title = 'LHSE Enterprise Data Report',
    subtitle = 'Lao Holding State Enterprise (LHSE) - Official Record',
    language = 'en',
  } = options;

  if (!data || data.length === 0) {
    alerts.warning(
      language === 'lo' ? 'ບໍ່ມີຂໍ້ມູນສຳລັບສົ່ງອອກ' : 'No Data to Export',
      language === 'lo' ? 'ຕາຕະລາງຍັງບໍ່ມີຂໍ້ມູນສຳລັບການສົ່ງອອກ PDF' : 'The table contains no records to export.'
    );
    throw new Error('No data to export');
  }

  const exportableCols = columns.filter((col) => col.key !== 'actions').slice(0, 6); // Keep first 6 columns for PDF line width
  const dateStr = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${dateStr}.pdf`;

  // Build clean text lines for PDF stream
  const lines: string[] = [
    '=================================================================================',
    'LAO HOLDING STATE ENTERPRISE (LHSE) - OFFICIAL SYSTEM REPORT',
    title.toUpperCase(),
    subtitle,
    `Date Generated: ${new Date().toLocaleDateString()} | Total Records: ${data.length}`,
    '=================================================================================',
  ];

  // Header line
  const colWidth = Math.floor(75 / exportableCols.length);
  const headerLine = exportableCols
    .map((c) => (c.header || '').padEnd(colWidth).slice(0, colWidth))
    .join(' ');
  lines.push(headerLine);
  lines.push('-'.repeat(Math.min(80, headerLine.length)));

  // Data lines
  data.slice(0, 50).forEach((item, index) => {
    const rowStr = exportableCols
      .map((c) => {
        const val = getCellExportValue(item, c);
        return String(val).padEnd(colWidth).slice(0, colWidth);
      })
      .join(' ');
    lines.push(rowStr);
  });

  if (data.length > 50) {
    lines.push(`... [and ${data.length - 50} more records truncated for initial summary page]`);
  }

  lines.push('=================================================================================');
  lines.push('Confidential - For Official LHSE Administration & Audit Use Only');

  // Prepare PDF text content
  let textStream = 'BT\n/F1 9 Tf\n12 TL\n35 750 Td\n';
  lines.forEach((line) => {
    const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    textStream += `(${escaped}) '\n`;
  });
  textStream += 'ET';

  const streamLength = textStream.length;

  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 =
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';
  const obj4 = `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${textStream}\nendstream\nendobj\n`;
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n';

  const header = '%PDF-1.4\n';
  const offset1 = header.length;
  const offset2 = offset1 + obj1.length;
  const offset3 = offset2 + obj2.length;
  const offset4 = offset3 + obj3.length;
  const offset5 = offset4 + obj4.length;
  const xrefOffset = offset5 + obj5.length;

  const padOffset = (n: number) => String(n).padStart(10, '0');

  const xref =
    `xref\n` +
    `0 6\n` +
    `0000000000 65535 f \n` +
    `${padOffset(offset1)} 00000 n \n` +
    `${padOffset(offset2)} 00000 n \n` +
    `${padOffset(offset3)} 00000 n \n` +
    `${padOffset(offset4)} 00000 n \n` +
    `${padOffset(offset5)} 00000 n \n`;

  const trailer =
    `trailer\n` +
    `<< /Size 6 /Root 1 0 R >>\n` +
    `startxref\n` +
    `${xrefOffset}\n` +
    `%%EOF\n`;

  const pdfString = header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer;

  const blob = new Blob([pdfString], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fullFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);

  return {
    success: true,
    count: data.length,
    filename: fullFilename,
  };
}

/**
 * Opens a formatted official LHSE state enterprise print window ready to Print or Save as PDF.
 */
export function openPrintableTablePDF<T extends Record<string, any>>(
  options: ExportTableOptions<T>
) {
  const {
    data,
    columns,
    title = 'LHSE Official Data Report',
    subtitle = 'State Enterprise Operational & Management Summary',
    language = 'en',
  } = options;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alerts.warning(
      language === 'lo' ? 'ກະລຸນາອະນຸຍາດ Pop-up' : 'Pop-up Blocked',
      language === 'lo'
        ? 'ກະລຸນາອະນຸຍາດ Pop-up ເພື່ອເບິ່ງຕົວຢ່າງເອກະສານ PDF'
        : 'Please allow pop-ups to open printable PDF report.'
    );
    return;
  }

  const exportableCols = columns.filter((col) => col.key !== 'actions');
  const dateStr = new Date().toLocaleDateString();

  const thsHtml = exportableCols
    .map(
      (c) =>
        `<th style="padding: 8px 10px; background-color: #f8fafc; color: #334155; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; text-align: left;">${c.header}</th>`
    )
    .join('');

  const rowsHtml = data
    .map((item, idx) => {
      const tdsHtml = exportableCols
        .map((c) => {
          const val = getCellExportValue(item, c);
          return `<td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #1e293b;">${val}</td>`;
        })
        .join('');
      return `<tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${tdsHtml}</tr>`;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - LHSE Official PDF</title>
        <style>
          @media print {
            @page { size: A4 landscape; margin: 12mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Lao", sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 24px;
            background: #fff;
          }
          .header-box {
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 16px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .badge {
            display: inline-block;
            background: #1e3a8a;
            color: #fff;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: bold;
            letter-spacing: 0.5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }
          .toolbar {
            background: #f1f5f9;
            padding: 12px 18px;
            border-radius: 12px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .btn-print {
            background: #2563eb;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            font-size: 12px;
          }
          .btn-close {
            background: #e2e8f0;
            color: #334155;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 12px;
          }
          .signatures {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
          }
          .sig-box {
            text-align: center;
            width: 220px;
            border-top: 1px dashed #94a3b8;
            padding-top: 8px;
            font-size: 11px;
            color: #475569;
          }
        </style>
      </head>
      <body>
        <div class="toolbar no-print">
          <div>
            <strong>LHSE Official Report Preview</strong> - Ready to Print or Save as PDF
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
            <button class="btn-close" onclick="window.close()">Close</button>
          </div>
        </div>

        <div class="header-box">
          <div>
            <div class="badge">LHSE STATE ENTERPRISE</div>
            <h1 style="margin: 6px 0 2px; font-size: 18px; color: #1e3a8a;">
              ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ • LAO HOLDING STATE ENTERPRISE
            </h1>
            <div style="font-size: 13px; font-weight: 600; color: #334155;">
              ${title} (${subtitle})
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
              Ministry of Finance Complex, 23 Singha Road, Vientiane Capital, Lao PDR
            </div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            <div><strong>Date:</strong> ${dateStr}</div>
            <div><strong>Total Records:</strong> ${data.length} items</div>
            <div><strong>Security Tier:</strong> Internal Administration</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>${thsHtml}</tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="signatures">
          <div>
            <div style="height: 45px;"></div>
            <div class="sig-box">
              <strong>Prepared By</strong><br/>
              LHSE Administration Officer
            </div>
          </div>
          <div>
            <div style="height: 45px;"></div>
            <div class="sig-box">
              <strong>Verified & Audited By</strong><br/>
              Head of Administration / Finance
            </div>
          </div>
          <div>
            <div style="height: 45px;"></div>
            <div class="sig-box">
              <strong>Authorized & Endorsed By</strong><br/>
              Managing Director (LHSE)
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Enhanced Excel export with formatted columns.
 */
export async function exportTableToExcel<T extends Record<string, any>>(
  options: ExportTableOptions<T>
): Promise<{ success: boolean; count: number; filename: string }> {
  const { data, columns, filename = 'LHSE_Report', language = 'en' } = options;

  if (!data || data.length === 0) {
    alerts.warning(
      language === 'lo' ? 'ບໍ່ມີຂໍ້ມູນສຳລັບສົ່ງອອກ' : 'No Data to Export',
      language === 'lo' ? 'ຕາຕະລາງຍັງບໍ່ມີຂໍ້ມູນສຳລັບການສົ່ງອອກ Excel' : 'The table contains no records to export.'
    );
    throw new Error('No data to export');
  }

  const exportableCols = columns.filter((col) => col.key !== 'actions');
  const exportRows = data.map((item) => {
    const row: Record<string, any> = {};
    exportableCols.forEach((col) => {
      row[col.header] = getCellExportValue(item, col);
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'LHSE Data');
  const dateStr = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, fullFilename);

  return {
    success: true,
    count: data.length,
    filename: fullFilename,
  };
}
