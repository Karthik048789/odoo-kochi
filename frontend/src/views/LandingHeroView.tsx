import React, { useState } from 'react';
import {
  Zap, Shield, FileText, Repeat, ArrowRight,
  Sparkles, CheckCircle2, TrendingUp, Users, Lock, ChevronRight
} from 'lucide-react';
import { api } from '../api';
import { User } from '../types';

interface LandingHeroViewProps {
  onLoginSuccess: (token: string, user: User) => void;
  onOpenLoginModal: () => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const LandingHeroView: React.FC<LandingHeroViewProps> = ({
  onLoginSuccess,
  onOpenLoginModal,
  onNotify,
}) => {
  const [loadingPersona, setLoadingPersona] = useState<string | null>(null);

  const handleLaunchPersona = async (email: string, pass: string, name: string) => {
    try {
      setLoadingPersona(name);
      const res = await api.login({ email, password: pass });
      localStorage.setItem('suber_token', res.access_token);
      let userObj = res.user;
      if (!userObj) {
        userObj = await api.getMe();
      }
      onLoginSuccess(res.access_token, userObj);
      onNotify(`Welcome back, ${userObj.first_name}! Logged in as ${userObj.role}.`, 'success');
    } catch (err: any) {
      onNotify(err.message || 'Authentication failed.', 'error');
    } finally {
      setLoadingPersona(null);
    }
  };

  return (
    <div className="relative overflow-hidden w-full max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-12 animate-fade-in">
      {/* Decorative ambient aurora glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-500/20 via-cyan-400/15 to-purple-500/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
          <span>SUBER Autonomous Subscription Engine</span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% Real-Time DB</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Next-Gen Subscription Lifecycle &{' '}
          <span className="gradient-text-shimmer">
            Automated Billing Engine
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Zero spreadsheet drift. Deterministic quotation negotiations, automated proration, multi-variant pricing, and official tax invoice PDF generation.
        </p>
      </div>

      {/* 1-Click Interactive Persona Launchpad */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Select a Demo Persona to Launch Instantly
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Persona 1: Admin */}
          <div className="glass-card rounded-3xl p-6 flex flex-col justify-between border-t-4 border-t-rose-500 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl shadow-sm">
                  👑
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                  ADMIN
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Priya Sharma</h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">admin@brightloop.com</p>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Full executive oversight. MRR/ARR analytics, trigger automated billing runs, configure coupon discount rules, staff roles, and cancel invoices.
              </p>

              <div className="space-y-1.5 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Real-time Financial Telemetry</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Discount & Coupon Rules</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Staff Governance & Invoicing</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLaunchPersona('admin@brightloop.com', 'Brightloop#Admin2026', 'Priya (Admin)')}
              disabled={loadingPersona !== null}
              className="mt-6 w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <span>{loadingPersona === 'Priya (Admin)' ? 'Authenticating...' : 'Launch Admin Console'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Persona 2: Staff */}
          <div className="glass-card rounded-3xl p-6 flex flex-col justify-between border-t-4 border-t-indigo-500 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl shadow-sm">
                  💼
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                  STAFF
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Rahul Verma</h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">staff@brightloop.com</p>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Sales and operations cockpit. Product catalogs, multi-tier pricing plans, draft and convert enterprise quotations into active subscriptions.
              </p>

              <div className="space-y-1.5 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Quotation Negotiation Engine</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Subscription State Machine</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Customer Directory & Ledgers</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLaunchPersona('staff@brightloop.com', 'Brightloop#Staff2026', 'Rahul (Staff)')}
              disabled={loadingPersona !== null}
              className="mt-6 w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <span>{loadingPersona === 'Rahul (Staff)' ? 'Authenticating...' : 'Launch Operations Cockpit'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Persona 3: Customer */}
          <div className="glass-card rounded-3xl p-6 flex flex-col justify-between border-t-4 border-t-emerald-500 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shadow-sm">
                  🏢
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                  CUSTOMER
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Amit Patel</h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">amit@apexretail.com</p>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Self-service customer portal for Apex Retail Solutions. Accept quotations, view active plans, inspect inline PDF billing documents & receipts.
              </p>

              <div className="space-y-1.5 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Self-Service Portal</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Inline PDF Invoices First</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Payment History & Receipts</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLaunchPersona('amit@apexretail.com', 'ApexRetail#Strong2026', 'Amit (Customer)')}
              disabled={loadingPersona !== null}
              className="mt-6 w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <span>{loadingPersona === 'Amit (Customer)' ? 'Authenticating...' : 'Launch Customer Portal'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Alternative Manual Login / Register Bar */}
      <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
          <Lock className="w-4 h-4 text-indigo-500" />
          <span>Need custom credentials or onboarding a new organization?</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenLoginModal}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-colors"
          >
            Manual Sign In / Register
          </button>
        </div>
      </div>

      {/* Feature Capabilities Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
        <div className="p-4 rounded-2xl glass-card space-y-2">
          <div className="p-2 w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Autonomous Billing</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Prorated billing cycles with deterministic duplicate protection.
          </p>
        </div>

        <div className="p-4 rounded-2xl glass-card space-y-2">
          <div className="p-2 w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">PDF Preview First</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Interactive embedded PDF viewer with one-click official downloads.
          </p>
        </div>

        <div className="p-4 rounded-2xl glass-card space-y-2">
          <div className="p-2 w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Repeat className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Lifecycle Engine</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Pause, resume, and renew terms with accurate date adjustments.
          </p>
        </div>

        <div className="p-4 rounded-2xl glass-card space-y-2">
          <div className="p-2 w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Bank-Grade RBAC</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Strict tenant IDOR isolation, Bcrypt password hashing, and JWT tokens.
          </p>
        </div>
      </div>
    </div>
  );
};
