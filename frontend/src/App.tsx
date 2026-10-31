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
import { TelemetryBar } from './components/TelemetryBar';
import { LandingHeroView } from './views/LandingHeroView';
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 relative overflow-x-hidden">
      {/* Ambient Aurora Glow Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-cyan-400/10 dark:bg-cyan-500/10 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '-6s' }} />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '-12s' }} />
      </div>

      {/* Top Telemetry / Executive Ticker */}
      <TelemetryBar
        user={user}
        onPersonaSwitch={(_token, u) => {
          if (u && u.role) {
            setUser(u);
            if (u.role === 'CUSTOMER') {
              setCurrentTab('my_subscriptions');
            } else {
              setCurrentTab('dashboard');
            }
          } else {
            checkSession();
          }
        }}
        onNotify={notify}
      />

      {/* Top Navbar */}
      <Navbar
        user={user}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 overflow-hidden relative z-10">
        {user ? (
          <>
            {/* Role-based Sidebar */}
            <Sidebar
              currentTab={currentTab}
              onSelectTab={setCurrentTab}
              role={user.role}
            />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 max-w-7xl mx-auto w-full">
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
          <main className="flex-1 overflow-y-auto flex items-center justify-center p-4">
            <LandingHeroView
              onLoginSuccess={(_token, u) => {
                if (u && u.role) {
                  setUser(u);
                  if (u.role === 'CUSTOMER') {
                    setCurrentTab('my_subscriptions');
                  } else {
                    setCurrentTab('dashboard');
                  }
                } else {
                  checkSession();
                }
              }}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onNotify={notify}
            />
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
