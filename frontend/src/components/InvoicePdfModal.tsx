import React, { useEffect, useState, useRef } from 'react';
import {
  X, Download, ExternalLink, Printer, FileText,
  AlertCircle, Loader2, CheckCircle2
} from 'lucide-react';
import { Invoice } from '../types';

interface InvoicePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export const InvoicePdfModal: React.FC<InvoicePdfModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onNotify,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    let activeUrl: string | null = null;

    if (isOpen && invoice) {
      setLoading(true);
      setError(null);
      setPdfBlobUrl(null);

      const token = localStorage.getItem('suber_token');
      const url = `/api/v1/invoices/${invoice.id}/pdf`;

      fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`Failed to load invoice PDF (status ${res.status}).`);
          }
          const blob = await res.blob();
          const objUrl = URL.createObjectURL(
            new Blob([blob], { type: 'application/pdf' })
          );
          activeUrl = objUrl;
          setPdfBlobUrl(objUrl);
          setLoading(false);
        })
        .catch((err: any) => {
          setError(err.message || 'Error loading PDF invoice.');
          setLoading(false);
          if (onNotify) {
            onNotify('Unable to preview PDF. You can still download it directly.', 'error');
          }
        });
    }

    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [isOpen, invoice]);

  if (!isOpen || !invoice) return null;

  const handleDownload = () => {
    if (!pdfBlobUrl) {
      // Fallback direct download
      const token = localStorage.getItem('suber_token');
      fetch(`/api/v1/invoices/${invoice.id}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then((r) => r.blob())
        .then((blob) => {
          const u = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = u;
          a.download = `${invoice.invoice_number}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(u);
        });
      return;
    }

    const a = document.createElement('a');
    a.href = pdfBlobUrl;
    a.download = `${invoice.invoice_number}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleOpenInNewTab = () => {
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, '_blank');
    }
  };

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
      } catch {
        window.open(pdfBlobUrl || '', '_blank');
      }
    } else if (pdfBlobUrl) {
      window.open(pdfBlobUrl, '_blank');
    }
  };

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(Number(val));
  };

  const isPaid = invoice.status === 'PAID';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl h-[92vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Invoice <span className="font-mono text-indigo-600 dark:text-indigo-400">{invoice.invoice_number}</span>
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isPaid
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : invoice.status === 'CANCELLED'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                  }`}
                >
                  {invoice.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {invoice.customer_name || 'Enterprise Customer'} • Total: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(invoice.total_amount)}</strong> • Due: {invoice.due_date}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              disabled={loading || !pdfBlobUrl}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors disabled:opacity-50"
              title="Print Invoice"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={handleOpenInNewTab}
              disabled={loading || !pdfBlobUrl}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors disabled:opacity-50"
              title="Open PDF in new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>New Tab</span>
            </button>

            {/* Primary Download Button */}
            <button
              onClick={handleDownload}
              className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
              title="Download Official PDF Invoice"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / PDF Viewer Frame */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-2 sm:p-4 overflow-hidden relative flex flex-col items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center space-y-3 text-slate-500 dark:text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-sm font-medium">Generating & loading official PDF invoice...</p>
            </div>
          )}

          {error && !loading && (
            <div className="max-w-md p-6 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/50 text-center shadow-lg">
              <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Unable to display inline preview
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {error}
              </p>
              <button
                onClick={handleDownload}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Directly</span>
              </button>
            </div>
          )}

          {!loading && !error && pdfBlobUrl && (
            <div className="w-full h-full flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white shadow-inner">
              <iframe
                ref={iframeRef}
                src={`${pdfBlobUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full border-0 rounded-xl"
                title={`Official Invoice ${invoice.invoice_number}`}
              />
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-medium text-[11px]">Official Tax Invoice • Generated via SUBER Automated Billing</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownload}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Download File ({invoice.invoice_number}.pdf)
            </button>
            <span>•</span>
            <button
              onClick={onClose}
              className="text-slate-600 dark:text-slate-300 font-medium hover:underline"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
