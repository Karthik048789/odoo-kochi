import React, { useEffect, useState } from 'react';
import { CreditCard, Plus, CheckCircle, Search, Calendar, FileText } from 'lucide-react';
import { api } from '../api';
import { Payment, Invoice, Role } from '../types';
import { Modal } from '../components/Modal';

interface PaymentsViewProps {
  role: Role;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
  activeInvoiceForPay?: Invoice | null;
  onClosePaymentModal?: () => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  role,
  onNotify,
  activeInvoiceForPay,
  onClosePaymentModal,
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    invoice_id: '',
    payment_method: 'BANK_TRANSFER',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [payData, invData] = await Promise.all([
        api.getPayments(),
        api.getInvoices(),
      ]);
      setPayments(payData);
      setInvoices(invData.filter((i) => i.status !== 'PAID'));
    } catch (err: any) {
      onNotify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeInvoiceForPay) {
      const remaining = Number(activeInvoiceForPay.total_amount) - Number(activeInvoiceForPay.amount_paid);
      setForm({
        invoice_id: activeInvoiceForPay.id,
        payment_method: 'BANK_TRANSFER',
        amount: remaining > 0 ? remaining.toString() : '',
        payment_date: new Date().toISOString().split('T')[0],
        reference_number: '',
        notes: '',
      });
      setIsModalOpen(true);
    }
  }, [activeInvoiceForPay]);


  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.recordPayment({
        ...form,
        amount: parseFloat(form.amount) || 0,
      });
      onNotify('Payment recorded and reconciled against invoice balance!', 'success');
      setIsModalOpen(false);
      if (onClosePaymentModal) onClosePaymentModal();
      loadData();
    } catch (err: any) {
      onNotify(err.message, 'error');
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
            Payments Ledger & Reconciliation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time multi-payment allocation, transaction reference tracking, and accounts receivable reconciliation.
          </p>
        </div>

        {role !== 'CUSTOMER' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Incoming Payment</span>
          </button>
        )}
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-4">Payment #</th>
                <th className="py-3.5 px-4">Target Invoice</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Clearance Date</th>
                <th className="py-3.5 px-4">Reference / UTR</th>
                <th className="py-3.5 px-4">Notes</th>
                <th className="py-3.5 px-4 text-right">Amount Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No payment records logged yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {p.payment_number}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900 dark:text-white">
                      {p.invoice_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px]">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-[11px]">
                      {p.payment_date}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {p.reference_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                      {p.notes || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 text-sm">
                      {formatCurrency(p.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          if (onClosePaymentModal) onClosePaymentModal();
        }}
        title="Record & Allocate Payment"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Invoice to Reconcile *
            </label>
            <select
              required
              value={form.invoice_id}
              onChange={(e) => {
                const inv = invoices.find((i) => i.id === e.target.value);
                const rem = inv ? Number(inv.total_amount) - Number(inv.amount_paid) : 0;
                setForm({
                  ...form,
                  invoice_id: e.target.value,
                  amount: rem.toString(),
                });
              }}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value="">-- Choose Outstanding Invoice --</option>
              {invoices.map((i) => {
                const rem = Number(i.total_amount) - Number(i.amount_paid);
                return (
                  <option key={i.id} value={i.id}>
                    {i.invoice_number} ({i.customer_name}) - Balance: ₹{rem.toLocaleString('en-IN')}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method *
              </label>
              <select
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="BANK_TRANSFER">Bank Wire / NEFT / RTGS</option>
                <option value="UPI">UPI / Instant Transfer</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount Received (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Transaction / UTR Reference *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. HDFC20261031008"
                value={form.reference_number}
                onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Date
              </label>
              <input
                type="date"
                required
                value={form.payment_date}
                onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Internal Reconciliation Notes
            </label>
            <textarea
              rows={2}
              placeholder="Bank branch, clearing confirmation..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                if (onClosePaymentModal) onClosePaymentModal();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
            >
              Confirm & Reconcile
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
