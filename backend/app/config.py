from pydantic_settings import BaseSettings, SettingsConfigDict
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Groq (LLM provider)
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    # Gemini (Embeddings)
    gemini_api_key: str = ""

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""

    # App
    environment: str = "development"
    allowed_origins: str = "http://localhost:3000"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


# Cached singleton — re-created when module reloads (uvicorn --reload)
_settings: Settings | None = None

def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
