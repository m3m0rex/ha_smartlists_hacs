"""Gemerkte Kategorien, Verlauf und Vorschläge – gilt für den ganzen Haushalt (alle HA-Benutzer).

Gleiche Logik wie in der App (AppSettingsStore / HomeAssistantStore):
  Kategorie = manuelle Zuordnung des Artikels
            > gelerntes Stichwort (längster Teiltreffer, z.B. "milch" gelernt → trifft "Hafermilch")
            > eingebautes Kategorie-Paket
            > "Sonstiges"
  Vorschläge = Verlauf (häufig/zuletzt) > Artikel aus aktuellen Listen > Produkte aus dem Paket

Gespeichert in .storage/smartlists.learning.
"""

from __future__ import annotations

import re
import time
from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store

from . import itemtext
from .categories import FALLBACK_ID, CategoryIndex, normalize
from .const import DOMAIN, SIGNAL_LEARNING_CHANGED

STORAGE_KEY = f"{DOMAIN}.learning"
STORAGE_VERSION = 1
HISTORY_LIMIT = 2000
TIMES_KEPT = 12          # so viele Kaufzeitpunkte pro Artikel für den Rhythmus
DUE_MIN_PURCHASES = 3    # erst ab so vielen Käufen gilt ein Rhythmus als erkannt
DUE_FACTOR = 0.9         # fällig ab 90 % des üblichen Abstands
EXPORT_VERSION = 1
TAG_HISTORY_LIMIT = 200

MENU_ACTIONS = ("rename", "move", "copy", "category", "delete")
# share_who: wer Links erstellen darf (admins | owners = Admins + Besitzer eigener Listen | editors = alle, die die
# Liste bearbeiten dürfen | nobody); share_max: was ein Link höchstens erlauben darf (off = nur ansehen, soft, on =
# abhaken + hinzufügen); share_max_hours: längste Gültigkeit (None = unbegrenzt). Grenzen gelten für Nicht-Admins.
RIGHTS_DEFAULT: dict[str, Any] = {"share_who": "owners", "share_max": "on", "share_max_hours": None,
                                  "create_lists": True, "templates": True, "categories": True, "prices": True}
# Erlaubte Bedien-Einstellungen pro Benutzer → erlaubte Werte
USER_SETTINGS: dict[str, Any] = {
    "press_gesture": ("long", "double", "right", "off"),
    "press_target": ("row", "name"),
    "press_result": ("menu", "edit", "delete"),
    "menu_actions": "actions",
    "row_buttons": bool,
    "shop_hide_checked": bool,
    "shop_keep_awake": bool,
    "shop_large": bool,
    "shop_tap_row": bool,
    "shop_untagged": bool,
    "shop_auto_store": bool,
    # Strichcode: in welche Liste ("" = die Liste der Karte) und ob direkt hinzufügen oder ins Eingabefeld
    "scan_target": "entity",
    "scan_mode": ("input", "add"),
}


def clamp_link(rights: dict[str, Any], check: str, add: bool, hours: int | None) -> tuple[str, bool, int | None]:
    """Grenzen des Admins für Nicht-Admins anwenden: höchstens erlaubte Rechte und Gültigkeit."""
    order = ["off", "soft", "on"]
    top = rights.get("share_max", "on")
    if order.index(check) > order.index(top):
        check = top
    if top != "on":
        add = False
    limit = rights.get("share_max_hours")
    if limit and (hours is None or hours > limit):
        hours = limit
    return check, add, hours


class Learning:
    """Haushaltsweites Gedächtnis der Integration."""

    def __init__(self, hass: HomeAssistant, categories: CategoryIndex) -> None:
        self.hass = hass
        self.categories = categories
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self.manual: dict[str, str] = {}
        self.learned: dict[str, str] = {}
        # name_key → {"name", "count", "last", "unit"}
        self.history: dict[str, dict[str, Any]] = {}
        # "store:rewe" → {"kind", "value", "count", "last"}
        self.tag_history: dict[str, dict[str, Any]] = {}
        self.tag_rules: list[dict[str, str]] = list(itemtext.DEFAULT_TAG_RULES)
        # HA-Benutzer-ID → Bedien-Einstellungen
        self.users: dict[str, dict[str, Any]] = {}
        # Haushalts-Standard für die Bedienung (setzen nur Admins)
        self.ui_defaults: dict[str, Any] = {}
        # Haushalt: Sprachassistent / Automationen (Standard-Liste für Assist, fällige Artikel automatisch)
        self.automation: dict[str, Any] = {}
        self.appearance: dict[str, Any] = {"kinds": {}, "values": {}}
        self._learned_sorted: list[tuple[str, str]] = []

    async def async_load(self) -> None:
        data = await self._store.async_load() or {}
        self.manual = dict(data.get("manual", {}))
        self.learned = dict(data.get("learned", {}))
        self.history = dict(data.get("history", {}))
        self.tag_history = dict(data.get("tag_history", {}))
        self.users = dict(data.get("users", {}))
        self.ui_defaults = dict(data.get("ui_defaults", {}))
        self.automation = dict(data.get("automation", {}))
        self.appearance = validate_appearance(data.get("appearance") or {})
        self._apply_appearance()
        try:
            self.tag_rules = itemtext.validate_rules(data.get("settings", {}).get("tag_rules", itemtext.DEFAULT_TAG_RULES))
        except ValueError:
            self.tag_rules = list(itemtext.DEFAULT_TAG_RULES)
        self._resort()

    def _data(self) -> dict[str, Any]:
        return {
            "manual": self.manual,
            "learned": self.learned,
            "history": self.history,
            "tag_history": self.tag_history,
            "settings": {"tag_rules": self.tag_rules},
            "users": self.users,
            "ui_defaults": self.ui_defaults,
            "automation": self.automation,
            "appearance": self.appearance,
        }

    @callback
    def _changed(self, *, categories: bool = False) -> None:
        self._store.async_delay_save(self._data, 2.0)
        if categories:
            async_dispatcher_send(self.hass, SIGNAL_LEARNING_CHANGED)

    def _resort(self) -> None:
        self._learned_sorted = sorted(self.learned.items(), key=lambda kv: len(kv[0]), reverse=True)

    # ------------------------------------------------------------------
    # Text
    # ------------------------------------------------------------------
    def parse(self, text: str, *, typed: bool = False) -> itemtext.ParsedItem:
        return itemtext.parse(text, self.tag_rules, allow_prefix_quantity=typed)

    def encode(self, item: itemtext.ParsedItem) -> str:
        return itemtext.encode(item, self.tag_rules)

    @callback
    def set_tag_rules(self, rules: Any) -> None:
        self.tag_rules = itemtext.validate_rules(rules)
        self._changed(categories=True)  # Anzeige aller Listen ändert sich

    # ------------------------------------------------------------------
    # Kategorien
    # ------------------------------------------------------------------
    def resolve(self, name: str) -> tuple[str, str]:
        """(category_id, Herkunft) – Herkunft: manual | learned | pack | fallback.
        `name` ist der bereinigte Name (ohne Menge/Tags)."""
        key = normalize(name)
        if not key:
            return FALLBACK_ID, "fallback"
        if (cid := self.manual.get(key)) and self.categories.valid(cid):
            return cid, "manual"
        for word, cid in self._learned_sorted:
            if word in key and self.categories.valid(cid):
                return cid, "learned"
        if cid := self.categories.guess_or_none(key):
            return cid, "pack"
        return FALLBACK_ID, "fallback"

    def resolve_text(self, text: str) -> str:
        """Kategorie direkt aus einem gespeicherten HA-Namen ("Milch 2 l @REWE")."""
        return self.resolve(self.parse(text).name)[0]

    @callback
    def set_category(self, name: str, category_id: str | None) -> None:
        """Manuell zuordnen (oder mit None zurück auf automatisch). Lernt gleich mit – wie in der
        App wird beim Zurücksetzen absichtlich nichts verlernt."""
        key = normalize(name)
        if not key:
            return
        if category_id is None:
            self.manual.pop(key, None)
        else:
            if not self.categories.valid(category_id):
                raise ValueError(f"Unbekannte Kategorie {category_id}")
            self.manual[key] = category_id
            self.learned[key] = category_id
            self._resort()
        self._changed(categories=True)

    @callback
    def forget(self, word: str) -> None:
        key = normalize(word)
        self.learned.pop(key, None)
        self.manual.pop(key, None)
        self._resort()
        self._changed(categories=True)

    def learned_list(self) -> list[dict[str, str]]:
        return [
            {"word": w, "category": c, "label": self.categories.label(c), "manual": w in self.manual}
            for w, c in sorted(self.learned.items())
        ]

    # ------------------------------------------------------------------
    # Verlauf
    # ------------------------------------------------------------------
    @callback
    def record(self, text: str, entity_id: str | None = None) -> None:
        """Nach jedem Hinzufügen aufrufen – merkt Name, Einheit und Tags; mit entity_id auch, in welcher Liste
        (für „häufig gekauft“ und Vorschläge je Liste)."""
        # einfache Liste (z. B. Baumarkt): nichts merken – erscheint so in keiner anderen Liste
        extras = (getattr(self.hass, "data", None) or {}).get(DOMAIN, {}).get("extras")
        if extras is not None and hasattr(extras, "is_plain") and extras.is_plain(entity_id):
            return
        item = self.parse(text)
        key = normalize(item.name)
        if not key:
            return
        now = int(time.time())
        entry = self.history.get(key, {"count": 0})
        # Zeitpunkte merken (für wiederkehrende Artikel); mehrfaches Hinzufügen am selben Tag zählt einmal
        times = [int(t) for t in entry.get("times", []) if isinstance(t, (int, float))]
        if not times or now - times[-1] > 12 * 3600:
            times.append(now)
        # je Liste zählen. Einträge von vor 3.9.4 wissen ihre Liste nicht → "*" (gilt in jeder Liste)
        per_list = dict(entry.get("lists") or {})
        if not per_list and int(entry.get("count", 0)) > 0:
            per_list["*"] = int(entry.get("count", 0))
        if entity_id:
            per_list[entity_id] = int(per_list.get(entity_id, 0)) + 1
        elif per_list:
            per_list["*"] = int(per_list.get("*", 0)) + 1
        entry.update(name=item.name, count=int(entry.get("count", 0)) + 1, last=now, times=times[-TIMES_KEPT:])
        if per_list:
            entry["lists"] = dict(sorted(per_list.items(), key=lambda kv: -kv[1])[:20])
        if item.unit:
            entry["unit"] = item.unit
        self.history[key] = entry
        for tag in item.tags:
            tkey = f'{tag["kind"]}:{tag["value"].lower()}'
            t = self.tag_history.get(tkey, {"count": 0})
            t.update(kind=tag["kind"], value=tag["value"], count=int(t.get("count", 0)) + 1, last=now)
            self.tag_history[tkey] = t
        self._prune()
        self._changed()

    def _prune(self) -> None:
        for data, limit in ((self.history, HISTORY_LIMIT), (self.tag_history, TAG_HISTORY_LIMIT)):
            if len(data) > limit:
                for key, _ in sorted(data.items(), key=lambda kv: kv[1].get("last", 0))[: len(data) - limit]:
                    data.pop(key, None)

    # ------------------------------------------------------------------
    # Wiederkehrende Artikel
    # ------------------------------------------------------------------
    def rhythm(self, name: str) -> dict[str, Any] | None:
        """Üblicher Abstand zwischen zwei Käufen (Median) und wann der nächste fällig ist."""
        entry = self.history.get(normalize(name))
        if not entry:
            return None
        times = sorted(int(t) for t in entry.get("times", []))
        if len(times) < DUE_MIN_PURCHASES:
            return None
        gaps = sorted(b - a for a, b in zip(times, times[1:]) if b - a > 12 * 3600)
        if len(gaps) < DUE_MIN_PURCHASES - 1:
            return None
        median = gaps[len(gaps) // 2] if len(gaps) % 2 else (gaps[len(gaps) // 2 - 1] + gaps[len(gaps) // 2]) / 2
        next_due = times[-1] + DUE_FACTOR * median
        return {"name": entry["name"], "every_days": round(median / 86400, 1), "last": times[-1],
                "next_due": int(next_due), "due": time.time() >= next_due, "unit": entry.get("unit")}

    def due_items(self, present_names: list[str] | None = None, scope: set[str] | None = None) -> list[dict[str, Any]]:
        """Fällige Artikel (Rhythmus erreicht), die gerade nicht offen auf der Liste stehen.
        scope = nur Artikel, die in diesen Listen gekauft wurden (None = alle)."""
        present = {normalize(self.parse(n).name) for n in present_names or []}
        out = []
        for key, entry in self.history.items():
            if key in present or not scoped_count(entry, scope):
                continue
            r = self.rhythm(entry["name"])
            if r and r["due"]:
                cid, _ = self.resolve(r["name"])
                out.append({**r, "category": cid, "category_label": self.categories.label(cid)})
        return sorted(out, key=lambda r: r["next_due"])

    @callback
    def set_automation(self, settings: dict[str, Any]) -> None:
        keep = {k: self.automation.get(k) for k in ("store_zones", "rights", "favorite_stores", "setup_done", "features", "migrated_lists")}
        self.automation = {k: v for k, v in settings.items() if v not in (None, "", [], {})}
        for k, v in keep.items():  # Markt-Zonen und Rechte nicht versehentlich mitlöschen
            if v and k not in settings:
                self.automation[k] = v
        self._changed()

    # Rechte für Benutzer ohne Admin-Rechte (Global → Teilen und Rechte). Fehlende Angaben = Standard.
    def rights(self) -> dict[str, Any]:
        raw = self.automation.get("rights") or {}
        out = dict(RIGHTS_DEFAULT)
        if raw.get("share_who") in ("admins", "owners", "editors", "nobody"):
            out["share_who"] = raw["share_who"]
        if raw.get("share_max") in ("off", "soft", "on"):
            out["share_max"] = raw["share_max"]
        if isinstance(raw.get("share_max_hours"), int) and raw["share_max_hours"] > 0:
            out["share_max_hours"] = raw["share_max_hours"]
        for key in ("create_lists", "templates", "categories", "prices"):
            if isinstance(raw.get(key), bool):
                out[key] = raw[key]
        return out

    def set_rights(self, rights: dict[str, Any]) -> dict[str, Any]:
        self.automation["rights"] = {k: v for k, v in rights.items() if k in RIGHTS_DEFAULT}
        self._changed(categories=True)
        return self.rights()

    # Märkte ↔ Zonen: "rewe" → "zone.rewe_innenstadt". Im Einkaufsmodus wird automatisch der Markt
    # gewählt, in dessen Zone die eigene Person gerade ist.
    # Ein Markt kann mehrere Zonen haben (mehrere Filialen): "rewe" → ["zone.rewe_nord", "zone.rewe_sued"].
    # Früher (2.4.0) stand dort eine einzelne Zone als Text – wird beim Lesen zur Liste.
    @property
    def store_zones(self) -> dict[str, list[str]]:
        raw = self.automation.get("store_zones") or {}
        return {k: ([v] if isinstance(v, str) else [z for z in v if isinstance(z, str)]) for k, v in raw.items() if v}

    def set_store_zone(self, store: str, zone: str | None = None, zones: list[str] | None = None,
                       add: bool = False) -> dict[str, list[str]]:
        """zones = komplette Liste; zone = eine Zone (add=True: hinzufügen, sonst ersetzen; None = alle lösen)."""
        key = store.strip().lstrip("@").lower()
        if not key:
            raise ValueError("Markt fehlt")
        current = self.store_zones
        new = list(zones) if zones is not None else ([*current.get(key, []), zone] if add and zone else [zone] if zone else [])
        new = list(dict.fromkeys(z for z in new if z))
        if any(not z.startswith("zone.") for z in new):
            raise ValueError("Keine Zone (zone.…)")
        if new:
            current[key] = new
        else:
            current.pop(key, None)
        self.automation["store_zones"] = current
        self._changed()
        return current

    def stores(self) -> list[dict[str, Any]]:
        """Bekannte Märkte: schon benutzte (@REWE in Artikeln) + bekannte Ketten + verknüpfte."""
        out: dict[str, dict[str, Any]] = {}
        for t in self.tag_history.values():
            if t.get("kind") == "store" and t.get("value"):
                label, color = itemtext.store_display(str(t["value"]))
                out.setdefault(str(t["value"]).lower(), {"value": t["value"], "label": label, "color": color, "count": int(t.get("count", 0))})
        for key, (label, color) in itemtext.KNOWN_STORES.items():
            out.setdefault(key.lower(), {"value": label, "label": label, "color": color, "count": 0})
        for key in self.store_zones:
            out.setdefault(key, {"value": key, "label": key, "color": None, "count": 0})
        for value in self.automation.get("favorite_stores") or []:  # in der Einrichtung gewählt
            label, color = itemtext.store_display(str(value))
            out.setdefault(str(value).lower(), {"value": value, "label": label, "color": color, "count": 0})
        zones = self.store_zones
        # "zone" (erste) bleibt für ältere Karten/App erhalten, "zones" = alle
        rows = [{**v, "key": k, "zones": zones.get(k, []), "zone": (zones.get(k) or [None])[0]} for k, v in out.items()]
        return sorted(rows, key=lambda r: (not r["zones"], -r["count"], r["label"].casefold()))

    # ------------------------------------------------------------------
    # Export / Import der Haushalts-Einstellungen
    # ------------------------------------------------------------------
    def export(self, include_history: bool = True) -> dict[str, Any]:
        data = self._data()
        data.pop("users", None)  # persönliche Einstellungen gehören zu Benutzern dieser Instanz
        if not include_history:
            data.pop("history", None)
            data.pop("tag_history", None)
        return {"smartlists_export": EXPORT_VERSION, "exported_at": int(time.time()), **data}

    @callback
    def import_data(self, data: dict[str, Any], replace: bool = False) -> dict[str, int]:
        """Merge (Standard): Vorhandenes bleibt, Importiertes ergänzt/überschreibt gleiche Wörter."""
        if not isinstance(data, dict) or data.get("smartlists_export") != EXPORT_VERSION:
            raise ValueError("Keine SmartLists-Exportdatei (oder neuere Version)")
        counts = {}
        for key in ("manual", "learned", "history", "tag_history"):
            incoming = data.get(key) or {}
            if not isinstance(incoming, dict):
                continue
            target: dict[str, Any] = getattr(self, key)
            if replace:
                target.clear()
            target.update(incoming)
            counts[key] = len(incoming)
        if isinstance(data.get("settings"), dict) and data["settings"].get("tag_rules"):
            self.tag_rules = itemtext.validate_rules(data["settings"]["tag_rules"])
        if isinstance(data.get("ui_defaults"), dict):
            self.ui_defaults = validate_ui(data["ui_defaults"])
        if isinstance(data.get("automation"), dict):
            self.automation = dict(data["automation"])
        if isinstance(data.get("appearance"), dict):
            self.appearance = validate_appearance(data["appearance"])
            self._apply_appearance()
        # nur bekannte Kategorien behalten
        for key in ("manual", "learned"):
            target = getattr(self, key)
            for word in [w for w, c in target.items() if not self.categories.valid(c)]:
                target.pop(word)
        self._resort()
        self._changed(categories=True)
        return counts

    @callback
    def reset(self, settings: bool = True, data: bool = True) -> None:
        """Von vorn anfangen. settings: Namenskonvention, Badges, Märkte/Zonen, Rechte, Assist/Automationen,
        Bedienung für alle. data: gemerkte Kategorien, Verlauf. Persönliche Einstellungen der Benutzer bleiben."""
        if settings:
            self.tag_rules = list(itemtext.DEFAULT_TAG_RULES)
            self.appearance = {"kinds": {}, "values": {}}
            self._apply_appearance()
            self.ui_defaults = {}
            self.automation = {}
        if data:
            self.manual.clear()
            self.learned.clear()
            self.history.clear()
            self.tag_history.clear()
        self.automation.pop("setup_done", None)
        self.automation["setup_pending"] = True  # Assistent beim nächsten Öffnen zeigen, auch wenn Daten bleiben
        self._resort()
        self._changed(categories=True)

    @callback
    def clear_history(self) -> None:
        """Verlauf (Vorschläge, häufig gekauft, Tag-Verlauf) löschen – Kategorien bleiben."""
        self.history.clear()
        self.tag_history.clear()
        self._changed()

    def unit_for(self, name: str) -> str | None:
        """Zuletzt benutzte Einheit, sonst die übliche aus dem Paket."""
        entry = self.history.get(normalize(name))
        if entry and entry.get("unit"):
            return entry["unit"]
        return self.categories.default_unit(name)

    # ------------------------------------------------------------------
    # Vorschläge
    # ------------------------------------------------------------------
    def suggest(self, query: str, list_names: list[str] | None = None, limit: int = 8, scope: set[str] | None = None) -> dict[str, Any]:
        """Vorschläge fürs Eingabefeld. Tippt man gerade einen Tag ("@Re"), kommen Märkte/Tags.
        scope: Verlauf nur aus diesen Listen (Einstellung der Liste, kombinierte Liste = ihre Quell-Listen); None = alle."""
        if (open_tag := itemtext.open_tag_query(query, self.tag_rules)) is not None:
            return {"mode": "tag", "kind": open_tag[0], "suggestions": self._suggest_tags(*open_tag, limit)}

        if scope is not None and not scope:
            return {"mode": "frequent" if not query.strip() else "name", "suggestions": []}  # einfache Liste
        typed = self.parse(query, typed=True)
        q = normalize(typed.name)
        if not q:
            due = [{**self._entry(d["name"], "due"), "every_days": d["every_days"]} for d in self.due_items(list_names or [], scope)][:limit]
            seen = {normalize(d["name"]) for d in due}
            rest = [e for e in self._frequent(list_names or [], limit, scope) if normalize(e["name"]) not in seen]
            return {"mode": "frequent", "suggestions": (due + rest)[:limit]}
        scores: dict[str, tuple[int, str, str]] = {}

        def consider(name: str, prefix_score: int, contains_score: int, source: str) -> None:
            key = normalize(name)
            if not key or key == q:
                return
            if key.startswith(q):
                score = prefix_score
            elif q in key:
                score = contains_score
            else:
                return
            if score > scores.get(key, (-1, "", ""))[0]:
                scores[key] = (score, name.strip(), source)

        for entry in self.history.values():
            count = scoped_count(entry, scope)
            if count:
                consider(entry["name"], 10_000 + count, 1_000 + count, "history")
        for name in list_names or []:
            consider(self.parse(name).name, 50, 10, "list")
        if len(q) >= 2:
            for product in self.categories.products:
                consider(product[0], 5, 1, "pack")

        best = sorted(scores.values(), key=lambda s: (-s[0], s[1].casefold()))[:limit]
        return {"mode": "name", "suggestions": [self._entry(name, source) for _, name, source in best]}

    def _entry(self, name: str, source: str) -> dict[str, Any]:
        cid, origin = self.resolve(name)
        return {
            "name": name,
            "category": cid,
            "category_label": self.categories.label(cid),
            "category_source": origin,
            "unit": self.unit_for(name),
            "source": source,
        }

    def _frequent(self, list_names: list[str], limit: int, scope: set[str] | None = None) -> list[dict[str, Any]]:
        """Leeres Eingabefeld: oft gekaufte Artikel, die gerade nicht auf der Liste stehen."""
        present = {normalize(self.parse(n).name) for n in list_names}
        now = time.time()

        def score(e: dict[str, Any]) -> float:
            # Häufigkeit zählt, lange nicht Gekauftes verliert langsam an Gewicht (Halbwert ~60 Tage)
            age_days = max(0.0, (now - float(e.get("last", now))) / 86400)
            return scoped_count(e, scope) * 0.5 ** (age_days / 60)

        ranked = sorted(
            (e for k, e in self.history.items() if k not in present and scoped_count(e, scope) >= 2),
            key=score,
            reverse=True,
        )
        return [self._entry(e["name"], "history") for e in ranked[:limit]]

    def _suggest_tags(self, kind: str, partial: str, limit: int) -> list[dict[str, Any]]:
        p = partial.lower()
        found: dict[str, dict[str, Any]] = {}
        for t in sorted(self.tag_history.values(), key=lambda t: (-int(t.get("count", 0)), -int(t.get("last", 0)))):
            if t["kind"] == kind and t["value"].lower().startswith(p):
                found.setdefault(t["value"].lower(), {"value": t["value"], "source": "history"})
        if kind == "store":
            for key, (label, _) in itemtext.KNOWN_STORES.items():
                if key.startswith(p):
                    found.setdefault(key, {"value": label, "source": "known"})
        out = []
        for entry in list(found.values())[:limit]:
            label, color = itemtext.store_display(entry["value"]) if kind == "store" else (entry["value"], None)
            out.append({**entry, "kind": kind, "label": label, "color": color})
        return out

    # ------------------------------------------------------------------
    # Für Karte/App
    # ------------------------------------------------------------------
    def describe(self, text: str) -> dict[str, Any]:
        """Alles, was eine Oberfläche zu einem Artikeltext braucht."""
        item = self.parse(text)
        cid, origin = self.resolve(item.name)
        return {**item.as_dict(), "category": cid, "category_source": origin}

    # ------------------------------------------------------------------
    # Bedienung: eingebaute Werte < Haushalts-Standard (Admin) < Benutzer < Gerät (nur in der Karte)
    # ------------------------------------------------------------------
    def user_settings(self, user_id: str) -> dict[str, Any]:
        return {"defaults": dict(self.ui_defaults), "settings": dict(self.users.get(user_id, {}))}

    @callback
    def set_user_settings(self, user_id: str, settings: dict[str, Any]) -> dict[str, Any]:
        """Eigene Abweichungen vom Haushalts-Standard; leeres dict = alles wie Standard."""
        self.users[user_id] = validate_ui(settings)
        self._changed()
        return self.user_settings(user_id)

    @callback
    def set_ui_defaults(self, settings: dict[str, Any], user_id: str) -> dict[str, Any]:
        """Haushalts-Standard (nur Admins, Prüfung im WebSocket-Befehl)."""
        self.ui_defaults = validate_ui(settings)
        self._changed()
        return self.user_settings(user_id)

    def config(self, language: str | None = None) -> dict[str, Any]:
        return {
            "categories": self.categories.as_list(language),
            "tag_rules": self.tag_rules,
            "tag_kinds": list(itemtext.TAG_KINDS),
            "allowed_prefixes": itemtext.ALLOWED_PREFIXES,
            # bekannte Ketten + im Haushalt angepasste Märkte, jeweils mit eigener Farbe/Schreibweise
            "known_stores": [{"value": label, "color": color} for label, color in
                             (itemtext.store_display(k) for k in dict.fromkeys([*itemtext.KNOWN_STORES, *itemtext.STORE_OVERRIDES]))],
            "store_zones": self.store_zones,
            "appearance": self.appearance,
            "rights": self.rights(),
            "favorite_stores": list(self.automation.get("favorite_stores") or []),
            # Einrichtungs-Assistent: nur, wenn er noch nie lief und noch nichts benutzt wurde (bestehende
            # Installationen sehen ihn nach dem Update nicht ungefragt)
            "setup_needed": not self.automation.get("setup_done")
            and (bool(self.automation.get("setup_pending")) or (not self.history and not self.manual)),
        }

    # ------------------------------------------------------------------
    # Badges & Farben (Haushalt)
    # ------------------------------------------------------------------
    def _apply_appearance(self) -> None:
        itemtext.STORE_OVERRIDES.clear()
        for key, v in self.appearance.get("values", {}).items():
            kind, _, value = key.partition(":")
            if kind == "store":
                itemtext.STORE_OVERRIDES[value] = (v.get("label"), v.get("color"))

    def set_appearance(self, appearance: dict[str, Any]) -> dict[str, Any]:
        self.appearance = validate_appearance(appearance)
        self._apply_appearance()
        self._changed(categories=True)  # Listen neu zeichnen (Farben/Namen der Märkte)
        return self.appearance

    def tag_overview(self) -> list[dict[str, Any]]:
        """Alle bekannten Badges (benutzt, bekannte Märkte, angepasste) für die Einstellungen."""
        out: dict[str, dict[str, Any]] = {}

        def add(kind: str, value: str, count: int = 0) -> None:
            key = f"{kind}:{value.lower()}"
            label, color = itemtext.store_display(value) if kind == "store" else (value, None)
            e = out.setdefault(key, {"key": key, "kind": kind, "value": value, "label": label, "color": color, "count": 0})
            e["count"] += count

        for t in self.tag_history.values():
            if t.get("kind") and t.get("value"):
                add(t["kind"], str(t["value"]), int(t.get("count", 0)))
        for label, _ in itemtext.KNOWN_STORES.values():
            add("store", label)
        for key in self.appearance.get("values", {}):
            kind, _, value = key.partition(":")
            add(kind, value)
        custom = self.appearance.get("values", {})
        rows = [{**e, "custom": custom.get(e["key"], {})} for e in out.values()]
        order = {"store": 0, "person": 1, "tag": 2}
        return sorted(rows, key=lambda r: (order.get(r["kind"], 9), not r["custom"], -r["count"], r["label"].casefold()))


_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")
BADGE_STYLES = ("filled", "soft", "outline", "text")


def scoped_count(entry: dict[str, Any], scope: set[str] | None) -> int:
    """Wie oft ein Artikel in den Listen `scope` hinzugefügt wurde. None = überall. Ohne Angabe je Liste (Verlauf
    von vor 3.9.4) bzw. unter "*" Gezähltes gilt in jeder Liste – so verschwinden alte Vorschläge nicht."""
    total = int(entry.get("count", 1) or 0)
    if scope is None:
        return total
    per_list = entry.get("lists")
    if not isinstance(per_list, dict) or not per_list:
        return total
    return sum(int(v) for k, v in per_list.items() if k == "*" or k in scope)


def validate_appearance(raw: Any) -> dict[str, Any]:
    """Badges & Farben prüfen. Unbekanntes wird verworfen (statt Fehler), damit ältere/neuere Dateien
    weiter funktionieren:
        {"kinds": {"store"|"person"|"tag": {"style", "color", "text", "icon"}},
         "values": {"store:rewe": {"color", "text", "label"}, "person:anna": {"color", "text"}, "tag:bio": {"color", "text"}}}
    color = Hintergrund bzw. Hauptfarbe, text = Schriftfarbe (optional)."""
    out: dict[str, Any] = {"kinds": {}, "values": {}}
    if not isinstance(raw, dict):
        return out
    for kind, v in (raw.get("kinds") or {}).items():
        if kind not in itemtext.TAG_KINDS or not isinstance(v, dict):
            continue
        clean = {}
        if v.get("style") in BADGE_STYLES:
            clean["style"] = v["style"]
        if isinstance(v.get("color"), str) and _COLOR.match(v["color"]):
            clean["color"] = v["color"].lower()
        if isinstance(v.get("text"), str) and _COLOR.match(v["text"]):
            clean["text"] = v["text"].lower()
        if isinstance(v.get("icon"), str) and len(v["icon"]) <= 4:
            clean["icon"] = v["icon"]
        if clean:
            out["kinds"][kind] = clean
    for key, v in list((raw.get("values") or {}).items())[:500]:
        kind, _, value = str(key).partition(":")
        if kind not in itemtext.TAG_KINDS or not value.strip() or not isinstance(v, dict):
            continue
        clean = {}
        if isinstance(v.get("color"), str) and _COLOR.match(v["color"]):
            clean["color"] = v["color"].lower()
        if isinstance(v.get("text"), str) and _COLOR.match(v["text"]):
            clean["text"] = v["text"].lower()
        if kind == "store" and isinstance(v.get("label"), str) and v["label"].strip():
            clean["label"] = v["label"].strip()[:30]
        if clean:
            out["values"][f"{kind}:{value.strip().lower()}"] = clean
    return out


def validate_ui(settings: dict[str, Any]) -> dict[str, Any]:
    """Nur bekannte Bedien-Einstellungen mit gültigen Werten übernehmen."""
    clean: dict[str, Any] = {}
    for key, value in settings.items():
        allowed = USER_SETTINGS.get(key)
        if allowed is None:
            raise ValueError(f"Unbekannte Einstellung {key}")
        if allowed is bool:
            if not isinstance(value, bool):
                raise ValueError(f"{key} muss an/aus sein")
        elif allowed == "entity":
            if not isinstance(value, str) or (value and not value.startswith("todo.")):
                raise ValueError(f"{key}: keine To-do-Liste")
        elif allowed == "actions":
            if not isinstance(value, list) or any(v not in MENU_ACTIONS for v in value):
                raise ValueError(f"{key}: ungültige Menü-Einträge")
        elif value not in allowed:
            raise ValueError(f"{key}: ungültiger Wert {value}")
        clean[key] = value
    return clean


async def async_get_learning(hass: HomeAssistant) -> Learning:
    data = hass.data.setdefault(DOMAIN, {})
    if "learning" not in data:
        from .categories import async_get_categories

        learning = Learning(hass, await async_get_categories(hass))
        await learning.async_load()
        data["learning"] = learning
    return data["learning"]
