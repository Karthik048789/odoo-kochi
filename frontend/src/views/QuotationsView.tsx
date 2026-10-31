import React, { useEffect, useState } from 'react';
import { FileText, Plus, CheckCircle, ArrowRight, Trash2, Tag, Calendar, User } from 'lucide-react';
import { api } from '../api';
import { Quotation, Product, Plan, Customer, Role } from '../types';
import { Modal } from '../components/Modal';

interface QuotationsViewProps {
  role: Role;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
  onNavigateTab: (tab: string) => void;
}

export const QuotationsView: React.FC<QuotationsViewProps> = ({ role, onNotify, onNavigateTab }) => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [validityDays, setValidityDays] = useState(15);
  const [discountCode, setDiscountCode] = useState('');
  const [lines, setLines] = useState<Array<{ product_id: string; variant_id: string; quantity: number }>>([
    { product_id: '', variant_id: '', quantity: 1 }
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [qData, pData, planData, cData] = await Promise.all([
        api.getQuotations(),
        api.getProducts(),
        api.getPlans(),
        api.getCustomers(),
      ]);
      setQuotations(qData);
      setProducts(pData);
      setPlans(planData);
      setCustomers(cData);
      if (cData.length > 0) setSelectedCustomer(cData[0].id);
      if (planData.length > 0) setSelectedPlan(planData[0].id);
      if (pData.length > 0) {
        setLines([{ product_id: pData[0].id, variant_id: pData[0].variants?.[0]?.id || '', quantity: 1 }]);
      }
    } catch (err: any) {

      onNotify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddLine = () => {
    const firstProd = products[0];
    setLines([
      ...lines,
      {
        product_id: firstProd?.id || '',
        variant_id: firstProd?.variants?.[0]?.id || '',
        quantity: 1,
      },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: string, value: any) => {
    const updated = [...lines];
    if (field === 'product_id') {
      const prod = products.find((p) => p.id === value);
      updated[idx] = {
        product_id: value,
        variant_id: prod?.variants?.[0]?.id || '',
        quantity: updated[idx].quantity,
      };
    } else {
      updated[idx] = { ...updated[idx], [field]: value };
    }
    setLines(updated);
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createQuotation({
        customer_id: selectedCustomer,
        plan_id: selectedPlan,
        validity_days: validityDays,
        discount_code: discountCode.trim() || undefined,
        lines: lines.map((l) => ({
          product_id: l.product_id,
          variant_id: l.variant_id || undefined,
          quantity: Number(l.quantity) || 1,
        })),
      });
      onNotify('Quotation generated successfully!', 'success');
      setIsModalOpen(false);
      // Reset form state for next use
      setDiscountCode('');
      setValidityDays(15);
      const firstProd = products[0];
      setLines([{ product_id: firstProd?.id || '', variant_id: firstProd?.variants?.[0]?.id || '', quantity: 1 }]);
      loadData();
    } catch (err: any) {
      onNotify(err.message, 'error');
    }
  };

  const handleAcceptQuote = async (id: string) => {
    try {
      await api.acceptQuotation(id);
      onNotify('Quotation accepted! Ready for conversion.', 'success');
      loadData();
    } catch (err: any) {
      onNotify(err.message, 'error');
    }
  };

  const handleConvertQuote = async (id: string) => {
    try {
      const sub = await api.convertQuotation(id);
      onNotify(`Quotation converted! Active Subscription ${sub.subscription_number} initiated.`, 'success');
      loadData();
      onNavigateTab('subscriptions');
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
            Quotations & Contract Negotiation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build multi-line enterprise quotes, apply coupon rules, accept agreements, and convert into subscriptions.
          </p>
        </div>

        {role !== 'CUSTOMER' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Quotation</span>
          </button>
        )}
      </div>

      {/* Quotation Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-4">Quote Number</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Plan</th>
                <th className="py-3.5 px-4">Validity</th>
                <th className="py-3.5 px-4">Lines & Surcharges</th>
                <th className="py-3.5 px-4 text-right">Pre-Tax</th>
                <th className="py-3.5 px-4 text-right">Discount</th>
                <th className="py-3.5 px-4 text-right">Total (Inc. GST)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No quotations generated yet. Click &quot;Generate New Quotation&quot; to begin.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {q.quotation_number}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                      {q.customer_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{q.plan_name}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">{q.valid_until}</td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {q.lines.map((l, i) => (
                          <div key={i} className="text-[11px] text-slate-600 dark:text-slate-300">
                            <b>{l.quantity}x</b> {l.product_name}
                            {l.variant_name && (
                              <span className="text-indigo-500 font-medium"> ({l.variant_name})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-700 dark:text-slate-300">
                      {formatCurrency(q.subtotal)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-emerald-600">
                      - {formatCurrency(q.discount_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(q.total_amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          q.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : q.status === 'SENT'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                            : q.status === 'EXPIRED'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {q.status === 'SENT' && (
                          <button
                            onClick={() => handleAcceptQuote(q.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 hover:bg-emerald-100 transition-colors"
                            title="Accept Quotation"
                          >
                            Accept
                          </button>
                        )}
                        {q.status === 'ACCEPTED' && role !== 'CUSTOMER' && (
                          <button
                            onClick={() => handleConvertQuote(q.id)}
                            className="flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                            title="Convert to Active Subscription"
                          >
                            <span>Convert</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Quotation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Customer Quotation"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateQuote} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Customer *
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subscription Plan *
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.billing_frequency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Validity (Days)
              </label>
              <input
                type="number"
                min="1"
                value={validityDays}
                onChange={(e) => setValidityDays(parseInt(e.target.value) || 15)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Order Lines & Products</span>
              <button
                type="button"
                onClick={handleAddLine}
                className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Line Item</span>
              </button>
            </div>

            {lines.map((l, idx) => {
              const currentProd = products.find((p) => p.id === l.product_id);
              const availableVariants = currentProd?.variants || [];
              const currentVar = availableVariants.find((v) => v.id === l.variant_id);
              const unitBase = Number(currentProd?.sales_price || 0);
              const varDelta = Number(currentVar?.additional_price || 0);
              const combinedUnit = unitBase + varDelta;

              return (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs"
                >
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] text-slate-400 mb-0.5">Product</label>
                    <select
                      value={l.product_id}
                      onChange={(e) => handleLineChange(idx, 'product_id', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Base ₹{p.sales_price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[10px] text-slate-400 mb-0.5">Edition / Variant</label>
                    <select
                      value={l.variant_id}
                      onChange={(e) => handleLineChange(idx, 'variant_id', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="">Standard Edition (+₹0)</option>
                      {availableVariants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.variant_name} (+₹{v.additional_price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-0.5">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={l.quantity}
                      onChange={(e) => handleLineChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-1 flex items-center justify-end pt-3 sm:pt-0">
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="sm:col-span-12 flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                    <span>
                      Effective Unit Price: <b>₹{combinedUnit.toLocaleString('en-IN')}</b>
                    </span>
                    <span>
                      Line Subtotal: <b>₹{(combinedUnit * l.quantity).toLocaleString('en-IN')}</b>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Discount Promo Code */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Apply Promo Code (Optional)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="e.g. DIWALI10, STARTUP500"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-xl text-xs uppercase font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Validates minimum order quantity, expiration date, and customer tier eligibility automatically.
            </p>
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
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
            >
              Submit Quotation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
