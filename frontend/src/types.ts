export type Role = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  is_active: boolean;
  customer_id?: string | null;
  created_at?: string;
}


export interface Customer {
  id: string;
  user_id: string;
  company_name: string;
  tax_identifier?: string;
  phone_number: string;
  billing_address: string;
  city: string;
  postal_code: string;
  country: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  attribute_type: string;
  attribute_value: string;
  additional_price: number | string;
  sku_suffix: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  product_code: string;
  name: string;
  product_type: 'SERVICE' | 'SOFTWARE_LICENSE' | 'CONSUMABLE';
  sales_price: number | string;
  cost_price: number | string;
  description?: string;
  is_active: boolean;
  created_at: string;
  variants: ProductVariant[];
}

export interface Plan {
  id: string;
  plan_code: string;
  name: string;
  billing_frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  billing_interval_count: number;
  min_quantity: number;
  valid_from: string;
  valid_until?: string | null;
  auto_close_at_expiry: boolean;
  allow_early_closure: boolean;
  allow_pause: boolean;
  auto_renew: boolean;
  is_active: boolean;
}

export interface QuotationLine {
  id: string;
  product_id: string;
  product_name?: string;
  variant_id?: string;
  variant_name?: string;
  quantity: number;
  base_unit_price: number | string;
  variant_extra_price: number | string;
  final_unit_price: number | string;
  tax_id?: string;
  tax_rate: number | string;
  line_subtotal: number | string;
  line_total: number | string;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  customer_id: string;
  customer_name?: string;
  plan_id: string;
  plan_name?: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  valid_until: string;
  subtotal: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  created_at: string;
  lines: QuotationLine[];
}

export interface SubscriptionLine {
  id: string;
  product_id: string;
  product_name?: string;
  variant_id?: string;
  variant_name?: string;
  quantity: number;
  unit_price: number | string;
  tax_rate: number | string;
  line_total: number | string;
}

export interface Subscription {
  id: string;
  subscription_number: string;
  customer_id: string;
  customer_name?: string;
  plan_id: string;
  plan_name?: string;
  quotation_id?: string;
  status: 'DRAFT' | 'QUOTATION' | 'CONFIRMED' | 'ACTIVE' | 'PAUSED' | 'CLOSED';
  start_date: string;
  expiry_date: string;
  next_billing_date: string;
  payment_terms: 'IMMEDIATE' | 'NET_15' | 'NET_30';
  paused_at?: string | null;
  closed_at?: string | null;
  closure_reason?: string | null;
  created_at: string;
  lines: SubscriptionLine[];
}

export interface InvoiceLine {
  id: string;
  product_name_snapshot: string;
  variant_name_snapshot?: string | null;
  quantity: number;
  unit_price: number | string;
  tax_rate: number | string;
  tax_amount: number | string;
  line_total: number | string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  subscription_id: string;
  subscription_number?: string;
  customer_id: string;
  customer_name?: string;
  billing_cycle_start: string;
  billing_cycle_end: string;
  invoice_date: string;
  due_date: string;
  status: 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELLED';
  subtotal: number | string;
  discount_total: number | string;
  tax_total: number | string;
  total_amount: number | string;
  amount_paid: number | string;
  outstanding_balance?: number | string;
  pdf_url?: string | null;
  created_at: string;
  lines: InvoiceLine[];
}

export interface Discount {
  id: string;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  amount_value: number | string;
  scope: 'SUBSCRIPTION_LEVEL' | 'PRODUCT_SPECIFIC';
  min_subtotal: number | string;
  min_quantity: number;
  valid_from: string;
  valid_until: string;
  max_uses?: number | null;
  used_count: number;
  is_active: boolean;
}

export interface Payment {
  id: string;
  payment_number: string;
  invoice_id: string;
  invoice_number?: string;
  payment_method: 'BANK_TRANSFER' | 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'CHEQUE';
  amount: number | string;
  payment_date: string;
  reference_number: string;
  notes?: string;
  recorded_by_user_id: string;
  created_at: string;
}

export interface DashboardSummary {
  active_subscriptions: number;
  mrr: number | string;
  arr: number | string;
  billed_revenue: number | string;
  cash_collected: number | string;
  outstanding_balance: number | string;
  overdue_amount: number | string;
  total_customers: number;
  total_invoices: number;
}

export interface RevenueTrend {
  month: string;
  billed_revenue: number;
  cash_collected: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface RenewalQueueItem {
  subscription_id: string;
  subscription_number: string;
  customer_name: string;
  plan_name: string;
  expiry_date: string;
  days_remaining: number;
  annual_or_monthly_value: number | string;
}
