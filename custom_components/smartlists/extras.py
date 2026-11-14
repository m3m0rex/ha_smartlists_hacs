"""Zusatz-Funktionen des Haushalts (.storage/smartlists.extras):

- Reihenfolge der Kategorien je Markt (und optional je Filiale/Zone) für den Einkaufsmodus
- Preise je Artikel (zuletzt bezahlt / von Hand) und Ausgaben (beim Abhaken gebucht)
- Vorlagen („Grillabend“, „Pfannkuchen“ mit Portionen)
- Strichcodes → Produktname (Cache für Open Food Facts)
- Statistik aus dem vorhandenen Verlauf

Alles optional: ohne Einträge verhält sich SmartLists wie bisher.
"""

from __future__ import annotations

import re
import secrets
import time
from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store

from . import itemtext
from .categories import CATEGORY_IDS, normalize
from .const import DOMAIN

STORAGE_KEY = f"{DOMAIN}.extras"
MAX_EXPENSES = 5000
MAX_TEMPLATES = 60
MAX_BARCODES = 3000
# Preis am Ende des Textes: "Milch 2 l 1,19€", "Butter 1.79 €", "Kaffee €6,49"
# Preis als eigenes Wort irgendwo im Text ("Milch 2 l 1,19€ @REWE", "€6,49 Kaffee"), auch "EUR"
_PRICE = re.compile(r"(?<!\S)(?:[-–—]\s+)?(?:€\s?(\d+(?:[.,]\d{1,2})?)|(\d+(?:[.,]\d{1,2})?)\s?(?:€|EUR\b|eur\b))(?!\S)")


def split_price(text: str) -> tuple[str, float | None]:
    """Preis-Angabe am Ende des Textes abtrennen (kommt nicht in den Artikelnamen)."""
    m = None
    for m in _PRICE.finditer(text):
        pass  # bei mehreren Angaben zählt die letzte
    if not m:
        return text, None
    value = float((m.group(1) or m.group(2)).replace(",", "."))
    return " ".join((text[: m.start()] + " " + text[m.end():]).split()), value


class Extras:
    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store[dict[str, Any]] = Store(hass, 1, STORAGE_KEY)
        # "rewe" bzw. "rewe@zone.rewe_nord" → [Kategorie-IDs in Gang-Reihenfolge]
        self.store_order: dict[str, list[str]] = {}
        # Artikelname (normalisiert) → {"price", "store", "at", "source": "manual"|"paid"}
        self.prices: dict[str, dict[str, Any]] = {}
        # Buchungen: {"t", "name", "amount", "store", "user", "list"}
        self.expenses: list[dict[str, Any]] = []
        # id → {"name", "emoji", "servings", "items": [Text, …]}
        self.templates: dict[str, dict[str, Any]] = {}
        self.barcodes: dict[str, dict[str, Any]] = {}
        # Einkauf: wann wurde ein Artikel abgehakt, wann wurde der letzte Einkauf beendet (je Liste)
        # Darstellung je Liste (für alle Geräte): {"sort": "category"|…, "show_prices": bool}
        self.list_settings: dict[str, dict[str, Any]] = {}
        # Wochenplan: "2026-11-16" → [Vorlagen-IDs]
        self.mealplan: dict[str, list[str]] = {}
        self.checked_at: dict[str, dict[str, int]] = {}
        self.trips: dict[str, int] = {}

    async def async_load(self) -> None:
        data = await self._store.async_load() or {}
        self.store_order = {k: [c for c in v if c in CATEGORY_IDS] for k, v in (data.get("store_order") or {}).items()}
        self.prices = dict(data.get("prices") or {})
        self.expenses = list(data.get("expenses") or [])[-MAX_EXPENSES:]
        self.templates = dict(data.get("templates") or {})
        self.barcodes = dict(data.get("barcodes") or {})
        self.checked_at = {k: dict(v) for k, v in (data.get("checked_at") or {}).items()}
        self.trips = dict(data.get("trips") or {})
        self.list_settings = dict(data.get("list_settings") or {})
        self.mealplan = {k: [x for x in v if isinstance(x, str)] for k, v in (data.get("mealplan") or {}).items() if isinstance(v, list)}

    def _data(self) -> dict[str, Any]:
        return {"store_order": self.store_order, "prices": self.prices, "expenses": self.expenses,
                "templates": self.templates, "barcodes": self.barcodes, "checked_at": self.checked_at, "trips": self.trips,
                "list_settings": self.list_settings, "mealplan": self.mealplan}

    def _save(self) -> None:
        self._store.async_delay_save(self._data, 2.0)
        from homeassistant.helpers.dispatcher import async_dispatcher_send

        from .const import SIGNAL_DATA_CHANGED

        if hasattr(self.hass, "loop"):
            async_dispatcher_send(self.hass, SIGNAL_DATA_CHANGED)

    # ---- Markt-Reihenfolge ------------------------------------------------
    @callback
    def set_store_order(self, store: str, order: list[str] | None, zone: str | None = None) -> dict[str, list[str]]:
        key = store.strip().lstrip("@").lower() + (f"@{zone}" if zone else "")
        if not key or key.startswith("@"):
            raise ValueError("Markt fehlt")
        clean = [c for c in dict.fromkeys(order or []) if c in CATEGORY_IDS]
        if clean:
            # fehlende Kategorien hinten anhängen, damit nichts „verschwindet“
            self.store_order[key] = clean + [c for c in CATEGORY_IDS if c not in clean]
        else:
            self.store_order.pop(key, None)
        self._save()
        return self.store_order

    # ---- Preise & Ausgaben --------------------------------------------------
    def price_for(self, name: str) -> dict[str, Any] | None:
        return self.prices.get(normalize(name))

    @callback
    def set_price(self, name: str, price: float | None, store: str | None = None, source: str = "manual") -> None:
        key = normalize(itemtext.parse(name, []).name or name)
        if not key:
            return
        if price is None:
            self.prices.pop(key, None)
        else:
            self.prices[key] = {"price": round(float(price), 2), "store": store, "at": int(time.time()), "source": source}
        self._save()

    @callback
    def book(self, name: str, quantity: float | None, store: str | None, user: str | None, entity_id: str,
             price: float | None = None) -> dict[str, Any] | None:
        """Beim Abhaken: Ausgabe buchen (Preis × Menge), Preis als „zuletzt bezahlt“ merken."""
        info = self.price_for(name) if price is None else {"price": price}
        if not info or info.get("price") is None:
            return None
        amount = round(float(info["price"]) * (quantity if quantity and quantity > 0 else 1), 2)
        entry = {"id": secrets.token_hex(5), "t": int(time.time()), "name": name, "amount": amount,
                 "store": (store or "").lower() or None, "user": user, "list": entity_id}
        self.expenses.append(entry)
        self.expenses = self.expenses[-MAX_EXPENSES:]
        if price is not None:
            self.prices[normalize(name)] = {"price": round(float(price), 2), "store": store, "at": entry["t"], "source": "paid"}
        self._save()
        return entry

    @callback
    def unbook(self, name: str, entity_id: str, within: int = 6 * 3600) -> None:
        """Wieder geöffnet → letzte passende Buchung (der letzten Stunden) zurücknehmen."""
        now = time.time()
        for i in range(len(self.expenses) - 1, -1, -1):
            e = self.expenses[i]
            if e["name"] == name and e["list"] == entity_id and now - e["t"] < within:
                self.expenses.pop(i)
                self._save()
                return

    # ---- Wochenplan ------------------------------------------------------------
    @callback
    def set_meals(self, day: str, template_ids: list[str]) -> list[str]:
        import datetime as dt

        dt.date.fromisoformat(day)  # ValueError bei falschem Datum
        ids = [t for t in dict.fromkeys(template_ids) if t in self.templates][:6]
        if ids:
            self.mealplan[day] = ids
        else:
            self.mealplan.pop(day, None)
        # alte Tage (älter als 60 Tage) aufräumen
        cutoff = (dt.date.today() - dt.timedelta(days=60)).isoformat()
        for k in [k for k in self.mealplan if k < cutoff]:
            self.mealplan.pop(k)
        self._save()
        return ids

    def meal_names(self, day: str) -> list[str]:
        return [f"{self.templates[t].get('emoji') or ''} {self.templates[t]['name']}".strip()
                for t in self.mealplan.get(day, []) if t in self.templates]

    def plan(self, start: str, days: int) -> list[dict[str, Any]]:
        import datetime as dt

        d0 = dt.date.fromisoformat(start)
        out = []
        for i in range(max(1, min(days, 31))):
            day = (d0 + dt.timedelta(days=i)).isoformat()
            out.append({"date": day, "templates": [{"id": t, "name": self.templates[t]["name"], "emoji": self.templates[t].get("emoji", "")}
                                                   for t in self.mealplan.get(day, []) if t in self.templates]})
        return out

    @callback
    def reset(self, settings: bool = True, data: bool = True) -> None:
        """settings: Gang-Reihenfolgen, Darstellung je Liste. data: Preise, Ausgaben, Vorlagen, Wochenplan, Einkäufe.
        Gemerkte Strichcodes bleiben (reiner Zwischenspeicher)."""
        if settings:
            self.store_order.clear()
            self.list_settings.clear()
        if data:
            self.prices.clear()
            self.expenses.clear()
            self.templates.clear()
            self.mealplan.clear()
            self.checked_at.clear()
            self.trips.clear()
        self._save()

    @callback
    def set_list_settings(self, entity_id: str, sort: str | None = None, show_prices: bool | None = None,
                          categories: bool | None = None, suggest_scope: str | None = None,
                          plain: bool | None = None) -> dict[str, Any]:
        """plain=True: „einfache Liste“ – SmartLists merkt sich aus ihr nichts (kein Verlauf, keine Preise, keine
        Kategorien) und schlägt nichts vor; was dort steht, erscheint nirgends sonst (z. B. Baumarkt).
        categories=False: keine automatischen Kategorien in dieser Liste (auch nicht beim Eintippen).
        suggest_scope: "list" (Standard) = Vorschläge/häufig gekauft nur aus dieser Liste, "all" = aus allen Listen."""
        cur = dict(self.list_settings.get(entity_id) or {})
        if sort is not None:
            if sort in ("category", "alpha", "added", "list"):
                cur["sort"] = sort
            else:
                cur.pop("sort", None)
        if show_prices is not None:
            cur["show_prices"] = bool(show_prices)
        if categories is not None:
            if categories:
                cur.pop("categories", None)
            else:
                cur["categories"] = False
        if plain is not None:
            if plain:
                cur["plain"] = True
            else:
                cur.pop("plain", None)
        if suggest_scope is not None:
            if suggest_scope == "all":
                cur["suggest_scope"] = "all"
            else:
                cur.pop("suggest_scope", None)
        if cur:
            self.list_settings[entity_id] = cur
        else:
            self.list_settings.pop(entity_id, None)
        self._save()
        return cur

    def is_plain(self, entity_id: str | None) -> bool:
        return bool(entity_id) and bool((self.list_settings.get(entity_id) or {}).get("plain"))

    @callback
    def mark_checked(self, entity_id: str, uid: str, checked: bool) -> None:
        marks = self.checked_at.setdefault(entity_id, {})
        if checked:
            marks[uid] = int(time.time())
            if len(marks) > 500:
                for k, _ in sorted(marks.items(), key=lambda kv: kv[1])[: len(marks) - 500]:
                    marks.pop(k)
        else:
            marks.pop(uid, None)
        self._save()

    @callback
    def finish_trip(self, entity_id: str) -> int:
        """„Einkauf beendet“: Summe „im Wagen“ beginnt wieder bei 0 (Abgehaktes bleibt abgehakt)."""
        self.trips[entity_id] = int(time.time())
        self.checked_at.pop(entity_id, None)
        self._save()
        return self.trips[entity_id]

    @staticmethod
    def expense_id(e: dict[str, Any]) -> str:
        return e.get("id") or f"{e['t']}:{e['name']}"  # Buchungen vor 2.9.0 haben keine ID

    def expense_entries(self, user_id: str | None = None, limit: int = 100) -> list[dict[str, Any]]:
        """Letzte Buchungen (neueste zuerst); user_id = nur eigene."""
        rows = [e for e in self.expenses if user_id is None or e.get("user") == user_id]
        return [{**e, "id": self.expense_id(e)} for e in reversed(rows[-limit:])]

    @callback
    def delete_expense(self, expense_id: str, user_id: str | None = None) -> bool:
        """Falsche Buchung löschen (Admins: alle, sonst nur eigene)."""
        for i, e in enumerate(self.expenses):
            if self.expense_id(e) == expense_id and (user_id is None or e.get("user") == user_id):
                self.expenses.pop(i)
                self._save()
                return True
        return False

    def expense_report(self, period: str = "month", count: int = 6) -> dict[str, Any]:
        """Summen je Zeitraum (month|week|year) und Markt, neueste zuletzt."""
        import datetime as dt

        def bucket(ts: int) -> str:
            d = dt.datetime.fromtimestamp(ts)
            if period == "year":
                return f"{d.year}"
            if period == "week":
                y, w, _ = d.isocalendar()
                return f"{y}-W{w:02d}"
            return f"{d.year}-{d.month:02d}"

        buckets: dict[str, dict[str, float]] = {}
        for e in self.expenses:
            b = buckets.setdefault(bucket(e["t"]), {})
            key = e.get("store") or ""
            b[key] = round(b.get(key, 0) + float(e["amount"]), 2)
        keys = sorted(buckets)[-count:]
        rows = [{"period": k, "total": round(sum(buckets[k].values()), 2), "stores": buckets[k]} for k in keys]
        totals = [r["total"] for r in rows]
        return {"period": period, "rows": rows, "average": round(sum(totals) / len(totals), 2) if totals else 0}

    def month_total(self) -> float:
        import datetime as dt

        now = dt.datetime.now()
        start = dt.datetime(now.year, now.month, 1).timestamp()
        return round(sum(float(e["amount"]) for e in self.expenses if e["t"] >= start), 2)

    # ---- Vorlagen ----------------------------------------------------------------
    @callback
    def save_template(self, template_id: str | None, name: str, items: list[str], emoji: str = "", servings: int | None = None) -> str:
        name = name.strip()[:60]
        if not name:
            raise ValueError("Name fehlt")
        items = [str(i).strip()[:200] for i in items if str(i).strip()][:100]
        if not items:
            raise ValueError("Vorlage ohne Artikel")
        tid = template_id or secrets.token_hex(4)
        if tid not in self.templates and len(self.templates) >= MAX_TEMPLATES:
            raise ValueError(f"Höchstens {MAX_TEMPLATES} Vorlagen")
        self.templates[tid] = {"name": name, "emoji": (emoji or "")[:4], "servings": int(servings) if servings else None, "items": items}
        self._save()
        return tid

    @callback
    def delete_template(self, template_id: str) -> None:
        self.templates.pop(template_id, None)
        self._save()

    def find_template(self, spoken: str) -> str | None:
        want = normalize(spoken).strip(" .!?")
        for tid, t in self.templates.items():
            if normalize(t["name"]) == want:
                return tid
        return None

    # ---- Strichcodes ----------------------------------------------------------------
    @callback
    def remember_barcode(self, code: str, info: dict[str, Any]) -> None:
        self.barcodes[code] = {**info, "at": int(time.time())}
        if len(self.barcodes) > MAX_BARCODES:
            for k, _ in sorted(self.barcodes.items(), key=lambda kv: kv[1].get("at", 0))[: len(self.barcodes) - MAX_BARCODES]:
                self.barcodes.pop(k, None)
        self._save()

    # ---- Export ------------------------------------------------------------------------
    def export(self) -> dict[str, Any]:
        return self._data()

    @callback
    def import_data(self, data: dict[str, Any]) -> None:
        if not isinstance(data, dict):
            return
        self.store_order.update({k: v for k, v in (data.get("store_order") or {}).items() if isinstance(v, list)})
        self.prices.update(data.get("prices") or {})
        self.templates.update(data.get("templates") or {})
        self.barcodes.update(data.get("barcodes") or {})
        self._save()


def ingredient_text(ing: dict[str, Any]) -> str:
    """Zutat aus Mealie als Artikeltext ("Mehl 250 g"); leere/Überschrift-Zeilen → ""."""
    if not isinstance(ing, dict):
        return str(ing or "").strip()
    for key in ("display", "original_text", "note"):
        if ing.get(key) and str(ing[key]).strip():
            return " ".join(str(ing[key]).split())[:120]
    food = ing.get("food") or {}
    name = food.get("name") if isinstance(food, dict) else food
    unit = ing.get("unit") or {}
    unit = unit.get("abbreviation") or unit.get("name") if isinstance(unit, dict) else unit
    qty = ing.get("quantity")
    parts = [str(name or "").strip(), f"{qty:g}" if isinstance(qty, (int, float)) and qty else "", str(unit or "").strip()]
    return " ".join(p for p in parts if p)[:120]


def scale_quantity(text: str, factor: float) -> str:
    """Menge im Vorlagen-Text umrechnen ("Mehl 250 g" × 2 → "Mehl 500 g")."""
    if factor == 1:
        return text
    item = itemtext.parse(text, [], allow_prefix_quantity=True)
    if item.quantity is None:
        return text
    q = item.quantity * factor
    item.quantity = round(q) if item.unit in (None, "", "Stk", "stk") and q >= 1 else round(q, 2)
    return itemtext.encode(item, [])


def stats(learning: Any, extras: Extras, days: int = 90) -> dict[str, Any]:
    """Statistik aus dem Verlauf: häufig gekauft (mit Rhythmus), lange nicht gekauft, Anteile."""
    now = time.time()
    since = now - days * 86400 if days else 0
    top = []
    overdue = []
    cats: dict[str, int] = {}
    for entry in learning.history.values():
        times = [int(t) for t in entry.get("times", []) if t >= since]
        if not times:
            continue
        r = learning.rhythm(entry["name"])
        row = {"name": entry["name"], "count": len(times), "every_days": r["every_days"] if r else None, "last": entry.get("last")}
        top.append(row)
        cid, _ = learning.resolve(entry["name"])
        cats[cid] = cats.get(cid, 0) + len(times)
        if r and now - r["last"] > 1.5 * r["every_days"] * 86400:
            overdue.append({**row, "since_days": round((now - r["last"]) / 86400)})
    top.sort(key=lambda r: -r["count"])
    overdue.sort(key=lambda r: -(r["since_days"] / (r["every_days"] or 1)))
    total = sum(cats.values()) or 1
    stores: dict[str, int] = {}
    for e in extras.expenses:
        if e["t"] >= since and e.get("store"):
            stores[e["store"]] = stores.get(e["store"], 0) + 1
    if not stores:  # ohne Preise: aus den benutzten Markt-Tags
        for t in learning.tag_history.values():
            if t.get("kind") == "store":
                stores[str(t["value"]).lower()] = int(t.get("count", 0))
    stotal = sum(stores.values()) or 1
    return {
        "days": days,
        "top": top[:15],
        "overdue": overdue[:10],
        "categories": [{"id": c, "label": learning.categories.label(c), "share": round(100 * n / total)}
                       for c, n in sorted(cats.items(), key=lambda kv: -kv[1])],
        "stores": [{"store": s, "label": itemtext.store_display(s)[0], "share": round(100 * n / stotal)}
                   for s, n in sorted(stores.items(), key=lambda kv: -kv[1])[:8]],
    }


async def async_get_extras(hass: HomeAssistant) -> Extras:
    data = hass.data.setdefault(DOMAIN, {})
    if "extras" not in data:
        extras = Extras(hass)
        await extras.async_load()
        data["extras"] = extras
    return data["extras"]
