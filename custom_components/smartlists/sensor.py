"""Je verbundenem Gerät (siehe devices.py) ein HA-Gerät mit Sensoren „Zuletzt gesehen“ und „App-Version“.

Damit lassen sich z.B. Automationen bauen: „Melde mir, wenn ein Gerät seit 7 Tagen nicht abgeglichen hat.“
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .devices import SIGNAL_DEVICES_CHANGED, Devices

MANUFACTURER_FALLBACK = "HA SmartLists App"


def device_identifier(device_id: str) -> tuple[str, str]:
    return (DOMAIN, f"app_{device_id}")


def app_device_info(hass: HomeAssistant, device_id: str) -> DeviceInfo | None:
    """Vollständige Geräte-Angaben des App-Geräts (nicht nur ein Verweis) – so hängt auch eine kombinierte
    Liste der App sicher an diesem Gerät, egal in welcher Reihenfolge die Plattformen starten."""
    d = (hass.data.get(DOMAIN, {}).get("devices").devices if hass.data.get(DOMAIN, {}).get("devices") else {}).get(device_id)
    if d is None:
        return None
    return DeviceInfo(
        identifiers={device_identifier(device_id)},
        name=d.get("name") or "Gerät",
        manufacturer=d.get("manufacturer") or MANUFACTURER_FALLBACK,
        model=d.get("model"),
        sw_version=d.get("app_version"),
    )


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    devices: Devices = hass.data[DOMAIN]["devices"]
    known: set[str] = set()

    @callback
    def _add(device_id: str) -> None:
        if device_id in known or device_id not in devices.devices:
            return
        known.add(device_id)
        async_add_entities([LastSeenSensor(devices, device_id), AppVersionSensor(devices, device_id)])

    # Ausgaben dieses Monats (gebucht beim Abhaken von Artikeln mit Preis) – für Dashboards
    from .features import get_features

    expenses = ExpensesMonthSensor(hass)
    # Statistik und Ausgaben unter Extras ausgeschaltet → neu angelegt wird der Sensor gleich deaktiviert
    expenses._attr_entity_registry_enabled_default = get_features(hass)["stats"]
    async_add_entities([expenses])

    for device_id in list(devices.devices):
        _add(device_id)

    @callback
    def _changed(device_id: str, is_new: bool) -> None:
        if device_id in devices.devices:
            _add(device_id)  # neu → anlegen; bekannt → Sensoren aktualisieren sich selbst
            _update_device_info(hass, devices, device_id)
            return
        # aus der Liste genommen → HA-Gerät (samt Sensoren) entfernen
        known.discard(device_id)
        registry = dr.async_get(hass)
        if (device := registry.async_get_device(identifiers={device_identifier(device_id)})) is not None:
            registry.async_remove_device(device.id)

    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_DEVICES_CHANGED, _changed))


@callback
def _update_device_info(hass: HomeAssistant, devices: Devices, device_id: str) -> None:
    """Name/Modell/Version am HA-Gerät nachziehen (z.B. nach App-Update)."""
    registry = dr.async_get(hass)
    device = registry.async_get_device(identifiers={device_identifier(device_id)})
    if device is None:
        return
    d = devices.devices[device_id]
    registry.async_update_device(device.id, sw_version=d.get("app_version"), model=d.get("model"))


class ExpensesMonthSensor(SensorEntity):
    _attr_has_entity_name = True
    _attr_translation_key = "expenses_month"
    _attr_icon = "mdi:cash-multiple"
    _attr_native_unit_of_measurement = "€"
    _attr_state_class = "total"
    _attr_unique_id = "smartlists_expenses_month"
    _attr_should_poll = True  # alle 30 s – Buchungen passieren beim Abhaken

    def __init__(self, hass: HomeAssistant) -> None:
        self._extras = hass.data[DOMAIN]["extras"]
        self._attr_device_info = DeviceInfo(identifiers={(DOMAIN, "household")}, name="SmartLists", manufacturer="SmartLists")

    @property
    def native_value(self) -> float:
        return self._extras.month_total()

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        rows = self._extras.expense_report("month", 1)["rows"]
        return {"stores": rows[-1]["stores"] if rows else {}}


class _DeviceSensor(SensorEntity):
    _attr_has_entity_name = True
    _attr_should_poll = False
    _key = ""

    def __init__(self, devices: Devices, device_id: str) -> None:
        self._devices = devices
        self._device_id = device_id
        d = devices.devices[device_id]
        self._attr_unique_id = f"app_{device_id}_{self._key}"
        self._attr_translation_key = self._key
        self._attr_device_info = DeviceInfo(
            identifiers={device_identifier(device_id)},
            name=d.get("name") or "Gerät",
            manufacturer=d.get("manufacturer") or MANUFACTURER_FALLBACK,
            model=d.get("model"),
            sw_version=d.get("app_version"),
        )

    @property
    def _data(self) -> dict[str, Any]:
        return self._devices.devices.get(self._device_id, {})

    @property
    def available(self) -> bool:
        return self._device_id in self._devices.devices

    async def async_added_to_hass(self) -> None:
        @callback
        def _changed(device_id: str, _is_new: bool) -> None:
            if device_id == self._device_id and self.available:
                self.async_write_ha_state()

        self.async_on_remove(async_dispatcher_connect(self.hass, SIGNAL_DEVICES_CHANGED, _changed))


class LastSeenSensor(_DeviceSensor):
    _key = "last_seen"
    _attr_device_class = SensorDeviceClass.TIMESTAMP
    _attr_icon = "mdi:cellphone-check"

    @property
    def native_value(self) -> datetime | None:
        ts = self._data.get("last_seen")
        return datetime.fromtimestamp(ts, tz=timezone.utc) if ts else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        info = self._devices.describe(self._device_id) if self.available else {}
        first = info.get("first_seen")
        return {
            "user": info.get("user_name"),
            "android_version": info.get("os_version"),
            "first_seen": datetime.fromtimestamp(first, tz=timezone.utc).isoformat() if first else None,
            "stale": info.get("stale"),
        }


class AppVersionSensor(_DeviceSensor):
    _key = "app_version"
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_icon = "mdi:information-outline"

    @property
    def native_value(self) -> str | None:
        return self._data.get("app_version")
