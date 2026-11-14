"""Text für das *Template*-Widget der Home-Assistant-App (Android): die Liste hübsch, wie in der Karte.

Das To-do-Widget der App lässt sich nicht gestalten. Das Template-Widget zeigt dagegen formatierten Text (einfaches
HTML: <b>, <small>, <big>, <font color>, <br>). Jede SmartLists-Liste (kombiniert und eigene) bekommt deshalb das
Attribut ``widget`` mit fertig gestaltetem Text – nach Kategorie gruppiert, Märkte/Personen/Schlagwörter farbig,
Mengen dahinter. Im Widget genügt dann:

    {{ state_attr('todo.wocheneinkauf', 'widget') }}

Das Attribut wird nicht in der Datenbank (Recorder) gespeichert. Einfache Listen bzw. Listen ohne Kategorien
erscheinen ohne Gruppen.
"""

from __future__ import annotations

from html import escape
from typing import Any

from homeassistant.core import HomeAssistant

from .const import DOMAIN

MAX_ITEMS = 40
DIM = "#9aa0a6"
PERSON = "#7b61ff"
TAG = "#2e9d5b"


def _fmt_qty(info: dict[str, Any]) -> str:
    q = info.get("quantity")
    if q is None:
        return ""
    qty = f"{q:g}".replace(".", ",") if isinstance(q, (int, float)) else str(q)
    pack = info.get("pack_count") or 1
    return (f"{pack}× " if pack > 1 else "") + qty + (f" {info['unit']}" if info.get("unit") else "")


def _tags(tags: list[dict[str, Any]], look: dict[str, Any]) -> str:
    from .itemtext import store_display

    out = []
    for t in tags or []:
        kind = t.get("kind")
        value = str(t.get("value") or "")
        custom = (look.get("values") or {}).get(f"{'store' if kind == 'store' else kind}:{value.lower()}") or {}
        kinds = (look.get("kinds") or {}).get(kind if kind in ("store", "person") else "tag") or {}
        if kind == "store":
            label, color = store_display(value)
            label, color = custom.get("label") or label, custom.get("color") or color or kinds.get("color") or "#607d8b"
            out.append(f'<font color="{escape(color)}"><b>{escape(label.upper())}</b></font>')
        elif kind == "person":
            color = custom.get("color") or kinds.get("color") or PERSON
            out.append(f'<font color="{escape(color)}">👤 {escape(t.get("label") or value)}</font>')
        else:
            color = custom.get("color") or kinds.get("color") or TAG
            out.append(f'<font color="{escape(color)}">#{escape(t.get("label") or value)}</font>')
    return " ".join(out)


def build_widget(hass: HomeAssistant, entity_id: str, title: str, items: list[tuple[str, bool]]) -> str:
    """items: (Artikeltext, abgehakt). Liefert den Text für das Template-Widget (nur offene Artikel)."""
    data = hass.data.get(DOMAIN, {})
    learning = data.get("learning")
    extras = data.get("extras")
    if learning is None:
        return ""
    settings = (extras.list_settings.get(entity_id) if extras else None) or {}
    grouped = not settings.get("plain") and settings.get("categories") is not False and settings.get("sort") in (None, "category")
    look = getattr(learning, "appearance", None) or {}
    open_items = [text for text, checked in items if not checked]
    head = f"<b><big>{escape(title)}</big></b> <small><font color=\"{DIM}\">· {len(open_items)}</font></small>"
    rows: list[tuple[str, str]] = []  # (Kategorie, Zeile)
    for text in open_items[:MAX_ITEMS]:
        info = learning.describe(text)
        line = "☐ " + escape(info.get("name") or text)
        extra = _tags(info.get("tags") or [], look)
        if extra:
            line += " " + extra
        qty = _fmt_qty(info)
        if qty:
            line += f' <font color="{DIM}">{escape(qty)}</font>'
        rows.append((info.get("category") or "sonstiges", line))
    lines = [head]
    if grouped:
        language = getattr(getattr(hass, "config", None), "language", None)
        order = learning.categories.as_list(language)
        for cat in order:
            chunk = [line for cid, line in rows if cid == cat["id"]]
            if chunk:
                lines.append(f'<small><font color="{DIM}"><b>{escape(str(cat["label"]).upper())}</b></font></small>')
                lines += chunk
        known = {c["id"] for c in order}
        lines += [line for cid, line in rows if cid not in known]
    else:
        lines += [line for _cid, line in rows]
    if len(open_items) > MAX_ITEMS:
        lines.append(f'<small><font color="{DIM}">+ {len(open_items) - MAX_ITEMS}</font></small>')
    if not open_items:
        lines.append(f'<font color="{DIM}">✓</font>')
    return "<br>".join(lines)
