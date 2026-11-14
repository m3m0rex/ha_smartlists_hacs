"""Liste per Link teilen – für Personen ohne Home-Assistant-Konto (z. B. Nachbarn oder Gäste).

Sicherheit (bewusst eng gefasst):
- Der Link enthält einen Zufallsschlüssel mit 256 Bit (secrets.token_urlsafe(32)). Gespeichert wird nur
  sein SHA-256-Hash – wer .storage liest, kann daraus keinen gültigen Link bauen. Der Link wird deshalb
  nur direkt beim Erstellen angezeigt (danach: widerrufen und neu erstellen).
- Ein Link gilt für genau EINE Liste, läuft ab (Standard 7 Tage) und ist jederzeit widerrufbar.
- Ohne Anmeldung erreichbar sind nur zwei Adressen: die Seite /smartlists-share/<schlüssel> und
  /api/smartlists/share/<schlüssel>. Sie liefern nur Name der Liste und Artikeltexte mit Häkchen (dazu, aus dem
  Text abgeleitet, Name/Menge/Badges/Kategorie wie in der Karte und die Badge-Farben des Haushalts) – keine
  Notizen, keine Preise, keine Entitäten, keine Benutzer, nichts anderes aus Home Assistant.
- Erlaubt ist standardmäßig nur Ansehen. Optional beim Erstellen: „soft“ abhaken (sichtbar markiert, bleibt
  in der Liste offen), richtig abhaken, hinzufügen. Schreiben ist pro Link begrenzt (Anzahl/Minute, Länge).
- Notizlisten der App lassen sich nicht teilen. Teilen dürfen Admins; bei eigenen Listen auch der Besitzer.
"""

from __future__ import annotations

import asyncio
import hashlib
import secrets
import time
from typing import Any

from aiohttp import web

from homeassistant.components.http import HomeAssistantView
from homeassistant.core import Context, HomeAssistant, callback
from homeassistant.helpers.storage import Store

from .const import DOMAIN

STORAGE_KEY = f"{DOMAIN}.shares"
MAX_LINKS = 30
CHECK_MODES = ("off", "soft", "on")
WRITE_LIMIT_PER_MIN = 30
ADD_LIMIT_PER_MIN = 6
MAX_BODY = 2048
# Context-IDs von Änderungen über Links (Benachrichtigungen ohne fremden Text, siehe notify.py)
SHARE_CONTEXTS: set[str] = set()
MAX_TEXT = 120
SECURITY_HEADERS = {
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
}
PAGE_CSP = ("default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; "
            "img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'")


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class Shares:
    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store[dict[str, Any]] = Store(hass, 1, STORAGE_KEY)
        # Hash → {"entity_id", "check", "add", "expires", "created", "created_by", "opens", "soft": {uid: ts}}
        self.links: dict[str, dict[str, Any]] = {}
        self._writes: dict[str, list[float]] = {}

    async def async_load(self) -> None:
        self.links = dict((await self._store.async_load() or {}).get("links", {}))
        self._cleanup()

    def _save(self) -> None:
        self._store.async_delay_save(lambda: {"links": self.links}, 1.0)
        from homeassistant.helpers.dispatcher import async_dispatcher_send

        from .const import SIGNAL_DATA_CHANGED

        if hasattr(self.hass, "loop"):
            async_dispatcher_send(self.hass, SIGNAL_DATA_CHANGED)

    def _cleanup(self) -> None:
        now = time.time()
        for h in [h for h, link in self.links.items() if link.get("expires") and link["expires"] < now - 86400]:
            self.links.pop(h)

    @callback
    def create(self, entity_id: str, user_id: str, check: str = "off", add: bool = False, hours: int | None = 168,
               base: str | None = None) -> dict[str, Any]:
        """Neuer Link. hours = Gültigkeit (z. B. 2, 24, 168, 720), None = unbegrenzt bis zum Widerruf.
        base = öffentliche Adresse (Tunnel/Proxy, siehe public.py) – gemerkt, um später zu zeigen, wenn sich die
        Tunnel-Adresse geändert hat und der Link deshalb nicht mehr geht. None = Adresse von Home Assistant."""
        if check not in CHECK_MODES:
            raise ValueError("check: off, soft, on")
        self._cleanup()
        if len(self.links) >= MAX_LINKS:
            raise ValueError(f"Höchstens {MAX_LINKS} Links – bitte alte widerrufen")
        token = secrets.token_urlsafe(32)
        h = _hash(token)
        now = int(time.time())
        self.links[h] = {"entity_id": entity_id, "check": check, "add": bool(add),
                         "expires": now + int(hours) * 3600 if hours else None, "created": now,
                         "created_by": user_id, "opens": 0, "soft": {}, "base": base}
        self._save()
        return {"id": h[:16], "token": token, **self.describe(h)}

    def describe(self, h: str) -> dict[str, Any]:
        link = self.links[h]
        return {"id": h[:16], "entity_id": link["entity_id"], "check": link["check"], "add": link["add"],
                "expires": link["expires"], "created": link["created"], "opens": link.get("opens", 0),
                "expired": bool(link["expires"] and link["expires"] < time.time()), "base": link.get("base")}

    @callback
    def revoke_all(self) -> int:
        n = len(self.links)
        self.links.clear()
        self._save()
        return n

    def all_links(self) -> list[dict[str, Any]]:
        return [self.describe(h) for h in self.links]

    def for_list(self, entity_id: str) -> list[dict[str, Any]]:
        return [self.describe(h) for h, link in self.links.items() if link["entity_id"] == entity_id]

    @callback
    def revoke(self, link_id: str, entity_id: str | None = None) -> bool:
        if len(link_id) != 16:
            return False
        for h in list(self.links):
            if h[:16] == link_id and (entity_id is None or self.links[h]["entity_id"] == entity_id):
                self.links.pop(h)
                self._save()
                return True
        return False

    def soft_checked(self, entity_id: str) -> dict[str, int]:
        """uid → Zeitpunkt, an dem jemand über einen Link „soft“ abgehakt hat (für die Anzeige in der Karte)."""
        out: dict[str, int] = {}
        for link in self.links.values():
            if link["entity_id"] == entity_id:
                out.update(link.get("soft") or {})
        return out

    @callback
    def clear_soft(self, entity_id: str, uid: str) -> None:
        for link in self.links.values():
            if link["entity_id"] == entity_id and uid in (link.get("soft") or {}):
                link["soft"].pop(uid)
                self._save()

    def resolve(self, token: str) -> tuple[str, dict[str, Any]] | None:
        if not token or len(token) > 100:
            return None
        h = _hash(token)
        link = self.links.get(h)
        if link is None or (link["expires"] and link["expires"] < time.time()):
            return None
        # Liste gelöscht oder inzwischen Notizliste → Link gilt nicht mehr
        from .notes import looks_like_notes

        state = self.hass.states.get(link["entity_id"]) if hasattr(self.hass, "states") else None
        if hasattr(self.hass, "states") and (state is None or looks_like_notes(link["entity_id"], state.attributes.get("friendly_name"))):
            return None
        return h, link

    @callback
    def drop_entity(self, entity_id: str) -> None:
        """Liste entfernt → alle ihre Links löschen (eine spätere Liste gleichen Namens bekommt sie nicht)."""
        for h in [h for h, link in self.links.items() if link["entity_id"] == entity_id]:
            self.links.pop(h)
        self._save()

    def allow_read(self, h: str) -> bool:
        return self._limit(f"r:{h}", 120)

    def allow_write(self, h: str) -> bool:
        return self._limit(f"w:{h}", WRITE_LIMIT_PER_MIN)

    def _limit(self, key: str, per_minute: int) -> bool:
        now = time.monotonic()
        recent = [t for t in self._writes.get(key, []) if now - t < 60]
        if len(recent) >= per_minute:
            return False
        recent.append(now)
        self._writes[key] = recent
        return True

    @callback
    def count_open(self, h: str) -> None:
        """„Geöffnet“ höchstens einmal je 10 Minuten zählen (die Seite fragt alle 20 s nach)."""
        link = self.links[h]
        now = int(time.time())
        if now - int(link.get("last_open", 0)) >= 600:
            link["opens"] = int(link.get("opens", 0)) + 1
            link["last_open"] = now
            self._save()


async def async_get_shares(hass: HomeAssistant) -> Shares:
    data = hass.data.setdefault(DOMAIN, {})
    if "shares" not in data:
        shares = Shares(hass)
        await shares.async_load()
        data["shares"] = shares
    return data["shares"]


async def _not_found() -> web.Response:
    await asyncio.sleep(0.4)  # Raten bremsen (zusätzlich zu 256 Bit Schlüssellänge)
    return web.json_response({"error": "not_found"}, status=404, headers=SECURITY_HEADERS)


class ShareApiView(HomeAssistantView):
    """GET: Liste lesen. POST {"action": "check"|"uncheck"|"add", "uid"|"text"}: nur wenn der Link es erlaubt."""

    url = "/api/smartlists/share/{token}"
    name = "api:smartlists:share"
    requires_auth = False

    async def get(self, request: web.Request, token: str) -> web.Response:
        hass: HomeAssistant = request.app["hass"]
        shares: Shares = hass.data[DOMAIN]["shares"]
        found = shares.resolve(token)
        if found is None:
            return await _not_found()
        h, link = found
        if not shares.allow_read(h):
            return web.json_response({"error": "too_many"}, status=429, headers=SECURITY_HEADERS)
        shares.count_open(h)
        lang = str(request.query.get("lang") or "")[:5]
        return web.json_response(await self._payload(hass, shares, link, lang), headers=SECURITY_HEADERS)

    async def _payload(self, hass: HomeAssistant, shares: Shares, link: dict[str, Any], lang: str = "") -> dict[str, Any]:
        from . import lists

        state = hass.states.get(link["entity_id"])
        items = await lists.raw_items(hass, link["entity_id"]) if state else []
        soft = link.get("soft") or {}
        name = state.attributes.get("friendly_name", "") if state else ""
        # Darstellung wie in der Karte: Name, Menge, Badges (Markt/Person/Schlagwort in den Farben des Haushalts) und
        # Kategorie-Gruppen. Alles stammt aus dem Artikeltext selbst – weiterhin keine Notizen, Preise, Entitäten
        # oder Benutzer. Einfache Listen bzw. Listen ohne Kategorien werden ohne Gruppen gezeigt.
        learning = hass.data.get(DOMAIN, {}).get("learning")
        extras = hass.data.get(DOMAIN, {}).get("extras")
        settings = (extras.list_settings.get(link["entity_id"]) if extras else None) or {}
        grouped = learning is not None and not settings.get("plain") and settings.get("categories") is not False \
            and settings.get("sort") in (None, "category")
        out_items = []
        for i in items:
            entry = {"uid": i["uid"], "text": i["text"], "checked": bool(i["checked"]), "soft": i["uid"] in soft}
            if learning is not None:
                try:
                    info = learning.describe(i["text"])
                    qty = info.get("quantity")
                    entry.update(
                        name=info.get("name") or i["text"],
                        qty=(f"{info['pack_count']}× " if (info.get("pack_count") or 1) > 1 else "")
                        + (f"{qty:g}".replace(".", ",") if isinstance(qty, (int, float)) else "") if qty is not None else "",
                        unit=info.get("unit") or "",
                        tags=[{k: t.get(k) for k in ("kind", "value", "label", "color")} for t in info.get("tags") or []],
                        cat=info.get("category") if grouped else None)
                except Exception:  # noqa: BLE001 – im Zweifel nur der Text
                    pass
            out_items.append(entry)
        return {
            "name": name, "check": link["check"], "add": link["add"], "expires": link["expires"],
            "items": out_items,
            # Reihenfolge und Namen der Kategorien (wie im Markt) sowie Badge-Farben des Haushalts
            "categories": learning.categories.as_list(lang or getattr(getattr(hass, "config", None), "language", None))
            if grouped else [],
            "look": dict(learning.appearance) if learning is not None else {},
        }

    async def post(self, request: web.Request, token: str) -> web.Response:
        hass: HomeAssistant = request.app["hass"]
        shares: Shares = hass.data[DOMAIN]["shares"]
        found = shares.resolve(token)
        if found is None:
            return await _not_found()
        h, link = found
        if not shares.allow_write(h):
            return web.json_response({"error": "too_many"}, status=429, headers=SECURITY_HEADERS)
        if (request.content_length or 0) > MAX_BODY:
            return web.json_response({"error": "too_large"}, status=413, headers=SECURITY_HEADERS)
        try:
            import json

            raw = await request.content.read(MAX_BODY + 1)
            if len(raw) > MAX_BODY:
                return web.json_response({"error": "too_large"}, status=413, headers=SECURITY_HEADERS)
            body = json.loads(raw)
        except Exception:  # noqa: BLE001 – kaputtes/verschachteltes JSON
            return web.json_response({"error": "bad_request"}, status=400, headers=SECURITY_HEADERS)
        if not isinstance(body, dict):
            return web.json_response({"error": "bad_request"}, status=400, headers=SECURITY_HEADERS)
        from . import lists

        action = body.get("action")
        entity_id = link["entity_id"]
        # Änderungen ohne Benutzer (Kontext ohne user_id) – wie eine Automation; als „über Link“ markiert
        context = Context()
        SHARE_CONTEXTS.add(context.id)
        if len(SHARE_CONTEXTS) > 500:
            SHARE_CONTEXTS.clear()
            SHARE_CONTEXTS.add(context.id)
        try:
            if action in ("check", "uncheck") and link["check"] != "off":
                uid = str(body.get("uid", ""))[:80]
                if not any(i["uid"] == uid for i in await lists.raw_items(hass, entity_id)):
                    return web.json_response({"error": "not_found"}, status=404, headers=SECURITY_HEADERS)
                if link["check"] == "soft":
                    if action == "check":
                        link.setdefault("soft", {})[uid] = int(time.time())
                    else:
                        link.get("soft", {}).pop(uid, None)
                    shares._save()
                else:
                    await lists.update_item(hass, entity_id, uid, checked=action == "check", context=context)
            elif action == "add" and link["add"]:
                text = " ".join(str(body.get("text", "")).split())[:MAX_TEXT]
                if not text:
                    return web.json_response({"error": "bad_request"}, status=400, headers=SECURITY_HEADERS)
                if not shares._limit(f"a:{h}", ADD_LIMIT_PER_MIN):
                    return web.json_response({"error": "too_many"}, status=429, headers=SECURITY_HEADERS)
                # über Links: keine Preise/Verlauf des Haushalts verändern
                await lists.add_item(hass, entity_id, text, context=context, from_share=True)
            else:
                return web.json_response({"error": "forbidden"}, status=403, headers=SECURITY_HEADERS)
        except Exception:  # noqa: BLE001 – keine internen Details nach außen
            return web.json_response({"error": "failed"}, status=500, headers=SECURITY_HEADERS)
        return web.json_response(await self._payload(hass, shares, link, str(request.query.get("lang") or "")[:5]),
                                 headers=SECURITY_HEADERS)


class SharePageView(HomeAssistantView):
    """Die schlichte Seite für den Link. Enthält selbst keine Daten – die holt sie über die API."""

    url = "/smartlists-share/{token}"
    name = "smartlists:share:page"
    requires_auth = False

    async def get(self, request: web.Request, token: str) -> web.Response:
        lang = (request.headers.get("Accept-Language") or "en")[:2].lower()
        return web.Response(text=SHARE_PAGE.replace("__LANG__", lang if lang in SHARE_TEXTS else "en"),
                            content_type="text/html", headers={**SECURITY_HEADERS, "Content-Security-Policy": PAGE_CSP})


SHARE_TEXTS = {
    "de": {"open": "offen", "done": "erledigt", "add": "Hinzufügen", "placeholder": "Artikel hinzufügen …", "gone": "Dieser Link ist abgelaufen oder wurde widerrufen.", "until": "gültig bis", "soft": "von dir markiert", "error": "Das hat nicht geklappt – bitte neu laden."},
    "en": {"open": "open", "done": "done", "add": "Add", "placeholder": "Add an item …", "gone": "This link has expired or was revoked.", "until": "valid until", "soft": "marked by you", "error": "That did not work – please reload."},
    "fr": {"open": "à faire", "done": "fait", "add": "Ajouter", "placeholder": "Ajouter un article …", "gone": "Ce lien a expiré ou a été révoqué.", "until": "valable jusqu'au", "soft": "marqué par toi", "error": "Ça n'a pas marché – recharge la page."},
    "es": {"open": "pendientes", "done": "hecho", "add": "Añadir", "placeholder": "Añadir artículo …", "gone": "Este enlace ha caducado o se ha revocado.", "until": "válido hasta", "soft": "marcado por ti", "error": "No ha funcionado – recarga la página."},
    "it": {"open": "da fare", "done": "fatto", "add": "Aggiungi", "placeholder": "Aggiungi un articolo …", "gone": "Questo link è scaduto o è stato revocato.", "until": "valido fino al", "soft": "segnato da te", "error": "Non ha funzionato – ricarica la pagina."},
    "pl": {"open": "do kupienia", "done": "zrobione", "add": "Dodaj", "placeholder": "Dodaj produkt …", "gone": "Ten link wygasł lub został cofnięty.", "until": "ważny do", "soft": "oznaczone przez ciebie", "error": "Nie udało się – odśwież stronę."},
}

SHARE_PAGE = """<!doctype html><html lang="__LANG__"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<meta name="referrer" content="no-referrer"><title>SmartLists</title>
<style>
:root{color-scheme:light dark;--a:#1747b5;--bg:#f4f5f7;--card:#fff;--t:#1d1d1f;--m:#6b6b6b;--d:#e3e3e3}
@media(prefers-color-scheme:dark){:root{--bg:#111;--card:#1c1c1c;--t:#e6e6e6;--m:#9b9b9b;--d:#333}}
body{margin:0;background:var(--bg);color:var(--t);font:16px/1.45 system-ui,sans-serif}
main{max-width:560px;margin:0 auto;padding:16px}
h1{font-size:1.3rem;margin:8px 4px 2px}.sub{color:var(--m);font-size:.85rem;margin:0 4px 12px}
.card{background:var(--card);border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.15);overflow:hidden}
.row{display:flex;gap:12px;align-items:center;padding:12px 14px;border-bottom:1px solid var(--d)}
.row:last-child{border-bottom:none}.row input{width:22px;height:22px;accent-color:var(--a)}
.row.done .nm>span:first-child,.row.soft .nm>span:first-child{color:var(--m)}.row.done .nm>span:first-child{text-decoration:line-through}
.row small{color:var(--a);font-size:.75rem;margin-left:auto}
.add{display:flex;gap:8px;margin-top:12px}.add input{flex:1;height:42px;border-radius:10px;border:1px solid var(--d);background:var(--card);color:var(--t);padding:0 12px;font:inherit}
.add button{height:42px;border-radius:21px;border:none;background:var(--a);color:#fff;padding:0 18px;font:inherit;font-weight:600}
.msg{padding:24px;text-align:center;color:var(--m)}h2{font-size:.8rem;text-transform:uppercase;color:var(--m);margin:16px 6px 6px}
h3{font-size:.78rem;text-transform:uppercase;letter-spacing:.04em;color:var(--m);margin:14px 6px 6px;font-weight:600}h3:first-of-type{margin-top:4px}
.nm{flex:1;min-width:0;display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px}.q{color:var(--t);white-space:nowrap;margin-left:auto;padding-left:8px}
.tag{font-size:.7rem;font-weight:700;padding:1px 7px;border-radius:4px;white-space:nowrap;letter-spacing:.02em}
.tag.store{color:#fff}.tag.person{background:color-mix(in srgb,#7b61ff 15%,transparent);color:#7b61ff;font-weight:600;border-radius:9px}
.tag.tag{background:var(--d);color:var(--m);font-weight:600;border-radius:9px}.tag.s-filled.person,.tag.s-filled.tag{border-radius:4px}
.tag.s-outline{background:none!important;border:1px solid currentColor;padding:0 6px}.tag.s-text{background:none!important;padding:0 2px}
.row.done .tag{opacity:.55}
</style></head><body><main id="app"><div class="msg">…</div></main>
<script>
(function(){
var T=__TEXTS__[document.documentElement.lang]||__TEXTS__.en;
var token=location.pathname.split("/").pop();var api="../api/smartlists/share/"+encodeURIComponent(token)+"?lang="+document.documentElement.lang;
var app=document.getElementById("app");
function el(tag,attrs,kids){var e=document.createElement(tag);for(var k in attrs||{}){if(k==="text")e.textContent=attrs[k];else if(k.slice(0,2)==="on")e.addEventListener(k.slice(2),attrs[k]);else e.setAttribute(k,attrs[k]);}(kids||[]).forEach(function(c){if(c)e.appendChild(c)});return e}
function fail(){app.replaceChildren(el("div",{class:"msg",text:T.gone}))}
function call(body){return fetch(api,body?{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}:{}).then(function(r){if(r.status===404)throw "gone";if(!r.ok)throw "err";return r.json()})}
/* Badges wie in der Karte: Markt gefüllt in Markenfarbe, Person/Schlagwort dezent – mit den Farben des Haushalts */
var DEF={store:{style:"filled",icon:""},person:{style:"soft",icon:"👤"},tag:{style:"soft",icon:"#"}};
function hashColor(s){var x=0;s=String(s).toLowerCase();for(var k=0;k<s.length;k++)x=(x*31+s.charCodeAt(k))>>>0;return "hsl("+(x%360)+" 55% 42%)"}
function textOn(c){var m=/^#([0-9a-f]{6})$/i.exec(c||"");if(!m)return "#fff";var n=parseInt(m[1],16);return 0.299*(n>>16)+0.587*((n>>8)&255)+0.114*(n&255)>170?"#1a1a1a":"#fff"}
function badge(t,look){look=look||{};var kind=t.kind==="store"||t.kind==="person"?t.kind:"tag";
  var k=Object.assign({},DEF[kind],(look.kinds||{})[kind]||{}),v=(look.values||{})[kind+":"+String(t.value).toLowerCase()]||{};
  var label=(kind==="store"&&v.label)||t.label||t.value,color=v.color||(kind==="store"?t.color||k.color||hashColor(t.value):t.color||k.color),tx=v.text||k.text;
  var b=el("span",{class:"tag "+kind+" s-"+k.style,text:(k.icon?(kind==="person"?k.icon+" ":k.icon):"")+label});
  if(color){if(k.style==="filled"){b.style.background=color;b.style.color=tx||textOn(color)}else if(k.style==="soft"){b.style.background="color-mix(in srgb, "+color+" 18%, transparent)";b.style.color=tx||color}else b.style.color=tx||color}
  else if(tx)b.style.color=tx;return b}
function draw(d){
  var open=d.items.filter(function(i){return !i.checked}),done=d.items.filter(function(i){return i.checked});
  var row=function(i){var can=d.check!=="off";var box=el("input",{type:"checkbox"});box.checked=i.checked||i.soft;box.disabled=!can;
    box.addEventListener("change",function(){call({action:box.checked?"check":"uncheck",uid:i.uid}).then(draw,function(e){e==="gone"?fail():alert(T.error)})});
    var name=el("span",{class:"nm"},[el("span",{text:i.name||i.text})].concat((i.tags||[]).map(function(t){return badge(t,d.look)})));
    return el("label",{class:"row"+(i.checked?" done":i.soft?" soft":"")},[box,name,i.soft&&!i.checked?el("small",{text:"✓ "+T.soft}):null,
      i.qty?el("span",{class:"q",text:i.qty+(i.unit?" "+i.unit:"")}):null])};
  /* nach Kategorie gruppiert (Reihenfolge wie im Markt), sofern die Liste so sortiert ist */
  var body=[];
  if(d.categories&&d.categories.length){
    var groups={};open.forEach(function(i){var c=i.cat||"sonstiges";(groups[c]=groups[c]||[]).push(i)});
    d.categories.forEach(function(c){if(groups[c.id]){body.push(el("h3",{text:c.label+" · "+groups[c.id].length}));body.push(el("div",{class:"card"},groups[c.id].map(row)));delete groups[c.id]}});
    Object.keys(groups).forEach(function(c){body.push(el("div",{class:"card"},groups[c].map(row)))});
  }else body.push(el("div",{class:"card"},open.map(row)));
  var kids=[el("h1",{text:d.name}),el("p",{class:"sub",text:open.length+" "+T.open+(d.expires?" · "+T.until+" "+new Date(d.expires*1000).toLocaleDateString():"")})].concat(body);
  if(d.add){var inp=el("input",{placeholder:T.placeholder,maxlength:"120","aria-label":T.placeholder});
    var send=function(){var v=inp.value.trim();if(!v)return;call({action:"add",text:v}).then(function(x){inp.value="";draw(x)},function(e){e==="gone"?fail():alert(T.error)})};
    inp.addEventListener("keydown",function(e){if(e.key==="Enter")send()});
    kids.push(el("div",{class:"add"},[inp,el("button",{type:"button",text:T.add,onclick:send})]))}
  if(done.length){kids.push(el("h2",{text:T.done+" · "+done.length}));kids.push(el("div",{class:"card"},done.map(row)))}
  app.replaceChildren.apply(app,kids)}
function load(){call().then(draw,fail)}
load();setInterval(function(){if(!document.hidden)call().then(draw,function(){})},20000);
})();
</script></body></html>"""


def _page() -> str:
    import json

    return SHARE_PAGE.replace("__TEXTS__", json.dumps(SHARE_TEXTS, ensure_ascii=False))


SHARE_PAGE = _page()


@callback
def async_register_views(hass: HomeAssistant) -> None:
    hass.http.register_view(ShareApiView())
    hass.http.register_view(SharePageView())
