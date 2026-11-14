"""Einrichtung über Einstellungen → Geräte & Dienste → Integrationen → SmartLists.

- Die Integration wird EINMAL eingerichtet (single_config_entry).
- Kombinierte Listen sind Unter-Einträge: bei der Integration „Kombinierte Liste hinzufügen“,
  jede einzeln über ⋮ → „Neu konfigurieren“ änderbar.
- „Konfigurieren“ öffnet die Einstellungen für den ganzen Haushalt: Namenskonvention,
  Bedienung (Standard für alle) und gemerkte Kategorien. Persönliche Abweichungen je Benutzer
  bzw. Gerät stellt jeder selbst im Zahnrad der Karte ein.
"""

from __future__ import annotations

import re
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    ConfigSubentryFlow,
    OptionsFlow,
    SubentryFlowResult,
)
from homeassistant.const import CONF_NAME
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er, selector

from . import itemtext
from .const import (
    CONF_DEFAULT_ADD,
    CONF_FOREIGN,
    CONF_MODE,
    CONF_LABEL_SHOW,
    CONF_LABEL_SOURCES,
    CONF_SOURCE_AS_PERSON,
    CONF_SORT,
    CONF_SOURCE_LABEL,
    CONF_SOURCES,
    DOMAIN,
    LABEL_NONE,
    LABEL_PREFIX,
    LABEL_SUFFIX,
    MODE_BIDIRECTIONAL,
    MODE_LOCAL,
    SORT_ALPHABETICAL,
    SORT_CATEGORY,
    SORT_SOURCE,
    SORT_STATUS,
    SUBENTRY_COMBINED,
    SUBENTRY_OWN,
    SUBENTRY_OWN_GROUP,
)
from .learning import MENU_ACTIONS, Learning

DEFAULTS: dict[str, Any] = {
    CONF_MODE: MODE_BIDIRECTIONAL,
    CONF_SOURCE_LABEL: LABEL_SUFFIX,
    CONF_SORT: SORT_SOURCE,
    CONF_FOREIGN: [],
    CONF_SOURCE_AS_PERSON: True,
    CONF_LABEL_SHOW: "list",
    CONF_LABEL_SOURCES: [],
}
# Bedienung: eingebaute Werte (gleich wie UI_DEFAULTS in der Karte)
UI_BUILTIN: dict[str, Any] = {
    "press_gesture": "long",
    "press_target": "row",
    "press_result": "menu",
    "menu_actions": list(MENU_ACTIONS),
    "row_buttons": True,
    "shop_hide_checked": True,
    "shop_keep_awake": True,
    "shop_large": True,
    "shop_tap_row": True,
    "shop_untagged": True,
    "shop_auto_store": True,
    "scan_target": "",
    "scan_mode": "input",
}
OFF = "off"
TAG_FIELDS = {"store": "prefix_store", "person": "prefix_person", "tag": "prefix_tag"}


def _notes_ids(hass: HomeAssistant) -> list[str]:
    """Notizlisten der App – in Auswahlfeldern für Einkaufslisten nicht anbieten."""
    from .notes import looks_like_notes

    return sorted(s.entity_id for s in hass.states.async_all("todo")
                  if looks_like_notes(s.entity_id, s.attributes.get("friendly_name")))


def _combined_ids(hass: HomeAssistant) -> list[str]:
    """Entitäten kombinierter SmartLists-Listen (nicht die eigenen Listen – die haben unique_id own_…)."""
    ids = set(hass.data.get(DOMAIN, {}).get("entities", {}))
    for entry in er.async_entries_for_config_entry(er.async_get(hass), next(
            (e.entry_id for e in hass.config_entries.async_entries(DOMAIN)), "")):
        if entry.domain == "todo" and not str(entry.unique_id).startswith("own_"):
            ids.add(entry.entity_id)
    return sorted(ids)


def _todo_selector(multiple: bool, exclude: list[str] | None = None) -> selector.EntitySelector:
    cfg: dict[str, Any] = {"domain": "todo", "multiple": multiple}
    if exclude:
        cfg["exclude_entities"] = exclude
    return selector.EntitySelector(selector.EntitySelectorConfig(**cfg))


def _select(options: list[str], key: str, multiple: bool = False, dropdown: bool = False) -> selector.SelectSelector:
    return selector.SelectSelector(
        selector.SelectSelectorConfig(
            options=options,
            translation_key=key,
            multiple=multiple,
            mode=selector.SelectSelectorMode.DROPDOWN if dropdown else selector.SelectSelectorMode.LIST,
        )
    )


def _learning(hass: HomeAssistant) -> Learning:
    return hass.data[DOMAIN]["learning"]


# ----------------------------------------------------------------------
# Integration selbst
# ----------------------------------------------------------------------
# Seite mit Einrichtungs-Assistent (Karte öffnet ihn bei ?setup=1)
SETUP_URL = "/smartlists?setup=1"
# Alle übrigen Einstellungen: auf der SmartLists-Seite (⚙), dort vollständiger und mit Suche
SETTINGS_URL = "/smartlists?settings=global"

class SmartListsConfigFlow(ConfigFlow, domain=DOMAIN):
    """SmartLists einmal einrichten."""

    VERSION = 2

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Einrichtungs-Assistent: optional gleich eine kombinierte Liste anlegen.
        Vorgeschlagen werden alle vorhandenen To-do-Listen; mit zwei oder mehr ausgewählten entsteht
        die erste kombinierte Liste direkt mit."""
        errors: dict[str, str] = {}
        notes = _notes_ids(self.hass)
        todo_ids = sorted(s.entity_id for s in self.hass.states.async_all("todo") if s.entity_id not in notes)
        if user_input is not None:
            combine = list(user_input.get("combine") or [])
            subentries = []
            if len(combine) == 1:
                errors["combine"] = "combine_two"
            elif combine:
                data = {CONF_SOURCES: combine, CONF_MODE: MODE_BIDIRECTIONAL, CONF_SOURCE_LABEL: LABEL_SUFFIX, CONF_SORT: SORT_CATEGORY,
                        CONF_FOREIGN: []}
                if user_input.get(CONF_DEFAULT_ADD) in combine:
                    data[CONF_DEFAULT_ADD] = user_input[CONF_DEFAULT_ADD]
                subentries.append({"subentry_type": SUBENTRY_COMBINED, "title": user_input.get(CONF_NAME) or "Einkauf",
                                   "data": data, "unique_id": None})
            if not errors:
                # Erfolgsmeldung mit Link direkt zum Einrichtungs-Assistenten (/smartlists?setup=1)
                return self.async_create_entry(title="SmartLists", data={}, subentries=subentries, description="setup",
                                              description_placeholders={"url": SETUP_URL})
        schema = vol.Schema(
            {
                vol.Optional("combine", default=todo_ids if 2 <= len(todo_ids) <= 4 else []): _todo_selector(True, notes),
                vol.Optional(CONF_NAME, default="Einkauf"): selector.TextSelector(),
                vol.Optional(CONF_DEFAULT_ADD): _todo_selector(False, notes),
            }
        )
        return self.async_show_form(step_id="user", data_schema=schema, errors=errors,
                                    description_placeholders={"count": str(len(todo_ids))})

    @classmethod
    @callback
    def async_get_supported_subentry_types(cls, config_entry: ConfigEntry) -> dict[str, type[ConfigSubentryFlow]]:
        # eigene Listen: ein Unter-Eintrag je Besitzer („Eigene Listen · Julian“), siehe own_groups.py
        return {SUBENTRY_COMBINED: CombinedListSubentryFlow, SUBENTRY_OWN_GROUP: OwnListsSubentryFlow}

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return SmartListsOptionsFlow()


# ----------------------------------------------------------------------
# Kombinierte Liste (Unter-Eintrag)
# ----------------------------------------------------------------------
def combined_schema(exclude: list[str] | None = None) -> dict[Any, Any]:
    return {
        vol.Required(CONF_SOURCES): _todo_selector(True, exclude),
        vol.Optional(CONF_DEFAULT_ADD): _todo_selector(False, exclude),
        vol.Required(CONF_MODE, default=MODE_BIDIRECTIONAL): _select([MODE_BIDIRECTIONAL, MODE_LOCAL], "mode"),
        vol.Required(CONF_SOURCE_LABEL, default=LABEL_SUFFIX): _select(
            [LABEL_SUFFIX, LABEL_PREFIX, LABEL_NONE], "source_label"
        ),
        vol.Required(CONF_SORT, default=SORT_SOURCE): _select(
            [SORT_SOURCE, SORT_CATEGORY, SORT_STATUS, SORT_ALPHABETICAL], "sort"
        ),
        vol.Optional(CONF_FOREIGN, default=[]): _todo_selector(True, exclude),
        vol.Optional(CONF_SOURCE_AS_PERSON, default=True): selector.BooleanSelector(),
        vol.Required(CONF_LABEL_SHOW, default="list"): _select(["list", "owner", "owner_list"], "label_show"),
        vol.Optional(CONF_LABEL_SOURCES, default=[]): _todo_selector(True, exclude),
    }


def validate_combined(hass: HomeAssistant, data: dict[str, Any]) -> dict[str, str]:
    errors: dict[str, str] = {}
    sources: list[str] = data.get(CONF_SOURCES) or []
    if not sources:
        errors[CONF_SOURCES] = "no_sources"
        return errors
    # Kombinierte Listen dürfen nicht ineinander verschachtelt werden (Endlosschleifen).
    # Eigene SmartLists-Listen (auch übernommene) sind dagegen ganz normale Quellen.
    if any(e in _combined_ids(hass) for e in sources):
        errors[CONF_SOURCES] = "nested_combined_list"
        return errors
    default_add = data.get(CONF_DEFAULT_ADD)
    if default_add and default_add not in sources:
        errors[CONF_DEFAULT_ADD] = "default_not_in_sources"
    if any(f not in sources for f in data.get(CONF_LABEL_SOURCES) or []):
        errors[CONF_LABEL_SOURCES] = "labels_not_in_sources"
    foreign = data.get(CONF_FOREIGN) or []
    if any(f not in sources for f in foreign):
        errors[CONF_FOREIGN] = "foreign_not_in_sources"
    elif default_add and default_add in foreign:
        errors[CONF_DEFAULT_ADD] = "default_is_foreign"
    return errors


EVERYONE = "everyone"  # Übersetzungs-Schlüssel: nur a-z0-9-_, nicht mit _ beginnen


async def _access_fields(hass: HomeAssistant, current: dict[str, Any], default_owner: str | None) -> dict[Any, Any]:
    """Besitzer + wer sehen/abhaken/bearbeiten darf (für kombinierte Listen; „Alle“ = keine Einschränkung)."""
    from .own import async_household_users

    users = await async_household_users(hass)
    opts = [selector.SelectOptionDict(value=u["id"], label=u["name"]) for u in users]
    owner_opts = [selector.SelectOptionDict(value=EVERYONE, label="—"), *opts]
    multi = selector.SelectSelector(selector.SelectSelectorConfig(options=opts, multiple=True, mode=selector.SelectSelectorMode.DROPDOWN))
    shares = current.get("shares") or {}
    by_role = {r: [u for u, role in shares.items() if role == r] for r in ("viewer", "checker", "editor")}
    owner = current.get("owner") if "owner" in current else default_owner
    return {
        vol.Required("owner", default=owner or EVERYONE): selector.SelectSelector(
            selector.SelectSelectorConfig(options=owner_opts, translation_key="owner", mode=selector.SelectSelectorMode.DROPDOWN)),
        vol.Optional("editors", default=by_role["editor"]): multi,
        vol.Optional("checkers", default=by_role["checker"]): multi,
        vol.Optional("viewers", default=by_role["viewer"]): multi,
    }


def _apply_access(user_input: dict[str, Any]) -> dict[str, Any]:
    """Formularfelder → owner/shares in den Daten der kombinierten Liste."""
    data = dict(user_input)
    owner = data.pop("owner", EVERYONE)
    picked = {k: data.pop(k, []) or [] for k in ("viewers", "checkers", "editors")}
    data.pop("owner", None)
    if owner and owner != EVERYONE:
        shares: dict[str, str] = {}
        for key, role in (("viewers", "viewer"), ("checkers", "checker"), ("editors", "editor")):
            for uid in picked[key]:
                if uid != owner:
                    shares[uid] = role
        data["owner"], data["shares"] = owner, shares
    return data


class CombinedListSubentryFlow(ConfigSubentryFlow):
    """Kombinierte Liste anlegen bzw. neu konfigurieren – mit Besitzer und Freigaben."""

    async def _schema(self, current: dict[str, Any]) -> vol.Schema:
        base = {vol.Required(CONF_NAME): selector.TextSelector(), **combined_schema(_notes_ids(self.hass) + _combined_ids(self.hass))}
        return vol.Schema({**base, **await _access_fields(self.hass, current, self.context.get("user_id"))})

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            errors = validate_combined(self.hass, user_input)
            if not errors:
                data = _apply_access(user_input)
                name = data.pop(CONF_NAME)
                return self.async_create_entry(title=name, data=data)
        schema = await self._schema({})
        if user_input is not None:
            schema = self.add_suggested_values_to_schema(schema, user_input)
        return self.async_show_form(step_id="user", data_schema=schema, errors=errors)

    async def async_step_reconfigure(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        subentry = self._get_reconfigure_subentry()
        errors: dict[str, str] = {}
        if user_input is not None:
            errors = validate_combined(self.hass, user_input)
            if not errors:
                data = _apply_access(user_input)
                name = data.pop(CONF_NAME)
                # interne Felder (z.B. legacy_unique_id aus der Migration) behalten
                # … und die Verknüpfung mit der App (Liste gehört zum Gerät)
                keep = {k: v for k, v in subentry.data.items() if k.startswith("legacy_") or k in ("app_device", "app_list")}
                return self.async_update_and_abort(
                    self._get_entry(), subentry, title=name, data={**keep, **data}
                )
        current = {**DEFAULTS, **subentry.data, CONF_NAME: subentry.title}
        if "owner" not in subentry.data:
            current["owner"] = None  # bisher ohne Besitzer → „—“ (für alle) vorauswählen
        schema = self.add_suggested_values_to_schema(await self._schema(current), user_input if user_input is not None else
                                                     {k: v for k, v in current.items() if k not in ("owner", "shares")})
        return self.async_show_form(step_id="reconfigure", data_schema=schema, errors=errors)


# ----------------------------------------------------------------------
# Eigene Liste (Unter-Eintrag) mit Besitzer und Freigaben
# ----------------------------------------------------------------------
class OwnListSubentryFlow(ConfigSubentryFlow):
    """Eigene Liste anlegen/bearbeiten: Name, Besitzer, wer sehen / abhaken / bearbeiten darf."""

    async def _schema(self, current: dict[str, Any]) -> vol.Schema:
        from .own import async_household_users

        users = await async_household_users(self.hass)
        opts = [selector.SelectOptionDict(value=u["id"], label=u["name"]) for u in users]

        def users_sel(multiple: bool) -> selector.SelectSelector:
            return selector.SelectSelector(selector.SelectSelectorConfig(options=opts, multiple=multiple, mode=selector.SelectSelectorMode.DROPDOWN))

        shares = current.get("shares") or {}
        by_role = {r: [u for u, role in shares.items() if role == r] for r in ("viewer", "checker", "editor")}
        return vol.Schema(
            {
                vol.Required(CONF_NAME, default=current.get(CONF_NAME, "")): selector.TextSelector(),
                vol.Required("owner", default=current.get("owner") or (self.context.get("user_id") or (users[0]["id"] if users else ""))): users_sel(False),
                vol.Optional("editors", default=by_role["editor"]): users_sel(True),
                vol.Optional("checkers", default=by_role["checker"]): users_sel(True),
                vol.Optional("viewers", default=by_role["viewer"]): users_sel(True),
            }
        )

    @staticmethod
    def _data(user_input: dict[str, Any]) -> tuple[str, dict[str, Any]]:
        owner = user_input["owner"]
        shares: dict[str, str] = {}
        # höhere Rolle gewinnt, falls jemand mehrfach gewählt wurde
        for key, role in (("viewers", "viewer"), ("checkers", "checker"), ("editors", "editor")):
            for uid in user_input.get(key) or []:
                if uid != owner:
                    shares[uid] = role
        return user_input[CONF_NAME].strip(), {"owner": owner, "shares": shares}

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        if user_input is not None and user_input.get(CONF_NAME, "").strip():
            title, data = self._data(user_input)
            return self.async_create_entry(title=title, data=data)
        return self.async_show_form(step_id="user", data_schema=await self._schema({}))

    async def async_step_reconfigure(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        subentry = self._get_reconfigure_subentry()
        if user_input is not None and user_input.get(CONF_NAME, "").strip():
            title, data = self._data(user_input)
            return self.async_update_and_abort(self._get_entry(), subentry, title=title, data=data)
        return self.async_show_form(step_id="reconfigure", data_schema=await self._schema({**subentry.data, CONF_NAME: subentry.title}))


class OwnListsSubentryFlow(OwnListSubentryFlow):
    """Eigene Listen je Besitzer. „Eigene Liste hinzufügen“ trägt die Liste beim gewählten Besitzer ein (dessen
    Unter-Eintrag wird bei Bedarf angelegt); ⚙ am Besitzer-Eintrag: Liste wählen → umbenennen, Freigaben,
    Besitzer wechseln oder löschen."""

    _list_id: str | None = None

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        if user_input is not None and user_input.get(CONF_NAME, "").strip():
            from .own_groups import async_add_list

            title, data = self._data(user_input)
            await async_add_list(self.hass, data["owner"], title, data["shares"])
            return self.async_abort(reason="list_added")
        return self.async_show_form(step_id="user", data_schema=await self._schema({}))

    async def async_step_reconfigure(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        group = self._get_reconfigure_subentry()
        lists_ = group.data.get("lists") or {}
        if user_input is not None and user_input.get("list") in lists_:
            self._list_id = user_input["list"]
            return await self.async_step_edit()
        if len(lists_) == 1:
            self._list_id = next(iter(lists_))
            return await self.async_step_edit()
        options = [selector.SelectOptionDict(value=k, label=v.get("title") or k) for k, v in lists_.items()]
        return self.async_show_form(step_id="reconfigure", data_schema=vol.Schema({
            vol.Required("list"): selector.SelectSelector(selector.SelectSelectorConfig(options=options, mode=selector.SelectSelectorMode.LIST)),
        }))

    async def async_step_edit(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        from .own_groups import async_remove_list, async_update_list

        group = self._get_reconfigure_subentry()
        current = (group.data.get("lists") or {}).get(self._list_id or "")
        if current is None:
            return self.async_abort(reason="reconfigure_successful")
        if user_input is not None:
            if user_input.get("delete"):
                async_remove_list(self.hass, self._list_id)
            elif user_input.get(CONF_NAME, "").strip():
                title, data = self._data(user_input)
                await async_update_list(self.hass, self._list_id, title=title, shares=data["shares"], owner=data["owner"])
            return self.async_abort(reason="reconfigure_successful")
        schema = await self._schema({CONF_NAME: current.get("title", ""), "owner": group.data.get("owner"), "shares": current.get("shares") or {}})
        schema = schema.extend({vol.Optional("delete", default=False): selector.BooleanSelector()})
        return self.async_show_form(step_id="edit", data_schema=schema, description_placeholders={"list": current.get("title", "")})


# ----------------------------------------------------------------------
# Konfigurieren: Einstellungen für den ganzen Haushalt
# ----------------------------------------------------------------------
class SmartListsOptionsFlow(OptionsFlow):
    """Menü: Namenskonvention, Bedienung, gemerkte Kategorien.

    Gespeichert wird im Gedächtnis der Integration (dieselben Werte, die Admins auch im Zahnrad der
    Karte ändern können) – nicht in den Optionen des Eintrags, damit beide Wege dasselbe zeigen."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        # Hier nur noch „Einrichtung erneut starten“; alles andere steht auf der SmartLists-Seite (⚙ Einstellungen) –
        # vollständiger, mit Suche und für jede Liste. Die übrigen Schritte bleiben für ältere Links erhalten.
        return self.async_show_menu(step_id="init", menu_options=["restart", "settings"], description_placeholders={"url": SETTINGS_URL})

    async def async_step_settings(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Nur ein Link: Einstellungen auf der SmartLists-Seite öffnen."""
        if user_input is not None:
            return self._done()
        return self.async_show_form(step_id="settings", data_schema=vol.Schema({}), description_placeholders={"url": SETTINGS_URL})

    # ---- Kategorie-Erkennung: Keyword-Packs (dasselbe wie in der Karte → Haushalt) ----------------
    def _packs(self):
        return self.hass.data[DOMAIN]["packs"]

    async def async_step_packs(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Aktive Packs wählen und eins bearbeiten, neu anlegen oder als JSON einfügen."""
        packs = self._packs()
        rows = packs.describe()
        errors: dict[str, str] = {}
        if user_input is not None:
            chosen = list(user_input.get("active") or [])
            # Reihenfolge (Vorrang) bleibt; neu Eingeschaltete kommen ans Ende
            order = [p for p in packs.active if p in chosen] + [p for p in chosen if p not in packs.active]
            try:
                if order != packs.active:
                    packs.set_active(order)
            except ValueError:
                errors["active"] = "pack_none_active"
            if not errors:
                action = user_input.get("action", "done")
                if action == "edit":
                    return await self.async_step_pack_pick()
                if action == "new":
                    return await self.async_step_pack_new()
                if action == "import":
                    return await self.async_step_pack_import()
                return self._done()
        options = [selector.SelectOptionDict(
            value=r["id"], label=f"{r['name']} · {r['terms']} · {'⭐' if r['builtin'] else '✏️'}") for r in rows]
        schema = vol.Schema({
            vol.Optional("active", default=[r["id"] for r in rows if r["active"]]): selector.SelectSelector(
                selector.SelectSelectorConfig(options=options, multiple=True, mode=selector.SelectSelectorMode.LIST)),
            vol.Required("action", default="done"): _select(["done", "edit", "new", "import"], "pack_action"),
        })
        order = " → ".join(r["name"] for r in rows if r["active"])
        return self.async_show_form(step_id="packs", data_schema=schema, errors=errors,
                                    description_placeholders={"order": order or "—"})

    async def async_step_pack_pick(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        rows = self._packs().describe()
        if user_input is not None:
            self._pack_id = user_input["pack"]
            return await self.async_step_pack_edit()
        options = [selector.SelectOptionDict(value=r["id"], label=f"{r['name']} ({r['terms']})") for r in rows]
        return self.async_show_form(step_id="pack_pick", data_schema=vol.Schema({vol.Required("pack"): selector.SelectSelector(
            selector.SelectSelectorConfig(options=options, mode=selector.SelectSelectorMode.LIST))}))

    async def async_step_pack_new(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                self._pack_id = self._packs().create(user_input["name"], user_input.get("language", ""))
                return await self.async_step_pack_edit()
            except ValueError:
                errors["name"] = "pack_exists"
        return self.async_show_form(step_id="pack_new", errors=errors, data_schema=vol.Schema({
            vol.Required("name"): selector.TextSelector(),
            vol.Optional("language", default=""): selector.TextSelector(),
        }))

    async def async_step_pack_import(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Pack als JSON einfügen (Integrations- oder App-Format)."""
        import json

        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                raw = json.loads(user_input["json"])
                self._packs().add_custom(raw, user_input.get("name") or None)
                return self._done()
            except (ValueError, TypeError):
                errors["json"] = "pack_invalid"
        return self.async_show_form(step_id="pack_import", errors=errors,
                                    description_placeholders={"example": '{"terms": {"oat milk": "kuehlung"}}'},
                                    data_schema=vol.Schema({
            vol.Optional("name", default=""): selector.TextSelector(),
            vol.Required("json"): selector.TextSelector(selector.TextSelectorConfig(multiline=True)),
        }))

    async def async_step_pack_edit(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Stichwörter hinzufügen (mehrere, eine Kategorie) und entfernen. Eingebaute Packs: über „+“-Ergänzung."""
        packs = self._packs()
        pid = self._pack_id
        info = next((r for r in packs.describe() if r["id"] == pid), None)
        if info is None:
            return self._done()
        if user_input is not None:
            changes: dict[str, str | None] = {}
            for word in re.split(r"[,;\n]", user_input.get("add") or ""):
                if word.strip():
                    changes[word.strip()] = user_input["category"]
            for word in user_input.get("remove") or []:
                changes[word] = None
            if changes:
                packs.update_terms(pid, changes)
            if user_input.get("again"):
                return await self.async_step_pack_edit()
            return self._done()
        # entfernbar: eigene Stichwörter (bei eingebauten Packs nur die eigenen Ergänzungen)
        own = packs.terms(pid, limit=500)["terms"]
        removable = [t["term"] for t in own if not info["builtin"] or t["changed"]]
        cats = [selector.SelectOptionDict(value=c["id"], label=c["label"]) for c in _learning(self.hass).categories.as_list(self.hass.config.language)]
        fields: dict[Any, Any] = {
            vol.Optional("add", default=""): selector.TextSelector(selector.TextSelectorConfig(multiline=True)),
            vol.Required("category", default=cats[0]["value"]): selector.SelectSelector(
                selector.SelectSelectorConfig(options=cats, mode=selector.SelectSelectorMode.DROPDOWN)),
        }
        if removable:
            fields[vol.Optional("remove", default=[])] = selector.SelectSelector(selector.SelectSelectorConfig(
                options=removable[:300], multiple=True, mode=selector.SelectSelectorMode.DROPDOWN))
        fields[vol.Optional("again", default=False)] = selector.BooleanSelector()
        sample = ", ".join(f"{t['term']} → {_learning(self.hass).categories.label(t['category'])}" for t in own[:12])
        return self.async_show_form(step_id="pack_edit", data_schema=vol.Schema(fields), description_placeholders={
            "name": info["name"], "count": str(info["terms"]), "sample": sample or "—",
            "hint": "⭐" if info["builtin"] else "✏️"})

    async def async_step_restart(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Einrichtung erneut starten – wahlweise von vorn (Teile zurücksetzen). Der Assistent erscheint beim
        nächsten Öffnen der SmartLists-Seite bzw. -Karte."""
        if user_input is not None:
            from .websocket import async_reset

            await async_reset(self.hass, bool(user_input.get("settings")), bool(user_input.get("data")),
                              bool(user_input.get("links")), bool(user_input.get("combined")))
            return self.async_show_form(step_id="restart_done", data_schema=vol.Schema({}), description_placeholders={"url": SETUP_URL})
        return self.async_show_form(step_id="restart", data_schema=vol.Schema({
            vol.Optional("settings", default=False): selector.BooleanSelector(),
            vol.Optional("data", default=False): selector.BooleanSelector(),
            vol.Optional("links", default=False): selector.BooleanSelector(),
            vol.Optional("combined", default=False): selector.BooleanSelector(),
        }))

    async def async_step_restart_done(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        return self._done()

    async def async_step_assistant(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Nur ein Link zum Einrichtungs-Assistenten (läuft in der Seite /smartlists, nicht im Dialog)."""
        if user_input is not None:
            return self._done()
        return self.async_show_form(step_id="assistant", data_schema=vol.Schema({}), description_placeholders={"url": SETUP_URL})

    async def async_step_overview(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Alle SmartLists-Listen (todo.ha_smartlists_… der App und der Integration) auf einen Blick.
        Listen der App gehören technisch zur Integration „Local To-do“ – hier sind sie trotzdem aufgeführt."""
        if user_input is not None:
            return self._done()
        from .notes import looks_like_notes

        combined = self.hass.data.get(DOMAIN, {}).get("entities", {})
        own = self.hass.data.get(DOMAIN, {}).get("own", {})
        groups: dict[str, list[str]] = {"combined": [], "lists": [], "notes": []}
        for st in sorted(self.hass.states.async_all("todo"), key=lambda s: s.entity_id):
            eid = st.entity_id
            name = st.attributes.get("friendly_name", eid)
            ours = eid in combined or eid in own
            if not (ours or eid.startswith("todo.ha_smartlists_") or looks_like_notes(eid, name)):
                continue
            kind = "notes" if looks_like_notes(eid, name) else "combined" if eid in combined or "_merged_" in eid else "lists"
            origin = "SmartLists" if ours else "App"
            groups[kind].append(f"- **{name}** `{eid}` · {st.state} · {origin}")
        text = {k: "\n".join(v) or "—" for k, v in groups.items()}
        return self.async_show_form(step_id="overview", data_schema=vol.Schema({}),
                                    description_placeholders=text)

    async def async_step_app_lists(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Kombinierte Listen aus der App übernehmen – sie gehören dann zum jeweiligen Gerät der App."""
        from . import app_lists

        rows = app_lists.describe(self.hass)
        if user_input is not None:
            for key in user_input.get("connect") or []:
                device_id, _, list_id = key.partition("/")
                try:
                    app_lists.connect(self.hass, device_id, list_id)
                except ValueError:
                    continue
            return self._done()
        open_rows = [r for r in rows if not r["connected"]]
        done = [r for r in rows if r["connected"]]
        listing = "\n".join(f"- {'✅' if r['connected'] else '➕'} **{r['name']}** ({r['device_name']}): "
                             f"{', '.join(r['sources'])}" for r in [*open_rows, *done]) or "—"
        options = [selector.SelectOptionDict(value=r["key"], label=f"{r['name']} – {r['device_name']}") for r in open_rows]
        schema = vol.Schema({vol.Optional("connect", default=[]): selector.SelectSelector(
            selector.SelectSelectorConfig(options=options, multiple=True, mode=selector.SelectSelectorMode.LIST))}) if options else vol.Schema({})
        return self.async_show_form(step_id="app_lists", data_schema=schema,
                                    description_placeholders={"count": str(len(rows)), "lists": listing})

    def _done(self) -> ConfigFlowResult:
        # Optionen unverändert lassen → kein unnötiges Neuladen der Integration
        return self.async_create_entry(data=dict(self.config_entry.options))

    async def async_step_naming(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Namenskonvention: welches Zeichen macht aus einem Wort welches Badge."""
        learning = _learning(self.hass)
        errors: dict[str, str] = {}
        if user_input is not None:
            rules = [
                {"prefix": user_input[field], "kind": kind}
                for kind, field in TAG_FIELDS.items()
                if user_input.get(field, OFF) != OFF
            ]
            try:
                learning.set_tag_rules(rules)
            except ValueError:
                errors["base"] = "duplicate_prefix"
            else:
                return self._done()
        current = {r["kind"]: r["prefix"] for r in learning.tag_rules}
        # feste Beschriftungen: Übersetzungs-Schlüssel dürfen kein "@" enthalten
        prefix_select = selector.SelectSelector(
            selector.SelectSelectorConfig(
                options=[
                    selector.SelectOptionDict(value=OFF, label="—"),
                    *(selector.SelectOptionDict(value=c, label=c) for c in itemtext.ALLOWED_PREFIXES),
                ],
                mode=selector.SelectSelectorMode.DROPDOWN,
            )
        )
        schema = vol.Schema(
            {vol.Required(field, default=current.get(kind, OFF)): prefix_select for kind, field in TAG_FIELDS.items()}
        )
        if user_input is not None:
            schema = self.add_suggested_values_to_schema(schema, user_input)
        return self.async_show_form(step_id="naming", data_schema=schema, errors=errors)

    async def async_step_controls(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Bedienung – Standard für alle, die nichts Eigenes eingestellt haben."""
        learning = _learning(self.hass)
        if user_input is not None:
            # Nur speichern, was vom eingebauten Wert abweicht → spätere Verbesserungen wirken weiter
            changed = {k: v for k, v in user_input.items() if UI_BUILTIN.get(k) != v}
            learning.set_ui_defaults(changed, "")
            return self._done()
        cur = {**UI_BUILTIN, **learning.ui_defaults}
        schema = vol.Schema(
            {
                vol.Required("press_gesture", default=cur["press_gesture"]): _select(
                    ["long", "double", "right", "off"], "press_gesture", dropdown=True
                ),
                vol.Required("press_target", default=cur["press_target"]): _select(["row", "name"], "press_target"),
                vol.Required("press_result", default=cur["press_result"]): _select(
                    ["menu", "edit", "delete"], "press_result"
                ),
                vol.Required("menu_actions", default=cur["menu_actions"]): _select(
                    list(MENU_ACTIONS), "menu_actions", multiple=True
                ),
                vol.Required("row_buttons", default=cur["row_buttons"]): selector.BooleanSelector(),
                vol.Required("shop_hide_checked", default=cur["shop_hide_checked"]): selector.BooleanSelector(),
                vol.Required("shop_keep_awake", default=cur["shop_keep_awake"]): selector.BooleanSelector(),
                vol.Required("shop_large", default=cur["shop_large"]): selector.BooleanSelector(),
                vol.Required("shop_tap_row", default=cur["shop_tap_row"]): selector.BooleanSelector(),
            }
        )
        return self.async_show_form(step_id="controls", data_schema=schema)

    async def async_step_learned(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Gemerkte Kategorien ansehen und einzelne vergessen; Verlauf zurücksetzen."""
        learning = _learning(self.hass)
        if user_input is not None:
            for word in user_input.get("forget", []):
                learning.forget(word)
            if user_input.get("clear_history"):
                learning.clear_history()
            return self._done()
        learned = learning.learned_list()
        options = [
            selector.SelectOptionDict(value=entry["word"], label=f'{entry["word"]} → {entry["label"]}')
            for entry in learned
        ]
        fields: dict[Any, Any] = {}
        if options:
            fields[vol.Optional("forget", default=[])] = selector.SelectSelector(
                selector.SelectSelectorConfig(options=options, multiple=True, mode=selector.SelectSelectorMode.LIST)
            )
        fields[vol.Optional("clear_history", default=False)] = selector.BooleanSelector()
        return self.async_show_form(
            step_id="learned",
            data_schema=vol.Schema(fields),
            description_placeholders={"count": str(len(learned)), "history": str(len(learning.history))},
        )

    async def async_step_devices(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Verbundene Geräte (App-Installationen) ansehen und aus der Liste nehmen."""
        from datetime import datetime

        devices = self.hass.data[DOMAIN]["devices"]
        if user_input is not None:
            for device_id in user_input.get("remove", []):
                devices.remove(device_id)
            return self._done()
        entries = devices.entries()

        def ago(ts: int | None) -> str:
            if not ts:
                return "?"
            return datetime.fromtimestamp(ts).strftime("%d.%m.%Y %H:%M")

        lines = [
            f"• **{d['name']}** ({d.get('model') or '?'}) – {d.get('user_name') or '?'}, App {d.get('app_version') or '?'}, "
            f"Android {d.get('os_version') or '?'}, zuletzt {ago(d['last_seen'])}" + (" ⚠️" if d["stale"] else "")
            for d in entries
        ]
        fields: dict[Any, Any] = {}
        if entries:
            fields[vol.Optional("remove", default=[])] = selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=[selector.SelectOptionDict(value=d["device_id"], label=f"{d['name']} ({d.get('user_name') or '?'})") for d in entries],
                    multiple=True,
                    mode=selector.SelectSelectorMode.LIST,
                )
            )
        return self.async_show_form(
            step_id="devices",
            data_schema=vol.Schema(fields),
            description_placeholders={"count": str(len(entries)), "devices": "\n".join(lines) or "–"},
        )

    async def async_step_automation(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Sprache & Automationen: Standard-Liste für Assist, fällige Artikel automatisch, Assist-Sätze."""
        from .automation import async_install_sentences

        learning = _learning(self.hass)
        if user_input is not None:
            learning.set_automation(
                {k: user_input.get(k) for k in ("voice_default_list", "auto_due_list")}
            )
            if user_input.get("install_sentences"):
                await async_install_sentences(self.hass)
            return self._done()
        cur = learning.automation
        fields: dict[Any, Any] = {}
        for key in ("voice_default_list", "auto_due_list"):
            fields[vol.Optional(key, description={"suggested_value": cur.get(key)})] = _todo_selector(False, _notes_ids(self.hass))
        fields[vol.Optional("install_sentences", default=False)] = selector.BooleanSelector()
        due = learning.due_items()
        return self.async_show_form(
            step_id="automation",
            data_schema=vol.Schema(fields),
            description_placeholders={
                "due": ", ".join(f"{d['name']} (alle {d['every_days']:g} Tage)" for d in due[:8]) or "–",
            },
        )
