"""Vorhandene To-do-Listen (Einkaufsliste, Local To-do, …) in eigene SmartLists-Listen übernehmen.

- je Liste eine eigene SmartLists-Liste (gleicher Name) oder alle zusammen in eine
- Artikel mit Text, Notiz und Häkchen; beim Zusammenlegen optional die Herkunft als *Person bzw. #Tag
- die alte Liste bleibt immer unverändert – aufräumen (löschen) macht der Benutzer selbst

Die neuen Listen bekommen ihre Artikel, bevor sie entstehen (Speicher wird vorab geschrieben) – so
erscheinen sie nach dem Neuladen der Integration sofort vollständig.
"""

from __future__ import annotations

import uuid
from typing import Any

from homeassistant.const import ATTR_FRIENDLY_NAME
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.storage import Store

from . import lists
from .const import DOMAIN, STORAGE_VERSION

OLD_ACTIONS = ("keep",)
MAX_ITEMS = 2000


def candidates(hass: HomeAssistant, user: Any | None = None) -> list[dict[str, Any]]:
    """Listen, die sich übernehmen lassen: alle To-do-Listen außer SmartLists-eigenen und kombinierten.
    Notizlisten nur, wenn `user` sie sehen darf (eigene bzw. „für alle“) – sie werden als Notizen übernommen."""
    combined = hass.data.get(DOMAIN, {}).get("entities", {})
    own = hass.data.get(DOMAIN, {}).get("own", {})
    out = []
    for st in hass.states.async_all("todo"):
        eid = st.entity_id
        if eid in combined or eid in own or st.state == "unavailable":
            continue
        is_notes = lists.is_notes(hass, eid)
        if is_notes and not lists.notes_allowed(hass, eid, user):
            continue  # fremde Notizen bleiben privat
        used_in = [e.name or k for k, e in combined.items() if eid in getattr(e, "_sources", [])]
        reg = er.async_get(hass).async_get(eid)
        out.append({"entity_id": eid, "name": st.attributes.get(ATTR_FRIENDLY_NAME, eid), "open": _int(st.state),
                    "platform": reg.platform if reg else None, "used_in": used_in, "notes": is_notes})
    return sorted(out, key=lambda x: str(x["name"]).casefold())


APP_PREFIX = "ha_smartlists_"
MIGRATED_KEY = "migrated_lists"


def unmigrated(hass: HomeAssistant) -> list[dict[str, Any]]:
    """Listen der App (todo.ha_smartlists_*, z. B. in Local To-do), die noch nicht in SmartLists übernommen sind –
    für den Hinweis unter Einstellungen → Reparaturen. Nicht dabei: Notizlisten (bleiben bewusst in Local To-do),
    SmartLists-eigene und kombinierte Listen (stehen nicht in candidates), schon übernommene Listen (gemerkt seit
    3.9.2) und – für Übernahmen davor – Listen, deren Name schon als eigene SmartLists-Liste existiert."""
    learning = hass.data.get(DOMAIN, {}).get("learning")
    done = set((getattr(learning, "automation", None) or {}).get(MIGRATED_KEY) or [])
    titles: set[str] = set()
    entries = hass.config_entries.async_entries(DOMAIN) if hasattr(hass, "config_entries") else []
    if entries:
        from .own_groups import iter_lists

        titles = {str(data.get("title") or "").casefold() for _g, _lid, data in iter_lists(entries[0])}
    out = []
    for c in candidates(hass, None):
        object_id = c["entity_id"].split(".", 1)[-1]
        if not object_id.startswith(APP_PREFIX) or c["notes"] or c["platform"] == DOMAIN or c["entity_id"] in done:
            continue
        if nice_title(str(c["name"]), c["entity_id"]).casefold() in titles:
            continue
        out.append(c)
    return out


def mark_migrated(hass: HomeAssistant, entity_ids: list[str]) -> None:
    """Übernommene Listen merken (der Reparatur-Hinweis erscheint dafür nicht mehr)."""
    learning = hass.data.get(DOMAIN, {}).get("learning")
    if not isinstance(getattr(learning, "automation", None), dict):
        return
    done = list(dict.fromkeys([*(learning.automation.get(MIGRATED_KEY) or []), *entity_ids]))[-500:]
    learning.automation[MIGRATED_KEY] = done
    learning._changed()


def _int(v: Any) -> int:
    try:
        return int(v)
    except (TypeError, ValueError):
        return 0


def nice_title(name: str, entity_id: str) -> str:
    """Lesbarer Name für die neue Liste: ohne „HA Smartlists“-Vorsatz der App und ohne rohe Entitäts-ID
    ("ha_smartlists_list_barcodes" → "Barcodes", "HA Smartlists Angebote" → "Angebote")."""
    n = name.strip()
    if n == entity_id or n == entity_id.split(".", 1)[-1]:
        n = entity_id.split(".", 1)[-1]
        for p in ("ha_smartlists_list_", "ha_smartlists_"):
            if n.startswith(p):
                n = n[len(p):]
        n = n.replace("_", " ").strip().capitalize()
    low = n.lower()
    for p in ("ha smartlists liste ", "ha smartlists lista ", "ha smartlists listy ", "ha smartlists list ", "ha smartlists "):
        if low.startswith(p) and len(n) > len(p):
            n = n[len(p):].strip()
            break
    return n or name


def _tagged(text: str, tag: str | None) -> str:
    return f"{text} {tag}" if tag and tag.split()[0] not in text.split() else text


async def async_migrate(hass: HomeAssistant, owner: str, sources: list[str], mode: str = "each", name: str | None = None,
                        old: str = "keep", tag_kind: str | None = None, target: str = "list", user: Any | None = None) -> dict[str, Any]:
    """Liefert {"lists": [{"name", "subentry_id", "items"}], "old": {entity_id: "kept"}}. Alte Listen werden nie verändert."""
    entries = hass.config_entries.async_entries(DOMAIN)
    if not entries:
        raise ValueError("SmartLists ist nicht eingerichtet.")
    entry = entries[0]
    if old not in OLD_ACTIONS:
        raise ValueError("Unbekannte Aktion für die alte Liste")
    if target not in ("list", "notes"):
        raise ValueError("Unbekanntes Ziel")
    allowed = {c["entity_id"]: c for c in candidates(hass, user)}
    sources = [s for s in dict.fromkeys(sources) if s in allowed]
    if not sources:
        raise ValueError("Keine passende Liste ausgewählt.")
    # Herkunft beim Zusammenlegen als Badge: "*Anna" (Person) bzw. "#Anna" (Schlagwort) – Zeichen aus der Namenskonvention
    prefix = None
    if mode == "one" and tag_kind in ("person", "tag"):
        rule = next((r for r in hass.data[DOMAIN]["learning"].tag_rules if r.get("kind") == tag_kind), None)
        prefix = rule["prefix"] if rule else None

    items_by_source: dict[str, list[dict[str, Any]]] = {}
    for s in sources:
        items_by_source[s] = (await lists.raw_items(hass, s))[:MAX_ITEMS]

    def own_items(src_items: list[tuple[str, dict[str, Any]]]) -> list[dict[str, Any]]:
        out = []
        for src, i in src_items:
            tag = None
            if prefix:
                label = str(allowed[src]["name"]).split()[0] if allowed[src]["name"] else src.split(".")[1]
                tag = prefix + label.replace(" ", "_")
            out.append({"uid": uuid.uuid4().hex, "summary": _tagged(i["text"], tag), "status": "completed" if i["checked"] else "needs_action",
                        "description": i.get("note") or ""})
        return out

    # (Titel, Artikel, Quelle bei „je Liste“)
    groups: list[tuple[str, list[dict[str, Any]], str | None]]
    if mode == "one":
        title = (name or "").strip() or nice_title(str(allowed[sources[0]]["name"]), sources[0])
        groups = [(title, own_items([(s, i) for s in sources for i in items_by_source[s]])[:MAX_ITEMS], None)]
    else:
        groups = [(nice_title(str(allowed[s]["name"]), s), own_items([(s, i) for i in items_by_source[s]]), s) for s in sources]

    if target == "notes":
        result = await _as_notes(hass, user, groups, sources)
        mark_migrated(hass, sources)
        return result

    from .own_groups import async_add_list

    # Artikel zuerst speichern, dann die Listen beim Besitzer eintragen (Gruppe „Eigene Listen · …“) –
    # das Neuladen der Integration fasst mehrere neue Listen zu einem zusammen (__init__.py)
    created = []
    for title, items, _src in groups:
        list_id = uuid.uuid4().hex
        await Store(hass, STORAGE_VERSION, f"{DOMAIN}.own.{list_id}").async_save({"items": items})
        created.append((list_id, title[:60], len(items)))
    for list_id, title, _ in created:
        await async_add_list(hass, owner, title, {}, list_id=list_id)
    mark_migrated(hass, sources)
    return {"lists": [{"name": t, "list_id": lid, "items": n} for lid, t, n in created],
            "old": {s: "kept" for s in sources}}


async def _as_notes(hass: HomeAssistant, user: Any, groups: list[tuple[str, list[dict[str, Any]], str | None]],
                    sources: list[str]) -> dict[str, Any]:
    """Als Notizliste übernehmen: neue Local-To-do-Liste todo.ha_smartlists_notes_<name> (Besitzer: wer übernimmt),
    Notizen mit Titel, Text und Häkchen. Verschlüsselte Notizen der App werden unverändert kopiert."""
    from .notes import async_create_notes_list

    if user is None:
        raise ValueError("Notizen brauchen einen Benutzer als Besitzer.")
    created = []
    for title, items, _src in groups:
        # „Notes Julia“ → „Julia“ (der Vorsatz kommt beim Anlegen wieder dazu); gibt es den Namen schon → „… 2“
        base = title
        for p in ("notes ", "notizen ", "note ", "notiz "):
            if base.lower().startswith(p) and len(base) > len(p):
                base = base[len(p):].strip()
        entity_id, err = None, None
        for candidate in (base, f"{base} 2", f"{base} 3"):
            try:
                entity_id = await async_create_notes_list(hass, user, candidate)
                title = candidate
                break
            except ValueError as e:
                err = e
        if entity_id is None:
            raise err or ValueError("Notizliste konnte nicht angelegt werden.")
        for i in items:
            await lists.add_item(hass, entity_id, i["summary"], i.get("description") or "", i["status"] == "completed")
        created.append({"name": title, "entity_id": entity_id, "items": len(items)})
    return {"lists": created, "old": {s: "kept" for s in sources}}
