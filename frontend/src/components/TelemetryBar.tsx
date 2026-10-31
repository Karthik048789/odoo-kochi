import React from 'react';
import { Zap, ShieldCheck, Clock, UserCheck, Sparkles } from 'lucide-react';
import { User } from '../types';
import { api } from '../api';

interface TelemetryBarProps {
  user: User | null;
  onPersonaSwitch: (token: string, user: User) => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({
  user,
  onPersonaSwitch,
  onNotify,
}) => {
  const [switching, setSwitching] = React.useState<string | null>(null);

  const handleQuickPersona = async (email: string, pass: string, name: string) => {
    try {
      setSwitching(name);
      const res = await api.login({ email, password: pass });
      localStorage.setItem('suber_token', res.access_token);
      let userObj = res.user;
      if (!userObj) {
        userObj = await api.getMe();
      }
      onPersonaSwitch(res.access_token, userObj);
      onNotify(`Switched active persona to ${name} (${userObj.role})`, 'success');
    } catch (err: any) {
      onNotify(err.message || 'Failed to switch persona.', 'error');
    } finally {
      setSwitching(null);
    }
  };

  return (
    <div className="bg-slate-900 text-white text-[11px] px-6 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 relative z-20">
      {/* Left Telemetry Indicators */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5 text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold tracking-wide">SUBER Engine v2.4:</span>
          <span className="text-white font-mono text-[10px]">LIVE & RECURRENT</span>
        </div>

        <div className="hidden lg:flex items-center space-x-1.5 text-slate-400 border-l border-slate-800 pl-4">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Next Auto-Billing:</span>
          <span className="text-slate-200 font-mono text-[10px]">Daily 00:00 UTC</span>
        </div>

        <div className="hidden xl:flex items-center space-x-1.5 text-slate-400 border-l border-slate-800 pl-4">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Security Layer:</span>
          <span className="text-slate-200 font-mono text-[10px]">RBAC + Strict Tenant IDOR</span>
        </div>
      </div>

      {/* Right Quick Persona Switcher Dock */}
      <div className="flex items-center space-x-2">
        <span className="hidden sm:inline-flex items-center space-x-1 text-slate-400 font-medium text-[10px] mr-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Quick Persona Switcher:</span>
        </span>

        {/* Admin Persona */}
        <button
          onClick={() => handleQuickPersona('admin@brightloop.com', 'Brightloop#Admin2026', 'Priya (Admin)')}
          disabled={switching !== null}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
            user?.role === 'ADMIN'
              ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/40 ring-1 ring-rose-400 font-bold'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="Switch to Admin (Priya Sharma)"
        >
          <span>👑</span>
          <span>Admin</span>
        </button>

        {/* Staff Persona */}
        <button
          onClick={() => handleQuickPersona('staff@brightloop.com', 'Brightloop#Staff2026', 'Rahul (Staff)')}
          disabled={switching !== null}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
            user?.role === 'STAFF'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/40 ring-1 ring-blue-400 font-bold'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="Switch to Staff (Rahul Verma)"
        >
          <span>💼</span>
          <span>Staff</span>
        </button>

        {/* Customer Persona */}
        <button
          onClick={() => handleQuickPersona('amit@apexretail.com', 'ApexRetail#Strong2026', 'Amit (Customer)')}
          disabled={switching !== null}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
            user?.role === 'CUSTOMER'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/40 ring-1 ring-emerald-400 font-bold'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="Switch to Customer (Apex Retail - Amit Patel)"
        >
          <span>🏢</span>
          <span>Customer</span>
        </button>
      </div>
    </div>
  );
};
