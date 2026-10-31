from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Tax, User
from backend.app.schemas import (
    DashboardSummaryResponse, RevenueTrendItem, TopProductItem, RenewalItem,
    TaxCreateRequest, TaxResponse
)
from backend.app.auth import get_current_user, require_admin, require_staff_or_admin
from backend.app.services.analytics_service import (
    get_dashboard_summary, get_revenue_trends, get_top_products, get_upcoming_renewals
)

router = APIRouter(tags=["Dashboard & Analytics"])

@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cust_id = None
    if current_user.role == "CUSTOMER":
        cust_id = current_user.customer.id if current_user.customer else "NONE"
    return get_dashboard_summary(db, cust_id)

@router.get("/dashboard/revenue-trends", response_model=List[RevenueTrendItem])
def dashboard_revenue_trends(
    months: int = 6,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    return get_revenue_trends(db, months)

@router.get("/dashboard/top-products", response_model=List[TopProductItem])
def dashboard_top_products(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    return get_top_products(db, limit)

@router.get("/dashboard/renewals", response_model=List[RenewalItem])
def dashboard_upcoming_renewals(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    return get_upcoming_renewals(db, days)

@router.get("/taxes", response_model=List[TaxResponse])
def list_taxes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    taxes = db.query(Tax).all()
    return taxes

@router.post("/taxes", response_model=TaxResponse, status_code=status.HTTP_201_CREATED)
def create_tax(
    payload: TaxCreateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    tax = Tax(
        tax_name=payload.tax_name.strip(),
        rate_percentage=payload.rate_percentage,
        is_default=payload.is_default,
        is_active=True
    )
    db.add(tax)
    db.commit()
    db.refresh(tax)
    return tax
