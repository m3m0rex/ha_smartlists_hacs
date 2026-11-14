"""Teilen-Links, ohne die eigene Home-Assistant-Adresse zu verraten.

Bisher zeigte ein geteilter Link auf die externe Adresse von Home Assistant (z. B. meinhaus.duckdns.org). Wer
den Link bekam, kannte damit die Adresse des ganzen Systems. Jetzt gibt es drei Arten (Einstellungen → Teilen
und Rechte → Öffentliche Adresse):

- "ha":     wie bisher – externe Adresse von Home Assistant.
- "tunnel": Cloudflare Quick Tunnel. SmartLists startet `cloudflared`, wenn es schon vorhanden ist
            (PATH oder im config-Ordner: /config/cloudflared, /config/bin/cloudflared). SmartLists lädt es
            NICHT selbst herunter – fehlt es, zeigt die Einstellung, wo man es bekommt und wohin es gehört.
            Die Adresse ist zufällig (https://….trycloudflare.com) und ändert sich bei jedem Neustart;
            vorher erstellte Links funktionieren dann nicht mehr.
- "proxy":  eigener Reverse-Proxy oder eigener Tunnel (Caddy, nginx, Cloudflare-Tunnel mit eigener Domain …)
            mit einer selbst gewählten Adresse.

Bei "tunnel" und "proxy" startet SmartLists einen kleinen eigenen Webserver (Standard-Port 8126), der NUR die
Teilen-Seite und die Teilen-API ausliefert – nicht Home Assistant. Tunnel bzw. Proxy zeigen auf diesen Port.
So ist über die geteilte Adresse nie die Anmeldung, die API oder sonst etwas aus Home Assistant erreichbar.
Beim Tunnel lauscht der Server nur auf 127.0.0.1 (cloudflared läuft auf demselben Rechner), beim Proxy auf
allen Adressen (der Proxy läuft oft in einem anderen Container oder auf einem anderen Gerät).
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
import os
import re
import shutil
from typing import Any
from urllib.parse import urlsplit

from aiohttp import web

from homeassistant.const import EVENT_HOMEASSISTANT_STOP
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store

from .const import DOMAIN, SIGNAL_DATA_CHANGED

_LOGGER = logging.getLogger(__name__)

STORAGE_KEY = f"{DOMAIN}.public"
MODES = ("ha", "tunnel", "proxy")
DEFAULT_PORT = 8126
CLOUDFLARED_DOWNLOAD = "https://github.com/cloudflare/cloudflared/releases/latest"
CLOUDFLARED_DOCS = "https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/"
_TUNNEL_URL = re.compile(r"https://[a-z0-9-]+\.trycloudflare\.com")
# Neustart-Wartezeiten, wenn cloudflared abbricht (Sekunden)
_BACKOFF = (10, 30, 60, 300)


def _arch() -> str:
    """amd64 / arm64 / arm – wie die Dateinamen der cloudflared-Releases."""
    import platform

    m = platform.machine().lower()
    return "arm64" if m in ("aarch64", "arm64") else "arm" if m.startswith("arm") else "amd64"


def suggested_file() -> str:
    return f"cloudflared-linux-{_arch()}"


def search_dirs(config_dir: str) -> list[str]:
    """Ordner, in die man cloudflared legen kann (für den Hinweis)."""
    return [config_dir, os.path.join(config_dir, "bin")]


def cloudflared_candidates(config_dir: str) -> list[str]:
    """Wo SmartLists nach cloudflared sucht (in dieser Reihenfolge). Großzügig, weil die Datei oft anders landet:
    Originalname (cloudflared-linux-arm64) statt „cloudflared“, oder ein Ordner „cloudflared“ mit der Datei darin
    (auch verschachtelt, z. B. /config/cloudflared/config/bin/cloudflared)."""
    arch = _arch()
    names = ("cloudflared", f"cloudflared-linux-{arch}", "cloudflared.exe")
    out: list[str] = []
    which = shutil.which("cloudflared")
    if which:
        out.append(which)
    for d in (config_dir, os.path.join(config_dir, "bin"), os.path.join(config_dir, "smartlists")):
        out += [os.path.join(d, n) for n in names]
    # Ordner /config/cloudflared (bzw. …/bin/cloudflared): darin bis 4 Ebenen tief suchen
    for root in (os.path.join(config_dir, "cloudflared"), os.path.join(config_dir, "bin", "cloudflared")):
        if not os.path.isdir(root):
            continue
        base_depth = root.rstrip(os.sep).count(os.sep)
        for dirpath, dirnames, filenames in os.walk(root):
            if dirpath.count(os.sep) - base_depth >= 4:
                dirnames[:] = []
            for n in names:
                if n in filenames:
                    out.append(os.path.join(dirpath, n))
    # Datei für eine andere Architektur liegt da? Dann trotzdem melden (Problem statt „fehlt“)
    for d in (config_dir, os.path.join(config_dir, "bin")):
        for other in ("amd64", "arm64", "arm", "386"):
            if other != arch:
                out.append(os.path.join(d, f"cloudflared-linux-{other}"))
    return list(dict.fromkeys(out))


_ELF_MACHINES = {0x3E: "amd64", 0xB7: "arm64", 0x28: "arm", 0x03: "386"}


def binary_kind(path: str) -> str:
    """Was für eine Datei das ist – damit „Exec format error“ eine verständliche Meldung bekommt:
    "amd64"/"arm64"/"arm"/"386" (Linux-Programm), "windows", "mac", "archive", "html" oder "unknown"."""
    try:
        with open(path, "rb") as f:
            head = f.read(64)
    except OSError:
        return "unknown"
    if head[:4] == b"\x7fELF" and len(head) >= 20:
        machine = int.from_bytes(head[18:20], "little" if head[5] == 1 else "big")
        return _ELF_MACHINES.get(machine, "unknown")
    if head[:2] == b"MZ":
        return "windows"
    if head[:4] in (b"\xcf\xfa\xed\xfe", b"\xce\xfa\xed\xfe", b"\xca\xfe\xba\xbe"):
        return "mac"
    if head[:2] == b"\x1f\x8b" or head[:4] == b"PK\x03\x04" or head[:7] == b"!<arch>":
        return "archive"  # .tgz, .zip oder .deb statt des Programms
    if head.lstrip()[:1] == b"<":
        return "html"  # Webseite gespeichert statt der Datei
    return "unknown"


def problem_text(path: str) -> str:
    """Problem-Code für die Karte: "<kind>|<pfad>" (kind siehe binary_kind)."""
    return f"{binary_kind(path)}|{path}"


def find_cloudflared(config_dir: str) -> tuple[str | None, str | None]:
    """(Pfad, Problem). Pfad = ausführbares cloudflared; Problem = gefunden, aber nicht ausführbar bzw. für eine
    andere Architektur (Pfad der Datei)."""
    problem = None
    arch = _arch()
    for path in cloudflared_candidates(config_dir):
        if not os.path.isfile(path):
            continue
        # Inhalt prüfen, nicht nur den Namen: eine umbenannte Datei für einen anderen Prozessor (amd64 statt arm64),
        # ein .tgz/.deb oder eine gespeicherte Webseite führen sonst zu „Exec format error“
        kind = binary_kind(path)
        if kind != arch and not (kind == "unknown" and not os.path.basename(path).startswith("cloudflared-linux-")):
            problem = problem or problem_text(path)
            continue
        if os.access(path, os.X_OK):
            return path, None
        # selbst abgelegte Datei ohne Ausführrecht (häufig nach Kopieren über Samba): einmal versuchen
        try:
            os.chmod(path, 0o755)
            if os.access(path, os.X_OK):
                return path, None
        except OSError:
            pass
        problem = f"not_executable|{path}"
    return None, problem


def normalize_url(url: str) -> str:
    """Eigene Proxy-Adresse prüfen: nur http(s), ohne Pfad-Rest, Query oder Zugangsdaten."""
    url = (url or "").strip().rstrip("/")
    if not url:
        return ""
    parts = urlsplit(url)
    if parts.scheme not in ("https", "http") or not parts.hostname:
        raise ValueError("Adresse muss mit https:// beginnen, z. B. https://liste.example.org")
    if parts.username or parts.password or parts.query or parts.fragment:
        raise ValueError("Adresse ohne Benutzername, Passwort, ? oder #")
    return url


class PublicShare:
    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store[dict[str, Any]] = Store(hass, 1, STORAGE_KEY)
        self.mode = "ha"
        self.port = DEFAULT_PORT
        self.url = ""  # eigene Proxy-Adresse
        self.tunnel_url: str | None = None
        self.error: str | None = None
        self.cloudflared: str | None = None
        self._runner: web.AppRunner | None = None
        self._server_port: int | None = None
        self._server_host: str | None = None
        self._proc: asyncio.subprocess.Process | None = None
        self._tunnel_task: asyncio.Task | None = None
        self._stopping = False

    async def async_load(self) -> None:
        data = await self._store.async_load() or {}
        self.mode = data.get("mode") if data.get("mode") in MODES else "ha"
        port = data.get("port")
        self.port = port if isinstance(port, int) and 1024 <= port <= 65535 else DEFAULT_PORT
        self.url = str(data.get("url") or "")

    def _save(self) -> None:
        self._store.async_delay_save(lambda: {"mode": self.mode, "port": self.port, "url": self.url}, 1.0)

    def _changed(self) -> None:
        from homeassistant.helpers.dispatcher import async_dispatcher_send

        if hasattr(self.hass, "loop"):
            async_dispatcher_send(self.hass, SIGNAL_DATA_CHANGED)

    # ------------------------------------------------------------------ Einstellungen
    async def async_update(self, mode: str | None = None, port: int | None = None, url: str | None = None) -> dict[str, Any]:
        if mode is not None and mode not in MODES:
            raise ValueError(f"mode: {', '.join(MODES)}")
        if port is not None and not 1024 <= int(port) <= 65535:
            raise ValueError("Port 1024–65535")
        if url is not None:
            url = normalize_url(url)
        new_mode = mode or self.mode
        new_url = self.url if url is None else url
        if new_mode == "proxy" and not new_url:
            raise ValueError("Für einen eigenen Proxy bitte die öffentliche Adresse eintragen.")
        self.mode, self.url = new_mode, new_url
        if port is not None:
            self.port = int(port)
        self._save()
        await self.async_apply()
        return self.status()

    def base_url(self) -> str | None:
        """Öffentliche Adresse für neue Links. None = wie bisher (Adresse von Home Assistant, macht die Karte).
        ValueError, wenn Tunnel/Proxy gewählt, aber gerade nicht bereit ist – dann lieber kein Link als einer,
        der doch die HA-Adresse verrät."""
        if self.mode == "ha":
            return None
        if self._runner is None:
            raise ValueError(self.error or "Der Teilen-Server läuft nicht.")
        if self.mode == "proxy":
            return self.url
        if not self.tunnel_url:
            raise ValueError(self.error or "Der Tunnel startet noch – bitte gleich noch einmal versuchen.")
        return self.tunnel_url

    def status(self) -> dict[str, Any]:
        return {
            "mode": self.mode, "port": self.port, "url": self.url,
            "server": self._runner is not None,
            "tunnel_url": self.tunnel_url, "error": self.error,
            "cloudflared": self.cloudflared,
            # wohin man cloudflared legen kann und welche Datei passt (für den Hinweis in der Einstellung)
            "cloudflared_dirs": search_dirs(self.hass.config.config_dir) if hasattr(self.hass, "config") else [],
            "cloudflared_file": suggested_file(),
            "download": CLOUDFLARED_DOWNLOAD, "docs": CLOUDFLARED_DOCS,
        }

    # ------------------------------------------------------------------ Start/Stopp
    async def async_apply(self) -> None:
        """Server/Tunnel passend zur Einstellung starten oder stoppen."""
        await self._stop_tunnel()
        self.error = None
        if self.mode == "ha":
            await self._stop_server()
            self._changed()
            return
        host = "127.0.0.1" if self.mode == "tunnel" else "0.0.0.0"
        await self._start_server(host)
        if self.mode == "tunnel" and self._runner is not None:
            path, problem = await self.hass.async_add_executor_job(find_cloudflared, self.hass.config.config_dir)
            self.cloudflared = path
            if path is None:
                self.error = f"cloudflared_wrong:{problem}" if problem else "cloudflared_missing"
            else:
                self._stopping = False
                self._tunnel_task = self.hass.async_create_background_task(self._run_tunnel(path), f"{DOMAIN}_tunnel")
        self._changed()

    async def _start_server(self, host: str) -> None:
        if self._runner is not None and self._server_port == self.port and self._server_host == host:
            return
        await self._stop_server()
        app = build_app(self.hass)
        runner = web.AppRunner(app, access_log=None)
        await runner.setup()
        try:
            await web.TCPSite(runner, host, self.port).start()
        except OSError as err:
            await runner.cleanup()
            self.error = f"port_in_use:{self.port}"
            _LOGGER.warning("SmartLists: Teilen-Server auf Port %s nicht gestartet: %s", self.port, err)
            return
        self._runner, self._server_port, self._server_host = runner, self.port, host
        _LOGGER.info("SmartLists: Teilen-Server läuft auf %s:%s (nur Teilen-Links)", host, self.port)

    async def _stop_server(self) -> None:
        if self._runner is not None:
            runner, self._runner = self._runner, None
            with contextlib.suppress(Exception):
                await runner.cleanup()

    async def _run_tunnel(self, path: str) -> None:
        attempt = 0
        while not self._stopping:
            self.tunnel_url = None
            try:
                self._proc = await asyncio.create_subprocess_exec(
                    path, "tunnel", "--no-autoupdate", "--url", f"http://127.0.0.1:{self.port}",
                    stdin=asyncio.subprocess.DEVNULL, stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.PIPE)
            except OSError as err:
                import errno

                if err.errno == errno.ENOEXEC:  # Exec format error: Datei passt nicht zu diesem System
                    self.error = f"cloudflared_wrong:{problem_text(path)}"
                else:
                    self.error = f"cloudflared_failed:{err}"
                self._changed()
                return
            assert self._proc.stderr is not None
            async for raw in self._proc.stderr:
                line = raw.decode(errors="replace")
                if not self.tunnel_url and (m := _TUNNEL_URL.search(line)):
                    self.tunnel_url, self.error, attempt = m.group(0), None, 0
                    _LOGGER.info("SmartLists: Quick Tunnel bereit: %s", self.tunnel_url)
                    self._changed()
            code = await self._proc.wait()
            self._proc = None
            if self._stopping:
                return
            self.tunnel_url = None
            self.error = f"cloudflared_exit:{code}"
            self._changed()
            await asyncio.sleep(_BACKOFF[min(attempt, len(_BACKOFF) - 1)])
            attempt += 1

    async def _stop_tunnel(self) -> None:
        self._stopping = True
        if self._proc is not None and self._proc.returncode is None:
            with contextlib.suppress(ProcessLookupError):
                self._proc.terminate()
            try:
                await asyncio.wait_for(self._proc.wait(), 5)
            except asyncio.TimeoutError:
                with contextlib.suppress(ProcessLookupError):
                    self._proc.kill()
        self._proc = None
        if self._tunnel_task is not None:
            self._tunnel_task.cancel()
            with contextlib.suppress(asyncio.CancelledError, Exception):
                await self._tunnel_task
            self._tunnel_task = None
        self.tunnel_url = None

    async def async_stop(self, *_args: Any) -> None:
        await self._stop_tunnel()
        await self._stop_server()


# ---------------------------------------------------------------------- der kleine Server
_NOT_FOUND_HEADERS = {"Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff"}


def build_app(hass: HomeAssistant) -> web.Application:
    """aiohttp-App mit genau drei Adressen. Alles andere: 404 – Home Assistant ist hier nicht erreichbar."""
    from .shares import ShareApiView, SharePageView

    api, page = ShareApiView(), SharePageView()
    app = web.Application(client_max_size=4096)
    import warnings

    with warnings.catch_warnings():  # die Teilen-Views lesen request.app["hass"] (wie in Home Assistant)
        warnings.simplefilter("ignore")
        app["hass"] = hass

    async def api_get(request: web.Request) -> web.StreamResponse:
        return await api.get(request, request.match_info["token"])

    async def api_post(request: web.Request) -> web.StreamResponse:
        return await api.post(request, request.match_info["token"])

    async def page_get(request: web.Request) -> web.StreamResponse:
        return await page.get(request, request.match_info["token"])

    async def not_found(_request: web.Request) -> web.StreamResponse:
        return web.Response(status=404, text="", headers=_NOT_FOUND_HEADERS)

    app.router.add_get("/api/smartlists/share/{token}", api_get, allow_head=False)
    app.router.add_post("/api/smartlists/share/{token}", api_post)
    app.router.add_get("/smartlists-share/{token}", page_get, allow_head=False)
    app.router.add_route("*", "/{tail:.*}", not_found)
    return app


async def async_get_public(hass: HomeAssistant) -> PublicShare:
    data = hass.data.setdefault(DOMAIN, {})
    if "public" not in data:
        public = PublicShare(hass)
        await public.async_load()
        data["public"] = public
    return data["public"]


@callback
def async_setup_public(hass: HomeAssistant) -> None:
    """Nach dem Start von HA Server/Tunnel starten; beim Beenden alles stoppen (cloudflared nicht verwaist lassen)."""
    from homeassistant.helpers.start import async_at_started

    public: PublicShare = hass.data[DOMAIN]["public"]

    async def _start(_hass: HomeAssistant) -> None:
        if public.mode != "ha":
            await public.async_apply()

    async_at_started(hass, _start)
    hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STOP, public.async_stop)
