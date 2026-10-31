import React, { useEffect, useState } from 'react';
import {
  Receipt, Download, CreditCard, RefreshCw, Zap,
  CheckCircle, Clock, AlertCircle, FileText, Eye
} from 'lucide-react';
import { api } from '../api';
import { Invoice, Role } from '../types';
import { Modal } from '../components/Modal';
import { InvoicePdfModal } from '../components/InvoicePdfModal';

interface InvoicesViewProps {
  role: Role;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
  onOpenPaymentModal: (invoice: Invoice) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  role,
  onNotify,
  onOpenPaymentModal,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningBilling, setRunningBilling] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await api.getInvoices();
      setInvoices(data);
    } catch (err: any) {
      onNotify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleTriggerBilling = async () => {
    try {
      setRunningBilling(true);
      const res = await api.triggerBillingRun();
      onNotify(res.message, 'success');
      loadInvoices();
    } catch (err: any) {
      onNotify(err.message, 'error');
    } finally {
      setRunningBilling(false);
    }
  };

  const handleDownloadPdf = async (inv: Invoice) => {
    const token = localStorage.getItem('suber_token');
    const url = `/api/v1/invoices/${inv.id}/pdf`;
    try {
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        onNotify('Failed to download PDF. Please try again.', 'error');
        return;
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${inv.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      onNotify('PDF download error. Check network connection.', 'error');
    }
  };

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(Number(val));
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Invoices & Automated Recurring Billing
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Immutable snapshot billing records, tax & discount breakdowns, and official PDF generation.
          </p>
        </div>

        {role !== 'CUSTOMER' && (
          <button
            onClick={handleTriggerBilling}
            disabled={runningBilling}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${runningBilling ? 'animate-spin' : ''}`} />
            <span>{runningBilling ? 'Running Scheduler...' : 'Execute Scheduled Billing Run'}</span>
          </button>
        )}
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Billing Cycle</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4 text-right">Pre-Tax</th>
                <th className="py-3.5 px-4 text-right">GST (18%)</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-4 text-right">Paid</th>
                <th className="py-3.5 px-4 text-right">Balance</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No invoices generated yet. Run the scheduled billing scheduler to generate cycle invoices.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const total = Number(inv.total_amount);
                  const paid = Number(inv.amount_paid);
                  const outstanding = total - paid;
                  const isPaid = inv.status === 'PAID' || outstanding <= 0;
                  const isPartial = paid > 0 && outstanding > 0;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        <button
                          onClick={() => setPreviewInvoice(inv)}
                          className="text-left font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 group"
                          title="Preview PDF Invoice"
                        >
                          <span>{inv.invoice_number}</span>
                          <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-slate-400" />
                        </button>
                        {inv.subscription_number && (
                          <span className="block text-[10px] font-mono text-slate-400 font-normal">
                            {inv.subscription_number}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                        {inv.customer_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-[11px]">
                        {inv.billing_cycle_start} to {inv.billing_cycle_end}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-[11px]">
                        {inv.due_date}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-700 dark:text-slate-300">
                        {formatCurrency(inv.subtotal)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-700 dark:text-slate-300">
                        {formatCurrency(inv.tax_total)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(total)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-emerald-600">
                        {formatCurrency(paid)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-amber-600">
                        {formatCurrency(outstanding)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : isPartial
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                              : inv.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                          }`}
                        >
                          {isPaid ? 'PAID' : isPartial ? 'PARTIALLY PAID' : inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setPreviewInvoice(inv)}
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                            title="Preview PDF Invoice first"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View PDF</span>
                          </button>

                          <button
                            onClick={() => handleDownloadPdf(inv)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Download PDF directly"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {role !== 'CUSTOMER' && !isPaid && (
                            <button
                              onClick={() => onOpenPaymentModal(inv)}
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 hover:bg-emerald-100 transition-colors"
                              title="Record Payment"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Record Pay</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice PDF Preview Modal */}
      <InvoicePdfModal
        isOpen={!!previewInvoice}
        onClose={() => setPreviewInvoice(null)}
        invoice={previewInvoice}
        onNotify={onNotify}
      />
    </div>
  );
};
