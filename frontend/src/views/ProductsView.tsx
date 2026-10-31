import React, { useEffect, useState } from 'react';
import { Package, Plus, Layers, CheckCircle2, XCircle, Search, Tag } from 'lucide-react';
import { api } from '../api';
import { Product, Role } from '../types';
import { Modal } from '../components/Modal';

interface ProductsViewProps {
  role: Role;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ role, onNotify }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddVariantOpen, setIsAddVariantOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Form states
  const [productForm, setProductForm] = useState({
    product_code: '',
    name: '',
    product_type: 'SOFTWARE_LICENSE',
    sales_price: '',
    cost_price: '',
    description: '',
  });

  const [variantForm, setVariantForm] = useState({
    variant_name: '',
    attribute_type: 'Brand',
    attribute_value: '',
    additional_price: '',
    sku_suffix: '',
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (err: any) {
      onNotify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProduct({
        ...productForm,
        sales_price: parseFloat(productForm.sales_price) || 0,
        cost_price: parseFloat(productForm.cost_price) || 0,
      });
      onNotify('Product created successfully!', 'success');
      setIsAddProductOpen(false);
      setProductForm({
        product_code: '',
        name: '',
        product_type: 'SOFTWARE_LICENSE',
        sales_price: '',
        cost_price: '',
        description: '',
      });
      loadProducts();
    } catch (err: any) {
      onNotify(err.message, 'error');
    }
  };

  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    try {
      await api.createVariant(selectedProductId, {
        ...variantForm,
        additional_price: parseFloat(variantForm.additional_price) || 0,
      });
      onNotify('Product variant added successfully!', 'success');
      setIsAddVariantOpen(false);
      setVariantForm({
        variant_name: '',
        attribute_type: 'Brand',
        attribute_value: '',
        additional_price: '',
        sku_suffix: '',
      });
      loadProducts();
    } catch (err: any) {
      onNotify(err.message, 'error');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.product_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(Number(val));
  };

  const isAdmin = role === 'ADMIN';

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Products & Variant Catalogs
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage software licenses, cloud add-ons, and multi-attribute brand editions.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddProductOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Base Product</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search products by code or title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{p.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                      {p.product_code}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 uppercase">
                      {p.product_type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {p.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Base Price
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatCurrency(p.sales_price)}
                  </span>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setSelectedProductId(p.id);
                      setIsAddVariantOpen(true);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variant</span>
                  </button>
                )}
              </div>
            </div>

            {/* Variants Sub-table */}
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Available Brand & Edition Variants ({p.variants?.length || 0})</span>
              </div>

              {p.variants && p.variants.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {p.variants.map((v) => {
                    const combinedPrice = Number(p.sales_price) + Number(v.additional_price);
                    return (
                      <div
                        key={v.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {v.variant_name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 font-semibold">
                              {p.product_code}{v.sku_suffix}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {v.attribute_type}: <span className="font-semibold">{v.attribute_value}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-200/40 dark:border-slate-700/40 flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">
                            Variant Delta: <b className="text-emerald-600">+{formatCurrency(v.additional_price)}</b>
                          </span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            Combined: {formatCurrency(combinedPrice)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-400 text-center">
                  Standard base offering only. No attribute variants configured.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        title="Add New Base Product"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Product Code / SKU *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. PROD-HELPDESK"
                value={productForm.product_code}
                onChange={(e) => setProductForm({ ...productForm, product_code: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Brightloop Helpdesk Suite"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Product Type
              </label>
              <select
                value={productForm.product_type}
                onChange={(e) => setProductForm({ ...productForm, product_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="SOFTWARE_LICENSE">Software License</option>
                <option value="SERVICE">Service / Add-on</option>
                <option value="CONSUMABLE">Consumable</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Base Sales Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="1000.00"
                value={productForm.sales_price}
                onChange={(e) => setProductForm({ ...productForm, sales_price: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cost Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="600.00"
                value={productForm.cost_price}
                onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description & Notes
            </label>
            <textarea
              rows={3}
              placeholder="Module capabilities, SLA details..."
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddProductOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Variant Modal */}
      <Modal
        isOpen={isAddVariantOpen}
        onClose={() => setIsAddVariantOpen(false)}
        title="Add Product Variant & Surcharge"
      >
        <form onSubmit={handleCreateVariant} className="space-y-4">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-xs text-indigo-700 dark:text-indigo-300">
            Variants allow multi-brand editions (e.g. Odoo compatibility layer adds ₹560 to base price).
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Variant Display Label *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Odoo Brand Compatibility"
                value={variantForm.variant_name}
                onChange={(e) => setVariantForm({ ...variantForm, variant_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                SKU Suffix *
              </label>
              <input
                type="text"
                required
                placeholder="-ODOO"
                value={variantForm.sku_suffix}
                onChange={(e) => setVariantForm({ ...variantForm, sku_suffix: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Attribute Dimension
              </label>
              <input
                type="text"
                required
                placeholder="Brand / Region / Tier"
                value={variantForm.attribute_type}
                onChange={(e) => setVariantForm({ ...variantForm, attribute_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Attribute Value *
              </label>
              <input
                type="text"
                required
                placeholder="Odoo / APAC"
                value={variantForm.attribute_value}
                onChange={(e) => setVariantForm({ ...variantForm, attribute_value: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Additional Price Delta (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="560.00"
                value={variantForm.additional_price}
                onChange={(e) => setVariantForm({ ...variantForm, additional_price: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddVariantOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
            >
              Save Variant
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
