"""Alltag: „Bin im Laden“, Abfrage nach Markt/Person, Sprachassistent (Assist), fällige Artikel.

- Ereignis `smartlists_shopping` (active, entity_id, list_name, store, user_id, user_name, open_items):
  ausgelöst, wenn jemand in Karte oder App den Einkaufsmodus startet/beendet. Passender Blueprint:
  blueprints/automation/smartlists/shopping_notify.yaml
- Dienst `smartlists.get_items` (mit Antwort): offene Artikel einer/aller Listen, gefiltert nach Markt,
  Person, Schlagwort oder Kategorie – für Automationen, z.B. Standort-Erinnerung
  (blueprints/automation/smartlists/store_reminder.yaml).
- Intents `SmartListsAddItem` / `SmartListsListItems` für Assist; die Sätze installiert man über
  Konfigurieren → Sprache & Automationen (custom_sentences/<sprache>/smartlists.yaml).
- Fällige Artikel (Rhythmus aus dem Verlauf) optional stündlich auf eine Liste setzen.
"""

from __future__ import annotations

from datetime import timedelta
import logging
from pathlib import Path
import shutil
from typing import Any

import voluptuous as vol

from homeassistant.components.todo import DOMAIN as TODO_DOMAIN
from homeassistant.const import ATTR_FRIENDLY_NAME
from homeassistant.core import Context, HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse, callback
from homeassistant.helpers import config_validation as cv, intent
from homeassistant.helpers.event import async_track_time_interval

from . import lists
from .const import DOMAIN
from .itemtext import normalize_list_name

_LOGGER = logging.getLogger(__name__)
EVENT_SHOPPING = f"{DOMAIN}_shopping"
SERVICE_GET_ITEMS = "get_items"
INTENT_ADD = "SmartListsAddItem"
INTENT_LIST = "SmartListsListItems"
SENTENCES_DIR = Path(__file__).parent / "sentences"
DUE_CHECK_INTERVAL = timedelta(hours=1)


def _learning(hass: HomeAssistant):
    return hass.data[DOMAIN]["learning"]


# ----------------------------------------------------------------------
# „Bin im Laden“
# ----------------------------------------------------------------------
@callback
def fire_shopping(hass: HomeAssistant, entity_id: str, active: bool, store: str | None, user_id: str | None,
                  user_name: str | None, open_items: int | None, context: Context | None = None) -> None:
    state = hass.states.get(entity_id)
    hass.bus.async_fire(
        EVENT_SHOPPING,
        {
            "active": active,
            "entity_id": entity_id,
            "list_name": state.attributes.get(ATTR_FRIENDLY_NAME, entity_id) if state else entity_id,
            "store": store or None,
            "user_id": user_id,
            "user_name": user_name or "",
            "open_items": open_items if open_items is not None else (int(state.state) if state and state.state.isdigit() else None),
        },
        context=context,
    )


# ----------------------------------------------------------------------
# Abfrage für Automationen
# ----------------------------------------------------------------------
async def query_items(hass: HomeAssistant, entity_ids: list[str] | None, *, store: str | None = None,
                      person: str | None = None, tag: str | None = None, category: str | None = None,
                      include_completed: bool = False, user: Any | None = None) -> list[dict[str, Any]]:
    learning = _learning(hass)
    if not entity_ids:
        # ohne Angabe: alle Einkaufslisten – Notizlisten der App gehören nicht dazu
        entity_ids = [s.entity_id for s in hass.states.async_all(TODO_DOMAIN)
                      if s.state != "unavailable" and not lists.is_notes(hass, s.entity_id)]
    out: list[dict[str, Any]] = []
    for entity_id in entity_ids:
        try:
            data = await lists.get_list(hass, entity_id, user)
        except lists.ListError:
            continue
        for it in data["items"]:
            if it["checked"] and not include_completed:
                continue

            def has(kind: str, value: str | None) -> bool:
                if not value:
                    return True
                v = value.lower()
                if any(t["kind"] == kind and str(t["value"]).lower() == v for t in it["tags"]):
                    return True
                return kind == "store" and bool(it.get("offer")) and str(it["offer"]["store"]).lower() == v

            if not (has("store", store) and has("person", person) and has("tag", tag)):
                continue
            if category and it["category"] != category:
                continue
            out.append(
                {
                    "list": entity_id,
                    "list_name": data["name"],
                    "uid": it["uid"],
                    "text": it["text"],
                    "name": it["name"],
                    "quantity": it["quantity"],
                    "unit": it["unit"],
                    "category": it["category"],
                    "category_label": learning.categories.label(it["category"]),
                    "stores": [t["label"] for t in it["tags"] if t["kind"] == "store"],
                    "persons": [t["label"] for t in it["tags"] if t["kind"] == "person"],
                    "offer": it.get("offer"),
                    "checked": it["checked"],
                }
            )
    return out


# Antworten von Assist je Sprache (Sprache des Gesprächs, sonst Englisch)
SPEECH: dict[str, dict[str, str]] = {
    "de": {"and": "und", "at": "bei", "which_list": "Auf welche Liste? Lege unter SmartLists eine Standard-Liste für Assist fest.",
           "added": "{items}{store} steht jetzt auf {list}.", "nothing": "Nichts zu besorgen{store}.",
           "count": "{n} Artikel{store}: {items}{more}.", "more": " und {n} weitere", "dec": ","},
    "en": {"and": "and", "at": "at", "which_list": "Which list? Set a default list for Assist under SmartLists.",
           "added": "Added {items}{store} to {list}.", "nothing": "Nothing to buy{store}.",
           "count": "{n} items{store}: {items}{more}.", "more": " and {n} more", "dec": "."},
    "fr": {"and": "et", "at": "chez", "which_list": "Sur quelle liste ? Choisis une liste par défaut pour Assist dans SmartLists.",
           "added": "{items}{store} ajouté à {list}.", "nothing": "Rien à acheter{store}.",
           "count": "{n} articles{store} : {items}{more}.", "more": " et {n} autres", "dec": ","},
    "es": {"and": "y", "at": "en", "which_list": "¿En qué lista? Elige una lista predeterminada para Assist en SmartLists.",
           "added": "{items}{store} añadido a {list}.", "nothing": "Nada que comprar{store}.",
           "count": "{n} artículos{store}: {items}{more}.", "more": " y {n} más", "dec": ","},
    "it": {"and": "e", "at": "da", "which_list": "Su quale lista? Imposta una lista predefinita per Assist in SmartLists.",
           "added": "{items}{store} aggiunto a {list}.", "nothing": "Niente da comprare{store}.",
           "count": "{n} articoli{store}: {items}{more}.", "more": " e altri {n}", "dec": ","},
    "pl": {"and": "i", "at": "w", "which_list": "Na którą listę? Ustaw domyślną listę dla Assist w SmartLists.",
           "added": "Dodano {items}{store} do {list}.", "nothing": "Nic do kupienia{store}.",
           "count": "{n} produktów{store}: {items}{more}.", "more": " i {n} więcej", "dec": ","},
}


def _speech(language: str | None) -> dict[str, str]:
    code = (language or "en").split("-")[0].lower()
    return SPEECH.get(code, SPEECH["en"])


def spoken_list(items: list[dict[str, Any]], language: str | None = "de") -> str:
    """„2 kg Äpfel, Milch und Brot“."""
    sp = _speech(language)
    parts = []
    for it in items:
        qty = ""
        if it["quantity"] is not None:
            q = it["quantity"]
            qty = (str(int(q)) if float(q).is_integer() else str(q).replace(".", sp["dec"])) + (f" {it['unit']}" if it["unit"] else "") + " "
        parts.append(qty + it["name"])
    if len(parts) <= 1:
        return "".join(parts)
    return ", ".join(parts[:-1]) + f" {sp['and']} " + parts[-1]


# ----------------------------------------------------------------------
# Assist
# ----------------------------------------------------------------------
def _find_list(hass: HomeAssistant, spoken: str | None) -> str | None:
    """Liste per Name: exakt, dann Teilwort ("Einkauf" → "Einkaufsliste"), sonst Standard-Liste."""
    learning = _learning(hass)
    states = [s for s in hass.states.async_all(TODO_DOMAIN) if s.state != "unavailable" and not lists.is_notes(hass, s.entity_id)]
    if spoken:
        want = normalize_list_name(spoken)
        names = [(s.entity_id, normalize_list_name(s.attributes.get(ATTR_FRIENDLY_NAME, s.entity_id))) for s in states]
        for eid, name in names:
            if name == want:
                return eid
        for eid, name in names:
            if want and (want in name or name in want):
                return eid
    default = learning.automation.get("voice_default_list")
    if default and hass.states.get(default):
        return default
    return states[0].entity_id if len(states) == 1 else None


class AddItemIntent(intent.IntentHandler):
    intent_type = INTENT_ADD
    description = "Artikel mit Menge, Markt (@REWE) und Person auf eine SmartLists-/To-do-Liste setzen"
    slot_schema = {vol.Required("item"): cv.string, vol.Optional("list"): cv.string, vol.Optional("store"): cv.string}

    async def async_handle(self, intent_obj: intent.Intent) -> intent.IntentResponse:
        hass = intent_obj.hass
        slots = self.async_validate_slots(intent_obj.slots)
        learning = _learning(hass)
        response = intent_obj.create_response()
        lang = intent_obj.language
        sp = _speech(lang)
        entity_id = _find_list(hass, slots.get("list", {}).get("value"))
        if entity_id is None:
            response.async_set_speech(sp["which_list"])
            return response
        # „Setz Pfannkuchen auf die Einkaufsliste“: Name einer Vorlage → alle Artikel der Vorlage
        extras = hass.data[DOMAIN].get("extras")
        if extras and (tid := extras.find_template(slots["item"]["value"])):
            try:
                res = await add_template_items(hass, entity_id, tid, None, [], intent_obj.context)
            except lists.ListError as err:
                response.async_set_speech(str(err))
                return response
            name = hass.states.get(entity_id).attributes.get(ATTR_FRIENDLY_NAME, entity_id)
            response.async_set_speech(sp["added"].format(items=f"{extras.templates[tid]['name']} ({res['added'] + res['increased']})", store="", list=name))
            return response
        item = learning.parse(slots["item"]["value"], typed=True)
        store = slots.get("store", {}).get("value")
        rule = next((r for r in learning.tag_rules if r["kind"] == "store"), None)
        if store and rule and not any(t["kind"] == "store" for t in item.tags):
            item.tags.append({"kind": "store", "value": store.strip().replace(" ", "-"), "prefix": rule["prefix"], "label": store})
        if item.quantity is not None and not item.unit:
            item.unit = learning.unit_for(item.name)
        text = learning.encode(item)
        try:
            await lists.add_item(hass, entity_id, text, context=intent_obj.context)
        except lists.ListError as err:
            response.async_set_speech(str(err))
            return response
        name = hass.states.get(entity_id).attributes.get(ATTR_FRIENDLY_NAME, entity_id)
        store_txt = next((f" {sp['at']} {t.get('label', t['value'])}" for t in item.tags if t["kind"] == "store"), "")
        spoken = spoken_list([{"name": item.name, "quantity": item.quantity, "unit": item.unit}], lang)
        response.async_set_speech(sp["added"].format(items=spoken, store=store_txt, list=name))
        return response


class ListItemsIntent(intent.IntentHandler):
    intent_type = INTENT_LIST
    description = "Offene Artikel einer Liste vorlesen, optional nur für einen Markt"
    slot_schema = {vol.Optional("list"): cv.string, vol.Optional("store"): cv.string}

    async def async_handle(self, intent_obj: intent.Intent) -> intent.IntentResponse:
        hass = intent_obj.hass
        slots = self.async_validate_slots(intent_obj.slots)
        response = intent_obj.create_response()
        lang = intent_obj.language
        sp = _speech(lang)
        spoken_name = slots.get("list", {}).get("value")
        store = slots.get("store", {}).get("value")
        entity_id = _find_list(hass, spoken_name)
        # nur Listen, die der Sprecher sehen darf (eigene Listen mit Freigaben)
        user = await hass.auth.async_get_user(intent_obj.context.user_id) if intent_obj.context and intent_obj.context.user_id else None
        items = await query_items(hass, [entity_id] if entity_id else None, store=store, user=user)
        where = f" {sp['at']} {store}" if store else ""
        if not items:
            response.async_set_speech(sp["nothing"].format(store=where))
            return response
        head = items[:12]
        more = sp["more"].format(n=len(items) - 12) if len(items) > 12 else ""
        response.async_set_speech(sp["count"].format(n=len(items), store=where, items=spoken_list(head, lang), more=more))
        return response


@callback
def async_setup_intents(hass: HomeAssistant) -> None:
    intent.async_register(hass, AddItemIntent())
    intent.async_register(hass, ListItemsIntent())


async def async_install_sentences(hass: HomeAssistant) -> list[str]:
    """Satz-Dateien nach config/custom_sentences/<sprache>/ kopieren und Assist neu laden."""

    def _copy() -> list[str]:
        done = []
        for src in sorted(SENTENCES_DIR.glob("*.yaml")):
            lang = src.stem
            target = Path(hass.config.path("custom_sentences", lang, "smartlists.yaml"))
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(src, target)
            done.append(lang)
        return done

    langs = await hass.async_add_executor_job(_copy)
    if hass.services.has_service("conversation", "reload"):
        await hass.services.async_call("conversation", "reload", {}, blocking=True)
    return langs


# ----------------------------------------------------------------------
# Dienste
# ----------------------------------------------------------------------
GET_ITEMS_SCHEMA = vol.Schema(
    {
        vol.Optional("entity_id"): cv.entity_ids,
        vol.Optional("store"): cv.string,
        vol.Optional("person"): cv.string,
        vol.Optional("tag"): cv.string,
        vol.Optional("category"): cv.string,
        vol.Optional("include_completed", default=False): cv.boolean,
    }
)


@callback
def async_setup_services(hass: HomeAssistant) -> None:
    async def _get_items(call: ServiceCall) -> ServiceResponse:
        items = await query_items(
            hass, call.data.get("entity_id"), store=call.data.get("store"), person=call.data.get("person"),
            tag=call.data.get("tag"), category=call.data.get("category"), include_completed=call.data["include_completed"],
        )
        return {"items": items, "count": len(items), "spoken": spoken_list(items, hass.config.language)}

    hass.services.async_register(DOMAIN, SERVICE_GET_ITEMS, _get_items, schema=GET_ITEMS_SCHEMA,
                                 supports_response=SupportsResponse.ONLY)

    async def _add_due(call: ServiceCall) -> ServiceResponse:
        return {"added": await async_add_due_items(hass)}

    hass.services.async_register(DOMAIN, "add_due_items", _add_due, supports_response=SupportsResponse.OPTIONAL)

    async def _add_template(call: ServiceCall) -> ServiceResponse:
        extras = hass.data[DOMAIN]["extras"]
        tid = call.data["template"] if call.data["template"] in extras.templates else extras.find_template(call.data["template"])
        if tid is None:
            raise lists.ListError(f"Vorlage nicht gefunden: {call.data['template']}")
        return await add_template_items(hass, call.data["entity_id"], tid, call.data.get("servings"), [], call.context)

    hass.services.async_register(DOMAIN, "add_template", _add_template, schema=vol.Schema({
        vol.Required("entity_id"): cv.entity_id, vol.Required("template"): cv.string,
        vol.Optional("servings"): vol.All(vol.Coerce(int), vol.Range(min=1, max=100)),
    }), supports_response=SupportsResponse.OPTIONAL)


async def add_template_items(hass: HomeAssistant, entity_id: str, template_id: str, servings: int | None,
                             skip: list[int], context: Any) -> dict[str, Any]:
    """Vorlage auf eine Liste: Mengen nach Portionen umrechnen; steht ein Artikel schon offen auf der Liste,
    wird seine Menge erhöht (gleiche Einheit) statt ihn doppelt einzutragen."""
    from .extras import scale_quantity

    extras = hass.data[DOMAIN]["extras"]
    learning = _learning(hass)
    tpl = extras.templates.get(template_id)
    if tpl is None:
        raise lists.ListError("Vorlage nicht gefunden")
    factor = servings / tpl["servings"] if servings and tpl.get("servings") else 1
    current = await lists.raw_items(hass, entity_id)
    added = increased = 0
    for idx, text in enumerate(tpl["items"]):
        if idx in skip:
            continue
        text = scale_quantity(text, factor)
        item = learning.parse(text, typed=True)
        key = item.name.casefold()
        hit = next((c for c in current if not c["checked"] and learning.parse(c["text"]).name.casefold() == key), None)
        if hit is not None:
            have = learning.parse(hit["text"])
            if item.quantity and (have.unit or "") == (item.unit or ""):
                have.quantity = (have.quantity or 1) + item.quantity
                await lists.update_item(hass, entity_id, hit["uid"], text=learning.encode(have), context=context)
                increased += 1
            continue
        await lists.add_item(hass, entity_id, text, context=context)
        added += 1
    return {"added": added, "increased": increased}


# ----------------------------------------------------------------------
# Fällige Artikel automatisch auf eine Liste
# ----------------------------------------------------------------------
async def async_add_due_items(hass: HomeAssistant) -> int:
    learning = _learning(hass)
    target = learning.automation.get("auto_due_list")
    if not target or hass.states.get(target) is None:
        return 0
    try:
        present = [i["text"] for i in await lists.raw_items(hass, target) if not i["checked"]]
    except lists.ListError:
        return 0
    added = 0
    for due in learning.due_items(present, lists.suggest_scope(hass, target)):
        entry = learning.history.get(normalize_key(due["name"]))
        # pro Kaufzyklus nur einmal – wer den Vorschlag löscht, bekommt ihn erst nach dem nächsten Kauf wieder
        if entry is None or entry.get("auto_added_for") == due["last"]:
            continue
        # automatisch eintragen ist kein Kauf → Verlauf (Anzahl, Zeitpunkte) danach wiederherstellen
        snapshot = {k: (list(v) if isinstance(v, list) else v) for k, v in entry.items()}
        try:
            await lists.add_item(hass, target, due["name"])
        except lists.ListError as err:
            _LOGGER.debug("Fälliger Artikel %s nicht hinzugefügt: %s", due["name"], err)
            continue
        entry = learning.history.setdefault(normalize_key(due["name"]), {})
        entry.clear()
        entry.update(snapshot)
        entry["auto_added_for"] = due["last"]
        added += 1
    if added:
        learning._changed()
    return added


def normalize_key(name: str) -> str:
    from .categories import normalize

    return normalize(name)


@callback
def async_setup_due_timer(hass: HomeAssistant) -> callable:
    async def _tick(_now) -> None:
        await async_add_due_items(hass)

    return async_track_time_interval(hass, _tick, DUE_CHECK_INTERVAL)
