import asyncio
import datetime as dt
import types

from smartlists.extras import Extras
from smartlists.learning import RIGHTS_DEFAULT, clamp_link


def test_clamp_link_limits_non_admins():
    rights = {**RIGHTS_DEFAULT, "share_max": "soft", "share_max_hours": 24}
    assert clamp_link(rights, "on", True, None) == ("soft", False, 24)  # höchstens soft, kein Hinzufügen, max 1 Tag
    assert clamp_link(rights, "off", False, 2) == ("off", False, 2)
    assert clamp_link(RIGHTS_DEFAULT, "on", True, None) == ("on", True, None)  # Standard: keine Grenzen


def test_rights_validation():
    from smartlists.learning import Learning
    from smartlists.categories import build_index, load_builtin_packs

    class _Hass:
        data = {}

    learning = Learning(_Hass(), build_index([load_builtin_packs()["de"]], "de"))
    asyncio.run(learning.async_load())
    learning.automation["rights"] = {"share_who": "everyone", "share_max": "soft", "templates": "ja", "prices": False}
    r = learning.rights()
    assert r["share_who"] == "owners"  # ungültig → Standard
    assert r["share_max"] == "soft" and r["templates"] is True and r["prices"] is False
    learning.set_automation({"voice_default_list": "todo.x"})  # darf Rechte nicht löschen
    assert learning.rights()["prices"] is False


def test_mealplan():
    e = Extras(types.SimpleNamespace(data={}))
    asyncio.run(e.async_load())
    tid = e.save_template(None, "Pfannkuchen", ["Mehl 250 g"], "🥞", 4)
    today = dt.date.today().isoformat()
    assert e.set_meals(today, [tid, "gibtsnicht", tid]) == [tid]
    assert e.meal_names(today) == ["🥞 Pfannkuchen"]
    week = e.plan(today, 7)
    assert len(week) == 7 and week[0]["templates"][0]["name"] == "Pfannkuchen" and not week[1]["templates"]
    e.set_meals(today, [])
    assert today not in e.mealplan
    try:
        e.set_meals("kein-datum", [tid])
        raise AssertionError("ValueError erwartet")
    except ValueError:
        pass


def test_mealie_ingredient_text():
    from smartlists.extras import ingredient_text

    assert ingredient_text({"display": "250 g  Mehl"}) == "250 g Mehl"
    assert ingredient_text({"food": {"name": "Eier"}, "quantity": 3, "unit": None}) == "Eier 3"
    assert ingredient_text({"food": {"name": "Milch"}, "quantity": 0.5, "unit": {"abbreviation": "l"}}) == "Milch 0.5 l"
    assert ingredient_text({"note": ""}) == ""


def test_notify_settings_own_changes():
    from smartlists.notify import validate

    assert validate({})["own"] is False
    s = validate({"service": "notify.mobile_app_pixel", "own": True, "quiet": [22, 7]})
    assert s["targets"] == [{"kind": "service", "id": "notify.mobile_app_pixel"}] and s["own"] is True and s["quiet"] == [22, 7]


def test_notify_targets():
    from smartlists.notify import validate_targets

    t = validate_targets([
        {"kind": "service", "id": "notify.telegram_family"},
        {"kind": "entity", "id": "notify.living_room_speaker", "label": "Wohnzimmer"},
        {"kind": "custom", "id": "telegram_bot.send_message", "data": {"target": 123, "message": "🛒 {message}"}},
        {"kind": "service", "id": "notify.telegram_family"},          # doppelt
        {"kind": "service", "id": "light.turn_on"},                   # kein notify-Dienst
        {"kind": "entity", "id": "notify.x; rm"},                     # ungültig
        {"kind": "custom", "id": "script.big", "data": {"x": "y" * 3000}},  # zu groß
        {"kind": "bogus", "id": "notify.a"},
    ], legacy_service="mobile_app_pixel")
    assert [x["id"] for x in t] == ["notify.telegram_family", "notify.living_room_speaker", "telegram_bot.send_message", "notify.mobile_app_pixel"]
    assert t[1]["label"] == "Wohnzimmer" and t[2]["data"]["target"] == 123
    assert len(validate_targets([{"kind": "service", "id": f"notify.s{i}"} for i in range(30)])) == 10


def test_notify_batch_runs_in_event_loop():
    # async_call_later führt einfache Funktionen in einem Thread aus – der verzögerte Versand muss eine Koroutine sein
    import inspect

    from smartlists.notify import Notifier

    assert inspect.iscoroutinefunction(Notifier._send_later)


def test_notify_deliver_kinds():
    import asyncio
    import types

    from smartlists.notify import Notifier

    calls = []

    async def async_call(domain, service, data, blocking=False):
        if service == "broken":
            raise RuntimeError("nope")
        calls.append((domain, service, data))

    hass = types.SimpleNamespace(data={}, services=types.SimpleNamespace(async_call=async_call))
    n = Notifier.__new__(Notifier)
    n.hass = hass
    s = {"targets": [
        {"kind": "service", "id": "notify.mobile_app_pixel"},
        {"kind": "entity", "id": "notify.speaker"},
        {"kind": "custom", "id": "telegram_bot.send_message", "data": {"target": 1, "message": "🛒 {title}: {message}"}},
        {"kind": "custom", "id": "script.notify_me", "data": {"prio": 2}},
        {"kind": "service", "id": "notify.broken"},
    ]}
    errors = asyncio.run(n._deliver_all(s, "Einkauf", "Anna hat Milch auf Einkauf gesetzt", "smartlists-todo.e"))
    assert len(errors) == 1 and "notify.broken" in errors[0]
    assert calls[0][2]["data"]["clickAction"] == "/smartlists"
    assert calls[1] == ("notify", "send_message", {"entity_id": "notify.speaker", "title": "Einkauf", "message": "Anna hat Milch auf Einkauf gesetzt"})
    assert calls[2] == ("telegram_bot", "send_message", {"target": 1, "message": "🛒 Einkauf: Anna hat Milch auf Einkauf gesetzt"})
    assert calls[3] == ("script", "notify_me", {"title": "Einkauf", "message": "Anna hat Milch auf Einkauf gesetzt", "prio": 2})


def test_clamp_link_soft_add_level():
    """Stufen: nur ansehen < soft < soft + hinzufügen < abhaken + hinzufügen."""
    rights = {**RIGHTS_DEFAULT, "share_max": "soft_add"}
    assert clamp_link(rights, "on", True, None)[:2] == ("soft", True)
    assert clamp_link(rights, "soft", True, None)[:2] == ("soft", True)
    assert clamp_link(rights, "soft", False, None)[:2] == ("soft", False)
    assert clamp_link({**RIGHTS_DEFAULT, "share_max": "soft"}, "soft", True, None)[:2] == ("soft", False)
