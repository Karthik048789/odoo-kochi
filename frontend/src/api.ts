import {
  User, Customer, Product, ProductVariant, Plan, Quotation,
  Subscription, Invoice, Discount, Payment, DashboardSummary,
  RevenueTrend, TopProduct, RenewalQueueItem
} from './types';

const API_BASE = '/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('suber_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = 'An unexpected error occurred';
    try {
      const errJson = await res.json();
      if (Array.isArray(errJson.detail)) {
        errorDetail = errJson.detail.map((d: any) => {
          const field = d.loc?.slice(-1)[0] || 'field';
          return `${field}: ${d.msg}`;
        }).join(' | ');
      } else if (typeof errJson.detail === 'string') {
        errorDetail = errJson.detail;
      } else if (errJson.message) {
        errorDetail = errJson.message;
      }
    } catch {
      errorDetail = res.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(payload: any) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  async register(payload: any) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/users/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<User>(res);
  },

  async createStaff(payload: any) {
    const res = await fetch(`${API_BASE}/users/staff`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<User>(res);
  },

  async listStaff() {
    const res = await fetch(`${API_BASE}/users/staff`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<User[]>(res);
  },

  // Customers
  async getMyCustomerProfile() {
    const res = await fetch(`${API_BASE}/customers/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Customer>(res);
  },

  async getCustomers() {

    const res = await fetch(`${API_BASE}/customers`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Customer[]>(res);
  },

  async getCustomer(id: string) {
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Customer>(res);
  },

  // Products
  async getProducts() {
    const res = await fetch(`${API_BASE}/products`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Product[]>(res);
  },

  async createProduct(payload: any) {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<Product>(res);
  },

  async createVariant(productId: string, payload: any) {
    const res = await fetch(`${API_BASE}/products/${productId}/variants`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<ProductVariant>(res);
  },

  // Plans
  async getPlans() {
    const res = await fetch(`${API_BASE}/plans`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Plan[]>(res);
  },

  async createPlan(payload: any) {
    const res = await fetch(`${API_BASE}/plans`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<Plan>(res);
  },

  // Taxes
  async getTaxes() {
    const res = await fetch(`${API_BASE}/taxes`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  // Quotations
  async getQuotations() {
    const res = await fetch(`${API_BASE}/quotations`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Quotation[]>(res);
  },

  async createQuotation(payload: any) {
    const res = await fetch(`${API_BASE}/quotations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<Quotation>(res);
  },

  async acceptQuotation(id: string) {
    const res = await fetch(`${API_BASE}/quotations/${id}/accept`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<Quotation>(res);
  },

  async convertQuotation(id: string, payload: any = {}) {
    const res = await fetch(`${API_BASE}/quotations/${id}/convert`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<Subscription>(res);
  },

  // Subscriptions
  async getSubscriptions() {
    const res = await fetch(`${API_BASE}/subscriptions`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Subscription[]>(res);
  },

  async pauseSubscription(id: string) {
    const res = await fetch(`${API_BASE}/subscriptions/${id}/pause`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<Subscription>(res);
  },

  async resumeSubscription(id: string) {
    const res = await fetch(`${API_BASE}/subscriptions/${id}/resume`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<Subscription>(res);
  },

  async closeSubscription(id: string, reason: string) {
    const res = await fetch(`${API_BASE}/subscriptions/${id}/close`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ closure_reason: reason }),
    });
    return handleResponse<Subscription>(res);
  },

  async renewSubscription(id: string) {
    const res = await fetch(`${API_BASE}/subscriptions/${id}/renew`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<Subscription>(res);
  },

  // Invoices
  async getInvoices() {
    const res = await fetch(`${API_BASE}/invoices`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Invoice[]>(res);
  },

  async triggerBillingRun(targetDate?: string) {
    const res = await fetch(`${API_BASE}/invoices/trigger-billing`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(targetDate ? { target_date: targetDate } : {}),
    });
    return handleResponse<any>(res);
  },

  // Discounts
  async getDiscounts() {
    const res = await fetch(`${API_BASE}/discounts`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Discount[]>(res);
  },

  async createDiscount(payload: any) {
    const res = await fetch(`${API_BASE}/discounts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<Discount>(res);
  },

  async validateDiscount(payload: any) {
    const res = await fetch(`${API_BASE}/discounts/validate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  // Payments
  async getPayments(invoiceId?: string) {
    const url = invoiceId ? `${API_BASE}/payments?invoice_id=${invoiceId}` : `${API_BASE}/payments`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Payment[]>(res);
  },

  async recordPayment(payload: any) {
    const res = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<Payment>(res);
  },

  // Dashboard & BI
  async getDashboardSummary() {
    const res = await fetch(`${API_BASE}/dashboard/summary`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<DashboardSummary>(res);
  },

  async getRevenueTrends(months: number = 6) {
    const res = await fetch(`${API_BASE}/dashboard/revenue-trends?months=${months}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<RevenueTrend[]>(res);
  },

  async getTopProducts() {
    const res = await fetch(`${API_BASE}/dashboard/top-products`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<TopProduct[]>(res);
  },

  async getUpcomingRenewals(days: number = 30) {
    const res = await fetch(`${API_BASE}/dashboard/renewals?days=${days}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<RenewalQueueItem[]>(res);
  },
};
