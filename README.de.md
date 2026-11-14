<p align="center"><img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/custom_components/smartlists/brand/logo@2x.png" alt="SmartLists" height="96"></p>

# SmartLists – kombinierte To-do-Listen für Home Assistant

🇬🇧 [English version](README.md) · 📖 [Wiki (englisch)](https://github.com/m3m0rex/ha_smartlists/wiki) · 🔒 [Sicherheit](SECURITY.md) · 📝 [Änderungen](CHANGELOG.md)

<p align="center"><img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/demo-de.gif" alt="„Milch 2 l 1,19€ @REWE *Anna #bio“ eintippen: SmartLists erkennt Menge, Preis, Markt, Person, Schlagwort und Kategorie und sortiert den Artikel unter Kühlung ein" width="640"></p>

`Milch 2 l 1,19€ @REWE *Anna #bio` eintippen – SmartLists erkennt schon beim Tippen **Menge, Preis, Markt, Person,
Schlagwort und Kategorie** und sortiert den Artikel an die richtige Stelle. (`@`, `*` und `#` sind nur die
Vorgabe – die Zeichen legst du selbst fest.)

Eigenständige Home-Assistant-Integration (HACS), unabhängig von der HA-SmartLists-App.
Sie bringt die wichtigste Funktion der App direkt in Home Assistant: **mehrere To-do-Listen zu einer
gemeinsamen Liste zusammenführen** – z.B. die Einkaufslisten von Anna und Max zu einer Liste „Großeinkauf".

Die kombinierte Liste ist eine ganz normale To-do-Entität (`todo.grosseinkauf`). Sie funktioniert in der
To-do-Ansicht, auf Dashboards, mit Sprachassistenten, in Automationen und auch in der HA-SmartLists-App.

> ℹ️ **Die HA-SmartLists-App für Android ist noch nicht veröffentlicht.** Alles hier funktioniert ohne sie – in
> Home Assistant, in der Karte, auf der SmartLists-Seite und mit der offiziellen Home-Assistant-App. Was die App
> betrifft (Koppeln, verbundene Geräte, Notizen der App, Listen aus der App), wird erst wichtig, wenn sie verfügbar ist.

> 📱 **Funktioniert direkt mit den offiziellen Home Assistant Startbildschirm-Widgets!** Jede SmartLists-Liste
> ist eine echte `todo.*`-Entität – das **To-do-Listen-Widget** der Home-Assistant-App zeigt sie auf dem
> Android- oder iOS-Startbildschirm. Schneller Zugriff im Supermarkt, ohne etwas zu öffnen (unter Android lässt
> sich sogar direkt im Widget abhaken). Siehe [Startbildschirm-Widgets](#startbildschirm-widgets).

<p align="center"><img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/hero.svg" alt="SmartLists-Seite mit kombinierter Liste, Kategorien, Badges und Preisen"></p>

<table>
<tr>
<td width="62%" valign="top"><img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/input.svg" alt="Eingabe mit Vorschau und Vorschlägen"><br><sub>Ein Eingabefeld: Menge, Einheit, Preis, Markt und Kategorie werden beim Tippen erkannt.</sub></td>
<td width="38%" valign="top" align="center"><img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/shopping-mode.svg" alt="Einkaufsmodus am Gerät" width="240"><br><sub>Einkaufsmodus: große Zeilen, Markt-Leiste.</sub></td>
</tr>
</table>

## Das Wichtigste

| | |
|---|---|
| 🧺 **Listen zusammenfassen** | Die Listen von Anna und Max werden zu einer Liste „Großeinkauf“; Abhaken wirkt in der Original-Liste. |
| ⌨️ **Ein Eingabefeld** | Menge, Einheit, Preis, Markt, Person und Schlagwort werden beim Tippen erkannt – standardmäßig `@Markt`, `*Person`, `#Schlagwort`; die Zeichen lassen sich ändern oder abschalten (Namenskonvention). Vorschläge und „häufig gekauft“ je Liste. |
| 🗂️ **Kategorien** | Sortiert wie im Laden – Wortlisten in 6 Sprachen, gemerkte Korrekturen, Gang-Reihenfolge je Markt; je Liste abschaltbar. |
| 🛒 **Einkaufsmodus** | Große Zeilen (wählbar), ganze Zeile antippen zum Abhaken mit 3 s Rückgängig, Markt-Leiste, Markt per Zone. |
| 🔗 **Teilen** | Mit Personen in Home Assistant oder per **Link / QR-Code** – auf Wunsch über Quick Tunnel oder eigenen Proxy, damit deine HA-Adresse privat bleibt. |
| 📲 **Als App** | Die SmartLists-Seite als Symbol auf den Startbildschirm legen – öffnet eine Liste direkt im Einkaufsmodus. |

## Funktionen

- Beliebige To-do-Listen kombinieren: Shopping List, Local To-do, Google Tasks, Bring!, CalDAV und andere.
- **Abhaken, Umbenennen, Beschreibung ändern und Löschen** wirken direkt in der jeweiligen Ursprungsliste.
- **Neue Artikel** landen in einer wählbaren Standard-Liste.
- **Modus „Nur diese kombinierte Liste"**: Häkchen bleiben lokal in der kombinierten Liste, die
  Ursprungslisten werden nicht verändert. Das entspricht „Nur lokal" in der App.
- **Fremde Listen**: Artikel aus Listen anderer Personen kannst du nur abhaken, aber nicht
  umbenennen oder löschen.
- **Herkunft als Person**: Artikel aus `todo.peter` bekommen in Karte und Seite das Badge 👤 Peter
  (wie `*Peter`); Füllwörter wie „Einkaufsliste“ werden weggelassen. Pro Liste abschaltbar.
- **Herkunft anzeigen**: `Milch · Anna` oder `[Anna] Milch`; die Anzeige ist auch abschaltbar.
- **Sortierung**: nach Liste, nach Einkaufs-Kategorie, offene zuerst oder alphabetisch.
  Die Kategorie-Erkennung nutzt **Keyword-Packs**: eingebaut sind Deutsch (das Paket der App mit
  6.500 Begriffen und 1.049 Produkten) sowie Start-Packs für Englisch, Französisch, Spanisch,
  Italienisch und Polnisch (je ca. 400 Begriffe). Mehrere Packs können gleichzeitig aktiv sein, und
  Admins können im Zahnrad der Karte → *Global* → *Kategorien* **eigene Packs** (JSON) hochladen.
- Attribute für Dashboards und Automationen: `open_items`, `completed_items`, `open_by_category`,
  `source_lists`, `unavailable_sources`.
- „Erledigte entfernen" (`todo.remove_completed_items`) funktioniert über alle Quell-Listen hinweg.
- Aktualisiert sich automatisch, sobald sich eine Quell-Liste ändert.

## Gemeinsames Gedächtnis

Neu in 3.9: Teilen-Links über Cloudflare Quick Tunnel oder eigenen Proxy (deine HA-Adresse bleibt privat), Notizen und Wochenplan als optionale *Extras*, im Einkaufsmodus die ganze Zeile antippen (3 s Rückgängig), App-Symbol für den Startbildschirm, Vorschläge und „häufig gekauft“ je Liste, **einfache Listen** ohne Gedächtnis (z. B. Baumarkt), Kategorien je Liste abschaltbar, noch nicht übernommene App-Listen unter *Reparaturen*.

Neu in 3.5: vorhandene To-do-Listen (Einkaufsliste, Local To-do …) mit allen Artikeln in eigene SmartLists-Listen übernehmen – einzeln oder zusammen; die alten Listen bleiben unverändert, löschen kannst du sie danach selbst.

Neu in 3.4: Benachrichtigungen an mehrere Ziele – jeder notify-Dienst (Companion-App, Telegram, E-Mail …), notify-Entitäten und für Admins eigene Dienste.

Neu in 3.3: mehrere Artikel markieren (verschieben, kopieren, abhaken, löschen), Wochenplan als Tab auf der Seite /smartlists, Preise im Artikeltext („Milch 2 l 1,19€ @REWE“) werden erkannt.

Neu in 3.0: Wochenplan mit Kalender und Mealie-Import, Verlauf je Artikel, Einkaufs-Dashboard per Klick, Diagnose-Download und Hinweise unter *Reparaturen* – siehe [Wiki](https://github.com/m3m0rex/ha_smartlists/wiki/Shopping-helpers).


Gilt für alle Listen und alle HA-Benutzer, gespeichert in `.storage/smartlists.learning`:

- **Kategorien merken:** Wird ein Artikel einmal von Hand einer Kategorie zugeordnet, gilt das künftig
  auch für ähnliche Artikel („Hafermilch“ → Kühlung trifft später „Hafermilch Barista“). Reihenfolge wie
  in der App: gemerkt > gelernt > eingebautes Paket > Sonstiges. Die Sortierung „nach Kategorie“ und
  das Attribut `open_by_category` der kombinierten Listen nutzen das bereits.
- **Verlauf & Vorschläge:** Häufig und zuletzt gekaufte Artikel, Artikel der Liste und 1049 Produkte aus
  dem Paket der App; dazu die zuletzt benutzte bzw. übliche Einheit. Standardmäßig **je Liste** (eine
  kombinierte Liste zeigt, was in ihren Quell-Listen gekauft wurde); in den Einstellungen der Liste auf
  *aus allen Listen* umstellbar.
- **Einfache Liste:** Eine Liste wie „Baumarkt“ lässt sich als *einfache Liste* markieren – keine Kategorien,
  keine Vorschläge, und SmartLists merkt sich nichts daraus; „Holz“ taucht so in keiner anderen Liste auf.
  Nur die Kategorien lassen sich je Liste ebenfalls abschalten.
- **Namenskonvention:** `@REWE` wird zum Markt-Badge (bekannte Märkte in Markenfarbe), `*Anna` zur Person,
  `#bio` zum Schlagwort. Welches Zeichen was bedeutet, stellen Admins in der Karte ein (Zahnrad).
  Die Tags bleiben im Artikelnamen stehen – andere Oberflächen sehen sie also weiter als Text.
- **Automationen & Sprache:** „Bin im Laden“-Benachrichtigung, Markt-Erinnerung, wiederkehrende Artikel, Assist-Sätze – siehe [Wiki](https://github.com/m3m0rex/ha_smartlists/wiki/Automations-and-voice).
- **Eigene Listen mit Freigaben:** Listen mit Besitzer, pro Person freigegeben zum Sehen, Abhaken oder Bearbeiten – siehe [Wiki](https://github.com/m3m0rex/ha_smartlists/wiki/Own-lists-and-sharing).
- **Verbundene Geräte:** jedes Gerät mit der App erscheint unter *Einstellungen → Global → Geräte und Notizen* und als HA-Gerät mit den Sensoren *Zuletzt gesehen* und *App-Version*.
- **Bedienung:** Standard für alle (Admin) → je Benutzer abweichend → optional je Gerät abweichend.
- **Teilen:** mit Personen in Home Assistant (sehen, abhaken, bearbeiten) oder **per Link / QR-Code** – nur diese Liste,
  befristet, jederzeit zurückziehbar. Links laufen auf Wunsch über einen **Cloudflare Quick Tunnel, einen Cloudflare
  Tunnel mit fester Adresse auf deiner eigenen Domain oder einen eigenen Proxy** statt über die Adresse deines Home Assistant – wer den Link bekommt, erfährt sie nicht (siehe
  [Wiki](https://github.com/m3m0rex/ha_smartlists/wiki/Shopping-helpers#share-without-revealing-your-home-assistant-address)).
  👥 *geteilt* im Kopf einer Liste antippen zeigt, mit wem sie geteilt ist:

  <img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/share.svg" alt="Teilen-Fenster mit QR-Code, Rechten und Gültigkeit" width="620">

- **Einstellungen an einem Ort:** Bereiche *Für mich*, *Global* (Admins) und *Auswertung*, dazu ein Fenster je Liste:

  <img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/settings.svg" alt="Allgemeine Einstellungen mit Bereichen und zwei Spalten">

Mengen stehen wie in der App im Namen („Milch 2 l @REWE“). Beim Tippen wird auch „2 kg Äpfel“ erkannt.

**Extras – optional, für Einsteiger aus:** **Notizen** (Notizlisten als eigener Bereich 📝), der **Wochenplan**
(mit Kalender „Essensplan“ und Mealie-Import) sowie **Statistik und Ausgaben** braucht man für den Anfang nicht. Der Einrichtungs-Assistent lässt
sie aus; einschalten lassen sie sich jederzeit unter *Einstellungen → Global → Extras*.

## Startbildschirm-Widgets

SmartLists-Listen – kombinierte Listen, eigene Listen, alles, was du in SmartLists siehst – sind ganz normale
To-do-Entitäten. Die offiziellen Home-Assistant-Apps zeigen sie deshalb in ihrem **To-do-Listen-Widget**, ohne
dass in SmartLists etwas einzurichten ist:

- **Android:** Startbildschirm lange drücken → *Widgets* → *Home Assistant* → **To-do-Liste**, z. B.
  `todo.grosseinkauf` wählen. Artikel lassen sich direkt im Widget abhaken.
- **iOS / iPadOS:** Startbildschirm → *Bearbeiten* → *Widget hinzufügen* → *Home Assistant* → **To-do List**,
  Liste wählen.

Mehr in der Doku der App: [Android-Widgets](https://companion.home-assistant.io/docs/integrations/android-widgets/),
[iOS-Widgets](https://companion.home-assistant.io/docs/integrations/ios-widgets/). Das Widget zeigt den reinen
Artikeltext (z. B. `Milch 2 l @REWE`); Badges, Kategorien und Einkaufsmodus gibt es in der Karte, auf der
Seite und in der HA-SmartLists-App.

## Seite „SmartLists“ in der Seitenleiste

Nach dem Einrichten gibt es links in HA den Eintrag **SmartLists**: alle To-do-Listen (kombinierte
zuerst) als Reiter, jede wie in der Karte (Badges, Kategorien, Stepper, Suche, Einkaufsmodus) – ohne
Dashboard. Oben rechts schaltest du zwischen **einer Liste** und **mehreren nebeneinander** (beliebig viele, mit Umbruch; Reihenfolge änderbar) sowie
zwischen normaler und **breiter** Ansicht; bei mehreren Listen ziehst du Artikel mit der Maus in eine
andere Liste (Strg = kopieren). Die eingebaute To-do-Seite von HA zeigt Artikel nur als Text.

📲 **Als App auf dem Startbildschirm, ohne etwas zu installieren:** der Handy-Knopf oben speichert ein Symbol,
das eine Liste direkt öffnet – auf Wunsch gleich im Einkaufsmodus, im Vollbild (*Installieren* in Chrome,
*Teilen → Zum Home-Bildschirm* in Safari). Siehe [Wiki](https://github.com/m3m0rex/ha_smartlists/wiki/Sidebar-page).

<table>
<tr>
<td width="50%" valign="top"><img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/mealplan.svg" alt="Reiter Wochenplan"><br><sub>Reiter <b>Wochenplan</b> (optionales Extra): Gerichte je Tag, Zutaten mit einem Klick auf die Liste.</sub></td>
<td width="50%" valign="top"><img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/notes.svg" alt="Notizen der App als Notizkarten"><br><sub><b>Notizen</b> der App als Notizkarten – nur für ihren Besitzer (optionales Extra).</sub></td>
</tr>
</table>

## Lovelace-Karte `custom:smartlists-card`

Wird von der Integration automatisch geladen.

<table>
<tr><td width="50%" valign="top"><img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/card-list.svg" alt="Standard-Liste"><br><b>Standard-Liste</b> · Standard</td><td width="50%" valign="top"><img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/card-tiles.svg" alt="Kacheln"><br><b>Kacheln</b> · <code>view: tiles</code></td></tr>
<tr><td width="50%" valign="top"><img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/card-mini.svg" alt="Mini-Kachel"><br><b>Mini-Kachel</b> · <code>view: mini</code></td><td width="50%" valign="top"><img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/card-store.svg" alt="Markt-Karte"><br><b>Markt-Karte</b> · <code>filter_store</code> + <code>start_shopping</code></td></tr>
<tr><td width="50%" valign="top"><img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/card-columns.svg" alt="Mehrere Listen"><br><b>Mehrere Listen</b> · <code>entities</code> + <code>layout: columns</code></td><td width="50%" valign="top"><img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/card-mealplan.svg" alt="Wochenplan"><br><b>Wochenplan</b> · <code>view: mealplan</code></td></tr>
<tr><td width="50%" valign="top"><img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/card-stats.svg" alt="Statistik"><br><b>Statistik</b> · <code>settings_only</code> + <code>settings_scope: stats</code></td><td width="50%" valign="top"><img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/card-readonly.svg" alt="Nur ansehen"><br><b>Nur ansehen</b> · <code>show_add: false</code> …</td></tr>
</table>

Das YAML zu jedem Beispiel steht im [Wiki → Card](https://github.com/m3m0rex/ha_smartlists/wiki/Card#examples) (Bilder auf Englisch).

```yaml
type: custom:smartlists-card
entity: todo.grosseinkauf
```

Der visuelle Editor startet einfach – **Vorlage**, Liste, Titel, Ansicht, Sortierung – und zeigt alles
Weitere mit *Erweiterte Optionen anzeigen*. Vorlagen: Familien-Einkauf, Küchen-Tablet, Im Laden, Nur
ansehen, kompakte Dashboard-Kachel.

| Option | Werte |
|---|---|
| `entity` / `entities` | eine Liste oder mehrere in einer Karte |
| `layout` | `tabs` · `columns` · `stack` (bei mehreren Listen) |
| `view` | `list` · `tiles` (große Kacheln) · `mini` (Zusammenfassung, aufklappbar) |
| `sort` | `category` · `alpha` · `added` · `list` |
| `filter_store`, `filter_person`, `filter_tag` | nur Artikel mit `@REWE`, `*Anna`, `#bio` (mehrere mit Komma); neue Artikel bekommen den Tag automatisch |
| `filter_category`, `filter_offers` | nur diese Kategorien / nur Angebote aus der App |
| `show_filter_chips` | Filter-Leiste mit den Märkten, Personen und Schlagwörtern der Liste |
| `density`, `font_scale`, `radius`, `accent_color` | Zeilenhöhe, Schriftgröße, Eckenradius, Akzentfarbe |
| `drag_drop` | Artikel in andere Liste ziehen (verschieben, Strg = kopieren) oder umsortieren (Sortierung „Hinzugefügt“) |
| `show_*` | jedes Element von Kopfzeile, Eingabe und Liste ausblendbar |

Für Themes und card-mod: CSS-Variablen `--smartlists-accent`, `--smartlists-radius`,
`--smartlists-row-height`, `--smartlists-tile-size`.

### Stand

Die Karte funktioniert in HA mit kombinierten SmartLists-Listen **und jeder normalen To-do-Liste**
(Einkaufsliste, Local To-do, Google Tasks, Bring!, …). Erlaubt ist, was die Liste selbst kann; bei
kombinierten Listen sind Artikel aus fremden Quellen nur abhakbar. Änderungen von anderen Geräten
erscheinen live.


### Schnittstelle für die App

*(Die App ist noch nicht veröffentlicht.)*

Die HA-SmartLists-App kann sich mit der Integration koppeln (`smartlists/info`) und zeigt dann
dieselben Badges, Kategorien und Vorschläge an. Alle Befehle, Antworten und das Textformat:
[docs/app-api.md](docs/app-api.md).

Das Kategorie-Paket wird aus dem der App erzeugt: `python scripts/build_categories.py` (sucht die App im Nachbarordner `shopping_manager_app`).

## Installation

### Über HACS (benutzerdefiniertes Repository)

1. HACS → ⋮ → *Benutzerdefinierte Repositories*
2. URL `https://github.com/m3m0rex/ha_smartlists`, Typ **Integration** → Hinzufügen
3. „SmartLists" herunterladen und Home Assistant neu starten.

### Manuell

Ordner `custom_components/smartlists` nach `/config/custom_components/smartlists` kopieren und Home Assistant neu starten.

## Einrichtung

<p align="center"><img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/setup-assistant.svg" alt="Einrichtungs-Assistent – Schritt Schreibweise" width="460"></p>

Beim ersten Öffnen führt ein **Einrichtungs-Assistent** Admins durch Listen, Märkte, Schreibweise,
Sprache, Personen und Extras – siehe [Wiki](https://github.com/m3m0rex/ha_smartlists/wiki/Setup#setup-assistant).
Er lässt sich jederzeit erneut starten (auch über *Konfigurieren* der Integration), auf Wunsch **von vorn** (Einstellungen, gelernte Daten,
Teilen-Links oder kombinierte Listen zurücksetzen – To-do-Listen werden nie gelöscht).

*Einstellungen → Geräte & Dienste → Integrationen → Integration hinzufügen → **SmartLists***

SmartLists wird einmal eingerichtet. Danach ist die Lovelace-Karte sofort verfügbar, und bei der
Integration gibt es:

- **„Kombinierte Liste hinzufügen“** – Name, Listen, Standard-Liste, Modus, Herkunftsanzeige, Sortierung,
  fremde Listen. Jede Liste lässt sich später über ⋮ → *Neu konfigurieren* ändern oder löschen.
- **„Konfigurieren“** – *Einrichtung erneut starten / von vorn* und **Einstellungen öffnen**, das zu den
  Einstellungen auf der SmartLists-Seite springt (`/smartlists?settings=global`). Dort stehen alle globalen
  Einstellungen – Namenskonvention, Bedienung für alle, Kategorien und Verlauf, Märkte, Teilen, Extras …

Persönliche Abweichungen (pro Benutzer oder nur auf einem Gerät) stellt jeder selbst im Zahnrad der
Karte ein; dort können Admins auch die globalen Einstellungen ändern – beides zeigt dieselben Werte.

**Listen der App** (`todo.ha_smartlists_*`), die noch keine SmartLists-Listen sind, erscheinen unter
*Einstellungen → Reparaturen*; *Beheben* übernimmt sie als eigene Listen (die alte Liste bleibt).

**Update von 1.1:** Bisherige SmartLists-Helfer werden beim ersten Start automatisch zu Listen unter
dem einen Eintrag „SmartLists“ umgezogen. entity_id, Dashboards, Automationen und lokale Häkchen
bleiben erhalten.

## Hinweise

- Kombinierte Listen lassen sich nicht ineinander verschachteln (Schutz vor Endlosschleifen).
- Im Modus „Nur diese kombinierte Liste" werden die lokalen Häkchen in Home Assistant gespeichert
  (`.storage/smartlists.<id>`) und beim Löschen der Integration mit entfernt.
- Artikel ohne eindeutige ID (sehr alte Integrationen) werden übersprungen.
- Voraussetzung: Home Assistant 2025.3 oder neuer (Unter-Einträge für die Listen).
- Oberfläche (Karte, Seite, Einrichtung, Assist-Sätze) auf Deutsch, Englisch, Französisch, Spanisch, Italienisch
  und Polnisch. Die Kategorienamen folgen der Sprache von Home Assistant.

## Lizenz

MIT – siehe [LICENSE](LICENSE). Die Android-App HA SmartLists ist ein eigenes Projekt mit eigener Lizenz.

## Aufbau

```
hacs.json
custom_components/smartlists/
  manifest.json      Metadaten (Typ: Dienst, einmal einrichtbar)
  __init__.py        Einrichten/Entladen, Karte laden, Umzug von 1.1
  config_flow.py     Einrichtung, kombinierte Listen (Unter-Einträge), Konfigurieren-Menü
  todo.py            To-do-Entitäten: kombinierte und eigene Listen
  categories.py/json Kategorie-Paket (aus der App erzeugt, mit Produkten + Einheiten)
  itemtext.py        Artikeltext zerlegen: Menge, Einheit, Tags (@REWE …)
  learning.py        Gedächtnis: Kategorien, Verlauf (je Liste), Vorschläge, Tag-Regeln, Bedienung
  own.py             eigene Listen: Rollen und Rechte
  automation.py      Einkaufs-Ereignis, get_items, Assist, fällige Artikel
  lists.py           Listen lesen/ändern (kombinierte und normale To-do-Listen)
  shares.py, public.py   Teilen-Links; Teilen-Server, Quick Tunnel, eigener Proxy
  features.py        Extras (Notizen, Wochenplan)
  pwa.py             Web-App-Manifest für das Startbildschirm-Symbol
  repairs.py         Hinweise und Behebungen unter Einstellungen → Reparaturen
  websocket.py       Befehle für Karte und App (siehe docs/app-api.md)
  www/smartlists-card.js   Lovelace-Karte und Seite in der Seitenleiste
  strings.json, translations/   Texte (de, en, fr, es, it, pl)
  packs/                        eingebaute Keyword-Packs (ein JSON pro Sprache)
blueprints/automation/smartlists/   fertige Automationen
tests/                          Tests (pytest, ohne HA)
scripts/build_categories.py     categories.json aus dem App-Paket erzeugen
scripts/make_demo_gif.py        das Demo-GIF oben in dieser README erzeugen
```
