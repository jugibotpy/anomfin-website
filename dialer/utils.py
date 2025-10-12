"""Utility helpers for the dialer."""
from __future__ import annotations

import phonenumbers
from phonenumbers import PhoneNumberFormat


def normalize_number(value: str, default_region: str = "FI") -> str:
    """Convert arbitrary phone input into E.164 format."""

    parsed = phonenumbers.parse(value, default_region)
    if not phonenumbers.is_possible_number(parsed) or not phonenumbers.is_valid_number(parsed):
        raise ValueError("Numero ei ole kelvollinen")
    return phonenumbers.format_number(parsed, PhoneNumberFormat.E164)
