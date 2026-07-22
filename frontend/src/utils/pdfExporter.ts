import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  columns: { header: string; dataKey: string }[];
  data: any[];
  metadata?: {
    dateRange?: string;
    statusFilter?: string;
    priorityFilter?: string;
    user?: string;
  };
}

export async function exportToFormalPDF(options: PDFExportOptions) {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '1100px'; // A4 Landscape ratio
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0F172A';
  container.style.fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  container.style.padding = '36px 40px';
  container.style.boxSizing = 'border-box';

  const now = new Date().toLocaleString();
  const currentUser = options.metadata?.user || 'Authorized User';

  const tableHeadHtml = options.columns
    .map(
      (c) =>
        `<th style="background:#00A99D; color:#ffffff; font-size:11px; font-weight:700; text-transform:uppercase; padding:10px 12px; text-align:left; border:1px solid #009389;">${c.header}</th>`
    )
    .join('');

  const tableRowsHtml = options.data
    .map((row, idx) => {
      const bg = idx % 2 === 0 ? '#ffffff' : '#F8FAFC';
      const cells = options.columns
        .map((col) => {
          const val = row[col.dataKey];
          const displayVal =
            val === null || val === undefined
              ? 'N/A'
              : typeof val === 'number'
              ? val.toLocaleString(undefined, { minimumFractionDigits: 2 })
              : String(val);
          return `<td style="padding:9px 12px; font-size:11px; border:1px solid #E2E8F0; color:#334155;">${displayVal}</td>`;
        })
        .join('');
      return `<tr style="background:${bg};">${cells}</tr>`;
    })
    .join('');

  container.innerHTML = `
    <div style="border-bottom:3px solid #00A99D; padding-bottom:12px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:flex-end;">
      <div>
        <h1 style="font-size:17px; font-weight:800; color:#0F172A; letter-spacing:0.04em; margin:0 0 4px;">SPEEDEX LOGISTICS &bull; FOMS AI LAYER</h1>
        <p style="font-size:10px; font-weight:700; color:#00A99D; text-transform:uppercase; letter-spacing:0.08em; margin:0;">Official Audit & Financial Intelligence Report</p>
      </div>
      <div style="font-size:10px; color:#64748B; text-align:right; line-height:1.4;">
        <div>Date Generated: <strong>${now}</strong></div>
        <div>Compiled By: <strong>${currentUser}</strong></div>
        <div>Environment: <strong>FOMS Production AI Engine</strong></div>
      </div>
    </div>

    <h2 style="font-size:18px; font-weight:700; color:#0F172A; margin:0 0 16px; text-transform:uppercase;">${options.title}</h2>

    <table style="width:100%; border-collapse:collapse; margin-bottom:30px;">
      <thead>
        <tr>${tableHeadHtml}</tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
      </tbody>
    </table>

    <div style="margin-top:40px; display:flex; justify-content:space-between; padding-top:20px;">
      <div style="width:240px; border-top:1px solid #94A3B8; text-align:center; padding-top:6px; font-size:10px; color:#475569; font-weight:600;">Prepared By (Financial Analyst / User)</div>
      <div style="width:240px; border-top:1px solid #94A3B8; text-align:center; padding-top:6px; font-size:10px; color:#475569; font-weight:600;">Approved By (Head Accountant / Finance Manager)</div>
    </div>

    <div style="margin-top:40px; border-top:1px solid #E2E8F0; padding-top:10px; font-size:9px; color:#94A3B8; text-align:center; font-style:italic;">
      STRICTLY CONFIDENTIAL &mdash; OFFICIAL SPEEDEX LOGISTICS FINANCIAL AUDIT RECORD &mdash; FOR INTERNAL EXECUTIVE REVIEW ONLY
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    const fileName = `${options.title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
}
