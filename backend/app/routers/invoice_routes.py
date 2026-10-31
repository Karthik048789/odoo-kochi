import os
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Invoice, InvoiceLine, User, Subscription
from backend.app.schemas import (
    InvoiceResponse, InvoiceLineResponse, BillingRunRequest, BillingRunResponse
)
from backend.app.auth import get_current_user, require_staff_or_admin, require_admin
from backend.app.services.billing_service import run_scheduled_billing
from backend.app.config import settings

router = APIRouter(prefix="/invoices", tags=["Invoices"])

def map_invoice_to_response(inv: Invoice) -> InvoiceResponse:
    lines = []
    for l in inv.lines:
        lines.append(InvoiceLineResponse(
            id=l.id,
            product_name_snapshot=l.product_name_snapshot,
            variant_name_snapshot=l.variant_name_snapshot,
            quantity=l.quantity,
            unit_price=Decimal(str(l.unit_price)),
            tax_rate=Decimal(str(l.tax_rate)),
            tax_amount=Decimal(str(l.tax_amount)),
            line_total=Decimal(str(l.line_total))
        ))

    tot = Decimal(str(inv.total_amount))
    paid = Decimal(str(inv.amount_paid))
    outstanding = tot - paid

    return InvoiceResponse(
        id=inv.id,
        invoice_number=inv.invoice_number,
        subscription_id=inv.subscription_id,
        subscription_number=inv.subscription.subscription_number if inv.subscription else None,
        customer_id=inv.customer_id,
        customer_name=inv.customer.company_name if inv.customer else None,
        billing_cycle_start=inv.billing_cycle_start,
        billing_cycle_end=inv.billing_cycle_end,
        invoice_date=inv.invoice_date,
        due_date=inv.due_date,
        status=inv.status,
        subtotal=Decimal(str(inv.subtotal)),
        discount_total=Decimal(str(inv.discount_total)),
        tax_total=Decimal(str(inv.tax_total)),
        total_amount=tot,
        amount_paid=paid,
        outstanding_balance=outstanding,
        pdf_url=inv.pdf_url,
        created_at=inv.created_at,
        lines=lines
    )

@router.post("/trigger-billing", response_model=BillingRunResponse)
def trigger_billing_run(
    payload: Optional[BillingRunRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    target_dt = payload.target_date if payload else None
    job = run_scheduled_billing(db, target_dt)
    return BillingRunResponse(
        job_id=job.id,
        job_run_date=job.job_run_date,
        status=job.status,
        subscriptions_processed=job.subscriptions_processed,
        invoices_created=job.invoices_created,
        message=f"Billing run executed: {job.invoices_created} invoices generated from {job.subscriptions_processed} due subscriptions."
    )

@router.get("", response_model=List[InvoiceResponse])
def list_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role in ["ADMIN", "STAFF"]:
        invoices = db.query(Invoice).order_by(Invoice.invoice_date.desc()).all()
    else:
        cust = current_user.customer
        if not cust:
            return []
        invoices = db.query(Invoice).filter(Invoice.customer_id == cust.id).order_by(Invoice.invoice_date.desc()).all()

    return [map_invoice_to_response(i) for i in invoices]

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    if current_user.role == "CUSTOMER":
        cust = current_user.customer
        if not cust or invoice.customer_id != cust.id:
            raise HTTPException(status_code=403, detail="Access forbidden: You cannot view another customer's invoice.")

    return map_invoice_to_response(invoice)

@router.get("/{invoice_id}/pdf")
def download_invoice_pdf(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    if current_user.role == "CUSTOMER":
        cust = current_user.customer
        if not cust or invoice.customer_id != cust.id:
            raise HTTPException(status_code=403, detail="Access forbidden: You cannot download another customer's invoice.")

    expected_path = os.path.join(settings.INVOICE_PDF_DIR, f"{invoice.invoice_number}.pdf")
    if not os.path.exists(expected_path):
        # Regenerate on the fly if needed
        from backend.app.services.pdf_service import generate_invoice_pdf
        generate_invoice_pdf(invoice, invoice.customer, invoice.lines)

    return FileResponse(
        path=expected_path,
        media_type="application/pdf",
        filename=f"{invoice.invoice_number}.pdf",
        content_disposition_type="inline"
    )

@router.post("/{invoice_id}/confirm", response_model=InvoiceResponse)
def confirm_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    if invoice.status != "DRAFT":
        raise HTTPException(status_code=400, detail=f"Cannot confirm invoice with status '{invoice.status}'.")

    invoice.status = "CONFIRMED"
    db.commit()
    db.refresh(invoice)
    return map_invoice_to_response(invoice)

@router.post("/{invoice_id}/cancel", response_model=InvoiceResponse)
def cancel_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    if invoice.status == "PAID":
        raise HTTPException(status_code=400, detail="Cannot cancel a fully paid invoice.")

    invoice.status = "CANCELLED"
    db.commit()
    db.refresh(invoice)
    return map_invoice_to_response(invoice)
