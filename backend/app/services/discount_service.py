from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from backend.app.models import Discount, DiscountProduct

def evaluate_discount(
    db: Session,
    code: str,
    subtotal: Decimal,
    total_quantity: int = 1,
    line_items: Optional[List[dict]] = None
) -> Tuple[bool, Decimal, Optional[Discount], str]:
    """
    Evaluates a discount code against order/quotation parameters.
    line_items format: [{'product_id': '...', 'line_subtotal': Decimal('...')}]
    Returns: (is_valid, calculated_discount_amount, discount_model, reason_message)
    """
    if not code:
        return False, Decimal("0.00"), None, "No discount code provided"

    discount = db.query(Discount).filter(Discount.code == code.strip().upper()).first()
    if not discount:
        return False, Decimal("0.00"), None, f"Discount code '{code}' does not exist"

    if not discount.is_active:
        return False, Decimal("0.00"), discount, "This discount rule is currently deactivated"

    now = datetime.now(timezone.utc)

    def to_utc(dt):
        if dt is None:
            return None
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)

    v_from = to_utc(discount.valid_from)
    v_until = to_utc(discount.valid_until)

    # Check validity window
    if v_from and now < v_from:
        return False, Decimal("0.00"), discount, "This discount code is not yet active"
    if v_until and now > v_until:
        return False, Decimal("0.00"), discount, "This discount code has expired"


    # Check maximum usage cap
    if discount.max_uses is not None and discount.used_count >= discount.max_uses:
        return False, Decimal("0.00"), discount, "This discount code has reached its maximum usage limit"

    # Check minimum conditions
    if subtotal < discount.min_subtotal:
        return False, Decimal("0.00"), discount, f"Minimum purchase amount of ₹{discount.min_subtotal:,.2f} required"

    if total_quantity < discount.min_quantity:
        return False, Decimal("0.00"), discount, f"Minimum quantity of {discount.min_quantity} items required"

    # Determine eligible amount based on scope
    eligible_amount = subtotal
    if discount.scope == "PRODUCT_SPECIFIC" and line_items:
        allowed_pids = {dp.product_id for dp in discount.product_associations}
        eligible_amount = sum(
            (item.get('line_subtotal', Decimal("0.00")) for item in line_items if item.get('product_id') in allowed_pids),
            Decimal("0.00")
        )
        if eligible_amount <= 0:
            return False, Decimal("0.00"), discount, "None of the items in the order qualify for this discount"

    # Calculate discount deduction
    deduction = Decimal("0.00")
    if discount.discount_type == "PERCENTAGE":
        deduction = (eligible_amount * Decimal(str(discount.amount_value)) / Decimal("100.00")).quantize(Decimal("0.01"))
    elif discount.discount_type == "FIXED_AMOUNT":
        deduction = Decimal(str(discount.amount_value)).quantize(Decimal("0.01"))

    # Cap deduction so it never exceeds eligible amount
    if deduction > eligible_amount:
        deduction = eligible_amount

    return True, deduction, discount, "Discount applied successfully"
