import { Employee, Department, Position, Branch, Language } from '../types/index.ts';
import { alerts } from './alerts.ts';

/**
 * Generates and downloads a clean, UTF-8 BOM CSV file containing the employee roster.
 */
export const exportEmployeesToCSV = (
  employees: Employee[],
  departments: Department[],
  positions: Position[],
  branches: Branch[],
  language: Language = 'en'
): Promise<{ success: boolean; count: number; filename: string }> => {
  return new Promise((resolve) => {
    // Column headers based on active language
    const headers =
      language === 'lo'
        ? [
            'ລະຫັດພະນັກງານ (Code)',
            'ຊື່ (EN)',
            'ນາມສະກຸນ (EN)',
            'ຊື່ (ລາວ)',
            'ນາມສະກຸນ (ລາວ)',
            'ອີເມວ (Email)',
            'ເບີໂທລະສັບ (Phone)',
            'ເພດ (Gender)',
            'ວັນເດືອນປີເກີດ (DOB)',
            'ບັດປະຈຳຕົວ/ສຳມະໂນ (National ID)',
            'ສາຂາ (Branch)',
            'ພະແນກ (Department)',
            'ຕຳແໜ່ງ (Position)',
            'ປະເພດສັນຍາ (Type)',
            'ສະຖານະ (Status)',
            'ເງິນເດືອນພື້ນຖານ (Base Salary LAK)',
            'ທະນາຄານ (Bank)',
            'ເລກບັນຊີ (Account No)',
            'ວັນທີເລີ່ມວຽກ (Join Date)',
            'ລະດັບການສຶກສາ (Education)',
            'ຜູ້ຕິດຕໍ່ສຸກເສີນ (Emergency Contact)',
          ]
        : [
            'Employee Code',
            'First Name (EN)',
            'Last Name (EN)',
            'First Name (Lao)',
            'Last Name (Lao)',
            'Email',
            'Phone',
            'Gender',
            'Date of Birth',
            'National ID',
            'Branch',
            'Department',
            'Position',
            'Employment Type',
            'Status',
            'Base Salary (LAK)',
            'Bank Name',
            'Bank Account',
            'Joining Date',
            'Education',
            'Emergency Contact',
          ];

    // Helper to escape CSV cell content
    const escapeCSV = (val: any): string => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = employees.map((emp) => {
      const dept = departments.find((d) => d.id === emp.departmentId);
      const pos = positions.find((p) => p.id === emp.positionId);
      const br = branches.find((b) => b.id === emp.branchId);

      const deptName = dept ? (language === 'lo' ? dept.nameLao : dept.nameEn) : '-';
      const posTitle = pos ? (language === 'lo' ? pos.titleLao : pos.titleEn) : '-';
      const brName = br ? (language === 'lo' ? br.nameLao : br.nameEn) : '-';

      return [
        escapeCSV(emp.employeeCode),
        escapeCSV(emp.firstNameEn),
        escapeCSV(emp.lastNameEn),
        escapeCSV(emp.firstNameLao),
        escapeCSV(emp.lastNameLao),
        escapeCSV(emp.email),
        escapeCSV(emp.phone),
        escapeCSV(emp.gender),
        escapeCSV(emp.dateOfBirth),
        escapeCSV(emp.nationalId),
        escapeCSV(brName),
        escapeCSV(deptName),
        escapeCSV(posTitle),
        escapeCSV(emp.employmentType),
        escapeCSV(emp.status),
        escapeCSV(emp.baseSalary),
        escapeCSV(emp.bankName || 'BCEL'),
        escapeCSV(emp.bankAccountNumber || '-'),
        escapeCSV(emp.joiningDate),
        escapeCSV(emp.education || '-'),
        escapeCSV(
          emp.emergencyContactName ? `${emp.emergencyContactName} (${emp.emergencyContactPhone || ''})` : '-'
        ),
      ].join(',');
    });

    const csvContent = [headers.map(escapeCSV).join(','), ...rows].join('\r\n');

    // Prepend UTF-8 BOM so Excel properly opens Lao characters without distortion
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `LHSE_Employees_Directory_${dateStr}.csv`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    resolve({
      success: true,
      count: employees.length,
      filename,
    });
  });
};

/**
 * Generates and downloads an authentic PDF binary file via a mock handler,
 * formatted with LHSE State Enterprise header, metadata, and employee roster.
 */
export const exportEmployeesToPDF = (
  employees: Employee[],
  departments: Department[],
  positions: Position[],
  branches: Branch[],
  language: Language = 'en'
): Promise<{ success: boolean; count: number; filename: string }> => {
  return new Promise((resolve) => {
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `LHSE_Official_Employee_Roster_${dateStr}.pdf`;

    // Construct valid PDF-1.4 file format
    const lines: string[] = [
      'LHSE - LAO HOLDING STATE ENTERPRISE',
      'Official Personnel & Staff Roster',
      `Date Generated: ${new Date().toLocaleDateString()} | Total Employees: ${employees.length}`,
      '---------------------------------------------------------------------------------',
      'CODE       NAME                    DEPARTMENT              POSITION            STATUS',
      '---------------------------------------------------------------------------------',
    ];

    employees.forEach((emp) => {
      const dept = departments.find((d) => d.id === emp.departmentId);
      const pos = positions.find((p) => p.id === emp.positionId);

      const code = (emp.employeeCode || 'LHSE-000').padEnd(10).slice(0, 10);
      const name = `${emp.firstNameEn} ${emp.lastNameEn}`.padEnd(23).slice(0, 23);
      const deptName = (dept?.nameEn || 'Operations').padEnd(23).slice(0, 23);
      const posTitle = (pos?.titleEn || 'Officer').padEnd(19).slice(0, 19);
      const status = (emp.status || 'ACTIVE').slice(0, 10);

      lines.push(`${code} ${name} ${deptName} ${posTitle} ${status}`);
    });

    lines.push('---------------------------------------------------------------------------------');
    lines.push(`Confidential - For Official LHSE Administration Use Only. Certified by HR Dept.`);

    // Prepare PDF text content
    let textStream = 'BT\n/F1 9 Tf\n12 TL\n40 750 Td\n';
    lines.forEach((line, idx) => {
      const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
      textStream += `(${escaped}) '\n`;
    });
    textStream += 'ET';

    const streamLength = textStream.length;

    // Objects
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
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    resolve({
      success: true,
      count: employees.length,
      filename,
    });
  });
};

/**
 * Opens a beautifully formatted official state enterprise print view for direct PDF printing / saving.
 */
export const openPrintablePDFRoster = (
  employees: Employee[],
  departments: Department[],
  positions: Position[],
  branches: Branch[],
  language: Language = 'en'
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alerts.warning(
      language === 'lo' ? 'ກະລຸນາອະນຸຍາດ Pop-up' : 'Pop-up Blocked',
      language === 'lo'
        ? 'ກະລຸນາອະນຸຍາດ Pop-up ເພື່ອເບິ່ງຕົວຢ່າງເອກະສານ PDF'
        : 'Please allow pop-ups to view printable PDF roster.'
    );
    return;
  }

  const dateStr = new Date().toLocaleDateString();
  const rowsHtml = employees
    .map((emp, index) => {
      const dept = departments.find((d) => d.id === emp.departmentId);
      const pos = positions.find((p) => p.id === emp.positionId);
      const br = branches.find((b) => b.id === emp.branchId);

      return `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 6px 8px; text-align: center; color: #64748b;">${index + 1}</td>
        <td style="padding: 6px 8px; font-weight: bold; color: #1e3a8a;">${emp.employeeCode}</td>
        <td style="padding: 6px 8px;">
          <div style="font-weight: 600; color: #0f172a;">${emp.firstNameEn} ${emp.lastNameEn}</div>
          <div style="color: #64748b; font-size: 10px;">${emp.firstNameLao} ${emp.lastNameLao}</div>
        </td>
        <td style="padding: 6px 8px; color: #334155;">${dept ? (language === 'lo' ? dept.nameLao : dept.nameEn) : '-'}</td>
        <td style="padding: 6px 8px; color: #334155;">${pos ? (language === 'lo' ? pos.titleLao : pos.titleEn) : '-'}</td>
        <td style="padding: 6px 8px; color: #334155;">${br ? (language === 'lo' ? br.nameLao : br.nameEn) : '-'}</td>
        <td style="padding: 6px 8px; color: #475569; font-family: monospace;">${emp.phone}</td>
        <td style="padding: 6px 8px; text-align: center;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 9px; font-weight: 700; ${
            emp.status === 'ACTIVE'
              ? 'background-color: #dcfce7; color: #166534;'
              : 'background-color: #f1f5f9; color: #475569;'
          }">
            ${emp.status}
          </span>
        </td>
      </tr>
    `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>LHSE Official Employee Roster - PDF</title>
        <style>
          @media print {
            @page { size: A4 landscape; margin: 15mm; }
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
          .header-banner {
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
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: bold;
            letter-spacing: 0.5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            background-color: #f8fafc;
            color: #475569;
            font-weight: 700;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px;
            border-bottom: 2px solid #cbd5e1;
            text-align: left;
          }
          .signatures {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
          }
          .sig-box {
            text-align: center;
            width: 200px;
            border-top: 1px dashed #94a3b8;
            padding-top: 8px;
            font-size: 11px;
            color: #475569;
          }
          .toolbar {
            background: #f1f5f9;
            padding: 12px 18px;
            border-radius: 12px;
            margin-bottom: 20px;
            display: flex;
            gap: 12px;
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
        </style>
      </head>
      <body>
        <div class="toolbar no-print">
          <div>
            <strong>LHSE Official Roster Preview</strong> - Ready to Print or Save as PDF
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
            <button class="btn-close" onclick="window.close()">Close</button>
          </div>
        </div>

        <div class="header-banner">
          <div>
            <div class="badge">LHSE STATE ENTERPRISE</div>
            <h1 style="margin: 6px 0 2px; font-size: 18px; color: #1e3a8a;">
              ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ • LAO HOLDING STATE ENTERPRISE
            </h1>
            <div style="font-size: 13px; font-weight: 600; color: #334155;">
              Official Personnel & Employee Directory Roster (ເອກະສານບັນຊີລາຍຊື່ພະນັກງານທາງການ)
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
              Ministry of Finance Complex, 23 Singha Road, Vientiane Capital, Lao PDR
            </div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            <div><strong>Date:</strong> ${dateStr}</div>
            <div><strong>Total Staff:</strong> ${employees.length} records</div>
            <div><strong>Classification:</strong> Confidential</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">#</th>
              <th style="width: 80px;">Code</th>
              <th>Full Name</th>
              <th>Department</th>
              <th>Position</th>
              <th>Branch</th>
              <th>Contact Phone</th>
              <th style="width: 70px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="signatures">
          <div>
            <div style="height: 50px;"></div>
            <div class="sig-box">
              <strong>Prepared By</strong><br/>
              HR Department Officer
            </div>
          </div>
          <div>
            <div style="height: 50px;"></div>
            <div class="sig-box">
              <strong>Verified By</strong><br/>
              Head of HR & Administration
            </div>
          </div>
          <div>
            <div style="height: 50px;"></div>
            <div class="sig-box">
              <strong>Approved By</strong><br/>
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
};
