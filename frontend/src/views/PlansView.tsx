import React, { useEffect, useState } from 'react';
import { CalendarRange, Plus, Check, X, Shield, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { Plan, Role } from '../types';
import { Modal } from '../components/Modal';

interface PlansViewProps {
  role: Role;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const PlansView: React.FC<PlansViewProps> = ({ role, onNotify }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    plan_code: '',
    name: '',
    billing_frequency: 'MONTHLY',
    billing_interval_count: 1,
    min_quantity: 1,
    auto_close_at_expiry: false,
    allow_early_closure: true,
    allow_pause: true,
    auto_renew: true,
  });

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await api.getPlans();
      setPlans(data);
    } catch (err: any) {
      onNotify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPlan({
        ...form,
        billing_interval_count: Number(form.billing_interval_count) || 1,
        min_quantity: Number(form.min_quantity) || 1,
      });
      onNotify('Subscription plan configured successfully!', 'success');
      setIsModalOpen(false);
      setForm({
        plan_code: '',
        name: '',
        billing_frequency: 'MONTHLY',
        billing_interval_count: 1,
        min_quantity: 1,
        auto_close_at_expiry: false,
        allow_early_closure: true,
        allow_pause: true,
        auto_renew: true,
      });
      loadPlans();
    } catch (err: any) {
      onNotify(err.message, 'error');
    }
  };

  const isAdmin = role === 'ADMIN';

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Subscription Plans & Recurrence Policies
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure billing cadences (Daily, Weekly, Monthly, Yearly), minimum seat quantities, and lifecycle rules.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Subscription Plan</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div
            key={p.id}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  {p.plan_code}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {p.billing_frequency}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{p.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Recurrence: Every {p.billing_interval_count} {p.billing_frequency.toLowerCase()}(s).
              </p>

              <div className="my-5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Minimum Order Quantity (MOQ):</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{p.min_quantity} seat(s)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Auto Renewal:</span>
                  <span className={p.auto_renew ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                    {p.auto_renew ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Policy Badges */}
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                  {p.allow_pause ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-rose-500" />}
                  <span>{p.allow_pause ? 'Permits temporary pausing' : 'No pausing allowed'}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                  {p.allow_early_closure ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-rose-500" />}
                  <span>{p.allow_early_closure ? 'Permits early termination' : 'Strict lock-in term'}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                  {p.auto_close_at_expiry ? <Check className="w-3.5 h-3.5 text-amber-500" /> : <Check className="w-3.5 h-3.5 text-indigo-500" />}
                  <span>{p.auto_close_at_expiry ? 'Closes automatically on expiry' : 'Continues active recurring'}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Status: <b className="text-emerald-600">Active</b></span>
              <span>Available in Quotes</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Plan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Subscription Plan"
      >
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Plan Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. PLAN-QUARTERLY-PRO"
                value={form.plan_code}
                onChange={(e) => setForm({ ...form, plan_code: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Plan Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Quarterly Professional"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Billing Frequency
              </label>
              <select
                value={form.billing_frequency}
                onChange={(e) => setForm({ ...form, billing_frequency: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Interval Multiplier
              </label>
              <input
                type="number"
                min="1"
                value={form.billing_interval_count}
                onChange={(e) => setForm({ ...form, billing_interval_count: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Min Quantity (MOQ)
              </label>
              <input
                type="number"
                min="1"
                value={form.min_quantity}
                onChange={(e) => setForm({ ...form, min_quantity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.auto_renew}
                onChange={(e) => setForm({ ...form, auto_renew: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Auto-Renew on Anniversary</span>
            </label>
            <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.allow_pause}
                onChange={(e) => setForm({ ...form, allow_pause: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Allow Subscriptions to be Paused</span>
            </label>
            <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.allow_early_closure}
                onChange={(e) => setForm({ ...form, allow_early_closure: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Allow Early Termination</span>
            </label>
            <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.auto_close_at_expiry}
                onChange={(e) => setForm({ ...form, auto_close_at_expiry: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Auto Close on Expiry (No Renewal)</span>
            </label>
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
              Create Plan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
