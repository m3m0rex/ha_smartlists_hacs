"""Hinweise unter Einstellungen → Reparaturen, statt still zu scheitern.

- missing_source: eine kombinierte Liste verweist auf eine To-do-Liste, die es nicht mehr gibt
- stale_device: ein Gerät mit der App hat sich seit 30 Tagen nicht gemeldet
- unmigrated_list: eine Liste der App (todo.ha_smartlists_*) ist noch nicht in SmartLists übernommen –
  mit „Beheben“: Besitzer wählen, übernehmen (wie Einstellungen → Vorhandene Listen übernehmen; die alte
  Liste bleibt unverändert)
Verwaiste Teilen-Links (Liste gelöscht) werden ohne Rückfrage entfernt.
Geprüft wird kurz nach dem Start und dann stündlich.
"""

from __future__ import annotations

from datetime import timedelta
import time
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.event import async_call_later, async_track_time_interval

from .const import DOMAIN, SUBENTRY_COMBINED

STALE_DAYS = 30


@callback
def async_check(hass: HomeAssistant, entry: ConfigEntry) -> None:
    wanted: set[str] = set()
    for sub in entry.subentries.values():
        if sub.subentry_type != SUBENTRY_COMBINED:
            continue
        missing = [s for s in sub.data.get("sources") or [] if hass.states.get(s) is None]
        if missing:
            issue_id = f"missing_source_{sub.subentry_id}"
            wanted.add(issue_id)
            ir.async_create_issue(hass, DOMAIN, issue_id, is_fixable=False, severity=ir.IssueSeverity.WARNING,
                                  translation_key="missing_source",
                                  translation_placeholders={"list": sub.title, "sources": ", ".join(missing)})
    devices = hass.data.get(DOMAIN, {}).get("devices")
    if devices is not None:
        now = time.time()
        for device_id, d in devices.devices.items():
            days = (now - float(d.get("last_seen", 0))) / 86400
            if days >= STALE_DAYS:
                issue_id = f"stale_device_{device_id[:16]}"
                wanted.add(issue_id)
                ir.async_create_issue(hass, DOMAIN, issue_id, is_fixable=False, severity=ir.IssueSeverity.WARNING,
                                      translation_key="stale_device",
                                      translation_placeholders={"device": d.get("name") or "?", "days": str(int(days))})
    shares = hass.data.get(DOMAIN, {}).get("shares")
    if shares is not None:
        for link in list(shares.links.values()):
            if hass.states.get(link["entity_id"]) is None and hass.is_running:
                shares.drop_entity(link["entity_id"])
    # Listen der App, die noch nicht übernommen sind (erst, wenn HA läuft – vorher fehlen Listen noch)
    if hass.is_running:
        from .migrate import unmigrated

        for c in unmigrated(hass):
            issue_id = f"unmigrated_{c['entity_id'].split('.', 1)[-1]}"[:200]
            wanted.add(issue_id)
            ir.async_create_issue(hass, DOMAIN, issue_id, is_fixable=True, severity=ir.IssueSeverity.WARNING,
                                  translation_key="unmigrated_list", data={"entity_id": c["entity_id"]},
                                  translation_placeholders={"list": str(c["name"]), "entity_id": c["entity_id"],
                                                            "count": str(c["open"])})
    else:
        wanted.update(i for (d, i) in ir.async_get(hass).issues if d == DOMAIN and i.startswith("unmigrated_"))
    # nicht mehr zutreffende Hinweise entfernen
    registry = ir.async_get(hass)
    for (domain, issue_id) in list(registry.issues):
        if domain == DOMAIN and issue_id.startswith(("missing_source_", "stale_device_", "unmigrated_")) and issue_id not in wanted:
            ir.async_delete_issue(hass, DOMAIN, issue_id)


@callback
def async_setup_checks(hass: HomeAssistant, entry: ConfigEntry) -> Any:
    # @callback: läuft in der Ereignisschleife (eine einfache lambda würde HA in einem Thread ausführen)
    @callback
    def _run(_now: Any) -> None:
        async_check(hass, entry)

    cancel_first = async_call_later(hass, 90, _run)
    cancel_hourly = async_track_time_interval(hass, _run, timedelta(hours=1))

    def _cancel() -> None:
        cancel_first()
        cancel_hourly()

    return _cancel


# ---------------------------------------------------------------------- „Beheben“: Liste der App übernehmen
async def async_create_fix_flow(hass: HomeAssistant, issue_id: str, data: dict[str, Any] | None):
    """Von Home Assistant aufgerufen, wenn man bei einem Hinweis auf „Beheben“ tippt."""
    from homeassistant.components.repairs import RepairsFlow
    import voluptuous as vol
    from homeassistant.helpers import selector

    class MigrateListFlow(RepairsFlow):
        """Ein Schritt: Besitzer wählen → als eigene SmartLists-Liste übernehmen (Artikel, Notizen, Häkchen)."""

        def __init__(self, entity_id: str) -> None:
            self._entity_id = entity_id

        async def async_step_init(self, user_input: dict[str, Any] | None = None):
            return await self.async_step_confirm()

        async def async_step_confirm(self, user_input: dict[str, Any] | None = None):
            from .migrate import async_migrate, nice_title

            state = self.hass.states.get(self._entity_id)
            if state is None:
                ir.async_delete_issue(self.hass, DOMAIN, issue_id)
                return self.async_abort(reason="list_gone")
            users = [u for u in await self.hass.auth.async_get_users() if u.is_active and not u.system_generated]
            if user_input is not None:
                owner = next((u for u in users if u.id == user_input.get("owner")), None)
                if owner is None:
                    return self.async_abort(reason="no_owner")
                try:
                    await async_migrate(self.hass, owner.id, [self._entity_id], "each", user=owner)
                except ValueError as err:
                    return self.async_abort(reason="failed", description_placeholders={"error": str(err)})
                ir.async_delete_issue(self.hass, DOMAIN, issue_id)
                return self.async_create_entry(data={})
            # Vorschlag: wer die App gekoppelt hat (die Liste kommt von dort), sonst der erste Admin
            devices = self.hass.data.get(DOMAIN, {}).get("devices")
            paired = [d.get("user_id") for d in (devices.devices.values() if devices else [])]
            default = next((u.id for uid in paired for u in users if u.id == uid), None) \
                or next((u.id for u in users if u.is_admin), users[0].id if users else "")
            options = [selector.SelectOptionDict(value=u.id, label=u.name or u.id) for u in users]
            name = state.attributes.get("friendly_name", self._entity_id)
            return self.async_show_form(
                step_id="confirm",
                data_schema=vol.Schema({vol.Required("owner", default=default): selector.SelectSelector(
                    selector.SelectSelectorConfig(options=options, mode=selector.SelectSelectorMode.DROPDOWN))}),
                description_placeholders={"list": str(name), "entity_id": self._entity_id,
                                          "title": nice_title(str(name), self._entity_id)})

    return MigrateListFlow(str((data or {}).get("entity_id") or ""))
