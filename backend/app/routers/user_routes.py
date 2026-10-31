from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import User, Customer
from backend.app.schemas import StaffCreateRequest, UserResponse, CustomerResponse
from backend.app.auth import (
    hash_password, validate_password_strength, get_current_user, require_admin
)

router = APIRouter(prefix="/users", tags=["Users & Staff"])

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    cust_id = current_user.customer.id if current_user.customer else None
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        customer_id=cust_id
    )

@router.post("/staff", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_staff_account(
    payload: StaffCreateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Admin-only endpoint to provision internal staff accounts.
    """
    validate_password_strength(payload.password)

    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists."
        )

    new_staff = User(
        email=payload.email.lower().strip(),
        password_hash=hash_password(payload.password),
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        role="STAFF" if payload.role != "ADMIN" else "ADMIN",
        is_active=True
    )
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)

    return UserResponse(
        id=new_staff.id,
        email=new_staff.email,
        first_name=new_staff.first_name,
        last_name=new_staff.last_name,
        role=new_staff.role,
        is_active=new_staff.is_active,
        created_at=new_staff.created_at,
        customer_id=None
    )

@router.get("/staff", response_model=List[UserResponse])
def list_staff_accounts(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    users = db.query(User).filter(User.role.in_(["STAFF", "ADMIN"])).all()
    return [
        UserResponse(
            id=u.id,
            email=u.email,
            first_name=u.first_name,
            last_name=u.last_name,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at,
            customer_id=None
        ) for u in users
    ]
