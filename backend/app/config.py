import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "SUBER - Business Subscription Management System"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "suber-enterprise-secret-key-super-secure-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours for seamless hackathon testing
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./suber.db")
    INVOICE_PDF_DIR: str = os.getenv("INVOICE_PDF_DIR", "./generated_invoices")

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


settings = Settings()

# Ensure PDF storage directory exists
os.makedirs(settings.INVOICE_PDF_DIR, exist_ok=True)
