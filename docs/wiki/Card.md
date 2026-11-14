# Card `custom:smartlists-card`

```yaml
type: custom:smartlists-card
entity: todo.weekly_shop
```

The visual editor starts with the essentials (preset, list, title, view, sort). Turn on
*Show advanced options* for everything else. Only values that differ from the defaults are saved.

## Presets

| Preset | Sets |
|---|---|
| Family shopping | list view, filter bar, input, suggestions, stepper |
| Kitchen tablet | tiles, large rows, bigger font, no import / settings |
| In the store | starts in shopping mode, no input, large rows |
| View only | no input, stepper, import, settings, undo or shopping button |
| Compact dashboard tile | mini view, compact rows |

## Options

| Option | Default | Values |
|---|---|---|
| `entity` | – | one to-do list |
| `entities` | – | several lists; `- todo.a` or `- entity: todo.b` with own `title` / filters |
| `layout` | `tabs` | `tabs`, `columns`, `stack` (several lists) |
| `title` | list name | text |
| `view` | `list` | `list`, `tiles`, `mini`, `mealplan` (only the week plan; `entity` = default list for the ingredients, optional) |
| `sort` | `category` | `category`, `alpha`, `added`, `list` (combined lists) |
| `filter_store` / `filter_person` / `filter_tag` | – | e.g. `REWE`, `Anna`, `bio`; several with commas |
| `filter_category` | – | list of category ids, e.g. `[kuehlung, tiefkuehl]` |
| `filter_offers` | `false` | only offers from the app |
| `filter_tags_new_items` | `true` | new items get the single filter tag (`@REWE`) automatically |
| `show_filter_chips` | `false` | filter bar with stores, persons, tags and offers on the list |
| `density` | `normal` | `compact`, `normal`, `comfortable` |
| `font_scale` | `1` | 0.8 – 1.6 |
| `radius` | theme | corner radius in px |
| `accent_color` | theme | colour picker or `"#1747B5"` |
| `max_height` | – | list height in px (scrolls) |
| `drag_drop` | `true` | drag items to another list / reorder |
| `start_shopping` | `false` | open in shopping mode |
| `show_header`, `show_count`, `show_search`, `show_sort`, `show_shopping`, `show_undo`, `show_import`, `show_settings` | `true` | header elements |
| `show_add`, `show_frequent` | `true` | input and "frequently bought" |
| `show_stepper`, `show_offer`, `show_tags`, `show_source`, `show_note`, `show_category_titles` | `true` | list elements |
| `show_completed`, `collapse_completed` | `true` | completed section |

Category ids: `obst_gemuese`, `fleisch`, `kuehlung`, `grundnahrung`, `backwaren`, `getraenke`,
`suessigkeiten`, `haushalt`, `drogerie`, `tiefkuehl`, `tierbedarf`, `sonstiges`.

## Examples

### Standard list · default

<img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/card-list.svg" alt="Standard list · default" width="440">

```yaml
type: custom:smartlists-card
entity: todo.weekly_shop
```

### Tiles · kitchen tablet

<img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/card-tiles.svg" alt="Tiles · kitchen tablet" width="440">

```yaml
type: custom:smartlists-card
entity: todo.weekly_shop
view: tiles
font_scale: 1.2
```

### Mini · compact dashboard tile

<img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/card-mini.svg" alt="Mini · compact dashboard tile" width="440">

```yaml
type: custom:smartlists-card
entity: todo.weekly_shop
view: mini
density: compact
```

### Store card · only one store, starts in shopping mode

<img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/card-store.svg" alt="Store card · only one store, starts in shopping mode" width="440">

```yaml
type: custom:smartlists-card
entity: todo.weekly_shop
filter_store: Market A
start_shopping: true
show_add: false
```

### Several lists · side by side or as tabs

<img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/card-columns.svg" alt="Several lists · side by side or as tabs" width="440">

```yaml
type: custom:smartlists-card
entities:
  - todo.anna
  - entity: todo.max
    title: Max (drugstore)
    filter_category: [drogerie]
layout: columns   # or tabs / stack
```

### Meal plan · week plan only

<img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/card-mealplan.svg" alt="Meal plan · week plan only" width="440">

```yaml
type: custom:smartlists-card
view: mealplan
entity: todo.weekly_shop   # list for the ingredients
```

### Statistics · expenses and most bought

<img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/card-stats.svg" alt="Statistics · expenses and most bought" width="440">

```yaml
type: custom:smartlists-card
entity: todo.weekly_shop
settings_only: true
settings_scope: stats
```

### View only · e.g. a wall display

<img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/card-readonly.svg" alt="View only · e.g. a wall display" width="440">

```yaml
type: custom:smartlists-card
entity: todo.weekly_shop
show_add: false
show_settings: false
show_shopping: false
show_stepper: false
```

More examples:

Store card that only shows REWE items; new items get `@REWE`:

```yaml
type: custom:smartlists-card
entity: todo.weekly_shop
filter_store: REWE
start_shopping: true
show_import: false
```

Two lists side by side:

```yaml
type: custom:smartlists-card
entities:
  - todo.anna
  - entity: todo.max
    title: Max (drugstore only)
    filter_category: [drogerie]
layout: columns
```

## Using the card

<img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/input.svg" alt="Input with preview and suggestions" width="460"> <img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/shopping-mode.svg" alt="Shopping mode" width="240">

- **Input**: type `2 kg Äpfel @REWE` – quantity, unit, store and category are recognised. ↑/↓, Tab
  and Enter pick suggestions; tap the category chip to change it (remembered for similar items).
- **Long press** (or right click / double click, see the gear menu) opens the item menu: edit, move,
  copy, change category, delete, **select**.
- **Select several**: *Select* in the item menu or *⋯ → Select several*. Tap rows to mark them; the bar at the
  top moves, copies, checks off or deletes all marked items at once (*All* / *None*, ✕ ends it). ↶ undoes it.
- **Price in the text**: `Milk 2 l 1,19€ @REWE` – the price (anywhere in the text, also `€1.19` or
  `1.19 EUR`) is shown in the preview, saved as price (per unit) and not kept in the item name. Works
  when adding and when editing.
- **Drag & drop** with the mouse: onto another SmartLists card to move (Ctrl/Alt = copy), onto an item in
  the same list to reorder (sort "added").
- **Shopping mode** (cart icon): screen stays on, checked items are hidden, large rows (or the normal size –
  *For me → Shopping and scanning → Large rows*). **Tap anywhere on a row to check it off**, not only the
  box. Editing is locked so a slip cannot rename anything: no item menu, no edit, no quantity stepper, no
  dragging. Every check-off shows an **Undo** bar at the bottom for 3 seconds; ↶ in the header undoes the last
  change as well. A bar shows **All | REWE · 4 | Lidl · 2 …** – tap a store
  to see only its items. If stores are linked to zones (*General settings → Global → Stores & zones*), the store
  whose zone you are in is selected automatically. Items without `@store` are shown as well (on by
  default; switch off under *For me* → "Also show items without a store").
- **Offline**: without a connection (e.g. in the store) the list keeps working from the copy on the device – check
  off, add, edit and delete are collected ("📴 offline · 3" in the header) and sent in order once Home Assistant is
  reachable again. This works while the page stays open; collected changes also survive a reload.
- **Header**: search, undo (when possible), shopping mode and **⋯**. The ⋯ menu holds sort order, import,
  templates, meal plan, the **general settings** and the settings window of **this list**. On the sidebar
  page the general settings are the ⚙ at the top right. See [[Settings]].
- **Frequently bought** (empty input): due items by your buying rhythm first, marked ⏰.
- Starting the **shopping mode** fires `smartlists_shopping` – see [[Automations and voice]].

## Stores & zones

*General settings → Global → Stores & zones* (admins) lists the stores you use (`@REWE`, `@Lidl`, …) and the known
chains. Each store can have **several zones** (one per branch – REWE Nord, REWE Süd, …): pick existing
Home Assistant zones via *＋ Zone* (× unlinks one) or choose *＋ New zone …*: a dialog asks for the name, **where** (current location of this device,
home, pick on the map – if Home Assistant's map editor is available – or coordinates / a link from
Google Maps, Apple Maps or OpenStreetMap) and the radius. Fine-tune zones under *Settings → Areas & zones*.
If a zone with the same name already exists (e.g. a second "REWE"), SmartLists asks: **keep the name** (two
zones with the same name – they are then shown with their entity ID so you can tell them apart) or **rename**
the new one (e.g. "REWE Downtown"). *＋ Store with zone* adds a new store right away. Your person must be tracked (companion app) for the
automatic selection.

## Home screen widgets

Outside the dashboard, every SmartLists list also works in the **To-do list widget** of the official Home
Assistant companion apps, because each list is a real `todo.*` entity – nothing to set up in SmartLists.

- **Android:** long-press the home screen → *Widgets* → *Home Assistant* → **To-do list** → pick the list
  (e.g. a combined list). Items can be checked off in the widget.
- **iOS / iPadOS:** *Edit* → *Add widget* → *Home Assistant* → **To-do List** → choose the list.

**Nicer on Android – Template widget:** the To-do widget cannot be styled, but the app's *Template* widget shows
formatted text. Every SmartLists list (combined and own lists) provides it ready-made in the attribute `widget`:
grouped by category, store/person/tag badges in colour, quantities behind the item.

1. Long-press the home screen → *Widgets* → *Home Assistant* → **Template**.
2. Template: `{{ state_attr('todo.weekly_shop', 'widget') }}` (your list's entity ID).
3. Optionally choose text size and background, save.

Tapping the widget can open the SmartLists page (widget setting *tap action*); checking off happens there. Android
refreshes widgets at intervals, not instantly. Regular to-do lists (e.g. Local To-do) have no `widget` attribute –
combine them into a SmartLists list first.

Details: [Android widgets](https://companion.home-assistant.io/docs/integrations/android-widgets/),
[iOS widgets](https://companion.home-assistant.io/docs/integrations/ios-widgets/). The widget shows the plain
item text; badges and categories are only in the card, the sidebar page and the HA SmartLists app.

## Styling

CSS variables for themes and card-mod: `--smartlists-accent`, `--smartlists-radius`,
`--smartlists-row-height`, `--smartlists-tile-size`.
