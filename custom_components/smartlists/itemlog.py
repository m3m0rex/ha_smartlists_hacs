"""Verlauf je Artikel: wer hat was wann hinzugefügt, abgehakt, umbenannt oder gelöscht.

Grundlage sind die todo-Dienstaufrufe (Karte, App, HA selbst, Automationen, geteilte Links). Je Liste werden
die letzten 400 Einträge gemerkt (.storage/smartlists.itemlog)."""

from __future__ import annotations

import time
from typing import Any

from homeassistant.const import EVENT_CALL_SERVICE
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers.storage import Store

from .const import DOMAIN

STORAGE_KEY = f"{DOMAIN}.itemlog"
PER_LIST = 400


class ItemLog:
    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store[dict[str, Any]] = Store(hass, 1, STORAGE_KEY)
        self.log: dict[str, list[dict[str, Any]]] = {}

    async def async_load(self) -> None:
        self.log = {k: list(v) for k, v in ((await self._store.async_load() or {}).get("log") or {}).items()}

    def _save(self) -> None:
        self._store.async_delay_save(lambda: {"log": self.log}, 5.0)

    @callback
    def add(self, entity_id: str, action: str, text: str, user_id: str | None, via_link: bool = False, old: str | None = None,
            by: str = "") -> None:
        rows = self.log.setdefault(entity_id, [])
        entry: dict[str, Any] = {"t": int(time.time()), "a": action, "text": text[:200], "user": user_id}
        if via_link:
            entry["link"] = True
            if by:
                entry["by"] = by[:30]  # Name, den die Person auf der geteilten Seite angegeben hat
        if old:
            entry["old"] = old[:200]
        rows.append(entry)
        del rows[:-PER_LIST]
        self._save()

    def for_item(self, entity_id: str, name: str, limit: int = 30) -> list[dict[str, Any]]:
        from .itemtext import DEFAULT_TAG_RULES, parse

        learning = self.hass.data.get(DOMAIN, {}).get("learning")
        rules = learning.tag_rules if learning is not None else DEFAULT_TAG_RULES
        base = lambda text: parse(text, rules).name.casefold()  # noqa: E731 – Name ohne Menge und Tags
        key = base(name) if name else ""
        out = []
        for e in reversed(self.log.get(entity_id, [])):
            names = {base(e["text"]), base(e.get("old") or "")}
            if not key or key in names:
                out.append(e)
            if len(out) >= limit:
                break
        return out

    @callback
    def start(self) -> Any:
        return self.hass.bus.async_listen(EVENT_CALL_SERVICE, self._on_call)

    async def _on_call(self, event: Event) -> None:
        data = event.data
        service = data.get("service")
        if data.get("domain") != "todo" or service not in ("add_item", "update_item", "remove_item"):
            return
        sd = data.get("service_data") or {}
        entity_ids = sd.get("entity_id") or []
        entity_ids = [entity_ids] if isinstance(entity_ids, str) else list(entity_ids)
        combined = self.hass.data.get(DOMAIN, {}).get("entities", {})
        user = event.context.user_id if event.context else None
        from .shares import SHARE_CONTEXTS

        via_link = bool(event.context and event.context.id in SHARE_CONTEXTS)
        by = SHARE_CONTEXTS.get(event.context.id, "") if via_link else ""
        from . import lists

        learning = self.hass.data.get(DOMAIN, {}).get("learning")
        for entity_id in entity_ids:
            if entity_id in combined or lists.is_notes(self.hass, entity_id):
                continue  # kombinierte Listen schreiben in ihre Quellen; Notizen gehören nicht in den Verlauf
            if service == "add_item":
                self.add(entity_id, "add", str(sd.get("item", "")), user, via_link, by=by)
                continue
            try:
                current = {i["uid"]: i for i in await lists.raw_items(self.hass, entity_id)}
            except Exception:  # noqa: BLE001
                current = {}
            items = sd.get("item")
            items = items if isinstance(items, list) else [items]
            for ref in items:
                hit = current.get(str(ref)) or next((i for i in current.values() if i["text"] == ref), None)
                text = hit["text"] if hit else str(ref)
                if service == "remove_item":
                    self.add(entity_id, "remove", text, user, via_link)
                elif sd.get("rename") and sd["rename"] != text:
                    self.add(entity_id, "rename", sd["rename"], user, via_link, old=text)
                elif sd.get("status") == "completed":
                    self.add(entity_id, "check", text, user, via_link, by=by)
                    if learning is not None:
                        learning.record_bought(text, entity_id)  # abgehakt = gekauft (Statistik)
                elif sd.get("status") == "needs_action":
                    self.add(entity_id, "uncheck", text, user, via_link, by=by)
                    if learning is not None:
                        learning.unrecord_bought(text)


async def async_get_itemlog(hass: HomeAssistant) -> ItemLog:
    data = hass.data.setdefault(DOMAIN, {})
    if "itemlog" not in data:
        log = ItemLog(hass)
        await log.async_load()
        data["itemlog"] = log
    return data["itemlog"]
