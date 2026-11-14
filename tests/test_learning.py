import asyncio
import time

from smartlists.categories import build_index, load_builtin_packs
from smartlists.learning import Learning

DAY = 86400


class _Hass:
    data = {}


def _learning() -> Learning:
    learning = Learning(_Hass(), build_index([load_builtin_packs()["de"]], "de"))
    asyncio.run(learning.async_load())
    return learning


def _history(learning, name, ago_days):
    now = time.time()
    learning.history[name.lower()] = {"name": name, "count": len(ago_days), "last": int(now - ago_days[-1] * DAY),
                                      "times": [int(now - d * DAY) for d in ago_days]}


def test_category_order_manual_learned_pack():
    learning = _learning()
    assert learning.resolve("Süßkartoffel") == ("obst_gemuese", "pack")  # ß bleibt erhalten
    learning.set_category("Hafermilch", "getraenke")
    assert learning.resolve("Hafermilch") == ("getraenke", "manual")
    assert learning.resolve("Hafermilch Barista") == ("getraenke", "learned")
    assert learning.resolve("xyzzy") == ("sonstiges", "fallback")


def test_rhythm_and_due():
    learning = _learning()
    _history(learning, "Milch", [17, 13, 9, 5])
    _history(learning, "Brot", [16, 9, 2])
    _history(learning, "Senf", [30, 1])
    assert learning.rhythm("Milch")["every_days"] == 4.0
    assert [d["name"] for d in learning.due_items()] == ["Milch"]
    assert learning.due_items(["Milch 2 l @REWE"]) == []
    assert learning.rhythm("Senf") is None


def test_export_import_roundtrip():
    a = _learning()
    a.set_category("Hafermilch", "kuehlung")
    data = a.export()
    assert "users" not in data
    b = _learning()
    b.import_data(data)
    assert b.resolve("Hafermilch") == ("kuehlung", "manual")
    try:
        b.import_data({"nope": 1})
    except ValueError:
        pass
    else:
        raise AssertionError("invalid export accepted")


def test_appearance_and_store_overrides():
    from smartlists import itemtext
    from smartlists.learning import validate_appearance

    look = validate_appearance({
        "kinds": {"person": {"style": "outline", "color": "#AA00FF", "icon": "🙂"}, "bogus": {"style": "x"}, "tag": {"style": "nope"}},
        "values": {"store:REWE": {"color": "#112233", "label": "Rewe City"}, "tag:bio": {"color": "red"}, "tag:vegan": {"text": "#FFFFFF", "color": "#2E7D32"}, "x:y": {"color": "#000000"}},
    })
    assert look == {"kinds": {"person": {"style": "outline", "color": "#aa00ff", "icon": "🙂"}},
                    "values": {"store:rewe": {"color": "#112233", "label": "Rewe City"},
                               "tag:vegan": {"color": "#2e7d32", "text": "#ffffff"}}}
    learning = _learning()
    learning.set_appearance(look)
    assert itemtext.store_display("rewe") == ("Rewe City", "#112233")
    assert itemtext.store_display("lidl") == ("LIDL", "#FF6F00")  # unverändert
    assert any(s["value"] == "Rewe City" and s["color"] == "#112233" for s in learning.config()["known_stores"])
    learning.set_appearance({})
    assert itemtext.store_display("rewe")[0] == "REWE"


def test_store_zones_multiple_and_legacy():
    learning = _learning()
    learning.automation["store_zones"] = {"rewe": "zone.rewe_alt"}  # Format von 2.4.0
    assert learning.store_zones == {"rewe": ["zone.rewe_alt"]}
    learning.set_store_zone("@REWE", "zone.rewe_nord", add=True)
    assert learning.store_zones["rewe"] == ["zone.rewe_alt", "zone.rewe_nord"]
    learning.set_store_zone("rewe", zones=["zone.rewe_nord"])
    assert learning.store_zones["rewe"] == ["zone.rewe_nord"]
    learning.set_automation({"voice_default_list": "todo.x"})  # darf Zonen nicht löschen
    assert learning.store_zones["rewe"] == ["zone.rewe_nord"]
    learning.set_store_zone("rewe", None)
    assert "rewe" not in learning.store_zones


def test_reset_settings_and_data():
    learning = _learning()
    learning.set_category("Hafermilch", "getraenke")
    _history(learning, "Milch", [1, 8])
    learning.automation["setup_done"] = True
    learning.automation["voice"] = True
    learning.reset(settings=True, data=False)
    assert learning.resolve("Hafermilch")[1] == "manual" and "milch" in learning.history
    assert learning.config()["setup_needed"]  # nach dem Zurücksetzen erscheint der Assistent wieder
    assert set(learning.automation) == {"setup_pending"}
    learning.reset(settings=False, data=True)
    assert learning.resolve("Hafermilch")[1] != "manual" and not learning.history
    assert learning.config()["setup_needed"]  # alles leer → Assistent erscheint wieder von selbst


def test_history_per_list_and_scope():
    """Häufig gekauft / Vorschläge je Liste; kombinierte Liste = ihre Quell-Listen; alter Verlauf gilt überall."""
    from smartlists.learning import scoped_count

    learning = _learning()
    learning.history["senf"] = {"name": "Senf", "count": 3, "last": int(time.time())}  # von vor 3.9.4
    for _ in range(3):
        learning.record("Hundefutter", "todo.tier")
    for _ in range(2):
        learning.record("Milch", "todo.einkauf")
    learning.record("Senf", "todo.einkauf")
    assert learning.history["senf"]["lists"] == {"*": 3, "todo.einkauf": 1}
    assert scoped_count(learning.history["hundefutter"], {"todo.einkauf"}) == 0
    assert scoped_count(learning.history["hundefutter"], None) == 3
    assert scoped_count(learning.history["senf"], {"todo.tier"}) == 3  # alter Teil gilt überall

    names = lambda r: {s["name"] for s in r["suggestions"]}  # noqa: E731
    einkauf = learning.suggest("", [], 10, {"todo.einkauf"})
    assert "Milch" in names(einkauf) and "Hundefutter" not in names(einkauf)
    assert "Hundefutter" in names(learning.suggest("", [], 10, {"todo.tier"}))
    # kombinierte Liste aus beiden Quellen bzw. „aus allen Listen“
    assert {"Milch", "Hundefutter"} <= names(learning.suggest("", [], 10, {"todo.kombi", "todo.einkauf", "todo.tier"}))
    assert {"Milch", "Hundefutter"} <= names(learning.suggest("", [], 10, None))
    # beim Tippen genauso
    assert "Hundefutter" not in names(learning.suggest("Hun", [], 8, {"todo.einkauf"}))
    assert "Hundefutter" in names(learning.suggest("Hun", [], 8, {"todo.tier"}))


def test_plain_list_remembers_nothing():
    """Einfache Liste (z. B. Baumarkt): nichts gemerkt, nichts vorgeschlagen – Holz taucht nirgends sonst auf."""
    import types

    from smartlists.extras import Extras

    learning = _learning()
    extras = Extras(types.SimpleNamespace(data={}))
    extras.set_list_settings("todo.baumarkt", plain=True)
    learning.hass = types.SimpleNamespace(data={"smartlists": {"extras": extras}})
    learning.record("Holz 2 m", "todo.baumarkt")
    learning.record("Milch", "todo.einkauf")
    assert "holz" not in learning.history and "milch" in learning.history
    assert learning.suggest("Ho", [], 8, None)["suggestions"] == [] or all(
        s["source"] != "history" for s in learning.suggest("Ho", [], 8, None)["suggestions"])
    # in der einfachen Liste selbst: keine Vorschläge (leerer Bereich)
    assert learning.suggest("", [], 8, set())["suggestions"] == []
    assert learning.suggest("Mi", [], 8, set())["suggestions"] == []


def test_share_payload_looks_like_the_card():
    """Geteilte Liste: Name, Menge und Badges wie in der Karte, gruppiert nach Kategorie – aber weiter ohne Notizen."""
    import sys
    import types

    from smartlists import shares

    learning = _learning()
    items = [{"uid": "1", "text": "Meggle Baguette Kräuterbutter @REWE #bio *max", "note": "geheim", "checked": False},
             {"uid": "2", "text": "Milch 2 l", "note": "", "checked": True}]
    lists_mod = types.ModuleType("smartlists.lists")

    async def raw_items(hass, eid):
        return items

    lists_mod.raw_items = raw_items
    old = sys.modules.get("smartlists.lists")
    sys.modules["smartlists.lists"] = lists_mod
    try:
        state = types.SimpleNamespace(attributes={"friendly_name": "Test share"})
        hass = types.SimpleNamespace(data={"smartlists": {"learning": learning, "extras": None}},
                                     states=types.SimpleNamespace(get=lambda e: state), config=types.SimpleNamespace(language="de"))
        link = {"entity_id": "todo.test", "check": "off", "add": False, "expires": None, "soft": {}}
        view = object.__new__(shares.ShareApiView)
        d = asyncio.run(view._payload(hass, None, link, "de"))
    finally:
        if old is not None:
            sys.modules["smartlists.lists"] = old
    first = d["items"][0]
    assert first["name"] == "Meggle Baguette Kräuterbutter"
    assert {t["kind"] for t in first["tags"]} == {"store", "tag", "person"}
    assert d["items"][1]["qty"] == "2" and d["items"][1]["unit"] == "l"
    assert d["categories"] and first["cat"]
    assert "geheim" not in str(d)  # Notizen bleiben privat


def test_bought_means_checked_off():
    """„Am häufigsten gekauft“ zählt Abhaken, nicht Hinzufügen; Fehltipp (gleich wieder offen) zählt nicht."""
    import types

    from smartlists.extras import Extras, stats

    learning = _learning()
    learning.record("Kaviar", "todo.a")  # nur hinzugefügt, nie gekauft
    learning.record("Kaviar", "todo.a")
    learning.record("Milch", "todo.a")
    learning.record_bought("Milch 2 l", "todo.a")
    learning.record_bought("Brot", "todo.a")
    learning.unrecord_bought("Brot")  # gleich wieder geöffnet
    extras = Extras(types.SimpleNamespace(data={}))
    top = {r["name"]: r["count"] for r in stats(learning, extras, 90)["top"]}
    assert top == {"Milch": 1}


def test_bought_backfill_from_item_log():
    learning = _learning()
    now = int(time.time())
    log = {"todo.a": [{"t": now - 20 * DAY, "a": "check", "text": "Butter"}, {"t": now - 5 * DAY, "a": "check", "text": "Butter"},
                      {"t": now - 3 * DAY, "a": "add", "text": "Kaviar"}]}
    assert learning.backfill_bought(log) == 2
    assert len(learning.history["butter"]["bought"]) == 2 and "kaviar" not in learning.history
    assert learning.backfill_bought(log) == 0  # nur einmal


def test_share_names_are_cleaned_and_old_marks_still_work():
    from smartlists.shares import _mark, clean_name

    assert clean_name("  Max\n\t ") == "Max"
    assert clean_name("A" * 80) == "A" * 30
    assert clean_name("<b>Max</b>\x00") == "<b>Max</b>"  # nur Text; die Karte zeigt ihn als Text, nicht als HTML
    assert _mark(1700000000) == (1700000000, "")  # alte Markierung (nur Zeitpunkt)
    assert _mark({"t": 5, "by": "Max"}) == (5, "Max")


def test_widget_text_for_template_widget():
    """Template-Widget: gruppiert nach Kategorie, Badges farbig, Menge dahinter, abgehakte nicht, HTML maskiert."""
    import types

    from smartlists.widget import build_widget

    learning = _learning()
    hass = types.SimpleNamespace(data={"smartlists": {"learning": learning, "extras": None}}, config=types.SimpleNamespace(language="de"))
    html = build_widget(hass, "todo.x", "Wocheneinkauf", [("Milch 2 l @REWE *Anna #bio", False), ("Äpfel 1 kg", False),
                                                          ("Brot", True), ("<script>", False)])
    assert html.startswith("<b><big>Wocheneinkauf</big></b>") and "· 3" in html
    assert "REWE" in html and "👤 Anna" in html and "#bio" in html and "2 l" in html
    assert "Brot" not in html  # abgehakt
    assert "<script>" not in html and "&lt;script&gt;" in html
    assert html.index("Äpfel") < html.index("Milch")  # Obst & Gemüse vor Kühlung


def test_share_payload_includes_offer_but_not_note():
    import sys
    import types

    from smartlists import shares

    learning = _learning()
    note = 'Bitte die große Flasche\n⚙OFFER:{"s":"rewe","p":"4,29","e":"2099-11-14"}'
    items = [{"uid": "1", "text": "Römerwall Mineralwasser", "note": note, "checked": False}]
    lists_mod = types.ModuleType("smartlists.lists")

    async def raw_items(hass, eid):
        return items

    lists_mod.raw_items = raw_items
    old = sys.modules.get("smartlists.lists")
    sys.modules["smartlists.lists"] = lists_mod
    try:
        state = types.SimpleNamespace(attributes={"friendly_name": "Test"})
        hass = types.SimpleNamespace(data={"smartlists": {"learning": learning, "extras": None}},
                                     states=types.SimpleNamespace(get=lambda e: state), config=types.SimpleNamespace(language="de"))
        link = {"entity_id": "todo.test", "check": "off", "add": False, "expires": None, "soft": {}}
        d = asyncio.run(object.__new__(shares.ShareApiView)._payload(hass, None, link, "de"))
    finally:
        if old is not None:
            sys.modules["smartlists.lists"] = old
    offer = d["items"][0]["offer"]
    assert offer["price"] == 4.29 and offer["valid_until"] == "2099-11-14" and offer["store_label"]
    assert "große Flasche" not in str(d)
