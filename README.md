# SUBER — Business Subscription Management System

Enterprise-grade SaaS subscription lifecycle engine, automated recurring billing, real-time analytics, dynamic quotation negotiation, and official PDF invoice generation.

---

## 🔐 Login Credentials (Default Seeded Users)

The platform comes pre-seeded with 3 deterministic enterprise personas for testing and evaluation:

| Persona | Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **System Administrator** | `ADMIN` | `admin@brightloop.com` | `Brightloop#Admin2026` | Full administrative control: User management, staff permissions, coupon & discount rules, billing triggers, invoice cancellations. |
| **Sales & Operations Staff** | `STAFF` | `staff@brightloop.com` | `Brightloop#Staff2026` | Operational management: Product catalog, quotation creation, contract negotiation, customer onboarding, subscription renewals. |
| **Enterprise Customer** | `CUSTOMER` | `amit@apexretail.com` | `ApexRetail#Strong2026` | Customer self-service portal: Active subscriptions, quotation approvals, invoice review, inline PDF viewing & downloads, payment history. |

> **Self-Service Registration:** You can also register a brand-new enterprise customer account directly from the login modal under the **"Register your enterprise"** tab.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+ & npm**

### 2. Backend Setup & Startup
```bash
# From the project root (d:/odoo kochi)
# 1. Install dependencies
pip install -r requirements.txt

# 2. Seed database with real demo data (products, customers, subscriptions, invoices)
python -m backend.app.seed

# 3. Start FastAPI server (Port 8000)
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Documentation (Swagger UI): **http://localhost:8000/docs**
- OpenAPI Specification: **http://localhost:8000/openapi.json**

### 3. Frontend Setup & Startup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if needed)
npm install

# Start Vite development server (Port 5173)
npm run dev
```
- Frontend Application: **http://127.0.0.1:5173/**

---

## 📄 Invoicing & PDF Billing Workflow

- **Inline PDF Preview First:** When viewing billing invoices in either the Admin/Staff view or Customer Portal, the official PDF invoice is rendered directly on screen first inside an interactive viewer.
- **Direct Download Option:** Users can download the immutable PDF invoice file (`INV-YYYY-XXXXX.pdf`) with one click from the preview modal or directly from the table.
- **Automated Billing Engine:** Recurring billing can be triggered on demand or scheduled, generating invoices and calculating prorated cycle totals automatically.

---

## 🧪 Running Automated Tests
A comprehensive test suite verifies subscription lifecycle state transitions, quotation conversion, coupon logic, billing proration, and PDF generation:

```bash
# Run pytest from project root
python -m pytest backend/tests/test_suber.py -v
```

---

## 🛠 Tech Stack
- **Backend:** FastAPI, Python 3.12, SQLAlchemy ORM, SQLite / PostgreSQL-ready, ReportLab (PDF), Passlib & Bcrypt (Password Hashing), PyJWT (JWT Auth)
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React Icons
- **Architecture:** Clean Architecture with deterministic domain services (Billing, Analytics, Discount Engine, PDF Service)
