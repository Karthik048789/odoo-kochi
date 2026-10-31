from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Plan
from backend.app.schemas import PlanCreateRequest, PlanUpdateRequest, PlanResponse
from backend.app.auth import require_admin, get_current_user

router = APIRouter(prefix="/plans", tags=["Subscription Plans"])

@router.get("", response_model=List[PlanResponse])
def list_plans(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    plans = db.query(Plan).order_by(Plan.plan_code.asc()).all()
    return plans

@router.post("", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(
    payload: PlanCreateRequest,
    db: Session = Depends(get_db),
    admin_user = Depends(require_admin)
):
    existing = db.query(Plan).filter(Plan.plan_code == payload.plan_code.strip().upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Plan code '{payload.plan_code}' already exists.")

    new_plan = Plan(
        plan_code=payload.plan_code.strip().upper(),
        name=payload.name.strip(),
        billing_frequency=payload.billing_frequency.upper(),
        billing_interval_count=payload.billing_interval_count,
        min_quantity=payload.min_quantity,
        valid_from=payload.valid_from or datetime.now(timezone.utc),
        valid_until=payload.valid_until,
        auto_close_at_expiry=payload.auto_close_at_expiry,
        allow_early_closure=payload.allow_early_closure,
        allow_pause=payload.allow_pause,
        auto_renew=payload.auto_renew,
        is_active=True
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    return new_plan

@router.put("/{plan_id}", response_model=PlanResponse)
def update_plan(
    plan_id: str,
    payload: PlanUpdateRequest,
    db: Session = Depends(get_db),
    admin_user = Depends(require_admin)
):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")

    if payload.name is not None:
        plan.name = payload.name.strip()
    if payload.billing_frequency is not None:
        plan.billing_frequency = payload.billing_frequency.upper()
    if payload.min_quantity is not None:
        plan.min_quantity = payload.min_quantity
    if payload.auto_close_at_expiry is not None:
        plan.auto_close_at_expiry = payload.auto_close_at_expiry
    if payload.allow_early_closure is not None:
        plan.allow_early_closure = payload.allow_early_closure
    if payload.allow_pause is not None:
        plan.allow_pause = payload.allow_pause
    if payload.auto_renew is not None:
        plan.auto_renew = payload.auto_renew
    if payload.is_active is not None:
        plan.is_active = payload.is_active

    db.commit()
    db.refresh(plan)
    return plan
