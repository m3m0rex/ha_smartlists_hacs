"""Reparatur-Hinweis: Listen der App (todo.ha_smartlists_*), die noch nicht übernommen sind."""

import sys
import types


def _module():
    sys.modules.setdefault("homeassistant.helpers.entity_registry", types.ModuleType("homeassistant.helpers.entity_registry"))
    import smartlists.migrate as migrate

    return migrate


def _cand(eid, name, platform="local_todo", notes=False):
    return {"entity_id": eid, "name": name, "open": 2, "platform": platform, "used_in": [], "notes": notes}


class _Learning:
    def __init__(self):
        self.automation = {}

    def _changed(self, **_kw):
        pass


def test_unmigrated_filters_and_remembers():
    migrate = _module()
    cands = [
        _cand("todo.ha_smartlists_list_angebote", "HA Smartlists Angebote"),
        _cand("todo.ha_smartlists_list_barcodes", "ha_smartlists_list_barcodes"),
        _cand("todo.ha_smartlists_note_julia", "HA Smartlists Notes Julia", notes=True),  # Notizen bleiben
        _cand("todo.ha_smartlists_list_x", "X", platform="smartlists"),                  # gehört SmartLists
        _cand("todo.einkaufsliste", "Einkaufsliste", platform="shopping_list"),          # keine App-Liste
        _cand("todo.ha_smartlists_list_drogerie", "HA Smartlists Drogerie"),
    ]
    old_candidates, old_groups = migrate.candidates, sys.modules.get("smartlists.own_groups")
    migrate.candidates = lambda hass, user=None: cands
    # schon vor 3.9.2 übernommen: eigene Liste gleichen Namens („Drogerie“)
    groups = types.ModuleType("smartlists.own_groups")
    groups.iter_lists = lambda entry: iter([(None, "l1", {"title": "Drogerie"})])
    sys.modules["smartlists.own_groups"] = groups
    try:
        learning = _Learning()
        hass = types.SimpleNamespace(data={"smartlists": {"learning": learning}},
                                     config_entries=types.SimpleNamespace(async_entries=lambda domain: ["entry"]))
        assert [c["entity_id"] for c in migrate.unmigrated(hass)] == [
            "todo.ha_smartlists_list_angebote", "todo.ha_smartlists_list_barcodes"]
        migrate.mark_migrated(hass, ["todo.ha_smartlists_list_angebote"])
        assert learning.automation["migrated_lists"] == ["todo.ha_smartlists_list_angebote"]
        assert [c["entity_id"] for c in migrate.unmigrated(hass)] == ["todo.ha_smartlists_list_barcodes"]
    finally:
        migrate.candidates = old_candidates
        if old_groups is not None:
            sys.modules["smartlists.own_groups"] = old_groups
        else:
            sys.modules.pop("smartlists.own_groups", None)
