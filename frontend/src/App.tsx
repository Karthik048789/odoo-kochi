import React, { useEffect, useState } from 'react';
import { api } from './api';
import { User, Invoice } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { ProductsView } from './views/ProductsView';
import { PlansView } from './views/PlansView';
import { QuotationsView } from './views/QuotationsView';
import { SubscriptionsView } from './views/SubscriptionsView';
import { InvoicesView } from './views/InvoicesView';
import { PaymentsView } from './views/PaymentsView';
import { DiscountsView } from './views/DiscountsView';
import { StaffView } from './views/StaffView';
import { CustomersDirectoryView } from './views/CustomersDirectoryView';
import { CustomerPortalView } from './views/CustomerPortalView';
import { LoginModal } from './views/LoginModal';
import { CheckCircle2, AlertCircle, X, Zap } from 'lucide-react';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [activeInvoiceForPay, setActiveInvoiceForPay] = useState<Invoice | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Toggle Dark Mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('suber_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('suber_theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('suber_theme', 'dark');
      setDarkMode(true);
    }
  };

  // Initialize active user
  const checkSession = async () => {
    const token = localStorage.getItem('suber_token');
    if (token) {
      try {
        const me = await api.getMe();
        setUser(me);
        if (me.role === 'CUSTOMER') {
          setCurrentTab('my_subscriptions');
        } else {
          setCurrentTab('dashboard');
        }
      } catch {
        localStorage.removeItem('suber_token');
        setUser(null);
        setIsLoginModalOpen(true);
      }
    } else {
      setUser(null);
      setIsLoginModalOpen(true);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('suber_token');
    setUser(null);
    setIsLoginModalOpen(true);
    notify('Signed out successfully.', 'success');
  };

  const handleOpenPayment = (inv: Invoice) => {
    setActiveInvoiceForPay(inv);
    setCurrentTab('payments');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        user={user}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 overflow-hidden">
        {user ? (
          <>
            {/* Role-based Sidebar */}
            <Sidebar
              currentTab={currentTab}
              onSelectTab={setCurrentTab}
              role={user.role}
            />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto px-6 py-6 max-w-7xl mx-auto w-full">
              {/* Customer Portal Views */}
              {user.role === 'CUSTOMER' && (
                <CustomerPortalView currentTab={currentTab} onNotify={notify} />
              )}

              {/* Staff & Admin Views */}
              {user.role !== 'CUSTOMER' && (
                <>
                  {currentTab === 'dashboard' && (
                    <DashboardView onNotify={notify} onNavigateTab={setCurrentTab} />
                  )}
                  {currentTab === 'products' && (
                    <ProductsView role={user.role} onNotify={notify} />
                  )}
                  {currentTab === 'plans' && (
                    <PlansView role={user.role} onNotify={notify} />
                  )}
                  {currentTab === 'quotations' && (
                    <QuotationsView role={user.role} onNotify={notify} onNavigateTab={setCurrentTab} />
                  )}
                  {currentTab === 'subscriptions' && (
                    <SubscriptionsView role={user.role} onNotify={notify} />
                  )}
                  {currentTab === 'invoices' && (
                    <InvoicesView
                      role={user.role}
                      onNotify={notify}
                      onOpenPaymentModal={handleOpenPayment}
                    />
                  )}
                  {currentTab === 'payments' && (
                    <PaymentsView
                      role={user.role}
                      onNotify={notify}
                      activeInvoiceForPay={activeInvoiceForPay}
                      onClosePaymentModal={() => setActiveInvoiceForPay(null)}
                    />
                  )}
                  {currentTab === 'customers' && (
                    <CustomersDirectoryView role={user.role} onNotify={notify} />
                  )}
                  {currentTab === 'discounts' && user.role === 'ADMIN' && (
                    <DiscountsView role={user.role} onNotify={notify} />
                  )}
                  {currentTab === 'staff' && user.role === 'ADMIN' && (
                    <StaffView role={user.role} onNotify={notify} />
                  )}
                </>
              )}
            </main>
          </>
        ) : (
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-xl w-full text-center space-y-6 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25">
                <Zap className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Welcome to SUBER
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Business Subscription Management System. Real-time multi-tier recurring billing, automated tax invoicing, and dynamic customer lifecycle management.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 transition-all"
                >
                  Sign In to Enterprise Workspace
                </button>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Login & Registration Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(data) => {
          localStorage.setItem('suber_token', data.access_token);
          checkSession();
        }}
        onNotify={notify}
      />

      {/* Ephemeral Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
          <div
            className={`flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold backdrop-blur-md border ${
              toast.type === 'error'
                ? 'bg-rose-900/90 text-white border-rose-800 shadow-rose-900/30'
                : 'bg-slate-900/90 text-white border-slate-800 shadow-indigo-900/30'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
