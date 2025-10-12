"""FastAPI server combining webhook handlers and the Web UI."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI, Form, Request
from fastapi.responses import JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from .ivr import handle_selection, initial_prompt
from .storage import storage
from .webui.routes import configure_templates, router

logger = logging.getLogger("dialer.server")

app = FastAPI(title="Harjun Raskaskone Dialer")

_templates_path = Path(__file__).parent / "webui" / "templates"
templates = Jinja2Templates(directory=str(_templates_path))
_static_path = Path(__file__).parent / "webui" / "static"
app.mount("/static", StaticFiles(directory=str(_static_path)), name="static")

configure_templates(templates)
app.include_router(router)


@app.post("/voice", response_class=PlainTextResponse)
async def voice_webhook() -> PlainTextResponse:
    return PlainTextResponse(initial_prompt(), media_type="application/xml")


@app.post("/gather", response_class=PlainTextResponse)
async def gather_webhook(Digits: str = Form(""), From: str = Form("")) -> PlainTextResponse:  # noqa: N803
    twiml = handle_selection(Digits, From)
    return PlainTextResponse(twiml, media_type="application/xml")


@app.post("/status")
async def status_webhook(request: Request) -> JSONResponse:
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        payload: Dict[str, Any] = await request.json()
    else:
        form = await request.form()
        payload = dict(form)
    call_sid = payload.get("CallSid", "unknown")
    number = payload.get("To", "")
    event = payload.get("CallStatus", payload.get("CallEvent", "unknown"))
    storage.log_call_event(call_sid, number, event, payload)
    return JSONResponse({"ok": True})


def main() -> None:  # pragma: no cover - CLI entrypoint
    import uvicorn

    uvicorn.run("dialer.server:app", host="0.0.0.0", port=8000, reload=False)


if __name__ == "__main__":  # pragma: no cover
    main()
