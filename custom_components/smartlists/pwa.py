"""Seite /smartlists als App auf dem Startbildschirm (PWA) – ohne eigene App installieren.

Home Assistant hat ein eigenes Web-App-Manifest (Start: Übersicht). Auf der Seite /smartlists tauscht die Karte
den Manifest-Link gegen dieses hier (und beim Verlassen zurück). „App installieren“ bzw. „Zum Startbildschirm“
legt dann ein eigenes Symbol „SmartLists“ an, das direkt die gewählte Liste öffnet – auf Wunsch im Einkaufsmodus.

/smartlists-files/app.webmanifest?list=todo.einkauf&shopping=1
→ start_url /smartlists?app=1&list=todo.einkauf&shopping=1, eigene id (mehrere Symbole für verschiedene Listen
möglich). Ohne Anmeldung abrufbar (Browser senden beim Laden des Manifests keinen Token) – es enthält nichts
außer der übergebenen Listen-ID, Name und Symbol.
"""

from __future__ import annotations

import re
from urllib.parse import urlencode

from aiohttp import web

from homeassistant.components.http import HomeAssistantView

MANIFEST_URL = "/smartlists-files/app.webmanifest"
BRAND_URL = "/smartlists-files/brand"
_LIST = re.compile(r"todo\.[a-z0-9_]{1,120}")


def build_manifest(list_id: str = "", shopping: bool = False, name: str = "") -> dict:
    params = {"app": "1"}
    if list_id and _LIST.fullmatch(list_id):
        params["list"] = list_id
    if shopping:
        params["shopping"] = "1"
    start = "/smartlists?" + urlencode(params)
    name = " ".join(str(name or "").split())[:40] or "SmartLists"
    return {
        "id": start,
        "name": name,
        "short_name": name[:12],
        "start_url": start,
        "scope": "/",
        "display": "standalone",
        "background_color": "#ffffff",
        "theme_color": "#1747b5",
        "icons": [
            {"src": f"{BRAND_URL}/icon.png", "sizes": "256x256", "type": "image/png", "purpose": "any"},
            {"src": f"{BRAND_URL}/icon@2x.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
        ],
    }


class ManifestView(HomeAssistantView):
    url = MANIFEST_URL
    name = "smartlists:manifest"
    requires_auth = False

    async def get(self, request: web.Request) -> web.Response:
        q = request.query
        body = build_manifest(q.get("list", ""), q.get("shopping") == "1", q.get("name", ""))
        return web.json_response(body, content_type="application/manifest+json",
                                 headers={"Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff"})
