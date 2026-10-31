import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Optional, Tuple
from dateutil.relativedelta import relativedelta
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from backend.app.models import (
    Subscription, SubscriptionLine, Invoice, InvoiceLine,
    Customer, Plan, BillingJob, EmailLog, AuditLog
)
from backend.app.services.pdf_service import generate_invoice_pdf

def calculate_next_cycle_dates(start_date: date, frequency: str, interval: int = 1) -> Tuple[date, date]:
    """
    Computes (cycle_start, cycle_end) and next billing date with calendar-aware clamping.
    """
    cycle_start = start_date
    if frequency == "DAILY":
        cycle_end = cycle_start + relativedelta(days=interval)
    elif frequency == "WEEKLY":
        cycle_end = cycle_start + relativedelta(weeks=interval)
    elif frequency == "MONTHLY":
        cycle_end = cycle_start + relativedelta(months=interval)
    elif frequency == "YEARLY":
        cycle_end = cycle_start + relativedelta(years=interval)
    else:
        cycle_end = cycle_start + relativedelta(months=1)
    
    return cycle_start, cycle_end

def generate_invoice_number(db: Session) -> str:
    year = datetime.now().year
    prefix = f"INV-{year}-"
    # Find max invoice number for this year
    last_inv = db.query(Invoice).filter(Invoice.invoice_number.like(f"{prefix}%"))\
                 .order_by(Invoice.invoice_number.desc()).first()
    if last_inv:
        try:
            last_seq = int(last_inv.invoice_number.split("-")[-1])
            new_seq = last_seq + 1
        except ValueError:
            new_seq = 1
    else:
        new_seq = 1
    return f"{prefix}{new_seq:05d}"

def generate_invoice_for_subscription(
    db: Session,
    subscription: Subscription,
    billing_date: Optional[date] = None
) -> Tuple[Optional[Invoice], bool, str]:
    """
    Generates an invoice for an active subscription cycle.
    Enforces idempotency and database unique constraints.
    Returns: (invoice, created_flag, message)
    """
    if subscription.status != "ACTIVE":
        return None, False, f"Subscription is in status '{subscription.status}', cannot generate invoice."

    eff_date = billing_date or subscription.next_billing_date
    plan = subscription.plan

    cycle_start, cycle_end = calculate_next_cycle_dates(
        subscription.next_billing_date,
        plan.billing_frequency,
        plan.billing_interval_count
    )

    # Idempotency check: see if invoice already exists for this exact subscription and cycle
    existing = db.query(Invoice).filter(
        Invoice.subscription_id == subscription.id,
        Invoice.billing_cycle_start == cycle_start,
        Invoice.billing_cycle_end == cycle_end
    ).first()

    if existing:
        return existing, False, "Idempotency hit: Invoice already exists for this cycle."

    # Compute due date based on payment terms
    due_days = 0
    if subscription.payment_terms == "NET_15":
        due_days = 15
    elif subscription.payment_terms == "NET_30":
        due_days = 30
    due_date = eff_date + relativedelta(days=due_days)

    invoice_num = generate_invoice_number(db)

    # Calculate line totals
    subtotal = Decimal("0.00")
    tax_total = Decimal("0.00")

    invoice_lines_data = []
    for s_line in subscription.lines:
        line_sub = (Decimal(str(s_line.unit_price)) * Decimal(s_line.quantity)).quantize(Decimal("0.01"))
        tax_amt = (line_sub * Decimal(str(s_line.tax_rate)) / Decimal("100.00")).quantize(Decimal("0.01"))
        line_tot = line_sub + tax_amt

        subtotal += line_sub
        tax_total += tax_amt

        variant_name = s_line.variant.variant_name if s_line.variant else None

        invoice_lines_data.append({
            "product_name": s_line.product.name,
            "variant_name": variant_name,
            "quantity": s_line.quantity,
            "unit_price": Decimal(str(s_line.unit_price)),
            "tax_rate": Decimal(str(s_line.tax_rate)),
            "tax_amount": tax_amt,
            "line_total": line_tot
        })

    discount_total = Decimal("0.00")
    total_amount = subtotal - discount_total + tax_total

    new_invoice = Invoice(
        invoice_number=invoice_num,
        subscription_id=subscription.id,
        customer_id=subscription.customer_id,
        billing_cycle_start=cycle_start,
        billing_cycle_end=cycle_end,
        invoice_date=eff_date,
        due_date=due_date,
        status="CONFIRMED",
        subtotal=subtotal,
        discount_total=discount_total,
        tax_total=tax_total,
        total_amount=total_amount,
        amount_paid=Decimal("0.00"),
        pdf_url=None
    )
    db.add(new_invoice)
    db.flush()

    # Create snapshot lines
    created_lines = []
    for ld in invoice_lines_data:
        inv_line = InvoiceLine(
            invoice_id=new_invoice.id,
            product_name_snapshot=ld["product_name"],
            variant_name_snapshot=ld["variant_name"],
            quantity=ld["quantity"],
            unit_price=ld["unit_price"],
            tax_rate=ld["tax_rate"],
            tax_amount=ld["tax_amount"],
            line_total=ld["line_total"]
        )
        db.add(inv_line)
        created_lines.append(inv_line)

    # Generate PDF
    try:
        pdf_path = generate_invoice_pdf(new_invoice, subscription.customer, created_lines)
        new_invoice.pdf_url = pdf_path
    except Exception as e:
        new_invoice.pdf_url = None

    # Advance next billing date
    subscription.next_billing_date = cycle_end

    # Check auto-renewal or auto-closure
    if cycle_end >= subscription.expiry_date:
        if plan.auto_renew:
            # Renew for another period
            if plan.billing_frequency == "YEARLY":
                subscription.expiry_date = subscription.expiry_date + relativedelta(years=1)
            else:
                subscription.expiry_date = subscription.expiry_date + relativedelta(months=1)
        elif plan.auto_close_at_expiry:
            subscription.status = "CLOSED"
            subscription.closed_at = datetime.now(timezone.utc)
            subscription.closure_reason = "Plan expired (auto_close_at_expiry)"

    # Log dispatch
    customer_user = subscription.customer.user
    if customer_user:
        email_log = EmailLog(
            recipient_email=customer_user.email,
            subject=f"New Invoice Generated: {invoice_num}",
            email_type="INVOICE_SENT",
            status="SENT"
        )
        db.add(email_log)

    return new_invoice, True, "Invoice created successfully"

def run_scheduled_billing(db: Session, target_date: Optional[date] = None) -> BillingJob:
    """
    Executes automated billing for all eligible subscriptions due on or before target_date.
    """
    eff_date = target_date or date.today()
    job = BillingJob(
        job_run_date=eff_date,
        status="STARTED",
        subscriptions_processed=0,
        invoices_created=0
    )
    db.add(job)
    db.commit()

    try:
        # Fetch active subscriptions due for billing
        due_subs = db.query(Subscription).filter(
            Subscription.status == "ACTIVE",
            Subscription.next_billing_date <= eff_date
        ).all()

        job.subscriptions_processed = len(due_subs)

        for sub in due_subs:
            try:
                inv, created, msg = generate_invoice_for_subscription(db, sub, eff_date)
                if created:
                    job.invoices_created += 1
                db.commit()
            except IntegrityError:
                db.rollback()
                # Skip duplicate conflict silently
                continue
            except Exception as item_err:
                db.rollback()
                job.error_log = (job.error_log or "") + f"\nError on sub {sub.subscription_number}: {str(item_err)}"

        job.status = "COMPLETED"
        job.finished_at = datetime.now(timezone.utc)
        db.commit()
    except Exception as e:
        db.rollback()
        job.status = "FAILED"
        job.error_log = str(e)
        job.finished_at = datetime.now(timezone.utc)
        db.commit()

    return job
