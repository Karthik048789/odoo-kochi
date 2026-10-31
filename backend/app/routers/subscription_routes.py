from datetime import date, datetime, timezone
from decimal import Decimal
from typing import List
from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Subscription, SubscriptionLine, User, Plan
from backend.app.schemas import (
    SubscriptionResponse, SubscriptionLineResponse, SubscriptionCloseRequest
)
from backend.app.auth import get_current_user, require_staff_or_admin

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

def map_subscription_to_response(sub: Subscription) -> SubscriptionResponse:
    lines = []
    for l in sub.lines:
        lines.append(SubscriptionLineResponse(
            id=l.id,
            product_id=l.product_id,
            product_name=l.product.name if l.product else None,
            variant_id=l.variant_id,
            variant_name=l.variant.variant_name if l.variant else None,
            quantity=l.quantity,
            unit_price=Decimal(str(l.unit_price)),
            tax_rate=Decimal(str(l.tax_rate)),
            line_total=Decimal(str(l.line_total))
        ))

    return SubscriptionResponse(
        id=sub.id,
        subscription_number=sub.subscription_number,
        customer_id=sub.customer_id,
        customer_name=sub.customer.company_name if sub.customer else None,
        plan_id=sub.plan_id,
        plan_name=sub.plan.name if sub.plan else None,
        quotation_id=sub.quotation_id,
        status=sub.status,
        start_date=sub.start_date,
        expiry_date=sub.expiry_date,
        next_billing_date=sub.next_billing_date,
        payment_terms=sub.payment_terms,
        paused_at=sub.paused_at,
        closed_at=sub.closed_at,
        closure_reason=sub.closure_reason,
        created_at=sub.created_at,
        lines=lines
    )

@router.get("", response_model=List[SubscriptionResponse])
def list_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role in ["ADMIN", "STAFF"]:
        subs = db.query(Subscription).order_by(Subscription.created_at.desc()).all()
    else:
        cust = current_user.customer
        if not cust:
            return []
        subs = db.query(Subscription).filter(Subscription.customer_id == cust.id).order_by(Subscription.created_at.desc()).all()

    return [map_subscription_to_response(s) for s in subs]

@router.get("/{sub_id}", response_model=SubscriptionResponse)
def get_subscription(
    sub_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found.")

    if current_user.role == "CUSTOMER":
        cust = current_user.customer
        if not cust or sub.customer_id != cust.id:
            raise HTTPException(status_code=403, detail="Access forbidden: You cannot view another customer's subscription.")

    return map_subscription_to_response(sub)

@router.post("/{sub_id}/pause", response_model=SubscriptionResponse)
def pause_subscription(
    sub_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found.")

    if sub.status != "ACTIVE":
        raise HTTPException(status_code=400, detail=f"Cannot pause subscription with status '{sub.status}'.")

    if not sub.plan.allow_pause:
        raise HTTPException(status_code=400, detail="The plan associated with this subscription does not allow pausing.")

    sub.status = "PAUSED"
    sub.paused_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(sub)
    return map_subscription_to_response(sub)

@router.post("/{sub_id}/resume", response_model=SubscriptionResponse)
def resume_subscription(
    sub_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found.")

    if sub.status != "PAUSED":
        raise HTTPException(status_code=400, detail="Only paused subscriptions can be resumed.")

    now = datetime.now(timezone.utc)
    # Calculate paused days and adjust expiry and next billing date
    if sub.paused_at:
        # Normalize paused_at to UTC-aware (SQLite can return naive datetimes)
        paused_at_utc = sub.paused_at if sub.paused_at.tzinfo else sub.paused_at.replace(tzinfo=timezone.utc)
        paused_days = (now - paused_at_utc).days
        if paused_days > 0:
            sub.expiry_date = sub.expiry_date + relativedelta(days=paused_days)
            sub.next_billing_date = sub.next_billing_date + relativedelta(days=paused_days)

    sub.status = "ACTIVE"
    sub.paused_at = None
    db.commit()
    db.refresh(sub)
    return map_subscription_to_response(sub)

@router.post("/{sub_id}/close", response_model=SubscriptionResponse)
def close_subscription(
    sub_id: str,
    payload: SubscriptionCloseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found.")

    if sub.status == "CLOSED":
        raise HTTPException(status_code=400, detail="Subscription is already closed.")

    if not sub.plan.allow_early_closure and current_user.role != "ADMIN":
        raise HTTPException(status_code=400, detail="Plan does not permit early closure.")

    sub.status = "CLOSED"
    sub.closed_at = datetime.now(timezone.utc)
    sub.closure_reason = payload.closure_reason
    db.commit()
    db.refresh(sub)
    return map_subscription_to_response(sub)

@router.post("/{sub_id}/renew", response_model=SubscriptionResponse)
def renew_subscription(
    sub_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found.")

    plan = sub.plan
    if plan.billing_frequency == "YEARLY":
        sub.expiry_date = sub.expiry_date + relativedelta(years=plan.billing_interval_count)
    else:
        sub.expiry_date = sub.expiry_date + relativedelta(months=plan.billing_interval_count)

    if sub.status == "CLOSED":
        sub.status = "ACTIVE"
        sub.closed_at = None

    db.commit()
    db.refresh(sub)
    return map_subscription_to_response(sub)
