import React, { useEffect, useState } from 'react';
import {
  TrendingUp, DollarSign, Calendar, Users, AlertCircle,
  Clock, CheckCircle, RefreshCw, ArrowUpRight, Zap
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid
} from 'recharts';
import { api } from '../api';
import { DashboardSummary, RevenueTrend, TopProduct, RenewalQueueItem } from '../types';

interface DashboardViewProps {
  onNotify: (msg: string, type?: 'success' | 'error') => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNotify, onNavigateTab }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<RevenueTrend[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [renewals, setRenewals] = useState<RenewalQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningBilling, setRunningBilling] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumData, trendData, prodData, renewalData] = await Promise.all([
        api.getDashboardSummary(),
        api.getRevenueTrends(6),
        api.getTopProducts(),
        api.getUpcomingRenewals(30),
      ]);
      setSummary(sumData);
      setTrends(trendData);
      setTopProducts(prodData);
      setRenewals(renewalData);
    } catch (err: any) {
      onNotify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerBilling = async () => {
    try {
      setRunningBilling(true);
      const res = await api.triggerBillingRun();
      onNotify(res.message || 'Billing run completed successfully!', 'success');
      await loadData();
    } catch (err: any) {
      onNotify(err.message, 'error');
    } finally {
      setRunningBilling(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading live business analytics...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Banner / Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-xl shadow-indigo-950/20">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>Autonomous Subscription Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Revenue & Subscription Analytics
          </h1>
          <p className="text-sm text-indigo-200/80 mt-1">
            Real-time tracking of Brightloop Software subscriptions, cash collections, and recurrence.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleTriggerBilling}
            disabled={runningBilling}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            <span>{runningBilling ? 'Generating Invoices...' : 'Trigger Scheduled Billing'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Lifecycle Architecture Pipeline */}
      <div className="p-5 rounded-3xl glass-card border border-slate-200 dark:border-slate-800 space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Autonomous Lifecycle Pipeline
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Click any phase to inspect live ledger
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          {/* Step 1: Catalog */}
          <button
            onClick={() => onNavigateTab('products')}
            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-700/60 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
              <span>01. CATALOG</span>
              <span className="text-indigo-500 group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Products & Plans</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Multi-variant pricing</div>
          </button>

          {/* Step 2: Quotations */}
          <button
            onClick={() => onNavigateTab('quotations')}
            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-700/60 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
              <span>02. NEGOTIATION</span>
              <span className="text-indigo-500 group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Quotes & Coupons</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Discounts & taxes</div>
          </button>

          {/* Step 3: Subscriptions */}
          <button
            onClick={() => onNavigateTab('subscriptions')}
            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-700/60 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
              <span>03. LIFECYCLE</span>
              <span className="text-indigo-500 group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Active Contracts</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Pause / Resume / Renew</div>
          </button>

          {/* Step 4: Billing & PDF */}
          <button
            onClick={() => onNavigateTab('invoices')}
            className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mb-1">
              <span>04. BILLING & PDF</span>
              <span className="text-indigo-600 group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
            <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Tax Invoices (PDF)</div>
            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5">Inline Preview & Download</div>
          </button>

          {/* Step 5: Payments */}
          <button
            onClick={() => onNavigateTab('payments')}
            className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mb-1">
              <span>05. SETTLEMENT</span>
              <span className="text-emerald-600 group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
            <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Cash Reconciled</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Bank Reference & Audit</div>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* MRR */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-400" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Monthly Recurring (MRR)
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-sm">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(summary?.mrr)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
            <span>Annualized Run-Rate (ARR):</span>
            <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {formatCurrency(summary?.arr)}
            </span>
          </div>
        </div>

        {/* Cash Collected vs Billed */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Cash Reconciled
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-sm">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatCurrency(summary?.cash_collected)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
            <span>Total Billed:</span>
            <span className="font-bold font-mono text-slate-700 dark:text-slate-300">
              {formatCurrency(summary?.billed_revenue)}
            </span>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-rose-400" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Outstanding Balance
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shadow-sm">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-400 tracking-tight">
            {formatCurrency(summary?.outstanding_balance)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
            <span>Overdue Amount:</span>
            <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
              {formatCurrency(summary?.overdue_amount)}
            </span>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-indigo-500" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Contracts
            </span>
            <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 shadow-sm">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
            {summary?.active_subscriptions || 0}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
            <span>Client Enterprises:</span>
            <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400">
              {summary?.total_customers || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trends Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Billed Revenue vs. Cash Reconciled
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Demonstrating strict financial duality across recent billing cycles
              </p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-medium">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-slate-600 dark:text-slate-400">Billed Revenue</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-400">Cash Collected</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(value), '']}
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="billed_revenue"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorBilled)"
                  name="Billed Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="cash_collected"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCash)"
                  name="Cash Collected"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Top Selling Offerings
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ranked by invoiced recurring volume
            </p>

            <div className="mt-5 space-y-4">
              {topProducts.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  No billing transaction data yet
                </div>
              ) : (
                topProducts.map((p, idx) => (
                  <div key={p.product_id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {p.product_name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.total_quantity} units contracted
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatCurrency(p.total_revenue)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onNavigateTab('products')}
              className="w-full flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
            >
              <span>Manage Product Catalog & Variants</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Renewals Queue */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Upcoming Renewal Opportunities
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Subscriptions approaching contractual expiration within 30 days
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {renewals.length} Actionable
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <th className="py-3 px-3">Subscription</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Plan</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3">Days Left</th>
                <th className="py-3 px-3 text-right">Contract Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {renewals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No subscriptions nearing expiration in the next 30 days.
                  </td>
                </tr>
              ) : (
                renewals.map((r) => (
                  <tr key={r.subscription_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {r.subscription_number}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                      {r.customer_name}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{r.plan_name}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{r.expiry_date}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.days_remaining <= 7
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}
                      >
                        {r.days_remaining} days
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(r.annual_or_monthly_value)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
