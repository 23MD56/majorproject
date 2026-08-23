"""Configuration settings for QuantNiti."""

from pathlib import Path
from pydantic import BaseModel, Field


class Settings(BaseModel):
    app_name: str = "QuantNiti Market Data & Portfolio Intelligence"
    environment: str = "development"
    api_v1_prefix: str = "/api"
    data_dir: Path = Path("./data")
    cache_dir: Path = Path("./data/cache")
    cache_ttl_seconds: int = 3600 * 12  # 12 hours cache TTL
    default_history_period_years: int = 5


settings = Settings()
