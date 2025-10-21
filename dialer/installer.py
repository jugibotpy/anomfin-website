#!/usr/bin/env python3
"""
installer.py

Interaktiivinen asennus- ja konfigurointiskripti webhook-kuuntelijalle, ngrokille ja GitHub-webhookille.
Suomeksi ja suunniteltu käynnistettäväksi Kali Linux / Ubuntu -tyyppisissä ympäristöissä.

Toiminnot (valinnainen järjestyksessä, skripti kysyy):
 - tarkistaa tarvittavat järjestelmäkomennot (python3, pip, git, curl)
 - luo virtualenvin ja asentaa riippuvuudet (Flask, python-dotenv, requests)
 - kirjoittaa .env-tiedoston (kysyy TELEGRAM_KEY, WEBHOOK_SECRET, GITHUB_TOKEN jne.)
 - luo webhook_listener.py -sovelluksen projektikansioon
 - lataa ngrokin (jos puuttuu) ja kysyy haluatko asettaa authtokenin
 - käynnistää ngrokin taustalle ja hakee julkisen osoitteen
 - (valinnainen) luo GitHub webhookin käyttäjän antamiin repository-tietoihin
 - (valinnainen) luo systemd-palvelun webhook-kuuntelijalle

Käyttö:
    sudo python3 installer.py
tai normaalikäyttäjänä, mutta jotkin asennukset (apt) vaativat sudo-oikeuksia.

Suunniteltu vahvaan virheenkäsittelyyn — kaikki kriittiset vaiheet raportoidaan ja lokitetaan installer.log-tiedostoon.
"""
from __future__ import annotations
import os
import sys
import subprocess
import shutil
import platform
import json
import time
import zipfile
import tempfile
from pathlib import Path
from getpass import getpass

# We will import requests and dotenv later inside functions after ensuring pip installs them
REQUIRED_SYSTEM_CMDS = ["python3", "pip3", "git", "curl"]

PROJECT_DIR = Path.cwd() / "webhook_project"
VENV_DIR = PROJECT_DIR / ".venv"
LOGFILE = PROJECT_DIR / "installer.log"
WEBHOOK_PY = PROJECT_DIR / "webhook_listener.py"
ENV_FILE = PROJECT_DIR / ".env"
SYSTEMD_SERVICE = f"webhook_listener_{os.getlogin()}.service"
NGROK_BIN = PROJECT_DIR / "ngrok"

# Utilities & Logging
def log(msg: str, level: str = "INFO") -> None:
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    out = f"[{timestamp}] {level}: {msg}"
    print(out)
    try:
        PROJECT_DIR.mkdir(parents=True, exist_ok=True)
        with open(LOGFILE, "a", encoding="utf-8") as f:
            f.write(out + "\n")
    except Exception:
        # If logging fails, we still continue but print a warning
        print("WARNING: Could not write to installer log.")

def run_cmd(cmd: list[str], check: bool = True, capture_output: bool = False, env=None, timeout: int = 300):
    """Run external command with robust error handling."""
    log(f"Executing: {' '.join(map(str, cmd))}")
    try:
        res = subprocess.run(cmd, check=check, capture_output=capture_output, text=True, env=env, timeout=timeout)
        if capture_output:
            return res.stdout.strip()
        return ""
    except subprocess.CalledProcessError as e:
        log(f"Command failed: {' '.join(map(str, cmd))} | exit {e.returncode} | stderr: {e.stderr.strip() if e.stderr else ''}", "ERROR")
        raise
    except FileNotFoundError:
        log(f"Command not found: {cmd[0]}", "ERROR")
        raise
    except subprocess.TimeoutExpired:
        log(f"Command timed out: {' '.join(map(str, cmd))}", "ERROR")
        raise

def check_command_exists(cmd: str) -> bool:
    return shutil.which(cmd) is not None

def confirm(prompt: str, default: bool = True) -> bool:
    yes = "Y/n" if default else "y/N"
    while True:
        ans = input(f"{prompt} [{yes}]: ").strip().lower()
        if ans == "" and default:
            return True
        if ans == "" and not default:
            return False
        if ans in ("y", "yes"):
            return True
        if ans in ("n", "no"):
            return False
        print("Vastaa 'y' tai 'n'.")

# Step functions
def preflight_checks():
    log("Aloitetaan preflight-tarkistukset")
    missing = [c for c in REQUIRED_SYSTEM_CMDS if not check_command_exists(c)]
    if missing:
        log(f"Puuttuvat järjestelmäkomennot: {', '.join(missing)}", "ERROR")
        print("Seuraavat työkalut puuttuvat ja ne pitää asentaa ennen jatkamista:")
        for m in missing:
            print(f" - {m}")
        print("\nYritän tarjota asennusohjeet (vain Debian/Ubuntu-tyyppisille alustoille).")
        if confirm("Haluatko, että yritän asentaa puuttuvat paketit apt:llä (sudo tarvitaan)?", default=False):
            try:
                run_cmd(["sudo", "apt", "update"])
                run_cmd(["sudo", "apt", "install", "-y"] + missing)
                log("Asennus yritetty apt:llä.")
            except Exception:
                log("apt-asennus epäonnistui. Jatketaan, mutta saatat kohdata virheitä.", "ERROR")
        else:
            raise SystemExit("Keskeytetty: pakolliset työkalut puuttuvat.")
    # Check Python version
    if sys.version_info < (3, 8):
        raise SystemExit("Vaaditaan Python 3.8 tai uudempi. Asenna uudempi Python-versio.")
    log("Preflight ok")

def create_project_structure():
    try:
        PROJECT_DIR.mkdir(parents=True, exist_ok=True)
        (PROJECT_DIR / "logs").mkdir(exist_ok=True)
        log(f"Projektikansio luotu: {PROJECT_DIR}")
    except Exception as e:
        log(f"Projektikansion luonti epäonnistui: {e}", "ERROR")
        raise

def create_virtualenv_and_install():
    log("Luodaan virtualenv ja asennetaan Python-riippuvuudet")
    try:
        if not VENV_DIR.exists():
            run_cmd(["python3", "-m", "venv", str(VENV_DIR)])
        pip = str(VENV_DIR / "bin" / "pip")
        run_cmd([pip, "install", "--upgrade", "pip", "setuptools", "wheel"])
        run_cmd([pip, "install", "flask", "python-dotenv", "requests", "gunicorn"])
        log("Virtualenv ja riippuvuudet asennettu")
    except Exception as e:
        log(f"Virhe virtualenv/ripustuksissa: {e}", "ERROR")
        raise

def write_webhook_listener():
    log(f"Kirjoitetaan webhook-kuuntelija tiedostoon {WEBHOOK_PY}")
    content = """#!/usr/bin/env python3
import os
import hmac
import hashlib
from flask import Flask, request, abort
from dotenv import load_dotenv

load_dotenv()

SECRET = os.getenv("WEBHOOK_SECRET", "")
if not SECRET:
    raise RuntimeError("WEBHOOK_SECRET ei ole asetettu .env-tiedostossa")

app = Flask(__name__)

def verify_signature(secret: str, payload: bytes, header: str) -> bool:
    if not header:
        return False
    try:
        sha_name, signature = header.split('=')
    except Exception:
        return False
    if sha_name != 'sha256':
        return False
    mac = hmac.new(secret.encode(), msg=payload, digestmod=hashlib.sha256)
    return hmac.compare_digest(mac.hexdigest(), signature)

@app.route("/webhook", methods=["POST"])
def webhook():
    payload = request.get_data()
    sig = request.headers.get('X-Hub-Signature-256')  # GitHub käyttää tätä
    if not verify_signature(SECRET, payload, sig):
        abort(401, "Invalid signature")
    print("Headers:", dict(request.headers))
    print("JSON payload:", request.get_json(silent=True))
    return "", 204

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
"""
    try:
        with open(WEBHOOK_PY, "w", encoding="utf-8") as f:
            f.write(content)
        os.chmod(WEBHOOK_PY, 0o755)
        log("Webhook-kuuntelija luotu onnistuneesti.")
    except Exception as e:
        log(f"Virhe kirjoittaessa webhook-tiedostoa: {e}", "ERROR")
        raise

def write_env_file(env_values: dict[str, str]):
    try:
        with open(ENV_FILE, "w", encoding="utf-8") as f:
            for k, v in env_values.items():
                if v is None:
                    v = ""
                # escape quotes and newlines
                v = v.replace("\n", "\\n").replace('"', '\"')
                f.write(f'{{k}}="{{v}}"\n')
        log(f".env kirjoitettu: {ENV_FILE}")
    except Exception as e:
        log(f"Virhe kirjoittaessa .env: {e}", "ERROR")
        raise

def download_ngrok():
    if NGROK_BIN.exists():
        log("Ngrok löytyi projektikansiosta, ei ladata uudelleen.")
        return str(NGROK_BIN)
    log("Yritetään ladata ngrok (vain Linux x86_64 tuettu automaattisesti).")
    arch = platform.machine()
    if arch not in ("x86_64", "amd64"):
        log(f"Automaattinen ngrok-lataus tukee vain x86_64; havaittu arkkitehtuuri: {arch}", "ERROR")
        raise RuntimeError("Ngrok-lataus tuetaan vain x86_64 tällä skriptillä. Lataa ngrok manuaalisesti: https://ngrok.com/download")
    url = "https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-amd64.zip"
    try:
        tmp = tempfile.TemporaryDirectory()
        zip_path = Path(tmp.name) / "ngrok.zip"
        run_cmd(["curl", "-sSL", "-o", str(zip_path), url])
        with zipfile.ZipFile(str(zip_path), "r") as zf:
            zf.extractall(tmp.name)
        extracted = Path(tmp.name) / "ngrok"
        shutil.move(str(extracted), str(NGROK_BIN))
        os.chmod(NGROK_BIN, 0o755)
        log(f"Ngrok ladattu ja sijoitettu: {NGROK_BIN}")
        return str(NGROK_BIN)
    except Exception as e:
        log(f"Ngrokin lataus epäonnistui: {e}", "ERROR")
        raise

def start_ngrok(ngrok_path: str, port: int = 5000, authtoken: str | None = None):
    # Start ngrok in background and return public URL by polling local API
    log("Käynnistetään ngrok taustalle")
    if authtoken:
        try:
            run_cmd([ngrok_path, "authtoken", authtoken], check=True)
            log("Ngrok authtoken asetettu.")
        except Exception:
            log("Ngrok authtokenin asettaminen epäonnistui; jatketaan ilman sitä.", "ERROR")
    # Start ngrok process
    try:
        # Use subprocess.Popen to run in background
        proc = subprocess.Popen([ngrok_path, "http", str(port)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception as e:
        log(f"Ngrokin käynnistys epäonnistui: {e}", "ERROR")
        raise
    # Poll ngrok local API
    import requests
    start = time.time()
    public_url = None
    while time.time() - start < 20:
        try:
            r = requests.get("http://127.0.0.1:4040/api/tunnels", timeout=2)
            data = r.json()
            if "tunnels" in data and len(data["tunnels"]) > 0:
                public_url = data["tunnels"][0].get("public_url")
                break
        except Exception:
            time.sleep(1)
    if not public_url:
        log("Ngrok ei antanut julkista osoitetta ajallaan (katso ngrok lokit).", "ERROR")
        raise RuntimeError("Ngrok ei käynnistynyt oikein tai 4040-portin API ei vastaa.")
    log(f"Ngrok julkinen osoite: {public_url}")
    return public_url, proc.pid

def create_github_webhook(github_token: str, owner: str, repo: str, webhook_url: str, secret: str, events: list[str]):
    import requests
    api = f"https://api.github.com/repos/{{owner}}/{{repo}}/hooks"
    headers = {
        "Authorization": f"token {{github_token}}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "installer-script"
    }
    payload = {
        "name": "web",
        "active": True,
        "events": events,
        "config": {
            "url": webhook_url,
            "content_type": "json",
            "secret": secret,
            "insecure_ssl": "0"
        }
    }
    log(f"Luodaan GitHub webhook: {{owner}}/{{repo}} -> {{webhook_url}}")
    try:
        r = requests.post(api, headers=headers, json=payload, timeout=15)
        if r.status_code in (200, 201):
            log("GitHub webhook luotu onnistuneesti.")
            return r.json()
        else:
            log(f"GitHub API palautti virhekoodin {{r.status_code}}: {{r.text}}", "ERROR")
            raise RuntimeError(f"Webhookin luonti epäonnistui: {{r.status_code}} {{r.text}}")
    except Exception as e:
        log(f"Virhe GitHub API -kutsussa: {e}", "ERROR")
        raise

def create_systemd_service_file(python_bin: str):
    service_path = Path("/etc/systemd/system") / SYSTEMD_SERVICE
    content = f"""[Unit]
Description=Webhook listener service for user {{os.getlogin()}}
After=network.target

[Service]
Type=simple
User={{os.getlogin()}}
WorkingDirectory={{PROJECT_DIR}}
EnvironmentFile={{ENV_FILE}}
ExecStart={{python_bin}} {{WEBHOOK_PY}}
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
"""
    try:
        if not os.access("/etc/systemd/system", os.W_OK):
            log("Tarvitset sudo-luvat systemd-palvelun luomiseen (kirjoita tiedosto /etc/systemd/system).", "ERROR")
            raise PermissionError("Ei kirjoitusoikeutta /etc/systemd/system")
        with open(service_path, "w", encoding="utf-8") as f:
            f.write(content)
        run_cmd(["sudo", "systemctl", "daemon-reload"])
        run_cmd(["sudo", "systemctl", "enable", SYSTEMD_SERVICE])
        run_cmd(["sudo", "systemctl", "start", SYSTEMD_SERVICE])
        log(f"Systemd-palvelu luotu ja käynnistetty: {{service_path}}")
        return str(service_path)
    except Exception as e:
        log(f"Systemd-palvelun luonti epäonnistui: {e}", "ERROR")
        raise

def test_send_payload(webhook_url: str, secret: str):
    # create HMAC signature and send a test POST
    log("Lähetetään testipayload webhookiin (vain testi).")
    import hashlib, hmac, requests
    payload = json.dumps({"hello": "world"})
    sig = hmac.new(secret.encode(), msg=payload.encode(), digestmod=hashlib.sha256).hexdigest()
    headers = {
        "Content-Type": "application/json",
        "X-Hub-Signature-256": f"sha256={{sig}}"
    }
    try:
        r = requests.post(webhook_url, headers=headers, data=payload, timeout=10)
        log(f"Testipyyntö HTTP {{r.status_code}}")
        return r.status_code, r.text
    except Exception as e:
        log(f"Testipyyntö epäonnistui: {e}", "ERROR")
        raise

# Main interactive flow
def main():
    print("="*60)
    print("Webhook installer - interaktiivinen asennus (suomeksi)")
    print("="*60)
    try:
        preflight_checks()
    except Exception as e:
        log(f"Preflight epäonnistui: {e}", "ERROR")
        print("Preflight-tarkistus epäonnistui. Tarkista loki:", LOGFILE)
        sys.exit(1)

    create_project_structure()

    try:
        create_virtualenv_and_install()
    except Exception:
        print("Virtualenv/riippuvuuksien asennus epäonnistui. Katso loki:", LOGFILE)
        sys.exit(1)

    write_webhook_listener()

    # Ask user for environment values
    print("\nSeuraavaksi määritellään ympäristömuuttujat (.env). Anna arvot tai paina Enter jättääksesi tyhjäksi.")
    env_values: dict[str, str] = {}
    try:
        env_values["TELEGRAM_KEY"] = input("Syötä TELEGRAM_KEY (Telegram bot token): ").strip()
        env_values["WEBHOOK_SECRET"] = getpass("Syötä WEBHOOK_SECRET (hmac salaisuus, näkyy salattuna): ").strip()
        if not env_values["WEBHOOK_SECRET"]:
            # generate a default secret if user leaves blank
            import secrets
            env_values["WEBHOOK_SECRET"] = secrets.token_hex(32)
            print("Luotu satunnainen WEBHOOK_SECRET.")
        env_values["GITHUB_TOKEN"] = getpass("Syötä GITHUB_TOKEN (repo:hook scopes, tyhjä jos ei halua luoda webhookia nyt): ").strip()
        env_values["HOST"] = input("HOST (default 0.0.0.0): ").strip() or "0.0.0.0"
        env_values["PORT"] = input("PORT (default 5000): ").strip() or "5000"
        env_values["FLASK_DEBUG"] = input("FLASK_DEBUG (true/false, default false): ").strip() or "false"
        # Optional Github repo for auto webhook creation
        owner = input("GitHub repo owner (esim. AnomFIN) [tyhjä = ohita webhook-luonti]: ").strip()
        repo = input("GitHub repo name (esim. anomfin-website) [tyhjä = ohita webhook-luonti]: ").strip()
        # ngrok authtoken optional
        ngrok_token = getpass("Ngrok authtoken (tyhjä = jätä asetus tekemättä): ").strip()
    except KeyboardInterrupt:
        print("\nKeskeytetty käyttäjän toimesta.")
        sys.exit(1)

    try:
        write_env_file(env_values)
    except Exception:
        print("Env-tiedoston kirjoitus epäonnistui. Katso loki:", LOGFILE)
        sys.exit(1)

    # Download and start ngrok
    try:
        ngrok_path = download_ngrok()
        public_url, ngrok_pid = start_ngrok(ngrok_path, port=int(env_values["PORT"]), authtoken=ngrok_token or None)
        print(f"Ngrok käynnistetty (pid {{ngrok_pid}}) julkisella osoitteella: {{public_url}}/webhook")
    except Exception as e:
        print("Ngrokin käynnistys epäonnistui. Jatketaan ilman ngrokia. Voit käynnistää sen myöhemmin.")
        public_url = None

    # Offer to create GitHub webhook automatically if token and repo provided
    if env_values.get("GITHUB_TOKEN") and owner and repo and public_url:
        if confirm(f"Haluatko luoda GitHub webhookin repon {{owner}}/{{repo}} osoitteeseen {{public_url}}/webhook?", default=True):
            try:
                gh_response = create_github_webhook(env_values["GITHUB_TOKEN"], owner, repo, f"{{public_url}}/webhook", env_values["WEBHOOK_SECRET"], ["push", "pull_request"])
                print("GitHub webhook luotu. Hook-id:", gh_response.get("id"))
            except Exception as e:
                print("GitHub webhookin luonti epäonnistui. Katso loki:", LOGFILE)
    else:
        log("GitHub webhookin luonti ohitettu (ei tokenia / repoa / ngrok-osoitetta).")

    # Offer to create systemd service
    python_bin = str(VENV_DIR / "bin" / "python")
    if confirm("Haluatko luoda systemd-palvelun webhook-kuuntelijalle (tarvitsee sudo)?", default=False):
        try:
            svc_path = create_systemd_service_file(python_bin)
            print(f"Systemd-palvelu luotu: {{svc_path}}")
        except Exception as e:
            print("Systemd-palvelun luonti epäonnistui. Katso loki:", LOGFILE)

    # Offer to send a test payload
    if public_url:
        if confirm("Haluatko lähettää testipayloadin webhook-URL:iin nyt?", default=True):
            try:
                status, body = test_send_payload(f"{{public_url}}/webhook", env_values["WEBHOOK_SECRET"])
                print(f"Testipyyntö palautti HTTP {{status}}. Vastaus: {{body[:100]}}...")
            except Exception:
                print("Testipyyntö epäonnistui. Katso loki:", LOGFILE)

    print("\nAsennus valmis — yhteenveto:")
    print(f" - Projekti: {{PROJECT_DIR}}")
    print(f" - Virtualenv: {{VENV_DIR}}")
    print(f" - Webhook sovellus: {{WEBHOOK_PY}}")
    print(f" - .env: {{ENV_FILE}} (PIDÄ tämä tiedosto turvassa!)")
    if public_url:
        print(f" - Julkinen osoite (ngrok): {{public_url}}/webhook")
    print("\nKatso tarkemmat lokit:", LOGFILE)
    print("Käynnistä palvelu manuaalisesti (venv aktivoiden):")
    print(f"    source {{VENV_DIR}}/bin/activate && python {{WEBHOOK_PY}}")
    print("Tai jos loit systemd-palvelun, hallinnoi sitä: sudo systemctl status", SYSTEMD_SERVICE)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log(f"Kriittinen virhe pääohjelmassa: {e}", "ERROR")
        print("Asennus epäonnistui. Katso installer.log tiedostosta lisätietoja:", LOGFILE)
        sys.exit(1)