from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from backend.app.seed import seed_database

# Import routers
from backend.app.routers import (
    auth_routes, user_routes, customer_routes, product_routes,
    plan_routes, quotation_routes, subscription_routes,
    invoice_routes, discount_routes, payment_routes, dashboard_routes
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    Base.metadata.create_all(bind=engine)
    # Seed default Brightloop Software data
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Enterprise standalone business subscription billing, lifecycle management and revenue engine.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for invoices
os.makedirs(settings.INVOICE_PDF_DIR, exist_ok=True)
app.mount("/invoices_pdf", StaticFiles(directory=settings.INVOICE_PDF_DIR), name="invoices_pdf")

# Register API routers with /api/v1 prefix
app.include_router(auth_routes.router, prefix=settings.API_V1_STR)
app.include_router(user_routes.router, prefix=settings.API_V1_STR)
app.include_router(customer_routes.router, prefix=settings.API_V1_STR)
app.include_router(product_routes.router, prefix=settings.API_V1_STR)
app.include_router(plan_routes.router, prefix=settings.API_V1_STR)
app.include_router(quotation_routes.router, prefix=settings.API_V1_STR)
app.include_router(subscription_routes.router, prefix=settings.API_V1_STR)
app.include_router(invoice_routes.router, prefix=settings.API_V1_STR)
app.include_router(discount_routes.router, prefix=settings.API_V1_STR)
app.include_router(payment_routes.router, prefix=settings.API_V1_STR)
app.include_router(dashboard_routes.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "system": "SUBER - Business Subscription Management System",
        "version": "1.0.0",
        "status": "OPERATIONAL",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health")
def health_check():
    return {"status": "HEALTHY", "database": "CONNECTED"}
