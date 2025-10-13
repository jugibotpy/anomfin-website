"""Terminal user interface for the dialer."""
from __future__ import annotations

import sys
import time

from prompt_toolkit import HTML, PromptSession
from prompt_toolkit.styles import Style

from .calls import DialResult, DialerRunner
from .config import settings
from .storage import storage
from .utils import normalize_number

MENU = HTML(
    "<b>Harjun Raskaskone – Dialer v1</b>\n"
    "1) Syötä puhelinnumerot\n"
    "2) Soita puheluita\n"
    "3) Näytä numerot\n"
    "4) Lisää numero DNC-listalle\n"
    "5) Tyhjennä numerolista\n"
    "6) Asetukset\n"
    "0) Poistu\n"
)

STYLE = Style.from_dict({"prompt": "ansicyan"})


def mask(value: str, visible: int = 4) -> str:
    if len(value) <= visible:
        return value
    return f"{'*' * (len(value) - visible)}{value[-visible:]}"


def prompt_loop() -> None:
    session = PromptSession(style=STYLE)

    while True:
        print(MENU)
        choice = session.prompt(HTML("<prompt>Valinta: </prompt>"))
        if choice == "1":
            collect_numbers(session)
        elif choice == "2":
            run_dialer()
        elif choice == "3":
            show_numbers()
        elif choice == "4":
            add_dnc(session)
        elif choice == "5":
            confirm = session.prompt(HTML("<prompt>Tyhjennetäänkö lista? (y/n): </prompt>"))
            if confirm.lower().startswith("y"):
                storage.clear_numbers()
                print("Numerolista tyhjennetty.")
        elif choice == "6":
            show_settings()
        elif choice == "0":
            print("Hei hei!")
            return
        else:
            print("Tuntematon valinta.")


def collect_numbers(session: PromptSession) -> None:
    print("Syötä numeroita (kirjoita /done lopettaaksesi):")
    while True:
        raw = session.prompt(HTML("<prompt>Numero: </prompt>"))
        if raw.strip().lower() == "/done":
            break
        try:
            normalized = normalize_number(raw)
        except Exception as exc:  # pragma: no cover - validation feedback
            print(f"Virhe: {exc}")
            continue
        storage.append_numbers([normalized])
        storage.log_input(normalized, "tui")
        print(f"Tallennettu {normalized}")


def run_dialer() -> None:
    numbers = storage.list_numbers()
    if not numbers:
        print("Numerolista on tyhjä.")
        return

    runner = DialerRunner()

    def progress(result: DialResult) -> None:
        status = result.status
        if result.skipped:
            status = f"skipped ({result.reason})"
        print(f"[{result.number}] {status}")

    print("Aloitetaan sarjasoitto. Keskeytä Ctrl+C.")
    try:
        runner.run(numbers, progress=progress)
    except KeyboardInterrupt:  # pragma: no cover - user interaction
        print("Soitto keskeytetty.")
    finally:
        time.sleep(0.5)


def show_numbers() -> None:
    numbers = storage.list_numbers()
    if not numbers:
        print("Ei tallennettuja numeroita.")
        return
    for idx, number in enumerate(numbers, start=1):
        marker = " (DNC)" if storage.is_dnc(number) else ""
        print(f"#{idx}: {number}{marker}")


def add_dnc(session: PromptSession) -> None:
    raw = session.prompt(HTML("<prompt>DNC-numero: </prompt>"))
    try:
        normalized = normalize_number(raw)
    except Exception as exc:  # pragma: no cover
        print(f"Virhe: {exc}")
        return
    storage.add_to_dnc(normalized)
    print(f"Lisättiin {normalized} DNC-listalle.")


def show_settings() -> None:
    print("Asetukset:")
    print(f"  Twilio Account SID: {mask(settings.twilio_account_sid)}")
    print(f"  Twilio Number: {settings.twilio_number}")
    print(f"  Agent Number: {settings.agent_number}")
    print(f"  Public Base URL: {settings.public_base_url}")
    print(f"  Dial interval (s): {settings.dial_interval_seconds}")
    print(f"  Backend: {settings.telephony_backend}")
    print(f"  SQLite polku: {settings.sqlite_path}")
    print(f"  Dry-run: {settings.dry_run}")


def main() -> None:  # pragma: no cover - CLI entrypoint
    try:
        prompt_loop()
    except KeyboardInterrupt:
        print("\nSuljetaan...")
        sys.exit(0)


if __name__ == "__main__":  # pragma: no cover
    main()
