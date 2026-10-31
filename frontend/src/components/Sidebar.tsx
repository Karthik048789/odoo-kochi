import React from 'react';
import {
  LayoutDashboard, Package, CalendarRange, FileText,
  Repeat, Receipt, CreditCard, Users, Tag, UserPlus,
  Compass, ShieldAlert, Sparkles
} from 'lucide-react';
import { Role } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  role: Role;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, role }) => {
  const isCustomer = role === 'CUSTOMER';
  const isAdmin = role === 'ADMIN';

  const staffNavItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products & Variants', icon: Package },
    { id: 'plans', label: 'Subscription Plans', icon: CalendarRange },
    { id: 'quotations', label: 'Quotations', icon: FileText },
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
    { id: 'invoices', label: 'Invoices & Billing', icon: Receipt },
    { id: 'payments', label: 'Payments Ledger', icon: CreditCard },
    { id: 'customers', label: 'Customers Directory', icon: Users },
  ];

  const adminNavItems = [
    { id: 'discounts', label: 'Discount Engine', icon: Tag, badge: 'Admin' },
    { id: 'staff', label: 'Staff Management', icon: UserPlus, badge: 'Admin' },
  ];

  const customerNavItems = [
    { id: 'my_subscriptions', label: 'My Subscriptions', icon: Repeat },
    { id: 'my_quotations', label: 'Pending Quotes', icon: FileText },
    { id: 'my_invoices', label: 'My Invoices & PDFs', icon: Receipt },
    { id: 'my_payments', label: 'Payment Receipts', icon: CreditCard },
    { id: 'my_profile', label: 'Company Profile', icon: Users },
  ];

  return (
    <aside className="w-64 border-r bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 shrink-0 transition-colors">
      <div className="space-y-6">
        {/* Navigation Section */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            {isCustomer ? 'Customer Portal' : 'Operations & Revenue'}
          </div>

          <div className="space-y-1">
            {isCustomer ? (
              customerNavItems.map((item) => {
                const Icon = item.icon;
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })
            ) : (
              staffNavItems.map((item) => {
                const Icon = item.icon;
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase flex items-center justify-between">
              <span>Governance</span>
              <span className="text-[9px] bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 px-1.5 py-0.2 rounded font-bold">
                Admin
              </span>
            </div>

            <div className="space-y-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Box */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-slate-800/80 dark:to-slate-800/40 border border-indigo-100 dark:border-slate-700/60 text-xs">
        <div className="flex items-center space-x-2 text-indigo-700 dark:text-indigo-400 font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Standalone Billing</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
          Zero spreadsheet drift. Guaranteed calendar-aware idempotency & multi-variant pricing.
        </p>
      </div>
    </aside>
  );
};
