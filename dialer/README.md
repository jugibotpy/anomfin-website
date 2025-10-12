# Harjun Raskaskone Dialer

Jugi@AnomFIN suunnittelema outbound-dialer Harjun Raskaskone Oy:n sarjapuhelukampanjoihin. Moduuli tarjoaa sekä Linux-terminaalissa toimivan TUI:n että FastAPI-pohjaisen web-käyttöliittymän Twilio Programmable Voice -integraatiolla.

## Ominaisuudet

- ✅ Numerolistan validointi ja normalisointi E.164-muotoon (Suomi oletus).
- ✅ DNC-listan hallinta – jokainen estetty numero ohitetaan automaattisesti.
- ✅ Yksi aktiivinen soitto kerrallaan, konfiguroitava viive `DIAL_INTERVAL_SECONDS`.
- ✅ Suomenkielinen IVR (Twilio TTS + DTMF): paina 1 → yhdistä agentille, paina 2 → kiitosviesti ja lopetus.
- ✅ Lokitus SQLite-tietokantaan: call_events, consents ja inputs.
- ✅ Sama ydinlogiikka TUI- ja web-käyttöliittymälle.
- ✅ Dry-run tila kehitystä varten.

## Asennus

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r dialer/requirements.txt
cp dialer/.env.example .env
```

Täytä `.env` Twilio-tunnuksilla ja numeroilla. Varmista, että `PUBLIC_BASE_URL` osoittaa julkisesti saatavilla olevaan osoitteeseen (esim. ngrok).

## Käyttö

### TUI (Linux-terminaali)

```bash
python -m dialer.cli_tui
```

Valikoista löytyy numeronsyöttö, DNC-hallinta, sarjasoitto sekä asetusten tarkistus. Sarjapuhelu voidaan keskeyttää `Ctrl+C`.

### Web UI + webhookit

```bash
python -m dialer.server
```

- Avaudu selaimella osoitteeseen [http://127.0.0.1:8000](http://127.0.0.1:8000) tai käytä tekstipohjaista selainta (esim. `lynx`).
- Ngrok: `ngrok http 8000` ja päivitä `.env` → `PUBLIC_BASE_URL=https://<ngrok-id>.ngrok-free.app`.
- Twilio webhookit:
  - `POST /voice` alkuperäinen TwiML + Gather
  - `POST /gather` DTMF-tulkinta ja reititys
  - `POST /status` soiton tilapäivitykset

### Compliance ja turvallisuus

- Näkyvä Caller ID (`TWILIO_NUMBER`).
- Opt-out tallentuu consent-lokiin (DTMF valinta 2).
- DNC-lista estää soitot estetyille numeroille.
- Hallittu soittonopeus (`DIAL_INTERVAL_SECONDS`).
- Lokit säilyvät `logs.sqlite`-tietokannassa auditointia varten.

## Kehitysvinkit

- `DIALER_DRY_RUN=true` mahdollistaa logiikan testaamisen ilman oikeita puheluita.
- Sovellus on modulaarinen – backendin voi korvata Asterisk ARI -toteutuksella (`TELEPHONY_BACKEND=asterisk`).
- Web UI käyttää HTMX:ää reaaliaikaisiin päivityksiin.

## Projektin rakenne

```
dialer/
  cli_tui.py        # Terminaalipohjainen käyttöliittymä
  server.py         # FastAPI + webhookit + web-UI
  calls.py          # Twilio/Asterisk abstraktio ja soiton orkestrointi
  config.py         # Ympäristökonfiguraatio (python-dotenv + Pydantic)
  storage.py        # numbers.json, dnc.json ja SQLite-lokit
  ivr.py            # TwiML ja IVR-virta
  utils.py          # Numeronormalisoinnit ym. työkalut
  webui/            # HTMX-pohjaiset templatet ja tyyli
```

## Tietoturva

- Älä koskaan commitoi oikeita Twilio-tunnuksia.
- Suojaa webhookit esim. Twilion `X-Twilio-Signature`-otsakkeella tuotannossa.
- Pidä `logs.sqlite` suojatussa hakemistossa ja varmista varmuuskopiot.

---

Rakennettu intohimolla ja viimeistellyllä käyttöliittymällä – AnomFIN®.
