"""To-do-Plattform: kombinierte Listen und eigene Listen (mit Besitzer/Freigaben)."""

from __future__ import annotations

import asyncio
from datetime import timedelta
import datetime
import logging
import re
from typing import Any

from homeassistant.components.todo import (
    DOMAIN as TODO_DOMAIN,
    TodoItem,
    TodoItemStatus,
    TodoListEntity,
    TodoListEntityFeature,
)
from homeassistant.config_entries import ConfigEntry, ConfigSubentry
from homeassistant.const import ATTR_ENTITY_ID, ATTR_FRIENDLY_NAME, EVENT_CALL_SERVICE
from homeassistant.core import Event, EventStateChangedData, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.helpers.debounce import Debouncer
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_track_state_change_event, async_track_time_interval
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util, slugify

from .categories import CategoryIndex
from .itemtext import join_offer, offer_summary, person_from_list_name, split_offer
from .learning import Learning
from .own import async_user_info, permissions_for, role_for
from .const import (
    CONF_APP_DEVICE,
    CONF_APP_LIST,
    CONF_DEFAULT_ADD,
    CONF_FOREIGN,
    CONF_MODE,
    CONF_LABEL_COLORS,
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
    LEGACY_UNIQUE_ID,
    SIGNAL_LEARNING_CHANGED,
    SUBENTRY_COMBINED,
    SUBENTRY_OWN,
    SUBENTRY_OWN_GROUP,
    STORAGE_VERSION,
    UID_SEPARATOR,
)

_LOGGER = logging.getLogger(__name__)

SUFFIX_SEPARATOR = " · "
# Automatische Farben der Herkunfts-Badges (je Quell-Liste eine andere)
LABEL_PALETTE = ["#1e88e5", "#e53935", "#43a047", "#fb8c00", "#8e24aa", "#00acc1", "#6d4c41", "#d81b60", "#7cb342", "#3949ab"]


def _tidy_label(text: str) -> str:
    """Trennzeichen am Rand entfernen („- Admin Angebote“ → „Admin Angebote“)."""
    return re.sub(r"^[\s\-–—·:|]+|[\s\-–—·:|]+$", "", text) or text
PREFIX_TEMPLATE = "[{}] "
# Fallback für Integrationen, die Änderungen ohne Zustandswechsel melden (z.B. reine Umbenennungen).
FALLBACK_REFRESH = timedelta(minutes=5)


def _age_seconds(set_at: Any) -> float:
    """Alter des Entity-Context in Sekunden. Home Assistant speichert den Zeitpunkt je nach Version als
    datetime (älter) oder als time.time()-Zahl (neuer) – beides muss gehen, sonst schlägt jedes Abhaken,
    Hinzufügen und Löschen in eigenen Listen fehl."""
    import time

    if isinstance(set_at, (int, float)):
        return time.time() - float(set_at)
    if isinstance(set_at, datetime.datetime):
        now = dt_util.utcnow() if set_at.tzinfo else datetime.datetime.utcnow()
        return (now - set_at).total_seconds()
    return float("inf")


def _status_text(status: Any) -> str | None:
    """TodoItemStatus oder str → "needs_action"/"completed" (None bleibt None)."""
    if status is None:
        return None
    return str(getattr(status, "value", status))


def list_key(subentry: ConfigSubentry) -> str:
    """Stabiler Schlüssel je kombinierter Liste (unique_id der Entität, Name der Speicherdatei).
    Nach der Migration aus 1.1 bleibt der alte Schlüssel, damit entity_id und Häkchen erhalten bleiben."""
    return str(subentry.data.get(LEGACY_UNIQUE_ID) or subentry.subentry_id)


_MODEL = {
    "de": ("Eigene Liste", "Kombiniert aus"), "en": ("Own list", "Combined from"), "fr": ("Liste propre", "Combinée de"),
    "es": ("Lista propia", "Combinada de"), "it": ("Lista propria", "Combinata da"), "pl": ("Własna lista", "Połączona z"),
}


def list_device(hass: HomeAssistant, key: str, title: str, entity_id: str, sources: list[str] | None = None,
                via: tuple[str, str] | None = None) -> DeviceInfo:
    """Ein Gerät je SmartLists-Liste. So erscheint unter jedem Unter-Eintrag der Integration ein anklickbarer
    Eintrag: bei kombinierten Listen mit den Quell-Listen als Modell, „Besuchen“ öffnet die Liste auf /smartlists."""
    own_label, combined_label = _MODEL.get((hass.config.language or "en").split("-")[0], _MODEL["en"])
    if sources is None:
        model = own_label
    else:
        names = []
        for s in sources:
            st = hass.states.get(s)
            names.append(str(st.attributes.get(ATTR_FRIENDLY_NAME)) if st and st.attributes.get(ATTR_FRIENDLY_NAME) else s.split(".", 1)[-1])
        model = f"{combined_label}: {', '.join(names)}" if names else combined_label
    info = DeviceInfo(
        identifiers={(DOMAIN, f"list_{key}")},
        name=title,
        manufacturer="SmartLists",
        model=model[:250],
        configuration_url=f"homeassistant://smartlists?list={entity_id}",
    )
    if via:
        info["via_device"] = via
    return info


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    """Je kombinierter Liste (Unter-Eintrag) eine To-do-Entität."""
    learning: Learning = hass.data[DOMAIN]["learning"]
    for subentry in entry.subentries.values():
        if subentry.subentry_type == SUBENTRY_OWN_GROUP:
            # je Besitzer ein Unter-Eintrag, darin seine Listen (own_groups.py)
            owner = subentry.data.get("owner")
            for list_id, ldata in (subentry.data.get("lists") or {}).items():
                own_store = Store(hass, STORAGE_VERSION, f"{DOMAIN}.own.{list_id}")
                own_stored = await own_store.async_load() or {}
                async_add_entities([OwnTodoListEntity(hass, subentry, own_store, own_stored, learning, list_id=list_id,
                                                      list_data={**ldata, "owner": owner})],
                                   config_subentry_id=subentry.subentry_id)
            continue
        if subentry.subentry_type == SUBENTRY_OWN:
            # alte Form (je Liste ein Unter-Eintrag) – nur, falls der Umzug nicht möglich war
            own_store = Store(hass, STORAGE_VERSION, f"{DOMAIN}.own.{subentry.subentry_id}")
            own_stored = await own_store.async_load() or {}
            async_add_entities([OwnTodoListEntity(hass, subentry, own_store, own_stored, learning)],
                               config_subentry_id=subentry.subentry_id)
            continue
        if subentry.subentry_type != SUBENTRY_COMBINED:
            continue
        key = list_key(subentry)
        store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, f"{DOMAIN}.{key}")
        stored = await store.async_load() or {}
        async_add_entities(
            [CombinedTodoListEntity(hass, dict(subentry.data), subentry.title, key, store, stored, learning)],
            config_subentry_id=subentry.subentry_id,
        )


class _AccessMixin:
    """Besitzer/Freigaben prüfen (eigene Listen immer, kombinierte Listen nur, wenn ein Besitzer gesetzt ist)."""

    data: dict[str, Any]
    _restrict_always = True

    # -------- Rechte --------
    async def role_of(self, user_id: str | None) -> str | None:
        is_admin, _ = await async_user_info(self.hass, user_id)
        return role_for(self.data, user_id, is_admin)

    def _request_user(self) -> tuple[bool, str | None]:
        """(bekannt, Benutzer-ID) der laufenden Anfrage.
        HA setzt den Context bei jedem Dienstaufruf neu. Er bleibt danach aber am Objekt stehen – deshalb
        nur verwenden, wenn er gerade erst gesetzt wurde, sonst würde eine spätere Anfrage ohne eigenen
        Context die Rechte der vorherigen erben."""
        ctx = self._context
        set_at = getattr(self, "_context_set", None)
        if ctx is None or set_at is None or _age_seconds(set_at) > 2:
            return False, None
        return True, ctx.user_id

    async def _require(self, perm: str) -> None:
        if not self._restrict_always and not self.data.get("owner"):
            return  # kombinierte Liste ohne Besitzer: für alle wie bisher
        known, user_id = self._request_user()
        if not known:
            # Kein frischer Context: nur bei harmlosem Umsortieren (HA-eigener WebSocket-Befehl ohne
            # Context) zulassen, alles andere verweigern.
            if perm == "reorder":
                return
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="not_permitted",
                                         translation_placeholders={"list": self.name or ""})
        if not permissions_for(await self.role_of(user_id))[perm]:
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="not_permitted",
                                         translation_placeholders={"list": self.name or ""})



class CombinedTodoListEntity(_AccessMixin, TodoListEntity):
    """Fasst mehrere To-do-Listen zu einer zusammen."""

    _attr_should_poll = False
    _attr_icon = "mdi:format-list-checks"
    _restrict_always = False

    def __init__(
        self,
        hass: HomeAssistant,
        opts: dict[str, Any],
        title: str,
        unique_id: str,
        store: Store[dict[str, Any]],
        stored: dict[str, Any],
        learning: Learning,
    ) -> None:
        self.hass = hass
        self._store = store
        self._learning = learning
        self._sources: list[str] = list(opts.get(CONF_SOURCES, []))
        self._foreign: set[str] = set(opts.get(CONF_FOREIGN, []))
        self._default_add: str | None = opts.get(CONF_DEFAULT_ADD) or None
        self._mode: str = opts.get(CONF_MODE, MODE_BIDIRECTIONAL)
        self._label: str = opts.get(CONF_SOURCE_LABEL, LABEL_SUFFIX)
        self._sort: str = opts.get(CONF_SORT, SORT_SOURCE)
        self._source_as_person: bool = bool(opts.get(CONF_SOURCE_AS_PERSON, True))
        self._label_show: str = opts.get(CONF_LABEL_SHOW) if opts.get(CONF_LABEL_SHOW) in ("list", "owner", "owner_list") else "list"
        self._label_sources: set[str] = set(opts.get(CONF_LABEL_SOURCES) or [])
        self._label_colors: dict[str, str] = {k: v for k, v in (opts.get(CONF_LABEL_COLORS) or {}).items()
                                              if isinstance(v, str) and re.fullmatch(r"#[0-9a-fA-F]{6}", v)}
        # Besitzer + Freigaben (optional; ohne Besitzer sehen/bearbeiten alle die Liste wie bisher)
        self.data: dict[str, Any] = {"owner": opts.get("owner") or None, "shares": dict(opts.get("shares") or {})}
        self._owner_name = ""
        # aus der App übernommen → Entität gehört zum Gerät (Gerät „App …“), die App blendet ihre eigene aus
        self._app_device: str | None = opts.get(CONF_APP_DEVICE) or None
        self._app_list: str | None = opts.get(CONF_APP_LIST) or None
        self._app_device_info = None
        if self._app_device:
            from .sensor import app_device_info

            # Gerät der App (z. B. „S24 Ultra“) – die Liste hängt als eigenes Gerät „über“ diesem Gerät
            self._app_device_info = app_device_info(hass, self._app_device)
        # Nur im Modus "lokal": abweichender Status je kombinierter UID.
        self._overrides: dict[str, str] = dict(stored.get("overrides", {}))
        # Zuordnung kombinierte UID -> (Quell-Entität, Quell-UID, Original-Name)
        self._index: dict[str, tuple[str, str, str]] = {}
        self._source_states: dict[str, dict[str, Any]] = {}
        # kombinierte UID → Beschreibung, wie sie in der Quelle steht (inkl. ⚙OFFER-Zeile der App)
        self._raw_desc: dict[str, str] = {}

        self._attr_unique_id = unique_id
        self._attr_name = title
        # Neue kombinierte Listen: todo.ha_smartlists_list_merged_<name> (wie die App ihre Listen benennt).
        # Gilt nur beim ersten Anlegen – bestehende Entitäten behalten ihre ID.
        self.entity_id = f"todo.ha_smartlists_list_merged_{slugify(title) or 'list'}"
        from .sensor import device_identifier

        self._attr_device_info = list_device(hass, unique_id, title, self.entity_id, self._sources,
                                             via=device_identifier(self._app_device) if self._app_device_info else None)
        self._attr_todo_items = []
        self._refresh_debouncer = Debouncer(
            hass, _LOGGER, cooldown=0.5, immediate=False, function=self._async_refresh
        )

        features = TodoListEntityFeature.UPDATE_TODO_ITEM | TodoListEntityFeature.DELETE_TODO_ITEM
        if self._default_add:
            features |= TodoListEntityFeature.CREATE_TODO_ITEM
        features |= TodoListEntityFeature.SET_DESCRIPTION_ON_ITEM
        self._attr_supported_features = features

    # ------------------------------------------------------------------
    # Lebenszyklus
    # ------------------------------------------------------------------
    async def async_added_to_hass(self) -> None:
        """Auf Änderungen der Quell-Listen hören und erstmalig laden."""
        await super().async_added_to_hass()
        # für die Karte (lists.py) auffindbar machen
        registry: dict[str, CombinedTodoListEntity] = self.hass.data[DOMAIN].setdefault("entities", {})
        registry[self.entity_id] = self
        self.async_on_remove(lambda: registry.pop(self.entity_id, None))
        if self.data.get("owner"):
            _, self._owner_name = await async_user_info(self.hass, self.data["owner"])
        if self._sources:
            self.async_on_remove(
                async_track_state_change_event(self.hass, self._sources, self._async_source_changed)
            )
            # Umbenennen/Beschreibung ändern ändert den Zustand (= Anzahl offener Artikel) nicht –
            # deshalb zusätzlich auf todo-Dienstaufrufe für unsere Quell-Listen hören.
            self.async_on_remove(
                self.hass.bus.async_listen(EVENT_CALL_SERVICE, self._async_service_called)
            )
            self.async_on_remove(
                async_track_time_interval(self.hass, self._async_interval_refresh, FALLBACK_REFRESH)
            )
        self.async_on_remove(self._refresh_debouncer.async_shutdown)
        # Kategorie gemerkt / Tag-Regeln geändert → Sortierung und Attribute neu berechnen
        self.async_on_remove(
            async_dispatcher_connect(self.hass, SIGNAL_LEARNING_CHANGED, self._async_learning_changed)
        )
        # Beim HA-Start können Quell-Listen noch fehlen – dann kommt der State-Change später.
        self.hass.async_create_task(self._async_refresh())

    @callback
    def _async_source_changed(self, event: Event[EventStateChangedData]) -> None:
        """Quell-Liste hat sich geändert (Zähler/Status) → neu laden."""
        self.hass.async_create_task(self._refresh_debouncer.async_call())

    @callback
    def _async_learning_changed(self) -> None:
        self.hass.async_create_task(self._refresh_debouncer.async_call())

    @callback
    def _async_service_called(self, event: Event[dict[str, Any]]) -> None:
        if event.data.get("domain") != TODO_DOMAIN:
            return
        targets = (event.data.get("service_data") or {}).get(ATTR_ENTITY_ID)
        if isinstance(targets, str):
            targets = [targets]
        if targets and any(t in self._sources for t in targets):
            self.hass.async_create_task(self._refresh_debouncer.async_call())

    async def _async_interval_refresh(self, _now: datetime.datetime) -> None:
        await self._refresh_debouncer.async_call()

    # ------------------------------------------------------------------
    # Für die Karte (lists.py)
    # ------------------------------------------------------------------
    def card_items(self) -> list[dict[str, Any]]:
        """Einträge mit Originaltext (ohne „· Anna“-Anhängsel), Quelle und Fremd-Kennzeichen."""
        out: list[dict[str, Any]] = []
        for item in self._attr_todo_items or []:
            if not item.uid or item.uid not in self._index:
                continue
            source, _source_uid, original = self._index[item.uid]
            out.append(
                {
                    "uid": item.uid,
                    "text": original,
                    "note": self._raw_desc.get(item.uid, item.description or ""),
                    "checked": item.status == TodoItemStatus.COMPLETED,
                    "source": self._source_label(source) if len(self._sources) > 1 else None,
                    "person": (person_from_list_name(label, source) if (label := self._source_label(source)) else None)
                    if self._source_as_person else None,
                    "person_color": self.source_color(source) if len(self._sources) > 1 else None,
                    "foreign": source in self._foreign,
                }
            )
        return out

    @property
    def source_names(self) -> list[str]:
        return [self._source_name(s) for s in self._sources]

    @property
    def source_info(self) -> list[dict[str, str]]:
        """Quell-Listen mit Entitäts-ID und Namen (für die Einstellungen der Herkunfts-Badges)."""
        return [{"entity_id": s, "name": self._source_name(s)} for s in self._sources]

    @property
    def label_settings(self) -> dict[str, Any]:
        return {"show": self._label_show, "sources": sorted(self._label_sources), "colors": dict(self._label_colors),
                "auto_colors": {s: self.source_color(s) for s in self._sources if s not in self._label_colors}}

    @property
    def all_foreign(self) -> bool:
        return bool(self._sources) and all(s in self._foreign for s in self._sources)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        items = self._attr_todo_items or []
        done = sum(1 for i in items if i.status == TodoItemStatus.COMPLETED)
        return {
            # Kennung für die App: diese Liste von SmartLists als Kombinierte Liste anzeigen
            "smartlists_combined": True,
            "source_lists": self._sources,
            "foreign_lists": sorted(self._foreign),
            "default_add_list": self._default_add,
            "mode": self._mode,
            **({"smartlists_app_list": f"{self._app_device}/{self._app_list}"} if self._app_device and self._app_list else {}),
            "open_items": len(items) - done,
            "completed_items": done,
            "unavailable_sources": [s for s in self._sources if s not in self._source_states],
            "open_by_category": self._open_by_category(items),
        }

    def _open_by_category(self, items: list[TodoItem]) -> dict[str, int]:
        counts: dict[str, int] = {}
        for item in items:
            if item.status == TodoItemStatus.COMPLETED or not item.uid or item.uid not in self._index:
                continue
            category_id = self._learning.resolve_text(self._index[item.uid][2])
            counts[category_id] = counts.get(category_id, 0) + 1
        return {
            self._learning.categories.label(cid): n
            for cid, n in sorted(counts.items(), key=lambda kv: self._learning.categories.rank(kv[0]))
        }

    # ------------------------------------------------------------------
    # Laden
    # ------------------------------------------------------------------
    def _source_name(self, entity_id: str) -> str:
        state = self.hass.states.get(entity_id)
        if state is not None:
            return str(state.attributes.get(ATTR_FRIENDLY_NAME) or entity_id)
        return entity_id

    async def _async_fetch_source(self, entity_id: str) -> list[dict[str, Any]] | None:
        state = self.hass.states.get(entity_id)
        if state is None or state.state in ("unavailable", "unknown"):
            return None
        try:
            response = await self.hass.services.async_call(
                TODO_DOMAIN,
                "get_items",
                {"entity_id": entity_id},
                blocking=True,
                return_response=True,
            )
        except (HomeAssistantError, ValueError) as err:
            _LOGGER.debug("Liste %s konnte nicht gelesen werden: %s", entity_id, err)
            return None
        data = (response or {}).get(entity_id) or {}
        items = data.get("items") if isinstance(data, dict) else None
        return list(items) if isinstance(items, list) else []

    def _display_description(self, combined_uid: str, raw: str | None) -> str | None:
        """Für die To-do-Ansicht von HA: ⚙OFFER-Zeile der App als lesbaren Text statt JSON."""
        self._raw_desc[combined_uid] = raw or ""
        clean, offer, raw_line = split_offer(raw)
        if not raw_line:
            return raw
        pretty = offer_summary(offer) if offer else ""
        return "\n".join(p for p in (clean, pretty) if p) or None

    def _source_label(self, source: str) -> str | None:
        """Text des Herkunfts-Badges einer Quell-Liste (None = dafür kein Badge).
        Anzeige (label_show): Listenname · Besitzer der Quell-Liste · „Besitzer Liste“. Nur Quell-Listen, die in
        label_sources stehen (leer = alle), bekommen ein Badge. Quell-Listen ohne Besitzer (Local To-do, Einkaufsliste …)
        zeigen immer den Listennamen."""
        if self._label_sources and source not in self._label_sources:
            return None
        name = self._source_name(source)
        if self._label_show == "list":
            return _tidy_label(name)
        own = self.hass.data.get(DOMAIN, {}).get("own", {}).get(source)
        owner = (getattr(own, "_owner_name", "") or "").strip()
        if not owner:
            return _tidy_label(name)
        if self._label_show == "owner":
            return owner
        clean = person_from_list_name(name, source) or name
        # steckt der Besitzer schon im Listennamen („Admin Angebote“), nicht doppelt nennen
        return _tidy_label(clean if clean.casefold().startswith(owner.casefold()) else f"{owner} {clean}")

    def source_color(self, source: str) -> str:
        """Farbe des Herkunfts-Badges: eigene Wahl, sonst automatisch je Quell-Liste (jede Liste ihre eigene)."""
        if source in self._label_colors:
            return self._label_colors[source]
        try:
            index = self._sources.index(source)
        except ValueError:
            index = 0
        return LABEL_PALETTE[index % len(LABEL_PALETTE)]

    def _display_summary(self, summary: str, source: str) -> str:
        if self._label == LABEL_NONE or len(self._sources) < 2:
            return summary
        name = self._source_label(source)
        if name is None:
            return summary
        if self._label == LABEL_PREFIX:
            return PREFIX_TEMPLATE.format(name) + summary
        return f"{summary}{SUFFIX_SEPARATOR}{name}"

    @staticmethod
    def _parse_due(raw: Any) -> datetime.date | datetime.datetime | None:
        if not raw or not isinstance(raw, str):
            return None
        if "T" in raw or " " in raw:
            parsed = dt_util.parse_datetime(raw)
            return dt_util.as_local(parsed) if parsed else None
        return dt_util.parse_date(raw)

    @callback
    def _update_device_model(self) -> None:
        """Beim Start fehlen manchmal noch die Namen der Quell-Listen → Modell (Quellen) später nachziehen."""
        entry = self.device_entry
        info = self._attr_device_info
        if entry is None or not info:
            return
        model = list_device(self.hass, self._attr_unique_id, self._attr_name or "", self.entity_id, self._sources)["model"]
        if entry.model != model:
            from homeassistant.helpers import device_registry as dr

            dr.async_get(self.hass).async_update_device(entry.id, model=model)

    async def _async_refresh(self) -> None:
        self._update_device_model()
        results = await asyncio.gather(*(self._async_fetch_source(s) for s in self._sources))
        index: dict[str, tuple[str, str, str]] = {}
        per_source: list[list[TodoItem]] = []
        states: dict[str, dict[str, Any]] = {}
        for source, items in zip(self._sources, results, strict=True):
            if items is None:
                per_source.append([])
                continue
            states[source] = {"count": len(items)}
            converted: list[TodoItem] = []
            for raw in items:
                uid = raw.get("uid")
                summary = raw.get("summary") or ""
                if not uid:
                    continue
                combined_uid = f"{source}{UID_SEPARATOR}{uid}"
                status = TodoItemStatus(raw.get("status") or TodoItemStatus.NEEDS_ACTION)
                if self._mode == MODE_LOCAL and combined_uid in self._overrides:
                    status = TodoItemStatus(self._overrides[combined_uid])
                index[combined_uid] = (source, uid, summary)
                converted.append(
                    TodoItem(
                        uid=combined_uid,
                        summary=self._display_summary(summary, source),
                        status=status,
                        description=self._display_description(combined_uid, raw.get("description")),
                        due=self._parse_due(raw.get("due")),
                    )
                )
            per_source.append(converted)

        flat = [item for chunk in per_source for item in chunk]
        if self._sort == SORT_ALPHABETICAL:
            flat.sort(key=lambda i: (index[i.uid][2].casefold() if i.uid else ""))
        elif self._sort == SORT_CATEGORY:
            cats = self._learning.categories
            resolve = self._learning.resolve_text
            flat.sort(
                key=lambda i: (
                    i.status == TodoItemStatus.COMPLETED,
                    cats.rank(resolve(index[i.uid][2])) if i.uid else 0,
                    index[i.uid][2].casefold() if i.uid else "",
                )
            )
        elif self._sort == SORT_STATUS:
            flat.sort(
                key=lambda i: (
                    i.status == TodoItemStatus.COMPLETED,
                    index[i.uid][2].casefold() if i.uid else "",
                )
            )

        # Lokale Häkchen für nicht mehr existierende Artikel aufräumen.
        stale = [uid for uid in self._overrides if uid not in index and uid.split(UID_SEPARATOR, 1)[0] in states]
        if stale:
            for uid in stale:
                self._overrides.pop(uid, None)
            self._save()

        self._index = index
        self._source_states = states
        self._attr_todo_items = flat
        self.async_write_ha_state()

    # ------------------------------------------------------------------
    # Änderungen
    # ------------------------------------------------------------------
    def _lookup(self, combined_uid: str | None) -> tuple[str, str, str]:
        if combined_uid and combined_uid in self._index:
            return self._index[combined_uid]
        raise ServiceValidationError(
            translation_domain=DOMAIN, translation_key="item_not_found", translation_placeholders={"uid": str(combined_uid)}
        )

    def _strip_label(self, summary: str, source: str) -> str:
        if self._label == LABEL_NONE or len(self._sources) < 2:
            return summary
        name = self._source_label(source)
        if name is None:
            return summary
        if self._label == LABEL_SUFFIX:
            suffix = f"{SUFFIX_SEPARATOR}{name}"
            if summary.endswith(suffix):
                return summary[: -len(suffix)]
        if self._label == LABEL_PREFIX:
            prefix = PREFIX_TEMPLATE.format(name)
            if summary.startswith(prefix):
                return summary[len(prefix) :]
        return summary

    def _save(self) -> None:
        self._store.async_delay_save(lambda: {"overrides": self._overrides}, 1.0)

    def _learning_off(self) -> bool:
        """Kombinierte Liste als „einfache Liste“ eingestellt → aus ihr nichts merken."""
        extras = self.hass.data.get(DOMAIN, {}).get("extras")
        return bool(extras and extras.is_plain(self.entity_id))

    async def _call(self, service: str, data: dict[str, Any]) -> None:
        # Kontext weitergeben: so wissen Benachrichtigungen und Verlauf, wer die Änderung gemacht hat
        await self.hass.services.async_call(TODO_DOMAIN, service, data, blocking=True, context=self._context)

    async def async_create_todo_item(self, item: TodoItem) -> None:
        """Neuer Artikel → Standard-Hinzufügeliste."""
        await self._require("add")
        if not self._default_add:
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="no_default_list")
        data: dict[str, Any] = {"entity_id": self._default_add, "item": item.summary or ""}
        if item.description:
            data["description"] = item.description
        await self._call("add_item", data)
        # gezählt bei der Liste, in der der Artikel landet (Vorschläge je Liste; die kombinierte sieht ihre Quellen)
        if not self._learning_off():
            self._learning.record(item.summary or "", self._default_add)
        await self._async_refresh()

    async def async_update_todo_item(self, item: TodoItem) -> None:
        """Abhaken / Umbenennen / Beschreibung ändern."""
        source, source_uid, original = self._lookup(item.uid)
        current = next((i for i in self._attr_todo_items or [] if i.uid == item.uid), None)
        renamed = item.summary is not None and current is not None and item.summary != current.summary
        redescribed = item.description is not None and current is not None and item.description != current.description
        await self._require("rename" if renamed or redescribed else "toggle")

        data: dict[str, Any] = {"entity_id": source, "item": source_uid}
        new_summary = self._strip_label(item.summary or "", source) if item.summary is not None else original
        if new_summary and new_summary != original:
            if source in self._foreign:
                raise ServiceValidationError(translation_domain=DOMAIN, translation_key="foreign_list")
            data["rename"] = new_summary
        if current is None or item.description != current.description:
            if item.description is not None:
                # lesbare Angebots-Zeile wieder gegen die originale ⚙OFFER-Zeile tauschen,
                # damit die App das Angebot weiter erkennt
                _, offer, raw_line = split_offer(self._raw_desc.get(item.uid))
                text = item.description
                if offer:
                    text = "\n".join(l for l in text.splitlines() if l.strip() != offer_summary(offer))
                data["description"] = join_offer(text, raw_line)

        # HA übergibt den Status je nach Version als TodoItemStatus oder als reinen Text ("completed")
        new_status = _status_text(item.status)
        status_changed = new_status is not None and (current is None or new_status != _status_text(current.status))
        if status_changed and self._mode == MODE_LOCAL:
            self._overrides[item.uid] = new_status  # type: ignore[index, assignment]
            self._save()
        elif status_changed:
            data["status"] = new_status

        if len(data) > 2:
            await self._call("update_item", data)
        await self._async_refresh()

    async def async_delete_todo_items(self, uids: list[str]) -> None:
        """Löschen – gruppiert je Quell-Liste. Fremde Listen sind geschützt."""
        await self._require("delete")
        grouped: dict[str, list[str]] = {}
        for uid in uids:
            source, source_uid, _ = self._lookup(uid)
            if source in self._foreign:
                raise ServiceValidationError(translation_domain=DOMAIN, translation_key="foreign_list")
            grouped.setdefault(source, []).append(source_uid)
            self._overrides.pop(uid, None)
        for source, items in grouped.items():
            await self._call("remove_item", {"entity_id": source, "item": items})
        self._save()
        await self._async_refresh()



# ----------------------------------------------------------------------
# Eigene Listen
# ----------------------------------------------------------------------
class OwnTodoListEntity(_AccessMixin, TodoListEntity):
    """Liste, die SmartLists selbst speichert – mit Besitzer und Freigaben (own.py)."""

    _attr_should_poll = False
    _attr_icon = "mdi:clipboard-account-outline"
    _attr_supported_features = (
        TodoListEntityFeature.CREATE_TODO_ITEM
        | TodoListEntityFeature.UPDATE_TODO_ITEM
        | TodoListEntityFeature.DELETE_TODO_ITEM
        | TodoListEntityFeature.MOVE_TODO_ITEM
        | TodoListEntityFeature.SET_DESCRIPTION_ON_ITEM
    )

    def __init__(self, hass: HomeAssistant, subentry: ConfigSubentry, store: Store[dict[str, Any]],
                 stored: dict[str, Any], learning: Learning, list_id: str | None = None,
                 list_data: dict[str, Any] | None = None) -> None:
        self.hass = hass
        self.subentry = subentry
        # ab 3.7: Liste innerhalb der Besitzer-Gruppe (list_id/list_data); vorher: der Unter-Eintrag selbst
        self.list_id: str = list_id or subentry.subentry_id
        self.grouped = list_id is not None
        self.data: dict[str, Any] = dict(list_data) if list_data is not None else dict(subentry.data)
        title = (list_data or {}).get("title") or subentry.title
        self._store = store
        self._learning = learning
        self._items: list[dict[str, Any]] = [i for i in stored.get("items", []) if i.get("uid")]
        self._attr_unique_id = f"own_{self.list_id}"
        self._attr_name = title
        # Neue eigene Listen: todo.ha_smartlists_list_<name> (gleiches Schema wie in der App). Aus einer gelöschten
        # Liste übernommen → deren Entitäts-ID weiterverwenden (Automationen, Dashboards und die App passen weiter)
        self.entity_id = self.data.get("entity_id") or f"todo.ha_smartlists_list_{slugify(title) or 'list'}"
        if self.grouped:
            # ein Gerät je Besitzer („Eigene Listen – Julian“) mit allen seinen Listen
            self._attr_device_info = DeviceInfo(identifiers={(DOMAIN, f"owner_{subentry.subentry_id}")}, name=subentry.title,
                                                manufacturer="SmartLists", model=_MODEL.get((hass.config.language or "en").split("-")[0], _MODEL["en"])[0],
                                                configuration_url="homeassistant://smartlists")
        else:
            self._attr_device_info = list_device(hass, f"own_{subentry.subentry_id}", title, self.entity_id)
        self._owner_name = ""
        self._share_names: dict[str, str] = {}

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        registry: dict[str, OwnTodoListEntity] = self.hass.data[DOMAIN].setdefault("own", {})
        registry[self.entity_id] = self
        self.async_on_remove(lambda: registry.pop(self.entity_id, None))
        _, self._owner_name = await async_user_info(self.hass, self.data.get("owner"))
        for uid, role in (self.data.get("shares") or {}).items():
            _, name = await async_user_info(self.hass, uid)
            self._share_names[name or uid] = role
        self.async_write_ha_state()

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        open_items = sum(1 for i in self._items if i.get("status") != TodoItemStatus.COMPLETED)
        return {
            "smartlists_own": True,
            "owner": self._owner_name,
            "shared_with": self._share_names,
            "open_items": open_items,
            "completed_items": len(self._items) - open_items,
        }

    # -------- Daten --------
    @property
    def todo_items(self) -> list[TodoItem]:
        return [
            TodoItem(uid=i["uid"], summary=i.get("summary", ""), status=TodoItemStatus(i.get("status") or TodoItemStatus.NEEDS_ACTION),
                     description=i.get("description") or None)
            for i in self._items
        ]

    def _save(self) -> None:
        self._store.async_delay_save(lambda: {"items": self._items}, 1.0)
        self.async_write_ha_state()

    def _find(self, uid: str | None) -> dict[str, Any]:
        for item in self._items:
            if item["uid"] == uid:
                return item
        raise ServiceValidationError(translation_domain=DOMAIN, translation_key="item_not_found",
                                     translation_placeholders={"uid": str(uid)})

    async def async_create_todo_item(self, item: TodoItem) -> None:
        await self._require("add")
        import uuid

        self._items.append({"uid": uuid.uuid4().hex, "summary": item.summary or "",
                            "status": _status_text(item.status) or "needs_action", "description": item.description or ""})
        self._learning.record(item.summary or "", self.entity_id)
        self._save()

    async def async_update_todo_item(self, item: TodoItem) -> None:
        current = self._find(item.uid)
        new_status = _status_text(item.status)
        content_changed = (item.summary is not None and item.summary != current.get("summary")) or (
            item.description is not None and (item.description or "") != (current.get("description") or "")
        )
        if content_changed:
            await self._require("rename")
        elif new_status is not None and new_status != current.get("status"):
            await self._require("toggle")
        if item.summary is not None:
            current["summary"] = item.summary
        if item.description is not None:
            current["description"] = item.description or ""
        if new_status is not None:
            current["status"] = new_status
        self._save()

    async def async_delete_todo_items(self, uids: list[str]) -> None:
        await self._require("delete")
        drop = set(uids)
        self._items = [i for i in self._items if i["uid"] not in drop]
        self._save()

    async def async_move_todo_item(self, uid: str, previous_uid: str | None = None) -> None:
        await self._require("reorder")
        item = self._find(uid)
        self._items.remove(item)
        index = 0
        if previous_uid:
            index = self._items.index(self._find(previous_uid)) + 1
        self._items.insert(index, item)
        self._save()
