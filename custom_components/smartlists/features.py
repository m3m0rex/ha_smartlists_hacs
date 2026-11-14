"""Optionale Bereiche („Extras“): Notizen und Wochenplan.

Beides ist für Einsteiger nicht nötig. Der Einrichtungs-Assistent lässt sie deshalb standardmäßig aus;
einschalten lassen sie sich jederzeit unter Einstellungen → Extras (nur Admins).

- notes:    Notizlisten als eigener Bereich 📝 in SmartLists. Das ist dieselbe Einstellung wie Notes.mode
            („section“ = an, „hidden“ = aus) – es gibt nur einen Schalter dafür.
- mealplan: Wochenplan (Tab auf der Seite, ⋯ → Wochenplan, Kalender „Essensplan“, Ansicht im Dashboard).
            Aus = der Kalender wird in HA deaktiviert (disabled_by: integration), die Daten bleiben erhalten.
            Bestehende Installationen ohne Angabe: an (wie bisher).
"""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant

from .const import DOMAIN

FEATURES = ("notes", "mealplan")
MEALPLAN_UNIQUE_ID = "smartlists_meal_plan"


def get_features(hass: HomeAssistant) -> dict[str, bool]:
    data = hass.data.get(DOMAIN, {})
    learning = data.get("learning")
    notes = data.get("notes")
    raw = (learning.automation.get("features") if learning else None) or {}
    return {
        "notes": bool(notes is not None and notes.mode == "section"),
        "mealplan": raw.get("mealplan") is not False,
    }


def set_features(hass: HomeAssistant, notes: bool | None = None, mealplan: bool | None = None) -> dict[str, bool]:
    data = hass.data[DOMAIN]
    if notes is not None and data.get("notes") is not None:
        data["notes"].update(mode="section" if notes else "hidden")
    if mealplan is not None:
        learning = data["learning"]
        learning.automation["features"] = {**(learning.automation.get("features") or {}), "mealplan": bool(mealplan)}
        learning._changed()
        apply_mealplan_calendar(hass, bool(mealplan))
    return get_features(hass)


def apply_mealplan_calendar(hass: HomeAssistant, on: bool) -> None:
    """Kalender „Essensplan“ passend zum Schalter (de)aktivieren. Von Hand deaktiviert bleibt deaktiviert."""
    try:
        from homeassistant.helpers import entity_registry as er

        reg = er.async_get(hass)
        entity_id = reg.async_get_entity_id("calendar", DOMAIN, MEALPLAN_UNIQUE_ID)
        if entity_id is None:
            return
        entry = reg.async_get(entity_id)
        if not on and entry.disabled_by is None:
            reg.async_update_entity(entity_id, disabled_by=er.RegistryEntryDisabler.INTEGRATION)
        elif on and entry.disabled_by == er.RegistryEntryDisabler.INTEGRATION:
            # HA lädt den Eintrag danach von selbst neu (ca. 30 s), dann ist der Kalender wieder da
            reg.async_update_entity(entity_id, disabled_by=None)
    except Exception:  # noqa: BLE001 – der Kalender ist Beiwerk, der Schalter soll trotzdem wirken
        pass

