import React, { useEffect, useState } from 'react';
import {
  Repeat, Pause, Play, XCircle, RotateCcw, Calendar,
  CreditCard, User, Layers, AlertTriangle
} from 'lucide-react';
import { api } from '../api';
import { Subscription, Role } from '../types';
import { Modal } from '../components/Modal';

interface SubscriptionsViewProps {
  role: Role;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ role, onNotify }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  // Close modal
  const [closeSubId, setCloseSubId] = useState<string | null>(null);
  const [closureReason, setClosureReason] = useState('Customer contract renegotiation');

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await api.getSubscriptions();
      setSubscriptions(data);
    } catch (err: any) {
      onNotify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handlePause = async (id: string) => {
    try {
      await api.pauseSubscription(id);
      onNotify('Subscription paused. Automated billing cycles suspended.', 'success');
      loadSubscriptions();
    } catch (err: any) {
      onNotify(err.message, 'error');
    }
  };

  const handleResume = async (id: string) => {
    try {
      await api.resumeSubscription(id);
      onNotify('Subscription resumed. Expiry & billing cycle dates recalculated.', 'success');
      loadSubscriptions();
    } catch (err: any) {
      onNotify(err.message, 'error');
    }
  };

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closeSubId) return;
    try {
      await api.closeSubscription(closeSubId, closureReason);
      onNotify('Subscription closed early.', 'success');
      setCloseSubId(null);
      loadSubscriptions();
    } catch (err: any) {
      onNotify(err.message, 'error');
    }
  };

  const handleRenew = async (id: string) => {
    try {
      await api.renewSubscription(id);
      onNotify('Subscription term renewed successfully!', 'success');
      loadSubscriptions();
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
            Subscription Lifecycle Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Deterministic state management: Active contracts, pause/resume suspension, renewals, and early closure.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {subscriptions.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-400">
            No active subscriptions found. Convert an accepted quotation to initialize an active contract.
          </div>
        ) : (
          subscriptions.map((sub) => {
            const isPaused = sub.status === 'PAUSED';
            const isClosed = sub.status === 'CLOSED';
            const isActive = sub.status === 'ACTIVE';

            const subTotal = sub.lines.reduce(
              (acc, l) => acc + Number(l.unit_price) * l.quantity,
              0
            );

            return (
              <div
                key={sub.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
                        isActive
                          ? 'bg-emerald-600 shadow-emerald-500/20'
                          : isPaused
                          ? 'bg-amber-500 shadow-amber-500/20'
                          : 'bg-slate-500 shadow-slate-500/20'
                      }`}
                    >
                      <Repeat className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                          {sub.subscription_number}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : isPaused
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Customer: <b className="text-slate-800 dark:text-slate-200">{sub.customer_name}</b> | Plan: <b>{sub.plan_name}</b>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Staff/Admin */}
                  {role !== 'CUSTOMER' && (
                    <div className="flex items-center space-x-2">
                      {isActive && (
                        <button
                          onClick={() => handlePause(sub.id)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 hover:bg-amber-100 transition-colors"
                          title="Pause automated billing"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause</span>
                        </button>
                      )}

                      {isPaused && (
                        <button
                          onClick={() => handleResume(sub.id)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                          title="Resume active recurrence"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Resume</span>
                        </button>
                      )}

                      {!isClosed && (
                        <button
                          onClick={() => setCloseSubId(sub.id)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                          title="Close subscription early"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Close Early</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleRenew(sub.id)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
                        title="Extend contract term"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Renew Term</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Sub details & Dates */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-semibold">Start Date</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{sub.start_date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-semibold">Next Invoice Day</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{sub.next_billing_date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-semibold">Contract Expiry</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{sub.expiry_date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-semibold">Payment Terms</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{sub.payment_terms}</span>
                  </div>
                </div>

                {/* Subscription Line Items */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Contracted Product Lines & Quantities
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {sub.lines.map((l) => (
                      <div
                        key={l.id}
                        className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {l.quantity}x {l.product_name}
                          </span>
                          {l.variant_name && (
                            <span className="text-[11px] text-indigo-500 block">
                              Variant: {l.variant_name}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 text-[10px] block">Unit Rate</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {formatCurrency(l.unit_price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {sub.closure_reason && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs">
                    <b>Closure Reason:</b> {sub.closure_reason}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Early Closure Modal */}
      <Modal
        isOpen={!!closeSubId}
        onClose={() => setCloseSubId(null)}
        title="Confirm Early Subscription Termination"
      >
        <form onSubmit={handleClose} className="space-y-4">
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-xs text-rose-700 dark:text-rose-400 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Closing a subscription early halts all future automated recurring billing cycles immediately.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Termination Reason *
            </label>
            <textarea
              rows={3}
              required
              value={closureReason}
              onChange={(e) => setClosureReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCloseSubId(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
            >
              Confirm Termination
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
