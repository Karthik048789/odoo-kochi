import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, Numeric, Integer, Date, DateTime, 
    Text, ForeignKey, UniqueConstraint, CheckConstraint, JSON
)
from sqlalchemy.orm import relationship
from backend.app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False, default="CUSTOMER")  # ADMIN, STAFF, CUSTOMER
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now)

    customer = relationship("Customer", back_populates="user", uselist=False, cascade="all, delete-orphan")
    created_quotations = relationship("Quotation", back_populates="created_by_staff")
    recorded_payments = relationship("Payment", back_populates="recorded_by_user")
    audit_logs = relationship("AuditLog", back_populates="user")
    reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    company_name = Column(String(255), nullable=False, index=True)
    tax_identifier = Column(String(50), nullable=True)  # GSTIN
    phone_number = Column(String(30), nullable=False)
    billing_address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    country = Column(String(100), nullable=False, default="India")
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    user = relationship("User", back_populates="customer")
    quotations = relationship("Quotation", back_populates="customer", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="customer", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="customer", cascade="all, delete-orphan")


class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    product_type = Column(String(30), nullable=False, default="SOFTWARE_LICENSE")  # SERVICE, SOFTWARE_LICENSE, CONSUMABLE
    sales_price = Column(Numeric(12, 2), nullable=False, default=0.0)
    cost_price = Column(Numeric(12, 2), nullable=False, default=0.0)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    discount_associations = relationship("DiscountProduct", back_populates="product", cascade="all, delete-orphan")


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    variant_name = Column(String(100), nullable=False)
    attribute_type = Column(String(50), nullable=False)  # e.g., Brand, Region, Tier
    attribute_value = Column(String(100), nullable=False)  # e.g., Odoo, APAC, Enterprise
    additional_price = Column(Numeric(12, 2), nullable=False, default=0.0)
    sku_suffix = Column(String(50), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

    __table_args__ = (
        UniqueConstraint("product_id", "attribute_type", "attribute_value", name="uq_product_variant_attribute"),
    )

    product = relationship("Product", back_populates="variants")


class Plan(Base):
    __tablename__ = "plans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    plan_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    billing_frequency = Column(String(20), nullable=False)  # DAILY, WEEKLY, MONTHLY, YEARLY
    billing_interval_count = Column(Integer, nullable=False, default=1)
    min_quantity = Column(Integer, nullable=False, default=1)
    valid_from = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    valid_until = Column(DateTime(timezone=True), nullable=True)
    auto_close_at_expiry = Column(Boolean, nullable=False, default=True)
    allow_early_closure = Column(Boolean, nullable=False, default=True)
    allow_pause = Column(Boolean, nullable=False, default=True)
    auto_renew = Column(Boolean, nullable=False, default=True)
    is_active = Column(Boolean, nullable=False, default=True)

    subscriptions = relationship("Subscription", back_populates="plan")
    quotations = relationship("Quotation", back_populates="plan")


class Tax(Base):
    __tablename__ = "taxes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tax_name = Column(String(100), nullable=False)
    rate_percentage = Column(Numeric(5, 2), nullable=False, default=18.0)
    is_default = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)


class QuotationTemplate(Base):
    __tablename__ = "quotation_templates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    default_validity_days = Column(Integer, nullable=False, default=15)
    plan_id = Column(String(36), ForeignKey("plans.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    plan = relationship("Plan")
    lines = relationship("QuotationTemplateLine", back_populates="template", cascade="all, delete-orphan")


class QuotationTemplateLine(Base):
    __tablename__ = "quotation_template_lines"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    template_id = Column(String(36), ForeignKey("quotation_templates.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    variant_id = Column(String(36), ForeignKey("product_variants.id"), nullable=True)
    default_quantity = Column(Integer, nullable=False, default=1)

    template = relationship("QuotationTemplate", back_populates="lines")
    product = relationship("Product")
    variant = relationship("ProductVariant")


class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    quotation_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(String(36), ForeignKey("plans.id"), nullable=False)
    status = Column(String(30), nullable=False, default="DRAFT")  # DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED
    valid_until = Column(Date, nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False, default=0.0)
    discount_amount = Column(Numeric(12, 2), nullable=False, default=0.0)
    tax_amount = Column(Numeric(12, 2), nullable=False, default=0.0)
    total_amount = Column(Numeric(12, 2), nullable=False, default=0.0)
    created_by_staff_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    customer = relationship("Customer", back_populates="quotations")
    plan = relationship("Plan", back_populates="quotations")
    created_by_staff = relationship("User", back_populates="created_quotations")
    lines = relationship("QuotationLine", back_populates="quotation", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="quotation", uselist=False)


class QuotationLine(Base):
    __tablename__ = "quotation_lines"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    quotation_id = Column(String(36), ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    variant_id = Column(String(36), ForeignKey("product_variants.id"), nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    base_unit_price = Column(Numeric(12, 2), nullable=False, default=0.0)
    variant_extra_price = Column(Numeric(12, 2), nullable=False, default=0.0)
    final_unit_price = Column(Numeric(12, 2), nullable=False, default=0.0)
    tax_id = Column(String(36), ForeignKey("taxes.id"), nullable=True)
    tax_rate = Column(Numeric(5, 2), nullable=False, default=0.0)
    line_subtotal = Column(Numeric(12, 2), nullable=False, default=0.0)
    line_total = Column(Numeric(12, 2), nullable=False, default=0.0)

    quotation = relationship("Quotation", back_populates="lines")
    product = relationship("Product")
    variant = relationship("ProductVariant")
    tax = relationship("Tax")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subscription_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(String(36), ForeignKey("plans.id"), nullable=False)
    quotation_id = Column(String(36), ForeignKey("quotations.id"), nullable=True)
    status = Column(String(30), nullable=False, default="ACTIVE")  # DRAFT, QUOTATION, CONFIRMED, ACTIVE, PAUSED, CLOSED
    start_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    next_billing_date = Column(Date, nullable=False, index=True)
    payment_terms = Column(String(30), nullable=False, default="NET_15")  # IMMEDIATE, NET_15, NET_30
    paused_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    closure_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    customer = relationship("Customer", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")
    quotation = relationship("Quotation", back_populates="subscription")
    lines = relationship("SubscriptionLine", back_populates="subscription", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="subscription", cascade="all, delete-orphan")


class SubscriptionLine(Base):
    __tablename__ = "subscription_lines"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subscription_id = Column(String(36), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    variant_id = Column(String(36), ForeignKey("product_variants.id"), nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(12, 2), nullable=False, default=0.0)
    tax_id = Column(String(36), ForeignKey("taxes.id"), nullable=True)
    tax_rate = Column(Numeric(5, 2), nullable=False, default=0.0)
    line_total = Column(Numeric(12, 2), nullable=False, default=0.0)

    subscription = relationship("Subscription", back_populates="lines")
    product = relationship("Product")
    variant = relationship("ProductVariant")
    tax = relationship("Tax")


class Discount(Base):
    __tablename__ = "discounts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, nullable=False, index=True)
    discount_type = Column(String(20), nullable=False)  # PERCENTAGE, FIXED_AMOUNT
    amount_value = Column(Numeric(12, 2), nullable=False)
    scope = Column(String(30), nullable=False)  # SUBSCRIPTION_LEVEL, PRODUCT_SPECIFIC
    min_subtotal = Column(Numeric(12, 2), nullable=False, default=0.0)
    min_quantity = Column(Integer, nullable=False, default=1)
    valid_from = Column(DateTime(timezone=True), nullable=False)
    valid_until = Column(DateTime(timezone=True), nullable=False)
    max_uses = Column(Integer, nullable=True)
    used_count = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)

    product_associations = relationship("DiscountProduct", back_populates="discount", cascade="all, delete-orphan")
    applications = relationship("DiscountApplication", back_populates="discount")


class DiscountProduct(Base):
    __tablename__ = "discount_products"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    discount_id = Column(String(36), ForeignKey("discounts.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        UniqueConstraint("discount_id", "product_id", name="uq_discount_product"),
    )

    discount = relationship("Discount", back_populates="product_associations")
    product = relationship("Product", back_populates="discount_associations")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)
    subscription_id = Column(String(36), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    billing_cycle_start = Column(Date, nullable=False)
    billing_cycle_end = Column(Date, nullable=False)
    invoice_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False, index=True)
    status = Column(String(30), nullable=False, default="CONFIRMED")  # DRAFT, CONFIRMED, PAID, CANCELLED
    subtotal = Column(Numeric(12, 2), nullable=False, default=0.0)
    discount_total = Column(Numeric(12, 2), nullable=False, default=0.0)
    tax_total = Column(Numeric(12, 2), nullable=False, default=0.0)
    total_amount = Column(Numeric(12, 2), nullable=False, default=0.0)
    amount_paid = Column(Numeric(12, 2), nullable=False, default=0.0)
    pdf_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    __table_args__ = (
        UniqueConstraint("subscription_id", "billing_cycle_start", "billing_cycle_end", name="uq_sub_billing_cycle"),
    )

    subscription = relationship("Subscription", back_populates="invoices")
    customer = relationship("Customer", back_populates="invoices")
    lines = relationship("InvoiceLine", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")
    discount_applications = relationship("DiscountApplication", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceLine(Base):
    __tablename__ = "invoice_lines"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    product_name_snapshot = Column(String(255), nullable=False)
    variant_name_snapshot = Column(String(100), nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(12, 2), nullable=False, default=0.0)
    tax_rate = Column(Numeric(5, 2), nullable=False, default=0.0)
    tax_amount = Column(Numeric(12, 2), nullable=False, default=0.0)
    line_total = Column(Numeric(12, 2), nullable=False, default=0.0)

    invoice = relationship("Invoice", back_populates="lines")


class DiscountApplication(Base):
    __tablename__ = "discount_applications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    discount_id = Column(String(36), ForeignKey("discounts.id"), nullable=False)
    applied_discount_code = Column(String(50), nullable=False)
    deducted_amount = Column(Numeric(12, 2), nullable=False)

    invoice = relationship("Invoice", back_populates="discount_applications")
    discount = relationship("Discount", back_populates="applications")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    payment_number = Column(String(50), unique=True, nullable=False, index=True)
    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    payment_method = Column(String(30), nullable=False)  # BANK_TRANSFER, UPI, CREDIT_CARD, DEBIT_CARD, CASH, CHEQUE
    amount = Column(Numeric(12, 2), nullable=False)
    payment_date = Column(Date, nullable=False)
    reference_number = Column(String(100), nullable=False)
    notes = Column(Text, nullable=True)
    recorded_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    invoice = relationship("Invoice", back_populates="payments")
    recorded_by_user = relationship("User", back_populates="recorded_payments")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_name = Column(String(50), nullable=False)
    entity_id = Column(String(36), nullable=False)
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    user = relationship("User", back_populates="audit_logs")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, nullable=False, default=False)

    user = relationship("User", back_populates="reset_tokens")


class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    recipient_email = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    email_type = Column(String(50), nullable=False)  # INVOICE_SENT, PASSWORD_RESET, QUOTE_SENT
    status = Column(String(20), nullable=False, default="SENT")
    dispatched_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)


class BillingJob(Base):
    __tablename__ = "billing_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_run_date = Column(Date, nullable=False)
    status = Column(String(30), nullable=False)  # STARTED, COMPLETED, FAILED
    subscriptions_processed = Column(Integer, nullable=False, default=0)
    invoices_created = Column(Integer, nullable=False, default=0)
    error_log = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    finished_at = Column(DateTime(timezone=True), nullable=True)
