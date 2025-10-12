"""FastAPI routes powering the dialer Web UI."""
from __future__ import annotations

import threading
from typing import Any, Dict, List

from fastapi import APIRouter, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

from ..calls import DialResult, DialerRunner
from ..config import settings
from ..storage import storage
from ..utils import normalize_number

router = APIRouter()
_templates: Jinja2Templates | None = None


def configure_templates(templates: Jinja2Templates) -> None:
    global _templates
    _templates = templates
    _templates.env.filters.setdefault("mask", mask)


class DialingState(BaseModel):
    running: bool = False
    current_number: str | None = None
    current_status: str | None = None
    recent_results: List[Dict[str, Any]] = []


class DialerController:
    def __init__(self) -> None:
        self._runner = DialerRunner()
        self._thread: threading.Thread | None = None
        self._stop = threading.Event()
        self.state = DialingState()
        self._lock = threading.Lock()

    def start(self) -> bool:
        with self._lock:
            if self._thread and self._thread.is_alive():
                return False
            numbers = storage.list_numbers()
            if not numbers:
                return False
            self._stop.clear()
            self.state.running = True
            self.state.recent_results = []
            self._thread = threading.Thread(target=self._run, args=(numbers,), daemon=True)
            self._thread.start()
            return True

    def stop(self) -> None:
        self._stop.set()
        with self._lock:
            self.state.running = False
            self.state.current_number = None
            self.state.current_status = None
        thread = self._thread
        if thread and thread.is_alive() and thread is not threading.current_thread():
            thread.join(timeout=0.1)
        if not thread or not thread.is_alive():
            self._thread = None

    def _run(self, numbers: list[str]) -> None:
        def progress(result: DialResult) -> None:
            with self._lock:
                self.state.current_number = result.number
                self.state.current_status = result.status
                recent = list(self.state.recent_results)
                recent.insert(0, result.__dict__)
                self.state.recent_results = recent[:10]

        try:
            self._runner.run(
                numbers,
                progress=progress,
                should_stop=self._stop.is_set,
            )
        finally:
            with self._lock:
                self.state.running = False
                self.state.current_number = None
                self.state.current_status = None
            self._stop.set()
            self._thread = None

    def snapshot(self) -> DialingState:
        with self._lock:
            return DialingState(**self.state.dict())


controller = DialerController()


def mask(value: str, visible: int = 4) -> str:
    if value is None:
        return ""
    if len(value) <= visible:
        return value
    return "*" * (len(value) - visible) + value[-visible:]


def get_templates() -> Jinja2Templates:
    if _templates is None:  # pragma: no cover - defensive
        raise RuntimeError("Templates not configured")
    return _templates


@router.get("/", response_class=HTMLResponse)
async def dashboard(request: Request) -> HTMLResponse:
    templates = get_templates()
    state = controller.snapshot()
    context = {
        "request": request,
        "state": state,
        "numbers": storage.list_numbers(),
        "dnc": storage.list_dnc(),
        "events": storage.recent_events(),
        "settings": settings,
    }
    return templates.TemplateResponse("index.html", context)


@router.get("/numbers", response_class=HTMLResponse)
async def numbers_partial(request: Request) -> HTMLResponse:
    templates = get_templates()
    context = {
        "request": request,
        "numbers": storage.list_numbers(),
        "dnc": storage.list_dnc(),
    }
    return templates.TemplateResponse("numbers.html", context)


@router.post("/numbers", response_class=HTMLResponse)
async def add_number(request: Request, number: str = Form(...)) -> HTMLResponse:
    templates = get_templates()
    try:
        normalized = normalize_number(number)
    except Exception as exc:  # pragma: no cover - validation path
        return HTMLResponse(str(exc), status_code=400)
    storage.append_numbers([normalized])
    storage.log_input(normalized, "web")
    context = {
        "request": request,
        "numbers": storage.list_numbers(),
        "dnc": storage.list_dnc(),
    }
    return templates.TemplateResponse("numbers.html", context)


@router.post("/numbers/clear", response_class=HTMLResponse)
async def clear_numbers(request: Request) -> HTMLResponse:
    templates = get_templates()
    storage.clear_numbers()
    context = {
        "request": request,
        "numbers": storage.list_numbers(),
        "dnc": storage.list_dnc(),
    }
    return templates.TemplateResponse("numbers.html", context)


@router.post("/dnc", response_class=HTMLResponse)
async def add_dnc(request: Request, number: str = Form(...)) -> HTMLResponse:
    templates = get_templates()
    try:
        normalized = normalize_number(number)
    except Exception as exc:  # pragma: no cover
        return HTMLResponse(str(exc), status_code=400)
    storage.add_to_dnc(normalized)
    context = {
        "request": request,
        "numbers": storage.list_numbers(),
        "dnc": storage.list_dnc(),
        "settings": settings,
    }
    return templates.TemplateResponse("settings.html", context)


@router.get("/dialing", response_class=HTMLResponse)
async def dialing_partial(request: Request) -> HTMLResponse:
    templates = get_templates()
    context = {"request": request, "state": controller.snapshot()}
    return templates.TemplateResponse("dialing.html", context)


@router.post("/dialing/start")
async def start_dialing() -> JSONResponse:
    if controller.start():
        return JSONResponse({"status": "started"})
    return JSONResponse({"status": "idle"})


@router.post("/dialing/stop")
async def stop_dialing() -> JSONResponse:
    controller.stop()
    return JSONResponse({"status": "stopped"})


@router.get("/dialing/status")
async def dialing_status() -> JSONResponse:
    state = controller.snapshot()
    return JSONResponse(state.dict())


@router.get("/settings", response_class=HTMLResponse)
async def settings_partial(request: Request) -> HTMLResponse:
    templates = get_templates()
    context = {
        "request": request,
        "settings": settings,
        "dnc": storage.list_dnc(),
    }
    return templates.TemplateResponse("settings.html", context)


__all__ = [
    "router",
    "configure_templates",
    "controller",
]
