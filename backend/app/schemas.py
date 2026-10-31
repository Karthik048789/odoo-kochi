from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# Base & Pagination
class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    size: int
    total_pages: int

# Auth Schemas
class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    company_name: str
    phone_number: str
    tax_identifier: Optional[str] = None
    billing_address: str
    city: str
    postal_code: str
    country: str = "India"

class StaffCreateRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str = "STAFF"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    email: str
    full_name: str
    customer_id: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    is_active: bool
    created_at: datetime
    customer_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# Customer Schemas
class CustomerResponse(BaseModel):
    id: str
    user_id: str
    company_name: str
    tax_identifier: Optional[str]
    phone_number: str
    billing_address: str
    city: str
    postal_code: str
    country: str
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class CustomerUpdateRequest(BaseModel):
    company_name: Optional[str] = None
    tax_identifier: Optional[str] = None
    phone_number: Optional[str] = None
    billing_address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None

# Product & Variant Schemas
class VariantCreateRequest(BaseModel):
    variant_name: str
    attribute_type: str
    attribute_value: str
    additional_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    sku_suffix: str

class VariantResponse(BaseModel):
    id: str
    product_id: str
    variant_name: str
    attribute_type: str
    attribute_value: str
    additional_price: Decimal
    sku_suffix: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class ProductCreateRequest(BaseModel):
    product_code: str
    name: str
    product_type: str = "SOFTWARE_LICENSE"  # SERVICE, SOFTWARE_LICENSE, CONSUMABLE
    sales_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    cost_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    description: Optional[str] = None

class ProductUpdateRequest(BaseModel):
    name: Optional[str] = None
    sales_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class ProductResponse(BaseModel):
    id: str
    product_code: str
    name: str
    product_type: str
    sales_price: Decimal
    cost_price: Decimal
    description: Optional[str]
    is_active: bool
    created_at: datetime
    variants: List[VariantResponse] = []

    model_config = ConfigDict(from_attributes=True)

# Plan Schemas
class PlanCreateRequest(BaseModel):
    plan_code: str
    name: str
    billing_frequency: str  # DAILY, WEEKLY, MONTHLY, YEARLY
    billing_interval_count: int = 1
    min_quantity: int = 1
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    auto_close_at_expiry: bool = True
    allow_early_closure: bool = True
    allow_pause: bool = True
    auto_renew: bool = True

class PlanUpdateRequest(BaseModel):
    name: Optional[str] = None
    billing_frequency: Optional[str] = None
    min_quantity: Optional[int] = None
    auto_close_at_expiry: Optional[bool] = None
    allow_early_closure: Optional[bool] = None
    allow_pause: Optional[bool] = None
    auto_renew: Optional[bool] = None
    is_active: Optional[bool] = None

class PlanResponse(BaseModel):
    id: str
    plan_code: str
    name: str
    billing_frequency: str
    billing_interval_count: int
    min_quantity: int
    valid_from: datetime
    valid_until: Optional[datetime]
    auto_close_at_expiry: bool
    allow_early_closure: bool
    allow_pause: bool
    auto_renew: bool
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

# Tax Schemas
class TaxCreateRequest(BaseModel):
    tax_name: str
    rate_percentage: Decimal = Field(default=Decimal("18.00"), ge=0, le=100)
    is_default: bool = False

class TaxResponse(BaseModel):
    id: str
    tax_name: str
    rate_percentage: Decimal
    is_default: bool
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

# Quotation Schemas
class QuotationLineInput(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    quantity: int = Field(default=1, ge=1)
    tax_id: Optional[str] = None

class QuotationCreateRequest(BaseModel):
    customer_id: str
    plan_id: str
    validity_days: int = 15
    discount_code: Optional[str] = None
    lines: List[QuotationLineInput]

class QuotationLineResponse(BaseModel):
    id: str
    product_id: str
    product_name: Optional[str] = None
    variant_id: Optional[str] = None
    variant_name: Optional[str] = None
    quantity: int
    base_unit_price: Decimal
    variant_extra_price: Decimal
    final_unit_price: Decimal
    tax_id: Optional[str]
    tax_rate: Decimal
    line_subtotal: Decimal
    line_total: Decimal

    model_config = ConfigDict(from_attributes=True)

class QuotationResponse(BaseModel):
    id: str
    quotation_number: str
    customer_id: str
    customer_name: Optional[str] = None
    plan_id: str
    plan_name: Optional[str] = None
    status: str
    valid_until: date
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    created_at: datetime
    lines: List[QuotationLineResponse] = []

    model_config = ConfigDict(from_attributes=True)

class QuotationConvertRequest(BaseModel):
    start_date: Optional[date] = None
    payment_terms: str = "NET_15"

# Subscription Schemas
class SubscriptionLineResponse(BaseModel):
    id: str
    product_id: str
    product_name: Optional[str] = None
    variant_id: Optional[str] = None
    variant_name: Optional[str] = None
    quantity: int
    unit_price: Decimal
    tax_rate: Decimal
    line_total: Decimal

    model_config = ConfigDict(from_attributes=True)

class SubscriptionResponse(BaseModel):
    id: str
    subscription_number: str
    customer_id: str
    customer_name: Optional[str] = None
    plan_id: str
    plan_name: Optional[str] = None
    quotation_id: Optional[str] = None
    status: str
    start_date: date
    expiry_date: date
    next_billing_date: date
    payment_terms: str
    paused_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    closure_reason: Optional[str] = None
    created_at: datetime
    lines: List[SubscriptionLineResponse] = []

    model_config = ConfigDict(from_attributes=True)

class SubscriptionCloseRequest(BaseModel):
    closure_reason: str

# Invoice Schemas
class InvoiceLineResponse(BaseModel):
    id: str
    product_name_snapshot: str
    variant_name_snapshot: Optional[str]
    quantity: int
    unit_price: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    line_total: Decimal

    model_config = ConfigDict(from_attributes=True)

class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    subscription_id: str
    subscription_number: Optional[str] = None
    customer_id: str
    customer_name: Optional[str] = None
    billing_cycle_start: date
    billing_cycle_end: date
    invoice_date: date
    due_date: date
    status: str
    subtotal: Decimal
    discount_total: Decimal
    tax_total: Decimal
    total_amount: Decimal
    amount_paid: Decimal
    outstanding_balance: Optional[Decimal] = None
    pdf_url: Optional[str]
    created_at: datetime
    lines: List[InvoiceLineResponse] = []

    model_config = ConfigDict(from_attributes=True)

class BillingRunRequest(BaseModel):
    target_date: Optional[date] = None

class BillingRunResponse(BaseModel):
    job_id: str
    job_run_date: date
    status: str
    subscriptions_processed: int
    invoices_created: int
    message: str

# Discount Schemas
class DiscountCreateRequest(BaseModel):
    code: str
    discount_type: str  # PERCENTAGE, FIXED_AMOUNT
    amount_value: Decimal = Field(gt=0)
    scope: str = "SUBSCRIPTION_LEVEL"  # SUBSCRIPTION_LEVEL, PRODUCT_SPECIFIC
    min_subtotal: Decimal = Decimal("0.00")
    min_quantity: int = 1
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    max_uses: Optional[int] = None
    product_ids: Optional[List[str]] = []

class DiscountResponse(BaseModel):
    id: str
    code: str
    discount_type: str
    amount_value: Decimal
    scope: str
    min_subtotal: Decimal
    min_quantity: int
    valid_from: datetime
    valid_until: datetime
    max_uses: Optional[int]
    used_count: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class DiscountValidateRequest(BaseModel):
    code: str
    subtotal: Decimal
    total_quantity: int = 1
    product_ids: List[str] = []

class DiscountValidateResponse(BaseModel):
    valid: bool
    discount_amount: Decimal
    message: str

# Payment Schemas
class PaymentCreateRequest(BaseModel):
    invoice_id: str
    payment_method: str  # BANK_TRANSFER, UPI, CREDIT_CARD, DEBIT_CARD, CASH, CHEQUE
    amount: Decimal = Field(gt=0)
    payment_date: Optional[date] = None
    reference_number: str
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    id: str
    payment_number: str
    invoice_id: str
    invoice_number: Optional[str] = None
    payment_method: str
    amount: Decimal
    payment_date: date
    reference_number: str
    notes: Optional[str]
    recorded_by_user_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Dashboard & Analytics Schemas
class DashboardSummaryResponse(BaseModel):
    active_subscriptions: int
    mrr: Decimal
    arr: Decimal
    billed_revenue: Decimal
    cash_collected: Decimal
    outstanding_balance: Decimal
    overdue_amount: Decimal
    total_customers: int
    total_invoices: int

class RevenueTrendItem(BaseModel):
    month: str
    billed_revenue: Decimal
    cash_collected: Decimal

class TopProductItem(BaseModel):
    product_id: str
    product_name: str
    total_quantity: int
    total_revenue: Decimal

class RenewalItem(BaseModel):
    subscription_id: str
    subscription_number: str
    customer_name: str
    plan_name: str
    expiry_date: date
    days_remaining: int
    annual_or_monthly_value: Decimal
