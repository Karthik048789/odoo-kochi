from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Customer, User
from backend.app.schemas import CustomerResponse, CustomerUpdateRequest
from backend.app.auth import get_current_user

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("", response_model=List[CustomerResponse])
def list_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role in ["ADMIN", "STAFF"]:
        customers = db.query(Customer).all()
    else:
        # Customer sees only their own profile
        customers = db.query(Customer).filter(Customer.user_id == current_user.id).all()

    result = []
    for c in customers:
        result.append(CustomerResponse(
            id=c.id,
            user_id=c.user_id,
            company_name=c.company_name,
            tax_identifier=c.tax_identifier,
            phone_number=c.phone_number,
            billing_address=c.billing_address,
            city=c.city,
            postal_code=c.postal_code,
            country=c.country,
            email=c.user.email if c.user else None,
            first_name=c.user.first_name if c.user else None,
            last_name=c.user.last_name if c.user else None
        ))
    return result

@router.get("/me", response_model=CustomerResponse)
def get_my_customer_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.customer:
        raise HTTPException(status_code=404, detail="No customer profile linked to this user account.")
    c = current_user.customer
    return CustomerResponse(
        id=c.id,
        user_id=c.user_id,
        company_name=c.company_name,
        tax_identifier=c.tax_identifier,
        phone_number=c.phone_number,
        billing_address=c.billing_address,
        city=c.city,
        postal_code=c.postal_code,
        country=c.country,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name
    )

@router.get("/{customer_id}", response_model=CustomerResponse)

def get_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    # IDOR Check
    if current_user.role == "CUSTOMER" and customer.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access forbidden: You cannot view another customer's profile.")

    return CustomerResponse(
        id=customer.id,
        user_id=customer.user_id,
        company_name=customer.company_name,
        tax_identifier=customer.tax_identifier,
        phone_number=customer.phone_number,
        billing_address=customer.billing_address,
        city=customer.city,
        postal_code=customer.postal_code,
        country=customer.country,
        email=customer.user.email if customer.user else None,
        first_name=customer.user.first_name if customer.user else None,
        last_name=customer.user.last_name if customer.user else None
    )

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: str,
    payload: CustomerUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    if current_user.role == "CUSTOMER" and customer.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access forbidden: You cannot edit another customer's profile.")

    if payload.company_name is not None:
        customer.company_name = payload.company_name.strip()
    if payload.tax_identifier is not None:
        customer.tax_identifier = payload.tax_identifier.strip()
    if payload.phone_number is not None:
        customer.phone_number = payload.phone_number.strip()
    if payload.billing_address is not None:
        customer.billing_address = payload.billing_address.strip()
    if payload.city is not None:
        customer.city = payload.city.strip()
    if payload.postal_code is not None:
        customer.postal_code = payload.postal_code.strip()

    db.commit()
    db.refresh(customer)

    return CustomerResponse(
        id=customer.id,
        user_id=customer.user_id,
        company_name=customer.company_name,
        tax_identifier=customer.tax_identifier,
        phone_number=customer.phone_number,
        billing_address=customer.billing_address,
        city=customer.city,
        postal_code=customer.postal_code,
        country=customer.country,
        email=customer.user.email if customer.user else None,
        first_name=customer.user.first_name if customer.user else None,
        last_name=customer.user.last_name if customer.user else None
    )
