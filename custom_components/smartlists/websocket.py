"""WebSocket-Befehle für die Lovelace-Karte (und später die App).

Alle Befehle beginnen mit "smartlists/". Lesen darf jeder angemeldete HA-Benutzer, Ändern der
Tag-Regeln und Vergessen gelernter Stichwörter nur Administratoren.
"""

from __future__ import annotations

import asyncio
import json

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from . import lists
from .const import DOMAIN, SUBENTRY_COMBINED
from .features import get_features, set_features
from .learning import Learning

# Version der Befehlsschnittstelle. Erhöhen, wenn sich Befehle/Antworten inkompatibel ändern –
# App und Karte prüfen das beim Koppeln (smartlists/info).
API_VERSION = 1


def _learning(hass: HomeAssistant) -> Learning:
    return hass.data[DOMAIN]["learning"]


@callback
def async_register(hass: HomeAssistant) -> None:
    for handler in (ws_info, ws_config, ws_suggest, ws_describe, ws_set_category, ws_learned, ws_forget, ws_set_tag_rules,
                    ws_user_settings, ws_set_user_settings,
                    ws_register_device, ws_devices, ws_remove_device,
                    ws_users, ws_create_list, ws_share, ws_set_owner, ws_set_labels, ws_delete_list,
                    ws_install_sentences, ws_shopping, ws_due,
                    ws_subscribe, ws_reset, ws_migrate_candidates, ws_migrate, ws_mealplan, ws_set_meals, ws_add_meals, ws_mealie_status, ws_mealie_import, ws_item_history, ws_setup, ws_set_features, ws_set_rights, ws_share_links_all, ws_set_list_settings, ws_finish_shopping, ws_expense_entries, ws_delete_expense, ws_forget_history, ws_create_notes, ws_store_order, ws_set_price, ws_expenses, ws_templates, ws_save_template, ws_delete_template, ws_add_template, ws_stats, ws_share_links, ws_share_create, ws_share_revoke, ws_share_public, ws_set_share_public, ws_notify, ws_set_notify, ws_notify_test, ws_barcode, ws_app_lists, ws_connect_app_list, ws_appearance, ws_set_appearance, ws_stores, ws_set_store_zone, ws_notes, ws_set_notes, ws_pack_create, ws_pack_terms, ws_pack_update, ws_packs, ws_pack_upload, ws_pack_delete, ws_pack_set_active, ws_pack_export,
                    ws_app_backup_save, ws_app_backups, ws_app_backup_get, ws_app_backup_delete, ws_export, ws_import, ws_automation, ws_set_automation,
                    ws_get_list, ws_lists, ws_add_item, ws_update_item, ws_remove_items, ws_clear_completed, ws_move_item):
        websocket_api.async_register_command(hass, handler)


@websocket_api.websocket_command({vol.Required("type"): "smartlists/config", vol.Optional("language"): str})
@callback
def ws_config(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Kategorien (in der gewünschten Sprache), Tag-Regeln, bekannte Märkte."""
    extras = hass.data[DOMAIN].get("extras")
    connection.send_result(msg["id"], {**_learning(hass).config(msg.get("language")),
                                       "store_order": extras.store_order if extras else {},
                                       "templates": len(extras.templates) if extras else 0,
                                       "features": get_features(hass)})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/set_features",
                                  vol.Optional("notes"): bool, vol.Optional("mealplan"): bool, vol.Optional("stats"): bool})
@callback
def ws_set_features(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Einstellungen → Extras: Notizen und Wochenplan ein-/ausschalten (siehe features.py)."""
    connection.send_result(msg["id"], {"features": set_features(hass, notes=msg.get("notes"), mealplan=msg.get("mealplan"),
                                                                stats=msg.get("stats"))})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/suggest",
        vol.Required("query"): str,
        vol.Optional("entity_id"): str,
        vol.Optional("limit", default=8): vol.All(int, vol.Range(min=1, max=30)),
    }
)
@websocket_api.async_response
async def ws_suggest(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Autovervollständigung. Mit entity_id fließen auch Artikel dieser Liste ein."""
    names: list[str] = []
    if entity_id := msg.get("entity_id"):
        try:
            response = await hass.services.async_call(
                "todo", "get_items", {"entity_id": entity_id}, blocking=True, return_response=True
            )
            names = [i.get("summary", "") for i in ((response or {}).get(entity_id) or {}).get("items", [])]
        except Exception:  # noqa: BLE001 – Vorschläge sollen nie an einer Liste scheitern
            names = []
    scope = lists.suggest_scope(hass, entity_id) if entity_id else None
    connection.send_result(msg["id"], _learning(hass).suggest(msg["query"], names, msg["limit"], scope))



@websocket_api.websocket_command({vol.Required("type"): "smartlists/describe", vol.Required("texts"): [str]})
@callback
def ws_describe(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Artikeltexte zerlegen: Name, Menge, Einheit, Tags, Kategorie (für Vorschau beim Tippen)."""
    learning = _learning(hass)
    result = []
    for text in msg["texts"][:200]:
        info = learning.describe(text)
        info["unit_hint"] = learning.unit_for(info["name"])
        result.append(info)
    connection.send_result(msg["id"], {"items": result})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/set_category",
        vol.Required("name"): str,
        vol.Required("category"): vol.Any(str, None),
    }
)
@callback
def ws_set_category(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Kategorie für einen Artikel merken (gilt künftig auch für ähnliche Artikel)."""
    if _denied(hass, connection, msg, "categories"):
        return
    learning = _learning(hass)
    name = learning.parse(msg["name"]).name
    try:
        learning.set_category(name, msg["category"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_category", str(err))
        return
    connection.send_result(msg["id"], learning.describe(name))


@websocket_api.websocket_command({vol.Required("type"): "smartlists/learned"})
@callback
def ws_learned(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    connection.send_result(msg["id"], {"learned": _learning(hass).learned_list()})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/forget", vol.Required("word"): str})
@callback
def ws_forget(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    _learning(hass).forget(msg["word"])
    connection.send_result(msg["id"], {"learned": _learning(hass).learned_list()})


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/set_tag_rules",
        vol.Required("rules"): [{vol.Required("prefix"): str, vol.Required("kind"): str}],
    }
)
@callback
def ws_set_tag_rules(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Namenskonvention ändern, z.B. "@" = Markt, "*" = Person, "#" = Schlagwort."""
    try:
        _learning(hass).set_tag_rules(msg["rules"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_rules", str(err))
        return
    connection.send_result(msg["id"], _learning(hass).config())


@websocket_api.websocket_command({vol.Required("type"): "smartlists/user_settings"})
@callback
def ws_user_settings(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Haushalts-Standard + eigene Abweichungen des angemeldeten Benutzers."""
    connection.send_result(msg["id"], _learning(hass).user_settings(connection.user.id))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/set_user_settings",
        vol.Required("settings"): dict,
        # "user" = eigene Abweichungen, "household" = Standard für alle (nur Admins)
        vol.Optional("scope", default="user"): vol.In(["user", "household"]),
    }
)
@callback
def ws_set_user_settings(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Jeder Benutzer ändert nur seine eigenen Einstellungen; den Haushalts-Standard nur Admins."""
    learning = _learning(hass)
    if msg["scope"] == "household" and not connection.user.is_admin:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, "Nur Administratoren können den Standard ändern.")
        return
    try:
        if msg["scope"] == "household":
            result = learning.set_ui_defaults(msg["settings"], connection.user.id)
        else:
            result = learning.set_user_settings(connection.user.id, msg["settings"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_settings", str(err))
        return
    connection.send_result(msg["id"], result)


# ----------------------------------------------------------------------
# Koppeln (App/Karte): ist die Integration da, welche Version, was kann sie?
# ----------------------------------------------------------------------
@websocket_api.websocket_command({vol.Required("type"): "smartlists/info"})
@websocket_api.async_response
async def ws_info(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    from homeassistant.loader import async_get_integration

    integration = await async_get_integration(hass, DOMAIN)
    connection.send_result(
        msg["id"],
        {
            "integration": DOMAIN,
            "version": str(integration.version),
            "api_version": API_VERSION,
            "features": ["lists", "combined_lists", "categories", "suggestions", "tags", "user_settings", "devices",
                         "shopping_event", "due_items", "export", "own_lists", "app_backups", "packs", "pack_editor",
                         "notes", "store_zones", "appearance", "app_lists",
                         "store_order", "prices", "templates", "share_links", "notify", "barcode", "stats", "live", "rights", "list_settings", "setup", "mealplan", "mealie", "item_history", "migrate"],
            "user": {"id": connection.user.id, "name": connection.user.name, "is_admin": connection.user.is_admin},
            **_learning(hass).config(),
        },
    )


# ----------------------------------------------------------------------
# Listen
# ----------------------------------------------------------------------
def _list_command(schema: dict[Any, Any]):
    """Gemeinsamer Rahmen: Fehler als verständliche Meldung, Änderungen im Namen des Benutzers."""

    def wrap(func):
        @websocket_api.websocket_command(schema)
        @websocket_api.async_response
        async def handler(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
            try:
                # Benutzer für Freigaben eigener Listen (get_list/lists); Änderungen prüft die Entität selbst
                msg = {**msg, "_user": connection.user}
                # Notizlisten anderer Konten: weder lesen noch ändern (auch nicht als Ziel)
                for key in ("entity_id", "target"):
                    if msg.get(key) and not lists.notes_allowed(hass, msg[key], connection.user):
                        raise lists.ListError("Diese Notizliste gehört zu einem anderen Konto.")
                result = await func(hass, msg, connection.context(msg))
            except lists.ListError as err:
                connection.send_error(msg["id"], "smartlists_error", str(err))
                return
            except Exception as err:  # noqa: BLE001 – Karte soll eine Meldung statt Hängen sehen
                connection.send_error(msg["id"], "smartlists_error", str(err) or type(err).__name__)
                return
            connection.send_result(msg["id"], result)

        handler.__name__ = func.__name__
        return handler

    return wrap


@_list_command({vol.Required("type"): "smartlists/get_list", vol.Required("entity_id"): str, vol.Optional("language"): str})
async def ws_get_list(hass, msg, context):
    """Liste mit zerlegten Artikeln (Name, Menge, Einheit, Tags, Kategorie) und Rechten."""
    return await lists.get_list(hass, msg["entity_id"], msg["_user"], msg.get("language"))


@_list_command({vol.Required("type"): "smartlists/lists"})
async def ws_lists(hass, msg, context):
    return {"lists": await lists.all_lists(hass, msg["_user"])}


@_list_command(
    {
        vol.Required("type"): "smartlists/add_item",
        vol.Required("entity_id"): str,
        vol.Required("text"): str,
        vol.Optional("note", default=""): str,
        vol.Optional("checked", default=False): bool,
    }
)
async def ws_add_item(hass, msg, context):
    return await lists.add_item(hass, msg["entity_id"], msg["text"], msg["note"], msg["checked"], context)


@_list_command(
    {
        vol.Required("type"): "smartlists/update_item",
        vol.Required("entity_id"): str,
        vol.Required("uid"): str,
        vol.Optional("checked"): bool,
        vol.Optional("text"): str,
        vol.Optional("note"): str,
    }
)
async def ws_update_item(hass, msg, context):
    return await lists.update_item(
        hass, msg["entity_id"], msg["uid"], checked=msg.get("checked"), text=msg.get("text"), note=msg.get("note"),
        context=context,
    )


@_list_command(
    {vol.Required("type"): "smartlists/remove_items", vol.Required("entity_id"): str, vol.Required("uids"): [str]}
)
async def ws_remove_items(hass, msg, context):
    return await lists.remove_items(hass, msg["entity_id"], msg["uids"], context)


@_list_command({vol.Required("type"): "smartlists/clear_completed", vol.Required("entity_id"): str})
async def ws_clear_completed(hass, msg, context):
    return await lists.clear_completed(hass, msg["entity_id"], context)


@_list_command(
    {
        vol.Required("type"): "smartlists/move_item",
        vol.Required("entity_id"): str,
        vol.Required("uid"): str,
        vol.Required("target"): str,
        vol.Optional("copy", default=False): bool,
    }
)
async def ws_move_item(hass, msg, context):
    return await lists.move_item(hass, msg["entity_id"], msg["uid"], msg["target"], msg["copy"], context)


# ----------------------------------------------------------------------
# Verbundene Geräte (App-Installationen) – siehe devices.py
# ----------------------------------------------------------------------
@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/register_device",
        vol.Required("device_id"): str,
        vol.Optional("name"): str,
        vol.Optional("model"): str,
        vol.Optional("manufacturer"): str,
        vol.Optional("app_version"): str,
        vol.Optional("os_version"): str,
        vol.Optional("notes_lists"): [str],
        # kombinierte Listen der App (nur aus HA-Listen) – lassen sich in der Integration verbinden
        vol.Optional("app_lists"): [dict],
    }
)
@callback
def ws_register_device(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """App meldet sich an (beim Koppeln und bei jedem Abgleich → „zuletzt gesehen“)."""
    try:
        device = hass.data[DOMAIN]["devices"].register(
            msg["device_id"], msg, connection.user.id, connection.user.name or ""
        )
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_device", str(err))
        return
    if msg.get("notes_lists") and hass.data[DOMAIN].get("notes"):
        # Notizlisten der App gehören dem Konto, mit dem die App angemeldet ist
        hass.data[DOMAIN]["notes"].claim(msg["notes_lists"], connection.user.id)
    connection.send_result(msg["id"], {"device": device})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/devices"})
@callback
def ws_devices(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Admins sehen alle Geräte, andere Benutzer nur ihre eigenen."""
    devices = hass.data[DOMAIN]["devices"]
    user = connection.user
    connection.send_result(msg["id"], {"devices": devices.entries(None if user.is_admin else user.id)})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/remove_device", vol.Required("device_id"): str})
@callback
def ws_remove_device(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    hass.data[DOMAIN]["devices"].remove(msg["device_id"])
    connection.send_result(msg["id"], {"devices": hass.data[DOMAIN]["devices"].entries()})


# ----------------------------------------------------------------------
# „Bin im Laden“, fällige Artikel, Export/Import, Automations-Einstellungen
# ----------------------------------------------------------------------
@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/shopping",
        vol.Required("entity_id"): str,
        vol.Required("active"): bool,
        vol.Optional("store"): vol.Any(str, None),
        vol.Optional("open_items"): vol.Any(int, None),
    }
)
@callback
def ws_shopping(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Karte/App: Einkaufsmodus gestartet/beendet → Ereignis smartlists_shopping."""
    from .automation import fire_shopping

    user = connection.user
    fire_shopping(hass, msg["entity_id"], msg["active"], msg.get("store"), user.id, user.name,
                  msg.get("open_items"), connection.context(msg))
    connection.send_result(msg["id"], {})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/due", vol.Optional("entity_id"): str})
@websocket_api.async_response
async def ws_due(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Fällige Artikel (Rhythmus aus dem Verlauf), ohne die, die schon offen auf der Liste stehen."""
    present: list[str] = []
    if entity_id := msg.get("entity_id"):
        try:
            present = [i["text"] for i in await lists.raw_items(hass, entity_id) if not i["checked"]]
        except lists.ListError:
            present = []
    connection.send_result(msg["id"], {"due": _learning(hass).due_items(present)})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/export", vol.Optional("include_history", default=True): bool})
@callback
def ws_export(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    data = _learning(hass).export(msg["include_history"])
    data["extras"] = _extras(hass).export()  # Reihenfolgen, Preise, Vorlagen, Strichcodes, Ausgaben
    connection.send_result(msg["id"], data)


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): "smartlists/import", vol.Required("data"): dict, vol.Optional("replace", default=False): bool}
)
@callback
def ws_import(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    try:
        counts = _learning(hass).import_data(msg["data"], msg["replace"])
        _extras(hass).import_data(msg["data"].get("extras") or {})
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_import", str(err))
        return
    connection.send_result(msg["id"], {"imported": counts})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/automation"})
@callback
def ws_automation(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    connection.send_result(msg["id"], {"settings": _learning(hass).automation})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/set_automation", vol.Required("settings"): dict})
@callback
def ws_set_automation(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    allowed = {"voice_default_list", "auto_due_list"}
    _learning(hass).set_automation({k: v for k, v in msg["settings"].items() if k in allowed})
    connection.send_result(msg["id"], {"settings": _learning(hass).automation})


# ----------------------------------------------------------------------
# Eigene Listen mit Besitzer und Freigaben (own.py)
# ----------------------------------------------------------------------
def _main_entry(hass: HomeAssistant):
    entries = hass.config_entries.async_entries(DOMAIN)
    return entries[0] if entries else None


def _combined_subentry(hass: HomeAssistant, entity_id: str):
    from .todo import list_key

    entity = lists.combined_entity(hass, entity_id)
    entry = _main_entry(hass)
    if entity is None or entry is None:
        return None
    return next((s for s in entry.subentries.values() if s.subentry_type == SUBENTRY_COMBINED and list_key(s) == entity.unique_id), None)


def _own_list(hass: HomeAssistant, entity_id: str) -> tuple[Any, dict[str, Any] | None]:
    """(Entität, Daten der Liste inkl. owner/shares) einer eigenen Liste – gruppiert oder alte Form –
    bzw. einer kombinierten Liste (Besitzer optional)."""
    entity = lists.own_entity(hass, entity_id)
    entry = _main_entry(hass)
    if entity is None and (sub := _combined_subentry(hass, entity_id)) is not None:
        return lists.combined_entity(hass, entity_id), {"owner": sub.data.get("owner"), "shares": dict(sub.data.get("shares") or {})}
    if entity is None or entry is None:
        return None, None
    if getattr(entity, "grouped", False):
        from .own_groups import find

        g, data = find(entry, entity.list_id)
        return (entity, {**data, "owner": g.data.get("owner")}) if g and data is not None else (None, None)
    sub = entry.subentries.get(entity.subentry.subentry_id)
    return (entity, dict(sub.data)) if sub else (None, None)


@websocket_api.websocket_command({vol.Required("type"): "smartlists/users"})
@websocket_api.async_response
async def ws_users(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Personen des Haushalts für die Freigabe-Auswahl (keine System-Benutzer)."""
    from .own import async_household_users

    connection.send_result(msg["id"], {"users": await async_household_users(hass), "me": connection.user.id})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/create_list", vol.Required("name"): vol.All(str, vol.Length(min=1, max=60))})
@websocket_api.async_response
async def ws_create_list(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Neue eigene Liste; Besitzer ist, wer sie anlegt (landet in dessen Gruppe „Eigene Listen · …“)."""
    if _denied(hass, connection, msg, "create_lists"):
        return
    from .own_groups import async_add_list

    try:
        list_id = await async_add_list(hass, connection.user.id, msg["name"])
    except ValueError as err:
        connection.send_error(msg["id"], "not_setup", str(err))
        return
    connection.send_result(msg["id"], {"list_id": list_id})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/share",
        vol.Required("entity_id"): str,
        vol.Required("user_id"): str,
        vol.Required("role"): vol.Any(None, vol.In(["viewer", "checker", "editor"])),
    }
)
@websocket_api.async_response
async def ws_share(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Freigabe setzen (role) oder entfernen (role = null). Nur Besitzer und Admins."""
    entity, data = _own_list(hass, msg["entity_id"])
    if data is None:
        connection.send_error(msg["id"], "not_found", "Keine eigene SmartLists-Liste.")
        return
    if lists.own_role(hass, msg["entity_id"], connection.user) != "owner":
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, "Nur der Besitzer kann Freigaben ändern.")
        return
    if msg["user_id"] == data.get("owner"):
        connection.send_error(msg["id"], "invalid", "Der Besitzer hat schon alle Rechte.")
        return
    if await hass.auth.async_get_user(msg["user_id"]) is None:
        connection.send_error(msg["id"], "invalid", "Unbekannter Benutzer.")
        return
    shares = dict(data.get("shares") or {})
    if msg["role"] is None:
        shares.pop(msg["user_id"], None)
    else:
        shares[msg["user_id"]] = msg["role"]
    if (csub := _combined_subentry(hass, msg["entity_id"])) is not None:
        if not data.get("owner"):
            connection.send_error(msg["id"], "invalid", "Erst einen Besitzer festlegen.")
            return
        hass.config_entries.async_update_subentry(_main_entry(hass), csub, data={**csub.data, "shares": shares})
    elif getattr(entity, "grouped", False):
        from .own_groups import async_update_list

        await async_update_list(hass, entity.list_id, shares=shares)
    else:
        entry = _main_entry(hass)
        sub = entry.subentries[entity.subentry.subentry_id]
        hass.config_entries.async_update_subentry(entry, sub, data={**sub.data, "shares": shares})
    connection.send_result(msg["id"], {"shares": shares})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/set_owner", vol.Required("entity_id"): str,
                                  vol.Required("owner"): vol.Any(str, None)})
@websocket_api.async_response
async def ws_set_owner(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Besitzer einer eigenen oder kombinierten Liste festlegen (Admins und der bisherige Besitzer).
    Kombinierte Listen: owner = null → wieder für alle sichtbar und bearbeitbar."""
    entity, data = _own_list(hass, msg["entity_id"])
    if data is None:
        connection.send_error(msg["id"], "not_found", "Keine eigene oder kombinierte SmartLists-Liste.")
        return
    user = connection.user
    if not user.is_admin and data.get("owner") != user.id:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, "Nur Admins und der Besitzer können das ändern.")
        return
    owner = msg["owner"] or None
    if owner and await hass.auth.async_get_user(owner) is None:
        connection.send_error(msg["id"], "invalid", "Unbekannter Benutzer.")
        return
    shares = {u: r for u, r in (data.get("shares") or {}).items() if u != owner}
    if (csub := _combined_subentry(hass, msg["entity_id"])) is not None:
        new = {**csub.data, "owner": owner, "shares": shares if owner else {}}
        if not owner:
            new.pop("owner", None)
        hass.config_entries.async_update_subentry(_main_entry(hass), csub, data=new)
    elif getattr(entity, "grouped", False):
        if not owner:
            connection.send_error(msg["id"], "invalid", "Eigene Listen brauchen einen Besitzer.")
            return
        from .own_groups import async_update_list

        await async_update_list(hass, entity.list_id, owner=owner)
    else:
        connection.send_error(msg["id"], "invalid", "Bitte die Integration einmal neu laden.")
        return
    connection.send_result(msg["id"], {"owner": owner})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/set_labels", vol.Required("entity_id"): str,
                                  vol.Required("show"): vol.In(["list", "owner", "owner_list"]),
                                  vol.Optional("sources", default=[]): [str],
                                  vol.Optional("colors", default={}): {str: vol.Any("", vol.Match(r"^#[0-9a-fA-F]{6}$"))}})
@websocket_api.async_response
async def ws_set_labels(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Herkunfts-Badges einer kombinierten Liste: was sie zeigen (Liste / Besitzer / Besitzer Liste) und von welchen
    Quell-Listen es überhaupt Badges gibt (leer = alle). Admins und der Besitzer der kombinierten Liste."""
    from .const import CONF_LABEL_COLORS, CONF_LABEL_SHOW, CONF_LABEL_SOURCES, CONF_SOURCES

    sub = _combined_subentry(hass, msg["entity_id"])
    if sub is None:
        connection.send_error(msg["id"], "not_found", "Keine kombinierte SmartLists-Liste.")
        return
    user = connection.user
    if not user.is_admin and sub.data.get("owner") != user.id:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, "Nur Admins und der Besitzer können das ändern.")
        return
    sources = [s for s in dict.fromkeys(msg["sources"]) if s in (sub.data.get(CONF_SOURCES) or [])]
    colors = {s: c.lower() for s, c in msg["colors"].items() if c and s in (sub.data.get(CONF_SOURCES) or [])}
    hass.config_entries.async_update_subentry(_main_entry(hass), sub, data={
        **sub.data, CONF_LABEL_SHOW: msg["show"], CONF_LABEL_SOURCES: sources, CONF_LABEL_COLORS: colors})
    connection.send_result(msg["id"], {"show": msg["show"], "sources": sources, "colors": colors})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/delete_list", vol.Required("entity_id"): str})
@callback
def ws_delete_list(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    entity, data = _own_list(hass, msg["entity_id"])
    if data is None:
        connection.send_error(msg["id"], "not_found", "Keine eigene SmartLists-Liste.")
        return
    if lists.own_role(hass, msg["entity_id"], connection.user) != "owner":
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, "Nur der Besitzer kann die Liste löschen.")
        return
    if (csub := _combined_subentry(hass, msg["entity_id"])) is not None:
        hass.config_entries.async_remove_subentry(_main_entry(hass), csub.subentry_id)  # Quell-Listen bleiben
    elif getattr(entity, "grouped", False):
        from .own_groups import async_remove_list

        async_remove_list(hass, entity.list_id)
    else:
        hass.config_entries.async_remove_subentry(_main_entry(hass), entity.subentry.subentry_id)
    connection.send_result(msg["id"], {})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/install_sentences"})
@websocket_api.async_response
async def ws_install_sentences(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    from .automation import async_install_sentences

    connection.send_result(msg["id"], {"languages": await async_install_sentences(hass)})


# ----------------------------------------------------------------------
# App-Backups (dauerhaft in HA, siehe app_backups.py)
# ----------------------------------------------------------------------
def _backups(hass: HomeAssistant):
    return hass.data[DOMAIN]["app_backups"]


def _may_see(hass: HomeAssistant, connection: websocket_api.ActiveConnection, device_id: str) -> bool:
    return device_id in _backups(hass).visible(connection.user.id, connection.user.is_admin)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/app_backup_save",
        vol.Required("device_id"): str,
        vol.Optional("profile_name", default=""): str,
        vol.Required("data"): str,
    }
)
@callback
def ws_app_backup_save(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    backups = _backups(hass)
    existing = backups.backups.get(msg["device_id"].strip()[:64])
    # fremdes Backup (anderer Benutzer) nicht überschreiben – außer als Admin
    if existing and existing.get("user_id") != connection.user.id and not connection.user.is_admin:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, "Backup gehört einem anderen Benutzer.")
        return
    try:
        info = backups.save(msg["device_id"], msg["profile_name"], msg["data"], connection.user.id, connection.user.name or "")
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_backup", str(err))
        return
    connection.send_result(msg["id"], {"backup": info})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/app_backups"})
@callback
def ws_app_backups(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    backups = _backups(hass)
    ids = backups.visible(connection.user.id, connection.user.is_admin)
    connection.send_result(msg["id"], {"backups": sorted((backups.describe(i) for i in ids), key=lambda b: -b["updated_at"])})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/app_backup_get", vol.Required("device_id"): str})
@callback
def ws_app_backup_get(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if not _may_see(hass, connection, msg["device_id"]):
        connection.send_error(msg["id"], "not_found", "Backup nicht gefunden.")
        return
    b = _backups(hass).backups[msg["device_id"]]
    connection.send_result(msg["id"], {**_backups(hass).describe(msg["device_id"]), "data": b["data"]})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/app_backup_delete", vol.Required("device_id"): str})
@callback
def ws_app_backup_delete(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if not _may_see(hass, connection, msg["device_id"]):
        connection.send_error(msg["id"], "not_found", "Backup nicht gefunden.")
        return
    _backups(hass).delete(msg["device_id"])
    connection.send_result(msg["id"], {})


# ----------------------------------------------------------------------
# Keyword-Packs (Kategorie-Erkennung, siehe packs.py)
# ----------------------------------------------------------------------
def _packs(hass: HomeAssistant):
    return hass.data[DOMAIN]["packs"]


@websocket_api.websocket_command({vol.Required("type"): "smartlists/packs"})
@callback
def ws_packs(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    connection.send_result(msg["id"], {"packs": _packs(hass).describe()})


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): "smartlists/pack_upload", vol.Required("pack"): dict, vol.Optional("name"): str, vol.Optional("activate", default=True): bool}
)
@callback
def ws_pack_upload(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Eigenes Pack hinzufügen (oder gleichnamiges ersetzen). Format: siehe categories.py."""
    try:
        result = _packs(hass).add_custom(msg["pack"], msg.get("name"), msg["activate"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_pack", str(err))
        return
    connection.send_result(msg["id"], {**result, "packs": _packs(hass).describe()})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/pack_delete", vol.Required("pack_id"): str})
@callback
def ws_pack_delete(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    try:
        _packs(hass).delete_custom(msg["pack_id"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_pack", str(err))
        return
    connection.send_result(msg["id"], {"packs": _packs(hass).describe()})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/pack_set_active", vol.Required("active"): [str]})
@callback
def ws_pack_set_active(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Aktive Packs in Reihenfolge (vorne gewinnt bei gleichem Stichwort)."""
    try:
        _packs(hass).set_active(msg["active"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_pack", str(err))
        return
    connection.send_result(msg["id"], {"packs": _packs(hass).describe()})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/pack_export", vol.Required("pack_id"): str})
@callback
def ws_pack_export(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Pack als Datei herunterladen – Vorlage für eigene Packs."""
    try:
        connection.send_result(msg["id"], _packs(hass).export(msg["pack_id"]))
    except KeyError:
        connection.send_error(msg["id"], "not_found", "Pack nicht gefunden.")


@websocket_api.websocket_command({vol.Required("type"): "smartlists/notes"})
@callback
def ws_notes(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Notizlisten der App: Einstellung (mode, scope) und – für Admins – alle Notizlisten mit Besitzer."""
    notes = hass.data[DOMAIN]["notes"]
    info = notes.describe()
    if not connection.user.is_admin:
        info["lists"] = [n for n in info["lists"] if notes.can_see(n["entity_id"], connection.user)]
    connection.send_result(msg["id"], info)


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/set_notes",
        vol.Optional("mode"): vol.In(["hidden", "section"]),
        vol.Optional("scope"): vol.In(["owner", "household"]),
        vol.Optional("owners"): {str: vol.Any(str, None)},
    }
)
@callback
def ws_set_notes(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    notes = hass.data[DOMAIN]["notes"]
    notes.update(msg.get("mode"), msg.get("scope"), msg.get("owners"))
    connection.send_result(msg["id"], notes.describe())


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/pack_create", vol.Required("name"): str, vol.Optional("language", default=""): str})
@callback
def ws_pack_create(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Neues, leeres eigenes Pack (z.B. für eine weitere Sprache)."""
    try:
        pid = _packs(hass).create(msg["name"], msg["language"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_pack", str(err))
        return
    connection.send_result(msg["id"], {"pack_id": pid, "packs": _packs(hass).describe()})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/pack_terms",
        vol.Required("pack_id"): str,
        vol.Optional("query", default=""): str,
        vol.Optional("offset", default=0): vol.All(int, vol.Range(min=0)),
        vol.Optional("limit", default=100): vol.All(int, vol.Range(min=1, max=500)),
    }
)
@callback
def ws_pack_terms(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Stichwörter eines Packs durchsuchen (seitenweise)."""
    try:
        connection.send_result(msg["id"], _packs(hass).terms(msg["pack_id"], msg["query"], msg["offset"], msg["limit"]))
    except ValueError as err:
        connection.send_error(msg["id"], "not_found", str(err))


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/pack_update",
        vol.Required("pack_id"): str,
        vol.Required("terms"): {str: vol.Any(str, None)},
        vol.Optional("name"): str,
    }
)
@callback
def ws_pack_update(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Stichwörter hinzufügen/ändern (Kategorie-ID) oder löschen (null). Eingebaute Packs werden über ein
    Ergänzungs-Pack „<Name> +“ erweitert, damit Updates der Integration nichts überschreiben."""
    try:
        result = _packs(hass).update_terms(msg["pack_id"], msg["terms"], msg.get("name"))
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_pack", str(err))
        return
    connection.send_result(msg["id"], {**result, "packs": _packs(hass).describe()})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/stores"})
@callback
def ws_stores(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Märkte (benutzte + bekannte Ketten) mit verknüpfter Zone."""
    connection.send_result(msg["id"], {"stores": _learning(hass).stores()})


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): "smartlists/set_store_zone", vol.Required("store"): str, vol.Optional("zone"): vol.Any(str, None),
     vol.Optional("zones"): [str], vol.Optional("add", default=False): bool}
)
@callback
def ws_set_store_zone(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Markt mit Zonen verknüpfen: zones = alle (z.B. mehrere Filialen), zone + add = eine hinzufügen,
    zone allein = ersetzen, zone=None = alle lösen."""
    try:
        zones = _learning(hass).set_store_zone(msg["store"], msg.get("zone"), msg.get("zones"), msg["add"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_store", str(err))
        return
    connection.send_result(msg["id"], {"store_zones": zones, "stores": _learning(hass).stores()})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/appearance"})
@callback
def ws_appearance(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Badges & Farben: Einstellung + alle bekannten Badges (Märkte, Personen, Schlagwörter)."""
    learning = _learning(hass)
    connection.send_result(msg["id"], {"appearance": learning.appearance, "tags": learning.tag_overview()})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/set_appearance", vol.Required("appearance"): dict})
@callback
def ws_set_appearance(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Badges & Farben für den Haushalt speichern (unbekannte/ungültige Angaben werden verworfen)."""
    learning = _learning(hass)
    connection.send_result(msg["id"], {"appearance": learning.set_appearance(msg["appearance"]), "tags": learning.tag_overview()})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/app_lists"})
@callback
def ws_app_lists(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Von der App gemeldete kombinierte Listen je Gerät (Admin: alle Geräte, sonst die eigenen)."""
    from . import app_lists

    user = connection.user
    connection.send_result(msg["id"], {"lists": app_lists.describe(hass, None if user.is_admin else user.id)})


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): "smartlists/connect_app_list", vol.Required("device_id"): str, vol.Required("list_id"): str}
)
@callback
def ws_connect_app_list(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """App-Liste als kombinierte Liste der Integration anlegen (gehört dann zum Gerät der App)."""
    from . import app_lists

    try:
        sub_id = app_lists.connect(hass, msg["device_id"], msg["list_id"])
    except ValueError as err:
        connection.send_error(msg["id"], "smartlists_error", str(err))
        return
    connection.send_result(msg["id"], {"subentry_id": sub_id, "lists": app_lists.describe(hass)})



# ======================================================================
# 2.8: Markt-Reihenfolge, Preise & Ausgaben, Vorlagen, Statistik, Teilen, Benachrichtigungen, Strichcodes
# ======================================================================
def _extras(hass: HomeAssistant):
    return hass.data[DOMAIN]["extras"]


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/store_order", vol.Required("store"): str,
                                  vol.Optional("zone"): vol.Any(str, None), vol.Optional("order"): vol.Any([str], None)})
@callback
def ws_store_order(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Gang-Reihenfolge der Kategorien für einen Markt (optional je Zone). order=None → Standard."""
    try:
        result = _extras(hass).set_store_order(msg["store"], msg.get("order"), msg.get("zone"))
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], {"store_order": result})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/set_price", vol.Required("name"): str,
                                  vol.Optional("price"): vol.Any(vol.Coerce(float), None), vol.Optional("store"): vol.Any(str, None)})
@callback
def ws_set_price(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Preis je Einheit für einen Artikel merken (None = vergessen)."""
    if _denied(hass, connection, msg, "prices"):
        return
    price = msg.get("price")
    if price is not None and not 0 <= price < 100000:
        connection.send_error(msg["id"], "invalid", "Preis ungültig")
        return
    _extras(hass).set_price(msg["name"], price, msg.get("store"))
    connection.send_result(msg["id"], {})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/expenses",
                                  vol.Optional("period", default="month"): vol.In(["week", "month", "year"]),
                                  vol.Optional("count", default=6): vol.All(int, vol.Range(min=1, max=24))})
@callback
def ws_expenses(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    connection.send_result(msg["id"], _extras(hass).expense_report(msg["period"], msg["count"]))


@websocket_api.websocket_command({vol.Required("type"): "smartlists/templates"})
@callback
def ws_templates(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    connection.send_result(msg["id"], {"templates": [{"id": k, **v} for k, v in _extras(hass).templates.items()]})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/save_template", vol.Optional("template_id"): str,
                                  vol.Required("name"): str, vol.Required("items"): [str], vol.Optional("emoji", default=""): str,
                                  vol.Optional("servings"): vol.Any(vol.All(int, vol.Range(min=1, max=100)), None)})
@callback
def ws_save_template(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if _denied(hass, connection, msg, "templates"):
        return
    try:
        tid = _extras(hass).save_template(msg.get("template_id"), msg["name"], msg["items"], msg["emoji"], msg.get("servings"))
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], {"template_id": tid})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/delete_template", vol.Required("template_id"): str})
@callback
def ws_delete_template(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if _denied(hass, connection, msg, "templates"):
        return
    _extras(hass).delete_template(msg["template_id"])
    connection.send_result(msg["id"], {})


@_list_command({vol.Required("type"): "smartlists/add_template", vol.Required("entity_id"): str, vol.Required("template_id"): str,
                vol.Optional("servings"): vol.Any(vol.All(int, vol.Range(min=1, max=100)), None), vol.Optional("skip", default=[]): [int]})
async def ws_add_template(hass, msg, context):
    from .automation import add_template_items

    return await add_template_items(hass, msg["entity_id"], msg["template_id"], msg.get("servings"), msg["skip"], context)


@websocket_api.websocket_command({vol.Required("type"): "smartlists/stats", vol.Optional("days", default=90): vol.All(int, vol.Range(min=0, max=3650))})
@callback
def ws_stats(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    from .extras import stats

    connection.send_result(msg["id"], stats(_learning(hass), _extras(hass), msg["days"]))


def _may_share(hass: HomeAssistant, entity_id: str, user: Any) -> str | None:
    """Fehlermeldung, wenn der Benutzer diese Liste nicht teilen darf (sonst None)."""
    if not entity_id.startswith("todo.") or hass.states.get(entity_id) is None:
        return "Liste nicht gefunden."
    if lists.is_notes(hass, entity_id):
        return "Notizlisten lassen sich nicht teilen."
    who = _learning(hass).rights()["share_who"]
    if who == "nobody":
        return "Teilen per Link ist ausgeschaltet (Global → Teilen und Rechte)."
    if user.is_admin:
        return None
    own = lists.own_entity(hass, entity_id) is not None
    role = lists.own_role(hass, entity_id, user)
    if who == "owners" and own and role == "owner":
        return None
    if who == "editors" and role in ("owner", "editor"):  # andere Listen: jeder darf sie bearbeiten → role "owner"
        return None
    return "Du darfst diese Liste nicht per Link teilen (legt ein Admin unter Global → Teilen und Rechte fest)."


@websocket_api.websocket_command({vol.Required("type"): "smartlists/share_links", vol.Required("entity_id"): str})
@callback
def ws_share_links(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if (err := _may_share(hass, msg["entity_id"], connection.user)) is not None:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, err)
        return
    connection.send_result(msg["id"], {"links": hass.data[DOMAIN]["shares"].for_list(msg["entity_id"]), **_public_info(hass)})


def _public_info(hass: HomeAssistant) -> dict[str, Any]:
    """Für die Karte: Art der öffentlichen Adresse und die aktuelle (Links mit anderer Tunnel-Adresse gehen nicht mehr)."""
    public = hass.data[DOMAIN].get("public")
    if public is None:
        return {"public_mode": "ha", "public_base": None}
    try:
        base = public.base_url()
    except ValueError:
        base = None
    return {"public_mode": public.mode, "public_base": base}


@websocket_api.websocket_command({vol.Required("type"): "smartlists/share_create", vol.Required("entity_id"): str,
                                  vol.Optional("check", default="off"): vol.In(["off", "soft", "on"]),
                                  vol.Optional("add", default=False): bool,
                                  vol.Optional("hours"): vol.Any(vol.All(int, vol.Range(min=1, max=24 * 365)), None)})
@callback
def ws_share_create(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Link erstellen. Der Schlüssel kommt nur in dieser Antwort vor (gespeichert wird nur sein Hash)."""
    if (err := _may_share(hass, msg["entity_id"], connection.user)) is not None:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, err)
        return
    check, add, hours = msg["check"], msg["add"], msg.get("hours", 24 * 7)
    if not connection.user.is_admin:
        # Grenzen des Admins: höchstens erlaubte Rechte und Gültigkeit
        from .learning import clamp_link

        check, add, hours = clamp_link(_learning(hass).rights(), check, add, hours)
    # Öffentliche Adresse (Tunnel/Proxy) – ist sie gewählt, aber nicht bereit, gibt es keinen Link (sonst
    # baute die Karte ihn mit der HA-Adresse, und genau die soll nicht herausgegeben werden)
    public = hass.data[DOMAIN].get("public")
    try:
        base = public.base_url() if public is not None else None
    except ValueError as err:
        connection.send_error(msg["id"], "public_unavailable", str(err))
        return
    try:
        link = hass.data[DOMAIN]["shares"].create(msg["entity_id"], connection.user.id, check, add, hours=hours, base=base)
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], {**link, "path": f"/smartlists-share/{link['token']}", "base": base})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/share_public"})
@websocket_api.async_response
async def ws_share_public(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Teilen und Rechte → Öffentliche Adresse: Einstellung und Zustand (Server, Tunnel, cloudflared).
    Sucht cloudflared jedes Mal neu – so sieht man gleich, ob eine eben abgelegte Datei gefunden wird."""
    from .public import find_cloudflared

    public = hass.data[DOMAIN]["public"]
    path, problem = await hass.async_add_executor_job(find_cloudflared, hass.config.config_dir)
    # Datei inzwischen abgelegt, Tunnel stand auf „cloudflared fehlt“ → ohne erneutes Speichern starten
    if path and public.mode == "tunnel" and str(public.error or "").startswith(("cloudflared_missing", "cloudflared_not_executable", "cloudflared_wrong")):
        await public.async_apply()
    connection.send_result(msg["id"], {**public.status(), "cloudflared": path, "cloudflared_problem": problem})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/set_share_public",
                                  vol.Optional("mode"): vol.In(["ha", "tunnel", "proxy"]),
                                  vol.Optional("port"): vol.All(int, vol.Range(min=1024, max=65535)),
                                  vol.Optional("url"): str})
@websocket_api.async_response
async def ws_set_share_public(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    try:
        status = await hass.data[DOMAIN]["public"].async_update(msg.get("mode"), msg.get("port"), msg.get("url"))
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], status)


@websocket_api.websocket_command({vol.Required("type"): "smartlists/share_revoke", vol.Required("entity_id"): str, vol.Required("link_id"): str})
@callback
def ws_share_revoke(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if (err := _may_share(hass, msg["entity_id"], connection.user)) is not None:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, err)
        return
    hass.data[DOMAIN]["shares"].revoke(msg["link_id"], msg["entity_id"])
    connection.send_result(msg["id"], {"links": hass.data[DOMAIN]["shares"].for_list(msg["entity_id"])})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/notify"})
@callback
def ws_notify(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Eigene Benachrichtigungs-Einstellungen + mögliche Ziele (alle notify-Dienste und -Entitäten)."""
    n = hass.data[DOMAIN]["notifier"]
    connection.send_result(msg["id"], {"settings": n.get(connection.user.id), "services": n.services(), "entities": n.entities(),
                                       "custom_allowed": bool(connection.user.is_admin)})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/set_notify", vol.Required("settings"): dict})
@callback
def ws_set_notify(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    n = hass.data[DOMAIN]["notifier"]
    from .notify import validate_targets

    targets = validate_targets(msg["settings"].get("targets"), msg["settings"].get("service"))
    # unverändert gespeicherte Ziele (z. B. ein später entfernter Dienst) blockieren andere Änderungen nicht
    old = {json.dumps(t, sort_keys=True, default=str) for t in n.get(connection.user.id)["targets"]}
    new = [t for t in targets if json.dumps(t, sort_keys=True, default=str) not in old]
    if (err := n.check_targets(new, bool(connection.user.is_admin))) is not None:
        connection.send_error(msg["id"], "invalid", err)
        return
    connection.send_result(msg["id"], {"settings": n.set(connection.user.id, msg["settings"])})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/notify_test"})
@websocket_api.async_response
async def ws_notify_test(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    try:
        result = await hass.data[DOMAIN]["notifier"].async_test(connection.user.id)
    except Exception as err:  # noqa: BLE001
        connection.send_error(msg["id"], "notify_failed", str(err))
        return
    connection.send_result(msg["id"], {"ok": True, **result})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/barcode", vol.Required("code"): vol.All(str, vol.Match(r"^\d{6,14}$"))})
@websocket_api.async_response
async def ws_barcode(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Strichcode → Produkt. Erst aus dem eigenen Speicher, sonst Open Food Facts (nur der Code wird gesendet)."""
    from .barcode import async_lookup

    connection.send_result(msg["id"], await async_lookup(hass, msg["code"]))


@websocket_api.websocket_command({vol.Required("type"): "smartlists/subscribe"})
@callback
def ws_subscribe(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Live-Meldung an offene Karten/Seiten, wenn sich Haushaltsdaten ändern (Kategorien, Packs, Badges,
    Preise, Vorlagen, Reihenfolgen, geteilte Links, Notizen, Geräte/App-Listen). Die Karte lädt dann neu –
    die Artikel selbst kommen weiter über todo/item/subscribe."""
    from homeassistant.helpers.dispatcher import async_dispatcher_connect

    from .const import SIGNAL_DATA_CHANGED, SIGNAL_LEARNING_CHANGED
    from .devices import SIGNAL_DEVICES_CHANGED

    @callback
    def forward(*_args: Any) -> None:
        connection.send_message(websocket_api.event_message(msg["id"], {"changed": True}))

    unsubs = [async_dispatcher_connect(hass, sig, forward)
              for sig in (SIGNAL_DATA_CHANGED, SIGNAL_LEARNING_CHANGED, SIGNAL_DEVICES_CHANGED)]

    @callback
    def unsubscribe() -> None:
        for u in unsubs:
            u()

    connection.subscriptions[msg["id"]] = unsubscribe
    connection.send_result(msg["id"])



@websocket_api.websocket_command({vol.Required("type"): "smartlists/expense_entries", vol.Optional("limit", default=100): vol.All(int, vol.Range(min=1, max=500))})
@callback
def ws_expense_entries(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Einzelne Buchungen (Admins: alle, sonst nur eigene) – zum Prüfen und Löschen."""
    user = connection.user
    connection.send_result(msg["id"], {"entries": _extras(hass).expense_entries(None if user.is_admin else user.id, msg["limit"])})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/delete_expense", vol.Required("expense_id"): str})
@callback
def ws_delete_expense(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    user = connection.user
    if not _extras(hass).delete_expense(msg["expense_id"], None if user.is_admin else user.id):
        connection.send_error(msg["id"], "not_found", "Buchung nicht gefunden (oder nicht deine).")
        return
    connection.send_result(msg["id"], {})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/forget_history", vol.Required("name"): str})
@callback
def ws_forget_history(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Falschen Eintrag aus dem Verlauf (Statistik, Vorschläge, Rhythmus) entfernen."""
    from .categories import normalize

    learning = _learning(hass)
    if learning.history.pop(normalize(msg["name"]), None) is None:
        connection.send_error(msg["id"], "not_found", "Nicht im Verlauf.")
        return
    learning._changed()
    connection.send_result(msg["id"], {})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/create_notes", vol.Optional("name", default=""): str})
@websocket_api.async_response
async def ws_create_notes(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Notizliste anlegen (Local To-do, Entitäts-ID todo.ha_smartlists_notes_<name>), Besitzer = wer sie anlegt.
    So kann man Notizen in SmartLists nutzen, auch wenn die App noch keine angelegt hat."""
    from .notes import async_create_notes_list

    try:
        entity_id = await async_create_notes_list(hass, connection.user, msg["name"])
    except ValueError as err:
        connection.send_error(msg["id"], "failed", str(err))
        return
    notes = hass.data[DOMAIN]["notes"]
    connection.send_result(msg["id"], {"entity_id": entity_id, "mode": notes.mode})



@_list_command({vol.Required("type"): "smartlists/finish_shopping", vol.Required("entity_id"): str,
                vol.Optional("reopen", default=False): bool})
async def ws_finish_shopping(hass, msg, context):
    """„Einkauf beendet“: Summe im Wagen auf 0. Mit reopen=True werden die abgehakten Artikel wieder offen
    (für Listen, die man jede Woche neu benutzt)."""
    extras = _extras(hass)
    start = extras.finish_trip(msg["entity_id"])
    reopened = 0
    if msg["reopen"]:
        for item in await lists.raw_items(hass, msg["entity_id"]):
            if item["checked"]:
                await lists._call(hass, "update_item", {"entity_id": msg["entity_id"], "item": item["uid"], "status": lists.STATUS_OPEN}, context)
                reopened += 1
    return {"trip_start": start, "reopened": reopened}



def _denied(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any], right: str) -> bool:
    """True (und Fehlermeldung gesendet), wenn ein Nicht-Admin etwas tut, das der Admin abgeschaltet hat."""
    if connection.user.is_admin or _learning(hass).rights().get(right, True):
        return False
    connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED,
                          "Das hat ein Admin für Benutzer ohne Admin-Rechte ausgeschaltet (Global → Teilen und Rechte).")
    return True


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/set_rights", vol.Required("rights"): dict})
@callback
def ws_set_rights(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Was Benutzer ohne Admin-Rechte dürfen (Teilen per Link, Listen anlegen, Vorlagen, Kategorien, Preise)."""
    connection.send_result(msg["id"], {"rights": _learning(hass).set_rights(msg["rights"])})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/share_links_all"})
@callback
def ws_share_links_all(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Alle aktiven Links aller Listen (für die Übersicht des Admins)."""
    out = []
    for link in hass.data[DOMAIN]["shares"].all_links():
        state = hass.states.get(link["entity_id"])
        out.append({**link, "list_name": state.attributes.get("friendly_name", link["entity_id"]) if state else link["entity_id"]})
    connection.send_result(msg["id"], {"links": out})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/set_list_settings", vol.Required("entity_id"): str,
                                  vol.Optional("name"): vol.All(str, vol.Length(min=1, max=60)),
                                  vol.Optional("sort"): vol.Any(str, None), vol.Optional("show_prices"): bool,
                                  vol.Optional("categories"): bool, vol.Optional("suggest_scope"): vol.In(["list", "all"]),
                                  vol.Optional("plain"): bool})
@callback
def ws_set_list_settings(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Darstellung einer Liste für alle Geräte: Name (Anzeigename in HA), Standard-Sortierung, Preise an/aus.
    Admins; bei eigenen Listen auch der Besitzer."""
    entity_id = msg["entity_id"]
    user = connection.user
    owner = lists.own_entity(hass, entity_id) is not None and lists.own_role(hass, entity_id, user) == "owner"
    if hass.states.get(entity_id) is None or not entity_id.startswith("todo."):
        connection.send_error(msg["id"], "not_found", "Liste nicht gefunden.")
        return
    if not (user.is_admin or owner):
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, "Nur Admins oder der Besitzer der Liste.")
        return
    if "name" in msg:
        from homeassistant.helpers import entity_registry as er

        registry = er.async_get(hass)
        if registry.async_get(entity_id) is None:
            connection.send_error(msg["id"], "invalid", "Diese Liste lässt sich hier nicht umbenennen.")
            return
        registry.async_update_entity(entity_id, name=msg["name"].strip())
    settings = _extras(hass).set_list_settings(entity_id, msg.get("sort") if "sort" in msg else None, msg.get("show_prices"),
                                               msg.get("categories"), msg.get("suggest_scope"), msg.get("plain"))
    connection.send_result(msg["id"], {"settings": settings})



@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/setup",
        vol.Optional("skip", default=False): bool,
        # Listen: vorhandene benutzen (optional zusammenfassen) oder eine neue eigene anlegen
        vol.Optional("lists", default=[]): [str],
        vol.Optional("combine_name"): vol.Any(str, None),
        vol.Optional("new_list"): vol.Any(str, None),
        vol.Optional("shares", default={}): {str: vol.In(["viewer", "checker", "editor"])},
        vol.Optional("stores", default=[]): [str],
        vol.Optional("tag_rules"): list,
        vol.Optional("packs"): [str],
        vol.Optional("notify_service"): vol.Any(str, None),
        vol.Optional("voice", default=False): bool,
        vol.Optional("prices", default=True): bool,
        vol.Optional("barcode", default=True): bool,
        vol.Optional("share_links", default=False): bool,
        # Extras – im Assistenten standardmäßig aus (fehlt die Angabe: unverändert)
        vol.Optional("notes"): bool,
        vol.Optional("mealplan"): bool,
        vol.Optional("stats"): bool,
    }
)
@websocket_api.async_response
async def ws_setup(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Einrichtungs-Assistent: alles auf einmal übernehmen. skip=True merkt nur „erledigt“."""
    from types import MappingProxyType

    from homeassistant.config_entries import ConfigSubentry
    from homeassistant.util import slugify

    from .const import CONF_DEFAULT_ADD, CONF_FOREIGN, CONF_MODE, CONF_SORT, CONF_SOURCE_AS_PERSON, CONF_SOURCE_LABEL, CONF_SOURCES, \
        LABEL_SUFFIX, MODE_BIDIRECTIONAL, SORT_CATEGORY, SUBENTRY_COMBINED, SUBENTRY_OWN

    learning = _learning(hass)
    done: list[str] = []
    if not msg["skip"]:
        entry = _main_entry(hass)
        if entry is None:
            connection.send_error(msg["id"], "not_setup", "SmartLists ist nicht eingerichtet.")
            return
        user = connection.user
        lists_sel = [e for e in msg["lists"] if hass.states.get(e) is not None and not lists.is_notes(hass, e)]
        main_list: str | None = lists_sel[0] if lists_sel else None
        if msg.get("new_list"):
            name = msg["new_list"].strip()[:60]
            from .own_groups import async_add_list

            await async_add_list(hass, user.id, name, dict(msg["shares"]))
            main_list = f"todo.ha_smartlists_list_{slugify(name) or 'list'}"
            done.append("own_list")
        elif msg.get("combine_name") and len(lists_sel) >= 2:
            name = msg["combine_name"].strip()[:60]
            data = {CONF_SOURCES: lists_sel, CONF_MODE: MODE_BIDIRECTIONAL, CONF_SOURCE_LABEL: LABEL_SUFFIX,
                    CONF_SORT: SORT_CATEGORY, CONF_FOREIGN: [], CONF_SOURCE_AS_PERSON: True, CONF_DEFAULT_ADD: lists_sel[0]}
            sub = ConfigSubentry(data=MappingProxyType(data), subentry_type=SUBENTRY_COMBINED, title=name, unique_id=None)
            hass.config_entries.async_add_subentry(entry, sub)
            main_list = f"todo.ha_smartlists_list_merged_{slugify(name) or 'list'}"
            done.append("combined_list")
        if msg["stores"]:
            learning.automation["favorite_stores"] = [s.strip().lstrip("@")[:30] for s in msg["stores"] if s.strip()][:30]
            done.append("stores")
        if msg.get("tag_rules") is not None:
            try:
                learning.set_tag_rules([r for r in msg["tag_rules"] if isinstance(r, dict) and r.get("prefix")])
                done.append("naming")
            except ValueError:
                pass
        if msg.get("packs"):
            try:
                hass.data[DOMAIN]["packs"].set_active(msg["packs"])
                done.append("packs")
            except ValueError:
                pass
        if msg.get("notify_service"):
            notifier = hass.data[DOMAIN]["notifier"]
            if msg["notify_service"] in notifier.services():
                cur = notifier.get(user.id)
                notifier.set(user.id, {**cur, "targets": [*cur["targets"], {"kind": "service", "id": "notify." + msg["notify_service"]}], "added": True})
                done.append("notify")
        if msg["voice"] and main_list:
            learning.automation["voice_default_list"] = main_list
            try:
                from .automation import async_install_sentences

                await async_install_sentences(hass)
            except Exception:  # noqa: BLE001 – Assist ist optional
                pass
            done.append("voice")
        learning.automation["barcode_lookup"] = bool(msg["barcode"])
        rights = learning.rights()
        rights["share_who"] = "owners" if msg["share_links"] else "admins"
        learning.automation["rights"] = rights
        if "notes" in msg or "mealplan" in msg or "stats" in msg:
            set_features(hass, notes=msg.get("notes"), mealplan=msg.get("mealplan"), stats=msg.get("stats"))
            done.extend(k for k in ("notes", "mealplan", "stats") if msg.get(k))
        if not msg["prices"]:
            for e in [*lists_sel, *([main_list] if main_list else [])]:
                _extras(hass).set_list_settings(e, show_prices=False)
    learning.automation["setup_done"] = True
    learning.automation.pop("setup_pending", None)
    learning._changed(categories=True)
    connection.send_result(msg["id"], {"done": done})



@websocket_api.websocket_command({vol.Required("type"): "smartlists/mealplan", vol.Required("start"): str,
                                  vol.Optional("days", default=7): vol.All(int, vol.Range(min=1, max=31))})
@callback
def ws_mealplan(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Wochenplan: je Tag die eingetragenen Gerichte (Vorlagen)."""
    try:
        connection.send_result(msg["id"], {"days": _extras(hass).plan(msg["start"], msg["days"])})
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))


@websocket_api.websocket_command({vol.Required("type"): "smartlists/set_meals", vol.Required("date"): str, vol.Required("template_ids"): [str]})
@callback
def ws_set_meals(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if _denied(hass, connection, msg, "templates"):
        return
    try:
        connection.send_result(msg["id"], {"template_ids": _extras(hass).set_meals(msg["date"], msg["template_ids"])})
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))


@_list_command({vol.Required("type"): "smartlists/add_meals", vol.Required("entity_id"): str, vol.Required("start"): str,
                vol.Optional("days", default=7): vol.All(int, vol.Range(min=1, max=31)),
                vol.Optional("servings"): vol.Any(vol.All(int, vol.Range(min=1, max=100)), None)})
async def ws_add_meals(hass, msg, context):
    """Zutaten aller Gerichte im Zeitraum auf eine Liste (gleiche Artikel werden zusammengezählt)."""
    from .automation import add_template_items

    added = increased = 0
    for day in _extras(hass).plan(msg["start"], msg["days"]):
        for tpl in day["templates"]:
            r = await add_template_items(hass, msg["entity_id"], tpl["id"], msg.get("servings"), [], context)
            added += r["added"]
            increased += r["increased"]
    return {"added": added, "increased": increased}


def _mealie_entry(hass: HomeAssistant) -> str | None:
    entries = [e for e in hass.config_entries.async_entries("mealie") if e.state.value == "loaded"]
    return entries[0].entry_id if entries else None


@websocket_api.websocket_command({vol.Required("type"): "smartlists/mealie_status"})
@callback
def ws_mealie_status(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    connection.send_result(msg["id"], {"available": _mealie_entry(hass) is not None})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/mealie_import", vol.Required("start"): str,
                                  vol.Optional("days", default=7): vol.All(int, vol.Range(min=1, max=31)),
                                  vol.Optional("plan", default=True): bool})
@websocket_api.async_response
async def ws_mealie_import(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Mealie-Wochenplan holen: jedes Rezept wird eine Vorlage (Zutaten), auf Wunsch in den Wochenplan eingetragen."""
    if _denied(hass, connection, msg, "templates"):
        return
    import datetime as dt

    entry_id = _mealie_entry(hass)
    if entry_id is None:
        connection.send_error(msg["id"], "not_found", "Die Mealie-Integration ist nicht eingerichtet.")
        return
    try:
        start = dt.date.fromisoformat(msg["start"])
        end = start + dt.timedelta(days=msg["days"] - 1)
        res = await hass.services.async_call("mealie", "get_mealplan", {"config_entry_id": entry_id, "start_date": start.isoformat(),
                                             "end_date": end.isoformat()}, blocking=True, return_response=True)
    except Exception as err:  # noqa: BLE001
        connection.send_error(msg["id"], "failed", f"Mealie: {err}")
        return
    extras = _extras(hass)
    templates = recipes = 0
    by_day: dict[str, list[str]] = {}
    cache: dict[str, str] = {}
    for meal in (res or {}).get("mealplan") or []:
        recipe = meal.get("recipe") if isinstance(meal, dict) else None
        day = str(meal.get("mealplan_date") or meal.get("date") or "")[:10] if isinstance(meal, dict) else ""
        if not recipe:
            continue
        rid = recipe.get("recipe_id") or recipe.get("id") or recipe.get("slug")
        if not rid:
            continue
        if rid not in cache:
            try:
                full = await hass.services.async_call("mealie", "get_recipe", {"config_entry_id": entry_id, "recipe_id": str(rid)},
                                                      blocking=True, return_response=True)
            except Exception:  # noqa: BLE001
                continue
            r = (full or {}).get("recipe") or {}
            from .extras import ingredient_text

            lines = [x for x in (ingredient_text(i) for i in r.get("ingredients") or []) if x]
            if not lines:
                continue
            servings = r.get("recipe_yield") or r.get("recipe_servings")
            try:
                servings = int(float(str(servings).split()[0])) if servings else None
            except ValueError:
                servings = None
            tid = f"mealie_{str(recipe.get('slug') or rid)[:40]}"
            existed = tid in extras.templates
            extras.save_template(tid, str(r.get("name") or recipe.get("name") or "Mealie")[:60], lines, "🍽️", servings)
            cache[rid] = tid
            recipes += 1
            templates += 0 if existed else 1
        if day:
            by_day.setdefault(day, []).append(cache[rid])
    if msg["plan"]:
        for day, ids in by_day.items():
            try:
                extras.set_meals(day, [*extras.mealplan.get(day, []), *ids])
            except ValueError:
                continue
    connection.send_result(msg["id"], {"recipes": recipes, "new_templates": templates, "days": len(by_day)})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/item_history", vol.Required("entity_id"): str, vol.Optional("name", default=""): str})
@websocket_api.async_response
async def ws_item_history(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Wer hat einen Artikel wann hinzugefügt, abgehakt, umbenannt oder gelöscht."""
    entity_id = msg["entity_id"]
    if not lists.notes_allowed(hass, entity_id, connection.user) or lists.own_role(hass, entity_id, connection.user) is None:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, "Keine Berechtigung für diese Liste.")
        return
    rows = hass.data[DOMAIN]["itemlog"].for_item(entity_id, msg["name"])
    names: dict[str, str] = {}
    for r in rows:
        uid = r.get("user")
        if uid and uid not in names:
            user = await hass.auth.async_get_user(uid)
            names[uid] = (user.name if user else "") or "?"
    connection.send_result(msg["id"], {"entries": [{**r, "user_name": names.get(r.get("user") or "", None)} for r in rows]})



async def async_reset(hass: HomeAssistant, settings: bool, data: bool, links: bool, combined: bool) -> dict[str, Any]:
    """SmartLists von vorn: Teile zurücksetzen und den Einrichtungs-Assistenten wieder anbieten.
    To-do-Listen selbst (Local To-do, Einkaufsliste, eigene SmartLists-Listen) werden nie gelöscht."""
    from .const import SUBENTRY_COMBINED

    out: dict[str, Any] = {}
    _learning(hass).reset(settings, data)
    _extras(hass).reset(settings, data)
    if settings:
        packs = hass.data[DOMAIN]["packs"]
        lang = (hass.config.language or "de").split("-")[0]
        try:
            packs.set_active([lang if lang in packs.builtin else "de"])
        except ValueError:
            pass
    if links:
        out["links"] = hass.data[DOMAIN]["shares"].revoke_all()
    if combined:
        entry = _main_entry(hass)
        if entry is not None:
            subs = [s.subentry_id for s in entry.subentries.values() if s.subentry_type == SUBENTRY_COMBINED]
            for sid in subs:
                hass.config_entries.async_remove_subentry(entry, sid)
            out["combined"] = len(subs)
    return out


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/reset", vol.Optional("settings", default=True): bool,
                                  vol.Optional("data", default=False): bool, vol.Optional("links", default=False): bool,
                                  vol.Optional("combined", default=False): bool})
@websocket_api.async_response
async def ws_reset(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    connection.send_result(msg["id"], await async_reset(hass, msg["settings"], msg["data"], msg["links"], msg["combined"]))


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/migrate_candidates"})
@callback
def ws_migrate_candidates(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    from .migrate import candidates

    connection.send_result(msg["id"], {"lists": candidates(hass, connection.user)})


@websocket_api.require_admin
@websocket_api.websocket_command({
    vol.Required("type"): "smartlists/migrate",
    vol.Required("sources"): [str],
    vol.Optional("mode", default="each"): vol.In(["each", "one"]),
    vol.Optional("name"): vol.Any(str, None),
    vol.Optional("old", default="keep"): vol.In(["keep"]),  # alte Listen bleiben immer
    vol.Optional("tag_kind"): vol.Any(None, vol.In(["person", "tag"])),
    vol.Optional("target", default="list"): vol.In(["list", "notes"]),
})
@websocket_api.async_response
async def ws_migrate(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """To-do-Listen in eigene SmartLists-Listen übernehmen (Besitzer: wer migriert)."""
    from .migrate import async_migrate

    try:
        result = await async_migrate(hass, connection.user.id, msg["sources"], msg["mode"], msg.get("name"), msg["old"], msg.get("tag_kind"),
                                     msg["target"], connection.user)
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], result)
