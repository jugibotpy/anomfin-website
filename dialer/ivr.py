"""IVR flows for the outbound campaign."""
from __future__ import annotations

from twilio.twiml.voice_response import Gather, VoiceResponse

from .config import settings
from .storage import storage


INTRO_MESSAGE = (
    "Moi, tervetuloa Harjun Raskaskone Oy:n kyselyyn. "
    "Paina 1 jos haluat osallistua, paina 2 jos et."
)
THANK_YOU_MESSAGE = "Kiitos ajastasi. Hyvää päivänjatkoa!"
INVALID_MESSAGE = "Emme ymmärtäneet valintaasi. Puhelu päättyy nyt."


def initial_prompt() -> str:
    """Return TwiML for the initial gather prompt."""

    response = VoiceResponse()
    gather: Gather = response.gather(
        num_digits=1,
        action=f"{settings.public_base_url}/gather",
        method="POST",
        timeout=10,
        input="dtmf",
        language="fi-FI",
    )
    gather.say(INTRO_MESSAGE, language="fi-FI", voice="Polly.Veera")
    response.redirect(f"{settings.public_base_url}/voice")
    return str(response)


def handle_selection(digits: str, caller: str) -> str:
    """Return TwiML based on the caller's keypad selection."""

    response = VoiceResponse()
    if digits == "1":
        storage.log_consent(caller, "accepted", "ivr")
        dial = response.dial(callerId=settings.twilio_number)
        dial.number(settings.agent_number)
        response.say("Yhdistetään asiantuntijalle.", language="fi-FI", voice="Polly.Veera")
        return str(response)
    if digits == "2":
        storage.log_consent(caller, "declined", "ivr")
        response.say(THANK_YOU_MESSAGE, language="fi-FI", voice="Polly.Veera")
        response.hangup()
        return str(response)

    response.say(INVALID_MESSAGE, language="fi-FI", voice="Polly.Veera")
    response.hangup()
    return str(response)


def fallback_message() -> str:
    response = VoiceResponse()
    response.say(INVALID_MESSAGE, language="fi-FI", voice="Polly.Veera")
    response.hangup()
    return str(response)


__all__ = ["initial_prompt", "handle_selection", "fallback_message"]
