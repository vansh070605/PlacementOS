import os
import logging
from typing import Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("placementos.config")

class Settings(BaseSettings):
    """
    Configuration settings for the PlacementOS backend application.
    Loads values from environment variables or a local .env file.
    """

    # Gemini API Key (required for agents, but optional during initialization check)
    gemini_api_key: Optional[str] = None

    # Gemini model selection
    gemini_model: str = "gemini-1.5-flash"
    embedding_model: str = "gemini-embedding-2"

    # FastAPI Server parameters
    host: str = "0.0.0.0"
    port: int = 8000

    # Local paths for Chroma DB and seeding files
    chroma_db_dir: str = "data/chroma"
    portfolio_json_path: str = "portfolio.json"

    # Settings config to prioritize loading from the root of backend directory
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("gemini_model")
    def validate_gemini_model(cls, v: str) -> str:
        allowed = {"gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.5-flash", "gemini-1.0-pro"}
        if v not in allowed:
            logger.warning(f"Gemini model '{v}' not recognized. Falling back to default 'gemini-1.5-flash'.")
            return "gemini-1.5-flash"
        return v

    @field_validator("embedding_model")
    def validate_embedding_model(cls, v: str) -> str:
        allowed = {"gemini-embedding-2"}
        if v not in allowed:
            logger.warning(f"Embedding model '{v}' not recognized. Falling back to default 'gemini-embedding-2'.")
            return "gemini-embedding-2"
        return v

# Instantiate settings singleton
settings = Settings()
