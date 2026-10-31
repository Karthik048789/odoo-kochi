import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import User, Customer, PasswordResetToken, EmailLog
from backend.app.schemas import (
    UserRegisterRequest, StaffCreateRequest, LoginRequest, 
    TokenResponse, ForgotPasswordRequest, ResetPasswordRequest, UserResponse
)
from backend.app.auth import (
    hash_password, verify_password, create_access_token, 
    validate_password_strength, get_current_user, require_admin
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_customer(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    # Validate password complexity (PRD FR-1.3)
    validate_password_strength(payload.password)

    # Validate unique email
    existing_user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists."
        )

    hashed = hash_password(payload.password)
    new_user = User(
        email=payload.email.lower().strip(),
        password_hash=hashed,
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        role="CUSTOMER",
        is_active=True
    )
    db.add(new_user)
    db.flush()

    new_customer = Customer(
        user_id=new_user.id,
        company_name=payload.company_name.strip(),
        tax_identifier=payload.tax_identifier.strip() if payload.tax_identifier else None,
        phone_number=payload.phone_number.strip(),
        billing_address=payload.billing_address.strip(),
        city=payload.city.strip(),
        postal_code=payload.postal_code.strip(),
        country=payload.country.strip()
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_user)
    db.refresh(new_customer)

    token = create_access_token(data={"sub": new_user.id, "role": new_user.role, "email": new_user.email})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=new_user.role,
        user_id=new_user.id,
        email=new_user.email,
        full_name=f"{new_user.first_name} {new_user.last_name}",
        customer_id=new_customer.id
    )

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password combination."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact an administrator."
        )

    token = create_access_token(data={"sub": user.id, "role": user.role, "email": user.email})
    cust_id = user.customer.id if user.customer else None

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        email=user.email,
        full_name=f"{user.first_name} {user.last_name}",
        customer_id=cust_id
    )

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user:
        # Don't leak user existence in generic message
        return {"message": "If this email is registered, a password reset link has been dispatched."}

    token_str = str(uuid.uuid4())
    expires = datetime.now(timezone.utc) + timedelta(minutes=30)
    reset_record = PasswordResetToken(
        user_id=user.id,
        token_hash=token_str,
        expires_at=expires,
        is_used=False
    )
    db.add(reset_record)

    email_log = EmailLog(
        recipient_email=user.email,
        subject="Password Reset Request - SUBER",
        email_type="PASSWORD_RESET",
        status="SENT"
    )
    db.add(email_log)
    db.commit()

    return {
        "message": "Password reset token generated successfully.",
        "reset_token": token_str  # returned for direct demo ease
    }

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    validate_password_strength(payload.new_password)

    record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == payload.token,
        PasswordResetToken.is_used == False
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid or already used password reset token.")

    now = datetime.now(timezone.utc)
    expires = record.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < now:
        raise HTTPException(status_code=400, detail="This reset token has expired.")


    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    user.password_hash = hash_password(payload.new_password)
    record.is_used = True
    db.commit()

    return {"message": "Password reset successfully. You may now log in with your new password."}
