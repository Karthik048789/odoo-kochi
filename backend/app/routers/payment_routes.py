from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Payment, Invoice, User
from backend.app.schemas import PaymentCreateRequest, PaymentResponse
from backend.app.auth import require_staff_or_admin, get_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])

def generate_payment_number(db: Session) -> str:
    year = datetime.now().year
    prefix = f"PAY-{year}-"
    last_p = db.query(Payment).filter(Payment.payment_number.like(f"{prefix}%"))\
               .order_by(Payment.payment_number.desc()).first()
    if last_p:
        try:
            seq = int(last_p.payment_number.split("-")[-1]) + 1
        except ValueError:
            seq = 1
    else:
        seq = 1
    return f"{prefix}{seq:05d}"

def map_payment_to_response(p: Payment) -> PaymentResponse:
    return PaymentResponse(
        id=p.id,
        payment_number=p.payment_number,
        invoice_id=p.invoice_id,
        invoice_number=p.invoice.invoice_number if p.invoice else None,
        payment_method=p.payment_method,
        amount=Decimal(str(p.amount)),
        payment_date=p.payment_date,
        reference_number=p.reference_number,
        notes=p.notes,
        recorded_by_user_id=p.recorded_by_user_id,
        created_at=p.created_at
    )

@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def record_payment(
    payload: PaymentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    invoice = db.query(Invoice).filter(Invoice.id == payload.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Target invoice not found.")

    if invoice.status == "CANCELLED":
        raise HTTPException(status_code=400, detail="Cannot record payments against a cancelled invoice.")

    total = Decimal(str(invoice.total_amount))
    current_paid = Decimal(str(invoice.amount_paid))
    remaining = total - current_paid

    pay_amount = Decimal(str(payload.amount))

    if remaining <= 0:
        raise HTTPException(status_code=400, detail="This invoice is already fully paid.")

    if pay_amount > remaining:
        raise HTTPException(
            status_code=400,
            detail=f"Payment amount of ₹{pay_amount:,.2f} exceeds remaining balance of ₹{remaining:,.2f}."
        )

    pay_num = generate_payment_number(db)
    payment_dt = payload.payment_date or date.today()

    new_payment = Payment(
        payment_number=pay_num,
        invoice_id=invoice.id,
        payment_method=payload.payment_method.upper(),
        amount=pay_amount,
        payment_date=payment_dt,
        reference_number=payload.reference_number.strip(),
        notes=payload.notes,
        recorded_by_user_id=current_user.id
    )
    db.add(new_payment)

    # Update invoice paid balance and state
    invoice.amount_paid = current_paid + pay_amount
    if invoice.amount_paid >= total:
        invoice.status = "PAID"

    db.commit()
    db.refresh(new_payment)
    return map_payment_to_response(new_payment)

@router.get("", response_model=List[PaymentResponse])
def list_payments(
    invoice_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Payment).order_by(Payment.payment_date.desc())
    if invoice_id:
        query = query.filter(Payment.invoice_id == invoice_id)

    if current_user.role == "CUSTOMER":
        cust = current_user.customer
        if not cust:
            return []
        query = query.join(Invoice).filter(Invoice.customer_id == cust.id)

    payments = query.all()
    return [map_payment_to_response(p) for p in payments]
