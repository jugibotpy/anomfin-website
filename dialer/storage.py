"""Persistent storage utilities for the dialer."""
from __future__ import annotations

import json
import sqlite3
import threading
from datetime import datetime
from pathlib import Path
from typing import Iterable, List

from .config import settings

_NUMBERS_FILE = settings.data_dir / "numbers.json"
_DNC_FILE = settings.data_dir / "dnc.json"
_DB_PATH = settings.sqlite_path

_LOCK = threading.RLock()


class DialerStorage:
    """Helpers for working with number lists, DNC and logs."""

    def __init__(self) -> None:
        self.numbers_file = _NUMBERS_FILE
        self.dnc_file = _DNC_FILE
        self.db_path = _DB_PATH
        self._ensure_files()
        self._ensure_database()

    # ------------------------------------------------------------------
    # Number list helpers
    # ------------------------------------------------------------------
    def list_numbers(self) -> List[str]:
        """Return the active dialing numbers."""

        with _LOCK:
            with self.numbers_file.open("r", encoding="utf-8") as fh:
                return json.load(fh)

    def save_numbers(self, numbers: Iterable[str]) -> None:
        """Persist unique numbers, preserving ordering."""

        seen = set()
        unique_numbers = []
        for number in numbers:
            if number not in seen:
                unique_numbers.append(number)
                seen.add(number)

        with _LOCK:
            with self.numbers_file.open("w", encoding="utf-8") as fh:
                json.dump(unique_numbers, fh, indent=2)

    def append_numbers(self, numbers: Iterable[str]) -> List[str]:
        """Append new numbers and return resulting list."""

        with _LOCK:
            existing_list = self.list_numbers()
            existing = set(existing_list)
            merged = list(existing_list)
            for number in numbers:
                if number not in existing:
                    merged.append(number)
                    existing.add(number)
            self.save_numbers(merged)
            return merged

    def clear_numbers(self) -> None:
        """Remove all queued numbers."""

        self.save_numbers([])

    # ------------------------------------------------------------------
    # DNC helpers
    # ------------------------------------------------------------------
    def list_dnc(self) -> List[str]:
        with _LOCK:
            with self.dnc_file.open("r", encoding="utf-8") as fh:
                return json.load(fh)

    def add_to_dnc(self, number: str) -> None:
        with _LOCK:
            entries = set(self.list_dnc())
            if number not in entries:
                entries.add(number)
                with self.dnc_file.open("w", encoding="utf-8") as fh:
                    json.dump(sorted(entries), fh, indent=2)

    def is_dnc(self, number: str) -> bool:
        return number in set(self.list_dnc())

    # ------------------------------------------------------------------
    # Logging helpers
    # ------------------------------------------------------------------
    def log_call_event(self, call_sid: str, number: str, event: str, payload: dict) -> None:
        self._execute(
            """
            INSERT INTO call_events(call_sid, number, event, ts, payload_json)
            VALUES(?, ?, ?, ?, ?)
            """,
            (
                call_sid,
                number,
                event,
                datetime.utcnow().isoformat(),
                json.dumps(payload, ensure_ascii=False),
            ),
        )

    def log_consent(self, number: str, action: str, source: str) -> None:
        self._execute(
            """
            INSERT INTO consents(number, action, ts, source)
            VALUES(?, ?, ?, ?)
            """,
            (number, action, datetime.utcnow().isoformat(), source),
        )

    def log_input(self, number: str, source: str) -> None:
        self._execute(
            """
            INSERT INTO inputs(number, ts, source)
            VALUES(?, ?, ?)
            """,
            (number, datetime.utcnow().isoformat(), source),
        )

    def recent_events(self, limit: int = 20) -> List[sqlite3.Row]:
        return list(
            self._query(
                """
                SELECT call_sid, number, event, ts
                FROM call_events
                ORDER BY ts DESC
                LIMIT ?
                """,
                (limit,),
            )
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _ensure_files(self) -> None:
        for path in (self.numbers_file, self.dnc_file):
            if not path.exists():
                path.parent.mkdir(parents=True, exist_ok=True)
                with path.open("w", encoding="utf-8") as fh:
                    json.dump([], fh)

    def _ensure_database(self) -> None:
        self._execute(
            """
            CREATE TABLE IF NOT EXISTS call_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                call_sid TEXT,
                number TEXT,
                event TEXT,
                ts TEXT,
                payload_json TEXT
            )
            """
        )
        self._execute(
            """
            CREATE TABLE IF NOT EXISTS consents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                number TEXT,
                action TEXT,
                ts TEXT,
                source TEXT
            )
            """
        )
        self._execute(
            """
            CREATE TABLE IF NOT EXISTS inputs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                number TEXT,
                ts TEXT,
                source TEXT
            )
            """
        )

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _execute(self, sql: str, params: tuple | None = None) -> None:
        params = params or ()
        with _LOCK:
            with self._connect() as conn:
                conn.execute(sql, params)
                conn.commit()

    def _query(self, sql: str, params: tuple | None = None) -> Iterable[sqlite3.Row]:
        params = params or ()
        with _LOCK:
            with self._connect() as conn:
                cursor = conn.execute(sql, params)
                rows = cursor.fetchall()
        return rows


storage = DialerStorage()
