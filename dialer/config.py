"""Configuration management for the dialer module."""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from pydantic import BaseSettings, Field, validator


class DialerSettings(BaseSettings):
    """Application settings loaded from environment variables."""

    twilio_account_sid: str = Field(..., env="TWILIO_ACCOUNT_SID")
    twilio_auth_token: str = Field(..., env="TWILIO_AUTH_TOKEN")
    twilio_number: str = Field(..., env="TWILIO_NUMBER")
    agent_number: str = Field(..., env="AGENT_NUMBER")
    public_base_url: str = Field(..., env="PUBLIC_BASE_URL")
    dial_interval_seconds: int = Field(10, env="DIAL_INTERVAL_SECONDS")
    telephony_backend: Literal["twilio", "asterisk"] = Field(
        "twilio", env="TELEPHONY_BACKEND"
    )
    sqlite_path: Path = Field(Path("./dialer/logs.sqlite"), env="SQLITE_PATH")
    data_dir: Path = Field(Path("./dialer"), env="DIALER_DATA_DIR")
    dry_run: bool = Field(False, env="DIALER_DRY_RUN")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    @validator("sqlite_path", pre=True)
    def _expand_sqlite_path(cls, value: str | os.PathLike[str]) -> Path:  # noqa: D401
        """Ensure SQLite path expands user and env vars."""

        path = Path(str(value)).expanduser()
        if not path.is_absolute():
            path = Path.cwd() / path
        return path

    @validator("data_dir", pre=True)
    def _expand_data_dir(cls, value: str | os.PathLike[str]) -> Path:  # noqa: D401
        """Ensure data directory path is absolute."""

        path = Path(str(value)).expanduser()
        if not path.is_absolute():
            path = Path.cwd() / path
        return path


@lru_cache(maxsize=1)
def get_settings() -> DialerSettings:
    """Return cached settings instance."""

    load_dotenv()
    settings = DialerSettings()
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    settings.sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    return settings


settings = get_settings()
