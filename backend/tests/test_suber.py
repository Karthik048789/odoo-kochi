import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import Base, engine, SessionLocal
from backend.app.models import User, Customer, Product, ProductVariant, Plan, Tax
from backend.app.seed import seed_database

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()
    yield

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "HEALTHY"

def test_password_validation(client):
    # <= 8 chars
    res = client.post("/api/v1/auth/register", json={
        "email": "badpass@test.com",
        "password": "Short1!",
        "first_name": "Test",
        "last_name": "User",
        "company_name": "Test Co",
        "phone_number": "1234567890",
        "billing_address": "Street",
        "city": "City",
        "postal_code": "12345"
    })
    assert res.status_code == 400
    assert "more than eight characters" in res.json()["detail"].lower()

    # Missing uppercase
    res = client.post("/api/v1/auth/register", json={
        "email": "badpass@test.com",
        "password": "lowercase123!",
        "first_name": "Test",
        "last_name": "User",
        "company_name": "Test Co",
        "phone_number": "1234567890",
        "billing_address": "Street",
        "city": "City",
        "postal_code": "12345"
    })
    assert res.status_code == 400
    assert "uppercase" in res.json()["detail"].lower()

    # Missing special character
    res = client.post("/api/v1/auth/register", json={
        "email": "badpass@test.com",
        "password": "NoSpecialChar123",
        "first_name": "Test",
        "last_name": "User",
        "company_name": "Test Co",
        "phone_number": "1234567890",
        "billing_address": "Street",
        "city": "City",
        "postal_code": "12345"
    })
    assert res.status_code == 400
    assert "special character" in res.json()["detail"].lower()

def test_admin_and_staff_login(client):
    # Admin login
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@brightloop.com",
        "password": "Brightloop#Admin2026"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "ADMIN"
    assert "access_token" in data

    # Staff login
    res = client.post("/api/v1/auth/login", json={
        "email": "staff@brightloop.com",
        "password": "Brightloop#Staff2026"
    })
    assert res.status_code == 200
    assert res.json()["role"] == "STAFF"

def test_unauthorized_staff_creation(client):
    # Staff tries to create staff account -> Must fail 403 Forbidden
    login_res = client.post("/api/v1/auth/login", json={
        "email": "staff@brightloop.com",
        "password": "Brightloop#Staff2026"
    })
    staff_token = login_res.json()["access_token"]

    res = client.post(
        "/api/v1/users/staff",
        headers={"Authorization": f"Bearer {staff_token}"},
        json={
            "email": "intruder@brightloop.com",
            "password": "Intruder#Staff2026",
            "first_name": "Intruder",
            "last_name": "Hack"
        }
    )
    assert res.status_code == 403

def test_product_variant_pricing_and_catalog(client):
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@brightloop.com",
        "password": "Brightloop#Admin2026"
    })
    admin_token = login_res.json()["access_token"]

    res = client.get("/api/v1/products", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    products = res.json()
    erp = next((p for p in products if p["product_code"] == "PROD-ERP-CORE"), None)
    assert erp is not None
    assert Decimal(str(erp["sales_price"])) == Decimal("1000.00")

    # Variant Odoo Brand adds 560
    var_odoo = next((v for v in erp["variants"] if v["attribute_value"] == "Odoo"), None)
    assert var_odoo is not None
    assert Decimal(str(var_odoo["additional_price"])) == Decimal("560.00")

def test_full_subscription_lifecycle_and_billing(client):
    # 1. Login as Staff
    staff_login = client.post("/api/v1/auth/login", json={
        "email": "staff@brightloop.com",
        "password": "Brightloop#Staff2026"
    }).json()
    staff_token = staff_login["access_token"]

    # 2. Get Customer Amit / Apex Retail
    custs = client.get("/api/v1/customers", headers={"Authorization": f"Bearer {staff_token}"}).json()
    apex = next(c for c in custs if "Apex Retail" in c["company_name"])

    # 3. Get Products & Plans
    prods = client.get("/api/v1/products", headers={"Authorization": f"Bearer {staff_token}"}).json()
    erp = next(p for p in prods if p["product_code"] == "PROD-ERP-CORE")
    var_odoo = next(v for v in erp["variants"] if v["attribute_value"] == "Odoo")

    plans = client.get("/api/v1/plans", headers={"Authorization": f"Bearer {staff_token}"}).json()
    monthly_plan = next(p for p in plans if p["plan_code"] == "PLAN-MONTHLY-STD")

    # 4. Create Quotation for 10 seats of ERP Core + Odoo variant
    q_res = client.post(
        "/api/v1/quotations",
        headers={"Authorization": f"Bearer {staff_token}"},
        json={
            "customer_id": apex["id"],
            "plan_id": monthly_plan["id"],
            "validity_days": 15,
            "discount_code": "DIWALI10",
            "lines": [
                {
                    "product_id": erp["id"],
                    "variant_id": var_odoo["id"],
                    "quantity": 10
                }
            ]
        }
    )
    assert q_res.status_code == 201
    quote = q_res.json()
    assert Decimal(str(quote["subtotal"])) == Decimal("15600.00")
    assert Decimal(str(quote["discount_amount"])) == Decimal("1560.00")
    assert Decimal(str(quote["tax_amount"])) == Decimal("2527.20")
    assert Decimal(str(quote["total_amount"])) == Decimal("16567.20")

    # 5. Customer Amit logs in and accepts the quotation
    amit_login = client.post("/api/v1/auth/login", json={
        "email": "amit@apexretail.com",
        "password": "ApexRetail#Strong2026"
    }).json()
    amit_token = amit_login["access_token"]

    acc_res = client.post(
        f"/api/v1/quotations/{quote['id']}/accept",
        headers={"Authorization": f"Bearer {amit_token}"}
    )
    assert acc_res.status_code == 200
    assert acc_res.json()["status"] == "ACCEPTED"

    # 6. Staff converts accepted quotation to Subscription
    conv_res = client.post(
        f"/api/v1/quotations/{quote['id']}/convert",
        headers={"Authorization": f"Bearer {staff_token}"},
        json={"payment_terms": "NET_15"}
    )
    assert conv_res.status_code == 201
    sub = conv_res.json()
    assert sub["status"] == "ACTIVE"

    # 7. Automated billing run
    bill_res = client.post(
        "/api/v1/invoices/trigger-billing",
        headers={"Authorization": f"Bearer {staff_token}"}
    )
    assert bill_res.status_code == 200
    data = bill_res.json()
    assert data["status"] == "COMPLETED"

    # 8. Idempotency verification: trigger billing again on same date
    bill_res_2 = client.post(
        "/api/v1/invoices/trigger-billing",
        headers={"Authorization": f"Bearer {staff_token}"}
    )
    assert bill_res_2.status_code == 200
    assert bill_res_2.json()["invoices_created"] == 0

    # 9. Payment recording: Partial payment
    invoices = client.get("/api/v1/invoices", headers={"Authorization": f"Bearer {staff_token}"}).json()
    latest_inv = next(i for i in invoices if i["subscription_id"] == sub["id"])
    assert Decimal(str(latest_inv["total_amount"])) > Decimal("0.00")

    # Overpayment must fail: Try paying 999,999.00
    overpay_res = client.post(
        "/api/v1/payments",
        headers={"Authorization": f"Bearer {staff_token}"},
        json={
            "invoice_id": latest_inv["id"],
            "payment_method": "BANK_TRANSFER",
            "amount": 999999.00,
            "reference_number": "UTR-OVERPAY-TEST"
        }
    )
    assert overpay_res.status_code == 400
    assert "exceeds remaining balance" in overpay_res.json()["detail"].lower()

    # Valid partial payment of 5,000.00
    pay_res = client.post(
        "/api/v1/payments",
        headers={"Authorization": f"Bearer {staff_token}"},
        json={
            "invoice_id": latest_inv["id"],
            "payment_method": "BANK_TRANSFER",
            "amount": 5000.00,
            "reference_number": "UTR-VALID-5000"
        }
    )
    assert pay_res.status_code == 201
    payment = pay_res.json()
    assert Decimal(str(payment["amount"])) == Decimal("5000.00")

    # Verify invoice status updated
    inv_check = client.get(f"/api/v1/invoices/{latest_inv['id']}", headers={"Authorization": f"Bearer {staff_token}"}).json()
    assert Decimal(str(inv_check["amount_paid"])) == Decimal("5000.00")

def test_customer_idor_isolation(client):
    import uuid
    dynamic_email = f"customerb_{uuid.uuid4().hex[:8]}@tenant2.com"
    # Register Customer B
    reg_b = client.post("/api/v1/auth/register", json={
        "email": dynamic_email,
        "password": "SecurePassword#2026",
        "first_name": "Bob",
        "last_name": "Tenant",
        "company_name": "Tenant B Corp",
        "phone_number": "9998887776",
        "billing_address": "Street B",
        "city": "Mumbai",
        "postal_code": "400001"
    })
    assert reg_b.status_code == 201
    token_b = reg_b.json()["access_token"]


    # Customer Amit (Customer A)
    login_a = client.post("/api/v1/auth/login", json={
        "email": "amit@apexretail.com",
        "password": "ApexRetail#Strong2026"
    }).json()
    token_a = login_a["access_token"]

    # Customer A's invoices
    invoices_a = client.get("/api/v1/invoices", headers={"Authorization": f"Bearer {token_a}"}).json()
    assert len(invoices_a) > 0
    inv_id_a = invoices_a[0]["id"]

    # Customer B attempts to access Customer A's invoice directly by ID
    idor_res = client.get(f"/api/v1/invoices/{inv_id_a}", headers={"Authorization": f"Bearer {token_b}"})
    # MUST return 403 Forbidden!
    assert idor_res.status_code == 403
    assert "cannot view another customer" in idor_res.json()["detail"].lower()
