"""SmartLists: kombinierte To-do-Listen für Home Assistant.

Die Integration wird einmal eingerichtet (Einstellungen → Geräte & Dienste → Integrationen).
Jede kombinierte Liste ist ein Unter-Eintrag davon und führt mehrere vorhandene To-do-Listen
(Einkaufsliste, Local To-do, Google Tasks, Bring!, …) zu einer gemeinsamen To-do-Entität
zusammen. Abhaken, Umbenennen und Löschen wirken je nach Modus direkt in der Ursprungsliste;
neue Artikel landen in der eingestellten Standard-Liste.

Haushaltsweit (unabhängig von einzelnen Listen): gemerkte Kategorien, Verlauf für Vorschläge,
Tag-Regeln (@REWE …) – siehe learning.py – und die Lovelace-Karte unter /smartlists/.
"""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from types import MappingProxyType

from homeassistant.components import frontend, panel_custom
from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry, ConfigSubentry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import config_validation as cv, entity_registry as er
from homeassistant.helpers.typing import ConfigType
from homeassistant.loader import async_get_integration

from . import automation, websocket
from .const import DOMAIN, LEGACY_UNIQUE_ID, STORAGE_VERSION, SUBENTRY_COMBINED
from .app_backups import async_get_app_backups
from .devices import async_get_devices
from .packs import async_get_packs
from .notes import async_get_notes
from .extras import async_get_extras
from .shares import async_get_shares, async_register_views
from .public import async_get_public, async_setup_public
from .notify import async_get_notifier
from .itemlog import async_get_itemlog
from . import repairs
from .learning import async_get_learning

_LOGGER = logging.getLogger(__name__)
PLATFORMS: list[Platform] = [Platform.TODO, Platform.SENSOR, Platform.CALENDAR]
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)
# eigener Pfad, damit er sich nicht mit der Seitenleisten-Seite /smartlists überschneidet
CARD_URL = "/smartlists-files/smartlists-card.js"
PANEL_URL_PATH = DOMAIN


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Einmal pro HA-Start: Gedächtnis laden, WebSocket-Befehle und Karte bereitstellen."""
    await async_get_packs(hass)
    await async_get_learning(hass)
    await async_get_devices(hass)
    await async_get_app_backups(hass)
    await async_get_notes(hass)
    await async_get_extras(hass)
    await async_get_shares(hass)
    async_register_views(hass)  # geteilte Links (ohne Anmeldung, nur mit 256-Bit-Schlüssel)
    # Teilen ohne die HA-Adresse zu verraten: eigener kleiner Server + Quick Tunnel / eigener Proxy
    await async_get_public(hass)
    async_setup_public(hass)

    @callback
    def _entity_removed(event) -> None:
        # Liste gelöscht → ihre Links ungültig (eine neue Liste gleichen Namens erbt sie nicht)
        if event.data.get("action") == "remove" and str(event.data.get("entity_id", "")).startswith("todo."):
            hass.data[DOMAIN]["shares"].drop_entity(event.data["entity_id"])

    hass.bus.async_listen(er.EVENT_ENTITY_REGISTRY_UPDATED, _entity_removed)
    (await async_get_notifier(hass)).start()
    (await async_get_itemlog(hass)).start()
    websocket.async_register(hass)
    automation.async_setup_services(hass)
    automation.async_setup_intents(hass)
    await _async_register_card(hass)
    return True


async def _async_register_card(hass: HomeAssistant) -> None:
    """Karte automatisch laden – keine manuelle Dashboard-Ressource nötig.
    Die Version im URL-Parameter sorgt nach Updates für frisches Laden statt Browser-Cache."""
    path = Path(__file__).parent / "www" / "smartlists-card.js"
    from .pwa import BRAND_URL, ManifestView

    try:
        await hass.http.async_register_static_paths([StaticPathConfig(CARD_URL, str(path), True),
                                                     # Symbole für „Als App auf dem Startbildschirm“ (pwa.py)
                                                     StaticPathConfig(BRAND_URL, str(Path(__file__).parent / "brand"), True)])
    except RuntimeError:
        return  # bereits registriert (z.B. Neuladen der Integration)
    hass.http.register_view(ManifestView())
    version = (await async_get_integration(hass, DOMAIN)).version
    hass.data[DOMAIN]["card_url"] = f"{CARD_URL}?v={version}"
    add_extra_js_url(hass, hass.data[DOMAIN]["card_url"])


async def _async_register_panel(hass: HomeAssistant) -> None:
    """Eigene Seite „SmartLists“ in der Seitenleiste: alle Listen mit der Karte, ohne Dashboard.
    Die eingebaute To-do-Seite von HA zeigt nur Text – hier gibt es Badges, Kategorien, Stepper."""
    try:
        await panel_custom.async_register_panel(
            hass,
            frontend_url_path=PANEL_URL_PATH,
            webcomponent_name="smartlists-panel",
            sidebar_title="SmartLists",
            sidebar_icon="mdi:cart-variant",
            module_url=hass.data[DOMAIN].get("card_url", CARD_URL),
            require_admin=False,
        )
    except ValueError:
        pass  # schon registriert (Neuladen)


async def async_migrate_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """1.1 → 1.2: Bis 1.1 war jede kombinierte Liste ein eigener Helfer-Eintrag. Jetzt gibt es einen
    Eintrag „SmartLists“ mit den Listen als Unter-Einträgen. Die alte unique_id wird mitgenommen,
    damit entity_id, Dashboards, Automationen und lokale Häkchen gleich bleiben."""
    if entry.version > 2:
        return False  # neuere Version als dieser Code
    if entry.version == 2:
        return True
    sub = ConfigSubentry(
        data=MappingProxyType({**entry.data, **entry.options, LEGACY_UNIQUE_ID: entry.entry_id}),
        subentry_type=SUBENTRY_COMBINED,
        title=entry.title,
        unique_id=None,
    )
    main = next(
        (e for e in hass.config_entries.async_entries(DOMAIN) if e.version >= 2 and e.entry_id != entry.entry_id),
        None,
    )
    if main is None:
        # erster alter Eintrag wird zum Haupteintrag
        hass.config_entries.async_update_entry(entry, version=2, title="SmartLists", data={}, options={})
        hass.config_entries.async_add_subentry(entry, sub)
        _LOGGER.info("SmartLists: Liste '%s' in die neue Struktur übernommen", sub.title)
        return True
    # weitere alte Einträge: als Unter-Eintrag beim Haupteintrag, alten Eintrag entfernen
    hass.config_entries.async_add_subentry(main, sub)
    _LOGGER.info("SmartLists: Liste '%s' zum Eintrag SmartLists verschoben", sub.title)
    hass.async_create_task(hass.config_entries.async_remove(entry.entry_id))
    return False


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Integration einrichten: je kombinierter Liste (Unter-Eintrag) eine To-do-Entität."""
    await _async_register_panel(hass)
    # bis 3.6 war jede eigene Liste ein Unter-Eintrag → einmalig in Gruppen je Besitzer umziehen
    from .own_groups import async_migrate_legacy

    await async_migrate_legacy(hass, entry)
    # fällige Artikel stündlich auf die eingestellte Liste (Konfigurieren → Sprache & Automationen)
    entry.async_on_unload(automation.async_setup_due_timer(hass))
    # Hinweise unter Einstellungen → Reparaturen (fehlende Quell-Listen, lange nicht gesehene Geräte)
    entry.async_on_unload(repairs.async_setup_checks(hass, entry))
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))
    return True


_RELOAD_PENDING = f"{DOMAIN}_reload_pending"


async def _async_update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Liste hinzugefügt/geändert/entfernt → neu laden.
    Mehrere Änderungen kurz hintereinander (z. B. mehrere Listen übernommen) ergeben genau EIN Neuladen:
    sonst liefen mehrere Neuladevorgänge ineinander und nur die erste neue Liste bekam ihre Entität."""
    pending: set[str] = hass.data.setdefault(_RELOAD_PENDING, set())
    if entry.entry_id in pending:
        return
    pending.add(entry.entry_id)
    try:
        await asyncio.sleep(0.5)
    finally:
        pending.discard(entry.entry_id)
    await hass.config_entries.async_reload(entry.entry_id)


async def async_remove_config_entry_device(hass: HomeAssistant, entry: ConfigEntry, device_entry) -> bool:
    """Gerät über die HA-Oberfläche löschen (⋮ → Löschen) – nur verbundene Geräte, nicht die Listen."""
    for domain, ident in device_entry.identifiers:
        if domain == DOMAIN and ident.startswith("app_"):
            hass.data[DOMAIN]["devices"].remove(ident.removeprefix("app_"))
            return True
    return False


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Integration entladen."""
    frontend.async_remove_panel(hass, PANEL_URL_PATH)
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Integration gelöscht: lokale Häkchen aller kombinierten Listen mit entfernen.
    Das Gedächtnis (gemerkte Kategorien, Verlauf) bleibt erhalten, falls man neu einrichtet."""
    from homeassistant.helpers.storage import Store

    from .todo import list_key

    for subentry in entry.subentries.values():
        await Store(hass, STORAGE_VERSION, f"{DOMAIN}.{list_key(subentry)}").async_remove()
