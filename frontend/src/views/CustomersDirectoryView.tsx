import React, { useEffect, useState } from 'react';
import { Users, Search, Building2, MapPin, Phone, Mail } from 'lucide-react';
import { api } from '../api';
import { Customer, Role } from '../types';

interface CustomersDirectoryViewProps {
  role: Role;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const CustomersDirectoryView: React.FC<CustomersDirectoryViewProps> = ({ role, onNotify }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err: any) {
      onNotify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Customers Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Accounts receivable profiles, tax identifiers (GSTIN), and registered enterprise billing addresses.
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search by company, city or contact email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {c.company_name}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    GSTIN: {c.tax_identifier || 'Unregistered'}
                  </div>
                </div>
              </div>

              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs border border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{c.email || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{c.phone_number}</span>
                </div>
                <div className="flex items-start space-x-2 text-slate-600 dark:text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    {c.billing_address}, {c.city}, {c.postal_code}, {c.country}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Account Status: <b className="text-emerald-600">Active</b></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
