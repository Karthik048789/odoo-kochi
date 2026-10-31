from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Discount, DiscountProduct, User
from backend.app.schemas import (
    DiscountCreateRequest, DiscountResponse,
    DiscountValidateRequest, DiscountValidateResponse
)
from backend.app.auth import require_admin, require_staff_or_admin, get_current_user
from backend.app.services.discount_service import evaluate_discount

router = APIRouter(prefix="/discounts", tags=["Discounts"])

@router.post("", response_model=DiscountResponse, status_code=status.HTTP_201_CREATED)
def create_discount(
    payload: DiscountCreateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    code_clean = payload.code.strip().upper()
    existing = db.query(Discount).filter(Discount.code == code_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Discount code '{code_clean}' already exists.")

    valid_from = payload.valid_from or datetime.now(timezone.utc)
    valid_until = payload.valid_until or datetime(2099, 12, 31, tzinfo=timezone.utc)

    new_discount = Discount(
        code=code_clean,
        discount_type=payload.discount_type.upper(),
        amount_value=payload.amount_value,
        scope=payload.scope.upper(),
        min_subtotal=payload.min_subtotal,
        min_quantity=payload.min_quantity,
        valid_from=valid_from,
        valid_until=valid_until,
        max_uses=payload.max_uses,
        used_count=0,
        is_active=True
    )
    db.add(new_discount)
    db.flush()

    if payload.scope == "PRODUCT_SPECIFIC" and payload.product_ids:
        for pid in payload.product_ids:
            dp = DiscountProduct(discount_id=new_discount.id, product_id=pid)
            db.add(dp)

    db.commit()
    db.refresh(new_discount)
    return new_discount

@router.get("", response_model=List[DiscountResponse])
def list_discounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    discounts = db.query(Discount).order_by(Discount.valid_from.desc()).all()
    return discounts

@router.post("/validate", response_model=DiscountValidateResponse)
def validate_discount_code(
    payload: DiscountValidateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    line_items = [{"product_id": pid, "line_subtotal": payload.subtotal} for pid in payload.product_ids]
    is_valid, deduction, discount, message = evaluate_discount(
        db=db,
        code=payload.code,
        subtotal=payload.subtotal,
        total_quantity=payload.total_quantity,
        line_items=line_items
    )

    if not is_valid:
        raise HTTPException(status_code=400, detail=message)

    return DiscountValidateResponse(
        valid=True,
        discount_amount=deduction,
        message=message
    )
