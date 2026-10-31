from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import List
from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import (
    Quotation, QuotationLine, Customer, Plan, Product, ProductVariant,
    Tax, Subscription, SubscriptionLine, User
)
from backend.app.schemas import (
    QuotationCreateRequest, QuotationResponse, QuotationLineResponse,
    QuotationConvertRequest, SubscriptionResponse, SubscriptionLineResponse
)
from backend.app.auth import get_current_user, require_staff_or_admin
from backend.app.services.discount_service import evaluate_discount

router = APIRouter(prefix="/quotations", tags=["Quotations"])

def generate_quotation_number(db: Session) -> str:
    year = datetime.now().year
    prefix = f"QT-{year}-"
    last_q = db.query(Quotation).filter(Quotation.quotation_number.like(f"{prefix}%"))\
               .order_by(Quotation.quotation_number.desc()).first()
    if last_q:
        try:
            seq = int(last_q.quotation_number.split("-")[-1]) + 1
        except ValueError:
            seq = 1
    else:
        seq = 1
    return f"{prefix}{seq:05d}"

def generate_subscription_number(db: Session) -> str:
    year = datetime.now().year
    prefix = f"SUB-{year}-"
    last_s = db.query(Subscription).filter(Subscription.subscription_number.like(f"{prefix}%"))\
               .order_by(Subscription.subscription_number.desc()).first()
    if last_s:
        try:
            seq = int(last_s.subscription_number.split("-")[-1]) + 1
        except ValueError:
            seq = 1
    else:
        seq = 1
    return f"{prefix}{seq:05d}"

def map_quotation_to_response(q: Quotation) -> QuotationResponse:
    lines_resp = []
    for l in q.lines:
        lines_resp.append(QuotationLineResponse(
            id=l.id,
            product_id=l.product_id,
            product_name=l.product.name if l.product else None,
            variant_id=l.variant_id,
            variant_name=l.variant.variant_name if l.variant else None,
            quantity=l.quantity,
            base_unit_price=Decimal(str(l.base_unit_price)),
            variant_extra_price=Decimal(str(l.variant_extra_price)),
            final_unit_price=Decimal(str(l.final_unit_price)),
            tax_id=l.tax_id,
            tax_rate=Decimal(str(l.tax_rate)),
            line_subtotal=Decimal(str(l.line_subtotal)),
            line_total=Decimal(str(l.line_total))
        ))

    return QuotationResponse(
        id=q.id,
        quotation_number=q.quotation_number,
        customer_id=q.customer_id,
        customer_name=q.customer.company_name if q.customer else None,
        plan_id=q.plan_id,
        plan_name=q.plan.name if q.plan else None,
        status=q.status,
        valid_until=q.valid_until,
        subtotal=Decimal(str(q.subtotal)),
        discount_amount=Decimal(str(q.discount_amount)),
        tax_amount=Decimal(str(q.tax_amount)),
        total_amount=Decimal(str(q.total_amount)),
        created_at=q.created_at,
        lines=lines_resp
    )

@router.post("", response_model=QuotationResponse, status_code=status.HTTP_201_CREATED)
def create_quotation(
    payload: QuotationCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    plan = db.query(Plan).filter(Plan.id == payload.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")

    valid_until = date.today() + timedelta(days=payload.validity_days)
    q_num = generate_quotation_number(db)

    # Calculate lines
    subtotal = Decimal("0.00")
    tax_total = Decimal("0.00")
    total_qty = 0
    calculated_lines = []

    for item in payload.lines:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=400, detail=f"Product with id {item.product_id} not found.")

        base_price = Decimal(str(product.sales_price))
        variant_price = Decimal("0.00")
        if item.variant_id:
            variant = db.query(ProductVariant).filter(
                ProductVariant.id == item.variant_id,
                ProductVariant.product_id == item.product_id
            ).first()
            if not variant:
                raise HTTPException(status_code=400, detail="Invalid variant for specified product.")
            variant_price = Decimal(str(variant.additional_price))

        final_unit = base_price + variant_price
        line_sub = (final_unit * Decimal(item.quantity)).quantize(Decimal("0.01"))

        # Tax lookup
        tax_rate = Decimal("18.00")  # default standard GST
        if item.tax_id:
            tax_obj = db.query(Tax).filter(Tax.id == item.tax_id).first()
            if tax_obj:
                tax_rate = Decimal(str(tax_obj.rate_percentage))

        line_tax = (line_sub * tax_rate / Decimal("100.00")).quantize(Decimal("0.01"))
        line_tot = line_sub + line_tax

        subtotal += line_sub
        tax_total += line_tax
        total_qty += item.quantity

        calculated_lines.append({
            "product_id": item.product_id,
            "variant_id": item.variant_id,
            "quantity": item.quantity,
            "base_unit_price": base_price,
            "variant_extra_price": variant_price,
            "final_unit_price": final_unit,
            "tax_id": item.tax_id,
            "tax_rate": tax_rate,
            "line_subtotal": line_sub,
            "line_total": line_tot
        })

    # Validate Plan minimum quantity
    if total_qty < plan.min_quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Plan '{plan.name}' requires a minimum quantity of {plan.min_quantity} units (Current: {total_qty})."
        )

    # Evaluate discount
    discount_val = Decimal("0.00")
    if payload.discount_code:
        eval_lines = [{"product_id": cl["product_id"], "line_subtotal": cl["line_subtotal"]} for cl in calculated_lines]
        is_val, disc_amt, _, msg = evaluate_discount(
            db, payload.discount_code, subtotal, total_qty, eval_lines
        )
        if not is_val:
            raise HTTPException(status_code=400, detail=f"Discount validation failed: {msg}")
        discount_val = disc_amt

    # Re-calculate net tax based on discounted net base (PRD Section 16.1 Formula 5)
    net_base = subtotal - discount_val
    if subtotal > Decimal("0.00"):
        discount_ratio = net_base / subtotal
        tax_total = (tax_total * discount_ratio).quantize(Decimal("0.01"))

    final_total = net_base + tax_total


    quotation = Quotation(
        quotation_number=q_num,
        customer_id=customer.id,
        plan_id=plan.id,
        status="SENT",
        valid_until=valid_until,
        subtotal=subtotal,
        discount_amount=discount_val,
        tax_amount=tax_total,
        total_amount=final_total,
        created_by_staff_id=current_user.id
    )
    db.add(quotation)
    db.flush()

    for cl in calculated_lines:
        ql = QuotationLine(
            quotation_id=quotation.id,
            product_id=cl["product_id"],
            variant_id=cl["variant_id"],
            quantity=cl["quantity"],
            base_unit_price=cl["base_unit_price"],
            variant_extra_price=cl["variant_extra_price"],
            final_unit_price=cl["final_unit_price"],
            tax_id=cl["tax_id"],
            tax_rate=cl["tax_rate"],
            line_subtotal=cl["line_subtotal"],
            line_total=cl["line_total"]
        )
        db.add(ql)

    db.commit()
    db.refresh(quotation)
    return map_quotation_to_response(quotation)

@router.get("", response_model=List[QuotationResponse])
def list_quotations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role in ["ADMIN", "STAFF"]:
        quotes = db.query(Quotation).order_by(Quotation.created_at.desc()).all()
    else:
        # Customer sees only their own quotes
        cust = current_user.customer
        if not cust:
            return []
        quotes = db.query(Quotation).filter(Quotation.customer_id == cust.id).order_by(Quotation.created_at.desc()).all()

    return [map_quotation_to_response(q) for q in quotes]

@router.get("/{quotation_id}", response_model=QuotationResponse)
def get_quotation(
    quotation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quote = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found.")

    if current_user.role == "CUSTOMER":
        cust = current_user.customer
        if not cust or quote.customer_id != cust.id:
            raise HTTPException(status_code=403, detail="Access forbidden: You cannot view another customer's quotation.")

    return map_quotation_to_response(quote)

@router.post("/{quotation_id}/accept", response_model=QuotationResponse)
def accept_quotation(
    quotation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quote = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found.")

    if current_user.role == "CUSTOMER":
        cust = current_user.customer
        if not cust or quote.customer_id != cust.id:
            raise HTTPException(status_code=403, detail="Access forbidden: You cannot accept another customer's quote.")

    if quote.valid_until < date.today():
        quote.status = "EXPIRED"
        db.commit()
        raise HTTPException(status_code=400, detail="This quotation has expired.")

    quote.status = "ACCEPTED"
    db.commit()
    db.refresh(quote)
    return map_quotation_to_response(quote)

@router.post("/{quotation_id}/convert", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def convert_quotation_to_subscription(
    quotation_id: str,
    payload: QuotationConvertRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    quote = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found.")

    if quote.status != "ACCEPTED":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot convert quotation with status '{quote.status}'. Quotation must be 'ACCEPTED'."
        )

    # Check if already converted
    existing_sub = db.query(Subscription).filter(Subscription.quotation_id == quote.id).first()
    if existing_sub:
        raise HTTPException(status_code=400, detail="This quotation has already been converted into a subscription.")

    start_date = payload.start_date or date.today()
    plan = quote.plan

    # Compute expiry date
    if plan.billing_frequency == "YEARLY":
        expiry_date = start_date + relativedelta(years=plan.billing_interval_count)
    elif plan.billing_frequency == "MONTHLY":
        expiry_date = start_date + relativedelta(months=plan.billing_interval_count)
    elif plan.billing_frequency == "WEEKLY":
        expiry_date = start_date + relativedelta(weeks=plan.billing_interval_count)
    else:
        expiry_date = start_date + relativedelta(days=plan.billing_interval_count)

    sub_number = generate_subscription_number(db)

    new_sub = Subscription(
        subscription_number=sub_number,
        customer_id=quote.customer_id,
        plan_id=quote.plan_id,
        quotation_id=quote.id,
        status="ACTIVE",
        start_date=start_date,
        expiry_date=expiry_date,
        next_billing_date=start_date,
        payment_terms=payload.payment_terms
    )
    db.add(new_sub)
    db.flush()

    for ql in quote.lines:
        sl = SubscriptionLine(
            subscription_id=new_sub.id,
            product_id=ql.product_id,
            variant_id=ql.variant_id,
            quantity=ql.quantity,
            unit_price=ql.final_unit_price,
            tax_id=ql.tax_id,
            tax_rate=ql.tax_rate,
            line_total=ql.line_total
        )
        db.add(sl)

    db.commit()
    db.refresh(new_sub)

    from backend.app.routers.subscription_routes import map_subscription_to_response
    return map_subscription_to_response(new_sub)

