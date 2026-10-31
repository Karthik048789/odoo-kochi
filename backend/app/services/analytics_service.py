from datetime import date, datetime, timedelta
from dateutil.relativedelta import relativedelta
from decimal import Decimal
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.models import (
    Subscription, SubscriptionLine, Invoice, InvoiceLine,
    Payment, Customer, Product, Plan
)
from backend.app.schemas import (
    DashboardSummaryResponse, RevenueTrendItem, TopProductItem, RenewalItem
)

def compute_mrr_for_subscription(sub: Subscription) -> Decimal:
    """
    Computes normalized monthly recurring revenue for an active subscription.
    """
    if sub.status != "ACTIVE":
        return Decimal("0.00")

    sub_total = Decimal("0.00")
    for line in sub.lines:
        line_val = (Decimal(str(line.unit_price)) * Decimal(line.quantity)).quantize(Decimal("0.01"))
        sub_total += line_val

    freq = sub.plan.billing_frequency if sub.plan else "MONTHLY"
    if freq == "MONTHLY":
        return sub_total
    elif freq == "YEARLY":
        return (sub_total / Decimal("12.00")).quantize(Decimal("0.01"))
    elif freq == "WEEKLY":
        return (sub_total * Decimal("52.00") / Decimal("12.00")).quantize(Decimal("0.01"))
    elif freq == "DAILY":
        return (sub_total * Decimal("30.00")).quantize(Decimal("0.01"))
    return sub_total

def get_dashboard_summary(db: Session, customer_id: str = None) -> DashboardSummaryResponse:
    """
    Calculates executive metrics: MRR, ARR, Billed Revenue, Cash Collected, Overdue.
    Optional customer_id filter for customer portal view.
    """
    today = date.today()

    sub_query = db.query(Subscription).filter(Subscription.status == "ACTIVE")
    inv_query = db.query(Invoice).filter(Invoice.status.in_(["CONFIRMED", "PAID"]))
    cust_query = db.query(Customer)
    pay_query = db.query(Payment)

    if customer_id:
        sub_query = sub_query.filter(Subscription.customer_id == customer_id)
        inv_query = inv_query.filter(Invoice.customer_id == customer_id)
        pay_query = pay_query.join(Invoice).filter(Invoice.customer_id == customer_id)

    active_subs = sub_query.all()
    invoices = inv_query.all()
    payments = pay_query.all()

    total_mrr = sum((compute_mrr_for_subscription(s) for s in active_subs), Decimal("0.00"))
    total_arr = (total_mrr * Decimal("12.00")).quantize(Decimal("0.01"))

    total_billed = sum((Decimal(str(inv.total_amount)) for inv in invoices), Decimal("0.00"))
    total_cash = sum((Decimal(str(p.amount)) for p in payments), Decimal("0.00"))

    total_outstanding = Decimal("0.00")
    total_overdue = Decimal("0.00")

    for inv in invoices:
        balance = Decimal(str(inv.total_amount)) - Decimal(str(inv.amount_paid))
        if balance > Decimal("0.00"):
            total_outstanding += balance
            if inv.due_date < today:
                total_overdue += balance

    return DashboardSummaryResponse(
        active_subscriptions=len(active_subs),
        mrr=total_mrr,
        arr=total_arr,
        billed_revenue=total_billed,
        cash_collected=total_cash,
        outstanding_balance=total_outstanding,
        overdue_amount=total_overdue,
        total_customers=cust_query.count(),
        total_invoices=len(invoices)
    )

def get_revenue_trends(db: Session, months: int = 6) -> List[RevenueTrendItem]:
    """
    Returns monthly billed revenue and cash collected for the past N months.
    """
    today = date.today()
    trend_map: Dict[str, Dict[str, Decimal]] = {}

    # Initialize last N months using calendar-aware relativedelta to avoid month drift
    current_month = today.replace(day=1)
    for i in range(months - 1, -1, -1):
        m_date = current_month - relativedelta(months=i)
        m_key = m_date.strftime("%b %Y")
        if m_key not in trend_map:
            trend_map[m_key] = {"billed": Decimal("0.00"), "collected": Decimal("0.00")}

    invoices = db.query(Invoice).filter(Invoice.status.in_(["CONFIRMED", "PAID"])).all()
    for inv in invoices:
        k = inv.invoice_date.strftime("%b %Y")
        if k in trend_map:
            trend_map[k]["billed"] += Decimal(str(inv.total_amount))

    payments = db.query(Payment).all()
    for pay in payments:
        k = pay.payment_date.strftime("%b %Y")
        if k in trend_map:
            trend_map[k]["collected"] += Decimal(str(pay.amount))

    result = []
    for k, v in trend_map.items():
        result.append(RevenueTrendItem(
            month=k,
            billed_revenue=v["billed"],
            cash_collected=v["collected"]
        ))
    return result

def get_top_products(db: Session, limit: int = 5) -> List[TopProductItem]:
    """
    Returns top performing products by quantity and revenue.
    """
    results = (
        db.query(
            Product.id,
            Product.name,
            func.coalesce(func.sum(InvoiceLine.quantity), 0).label("total_qty"),
            func.coalesce(func.sum(InvoiceLine.line_total), 0).label("total_rev")
        )
        .outerjoin(InvoiceLine, InvoiceLine.product_name_snapshot == Product.name)
        .group_by(Product.id, Product.name)
        .order_by(func.sum(InvoiceLine.line_total).desc())
        .limit(limit)
        .all()
    )

    items = []
    for r in results:
        items.append(TopProductItem(
            product_id=r[0],
            product_name=r[1],
            total_quantity=int(r[2] or 0),
            total_revenue=Decimal(str(r[3] or 0.00))
        ))
    return items

def get_upcoming_renewals(db: Session, days: int = 30) -> List[RenewalItem]:
    """
    Returns active subscriptions scheduled to expire or renew within N days.
    """
    today = date.today()
    threshold = today + timedelta(days=days)

    subs = db.query(Subscription).filter(
        Subscription.status == "ACTIVE",
        Subscription.expiry_date >= today,
        Subscription.expiry_date <= threshold
    ).order_by(Subscription.expiry_date.asc()).all()

    items = []
    for s in subs:
        val = sum((Decimal(str(l.unit_price)) * Decimal(l.quantity) for l in s.lines), Decimal("0.00"))
        days_rem = (s.expiry_date - today).days
        items.append(RenewalItem(
            subscription_id=s.id,
            subscription_number=s.subscription_number,
            customer_name=s.customer.company_name if s.customer else "Unknown",
            plan_name=s.plan.name if s.plan else "Standard",
            expiry_date=s.expiry_date,
            days_remaining=days_rem,
            annual_or_monthly_value=val
        ))
    return items
