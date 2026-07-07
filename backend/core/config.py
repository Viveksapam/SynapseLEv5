from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./db.sqlite3"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    GEMINI_API_KEY: str = ""
    USE_MOCK_LLM: bool = True  # Set to False in production
    RESEND_API_KEY: str = ""
    VERIFICATION_EMAIL_FROM: str = "The Synapse LE Team <noreply@synapseislive.com>"

    class Config:
        env_file = ".env"

settings = Settings()
