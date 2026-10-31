import React, { useEffect, useState } from 'react';
import {
  Repeat, FileText, Receipt, CreditCard, Building2,
  Download, CheckCircle, Clock, Calendar, Sparkles
} from 'lucide-react';
import { api } from '../api';
import { Subscription, Quotation, Invoice, Payment, Customer } from '../types';
import { InvoicePdfModal } from '../components/InvoicePdfModal';

interface CustomerPortalViewProps {
  currentTab: string;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({ currentTab, onNotify }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subData, qData, invData, payData, myCust] = await Promise.all([
        api.getSubscriptions(),
        api.getQuotations(),
        api.getInvoices(),
        api.getPayments(),
        api.getMyCustomerProfile().catch(() => null),
      ]);
      setSubscriptions(subData);
      setQuotations(qData);
      setInvoices(invData);
      setPayments(payData);
      setCustomer(myCust);
    } catch (err: any) {
      onNotify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcceptQuote = async (id: string) => {
    try {
      await api.acceptQuotation(id);
      onNotify('Quotation accepted! Operations team notified.', 'success');
      loadData();
    } catch (err: any) {
      onNotify(err.message, 'error');
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
        onNotify('Failed to download PDF invoice.', 'error');
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
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-lg">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Customer Self-Service Portal</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, {customer?.company_name || 'Customer Portal'}
        </h1>
        <p className="text-xs text-emerald-200/80 mt-1">
          Review your subscriptions, download official tax invoices, and approve pending quotations.
        </p>
      </div>


      {/* Tab: My Subscriptions */}
      {currentTab === 'my_subscriptions' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Subscriptions</h2>
          <div className="grid grid-cols-1 gap-4">
            {subscriptions.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl text-xs text-slate-400">
                You currently have no active subscriptions.
              </div>
            ) : (
              subscriptions.map((s) => (
                <div
                  key={s.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center space-x-3">
                      <Repeat className="w-5 h-5 text-indigo-600" />
                      <div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                          {s.subscription_number}
                        </span>
                        <span className="text-xs text-slate-500 block">Plan: {s.plan_name}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      {s.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 my-4 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-semibold">Start Date</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{s.start_date}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-semibold">Next Invoice Date</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{s.next_billing_date}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-semibold">Contract Expiry</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{s.expiry_date}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Contracted Modules:
                    </span>
                    {s.lines.map((l) => (
                      <div key={l.id} className="text-xs flex justify-between text-slate-700 dark:text-slate-300">
                        <span>
                          {l.quantity}x {l.product_name} {l.variant_name && `(${l.variant_name})`}
                        </span>
                        <span className="font-bold">{formatCurrency(l.unit_price)} / seat</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: My Quotations */}
      {currentTab === 'my_quotations' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Contract Offers & Quotations</h2>
          <div className="space-y-4">
            {quotations.map((q) => (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                      {q.quotation_number}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      Valid Until: {q.valid_until}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      q.status === 'ACCEPTED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {q.status}
                  </span>
                </div>

                <div className="my-3 space-y-1 text-xs">
                  {q.lines.map((l, i) => (
                    <div key={i} className="flex justify-between text-slate-700 dark:text-slate-300">
                      <span>
                        {l.quantity}x {l.product_name} {l.variant_name && `(${l.variant_name})`}
                      </span>
                      <span>{formatCurrency(l.line_total)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between font-bold text-slate-900 dark:text-white text-sm">
                    <span>Total Amount (Inc. GST):</span>
                    <span>{formatCurrency(q.total_amount)}</span>
                  </div>
                </div>

                {q.status === 'SENT' && (
                  <button
                    onClick={() => handleAcceptQuote(q.id)}
                    className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                  >
                    Approve & Accept Quotation
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: My Invoices */}
      {currentTab === 'my_invoices' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Invoices & PDF Receipts</h2>
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Cycle Period</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      <button
                        onClick={() => setPreviewInvoice(inv)}
                        className="hover:underline text-left font-mono font-bold text-indigo-600 dark:text-indigo-400"
                        title="View PDF Invoice"
                      >
                        {inv.invoice_number}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {inv.billing_cycle_start} to {inv.billing_cycle_end}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{inv.due_date}</td>
                    <td className="py-3 px-4 text-right font-bold">{formatCurrency(inv.total_amount)}</td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-600">{formatCurrency(inv.amount_paid)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setPreviewInvoice(inv)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
                          title="Preview PDF Invoice first"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View PDF</span>
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(inv)}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Direct Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: My Payments */}
      {currentTab === 'my_payments' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Payment Receipts</h2>
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Clearance Date</th>
                  <th className="py-3 px-4">Reference Number</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{p.payment_number}</td>
                    <td className="py-3 px-4">{p.payment_method}</td>
                    <td className="py-3 px-4">{p.payment_date}</td>
                    <td className="py-3 px-4 font-mono">{p.reference_number}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Company Profile */}
      {currentTab === 'my_profile' && customer && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Registered Enterprise Profile</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400 block font-semibold">Legal Entity Name</span>
              <span className="font-bold text-slate-900 dark:text-white">{customer.company_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">GSTIN / Tax ID</span>
              <span className="font-mono text-slate-900 dark:text-white">{customer.tax_identifier || 'Unregistered'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Billing Address</span>
              <span className="text-slate-700 dark:text-slate-300">{customer.billing_address}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">City & Country</span>
              <span className="text-slate-700 dark:text-slate-300">{customer.city}, {customer.country}</span>
            </div>
          </div>
        </div>
      )}

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
