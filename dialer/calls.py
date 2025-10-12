"""Telephony integrations and dialing orchestration."""
from __future__ import annotations

import logging
import time
import uuid
from dataclasses import dataclass
from typing import Callable, Protocol

from .config import settings
from .storage import storage

logger = logging.getLogger(__name__)


class TelephonyClient(Protocol):
    """Protocol that outbound telephony backends must implement."""

    def place_call(self, target_number: str) -> str:  # pragma: no cover - interface only
        """Place a call to the target number and return a call SID."""


class TwilioClient:
    """Twilio Programmable Voice implementation."""

    def __init__(self) -> None:
        from twilio.rest import Client  # imported lazily to aid mocking/testing

        self.client = Client(settings.twilio_account_sid, settings.twilio_auth_token)

    def place_call(self, target_number: str) -> str:
        call = self.client.calls.create(
            to=target_number,
            from_=settings.twilio_number,
            url=f"{settings.public_base_url}/voice",
            status_callback=f"{settings.public_base_url}/status",
            status_callback_event=["initiated", "ringing", "answered", "completed"],
        )
        return call.sid


class AsteriskClient:
    """Placeholder for optional Asterisk ARI backend."""

    def place_call(self, target_number: str) -> str:  # pragma: no cover - placeholder
        raise NotImplementedError("Asterisk backend not implemented yet.")


def get_client() -> TelephonyClient:
    if settings.telephony_backend == "twilio":
        return TwilioClient()
    if settings.telephony_backend == "asterisk":
        return AsteriskClient()
    raise ValueError(f"Unknown telephony backend: {settings.telephony_backend}")


@dataclass
class DialResult:
    number: str
    call_sid: str
    status: str
    skipped: bool = False
    reason: str | None = None


ProgressCallback = Callable[[DialResult], None]
ShouldStop = Callable[[], bool]


class DialerRunner:
    """Coordinates sequential dialing with rate limiting."""

    def __init__(self, client: TelephonyClient | None = None) -> None:
        self.client = client or get_client()

    def run(
        self,
        numbers: list[str],
        progress: ProgressCallback | None = None,
        should_stop: ShouldStop | None = None,
    ) -> None:
        """Dial the provided numbers sequentially respecting DNC and rate limits."""

        for number in numbers:
            if should_stop and should_stop():
                logger.info("Dialer stopped before calling %s", number)
                break
            if storage.is_dnc(number):
                result = DialResult(
                    number=number,
                    call_sid="",
                    status="skipped",
                    skipped=True,
                    reason="Number on DNC list",
                )
                storage.log_call_event(
                    f"dnc-skip-{uuid.uuid4()}",
                    number,
                    "skipped",
                    {"reason": result.reason},
                )
                if progress:
                    progress(result)
                continue

            try:
                call_sid = self._place_call(number)
            except Exception as exc:  # pragma: no cover - network failure path
                logger.exception("Failed to place call to %s", number)
                storage.log_call_event("error", number, "error", {"error": str(exc)})
                if progress:
                    progress(
                        DialResult(
                            number=number,
                            call_sid="",
                            status="error",
                            reason=str(exc),
                        )
                    )
                time.sleep(settings.dial_interval_seconds)
                continue

            storage.log_call_event(call_sid, number, "initiated", {})
            if progress:
                progress(DialResult(number=number, call_sid=call_sid, status="initiated"))
            if should_stop and should_stop():
                logger.info("Dialer stop requested after calling %s", number)
                break
            time.sleep(settings.dial_interval_seconds)

    def _place_call(self, number: str) -> str:
        if settings.dry_run:
            fake_sid = f"dryrun-{uuid.uuid4()}"
            logger.info("Dry-run: pretending to call %s", number)
            return fake_sid
        return self.client.place_call(number)


__all__ = ["DialerRunner", "DialResult", "get_client"]
