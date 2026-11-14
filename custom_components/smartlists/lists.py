"""Listen lesen und ändern – für die Karte (und später die App).

Funktioniert mit
  - kombinierten SmartLists-Listen: Originaltext ohne Herkunfts-Anhängsel, Quelle je Artikel,
    fremde Quellen nur abhakbar
  - jeder anderen To-do-Liste in HA (Einkaufsliste, Local To-do, Google Tasks, Bring!, …):
    erlaubt ist, was die Liste selbst unterstützt (supported_features).

Alle Änderungen laufen über die normalen todo-Dienste. Damit gelten dieselben Regeln wie überall
in HA, und der Verlauf/die Protokolle zeigen, wer was geändert hat.
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.todo import DOMAIN as TODO_DOMAIN, TodoListEntityFeature
from homeassistant.const import ATTR_FRIENDLY_NAME, ATTR_SUPPORTED_FEATURES
from homeassistant.core import Context, HomeAssistant
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError

from .const import DOMAIN
from .itemtext import join_offer, split_offer
from .own import permissions_for, role_for
from .learning import Learning
from .notes import get_notes


def _extras(hass: HomeAssistant):
    return hass.data.get(DOMAIN, {}).get("extras")


def _shares(hass: HomeAssistant):
    return hass.data.get(DOMAIN, {}).get("shares")

STATUS_DONE = "completed"
STATUS_OPEN = "needs_action"


class ListError(HomeAssistantError):
    """Verständliche Fehlermeldung für die Karte."""


def _learning(hass: HomeAssistant) -> Learning:
    return hass.data[DOMAIN]["learning"]


def own_entity(hass: HomeAssistant, entity_id: str) -> Any | None:
    """Die Entität einer eigenen SmartLists-Liste (oder None)."""
    return hass.data.get(DOMAIN, {}).get("own", {}).get(entity_id)


def is_notes(hass: HomeAssistant, entity_id: str) -> bool:
    """Notizliste der App (todo.ha_smartlists_note…) – keine Einkaufsliste, siehe notes.py."""
    notes = get_notes(hass)
    return bool(notes and notes.is_notes(entity_id))


def notes_allowed(hass: HomeAssistant, entity_id: str, user: Any | None) -> bool:
    notes = get_notes(hass)
    return notes is None or notes.can_see(entity_id, user)


def own_role(hass: HomeAssistant, entity_id: str, user: Any | None) -> str | None:
    """Rolle des Benutzers bei einer eigenen Liste; bei anderen Listen "owner" (keine Einschränkung).
    Notizlisten anderer Konten: None (kein Zugriff)."""
    if user is not None and not notes_allowed(hass, entity_id, user):
        return None
    entity = access_entity(hass, entity_id)
    if entity is None:
        return "owner"
    return role_for(entity.data, getattr(user, "id", None), bool(getattr(user, "is_admin", False))) if user else "owner"


def access_entity(hass: HomeAssistant, entity_id: str) -> Any | None:
    """Liste mit Besitzer/Freigaben: eigene Listen immer, kombinierte Listen, wenn ein Besitzer gesetzt ist."""
    own = own_entity(hass, entity_id)
    if own is not None:
        return own
    comb = combined_entity(hass, entity_id)
    return comb if comb is not None and (getattr(comb, "data", None) or {}).get("owner") else None


def combined_entity(hass: HomeAssistant, entity_id: str) -> Any | None:
    """Die Entität einer kombinierten SmartLists-Liste (oder None bei anderen Listen)."""
    return hass.data.get(DOMAIN, {}).get("entities", {}).get(entity_id)


def suggest_scope(hass: HomeAssistant, entity_id: str) -> set[str] | None:
    """Aus welchen Listen „häufig gekauft“ und Vorschläge kommen: Standard nur diese Liste (eine kombinierte Liste:
    sie selbst und ihre Quell-Listen); Einstellung der Liste „aus allen Listen“ → None."""
    extras = hass.data[DOMAIN].get("extras")
    settings = (extras.list_settings.get(entity_id) if extras else None) or {}
    if settings.get("plain"):
        return set()  # einfache Liste: keine Vorschläge aus dem Verlauf
    if settings.get("suggest_scope") == "all":
        return None
    scope = {entity_id}
    entity = combined_entity(hass, entity_id)
    if entity is not None:
        scope.update(getattr(entity, "_sources", []) or [])
    return scope


def _state(hass: HomeAssistant, entity_id: str):
    if not entity_id.startswith(f"{TODO_DOMAIN}."):
        raise ListError(f"{entity_id} ist keine To-do-Liste")
    state = hass.states.get(entity_id)
    if state is None:
        raise ListError(f"Liste {entity_id} gibt es nicht (mehr)")
    if state.state == "unavailable":
        raise ListError(f"Liste {state.attributes.get(ATTR_FRIENDLY_NAME, entity_id)} ist gerade nicht erreichbar")
    return state


def _features(hass: HomeAssistant, entity_id: str) -> int:
    return int(_state(hass, entity_id).attributes.get(ATTR_SUPPORTED_FEATURES, 0) or 0)


def list_permissions(hass: HomeAssistant, entity_id: str) -> dict[str, bool]:
    f = _features(hass, entity_id)
    return {
        "add": bool(f & TodoListEntityFeature.CREATE_TODO_ITEM),
        "toggle": bool(f & TodoListEntityFeature.UPDATE_TODO_ITEM),
        "rename": bool(f & TodoListEntityFeature.UPDATE_TODO_ITEM),
        "delete": bool(f & TodoListEntityFeature.DELETE_TODO_ITEM),
        "note": bool(f & TodoListEntityFeature.SET_DESCRIPTION_ON_ITEM),
        "reorder": bool(f & TodoListEntityFeature.MOVE_TODO_ITEM),
    }


async def _call(hass: HomeAssistant, service: str, data: dict[str, Any], context: Context | None) -> None:
    try:
        await hass.services.async_call(TODO_DOMAIN, service, data, blocking=True, context=context)
    except ServiceValidationError as err:
        raise ListError(str(err) or "Für diese Liste nicht erlaubt") from err


async def raw_items(hass: HomeAssistant, entity_id: str) -> list[dict[str, Any]]:
    """Einträge einer Liste: uid, text, note, checked (+ source/foreign bei kombinierten)."""
    entity = combined_entity(hass, entity_id)
    if entity is not None:
        return entity.card_items()
    _state(hass, entity_id)
    response = await hass.services.async_call(
        TODO_DOMAIN, "get_items", {"entity_id": entity_id}, blocking=True, return_response=True
    )
    items = ((response or {}).get(entity_id) or {}).get("items", [])
    return [
        {
            "uid": i.get("uid"),
            "text": i.get("summary") or "",
            "note": i.get("description") or "",
            "checked": i.get("status") == STATUS_DONE,
        }
        for i in items
        if i.get("uid")
    ]


async def get_list(hass: HomeAssistant, entity_id: str, user: Any | None = None, language: str | None = None) -> dict[str, Any]:
    """Alles, was die Karte zum Anzeigen braucht. Mit `user` gelten bei eigenen Listen dessen Freigaben."""
    state = _state(hass, entity_id)
    if not notes_allowed(hass, entity_id, user):
        raise ListError("Diese Notizliste gehört zu einem anderen Konto.")
    learning = _learning(hass)
    perms = list_permissions(hass, entity_id)
    own = access_entity(hass, entity_id)
    own_info = None
    if own is not None:
        role = own_role(hass, entity_id, user)
        if role is None:
            raise ListError("Diese Liste ist nicht für dich freigegeben.")
        rp = permissions_for(role)
        perms = {k: perms.get(k, False) and rp[k] for k in perms}
        own_info = {"role": role, "owner": own._owner_name, "owner_id": own.data.get("owner"),
                    "shares": dict(own.data.get("shares") or {}), "can_share": rp["share"]}
    entity = combined_entity(hass, entity_id)
    items = []
    person_prefix = next((r["prefix"] for r in learning.tag_rules if r["kind"] == "person"), None)
    notes = is_notes(hass, entity_id)
    extras = _extras(hass)
    plain = bool(extras and extras.is_plain(entity_id))
    shares = _shares(hass)
    soft = shares.soft_checked(entity_id) if shares else {}
    for raw in await raw_items(hass, entity_id):
        if notes:
            # Notizliste der App: Titel + Text, keine Kategorie/Menge/Tags (wie in der App)
            items.append({"uid": raw["uid"], "text": raw["text"], "name": raw["text"], "note": raw.get("note") or "",
                          "checked": raw["checked"], "encrypted": str(raw["text"]).startswith("🔒ENC1:")
                          or str(raw.get("note") or "").startswith("🔒ENC1:"),
                          "tags": [], "category": None, "quantity": None, "unit": None, "offer": None,
                          "permissions": {"toggle": perms["toggle"], "rename": perms["rename"], "delete": perms["delete"]}})
            continue
        info = learning.describe(raw["text"])
        # Angebot aus der App (⚙OFFER-Zeile in der Notiz) zerlegen statt als Text zeigen
        note, offer, _ = split_offer(raw.get("note"))
        # Herkunft als Person (kombinierte Liste, z.B. todo.peter → 👤 Peter) – außer im Artikel
        # steht schon eine Person (*Anna) oder Personen-Tags sind abgeschaltet
        person = raw.get("person")
        if person and person_prefix and not any(t["kind"] == "person" for t in info["tags"]):
            tag = {"kind": "person", "value": person, "prefix": person_prefix, "label": person, "implicit": True}
            if raw.get("person_color"):
                tag["color"] = raw["person_color"]  # je Quell-Liste eine eigene Farbe
            info["tags"] = [*info["tags"], tag]
        foreign = bool(raw.get("foreign"))
        # Preis: Angebot der App > von Hand/zuletzt bezahlt (Integration)
        # total = für die Menge auf der Liste, unit_price = je Einheit (bzw. Stück)
        price = None
        qty = (info.get("quantity") or 1) * (info.get("pack_count") or 1)
        if offer and offer.get("price") is not None:
            price = {"total": round(float(offer["price"]), 2), "unit_price": round(float(offer["price"]) / qty, 2), "source": "offer"}
        elif info.get("text_price") is not None:
            # Preis steht im Text einer anderen Quelle ("… (REWE) - 0,99 €") – gilt je Stück
            price = {"total": round(float(info["text_price"]) * qty, 2), "unit_price": round(float(info["text_price"]), 2), "source": "text"}
        elif extras and not plain and (p := extras.price_for(info["name"])):
            price = {"total": round(float(p["price"]) * qty, 2), "unit_price": p["price"], "source": p.get("source", "manual"), "at": p.get("at")}
        items.append(
            {
                **info,
                "price": price,
                "soft_checked": raw["uid"] in soft,
                "checked_at": (extras.checked_at.get(entity_id) or {}).get(raw["uid"]) if extras else None,
                "uid": raw["uid"],
                "text": raw["text"],
                # umgeformter Text ("Butcher's Burger Buns 2 @REWE") zum Bearbeiten, wenn der Text aus einer anderen Quelle kam
                "clean_text": learning.encode(learning.parse(raw["text"])) if info.get("imported") else None,
                "note": note,
                "offer": offer,
                "checked": raw["checked"],
                "source": raw.get("source"),
                "permissions": {
                    "toggle": perms["toggle"],
                    "rename": perms["rename"] and not foreign,
                    "delete": perms["delete"] and not foreign,
                },
            }
        )
    return {
        "entity_id": entity_id,
        "name": state.attributes.get(ATTR_FRIENDLY_NAME, entity_id),
        "type": "combined" if entity is not None else "own" if own is not None else "notes" if is_notes(hass, entity_id) else "list",
        # fremd = Liste besteht nur aus fremden Quellen
        "foreign": bool(entity is not None and entity.all_foreign),
        "source_lists": entity.source_names if entity is not None else [],
        "sources": entity.source_info if entity is not None else [],
        "label": entity.label_settings if entity is not None else None,
        "permissions": perms,
        "own": own_info,
        "categories": [] if notes else learning.categories.as_list(language),
        "trip_start": extras.trips.get(entity_id) if extras else None,
        "settings": dict(extras.list_settings.get(entity_id) or {}) if extras else {},
        "items": items,
    }


async def all_lists(hass: HomeAssistant, user: Any | None = None) -> list[dict[str, Any]]:
    """Alle To-do-Listen, die der Benutzer sehen darf (eigene Listen nur mit Freigabe).
    Notizlisten der App nur, wenn der Notizen-Bereich eingeschaltet ist – und nur die eigenen."""
    out = []
    notes = get_notes(hass)
    for state in hass.states.async_all(TODO_DOMAIN):
        if state.state == "unavailable":
            continue
        if notes is not None and not notes.shown(state.entity_id, user):
            continue
        f = int(state.attributes.get(ATTR_SUPPORTED_FEATURES, 0) or 0)
        role = own_role(hass, state.entity_id, user)
        if role is None:
            continue
        own = own_entity(hass, state.entity_id) is not None
        out.append(
            {
                "entity_id": state.entity_id,
                "name": state.attributes.get(ATTR_FRIENDLY_NAME, state.entity_id),
                "type": "combined" if combined_entity(hass, state.entity_id) else "own" if own
                else "notes" if is_notes(hass, state.entity_id) else "list",
                "can_add": bool(f & TodoListEntityFeature.CREATE_TODO_ITEM) and permissions_for(role)["add"],
                "role": role if own else None,
            }
        )
    return sorted(out, key=lambda x: str(x["name"]).casefold())


def _take_price(hass: HomeAssistant, entity_id: str, text: str) -> str:
    """Preis im Text ("Milch 2 l 1,19€ @REWE") gehört nicht in den Namen – wird als Preis gemerkt."""
    if is_notes(hass, entity_id) or (extras := _extras(hass)) is None or extras.is_plain(entity_id):
        return text  # einfache Liste: Preis bleibt im Text, wird nicht gemerkt
    from .extras import split_price

    text, price = split_price(text)
    if price is not None and text:
        item = _learning(hass).parse(text)
        store = next((t["value"] for t in item.tags if t["kind"] == "store"), None)
        # gespeichert wird der Preis je Einheit (2 l für 2,38 € → 1,19 €/l), damit andere Mengen stimmen
        extras.set_price(item.name, price / ((item.quantity or 1) * (item.pack_count or 1)), store)
    return text


async def add_item(
    hass: HomeAssistant,
    entity_id: str,
    text: str,
    note: str = "",
    checked: bool = False,
    context: Context | None = None,
    from_share: bool = False,
) -> dict[str, Any]:
    """Hinzufügen; liefert die uid des neuen Artikels (für „Rückgängig“).
    HA meldet die uid beim Hinzufügen nicht zurück – sie wird über den Vorher/Nachher-Vergleich ermittelt."""
    text = text.strip()
    if not from_share:
        text = _take_price(hass, entity_id, text)
    if not text:
        raise ListError("Leerer Artikel")
    perms = list_permissions(hass, entity_id)
    if not perms["add"]:
        raise ListError("Zu dieser Liste kann nichts hinzugefügt werden")
    before = {i["uid"] for i in await raw_items(hass, entity_id)}
    data: dict[str, Any] = {"entity_id": entity_id, "item": text}
    if note and perms["note"]:
        data["description"] = note
    await _call(hass, "add_item", data, context)
    if combined_entity(hass, entity_id) is None and own_entity(hass, entity_id) is None and not is_notes(hass, entity_id) and not from_share:
        # kombinierte und eigene Listen merken sich den Verlauf selbst beim Hinzufügen (sonst doppelt gezählt)
        _learning(hass).record(text, entity_id)
    new = [i for i in await raw_items(hass, entity_id) if i["uid"] not in before]
    match = next((i for i in reversed(new) if i["text"] == text), new[-1] if new else None)
    uid = match["uid"] if match else None
    if uid and checked:
        await _call(hass, "update_item", {"entity_id": entity_id, "item": uid, "status": STATUS_DONE}, context)
    return {"uid": uid}


async def update_item(
    hass: HomeAssistant,
    entity_id: str,
    uid: str,
    *,
    checked: bool | None = None,
    text: str | None = None,
    note: str | None = None,
    context: Context | None = None,
) -> dict[str, Any]:
    data: dict[str, Any] = {"entity_id": entity_id, "item": uid}
    if checked is not None:
        data["status"] = STATUS_DONE if checked else STATUS_OPEN
        await _book(hass, entity_id, uid, checked, context)
    if text is not None and text.strip():
        current = next((i for i in await raw_items(hass, entity_id) if i["uid"] == uid), None)
        if current is None:
            raise ListError("Artikel nicht gefunden – die Liste wird neu geladen")
        text = _take_price(hass, entity_id, text.strip()) or current["text"]
        if text != current["text"]:
            data["rename"] = text
        if note is not None and list_permissions(hass, entity_id)["note"]:
            # Karte/App kennen nur die Notiz ohne ⚙OFFER-Zeile → die Zeile beim Speichern erhalten
            old_clean, _, raw_line = split_offer(current.get("note", ""))
            if note != old_clean:
                data["description"] = join_offer(note, raw_line)
    if len(data) > 2:
        await _call(hass, "update_item", data, context)
    return {"uid": uid}


async def _book(hass: HomeAssistant, entity_id: str, uid: str, checked: bool, context: Context | None) -> None:
    """Abhaken → Ausgabe buchen (wenn ein Preis bekannt ist), wieder öffnen → zurücknehmen; „soft“ löschen."""
    extras = _extras(hass)
    if extras is None or is_notes(hass, entity_id):
        return
    current = next((i for i in await raw_items(hass, entity_id) if i["uid"] == uid), None)
    if current is None or bool(current["checked"]) == checked:
        return
    item = _learning(hass).parse(current["text"])
    _, offer, _ = split_offer(current.get("note"))
    store = next((t["value"] for t in item.tags if t["kind"] == "store"), None) or (offer or {}).get("store")
    extras.mark_checked(entity_id, uid, checked)
    if checked:
        offer_price = offer.get("price") if offer else None
        qty = (item.quantity or 1) * (item.pack_count or 1)
        # Angebotspreis gilt für den ganzen Artikel → als Preis je Einheit umrechnen
        extras.book(item.name, qty, store, context.user_id if context else None, entity_id,
                    price=offer_price / qty if offer_price else item.price)
        if (shares := _shares(hass)) is not None:
            shares.clear_soft(entity_id, uid)
    else:
        extras.unbook(item.name, entity_id)


async def remove_items(hass: HomeAssistant, entity_id: str, uids: list[str], context: Context | None = None) -> dict[str, Any]:
    if uids:
        await _call(hass, "remove_item", {"entity_id": entity_id, "item": list(uids)}, context)
    return {}


async def clear_completed(hass: HomeAssistant, entity_id: str, context: Context | None = None) -> dict[str, Any]:
    await _call(hass, "remove_completed_items", {"entity_id": entity_id}, context)
    return {}


async def move_item(
    hass: HomeAssistant,
    entity_id: str,
    uid: str,
    target: str,
    copy: bool = False,
    context: Context | None = None,
) -> dict[str, Any]:
    """In eine andere Liste verschieben bzw. kopieren. Text, Notiz und Häkchen wandern mit."""
    if target == entity_id:
        raise ListError("Ziel ist dieselbe Liste")
    item = next((i for i in await raw_items(hass, entity_id) if i["uid"] == uid), None)
    if item is None:
        raise ListError("Artikel nicht gefunden – die Liste wird neu geladen")
    if not copy:
        perms = list_permissions(hass, entity_id)
        if not perms["delete"] or item.get("foreign"):
            raise ListError("Aus dieser Liste darf nichts entfernt werden – nur Kopieren ist möglich")
    result = await add_item(hass, target, item["text"], item.get("note", ""), item["checked"], context)
    if not copy:
        await remove_items(hass, entity_id, [uid], context)
    return result
