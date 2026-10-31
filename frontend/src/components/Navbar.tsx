import React from 'react';
import { User, Sun, Moon, LogOut, UserCheck, Zap, LogIn, UserPlus } from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  user: UserType | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  darkMode,
  onToggleDarkMode,
  onOpenLogin,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-500/20">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              SUBER
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              v1.0
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Business Subscription Management System
          </p>
        </div>
      </div>

      {/* Engine Status Indicator */}
      <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-semibold text-[11px]">Autonomous Recurrence Engine:</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">Synchronized</span>
      </div>

      {/* Right User Controls */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>

        {user ? (
          <div className="flex items-center space-x-3 pl-3 border-l border-slate-200 dark:border-slate-800">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {user.first_name} {user.last_name}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {user.email}
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                user.role === 'ADMIN'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                  : user.role === 'STAFF'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
              }`}
            >
              {user.role}
            </span>

            <button
              onClick={onOpenLogin}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 transition-colors"
              title="Switch account"
            >
              Switch Account
            </button>

            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenLogin}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
