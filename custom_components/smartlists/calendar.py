"""Kalender „Essensplan“: die im Wochenplan eingetragenen Gerichte (Vorlagen) als ganztägige Termine."""

from __future__ import annotations

from datetime import date, datetime, timedelta

from homeassistant.components.calendar import CalendarEntity, CalendarEvent
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN, SIGNAL_DATA_CHANGED


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    from .features import get_features

    entity = MealPlanCalendar(hass)
    # Wochenplan unter Extras ausgeschaltet → neu angelegt wird der Kalender gleich deaktiviert
    entity._attr_entity_registry_enabled_default = get_features(hass)["mealplan"]
    async_add_entities([entity])


class MealPlanCalendar(CalendarEntity):
    _attr_has_entity_name = True
    _attr_translation_key = "meal_plan"
    _attr_unique_id = "smartlists_meal_plan"
    _attr_icon = "mdi:silverware-fork-knife"

    def __init__(self, hass: HomeAssistant) -> None:
        self._extras = hass.data[DOMAIN]["extras"]
        self._attr_device_info = DeviceInfo(identifiers={(DOMAIN, "household")}, name="SmartLists", manufacturer="SmartLists")

    async def async_added_to_hass(self) -> None:
        @callback
        def _changed(*_args) -> None:
            self.async_write_ha_state()

        self.async_on_remove(async_dispatcher_connect(self.hass, SIGNAL_DATA_CHANGED, _changed))

    def _events(self, start: date, end: date) -> list[CalendarEvent]:
        out = []
        day = start
        while day <= end:
            names = self._extras.meal_names(day.isoformat())
            if names:
                out.append(CalendarEvent(start=day, end=day + timedelta(days=1), summary=", ".join(names)))
            day += timedelta(days=1)
        return out

    @property
    def event(self) -> CalendarEvent | None:
        today = date.today()
        events = self._events(today, today + timedelta(days=60))
        return events[0] if events else None

    async def async_get_events(self, hass: HomeAssistant, start_date: datetime, end_date: datetime) -> list[CalendarEvent]:
        return self._events(start_date.date(), end_date.date())
