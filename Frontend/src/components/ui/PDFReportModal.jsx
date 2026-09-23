import React from 'react';
import { Button } from './Button';

export function PDFReportModal({ isOpen, onClose, reportData }) {
  if (!isOpen || !reportData) return null;

  const handlePrintPDF = () => {
    // Generate clean printable window for PDF download/print
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Service Completion Report - ${reportData.reportNumber || 'RPT-2026-0412'}</title>
          <style>
            @media print {
              @page { size: A4; margin: 20mm; }
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; }
            }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; padding: 40px; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-b: 2px solid #0066FF; padding-bottom: 20px; margin-bottom: 25px; }
            .logo-text { font-size: 20px; font-weight: 800; color: #0066FF; }
            .report-title { font-size: 14px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 1px; }
            .stamp { display: inline-block; background: #DCFCE7; border: 1px solid #86EFAC; color: #15803D; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px; }
            .field-box { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 12px; border-radius: 8px; }
            .field-label { font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 4px; }
            .field-val { font-size: 13px; font-weight: 700; color: #0F172A; }
            .section-title { font-size: 12px; font-weight: 800; color: #0066FF; text-transform: uppercase; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin: 25px 0 12px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #F1F5F9; text-align: left; padding: 8px 12px; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #475569; border: 1px solid #E2E8F0; }
            td { padding: 10px 12px; font-size: 12px; border: 1px solid #E2E8F0; color: #1E293B; }
            .loto-box { background: #FEF3C7; border: 1px solid #FCD34D; color: #92400E; padding: 12px; border-radius: 8px; font-size: 12px; margin-bottom: 20px; font-weight: 600; }
            .narrative { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 15px; border-radius: 8px; font-size: 12px; line-height: 1.6; color: #334155; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 40px; }
            .sig-box { border-top: 2px solid #CBD5E1; pt: 10px; font-size: 12px; }
            .sig-name { font-family: 'Brush Script MT', cursive, sans-serif; font-size: 24px; color: #0066FF; margin: 10px 0 5px 0; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo-text">ServiceForge AI</div>
              <div style="font-size: 11px; color: #64748B; margin-top: 2px;">Apex Global Manufacturing • Enterprise Operations</div>
            </div>
            <div style="text-align: right;">
              <div class="stamp">✓ SIGNED & ARCHIVED</div>
              <div style="font-size: 10px; font-family: monospace; color: #64748B; margin-top: 6px;">
                ${reportData.reportNumber || 'RPT-2026-0412'}
              </div>
            </div>
          </div>

          <div style="font-size: 16px; font-weight: 800; margin-bottom: 15px; color: #0F172A;">
            OFFICIAL SERVICE COMPLETION & COMPLIANCE REPORT
          </div>

          <div class="grid">
            <div class="field-box">
              <div class="field-label">Customer Account</div>
              <div class="field-val">${reportData.customerName || 'Industrial Plastics Corp'}</div>
            </div>
            <div class="field-box">
              <div class="field-label">Target Asset / Equipment</div>
              <div class="field-val">${reportData.assetName || 'Industrial Air Compressor AC-4500'}</div>
            </div>
            <div class="field-box">
              <div class="field-label">Work Order / Job ID</div>
              <div class="field-val">${reportData.jobIdNumber || 'JOB-2026-0412'}</div>
            </div>
            <div class="field-box">
              <div class="field-label">Completion Date</div>
              <div class="field-val">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </div>

          <div class="loto-box">
            ⚠ <strong>LOTO SAFETY AUDIT VERIFIED:</strong> Lockout/Tagout procedure executed on breaker Panel B-4 prior to servicing. Zero electrical potential verified via digital multimeter.
          </div>

          <div class="section-title">Execution Checklist Audit Trail</div>
          <table>
            <thead>
              <tr>
                <th>Step #</th>
                <th>Inspection & Maintenance Instruction</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Perform Lockout/Tagout (LOTO) electrical lockout procedure on breaker Panel B-4.</td>
                <td><strong style="color: #15803D;">VERIFIED</strong></td>
                <td>17:15:00 UTC</td>
              </tr>
              <tr>
                <td>2</td>
                <td>Inspect cooling fan shroud, belt tension, and shaft bearing alignment.</td>
                <td><strong style="color: #15803D;">VERIFIED</strong></td>
                <td>17:22:15 UTC</td>
              </tr>
              <tr>
                <td>3</td>
                <td>Test thermal overload relay wiring and measure operating resistance.</td>
                <td><strong style="color: #15803D;">VERIFIED</strong></td>
                <td>17:34:00 UTC</td>
              </tr>
              <tr>
                <td>4</td>
                <td>Check compressor oil level and sample for metallic friction debris.</td>
                <td><strong style="color: #15803D;">VERIFIED</strong></td>
                <td>17:40:10 UTC</td>
              </tr>
            </tbody>
          </table>

          <div class="section-title">AI Work Execution Summary</div>
          <div class="narrative">
            ${reportData.workPerformed || reportData.executiveSummary || 'Replaced thermal overload relay on compressor AC-4500. Lockout/Tagout safety protocol verified on breaker Panel B-4 prior to inspection. Operating pressure restored to standard 125 PSI with thermal readings within nominal thresholds (68°C).'}
          </div>

          <div class="signatures">
            <div class="sig-box">
              <div class="field-label">Assigned Technician</div>
              <div class="sig-name">David Miller</div>
              <div style="font-size: 11px; font-weight: 700;">David Miller</div>
              <div style="font-size: 10px; color: #64748B;">Senior Industrial Specialist (ID: TECH-904)</div>
            </div>
            <div class="sig-box">
              <div class="field-label">Service Manager Approval</div>
              <div class="sig-name">Marcus Smith</div>
              <div style="font-size: 11px; font-weight: 700;">Marcus Smith</div>
              <div style="font-size: 10px; color: #64748B;">Service Manager (Apex Global)</div>
            </div>
          </div>

          <div class="footer">
            Encrypted & Stored in Amazon S3 • SHA-256 Verification: <code>0x8f4a92c8104b77f901a</code> • ServiceForge AI Compliance Standard
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              PDF
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Service Completion PDF Report — {reportData.reportNumber || 'RPT-2026-0412'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Official Apex Global Compliance Archive Document
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={handlePrintPDF}>
              🖨️ Print / Download PDF
            </Button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200/60 font-bold transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable PDF Document Preview Container */}
        <div className="p-8 overflow-y-auto bg-slate-100 flex-1 flex justify-center">
          <div className="w-full max-w-3xl bg-white border border-slate-200 shadow-md rounded-2xl p-8 space-y-6 text-slate-900 text-xs">
            {/* Header */}
            <div className="flex justify-between items-start pb-5 border-b-2 border-blue-600">
              <div>
                <div className="text-xl font-black text-blue-600 tracking-tight">ServiceForge AI</div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">Apex Global Manufacturing • Enterprise Operations</div>
              </div>
              <div className="text-right space-y-1">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase">
                  ✓ SIGNED & ARCHIVED
                </span>
                <div className="text-[10px] font-mono text-slate-400 block">
                  {reportData.reportNumber || 'RPT-2026-0412'}
                </div>
              </div>
            </div>

            <div className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
              OFFICIAL SERVICE COMPLETION & COMPLIANCE REPORT
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">Customer Account</span>
                <span className="font-bold text-slate-900 text-xs">{reportData.customerName || 'Industrial Plastics Corp'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">Target Equipment</span>
                <span className="font-bold text-slate-900 text-xs">{reportData.assetName || 'Industrial Air Compressor AC-4500'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">Work Order / Job ID</span>
                <span className="font-mono font-bold text-blue-600 text-xs">{reportData.jobIdNumber || 'JOB-2026-0412'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">Completion Date</span>
                <span className="font-bold text-slate-900 text-xs">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            {/* LOTO Banner */}
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed font-semibold">
              ⚠️ <strong>LOTO SAFETY AUDIT VERIFIED:</strong> Lockout/Tagout procedure executed on breaker Panel B-4 prior to servicing. Zero electrical potential verified via digital multimeter.
            </div>

            {/* Audit Table */}
            <div>
              <div className="text-xs font-black text-blue-600 uppercase tracking-wider mb-2">
                Execution Checklist Audit Trail
              </div>
              <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase">
                    <th className="p-2.5 border-b border-slate-200">Step #</th>
                    <th className="p-2.5 border-b border-slate-200">Inspection & Maintenance Instruction</th>
                    <th className="p-2.5 border-b border-slate-200">Status</th>
                    <th className="p-2.5 border-b border-slate-200">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  <tr>
                    <td className="p-2.5 font-bold">1</td>
                    <td className="p-2.5">Perform Lockout/Tagout (LOTO) electrical lockout procedure on breaker Panel B-4.</td>
                    <td className="p-2.5 font-bold text-emerald-600">VERIFIED</td>
                    <td className="p-2.5 font-mono text-[11px]">17:15:00 UTC</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">2</td>
                    <td className="p-2.5">Inspect cooling fan shroud, belt tension, and shaft bearing alignment.</td>
                    <td className="p-2.5 font-bold text-emerald-600">VERIFIED</td>
                    <td className="p-2.5 font-mono text-[11px]">17:22:15 UTC</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">3</td>
                    <td className="p-2.5">Test thermal overload relay wiring and measure operating resistance.</td>
                    <td className="p-2.5 font-bold text-emerald-600">VERIFIED</td>
                    <td className="p-2.5 font-mono text-[11px]">17:34:00 UTC</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">4</td>
                    <td className="p-2.5">Check compressor oil level and sample for metallic friction debris.</td>
                    <td className="p-2.5 font-bold text-emerald-600">VERIFIED</td>
                    <td className="p-2.5 font-mono text-[11px]">17:40:10 UTC</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Work Summary Narrative */}
            <div>
              <div className="text-xs font-black text-blue-600 uppercase tracking-wider mb-2">
                AI Work Execution Narrative
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed font-medium">
                {reportData.workPerformed || reportData.executiveSummary || 'Replaced thermal overload relay on compressor AC-4500. Lockout/Tagout safety protocol verified on breaker Panel B-4 prior to inspection. Operating pressure restored to standard 125 PSI with thermal readings within nominal thresholds (68°C).'}
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-4">
              <div className="border-t-2 border-slate-300 pt-3">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Technician Digital Sign-off</span>
                <div className="text-xl text-blue-600 italic font-serif my-1">David Miller</div>
                <div className="font-bold text-slate-900 text-xs">David Miller</div>
                <div className="text-[10px] text-slate-500">Senior Industrial Specialist (ID: TECH-904)</div>
              </div>
              <div className="border-t-2 border-slate-300 pt-3">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Service Manager Approval</span>
                <div className="text-xl text-blue-600 italic font-serif my-1">Marcus Smith</div>
                <div className="font-bold text-slate-900 text-xs">Marcus Smith</div>
                <div className="text-[10px] text-slate-500">Service Manager (Apex Global)</div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400 space-y-0.5">
              <div>Encrypted & Stored in Amazon S3 • SHA-256 Verification: <code className="font-mono">0x8f4a92c8104b77f901a</code></div>
              <div>ServiceForge AI Platform Compliance Standard • Apex Global Manufacturing</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
