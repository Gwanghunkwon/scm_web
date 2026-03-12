from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """애플리케이션 전역 설정."""

    # 기본 환경
    env: str = "local"
    debug: bool = True

    # DB 연결 정보 (Supabase/Render 등에서 제공하는 URL)
    database_url: str = "postgresql://user:password@host:5432/dbname"

    # JWT 설정
    jwt_secret_key: str = "CHANGE_ME_TO_SECURE_RANDOM_VALUE"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expires_minutes: int = 60

    # CORS 허용 Origin (프론트 URL)
    cors_origins: List[str] = [
        "http://localhost:5173",
        "https://scm-web-delta.vercel.app",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

