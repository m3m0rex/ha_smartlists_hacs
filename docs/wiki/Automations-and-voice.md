# Automations and voice

## "I'm at the store" notification

When someone starts the **shopping mode** (cart icon in the card, or in the app), SmartLists fires the
event `smartlists_shopping`:

```yaml
event_type: smartlists_shopping
data:
  active: true            # false when the shopping mode ends
  entity_id: todo.weekly_shop
  list_name: Weekly shop
  store: REWE             # the card's fixed store filter, if any
  user_id: "…"
  user_name: Anna
  open_items: 7
```

Ready-made blueprint: **[shopping_notify.yaml](https://github.com/m3m0rex/ha_smartlists/blob/main/blueprints/automation/smartlists/shopping_notify.yaml)**
– *Settings → Automations → Blueprints → Import blueprint* and paste the URL. It notifies the others
("Anna is shopping at REWE – anything else?") with a reply field; the reply is added to that list.

## Store reminder

Blueprint **[store_reminder.yaml](https://github.com/m3m0rex/ha_smartlists/blob/main/blueprints/automation/smartlists/store_reminder.yaml)**:
when a person enters a store zone (create one under *Settings → Areas, labels & zones → Zones*, e.g.
`zone.rewe`) and items with `@REWE` are open, they get the list.

## Action `smartlists.get_items`

Returns open items (with response) – for your own automations and scripts:

```yaml
action: smartlists.get_items
data:
  store: REWE          # optional: person, tag, category, entity_id (list of lists), include_completed
response_variable: result
# result.items[] → list, name, quantity, unit, category, stores, persons, offer, …
# result.count, result.spoken ("2 kg Äpfel, Milch und Brot")
```

## Due items (recurring purchases)

SmartLists remembers when items are added. After three purchases it knows the usual interval
("milk about every 4 days"). Due items show with ⏰ first in "frequently bought" when the input is
empty. Optionally they are added automatically every hour: *General settings → Global → Voice, backup, defaults →
Automatically add due items to this list*. Like "frequently bought", due items are taken from the history of that
list (or of all lists, depending on the list's setting *Bought often & suggestions*). Removing such an item is fine – it comes back only after
the next purchase cycle. Action `smartlists.add_due_items` does the same on demand.

## Assist (voice)

*General settings → Global → Voice, backup, defaults*: choose the **default list for Assist** and tick **Install Assist
sentences** (copies the sentences for German, English, French, Spanish, Italian and Polish to
`config/custom_sentences/` and reloads Assist). Assist answers in the language of the conversation.

| German | English |
|---|---|
| „Setz 2 kg Äpfel bei REWE auf die Einkaufsliste“ | "Add 2 kg apples from REWE to the shopping list" |
| „Wir brauchen Milch“ | "We need milk" |
| „Was steht auf der Einkaufsliste?“ | "What's on the shopping list?" |
| „Was muss ich bei REWE kaufen?“ | "What do I need at REWE?" |

French: « Ajoute du lait à la liste de courses », « Qu'est-ce qu'il y a sur la liste de courses ? » ·
Spanish: «Añade leche a la lista de la compra», «¿Qué hay en la lista de la compra?» ·
Italian: «Aggiungi latte alla lista della spesa», «Cosa c'è nella lista della spesa?» ·
Polish: „Dodaj mleko do listy zakupów”, „Co jest na liście zakupów?”

Quantity, unit (usual unit if only a number is said), store and category are recognised like in the
card. Re-install the sentences after an update to get new ones.
