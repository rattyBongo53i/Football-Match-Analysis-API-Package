# app/config/settings.py
import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import ConfigDict
import logging

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    """Application settings for XAMPP MySQL."""
    
    # XAMPP MySQL settings
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_NAME: str = os.getenv("DB_NAME", "polygot")
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")  # Empty for XAMPP
    DB_CHARSET: str = os.getenv("DB_CHARSET", "utf8mb4")
    
    # Database pool settings
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "5"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "10"))
    DB_POOL_RECYCLE: int = int(os.getenv("DB_POOL_RECYCLE", "3600"))
    
    # Application settings
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    APP_NAME: str = "Betting Slip Generator API"
    
    model_config = ConfigDict(
        env_file=".env",
        extra="allow"
    )
    
    @property
    def DATABASE_URL(self) -> str:
        """Construct MySQL URL for XAMPP."""
        # XAMPP usually has empty password
        if self.DB_PASSWORD:
            return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset={self.DB_CHARSET}"
        else:
            return f"mysql+pymysql://{self.DB_USER}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset={self.DB_CHARSET}"

# Create settings instance
settings = Settings()
logger.info(f"XAMPP MySQL: {settings.DB_USER}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
logger.info(f"Database URL: {settings.DATABASE_URL}")