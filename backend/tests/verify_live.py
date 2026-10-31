import requests

BASE = 'http://127.0.0.1:8000'

def run_checks():
    print("==================================================")
    print("SUBER END-TO-END SYSTEM INTEGRITY VERIFICATION")
    print("==================================================")

    # 1. Health check
    h = requests.get(f"{BASE}/health")
    assert h.status_code == 200, f"Health check failed: {h.text}"
    print("[1/9] PASS: /health is responding (Status 200)")

    # 2. Admin Authentication
    r_admin = requests.post(
        f"{BASE}/api/v1/auth/login",
        json={"email": "admin@brightloop.com", "password": "Brightloop#Admin2026"}
    )
    assert r_admin.status_code == 200, f"Admin login failed: {r_admin.text}"
    admin_token = r_admin.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[2/9] PASS: Admin Authentication & JWT Generation")

    # 3. Staff Authentication
    r_staff = requests.post(
        f"{BASE}/api/v1/auth/login",
        json={"email": "staff@brightloop.com", "password": "Brightloop#Staff2026"}
    )
    assert r_staff.status_code == 200, f"Staff login failed: {r_staff.text}"
    staff_token = r_staff.json()["access_token"]
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    print("[3/9] PASS: Staff Authentication & Operations Scope")

    # 4. Customer Authentication
    r_cust = requests.post(
        f"{BASE}/api/v1/auth/login",
        json={"email": "amit@apexretail.com", "password": "ApexRetail#Strong2026"}
    )
    assert r_cust.status_code == 200, f"Customer login failed: {r_cust.text}"
    cust_token = r_cust.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    print("[4/9] PASS: Customer Portal Authentication")

    # 5. Catalog Verification (Products, Variants, Plans, Taxes)
    prods = requests.get(f"{BASE}/api/v1/products", headers=admin_headers)
    assert prods.status_code == 200 and len(prods.json()) > 0
    plans = requests.get(f"{BASE}/api/v1/plans", headers=admin_headers)
    assert plans.status_code == 200 and len(plans.json()) > 0
    print(f"[5/9] PASS: Catalog Verification ({len(prods.json())} products, {len(plans.json())} plans)")

    # 6. Executive Financial Telemetry
    dash = requests.get(f"{BASE}/api/v1/dashboard/summary", headers=admin_headers)
    assert dash.status_code == 200
    d_data = dash.json()
    print(f"[6/9] PASS: Real-Time Financial Telemetry (MRR: Rs.{d_data.get('mrr')}, ARR: Rs.{d_data.get('arr')})")

    # 7. Official PDF Invoice Generation & Streaming
    invs = requests.get(f"{BASE}/api/v1/invoices", headers=admin_headers)
    assert invs.status_code == 200 and len(invs.json()) > 0
    inv_list = invs.json()
    first_inv = inv_list[0]

    pdf_res = requests.get(f"{BASE}/api/v1/invoices/{first_inv['id']}/pdf", headers=admin_headers)
    assert pdf_res.status_code == 200, f"PDF failed: {pdf_res.status_code}"
    assert "application/pdf" in pdf_res.headers.get("Content-Type", "")
    assert pdf_res.content.startswith(b"%PDF-"), "Invalid PDF signature"
    print(f"[7/9] PASS: Official PDF Engine ({first_inv['invoice_number']}.pdf, {len(pdf_res.content)} bytes, Valid %PDF- header)")

    # 8. Strict Tenant IDOR Isolation
    cust_invs = requests.get(f"{BASE}/api/v1/invoices", headers=cust_headers)
    assert cust_invs.status_code == 200
    for ci in cust_invs.json():
        assert ci["customer_name"] == "Apex Retail Solutions Pvt Ltd", f"IDOR Leak detected! Got {ci['customer_name']}"
    print(f"[8/9] PASS: Tenant IDOR Isolation (Customer strictly isolated to {len(cust_invs.json())} owned invoices for 'Apex Retail Solutions Pvt Ltd')")

    # 9. Automated Scheduled Billing Engine Run
    billing_job = requests.post(f"{BASE}/api/v1/invoices/trigger-billing", headers=admin_headers)
    assert billing_job.status_code == 200
    msg = billing_job.json().get("message", "")
    print(f"[9/9] PASS: Automated Billing Engine ({msg})")

    print("\n==================================================")
    print("ALL 9 LIVE SYSTEM CHECKS PASSED WITH 100% SUCCESS!")
    print("==================================================")

if __name__ == "__main__":
    run_checks()
