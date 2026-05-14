from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Gemini
    gemini_api_key: str = ""

    # Pinecone
    pinecone_api_key: str = ""
    pinecone_index: str = "veridoc-index"

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""

    # App
    environment: str = "development"
    allowed_origins: str = "http://localhost:3000"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
