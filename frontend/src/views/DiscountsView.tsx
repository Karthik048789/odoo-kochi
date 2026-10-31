import React, { useEffect, useState } from 'react';
import { Tag, Plus, Check, X, Calendar, Percent, ShieldCheck } from 'lucide-react';
import { api } from '../api';
import { Discount, Role } from '../types';
import { Modal } from '../components/Modal';

interface DiscountsViewProps {
  role: Role;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const DiscountsView: React.FC<DiscountsViewProps> = ({ role, onNotify }) => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    code: '',
    discount_type: 'PERCENTAGE',
    amount_value: '',
    scope: 'SUBSCRIPTION_LEVEL',
    min_subtotal: '0.00',
    min_quantity: 1,
    max_uses: '',
  });

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      const data = await api.getDiscounts();
      setDiscounts(data);
    } catch (err: any) {
      onNotify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDiscount({
        ...form,
        amount_value: parseFloat(form.amount_value) || 0,
        min_subtotal: parseFloat(form.min_subtotal) || 0,
        min_quantity: parseInt(form.min_quantity.toString()) || 1,
        max_uses: form.max_uses ? parseInt(form.max_uses) : undefined,
      });
      onNotify('Discount promotion rule created!', 'success');
      setIsModalOpen(false);
      setForm({
        code: '',
        discount_type: 'PERCENTAGE',
        amount_value: '',
        scope: 'SUBSCRIPTION_LEVEL',
        min_subtotal: '0.00',
        min_quantity: 1,
        max_uses: '',
      });
      loadDiscounts();
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
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Discount Governance Engine
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
              Admin Restricted
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure percentage and fixed promotions, seat thresholds, and temporal usage limits.
          </p>
        </div>

        {role === 'ADMIN' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Discount Rule</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {discounts.map((d) => (
          <div
            key={d.id}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-mono font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider">
                  {d.code}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 uppercase">
                  {d.discount_type}
                </span>
              </div>

              <div className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                {d.discount_type === 'PERCENTAGE'
                  ? `${d.amount_value}% OFF`
                  : `- ${formatCurrency(d.amount_value)}`}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1.5 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Scope:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{d.scope}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Min Spend:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatCurrency(d.min_subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Min Quantity:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {d.min_quantity} seat(s)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Usage Limit:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {d.used_count} / {d.max_uses ?? 'Unlimited'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Status: <b className="text-emerald-600">Active Rule</b></span>
              <span>Protected</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Discount Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Admin Discount Rule"
      >
        <form onSubmit={handleCreateDiscount} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Coupon Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ENTERPRISE20"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl text-xs uppercase font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Discount Type
              </label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Deduction Value *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder={form.discount_type === 'PERCENTAGE' ? '15.00' : '1000.00'}
                value={form.amount_value}
                onChange={(e) => setForm({ ...form, amount_value: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Min Spend (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.min_subtotal}
                onChange={(e) => setForm({ ...form, min_subtotal: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Max Uses (Cap)
              </label>
              <input
                type="number"
                placeholder="Unlimited"
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
            >
              Create Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
