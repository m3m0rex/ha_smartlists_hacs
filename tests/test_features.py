"""Extras: Notizen und Wochenplan ein-/ausschalten (im Assistenten standardmäßig aus)."""

import types

from smartlists.features import get_features, set_features
from smartlists.notes import Notes


class _Learning:
    def __init__(self, automation=None):
        self.automation = automation or {}
        self.changed = 0

    def _changed(self, **_kw):
        self.changed += 1


def _hass(automation=None):
    hass = types.SimpleNamespace(data={}, states=None)
    hass.data["smartlists"] = {"learning": _Learning(automation), "notes": Notes(hass)}
    return hass


def test_defaults_existing_installs_unchanged():
    # Notizen waren schon immer standardmäßig ausgeblendet, der Wochenplan war immer da
    assert get_features(_hass()) == {"notes": False, "mealplan": True}


def test_set_features():
    hass = _hass()
    assert set_features(hass, notes=True, mealplan=False) == {"notes": True, "mealplan": False}
    assert hass.data["smartlists"]["notes"].mode == "section"
    assert hass.data["smartlists"]["learning"].automation["features"] == {"mealplan": False}
    # nur eins ändern lässt das andere stehen
    assert set_features(hass, notes=False) == {"notes": False, "mealplan": False}
    assert set_features(hass, mealplan=True) == {"notes": False, "mealplan": True}
