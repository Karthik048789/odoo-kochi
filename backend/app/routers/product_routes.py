from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Product, ProductVariant
from backend.app.schemas import (
    ProductCreateRequest, ProductUpdateRequest, ProductResponse,
    VariantCreateRequest, VariantResponse
)
from backend.app.auth import require_admin, get_current_user

router = APIRouter(prefix="/products", tags=["Products & Variants"])

@router.get("", response_model=List[ProductResponse])
def list_products(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    products = db.query(Product).order_by(Product.created_at.desc()).all()
    return products

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreateRequest,
    db: Session = Depends(get_db),
    admin_user = Depends(require_admin)
):
    existing = db.query(Product).filter(Product.product_code == payload.product_code.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Product with code '{payload.product_code}' already exists.")

    new_prod = Product(
        product_code=payload.product_code.strip().upper(),
        name=payload.name.strip(),
        product_type=payload.product_type,
        sales_price=payload.sales_price,
        cost_price=payload.cost_price,
        description=payload.description,
        is_active=True
    )
    db.add(new_prod)
    db.commit()
    db.refresh(new_prod)
    return new_prod

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    payload: ProductUpdateRequest,
    db: Session = Depends(get_db),
    admin_user = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    if payload.name is not None:
        product.name = payload.name.strip()
    if payload.sales_price is not None:
        product.sales_price = payload.sales_price
    if payload.cost_price is not None:
        product.cost_price = payload.cost_price
    if payload.description is not None:
        product.description = payload.description
    if payload.is_active is not None:
        product.is_active = payload.is_active

    db.commit()
    db.refresh(product)
    return product

@router.post("/{product_id}/variants", response_model=VariantResponse, status_code=status.HTTP_201_CREATED)
def create_product_variant(
    product_id: str,
    payload: VariantCreateRequest,
    db: Session = Depends(get_db),
    admin_user = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Parent product not found.")

    # Check unique attribute combination for this product
    existing = db.query(ProductVariant).filter(
        ProductVariant.product_id == product_id,
        ProductVariant.attribute_type == payload.attribute_type.strip(),
        ProductVariant.attribute_value == payload.attribute_value.strip()
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Variant with {payload.attribute_type}='{payload.attribute_value}' already exists for this product."
        )

    new_variant = ProductVariant(
        product_id=product_id,
        variant_name=payload.variant_name.strip(),
        attribute_type=payload.attribute_type.strip(),
        attribute_value=payload.attribute_value.strip(),
        additional_price=payload.additional_price,
        sku_suffix=payload.sku_suffix.strip().upper(),
        is_active=True
    )
    db.add(new_variant)
    db.commit()
    db.refresh(new_variant)
    return new_variant
