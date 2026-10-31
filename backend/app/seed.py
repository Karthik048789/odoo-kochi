from datetime import datetime, timezone, date
from decimal import Decimal
from sqlalchemy.orm import Session
from dateutil.relativedelta import relativedelta

from backend.app.database import SessionLocal, Base, engine
from backend.app.models import (
    User, Customer, Product, ProductVariant, Plan, Tax, Discount,
    Quotation, QuotationLine, Subscription, SubscriptionLine,
    Invoice, InvoiceLine, Payment
)
from backend.app.auth import hash_password
from backend.app.services.billing_service import generate_invoice_for_subscription

def seed_database(db: Session):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    # Check if admin already exists
    existing_admin = db.query(User).filter(User.email == "admin@brightloop.com").first()
    if existing_admin:
        print("[SEED] Database already initialized with Brightloop scenario.")
        return

    print("[SEED] Seeding Brightloop Software demonstration environment...")

    # 1. Users
    admin = User(
        email="admin@brightloop.com",
        password_hash=hash_password("Brightloop#Admin2026"),
        first_name="Priya",
        last_name="Sharma",
        role="ADMIN",
        is_active=True
    )
    staff = User(
        email="staff@brightloop.com",
        password_hash=hash_password("Brightloop#Staff2026"),
        first_name="Rahul",
        last_name="Verma",
        role="STAFF",
        is_active=True
    )
    cust_user = User(
        email="amit@apexretail.com",
        password_hash=hash_password("ApexRetail#Strong2026"),
        first_name="Amit",
        last_name="Desai",
        role="CUSTOMER",
        is_active=True
    )
    db.add_all([admin, staff, cust_user])
    db.flush()

    # 2. Customer Profile
    customer = Customer(
        user_id=cust_user.id,
        company_name="Apex Retail Solutions Pvt Ltd",
        tax_identifier="29ABCDE1234F1Z5",
        phone_number="+91 98765 43210",
        billing_address="Plot 42, Brigade Road, Ashok Nagar",
        city="Bangalore",
        postal_code="560025",
        country="India"
    )
    db.add(customer)
    db.flush()

    # 3. Taxes
    gst18 = Tax(tax_name="GST 18%", rate_percentage=Decimal("18.00"), is_default=True, is_active=True)
    gst0 = Tax(tax_name="Zero Rated Export", rate_percentage=Decimal("0.00"), is_default=False, is_active=True)
    db.add_all([gst18, gst0])
    db.flush()

    # 4. Products & Variants (Exact prompt benchmark!)
    erp_core = Product(
        product_code="PROD-ERP-CORE",
        name="Brightloop ERP Core",
        product_type="SOFTWARE_LICENSE",
        sales_price=Decimal("1000.00"),
        cost_price=Decimal("600.00"),
        description="Core enterprise resource management engine with accounting, invoicing and inventory.",
        is_active=True
    )
    backup_add = Product(
        product_code="PROD-BACKUP-100",
        name="Cloud Automated Backup 100GB",
        product_type="SERVICE",
        sales_price=Decimal("1400.00"),
        cost_price=Decimal("400.00"),
        description="Daily snapshot encryption and offsite disaster recovery vault.",
        is_active=True
    )
    sla_support = Product(
        product_code="PROD-SUPPORT-SLA",
        name="24/7 Dedicated SLA Support",
        product_type="SERVICE",
        sales_price=Decimal("2500.00"),
        cost_price=Decimal("800.00"),
        description="Guaranteed 15-minute response time SLA and designated technical account manager.",
        is_active=True
    )
    db.add_all([erp_core, backup_add, sla_support])
    db.flush()

    # Product Variants (Prompt: Base ₹1,000; Odoo brand variant adds ₹560)
    var_odoo = ProductVariant(
        product_id=erp_core.id,
        variant_name="Odoo Brand Compatibility Edition",
        attribute_type="Brand",
        attribute_value="Odoo",
        additional_price=Decimal("560.00"),
        sku_suffix="-ODOO",
        is_active=True
    )
    var_std = ProductVariant(
        product_id=erp_core.id,
        variant_name="Standard Native Cloud Edition",
        attribute_type="Brand",
        attribute_value="Standard",
        additional_price=Decimal("0.00"),
        sku_suffix="-STD",
        is_active=True
    )
    db.add_all([var_odoo, var_std])
    db.flush()

    # 5. Plans
    plan_monthly = Plan(
        plan_code="PLAN-MONTHLY-STD",
        name="Monthly Standard Plan",
        billing_frequency="MONTHLY",
        billing_interval_count=1,
        min_quantity=1,
        valid_from=datetime.now(timezone.utc) - relativedelta(months=6),
        auto_close_at_expiry=False,
        allow_early_closure=True,
        allow_pause=True,
        auto_renew=True,
        is_active=True
    )
    plan_yearly = Plan(
        plan_code="PLAN-YEARLY-ENT",
        name="Annual Enterprise Commitment",
        billing_frequency="YEARLY",
        billing_interval_count=1,
        min_quantity=5,
        valid_from=datetime.now(timezone.utc) - relativedelta(months=6),
        auto_close_at_expiry=False,
        allow_early_closure=True,
        allow_pause=True,
        auto_renew=True,
        is_active=True
    )
    db.add_all([plan_monthly, plan_yearly])
    db.flush()

    # 6. Discounts
    disc_diwali = Discount(
        code="DIWALI10",
        discount_type="PERCENTAGE",
        amount_value=Decimal("10.00"),
        scope="SUBSCRIPTION_LEVEL",
        min_subtotal=Decimal("5000.00"),
        min_quantity=1,
        valid_from=datetime.now(timezone.utc) - relativedelta(days=30),
        valid_until=datetime.now(timezone.utc) + relativedelta(days=365),
        max_uses=100,
        used_count=1,
        is_active=True
    )
    disc_fixed = Discount(
        code="STARTUP500",
        discount_type="FIXED_AMOUNT",
        amount_value=Decimal("500.00"),
        scope="SUBSCRIPTION_LEVEL",
        min_subtotal=Decimal("2000.00"),
        min_quantity=1,
        valid_from=datetime.now(timezone.utc) - relativedelta(days=30),
        valid_until=datetime.now(timezone.utc) + relativedelta(days=365),
        max_uses=50,
        used_count=0,
        is_active=True
    )
    db.add_all([disc_diwali, disc_fixed])
    db.flush()

    # 7. Initial Active Subscription for Apex Retail (10 seats of ERP Core + Odoo variant @ ₹1,560)
    today = date.today()
    sub1 = Subscription(
        subscription_number="SUB-2026-00001",
        customer_id=customer.id,
        plan_id=plan_monthly.id,
        status="ACTIVE",
        start_date=today - relativedelta(months=1),
        expiry_date=today + relativedelta(months=11),
        next_billing_date=today,
        payment_terms="NET_15"
    )
    db.add(sub1)
    db.flush()

    sub1_line = SubscriptionLine(
        subscription_id=sub1.id,
        product_id=erp_core.id,
        variant_id=var_odoo.id,
        quantity=10,
        unit_price=Decimal("1560.00"),  # 1000 + 560
        tax_id=gst18.id,
        tax_rate=Decimal("18.00"),
        line_total=Decimal("18408.00")  # (1560 * 10) * 1.18
    )
    db.add(sub1_line)
    db.flush()

    # Generate initial invoice for demonstration
    generate_invoice_for_subscription(db, sub1, today - relativedelta(months=1))
    db.commit()

    # Record partial payment on the generated invoice
    inv = db.query(Invoice).filter(Invoice.subscription_id == sub1.id).first()
    if inv:
        payment1 = Payment(
            payment_number="PAY-2026-00001",
            invoice_id=inv.id,
            payment_method="BANK_TRANSFER",
            amount=Decimal("10000.00"),
            payment_date=today - relativedelta(days=10),
            reference_number="AXIS202610210088",
            notes="Partial advance wire transfer via Axis Bank NEFT",
            recorded_by_user_id=staff.id
        )
        db.add(payment1)
        inv.amount_paid = Decimal("10000.00")
        inv.status = "CONFIRMED"  # Partially paid
        db.commit()

    print("[SEED] Seeding completed successfully.")

if __name__ == "__main__":
    db = SessionLocal()
    seed_database(db)
    db.close()
