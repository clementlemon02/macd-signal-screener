from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "MACD Signal Screener"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Polygon.io settings
    POLYGON_API_KEY: str
    POLYGON_BASE_URL: str = "https://api.polygon.io"
    
    # Supabase settings
    SUPABASE_URL: str
    SUPABASE_KEY: str
    
    # CORS settings
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
