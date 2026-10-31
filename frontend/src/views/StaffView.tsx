import React, { useEffect, useState } from 'react';
import { UserPlus, Shield, UserCheck, Check, X, Lock } from 'lucide-react';
import { api } from '../api';
import { User, Role } from '../types';
import { Modal } from '../components/Modal';

interface StaffViewProps {
  role: Role;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const StaffView: React.FC<StaffViewProps> = ({ role, onNotify }) => {
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'STAFF',
  });

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await api.listStaff();
      setStaffList(data);
    } catch (err: any) {
      onNotify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createStaff(form);
      onNotify('Internal staff member account provisioned!', 'success');
      setIsModalOpen(false);
      setForm({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'STAFF',
      });
      loadStaff();
    } catch (err: any) {
      onNotify(err.message, 'error');
    }
  };

  // Live password validation
  const pass = form.password;
  const isLen = pass.length > 8;
  const isUpper = /[A-Z]/.test(pass);
  const isLower = /[a-z]/.test(pass);
  const isNum = /\d/.test(pass);
  const isSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
  const isPassValid = isLen && isUpper && isLower && isNum && isSpecial;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Staff Provisioning & RBAC Management
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
              Admin Restricted
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Provision internal operators, assign security roles, and enforce strong authentication.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New Staff Account</span>
        </button>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Work Email</th>
                <th className="py-3.5 px-4">Security Role</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Creation Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {staffList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                    {u.first_name} {u.last_name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono">
                    {u.email}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === 'ADMIN'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>Active</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                    {new Date(u.created_at || Date.now()).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision Internal Staff Account"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Work Email Address *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Role
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="STAFF">Staff (Day-to-day Operations)</option>
                <option value="ADMIN">Administrator (Full Access)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Initial Password *
            </label>
            <input
              type="password"
              required
              placeholder="Min 9 chars with Upper, Lower, Number & Special"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />

            {/* Password meter */}
            <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] space-y-1">
              <span className="font-semibold text-slate-500 block mb-1">Password Requirements:</span>
              <div className={`flex items-center space-x-1.5 ${isLen ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isLen ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                <span>More than 8 characters (at least 9)</span>
              </div>
              <div className={`flex items-center space-x-1.5 ${isUpper ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isUpper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                <span>At least one uppercase letter (A-Z)</span>
              </div>
              <div className={`flex items-center space-x-1.5 ${isLower ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isLower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                <span>At least one lowercase letter (a-z)</span>
              </div>
              <div className={`flex items-center space-x-1.5 ${isNum ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isNum ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                <span>At least one number (0-9)</span>
              </div>
              <div className={`flex items-center space-x-1.5 ${isSpecial ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                <span>At least one special character (!@#$%^&*)</span>
              </div>
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
              disabled={!isPassValid}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              Provision Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
