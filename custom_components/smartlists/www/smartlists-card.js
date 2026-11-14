/* SmartLists Karte – gehört zur HACS-Integration "SmartLists" (wird automatisch geladen).
 *   type: custom:smartlists-card
 *   entity: todo.meine_liste
 *
 * Eingabe in EINEM Feld, z.B. "2 kg Äpfel @REWE *Anna #bio":
 *   Menge/Einheit werden erkannt, "@REWE" wird zum Markt-Badge, "*Anna" zur Person, "#bio" zum Schlagwort.
 *   Welches Zeichen was bedeutet, lässt sich in den Karten-Einstellungen (Zahnrad) ändern – gilt für
 *   den ganzen Haushalt, weil die Regeln in der Integration gespeichert werden.
 * Kategorien werden gemerkt: einmal "Hafermilch → Kühlung" gewählt, gilt das künftig auch für
 * "Hafermilch Barista". Vorschläge kommen aus dem Verlauf, der Liste und dem Produkt-Paket der App.
 * Keine externen Abhängigkeiten; nutzt die Theme-Variablen von Home Assistant. */

const ICON = {
  plus: "M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z",
  check: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
  pencil: "M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z",
  trash: "M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z",
  lock: "M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z",
  chevron: "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
  sweep: "M15,16H19V18H15V16M15,8H22V10H15V8M15,12H21V14H15V12M3,18A2,2 0 0,0 5,20H11A2,2 0 0,0 13,18V8H3V18M14,5H11L10,4H6L5,5H2V7H14V5Z",
  history: "M13.5,8H12V13L16.28,15.54L17,14.33L13.5,12.25V8M13,3A9,9 0 0,0 4,12H1L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3",
  list: "M3,4H7V8H3V4M9,5V7H21V5H9M3,10H7V14H3V10M9,11V13H21V11H9M3,16H7V20H3V16M9,17V19H21V17H9",
  template: "M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3M7,7H17V9H7V7M7,11H17V13H7V11M7,15H14V17H7V15Z",
  barcode: "M2,6H4V18H2V6M5,6H6V18H5V6M7,6H10V18H7V6M11,6H12V18H11V6M14,6H16V18H14V6M17,6H20V18H17V6M21,6H22V18H21V6Z",
  chart: "M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z",
  share: "M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.34C15.11,18.55 15.08,18.77 15.08,19C15.08,20.61 16.39,21.91 18,21.91C19.61,21.91 20.92,20.61 20.92,19A2.92,2.92 0 0,0 18,16.08Z",
  dots: "M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z",
  calendar: "M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z",
  tune: "M3,17V19H9V17H3M3,5V7H13V5H3M13,21V19H21V17H13V15H11V21H13M7,9V11H3V13H7V15H9V9H7M21,13V11H11V13H21M15,9H17V7H21V5H17V3H15V9Z",
  gear: "M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z",
  sort: "M18 21L14 17H17V7H14L18 3L22 7H19V17H22M2 19V17H12V19M2 13V11H9V13M2 7V5H6V7H2Z",
  cart: "M17,18C15.89,18 15,18.89 15,20A2,2 0 0,0 17,22A2,2 0 0,0 19,20C19,18.89 18.1,18 17,18M1,2V4H3L6.6,11.59L5.24,14.04C5.09,14.32 5,14.65 5,15A2,2 0 0,0 7,17H19V15H7.42A0.25,0.25 0 0,1 7.17,14.75C7.17,14.7 7.18,14.66 7.2,14.63L8.1,13H15.55C16.3,13 16.96,12.58 17.3,11.97L20.88,5.5C20.95,5.34 21,5.17 21,5A1,1 0 0,0 20,4H5.21L4.27,2M7,18C5.89,18 5,18.89 5,20A2,2 0 0,0 7,22A2,2 0 0,0 9,20C9,18.89 8.1,18 7,18Z",
  move: "M14,18V15H10V11H14V8L19,13M20,6H12L10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6Z",
  copy: "M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z",
  tagIcon: "M5.5,7A1.5,1.5 0 0,1 4,5.5A1.5,1.5 0 0,1 5.5,4A1.5,1.5 0 0,1 7,5.5A1.5,1.5 0 0,1 5.5,7M21.41,11.58L12.41,2.58C12.05,2.22 11.55,2 11,2H4C2.89,2 2,2.89 2,4V11C2,11.55 2.22,12.05 2.59,12.41L11.58,21.41C11.95,21.77 12.45,22 13,22C13.55,22 14.05,21.77 14.41,21.41L21.41,14.41C21.78,14.05 22,13.55 22,13C22,12.44 21.77,11.94 21.41,11.58Z",
  undo: "M12.5,8C9.85,8 7.45,9 5.6,10.6L2,7V16H11L7.38,12.38C8.77,11.22 10.54,10.5 12.5,10.5C16.04,10.5 19.05,12.81 20.1,16L22.47,15.22C21.08,11.03 17.15,8 12.5,8Z",
  importIcon: "M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z",
  search: "M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z",
  minus: "M19,13H5V11H19V13Z",
  back: "M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z",
  close: "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z",
  brain: "M21.33,12.91C21.42,14.46 20.71,15.95 19.44,16.86L20.21,18.35C20.44,18.8 20.47,19.33 20.27,19.8C20.08,20.27 19.69,20.64 19.21,20.8L18.42,21.05C18.25,21.11 18.06,21.14 17.88,21.14C17.37,21.14 16.89,20.91 16.56,20.5L14.44,18C13.55,17.85 12.71,17.47 12,16.9C11.5,17.05 11,17.13 10.5,17.13C9.62,17.13 8.74,16.86 8,16.34C7.47,16.5 6.93,16.57 6.38,16.56C5.59,16.57 4.81,16.41 4.08,16.11C2.65,15.47 1.7,14.07 1.65,12.5C1.57,11.78 1.69,11.05 2,10.39C1.71,9.64 1.68,8.82 1.93,8.06C2.3,7.11 3,6.32 3.87,5.82C4.45,4.13 6.08,3 7.87,3.12C9.47,1.62 11.92,1.46 13.7,2.75C14.12,2.64 14.56,2.58 15,2.58C16.36,2.55 17.65,3.15 18.5,4.22C20.54,4.75 22,6.57 22.08,8.69C22.13,9.8 21.83,10.89 21.22,11.82C21.29,12.18 21.33,12.54 21.33,12.91",
};

// Wird beim Release mit manifest.json hochgezählt; weicht sie von der Integration ab, ist die Karte im Browser-Cache veraltet
const CARD_VERSION = "3.9.11";
const SORT_MODES = ["category", "alpha", "added", "list"];
// Darstellung pro Karte (Lovelace-Editor). Persönliche Bedienung steht dagegen in UI_DEFAULTS.
const CARD_DEFAULTS = {
  sort: "category",
  show_header: true, show_count: true, show_search: true, show_sort: true, show_shopping: true,
  show_undo: true, show_import: true, show_settings: true,
  show_add: true, show_frequent: true, show_templates: true, show_scan: true, show_prices: true,
  drag_drop: true, show_stepper: true, show_offer: true, show_tags: true, show_source: true, show_note: true, show_category_titles: true, compact: false,
  show_completed: true, collapse_completed: true,
  start_shopping: false,
  // Ansicht & Aussehen
  view: "list",            // list | tiles | mini
  layout: "tabs",          // bei mehreren Listen: tabs | columns | stack
  density: "normal",       // compact | normal | comfortable
  font_scale: 1, radius: null, accent_color: null,
  // feste Filter (leer = alles) und Filter-Leiste
  filter_store: "", filter_person: "", filter_tag: "", filter_category: [], filter_offers: false,
  filter_tags_new_items: true, show_filter_chips: false,
};
// Gleiche Kategorien wie categories.py (Reihenfolge = Sortierung)
const CATEGORY_DEFS = [
  ["obst_gemuese", "🥬", {"de": "Obst & Gemüse", "en": "Fruit & veg", "fr": "Fruits & légumes", "es": "Frutas y verduras", "it": "Frutta e verdura", "pl": "Owoce i warzywa"}],
  ["fleisch", "🥩", {"de": "Fleisch- & Fischtheke", "en": "Meat & fish", "fr": "Viande & poisson", "es": "Carne y pescado", "it": "Carne e pesce", "pl": "Mięso i ryby"}],
  ["kuehlung", "🥛", {"de": "Kühlung", "en": "Chilled & dairy", "fr": "Frais & produits laitiers", "es": "Refrigerados y lácteos", "it": "Freschi e latticini", "pl": "Nabiał i chłodzone"}],
  ["grundnahrung", "🥫", {"de": "Konserven & Trockensortiment", "en": "Pantry & tins", "fr": "Épicerie & conserves", "es": "Despensa y conservas", "it": "Dispensa e scatolame", "pl": "Spiżarnia i konserwy"}],
  ["backwaren", "🍞", {"de": "Brot & Backwaren", "en": "Bread & bakery", "fr": "Pain & boulangerie", "es": "Pan y bollería", "it": "Pane e prodotti da forno", "pl": "Pieczywo"}],
  ["getraenke", "🥤", {"de": "Getränke", "en": "Drinks", "fr": "Boissons", "es": "Bebidas", "it": "Bevande", "pl": "Napoje"}],
  ["suessigkeiten", "🍫", {"de": "Süßwaren & Snacks", "en": "Sweets & snacks", "fr": "Confiserie & snacks", "es": "Dulces y snacks", "it": "Dolci e snack", "pl": "Słodycze i przekąski"}],
  ["haushalt", "🧹", {"de": "Haushalt", "en": "Household", "fr": "Entretien", "es": "Hogar y limpieza", "it": "Casa e pulizia", "pl": "Chemia domowa"}],
  ["drogerie", "🧴", {"de": "Drogerie", "en": "Personal care", "fr": "Hygiène & beauté", "es": "Higiene y belleza", "it": "Igiene e bellezza", "pl": "Drogeria"}],
  ["tiefkuehl", "❄️", {"de": "Tiefkühl", "en": "Frozen", "fr": "Surgelés", "es": "Congelados", "it": "Surgelati", "pl": "Mrożonki"}],
  ["tierbedarf", "🐕", {"de": "Tierbedarf", "en": "Pets", "fr": "Animaux", "es": "Mascotas", "it": "Animali", "pl": "Zwierzęta"}],
  ["sonstiges", "📦", {"de": "Sonstiges", "en": "Other", "fr": "Autres", "es": "Otros", "it": "Altro", "pl": "Inne"}],
];
const categoryOptions = (lang) => CATEGORY_DEFS.map(([id, emoji, names]) => [id, `${emoji} ${names[lang] || names.en}`]);
// Vorlagen für den Editor: setzen viele Optionen auf einmal, danach ist alles einzeln änderbar
const PRESETS = {
  family:    { values: { view: "list", density: "normal", show_filter_chips: true, show_add: true, show_frequent: true, show_stepper: true, show_import: true } },
  kitchen:   { values: { view: "tiles", density: "comfortable", font_scale: 1.2, show_import: false, show_undo: true, show_settings: false } },
  store:     { values: { view: "list", start_shopping: true, show_add: false, show_frequent: false, show_import: false, density: "comfortable" } },
  readonly:  { values: { show_add: false, show_frequent: false, show_stepper: false, show_import: false, show_settings: false, show_undo: false, show_shopping: false } },
  tile:      { values: { view: "mini", density: "compact", show_frequent: false, show_import: false } },
};
const MENU_ACTIONS = ["rename", "move", "copy", "category", "delete"];
// Vorlage für eigene Keyword-Packs (Kategorie-IDs siehe CATEGORY_DEFS; "products" ist optional)
const PACK_TEMPLATE = {
  name: "My pack", language: "en", version: 1,
  terms: { "oat milk": "kuehlung", "sourdough": "backwaren", "dish soap": "haushalt", "kombucha": "getraenke" },
  products: [["Oat milk", "l", "kuehlung"], ["Sourdough bread", "", "backwaren"]],
  _help: "terms: keyword → category id. Longest matching keyword wins; packs higher in the list win on equal keywords. Category ids: obst_gemuese, fleisch, kuehlung, grundnahrung, backwaren, getraenke, suessigkeiten, haushalt, drogerie, tiefkuehl, tierbedarf, sonstiges. The app format (category_pack_v2.json) is accepted too.",
};
// Bedienung: Standard < Einstellung des HA-Benutzers (in der Integration gespeichert, gilt auf allen
// seinen Geräten) < optional abweichend nur für dieses Gerät (Browser-Speicher). Bewusst NICHT in der
// Dashboard-/Lovelace-Konfiguration, weil jeder Benutzer das für sich einstellen soll.
const UI_DEFAULTS = {
  press_gesture: "long", press_target: "row", press_result: "menu", menu_actions: MENU_ACTIONS, row_buttons: true,
  shop_hide_checked: true, shop_keep_awake: true, shop_large: true, shop_tap_row: true,
  shop_auto_store: true, shop_untagged: true,
  scan_target: "", scan_mode: "input",
};
// Dienste zum Nachschlagen von Strichcodes (gleiche IDs wie barcode.py)
const BARCODE_PROVIDERS = [["off", "Open Food Facts"], ["obf", "Open Beauty Facts"], ["opff", "Open Pet Food Facts"],
  ["opf", "Open Products Facts"], ["upcitemdb", "UPCitemdb"], ["custom", null]];
// Notizlisten der App: keine Kategorien/Einkaufsfunktionen (nur wenn in der Karte nicht anders eingestellt)
const NOTES_DEFAULTS = { sort: "added", show_category_titles: false, show_frequent: false, show_shopping: false, show_stepper: false, show_import: false, show_filter_chips: false, show_sort: false };
// Erkennung wie notes.py (für Auswahlfelder, ohne Rückfrage bei der Integration)
// Name für die Chips der Seite: die Gruppe („Listen“, „Notizen“) steht schon darüber – „HA Smartlists“, „Liste“,
// „Notes“ usw. vorne weglassen („Liste Max“ → „Max“). Bleibt nichts übrig, der volle Name.
// „Lista zakupów“ / „Lista de la compra“ bleiben: weggelassen wird „Liste“ nur vor einem Namen (Großbuchstabe/Ziffer).
const chipName = (name) => {
  const s = String(name || "").trim();
  let r = s.replace(/^ha[ _]?smartlists[ _]+/i, "");
  const m = r.match(/^(list[ea]?|listy|notes?|notizen?|notatki)[ _]+(.+)$/i);
  if (m && /^[\p{Lu}\d]/u.test(m[2])) r = m[2];
  return r.trim() || s;
};
const isNotesEntity = (id, name) => /^todo\.(ha_smartlists_note|notiz_)/i.test(id) || /^ha smartlists notes/i.test(String(name || "").trim());
const UI_KEY = "smartlists-ui";
const LONG_PRESS_MS = 500;
const TEXTS = {
  de: {
    add_placeholder: "z. B. 2 kg Äpfel {store}", add_ph_store: "Markt", note: "Notiz", save: "Speichern", cancel: "Abbrechen",
    done: "Erledigt", clear: "Erledigte entfernen", own: "Eigene Liste", combined: "Kombiniert", foreign: "Fremd",
    empty: "Nichts zu besorgen 🎉", no_add: "Hinzufügen ist für diese Liste gesperrt.", open: "offen",
    confirm_delete: "Artikel wirklich löschen?", confirm_clear: "Alle erledigten Artikel entfernen?",
    error: "Fehler", loading: "Lädt …", readonly: "Nur ansehen", delete: "Löschen", edit: "Bearbeiten",
    frequent: "Häufig gekauft", src_manual: "gemerkt", src_learned: "gelernt", src_pack: "automatisch", src_fallback: "unbekannt",
    unit_hint: "übliche Einheit", category: "Kategorie", settings: "Einstellungen", naming: "Namenskonvention",
    naming_help: "Zeichen vor einem Wort machen daraus ein Badge. Gilt für alle Listen, Benutzer und Geräte.",
    kind_store: "Markt", kind_person: "Person", kind_tag: "Schlagwort", add_rule: "Regel hinzufügen", example: "Beispiel",
    learned: "Gemerkte Kategorien", learned_help: "Entstehen, wenn du eine Kategorie von Hand wählst.", forget: "Vergessen",
    none_learned: "Noch nichts gemerkt.", saved: "Gespeichert", admin_only: "Nur Administratoren können das ändern.",
    in_list: "steht schon auf der Liste",
    tab_me: "Für mich", tab_house: "Global", tab_list: "Diese Liste", ui_me_help: "Gilt nur für dich. Abweichungen von der globalen Einstellung sind mit • markiert.",
    ui_house: "Bedienung – Standard für alle", reset_default: "Auf Standard zurücksetzen", about_list: "Über diese Liste", type: "Typ", entity: "Entität", sources: "Quellen",
    type_combined: "Kombinierte Liste", type_own: "Eigene SmartLists-Liste", type_list: "To-do-Liste aus Home Assistant", char: "Zeichen", kind: "Art",
    no_hits_short: "Nichts gefunden.", by_hand: "von Hand", search_learned: "Suchen … (z. B. milch)",
    automation: "Sprache & Automationen", automation_help: "Assist und fällige Artikel. Blueprints für „Bin im Laden“ und Markt-Erinnerung: siehe Wiki.",
    auto_voice_default_list: "Standard-Liste für Assist", auto_voice_help: "Wenn man im Satz keine Liste nennt.",
    auto_auto_due_list: "Fällige Artikel automatisch auf", auto_due_help: "Stündlich, nach eurem Kaufrhythmus. „—“ = aus.",
    install_sentences: "Assist-Sätze installieren", sentences_installed: "installiert",
    devices: "Verbundene Geräte", devices_help: "Geräte mit der HA-SmartLists-App. ⚠️ = über 7 Tage nicht abgeglichen. Zugang sperren: Token im Profil löschen.",
    no_devices: "Noch kein Gerät verbunden.", remove_device: "Aus der Liste nehmen", last_seen: "zuletzt",
    role_all: "alle Rechte", admin_always: "Admin – darf immer alles", shop_large_help: "Leichter mit dem Daumen zu treffen. Aus: so groß wie in der normalen Ansicht.",
    new_list_help: "Du bist Besitzer und kannst sie danach für andere freigeben.", new_list_placeholder: "z. B. Drogerie", create: "Anlegen",
    p_columns: "Mehrere Listen nebeneinander", p_wide: "Breite Ansicht", p_settings: "Einstellungen", p_back: "Zurück zu den Listen",
    p_hint: "Listen antippen, um sie nebeneinander zu zeigen (mehr als 3 werden umgebrochen). Artikel mit der Maus in eine andere Liste ziehen = verschieben (Strg = kopieren).",
    p_empty: "Keine To-do-Listen gefunden. Lege unter Einstellungen → Geräte & Dienste → SmartLists eine Liste an – oder oben mit +.",
    owner: "Besitzer", shared: "geteilt", private: "privat", admin: "Admin", sharing: "Freigaben",
    sharing_help: "Wer diese Liste sehen und ändern darf. Admins dürfen immer alles. Die To-do-Ansicht von HA zeigt jede Liste allen – ausgeblendet wird sie nur in SmartLists (Karte, Seite, App).",
    role_none: "kein Zugriff", role_viewer: "sehen", role_checker: "abhaken", role_editor: "bearbeiten", role_owner: "Besitzer",
    no_users: "Keine weiteren Benutzer in Home Assistant.", delete_list: "Liste löschen", confirm_delete_list: "Diese Liste mit allen Artikeln löschen?",
    new_list: "Neue Liste", new_list_prompt: "Name der neuen Liste:",
    due_every: "fällig – kauft ihr etwa alle", days: "Tage", backup: "Sichern & übertragen",
    backup_help: "Gemerkte Kategorien, Verlauf, Namenskonvention und Bedienung als Datei – z. B. für eine zweite HA-Instanz. Import ergänzt, ohne Vorhandenes zu löschen.",
    export: "Exportieren", import: "Importieren …",
    mini_open: "Liste öffnen", mini_close: "Zuklappen", card_version: "Karte", stale_card: "Die Karte ist veraltet – Seite neu laden (Strg+F5) bzw. in der App den Frontend-Cache leeren.", offer: "Angebot", offer_until: "bis", offer_expired: "abgelaufen seit",
    qty_less: "Menge verringern", qty_more: "Menge erhöhen", qty_changed: "Menge geändert",
    search: "Suchen", search_placeholder: "In der Liste suchen …", hits: "Treffer", no_hits: "Nichts gefunden für", add_this: "hinzufügen",
    imp: "Importieren", imp_ha: "Aus Home Assistant", imp_text: "Als Text", imp_source: "Liste",
    imp_done: "Erledigte mit übernehmen", imp_skip_dupes: "Schon vorhandene überspringen", imp_go: "Übernehmen",
    imp_text_help: "Eine Zeile pro Artikel. Aufzählungen, [ ] / [x] und Nummern werden erkannt, ebenso Mengen und Tags.",
    imp_preview: "Vorschau", imp_none: "Nichts zu übernehmen.", imp_count: "Artikel", imported: "importiert", imp_dupe: "vorhanden",
    imp_no_lists: "Keine anderen To-do-Listen in Home Assistant gefunden.",
    shop_on: "Einkaufsmodus starten", shop_off: "Einkaufsmodus beenden", in_cart: "im Wagen", undo: "Rückgängig", checked_off: "abgehakt", unchecked: "wieder offen",
    deleted: "gelöscht", removed: "erledigte entfernt", added: "hinzugefügt", changed: "geändert",
    m_rename: "Umbenennen / bearbeiten", m_move: "Verschieben nach …", m_copy: "Kopieren nach …", m_category: "Kategorie ändern", m_delete: "Löschen",
    moved: "verschoben nach", copied: "kopiert nach", no_targets: "Keine andere Liste, in die du schreiben darfst.",
    ui: "Bedienung", ui_help: "Jeder Benutzer stellt das für sich ein. Optional für einzelne Geräte abweichend.",
    scope_household: "Standard für alle", scope_user: "Für mich auf allen Geräten", scope_device: "Nur auf diesem Gerät",
    scope_help_household: "Gilt für jeden, der nichts Eigenes eingestellt hat.",
    scope_help_user: "Nur deine Abweichungen vom Standard werden gespeichert (markiert mit •). „Zurücksetzen“ = wieder Standard.",
    scope_help_device: "Gilt nur in diesem Browser bzw. auf diesem Gerät. „Zurücksetzen“ = wieder deine Einstellung.",
    press_gesture: "Geste für das Artikel-Menü", g_long: "Lange drücken", g_double: "Doppelklick", g_right: "Rechtsklick", g_off: "Aus",
    press_target: "Wo die Geste greift", t_row: "Ganze Zeile", t_name: "Nur auf den Namen",
    press_result: "Was die Geste macht", r_menu: "Menü öffnen", r_edit: "Direkt bearbeiten", r_delete: "Löschen (mit Nachfrage)",
    menu_actions: "Einträge im Menü", row_buttons: "Stift und Papierkorb in der Zeile zeigen",
    shop: "Einkaufsmodus", shop_hide_checked: "Abgehakte ausblenden", shop_keep_awake: "Bildschirm anlassen",
    shop_large: "Große Zeilen", shop_tap_row: "Ganze Zeile antippen zum Abhaken", reset: "Zurücksetzen",
    sort: "Sortierung", sort_category: "Kategorie", sort_alpha: "A–Z", sort_added: "Hinzugefügt", sort_list: "Nach Liste",
    packs: "Kategorie-Erkennung (Keyword-Packs)", packs_help: "Stichwörter → Kategorie. Mehrere Packs gleichzeitig möglich (z. B. Deutsch + eigenes). Bei gleichem Stichwort gewinnt das Pack weiter oben. Gemerkte Kategorien haben immer Vorrang.",
    pack_terms: "Stichwörter", pack_products: "Produkte", pack_builtin: "eingebaut", pack_custom: "eigenes", pack_priority: "Rang",
    pack_up: "Nach oben (Vorrang)", pack_download: "Herunterladen", pack_delete: "Eigenes Pack löschen?", pack_bad_json: "Datei ist kein gültiges JSON.",
    pack_upload: "Pack hochladen …", pack_name_help: "Name für das Pack. Gleicher Name ersetzt ein vorhandenes eigenes Pack.", pack_add: "Hinzufügen",
    pack_skipped: "übersprungen (unbekannte Kategorie)", pack_template: "Vorlage",
    card_desc: "Einkaufsliste mit Kategorien, Vorschlägen, Mengen, Markt-Badges (@REWE) und Berechtigungen.",
    imp_placeholder: "- Milch 2 l @REWE\n- [ ] Brot\n- [x] Butter\n3 Äpfel",
    e_preset_pick: "— Vorlage wählen (setzt mehrere Optionen) —", e_view_list: "Liste", e_view_tiles: "Kacheln (z. B. Küchen-Tablet)", e_view_mini: "Mini-Kachel (Zusammenfassung, aufklappbar)",
    e_sort_category: "Nach Kategorie", e_sort_added: "Reihenfolge des Hinzufügens", e_sort_list: "Nach Quell-Liste (kombiniert)",
    e_layout_tabs: "Reiter", e_layout_columns: "Nebeneinander", e_layout_stack: "Untereinander",
    e_density_compact: "Kompakt", e_density_normal: "Normal", e_density_comfortable: "Groß (Touch)",
    e_sec_multi: "Mehrere Listen in einer Karte", e_sec_filter: "Filter", e_sec_look: "Aussehen", e_sec_header: "Kopfzeile", e_sec_input: "Eingabe",
    e_sec_list: "Liste", e_sec_done: "Erledigte", e_sec_shop: "Einkaufsmodus",
    e_pre_family: "Familien-Einkauf (alles an)", e_pre_kitchen: "Küchen-Tablet (große Kacheln)", e_pre_store: "Im Laden (Einkaufsmodus, ohne Eingabe)",
    e_pre_readonly: "Nur ansehen", e_pre_tile: "Kompakte Dashboard-Kachel",
    l_preset: "Vorlage", l_entity: "Liste", l_entities: "Listen (statt „Liste“ oben)", l_layout: "Anordnung", l_title: "Titel (leer = Name der Liste)",
    l_view: "Ansicht", l_sort: "Standard-Sortierung", l_advanced: "Erweiterte Optionen anzeigen",
    l_filter_store: "Nur Markt (z. B. REWE; mehrere mit Komma)", l_filter_person: "Nur Person (z. B. Anna)", l_filter_tag: "Nur Schlagwort (z. B. bio)",
    l_filter_category: "Nur Kategorien", l_filter_offers: "Nur Angebote", l_filter_tags_new_items: "Neue Artikel bekommen den Filter-Tag (@REWE …)",
    l_show_filter_chips: "Filter-Leiste (Märkte, Personen, Angebote antippen)",
    l_density: "Zeilenhöhe", l_font_scale: "Schriftgröße", l_radius: "Eckenradius", l_accent_color: "Akzentfarbe (leer = Theme)",
    l_show_header: "Kopfzeile anzeigen", l_show_count: "Anzahl offen / Treffer", l_show_search: "Suche (Lupe)",
    l_show_sort: "Sortier-Auswahl", l_show_shopping: "Einkaufsmodus-Knopf", l_show_undo: "Rückgängig (↶)",
    l_show_import: "Import-Knopf", l_show_settings: "Zahnrad (persönliche Einstellungen)",
    l_show_add: "Eingabefeld zum Hinzufügen", l_show_frequent: "„Häufig gekauft“",
    l_drag_drop: "Ziehen & Ablegen (Maus): in andere Liste verschieben, Reihenfolge ändern", l_show_stepper: "Mengen-Stepper (− +)", l_show_offer: "Angebote aus der App (Markt, Preis, gültig bis)",
    l_show_tags: "Badges (@Markt, *Person, #Schlagwort)", l_show_source: "Herkunft (Quell-Liste / Person)", l_show_note: "Notizen",
    l_show_category_titles: "Kategorie-Überschriften", l_max_height: "Maximale Höhe der Liste (leer = unbegrenzt)",
    l_show_completed: "Erledigte anzeigen", l_collapse_completed: "Erledigte anfangs zugeklappt", l_start_shopping: "Im Einkaufsmodus starten",
    hh_preset: "Setzt passende Optionen auf einmal – danach ist alles einzeln änderbar.",
    hh_entities: "Mehrere Listen: als Reiter, nebeneinander oder untereinander. Alle Optionen gelten für jede Liste.",
    hh_filter_tags_new_items: "Sonst wären neue Artikel in einer gefilterten Karte gleich wieder unsichtbar.",
    hh_show_settings: "Geste, Menü und Einkaufsmodus stellt jeder Benutzer für sich im Zahnrad ein.",
    hh_show_category_titles: "Aus: nach Kategorie sortiert, aber als eine Liste mit Kategorie-Symbol vorne.",
    hh_start_shopping: "Praktisch für ein Tablet im Flur oder ein Dashboard nur fürs Einkaufen.",
    shop_auto_store: "Markt automatisch nach Zone wählen", shop_auto_store_help: "Bist du in der Zone eines Marktes (z. B. REWE), zeigt der Einkaufsmodus nur dessen Artikel.",
    shop_untagged: "Artikel ohne Markt auch zeigen", shop_untagged_help: "Im Einkaufsmodus für einen Markt zusätzlich alles ohne @Markt.",
    shop_store: "Markt", shop_all_stores: "Alle",
    pack_edit: "Stichwörter bearbeiten", pack_new: "Neues Pack", pack_new_help: "Leeres Pack, z. B. für eine weitere Sprache oder eigene Begriffe. Es wird ganz oben aktiviert.", pack_new_placeholder: "z. B. Nederlands",
    pack_empty: "Noch keine Stichwörter – oben hinzufügen.", pack_changed: "geändert", pack_revert: "Änderung zurücknehmen", pack_ignore: "Ignorieren (als Sonstiges)",
    pack_more: "Mehr laden", pack_term_placeholder: "Stichwort (mehrere mit Komma)",
    pack_builtin_edit_help: "Eingebautes Pack: Änderungen landen im Ergänzungs-Pack „+“ und bleiben bei Updates erhalten.", pack_edit_help: "Eigenes Pack: Änderungen gelten sofort.",
    zone: "Zone", zone_new: "Neue Zone", zone_new_help: "Name der Zone. Position: aktueller Standort dieses Geräts (sonst Zuhause), Radius 100 m – feinjustieren unter Einstellungen → Bereiche & Zonen.",
    zone_wait: "Zone angelegt – erscheint gleich, dann hier verknüpfen.", zone_here: "Standort dieses Geräts", zone_home: "Position von Zuhause – bitte anpassen",
    zone_none: "keine Zone", zone_manage: "Zonen verwalten ↗", store_add: "Markt mit Zone", store_add_help: "Name des Marktes, wie in @REWE. Danach wird eine Zone dafür angelegt.",
    stores: "Märkte & Zonen", stores_help: "Verknüpfe Märkte mit Zonen von Home Assistant. Im Einkaufsmodus siehst du dann automatisch nur die Artikel des Marktes, in dem du gerade bist.",
    notes: "Notizen der App", notes_help: "Die HA-SmartLists-App speichert Notizen als eigene To-do-Liste. Sie sind keine Einkaufslisten und deshalb standardmäßig ausgeblendet.",
    notes_show: "In SmartLists zeigen", notes_show_help: "Als eigener Bereich 📝 auf der Seite – nicht bei Assist, Diensten und kombinierten Listen.",
    notes_scope: "Wer sieht Notizen", notes_scope_owner: "nur das eigene Konto", notes_scope_household: "alle Benutzer",
    notes_lists: "Notizlisten und Besitzer", notes_none: "Keine Notizliste der App gefunden.", notes_no_owner: "unbekannt (nur Admins)",
    p_order: "Reihenfolge ändern", p_order_hint: "◀ ▶ verschiebt eine Liste. Mit der Maus: Chip auf einen anderen ziehen. Die Reihenfolge gilt auch für die Spalten.",
    p_left: "Nach links", p_right: "Nach rechts",
    look: "Badges & Farben", look_help: "Aussehen der Badges für alle Benutzer. Farben und Namen der Märkte gelten auch in der App. Leer bzw. ↺ = Standard.",
    look_style: "Stil", look_filled: "gefüllt", look_soft: "dezent", look_outline: "Rahmen", look_text: "nur Text",
    look_color: "Hintergrundfarbe", look_text: "Schriftfarbe", look_icon: "Symbol davor", look_label: "Anzeigename", look_kinds: "Je Art", look_values: "Einzelne Badges",
    look_search: "Badge suchen … (z. B. rewe)", look_more: "Weitere über die Suche finden.", look_add: "Badge einfärben",
    look_add_help: "Mit Zeichen davor, z. B. @Kaufland, *Max oder #vegan – auch wenn es noch nicht benutzt wurde.",
    zone_count: "Zonen", zone_unlink: "Zone lösen", zone_add: "Zone",
    app_list: "kombinierte Liste der App", app_list_connected: "verbunden", app_list_connect: "Verbinden",
    zone_name: "Name der Zone, z. B. REWE Standort Test", zone_radius: "Radius", zone_coords: "Koordinaten oder Karten-Link", zone_coords_placeholder: "52.5200, 13.4050 oder Link aus Google/Apple/OSM-Karten", zone_coords_bad: "Keine Koordinaten erkannt.", zone_locating: "Standort wird ermittelt …", zone_no_location: "Standort nicht verfügbar – andere Option wählen.", zone_where: "Wo?", zone_here_opt: "Aktueller Standort (dieses Gerät)", zone_home_opt: "Zuhause", zone_map_opt: "Auf der Karte wählen", zone_after: "Feinjustieren jederzeit unter Einstellungen → Bereiche & Zonen.",
    note_new: "Neue Notiz", note_edit: "Notiz bearbeiten", note_view: "Liste / Raster", note_empty: "Noch keine Notizen.", note_locked: "Verschlüsselte Notiz", note_locked_help: "Mit dem Notiz-Passwort der App verschlüsselt – nur in der App lesbar.", note_title: "Titel", note_body: "Text",
    p_settings_hint: "",
    list_settings_hint: "Bedienung und alles Globale: ⚙ oben rechts auf der Seite.",
    settings_list: "Einstellungen dieser Liste", settings_global: "Allgemeine Einstellungen", list_settings_hint_card: "Bedienung und alles Globale: Regler-Symbol in der Kopfzeile.",
    tpl: "Vorlagen",
    scan: "Strichcode scannen",
    price_sum: "Summe",
    soft_checked: "von außen markiert (Link)",
    soft_checked_help: "Jemand hat das über einen geteilten Link als erledigt markiert – der Artikel bleibt offen, bis du ihn abhakst.",
    price: "Preis",
    aisle: "Reihenfolge",
    price_paid: "zuletzt bezahlt",
    price_manual: "eigener Preis",
    price_last: "zuletzt",
    tpl_servings: "Portionen",
    tpl_new: "Neue Vorlage",
    tpl_from_list: "Liste als Vorlage",
    tpl_increase: "steht schon auf der Liste → Menge wird erhöht",
    tpl_servings_help: "Mengen werden umgerechnet",
    tpl_increased: "Menge erhöht",
    tpl_name: "Name, z. B. Pfannkuchen",
    tpl_items_placeholder: "Mehl 250 g\nMilch 0,5 l\nEier 3",
    tpl_items: "Artikel",
    tpl_items_help: "Ein Artikel pro Zeile, mit Menge und Tags wie in der Liste. Portionen (optional) = für wie viele die Mengen gelten.",
    tpl_edit: "Vorlage bearbeiten",
    scan_help: "Strichcode in den roten Strich halten – oder die Zahl darunter eintippen.",
    scan_code: "Strichcode-Nummer",
    scan_unknown: "Produkt nicht gefunden – Name bitte selbst eintippen.",
    scan_find: "Suchen",
    scan_no_camera: "Kamera-Scan wird hier nicht unterstützt (z. B. iPhone-Safari, Firefox) – Nummer eintippen.",
    aisle_down: "Nach unten",
    aisle_help: "So sortiert der Einkaufsmodus, wenn dieser Markt gewählt ist. Am Griff ⠿ ziehen oder mit den Pfeilen verschieben.",
    aisle_all_branches: "alle Filialen",
    aisle_reset: "Standard",
    notify_to: "Senden an",
    notify_no_phone: "Kein Gerät mit Companion-App gefunden.",
    notify_added: "Bei neuen Artikeln",
    notify_checked: "Wenn etwas abgehakt wird",
    notify_lists: "Listen",
    notify_all_lists: "alle, die ich sehen darf",
    notify_from: "Von wem",
    notify_quiet: "Ruhezeit",
    notify_quiet_none: "keine",
    notify: "Benachrichtigungen",
    notify_help: "Wenn jemand anderes etwas ändert (eigene Änderungen nur, wenn unten eingeschaltet). Mehrere Änderungen innerhalb einer Minute kommen als eine Nachricht.",
    stats_90: "90 Tage",
    stats_year: "Jahr",
    stats_all: "alles",
    stats_top: "Am häufigsten gekauft",
    stats_every: "alle",
    stats_none: "Noch zu wenig Verlauf.",
    stats_overdue: "Lange nicht gekauft",
    stats_add: "Auf die Liste",
    stats_usually: "sonst alle",
    stats_since: "seit",
    stats_shares: "Nach Kategorie · Markt",
    stats: "Statistik",
    stats_help: "Aus dem vorhandenen Verlauf – es werden keine zusätzlichen Daten gesammelt.",
    exp_week: "Woche",
    exp_month: "Monat",
    exp_year: "Jahr",
    exp_none: "Noch keine Ausgaben – sie werden beim Abhaken von Artikeln mit Preis gebucht.",
    exp_no_store: "ohne Markt",
    exp: "Ausgaben",
    exp_help: "Gebucht beim Abhaken (Preis × Menge). Preise kommen aus Angeboten, von Hand (z. B. „Milch 2 l 1,19€“ oder ✏️) oder vom letzten Einkauf.",
    share_view: "nur ansehen",
    share_soft: "„soft“ abhaken (bleibt offen)",
    share_check: "richtig abhaken",
    share_mode: "Erlaubt",
    share_mode_help: "„soft“: Du siehst, was markiert wurde – der Artikel bleibt in deiner Liste offen. Was über den Link hinzukommt, ist in deiner Liste mit 🔗 markiert.",
    share_add: "Darf hinzufügen",
    share_valid: "Gültig",
    share_2h: "2 Stunden",
    share_1d: "1 Tag",
    share_7d: "7 Tage",
    share_30d: "30 Tage",
    share_forever: "bis zum Widerruf",
    share_create: "Link erstellen",
    soft_checked_by: "von {name} markiert (Link)", link_added_by: "von {name} über Link hinzugefügt",
    x_stats: "Statistik und Ausgaben", x_stats_help: "Am häufigsten gekauft, lange nicht gekauft, Anteile je Kategorie und Markt, Ausgaben je Monat (📊 auf der Seite, Sensor „Ausgaben diesen Monat“). Aus: ausgeblendet, gezählt wird im Hintergrund weiter.", w_x_stats_sub: "Was ihr oft kauft und wie viel ihr ausgebt",
    share_soft_add: "„soft“ abhaken und hinzufügen", link_added: "über Link hinzugefügt", link_added_help: "Jemand ohne Konto hat das über einen geteilten Link eingetragen.",
    link_shared: "im Internet geteilt", link_shared_help: "Über {n} Link(s) für Personen ohne Konto erreichbar. Antippen: Links ansehen oder widerrufen.",
    pub_cf_arch: "{path} ist für einen anderen Prozessor ({found}). Dieses System braucht {file} – die alte Datei löschen oder ersetzen.", pub_cf_kind_windows: "{path} ist die Windows-Version. Für Home Assistant wird {file} gebraucht.", pub_cf_kind_mac: "{path} ist die macOS-Version. Für Home Assistant wird {file} gebraucht.", pub_cf_kind_archive: "{path} ist ein Archiv (.tgz/.zip/.deb), nicht das Programm. Bitte die Datei {file} ohne Endung laden.", pub_cf_kind_html: "{path} ist eine gespeicherte Webseite, nicht das Programm. Auf der Release-Seite die Datei {file} direkt herunterladen.", pub_cf_kind_not_executable: "{path} lässt sich nicht ausführen (Rechte). Datei neu ablegen oder Rechte prüfen.", pub_cf_kind_unknown: "{path} passt nicht zu diesem System. Gebraucht wird {file}.",
    shared_change_hint: "Ändern: Zahnrad dieser Liste → Freigaben.",
    l_plain: "Einfache Liste", l_plain_help: "Ohne Kategorien, Vorschläge, gemerkte Wörter und Preise. Was hier steht, merkt sich SmartLists nicht – es taucht in keiner anderen Liste auf (z. B. Baumarkt).",
    l_categories: "Kategorien automatisch", l_categories_help: "Aus: keine Einordnung in Kategorien – weder in der Liste noch beim Eintippen. Sortierung dann z. B. nach Hinzufügen.", l_suggest: "Häufig gekauft & Vorschläge", l_suggest_list: "nur aus dieser Liste", l_suggest_sources: "aus ihren Quell-Listen", l_suggest_all: "aus allen Listen", l_suggest_help: "Was in einer anderen Liste gekauft wurde, erscheint hier nicht. Ältere Einträge (vor 3.9.4) gelten weiter überall.",
    zone_dup_title: "Zone gibt es schon", zone_dup_text: "Es gibt schon eine Zone „{name}“. Du kannst den Namen behalten (dann gibt es zwei Zonen mit gleichem Namen, z. B. zwei Filialen) oder die neue Zone umbenennen, z. B. „{name} Innenstadt“.", zone_dup_keep: "Namen behalten", zone_dup_rename: "Umbenennen", zone_dup_rename_help: "Name der neuen Zone, z. B. mit Ort oder Straße der Filiale.", app_title: "Als App auf dem Startbildschirm speichern", app_lead: "Ein Symbol auf dem Handy, das direkt diese Liste öffnet – ohne extra App. Läuft im Vollbild wie eine App.", app_list: "Liste", app_shop: "Direkt im Einkaufsmodus öffnen", app_install: "Installieren", app_close: "Schließen", app_ios: "In Safari unten auf Teilen (□↑) tippen\nZum Home-Bildschirm wählen\nHinzufügen tippen – fertig", app_android: "In Chrome oben rechts auf ⋮ tippen\nZum Startbildschirm hinzufügen bzw. App installieren wählen\nInstallieren bestätigen – fertig", app_other: "Im Browser-Menü App installieren bzw. Zum Startbildschirm hinzufügen wählen\nAm Handy: diese Seite in Chrome (Android) oder Safari (iPhone) öffnen",
    x_title: "Extras", x_help: "Optionale Bereiche. Für den Einstieg nicht nötig – bei Bedarf hier einschalten.", x_notes: "Notizen", x_notes_help: "Notizlisten (z. B. aus der HA-SmartLists-App) als eigener Bereich 📝. Wer sie sieht, legst du unter Geräte und Notizen fest.", x_mealplan: "Wochenplan", x_mealplan_help: "Gerichte je Tag, Zutaten auf die Liste, Kalender „Essensplan“. Aus: Tab, Menüpunkt und Kalender verschwinden, eingetragene Gerichte bleiben gespeichert.", w_x_optional: "Optional – auch später unter Einstellungen → Extras", w_x_notes_sub: "Notizlisten als eigener Bereich, z. B. aus der App", w_x_mealplan_sub: "Gerichte je Tag planen und Zutaten auf die Liste setzen", share_leak: "Der Link enthält die Adresse deines Home Assistant. Ohne sie zu verraten: Quick Tunnel oder eigener Proxy (Einstellungen → Teilen und Rechte → Öffentliche Adresse).", share_old_address: "Adresse hat sich geändert, Link geht nicht mehr", pub_title: "Öffentliche Adresse für Links", pub_help: "Worüber geteilte Links erreichbar sind. Mit Tunnel oder eigenem Proxy erfährt niemand die Adresse deines Home Assistant.", pub_mode: "Links über", pub_ha: "Adresse von Home Assistant", pub_tunnel: "Cloudflare Quick Tunnel", pub_proxy: "Eigener Proxy oder Tunnel", pub_ha_help: "Wie bisher: Der Link zeigt auf die externe Adresse von Home Assistant – wer ihn bekommt, kennt diese Adresse.", pub_tunnel_help: "SmartLists startet cloudflared und bekommt eine zufällige Adresse (…trycloudflare.com). Der Tunnel führt nur zu einem eigenen kleinen Server, der ausschließlich geteilte Listen ausliefert – nicht zu Home Assistant. Kein Konto und keine Portfreigabe nötig.", pub_proxy_help: "Leite deine Adresse an http://<IP von Home Assistant>:{port} weiter (Caddy, nginx, Cloudflare-Tunnel mit eigener Domain …). Dort läuft nur der Teilen-Server von SmartLists, nicht Home Assistant.", pub_url: "Öffentliche Adresse", pub_port: "Port", pub_port_change: "ändern (optional)", pub_port_help: "Port des Teilen-Servers (Standard 8126).", pub_starting: "Tunnel startet …", pub_server_ok: "Teilen-Server läuft auf Port {port}.", pub_not_ready: "noch nicht bereit", pub_tunnel_note: "Die Tunnel-Adresse ändert sich bei jedem Neustart von Home Assistant – vorher erstellte Links funktionieren dann nicht mehr. Für dauerhafte Links: eigener Proxy oder Tunnel.", pub_cf_missing: "cloudflared wurde nicht gefunden. SmartLists lädt es nicht selbst herunter.", pub_cf_not_exec: "{path} gefunden, aber nicht ausführbar oder für ein anderes System.", pub_cf_download: "cloudflared herunterladen – für dieses System: {file}", pub_cf_where: "Die Datei {file} in einen dieser Ordner legen (umbenennen nicht nötig, ein Unterordner „cloudflared“ geht auch): {paths}. Danach Speichern.", pub_cf_or_proxy: "Oder einen eigenen Proxy nutzen.", pub_err_cloudflared_missing: "cloudflared fehlt.", pub_err_cloudflared_not_executable: "cloudflared ist nicht ausführbar.", pub_err_port_in_use: "Port {port} ist belegt – bitte einen anderen wählen.", pub_err_cloudflared_exit: "cloudflared wurde beendet (Code {code}) – startet gleich neu.", pub_err_cloudflared_failed: "cloudflared ließ sich nicht starten: {code}",
    share_active: "Aktive Links",
    share_revoke: "Widerrufen",
    share_expired: "abgelaufen",
    share_until: "bis",
    share_opened: "geöffnet",
    share_once: "Den Link gibt es nur jetzt – er wird nicht gespeichert. Später: widerrufen und neu erstellen.",
    share_local: "Das ist eine Adresse aus deinem Heimnetz – von außen funktioniert der Link nur mit externer URL (Einstellungen → System → Netzwerk).",
    share_copied: "kopiert",
    share_copy: "Link kopieren",
    share_send: "Teilen …",
    share: "Teilen per Link",
    share_help: "Für Personen ohne Home-Assistant-Konto. Sie sehen nur diese Liste (ohne Notizen) – sonst nichts aus Home Assistant. Standard: nur ansehen.",
    barcode_lookup: "Strichcodes online nachschlagen",
    barcode_lookup_help: "Open Food Facts, es wird nur die Nummer gesendet. Aus: nur schon bekannte Codes.",
    tab_stats: "Statistik",
    l_show_templates: "Vorlagen-Knopf (📋)",
    l_show_scan: "Strichcode-Knopf",
    l_show_prices: "Preise und Summe",
    p_group_combined: "Kombinierte Listen", p_group_lists: "Listen", p_group_notes: "Notizen", app_list_pending: "Kombinierte Liste aus der App – noch nicht in Home Assistant verbunden", app_list_admin: "Verbinden kann ein Home-Assistant-Admin (hier antippen oder unter Verbundene Geräte).", share_combined: "Achtung: Eine kombinierte Liste teilt die Artikel aller ihrer Quell-Listen.",
    aisle_sort: "Sortieren", aisle_drag: "Ziehen zum Verschieben", emoji_pick: "Symbol wählen", emoji_free: "eigenes", emoji_food: "Essen", emoji_occasion: "Anlässe & Haushalt", emoji_people: "Personen", emoji_symbols: "Zeichen", emoji_none: "ohne",
    trip_done: "Einkauf beendet", trip_help: "Die Summe „im Wagen“ beginnt wieder bei 0. Ausgaben bleiben gebucht. Für Listen, die du immer wieder nutzt, kannst du alles Abgehakte gleich wieder öffnen.", trip_reopen: "Alles wieder offen", trip_finish: "Beenden", stats_forget: "Aus dem Verlauf löschen", stats_forget_help: "wird aus Statistik, Vorschlägen und Kaufrhythmus entfernt (z. B. versehentlich hinzugefügt).", exp_entries: "Buchungen", notes_create: "Notizliste anlegen", notes_create_help: "Name der Notizliste. Sie gehört dir; angelegt als todo.ha_smartlists_notes_<name>.",
    p_lists_all: "Alle Listen", p_lists_less: "Weniger",
    scan_native_help: "Den Strichcode auf der Verpackung ins Bild halten.", scan_type: "Nummer eintippen", scan_not_product: "Das ist kein Produkt-Strichcode (EAN).",
    scan_target: "Ziel-Liste", scan_target_this: "diese Liste (der Karte)", scan_mode: "Gescanntes", scan_mode_input: "ins Eingabefeld (prüfen, dann hinzufügen)", scan_mode_add: "direkt hinzufügen", barcode_providers: "Dienste zum Nachschlagen", barcode_providers_help: "Antippen schaltet ein/aus, die Zahl ist die Reihenfolge – der erste Treffer zählt. Gefundene Codes merkt sich SmartLists.", barcode_custom: "eigener Dienst", barcode_custom_url: "Adresse mit {code}", barcode_custom_field: "Feld für den Namen",
    a_applies: "Gilt für", a_menu: "Artikel-Menü", a_shop: "Einkaufen und Scannen", a_me_sub: "Gilt nur für dich.", a_look: "Badges und Farben", a_global_sub: "Gilt für alle Benutzer, auch in der App.", a_cats: "Kategorien", a_devices: "Geräte und Notizen", a_rights: "Teilen und Rechte", a_rights_sub: "Was Benutzer ohne Admin-Rechte dürfen.", a_data: "Sprache, Sichern, Standard", a_stats: "Statistik und Ausgaben", a_search: "Einstellung suchen", admin_only_short: "nur Admins", g_stats: "Auswertung", ls_done: "Fertig", rights_who: "Links erstellen dürfen", rights_share_who: "Links erstellen dürfen", rights_who_admins: "nur Admins", rights_who_owners: "Admins und Besitzer der Liste", rights_who_editors: "alle, die die Liste bearbeiten dürfen", rights_who_nobody: "niemand (Teilen aus)", rights_max: "Ein Link darf höchstens", rights_share_max: "Ein Link darf höchstens", rights_max_on: "abhaken und hinzufügen", rights_limits_help: "Die Grenzen gelten für Benutzer ohne Admin-Rechte.", rights_max_hours: "Längste Gültigkeit", rights_share_max_hours: "Längste Gültigkeit", rights_all_links: "Aktive Links aller Listen zeigen", rights_no_links: "Keine aktiven Links.", rights_share_help: "Links geben Personen ohne Konto Zugriff auf eine einzelne Liste.", rights_other: "Ohne Admin-Rechte erlaubt", rights_create_lists: "Eigene Listen anlegen", rights_templates: "Vorlagen anlegen und ändern", rights_categories: "Kategorien von Hand zuordnen", rights_prices: "Preise eintragen", ls_list: "Liste", ls_list_help: "Gilt für diese Liste auf allen Geräten, solange eine Karte oder ein Gerät nichts anderes festlegt.", ls_name: "Name", ls_sort: "Sortiert nach", ls_default: "Standard der Karte",
    w_title: "SmartLists einrichten", w_time: "Dauert etwa zwei Minuten.", w_step: "Schritt {n} von {m}", w_s_lists: "Listen", w_s_stores: "Märkte", w_s_naming: "Schreibweise", w_s_lang: "Sprache", w_s_people: "Personen und App", w_s_extras: "Extras", w_s_done: "Fertig", w_lists_h: "Womit möchtest du anfangen?", w_lists_found: "SmartLists hat {n} To-do-Listen in Home Assistant gefunden.", w_lists_none: "In Home Assistant gibt es noch keine To-do-Liste.", w_use: "Vorhandene Listen benutzen", w_use_sub: "Sie bleiben, wie sie sind. SmartLists zeigt sie mit Kategorien, Mengen und Märkten.", w_combine: "Zu einer gemeinsamen Liste zusammenfassen", w_combine_sub: "Jeder behält seine Liste, die gemeinsame zeigt alle.", w_combine_name: "Name der gemeinsamen Liste", w_combine_default: "Einkauf", w_new: "Eine neue Liste anlegen", w_new_sub: "Nur in SmartLists, du bist Besitzer und kannst sie freigeben.", w_new_name: "Name der Liste", w_open: "offen", w_stores_h: "Wo kaufst du ein?", w_stores_lead: "Die Märkte stehen dann beim Eintippen zur Auswahl, und im Einkaufsmodus siehst du nur, was du im jeweiligen Markt brauchst.", w_store_other: "Anderer Markt", w_store_add: "Hinzufügen", w_chosen: "Ausgewählt: {list}", w_chosen_none: "Noch kein Markt ausgewählt", w_becomes: "wird zu", w_stores_later: "Standorte der Märkte kannst du später hinzufügen. Dann wählt SmartLists den Markt von selbst, wenn du dort bist.", w_naming_h: "Wie markierst du Markt, Person und Schlagwort?", w_naming_lead: "Ein Zeichen direkt vor einem Wort macht daraus ein Badge. Es bleibt im Artikeltext stehen, deshalb sehen es auch Home Assistant und die App.", w_eg_store: "zum Beispiel @REWE", w_eg_person: "zum Beispiel *Anna", w_eg_tag: "zum Beispiel #bio", w_naming_bad: "„{c}“ ist nicht erlaubt.", w_naming_dup: "Jedes Zeichen nur einmal verwenden.", w_naming_hint: "Erlaubt sind {chars}. Leer lassen schaltet eine Art aus. Die HA-SmartLists-App übernimmt diese Zeichen beim Koppeln.", w_eg_item: "Milch", w_eg_qty: "2 l", w_lang_h: "In welcher Sprache schreibt ihr Artikel?", w_lang_lead: "Daran erkennt SmartLists die Kategorie, zum Beispiel Milch in der Kühlung. Mehrere Sprachen gehen zusammen.", w_words: "Wörter", w_people_h: "Wer macht mit?", w_people_lead: "Rechte für die neue Liste. Alle sehen SmartLists in ihrer Seitenleiste.", w_people_combined: "Kombinierte Listen sehen alle, die die Quell-Listen sehen. Rechte pro Person gibt es für eigene SmartLists-Listen.", w_you: "du, Admin", w_all: "darf alles", w_app: "HA-SmartLists-App auf dem Gerät", w_app_sub: "In der App unter Einstellungen → Verbindung auf „Koppeln“ tippen. Verbundene Geräte stehen danach unter Global → Geräte und Notizen.", w_extras_h: "Was soll SmartLists noch können?", w_extras_lead: "Alles lässt sich später ein- und ausschalten.", w_x_notify: "Bescheid geben, wenn jemand etwas einträgt", w_x_notify_sub: "An dein Gerät mit der Home-Assistant-App", w_x_notify_none: "Kein Gerät mit Home-Assistant-App gefunden", w_x_voice: "Per Sprache eintragen", w_x_voice_sub: "„Setz Milch auf die Einkaufsliste“ mit Assist", w_x_prices: "Preise und Ausgaben", w_x_prices_sub: "Summe der Liste und Übersicht pro Monat", w_x_barcode: "Strichcodes online nachschlagen", w_x_barcode_sub: "Bei Open Food Facts, es wird nur die Nummer gesendet", w_x_share: "Besitzer dürfen Listen per Link teilen", w_x_share_sub: "Für Personen ohne Home-Assistant-Konto, zum Beispiel Nachbarn oder Gäste", w_done_h: "Alles eingerichtet", w_done_lead: "Das wird angelegt. Ändern kannst du alles jederzeit in den Einstellungen.", w_sum_combined: "Gemeinsame Liste „{name}“ aus {lists}", w_sum_new: "Neue Liste „{name}“", w_sum_lists: "Listen: {lists}", w_sum_stores: "Märkte: {list}", w_sum_naming: "Schreibweise: {list}", w_sum_lang: "Kategorien: {list}", w_sum_people: "Freigaben: {list}", w_sum_extras: "An: {list}", w_off: "aus", w_tip: "Tipp: Im Eingabefeld einfach lostippen, zum Beispiel „2 kg Äpfel @REWE“.", w_back: "Zurück", w_next: "Weiter", w_skip: "Überspringen", w_finish: "Einrichten", w_start: "Los geht's", w_later: "Später in den Einstellungen änderbar", w_close: "Einrichtung schließen", w_restart: "Einrichtung erneut starten", w_restart_sub: "Der Assistent vom ersten Start, z. B. um weitere Listen zusammenzufassen.",
    more: "Mehr", ih_title: "Verlauf", ih_none: "Noch keine Einträge.", ih_add: "hinzugefügt", ih_check: "abgehakt", ih_uncheck: "wieder offen", ih_rename: "umbenannt", ih_remove: "gelöscht", ih_link: "über geteilten Link", ih_auto: "Automation", mp_title: "Wochenplan", mp_add: "Gericht", mp_help: "Gerichte sind Vorlagen. „Zutaten auf die Liste“ setzt alles dieser Woche auf die Liste, gleiche Artikel werden zusammengezählt. Der Plan erscheint auch als Kalender in Home Assistant.", mp_no_tpl: "Erst eine Vorlage anlegen (⋯ → Vorlagen).", mp_prev: "Vorige Woche", mp_next: "Nächste Woche", mp_mealie: "Aus Mealie holen", mp_recipes: "Rezepte übernommen", mp_to_list: "Zutaten auf die Liste", db_title: "Einkaufs-Dashboard", db_help: "Legt eine eigene Ansicht in der Seitenleiste an: alle Listen, Wochenplan und Statistik. Lässt sich danach wie jedes Dashboard bearbeiten.", db_create: "Dashboard anlegen", db_open: "Dashboard öffnen", db_lists: "Listen", db_plan: "Wochenplan", db_stats: "Statistik",
    rs_title: "Von vorn anfangen", rs_help: "Wähle, was zurückgesetzt wird. Danach startet der Einrichtungs-Assistent. To-do-Listen und ihre Artikel werden nie gelöscht, persönliche Einstellungen der Benutzer bleiben.", rs_settings: "Einstellungen zurücksetzen", rs_settings_sub: "Namenskonvention, Badges und Farben, Märkte und Zonen, Gang-Reihenfolgen, Rechte, Sprache und Automationen, Darstellung der Listen, Wortlisten.", rs_data: "Gelernte Daten löschen", rs_data_sub: "Gemerkte Kategorien, Verlauf und Statistik, Preise und Ausgaben, Vorlagen und Wochenplan.", rs_links: "Alle Teilen-Links zurückziehen", rs_links_sub: "Geteilte Links funktionieren danach nicht mehr.", rs_combined: "Kombinierte Listen entfernen", rs_combined_sub: "Nur die zusammengefasste Ansicht – die Quell-Listen bleiben unverändert.", rs_go: "Zurücksetzen und Assistent starten",
    mp_saved: "Plan gespeichert", mp_ask_add: "Zutaten dieser Woche jetzt auf die Liste setzen?", mp_not_now: "Nein, nur speichern",
    notify_own: "Auch bei eigenen Änderungen", notify_own_sub: "z. B. wenn du am PC etwas einträgst und es aufs Gerät willst – oder zum Ausprobieren.", notify_test: "Testnachricht senden", notify_test_sent: "Testnachricht gesendet – kommt sie nicht an, Companion-App und Benachrichtigungsrechte prüfen.",
    m_select: "Auswählen", sel_mode: "Mehrere auswählen", sel_count: "{n} ausgewählt", sel_all: "Alle", sel_none: "Keine", sel_check: "Abhaken", sel_checked: "abgehakt", sel_reopened: "wieder offen", sel_delete_q: "{n} Artikel löschen?",
    mp_target: "Zutaten auf:",
    p_tab_lists: "Listen",
    nt_add: "Ziel hinzufügen", nt_none: "Noch kein Ziel – dann kommt keine Nachricht.", nt_service: "Benachrichtigungsdienst", nt_entity: "Benachrichtigungs-Entität", nt_custom: "Eigener Dienst", nt_no_services: "Keine notify-Dienste gefunden.", nt_no_entities: "Keine notify-Entitäten gefunden.", nt_custom_help: "Beliebiger Dienst (nur Admins), z. B. telegram_bot.send_message oder script.meine_nachricht. Daten als JSON; {title} und {message} werden ersetzt – ohne Platzhalter kommen title und message dazu.", nt_help: "Mehrere Ziele sind möglich: Companion-App, Telegram, E-Mail, Signal, Lautsprecher … – alles, was Home Assistant als Benachrichtigung kennt.", nt_bad_service: "Dienst im Format domain.dienst angeben.",
    mg_title: "Listen übernehmen", mg_sub: "Vorhandene To-do-Listen (Einkaufsliste, Local To-do …) in eigene SmartLists-Listen übernehmen – mit Artikeln, Notizen und Häkchen.", mg_help: "Die neuen Listen gehören dir und lassen sich danach teilen. Wähle eine oder mehrere Listen.", mg_lists: "Listen", mg_none: "Keine passenden Listen gefunden.", mg_how: "Mehrere Listen", mg_each: "Je Liste eine eigene", mg_each_sub: "Gleicher Name wie vorher.", mg_one: "Alle in eine Liste", mg_one_sub: "Alle Artikel zusammen in einer neuen Liste.", mg_name: "Name der neuen Liste", mg_tag: "Herkunft markieren als", mg_tag_none: "nicht markieren", mg_old: "Alte Liste", mg_used: "Wird in kombinierten Listen verwendet: {lists}. Trage dort die neue Liste ein, bevor du die alte löschst.", mg_pick: "Bitte mindestens eine Liste wählen.", mg_go: "Übernehmen", mg_items: "Artikel",
    mg_pf_local: "Lokale To-do", mg_pf_shopping: "Einkaufsliste", mg_pf_other: "Andere",
    mg_keep_info: "Die alte Liste bleibt unverändert erhalten. Prüfe die neue Liste und lösche die alte danach selbst.", mg_done_hint: "Die alten Listen gibt es noch. Wenn in der neuen Liste alles passt, lösche sie bitte selbst (Einstellungen → Geräte & Dienste, z. B. bei Local To-do bzw. der jeweiligen Integration):", mg_done_combined: "Mindestens eine alte Liste ist Quelle einer kombinierten Liste – trage dort zuerst die neue Liste ein.",
    mg_pf_notes: "Notizen", mg_as: "Übernehmen als", mg_as_list: "Liste", mg_as_list_sub: "Eigene SmartLists-Liste mit Kategorien, Mengen und Einkaufsfunktionen.", mg_as_notes: "Notizen", mg_as_notes_sub: "Neue Notizliste (nur für dich sichtbar), Notizen mit Titel und Text – auch verschlüsselte bleiben erhalten.",
    owner_everyone: "— alle (keine Einschränkung)", owner_combined_help: "Mit Besitzer sehen die Liste nur er, Admins und die Freigegebenen.",
    lb_title: "Herkunfts-Badges", lb_help: "Zeigt bei jedem Artikel, aus welcher Liste er kommt.", lb_show: "Badge zeigt", lb_list: "Listenname", lb_owner: "Besitzer der Quell-Liste", lb_both: "Besitzer und Listenname", lb_show_help: "Quell-Listen ohne Besitzer (Local To-do …) zeigen immer den Listennamen.", lb_only: "Nur von diesen Listen", lb_all: "alle",
    lb_colors: "Farbe je Quell-Liste (ohne Wahl: automatisch, jede Liste eine andere)",
  },
  en: {
    add_placeholder: "e.g. 2 kg apples {store}", add_ph_store: "Store", note: "Note", save: "Save", cancel: "Cancel",
    done: "Done", clear: "Clear completed", own: "Own list", combined: "Combined", foreign: "Foreign",
    empty: "Nothing to buy 🎉", no_add: "Adding is disabled for this list.", open: "open",
    confirm_delete: "Really delete item?", confirm_clear: "Remove all completed items?",
    error: "Error", loading: "Loading …", readonly: "View only", delete: "Delete", edit: "Edit",
    frequent: "Frequently bought", src_manual: "remembered", src_learned: "learned", src_pack: "automatic", src_fallback: "unknown",
    unit_hint: "usual unit", category: "Category", settings: "Settings", naming: "Naming convention",
    naming_help: "A character in front of a word turns it into a badge. Applies to all lists and devices.",
    kind_store: "Store", kind_person: "Person", kind_tag: "Tag", add_rule: "Add rule", example: "Example",
    learned: "Remembered categories", learned_help: "Created when you pick a category manually.", forget: "Forget",
    none_learned: "Nothing remembered yet.", saved: "Saved", admin_only: "Only administrators can change this.",
    in_list: "already on the list",
    tab_me: "For me", tab_house: "Global", tab_list: "This list", ui_me_help: "Applies to you only. Differences from the global setting are marked •.",
    ui_house: "Controls – default for everyone", reset_default: "Reset to default", about_list: "About this list", type: "Type", entity: "Entity", sources: "Sources",
    type_combined: "Combined list", type_own: "Own SmartLists list", type_list: "Home Assistant to-do list", char: "Character", kind: "Kind",
    no_hits_short: "Nothing found.", by_hand: "by hand", search_learned: "Search … (e.g. milk)",
    automation: "Voice & automations", automation_help: "Assist and due items. Blueprints for “I'm at the store” and store reminders: see the wiki.",
    auto_voice_default_list: "Default list for Assist", auto_voice_help: "Used when a sentence names no list.",
    auto_auto_due_list: "Automatically add due items to", auto_due_help: "Hourly, by your buying rhythm. “—” = off.",
    install_sentences: "Install Assist sentences", sentences_installed: "installed",
    devices: "Connected devices", devices_help: "Devices with the HA SmartLists app. ⚠️ = not synced for 7+ days. To revoke access, delete the token in the profile.",
    no_devices: "No device connected yet.", remove_device: "Remove from list", last_seen: "last seen",
    role_all: "all rights", admin_always: "Admin – can always do everything", shop_large_help: "Easier to hit with your thumb. Off: same size as the normal view.",
    new_list_help: "You are the owner and can share it with others afterwards.", new_list_placeholder: "e.g. Drugstore", create: "Create",
    p_columns: "Several lists side by side", p_wide: "Wide layout", p_settings: "Settings", p_back: "Back to the lists",
    p_hint: "Tap lists to show them side by side (more than 3 wrap into rows). Drag items with the mouse into another list to move them (Ctrl = copy).",
    p_empty: "No to-do lists found. Add one under Settings → Devices & services → SmartLists – or with + above.",
    owner: "owner", shared: "shared", private: "private", admin: "admin", sharing: "Sharing",
    sharing_help: "Who may see and change this list. Admins can always do everything. HA's to-do view shows every list to everyone – it is hidden only in SmartLists (card, page, app).",
    role_none: "no access", role_viewer: "view", role_checker: "check off", role_editor: "edit", role_owner: "owner",
    no_users: "No other users in Home Assistant.", delete_list: "Delete list", confirm_delete_list: "Delete this list with all items?",
    new_list: "New list", new_list_prompt: "Name of the new list:",
    due_every: "due – you buy it about every", days: "days", backup: "Backup & transfer",
    backup_help: "Remembered categories, history, naming convention and controls as a file – e.g. for a second HA instance. Import adds without deleting anything.",
    export: "Export", import: "Import …",
    mini_open: "Open list", mini_close: "Collapse", card_version: "card", stale_card: "This card is outdated – reload the page (Ctrl+F5) or clear the frontend cache in the app.", offer: "Offer", offer_until: "until", offer_expired: "expired",
    qty_less: "Decrease quantity", qty_more: "Increase quantity", qty_changed: "quantity changed",
    search: "Search", search_placeholder: "Search this list …", hits: "matches", no_hits: "Nothing found for", add_this: "add",
    imp: "Import", imp_ha: "From Home Assistant", imp_text: "As text", imp_source: "List",
    imp_done: "Include completed", imp_skip_dupes: "Skip items already on the list", imp_go: "Import",
    imp_text_help: "One item per line. Bullets, [ ] / [x] and numbers are recognised, as are quantities and tags.",
    imp_preview: "Preview", imp_none: "Nothing to import.", imp_count: "items", imported: "imported", imp_dupe: "exists",
    imp_no_lists: "No other to-do lists found in Home Assistant.",
    shop_on: "Start shopping mode", shop_off: "End shopping mode", in_cart: "in cart", undo: "Undo", checked_off: "checked", unchecked: "reopened",
    deleted: "deleted", removed: "completed removed", added: "added", changed: "changed",
    m_rename: "Rename / edit", m_move: "Move to …", m_copy: "Copy to …", m_category: "Change category", m_delete: "Delete",
    moved: "moved to", copied: "copied to", no_targets: "No other list you can write to.",
    ui: "Controls", ui_help: "Every user sets this for themselves. Optionally different per device.",
    scope_household: "Default for everyone", scope_user: "For me on all devices", scope_device: "Only on this device",
    scope_help_household: "Applies to everyone who hasn't set their own.",
    scope_help_user: "Only your differences from the default are saved (marked •). “Reset” = back to default.",
    scope_help_device: "Applies to this browser or device only. “Reset” = back to your setting.",
    press_gesture: "Gesture for the item menu", g_long: "Long press", g_double: "Double click", g_right: "Right click", g_off: "Off",
    press_target: "Where the gesture works", t_row: "Whole row", t_name: "Name only",
    press_result: "What the gesture does", r_menu: "Open menu", r_edit: "Edit directly", r_delete: "Delete (with confirmation)",
    menu_actions: "Menu entries", row_buttons: "Show pencil and bin in the row",
    shop: "Shopping mode", shop_hide_checked: "Hide checked items", shop_keep_awake: "Keep screen on",
    shop_large: "Large rows", shop_tap_row: "Tap whole row to check", reset: "Reset",
    sort: "Sort", sort_category: "Category", sort_alpha: "A–Z", sort_added: "Added", sort_list: "By list",
    packs: "Category detection (keyword packs)", packs_help: "Keywords → category. Several packs can be active at once (e.g. English + your own). On equal keywords the pack higher up wins. Remembered categories always take precedence.",
    pack_terms: "keywords", pack_products: "products", pack_builtin: "built-in", pack_custom: "custom", pack_priority: "rank",
    pack_up: "Move up (precedence)", pack_download: "Download", pack_delete: "Delete custom pack?", pack_bad_json: "File is not valid JSON.",
    pack_upload: "Upload pack …", pack_name_help: "Name for the pack. The same name replaces an existing custom pack.", pack_add: "Add",
    pack_skipped: "skipped (unknown category)", pack_template: "Template",
    card_desc: "Shopping list with categories, suggestions, quantities, store badges (@REWE) and permissions.",
    imp_placeholder: "- Milk 2 l @REWE\n- [ ] Bread\n- [x] Butter\n3 apples",
    e_preset_pick: "— Choose a preset (sets several options) —", e_view_list: "List", e_view_tiles: "Tiles (e.g. kitchen tablet)", e_view_mini: "Mini tile (summary, expandable)",
    e_sort_category: "By category", e_sort_added: "Order added", e_sort_list: "By source list (combined)",
    e_layout_tabs: "Tabs", e_layout_columns: "Side by side", e_layout_stack: "Stacked",
    e_density_compact: "Compact", e_density_normal: "Normal", e_density_comfortable: "Large (touch)",
    e_sec_multi: "Several lists in one card", e_sec_filter: "Filters", e_sec_look: "Appearance", e_sec_header: "Header", e_sec_input: "Input",
    e_sec_list: "List", e_sec_done: "Completed", e_sec_shop: "Shopping mode",
    e_pre_family: "Family shopping (everything on)", e_pre_kitchen: "Kitchen tablet (large tiles)", e_pre_store: "In the store (shopping mode, no input)",
    e_pre_readonly: "View only", e_pre_tile: "Compact dashboard tile",
    l_preset: "Preset", l_entity: "List", l_entities: "Lists (instead of “List” above)", l_layout: "Layout", l_title: "Title (empty = list name)",
    l_view: "View", l_sort: "Default sort", l_advanced: "Show advanced options",
    l_filter_store: "Only store (e.g. REWE; several separated by commas)", l_filter_person: "Only person (e.g. Anna)", l_filter_tag: "Only tag (e.g. organic)",
    l_filter_category: "Only categories", l_filter_offers: "Only offers", l_filter_tags_new_items: "New items get the filter tag (@REWE …)",
    l_show_filter_chips: "Filter bar (tap stores, people, offers)",
    l_density: "Row height", l_font_scale: "Font size", l_radius: "Corner radius", l_accent_color: "Accent colour (empty = theme)",
    l_show_header: "Show header", l_show_count: "Open count / matches", l_show_search: "Search (magnifier)",
    l_show_sort: "Sort picker", l_show_shopping: "Shopping mode button", l_show_undo: "Undo (↶)",
    l_show_import: "Import button", l_show_settings: "Gear (personal settings)",
    l_show_add: "Input field for adding", l_show_frequent: "“Frequently bought”",
    l_drag_drop: "Drag & drop (mouse): move to another list, reorder", l_show_stepper: "Quantity stepper (− +)", l_show_offer: "Offers from the app (store, price, valid until)",
    l_show_tags: "Badges (@store, *person, #tag)", l_show_source: "Origin (source list / person)", l_show_note: "Notes",
    l_show_category_titles: "Category headings", l_max_height: "Maximum list height (empty = unlimited)",
    l_show_completed: "Show completed", l_collapse_completed: "Completed collapsed at first", l_start_shopping: "Start in shopping mode",
    hh_preset: "Sets matching options at once – afterwards everything can be changed individually.",
    hh_entities: "Several lists: as tabs, side by side or stacked. All options apply to every list.",
    hh_filter_tags_new_items: "Otherwise new items would disappear right away in a filtered card.",
    hh_show_settings: "Gesture, menu and shopping mode are set by each user in the gear menu.",
    hh_show_category_titles: "Off: sorted by category, but as one list with the category icon in front.",
    hh_start_shopping: "Handy for a tablet in the hallway or a dashboard just for shopping.",
    shop_auto_store: "Pick store by zone automatically", shop_auto_store_help: "When you are in a store's zone (e.g. REWE), shopping mode shows only its items.",
    shop_untagged: "Also show items without a store", shop_untagged_help: "In shopping mode for one store, additionally everything without @store.",
    shop_store: "Store", shop_all_stores: "All",
    pack_edit: "Edit keywords", pack_new: "New pack", pack_new_help: "Empty pack, e.g. for another language or your own terms. It is activated at the top.", pack_new_placeholder: "e.g. Nederlands",
    pack_empty: "No keywords yet – add some above.", pack_changed: "changed", pack_revert: "Revert change", pack_ignore: "Ignore (as Other)",
    pack_more: "Load more", pack_term_placeholder: "Keyword (several with commas)",
    pack_builtin_edit_help: "Built-in pack: changes go into the add-on pack “+” and survive updates.", pack_edit_help: "Custom pack: changes apply immediately.",
    zone: "Zone", zone_new: "New zone", zone_new_help: "Name of the zone. Position: this device's current location (otherwise home), radius 100 m – fine-tune under Settings → Areas & zones.",
    zone_wait: "Zone created – it appears in a moment, then link it here.", zone_here: "this device's location", zone_home: "home position – please adjust",
    zone_none: "no zone", zone_manage: "Manage zones ↗", store_add: "Store with zone", store_add_help: "Name of the store, as in @REWE. A zone is created for it next.",
    stores: "Stores & zones", stores_help: "Link stores to Home Assistant zones. In shopping mode you then automatically see only the items of the store you are in.",
    notes: "App notes", notes_help: "The HA SmartLists app stores notes as a to-do list of its own. They are not shopping lists and are therefore hidden by default.",
    notes_show: "Show in SmartLists", notes_show_help: "As a separate 📝 section on the page – not in Assist, actions or combined lists.",
    notes_scope: "Who sees notes", notes_scope_owner: "own account only", notes_scope_household: "all users",
    notes_lists: "Note lists and owners", notes_none: "No note list of the app found.", notes_no_owner: "unknown (admins only)",
    p_order: "Change order", p_order_hint: "◀ ▶ moves a list. With the mouse: drag a chip onto another. The order also applies to the columns.",
    p_left: "Move left", p_right: "Move right",
    look: "Badges & colours", look_help: "How badges look for all users. Store colours and names also apply in the app. Empty or ↺ = default.",
    look_style: "Style", look_filled: "filled", look_soft: "subtle", look_outline: "outline", look_text: "text only",
    look_color: "Background colour", look_text: "Text colour", look_icon: "Symbol in front", look_label: "Display name", look_kinds: "Per kind", look_values: "Individual badges",
    look_search: "Search badge … (e.g. rewe)", look_more: "Find more via search.", look_add: "Colour a badge",
    look_add_help: "With its character, e.g. @Kaufland, *Max or #vegan – even if not used yet.",
    zone_count: "zones", zone_unlink: "Unlink zone", zone_add: "Zone",
    app_list: "combined list of the app", app_list_connected: "connected", app_list_connect: "Connect",
    zone_name: "Zone name, e.g. REWE Standort Test", zone_radius: "Radius", zone_coords: "Coordinates or map link", zone_coords_placeholder: "52.5200, 13.4050 or a Google/Apple/OSM maps link", zone_coords_bad: "No coordinates recognised.", zone_locating: "Getting location …", zone_no_location: "Location not available – choose another option.", zone_where: "Where?", zone_here_opt: "Current location (this device)", zone_home_opt: "Home", zone_map_opt: "Pick on the map", zone_after: "Fine-tune any time under Settings → Areas & zones.",
    note_new: "New note", note_edit: "Edit note", note_view: "List / grid", note_empty: "No notes yet.", note_locked: "Encrypted note", note_locked_help: "Encrypted with the app's notes password – readable only in the app.", note_title: "Title", note_body: "Text",
    p_settings_hint: "",
    list_settings_hint: "Controls and everything global: ⚙ at the top right of the page.",
    settings_list: "Settings of this list", settings_global: "General settings", list_settings_hint_card: "Controls and everything global: the slider icon in the header.",
    tpl: "Templates",
    scan: "Scan barcode",
    price_sum: "Total",
    soft_checked: "marked from outside (link)",
    soft_checked_help: "Someone marked this as done via a shared link – the item stays open until you check it off.",
    price: "Price",
    aisle: "Order",
    price_paid: "last paid",
    price_manual: "own price",
    price_last: "last time",
    tpl_servings: "Servings",
    tpl_new: "New template",
    tpl_from_list: "List as template",
    tpl_increase: "already on the list → quantity is increased",
    tpl_servings_help: "Quantities are scaled",
    tpl_increased: "quantity increased",
    tpl_name: "Name, e.g. Pancakes",
    tpl_items_placeholder: "Flour 250 g\nMilk 0.5 l\nEggs 3",
    tpl_items: "Items",
    tpl_items_help: "One item per line, with quantity and tags as in the list. Servings (optional) = how many the quantities are for.",
    tpl_edit: "Edit template",
    scan_help: "Hold the barcode across the red line – or type the number below it.",
    scan_code: "Barcode number",
    scan_unknown: "Product not found – please type the name yourself.",
    scan_find: "Look up",
    scan_no_camera: "Camera scanning is not supported here (e.g. iPhone Safari, Firefox) – type the number.",
    aisle_down: "Move down",
    aisle_help: "This is how shopping mode sorts when this store is selected. Drag the handle ⠿ or use the arrows.",
    aisle_all_branches: "all branches",
    aisle_reset: "Default",
    notify_to: "Send to",
    notify_no_phone: "No device with the companion app found.",
    notify_added: "On new items",
    notify_checked: "When something is checked off",
    notify_lists: "Lists",
    notify_all_lists: "all I can see",
    notify_from: "From whom",
    notify_quiet: "Quiet hours",
    notify_quiet_none: "none",
    notify: "Notifications",
    notify_help: "When someone else changes something (your own changes only if switched on below). Several changes within a minute arrive as one message.",
    stats_90: "90 days",
    stats_year: "Year",
    stats_all: "all",
    stats_top: "Bought most often",
    stats_every: "every",
    stats_none: "Not enough history yet.",
    stats_overdue: "Not bought for a while",
    stats_add: "Add to list",
    stats_usually: "usually every",
    stats_since: "since",
    stats_shares: "By category · store",
    stats: "Statistics",
    stats_help: "From the existing history – no additional data is collected.",
    exp_week: "Week",
    exp_month: "Month",
    exp_year: "Year",
    exp_none: "No expenses yet – they are booked when items with a price are checked off.",
    exp_no_store: "no store",
    exp: "Expenses",
    exp_help: "Booked when checking off (price × quantity). Prices come from offers, by hand (e.g. “Milk 2 l 1.19€” or ✏️) or from the last purchase.",
    share_view: "view only",
    share_soft: "“soft” check (stays open)",
    share_check: "really check off",
    share_mode: "Allowed",
    share_mode_help: "“soft”: you see what was marked – the item stays open in your list. Items added via the link are marked with 🔗 in your list.",
    share_add: "May add",
    share_valid: "Valid",
    share_2h: "2 hours",
    share_1d: "1 day",
    share_7d: "7 days",
    share_30d: "30 days",
    share_forever: "until revoked",
    share_create: "Create link",
    soft_checked_by: "marked by {name} (link)", link_added_by: "added by {name} via link",
    x_stats: "Statistics and expenses", x_stats_help: "Bought most often, not bought for a while, shares per category and store, monthly expenses (📊 on the page, sensor “Expenses this month”). Off: hidden, counting continues in the background.", w_x_stats_sub: "What you buy often and how much you spend",
    share_soft_add: "“soft” check and add", link_added: "added via link", link_added_help: "Someone without an account added this via a shared link.",
    link_shared: "shared on the web", link_shared_help: "Reachable via {n} link(s) for people without an account. Tap to view or revoke the links.",
    pub_cf_arch: "{path} is built for another processor ({found}). This system needs {file} – delete or replace the old file.", pub_cf_kind_windows: "{path} is the Windows version. Home Assistant needs {file}.", pub_cf_kind_mac: "{path} is the macOS version. Home Assistant needs {file}.", pub_cf_kind_archive: "{path} is an archive (.tgz/.zip/.deb), not the program. Please download the file {file} without extension.", pub_cf_kind_html: "{path} is a saved web page, not the program. Download the file {file} directly from the release page.", pub_cf_kind_not_executable: "{path} cannot be executed (permissions). Put the file there again or check its permissions.", pub_cf_kind_unknown: "{path} does not fit this system. It needs {file}.",
    shared_change_hint: "To change: gear of this list → Sharing.",
    l_plain: "Plain list", l_plain_help: "No categories, suggestions, remembered words or prices. SmartLists remembers nothing from this list – its items never show up in other lists (e.g. hardware store).",
    l_categories: "Categories automatically", l_categories_help: "Off: no sorting into categories – neither in the list nor while typing. Sort e.g. by added instead.", l_suggest: "Bought often & suggestions", l_suggest_list: "only from this list", l_suggest_sources: "from its source lists", l_suggest_all: "from all lists", l_suggest_help: "What was bought in another list does not show up here. Older entries (before 3.9.4) still apply everywhere.",
    zone_dup_title: "Zone already exists", zone_dup_text: "There already is a zone “{name}”. You can keep the name (then there are two zones with the same name, e.g. two branches) or rename the new zone, e.g. “{name} Downtown”.", zone_dup_keep: "Keep name", zone_dup_rename: "Rename", zone_dup_rename_help: "Name of the new zone, e.g. with the area or street of the branch.", app_title: "Save as app on the home screen", app_lead: "An icon on your phone that opens this list directly – no extra app. Runs full screen like an app.", app_list: "List", app_shop: "Open straight in shopping mode", app_install: "Install", app_close: "Close", app_ios: "In Safari tap Share (□↑) at the bottom\nChoose Add to Home Screen\nTap Add – done", app_android: "In Chrome tap ⋮ at the top right\nChoose Add to Home screen or Install app\nConfirm Install – done", app_other: "In the browser menu choose Install app or Add to Home screen\nOn the phone: open this page in Chrome (Android) or Safari (iPhone)",
    x_title: "Extras", x_help: "Optional areas. Not needed to get started – switch them on here when you want them.", x_notes: "Notes", x_notes_help: "Note lists (e.g. from the HA SmartLists app) as a separate 📝 section. Who sees them is set under Devices and notes.", x_mealplan: "Meal plan", x_mealplan_help: "Dishes per day, ingredients onto the list, “Meal plan” calendar. Off: tab, menu entry and calendar disappear, planned dishes stay saved.", w_x_optional: "Optional – also later under Settings → Extras", w_x_notes_sub: "Note lists as a separate section, e.g. from the app", w_x_mealplan_sub: "Plan dishes per day and put the ingredients on the list", share_leak: "The link contains the address of your Home Assistant. To keep it private: Quick Tunnel or your own proxy (Settings → Sharing and permissions → Public address).", share_old_address: "address has changed, link no longer works", pub_title: "Public address for links", pub_help: "How shared links are reached. With a tunnel or your own proxy nobody learns the address of your Home Assistant.", pub_mode: "Links via", pub_ha: "Home Assistant address", pub_tunnel: "Cloudflare Quick Tunnel", pub_proxy: "Own proxy or tunnel", pub_ha_help: "As before: the link points to the external address of Home Assistant – whoever gets it knows that address.", pub_tunnel_help: "SmartLists starts cloudflared and gets a random address (…trycloudflare.com). The tunnel only leads to a small server of its own that serves nothing but shared lists – not to Home Assistant. No account and no port forwarding needed.", pub_proxy_help: "Forward your address to http://<IP of Home Assistant>:{port} (Caddy, nginx, Cloudflare Tunnel with your own domain …). Only the SmartLists share server runs there, not Home Assistant.", pub_url: "Public address", pub_port: "Port", pub_port_change: "change (optional)", pub_port_help: "Port of the share server (default 8126).", pub_starting: "Tunnel is starting …", pub_server_ok: "Share server is running on port {port}.", pub_not_ready: "not ready yet", pub_tunnel_note: "The tunnel address changes every time Home Assistant restarts – links created before then stop working. For lasting links: your own proxy or tunnel.", pub_cf_missing: "cloudflared was not found. SmartLists does not download it by itself.", pub_cf_not_exec: "Found {path}, but it is not executable or built for another system.", pub_cf_download: "Download cloudflared – for this system: {file}", pub_cf_where: "Put the file {file} into one of these folders (no need to rename it; a subfolder “cloudflared” works too): {paths}. Then Save.", pub_cf_or_proxy: "Or use your own proxy.", pub_err_cloudflared_missing: "cloudflared is missing.", pub_err_cloudflared_not_executable: "cloudflared is not executable.", pub_err_port_in_use: "Port {port} is in use – please choose another one.", pub_err_cloudflared_exit: "cloudflared stopped (code {code}) – restarting shortly.", pub_err_cloudflared_failed: "cloudflared could not be started: {code}",
    share_active: "Active links",
    share_revoke: "Revoke",
    share_expired: "expired",
    share_until: "until",
    share_opened: "opened",
    share_once: "The link is shown only now – it is not stored. Later: revoke and create a new one.",
    share_local: "This is an address from your home network – from outside the link only works with an external URL (Settings → System → Network).",
    share_copied: "copied",
    share_copy: "Copy link",
    share_send: "Share …",
    share: "Share via link",
    share_help: "For people without a Home Assistant account. They only see this list (without notes) – nothing else from Home Assistant. Default: view only.",
    barcode_lookup: "Look up barcodes online",
    barcode_lookup_help: "Open Food Facts, only the number is sent. Off: only codes already known.",
    tab_stats: "Statistics",
    l_show_templates: "Templates button (📋)",
    l_show_scan: "Barcode button",
    l_show_prices: "Prices and total",
    p_group_combined: "Combined lists", p_group_lists: "Lists", p_group_notes: "Notes", app_list_pending: "Combined list from the app – not connected in Home Assistant yet", app_list_admin: "A Home Assistant admin can connect it (tap here or under Connected devices).", share_combined: "Note: a combined list shares the items of all its source lists.",
    aisle_sort: "Sort", aisle_drag: "Drag to move", emoji_pick: "Choose symbol", emoji_free: "custom", emoji_food: "Food", emoji_occasion: "Occasions & home", emoji_people: "People", emoji_symbols: "Symbols", emoji_none: "none",
    trip_done: "Shopping done", trip_help: "The “in cart” total starts at 0 again. Expenses stay booked. For lists you reuse, you can reopen everything checked right away.", trip_reopen: "Reopen all", trip_finish: "Finish", stats_forget: "Delete from history", stats_forget_help: "is removed from statistics, suggestions and buying rhythm (e.g. added by mistake).", exp_entries: "Bookings", notes_create: "Create note list", notes_create_help: "Name of the note list. It belongs to you; created as todo.ha_smartlists_notes_<name>.",
    p_lists_all: "All lists", p_lists_less: "Less",
    scan_native_help: "Point the camera at the barcode on the package.", scan_type: "Type the number", scan_not_product: "This is not a product barcode (EAN).",
    scan_target: "Target list", scan_target_this: "this list (of the card)", scan_mode: "Scanned items", scan_mode_input: "into the input field (check, then add)", scan_mode_add: "add directly", barcode_providers: "Lookup services", barcode_providers_help: "Tap to turn on/off, the number is the order – the first hit counts. SmartLists remembers found codes.", barcode_custom: "custom service", barcode_custom_url: "URL with {code}", barcode_custom_field: "Field with the name",
    a_applies: "Applies to", a_menu: "Item menu", a_shop: "Shopping and scanning", a_me_sub: "Applies to you only.", a_look: "Badges and colours", a_global_sub: "Applies to all users, also in the app.", a_cats: "Categories", a_devices: "Devices and notes", a_rights: "Sharing and permissions", a_rights_sub: "What users without admin rights may do.", a_data: "Voice, backup, defaults", a_stats: "Statistics and expenses", a_search: "Search settings", admin_only_short: "admins only", g_stats: "Insights", ls_done: "Done", rights_who: "May create links", rights_share_who: "May create links", rights_who_admins: "admins only", rights_who_owners: "admins and the list's owner", rights_who_editors: "everyone who may edit the list", rights_who_nobody: "nobody (sharing off)", rights_max: "A link may at most", rights_share_max: "A link may at most", rights_max_on: "check off and add", rights_limits_help: "The limits apply to users without admin rights.", rights_max_hours: "Longest validity", rights_share_max_hours: "Longest validity", rights_all_links: "Show active links of all lists", rights_no_links: "No active links.", rights_share_help: "Links give people without an account access to a single list.", rights_other: "Allowed without admin rights", rights_create_lists: "Create own lists", rights_templates: "Create and change templates", rights_categories: "Assign categories by hand", rights_prices: "Enter prices", ls_list: "List", ls_list_help: "Applies to this list on all devices, unless a card or a device sets something else.", ls_name: "Name", ls_sort: "Sorted by", ls_default: "card default",
    w_title: "Set up SmartLists", w_time: "Takes about two minutes.", w_step: "Step {n} of {m}", w_s_lists: "Lists", w_s_stores: "Stores", w_s_naming: "Notation", w_s_lang: "Language", w_s_people: "People and app", w_s_extras: "Extras", w_s_done: "Done", w_lists_h: "What would you like to start with?", w_lists_found: "SmartLists found {n} to-do lists in Home Assistant.", w_lists_none: "There is no to-do list in Home Assistant yet.", w_use: "Use existing lists", w_use_sub: "They stay as they are. SmartLists shows them with categories, quantities and stores.", w_combine: "Combine into one shared list", w_combine_sub: "Everyone keeps their list, the shared one shows all of them.", w_combine_name: "Name of the shared list", w_combine_default: "Shopping", w_new: "Create a new list", w_new_sub: "Only in SmartLists; you are the owner and can share it.", w_new_name: "Name of the list", w_open: "open", w_stores_h: "Where do you shop?", w_stores_lead: "The stores are offered while typing, and shopping mode shows only what you need in that store.", w_store_other: "Other store", w_store_add: "Add", w_chosen: "Selected: {list}", w_chosen_none: "No store selected yet", w_becomes: "becomes", w_stores_later: "You can add the stores' locations later. Then SmartLists picks the store by itself when you are there.", w_naming_h: "How do you mark store, person and tag?", w_naming_lead: "A character right before a word turns it into a badge. It stays in the item text, so Home Assistant and the app see it too.", w_eg_store: "for example @REWE", w_eg_person: "for example *Anna", w_eg_tag: "for example #organic", w_naming_bad: "“{c}” is not allowed.", w_naming_dup: "Use each character only once.", w_naming_hint: "Allowed are {chars}. Leave empty to turn a kind off. The HA SmartLists app takes these characters when pairing.", w_eg_item: "Milk", w_eg_qty: "2 l", w_lang_h: "In which language do you write items?", w_lang_lead: "This is how SmartLists recognises the category, for example milk in chilled. Several languages work together.", w_words: "words", w_people_h: "Who joins in?", w_people_lead: "Permissions for the new list. Everyone sees SmartLists in their sidebar.", w_people_combined: "Combined lists are visible to everyone who sees the source lists. Per-person permissions exist for own SmartLists lists.", w_you: "you, admin", w_all: "may do everything", w_app: "HA SmartLists app on a device", w_app_sub: "In the app, tap “Pair” under Settings → Connection. Connected devices then appear under Global → Devices and notes.", w_extras_h: "What else should SmartLists do?", w_extras_lead: "Everything can be turned on and off later.", w_x_notify: "Tell me when someone adds something", w_x_notify_sub: "To your device with the Home Assistant app", w_x_notify_none: "No device with the Home Assistant app found", w_x_voice: "Add items by voice", w_x_voice_sub: "“Put milk on the shopping list” with Assist", w_x_prices: "Prices and expenses", w_x_prices_sub: "Total of the list and a monthly overview", w_x_barcode: "Look up barcodes online", w_x_barcode_sub: "At Open Food Facts, only the number is sent", w_x_share: "Owners may share lists via link", w_x_share_sub: "For people without a Home Assistant account, for example neighbours or guests", w_done_h: "All set", w_done_lead: "This will be set up. You can change everything any time in the settings.", w_sum_combined: "Shared list “{name}” from {lists}", w_sum_new: "New list “{name}”", w_sum_lists: "Lists: {lists}", w_sum_stores: "Stores: {list}", w_sum_naming: "Notation: {list}", w_sum_lang: "Categories: {list}", w_sum_people: "Sharing: {list}", w_sum_extras: "On: {list}", w_off: "off", w_tip: "Tip: just start typing in the input field, for example “2 kg apples @REWE”.", w_back: "Back", w_next: "Next", w_skip: "Skip", w_finish: "Set up", w_start: "Let's go", w_later: "Can be changed later in the settings", w_close: "Close setup", w_restart: "Run setup again", w_restart_sub: "The first-start assistant, e.g. to combine more lists.",
    more: "More", ih_title: "History", ih_none: "No entries yet.", ih_add: "added", ih_check: "checked off", ih_uncheck: "reopened", ih_rename: "renamed", ih_remove: "deleted", ih_link: "via shared link", ih_auto: "automation", mp_title: "Meal plan", mp_add: "Dish", mp_help: "Dishes are templates. “Add ingredients to list” puts everything of this week on the list; equal items are added up. The plan also appears as a calendar in Home Assistant.", mp_no_tpl: "Create a template first (⋯ → Templates).", mp_prev: "Previous week", mp_next: "Next week", mp_mealie: "Get from Mealie", mp_recipes: "recipes imported", mp_to_list: "Add ingredients to list", db_title: "Shopping dashboard", db_help: "Creates its own view in the sidebar: all lists, meal plan and statistics. Edit it afterwards like any dashboard.", db_create: "Create dashboard", db_open: "Open dashboard", db_lists: "Lists", db_plan: "Meal plan", db_stats: "Statistics",
    rs_title: "Start from scratch", rs_help: "Choose what to reset. The setup assistant starts afterwards. To-do lists and their items are never deleted; users' personal settings stay.", rs_settings: "Reset settings", rs_settings_sub: "Naming convention, badges and colours, stores and zones, aisle orders, permissions, voice and automations, list display, keyword packs.", rs_data: "Delete learned data", rs_data_sub: "Remembered categories, history and statistics, prices and expenses, templates and meal plan.", rs_links: "Revoke all share links", rs_links_sub: "Shared links stop working.", rs_combined: "Remove combined lists", rs_combined_sub: "Only the combined view – the source lists stay unchanged.", rs_go: "Reset and start assistant",
    mp_saved: "Plan saved", mp_ask_add: "Add this week's ingredients to the list now?", mp_not_now: "No, just save",
    notify_own: "Also for my own changes", notify_own_sub: "e.g. when you add something on the PC and want it on your device – or to try it out.", notify_test: "Send test message", notify_test_sent: "Test message sent – if it doesn't arrive, check the companion app and its notification permission.",
    m_select: "Select", sel_mode: "Select several", sel_count: "{n} selected", sel_all: "All", sel_none: "None", sel_check: "Check off", sel_checked: "checked off", sel_reopened: "reopened", sel_delete_q: "Delete {n} items?",
    mp_target: "Ingredients to:",
    p_tab_lists: "Lists",
    nt_add: "Add target", nt_none: "No target yet – no messages will be sent.", nt_service: "Notification service", nt_entity: "Notification entity", nt_custom: "Custom service", nt_no_services: "No notify services found.", nt_no_entities: "No notify entities found.", nt_custom_help: "Any service (admins only), e.g. telegram_bot.send_message or script.my_message. Data as JSON; {title} and {message} are replaced – without placeholders, title and message are added.", nt_help: "Several targets are possible: companion app, Telegram, e-mail, Signal, speakers … – anything Home Assistant knows as a notification.", nt_bad_service: "Enter the service as domain.service.",
    mg_title: "Take over lists", mg_sub: "Take existing to-do lists (shopping list, Local To-do …) over into own SmartLists lists – with items, notes and checkmarks.", mg_help: "The new lists belong to you and can be shared afterwards. Pick one or more lists.", mg_lists: "Lists", mg_none: "No suitable lists found.", mg_how: "Several lists", mg_each: "One own list each", mg_each_sub: "Same name as before.", mg_one: "All into one list", mg_one_sub: "All items together in one new list.", mg_name: "Name of the new list", mg_tag: "Mark origin as", mg_tag_none: "don't mark", mg_old: "Old list", mg_used: "Used in combined lists: {lists}. Add the new list there before you delete the old one.", mg_pick: "Please pick at least one list.", mg_go: "Take over", mg_items: "items",
    mg_pf_local: "Local To-do", mg_pf_shopping: "Shopping list", mg_pf_other: "Other",
    mg_keep_info: "The old list stays unchanged. Check the new list and delete the old one yourself afterwards.", mg_done_hint: "The old lists still exist. When everything is fine in the new list, please delete them yourself (Settings → Devices & services, e.g. Local To-do or the respective integration):", mg_done_combined: "At least one old list is a source of a combined list – add the new list there first.",
    mg_pf_notes: "Notes", mg_as: "Take over as", mg_as_list: "List", mg_as_list_sub: "Own SmartLists list with categories, quantities and shopping features.", mg_as_notes: "Notes", mg_as_notes_sub: "New note list (visible only to you), notes with title and text – encrypted ones are kept as they are.",
    owner_everyone: "— everyone (no restriction)", owner_combined_help: "With an owner, only they, admins and the people shared with see the list.",
    lb_title: "Origin badges", lb_help: "Shows on each item which list it comes from.", lb_show: "Badge shows", lb_list: "List name", lb_owner: "Owner of the source list", lb_both: "Owner and list name", lb_show_help: "Source lists without an owner (Local To-do …) always show the list name.", lb_only: "Only from these lists", lb_all: "all",
    lb_colors: "Colour per source list (default: automatic, a different one per list)",
  },
  fr: {
    add_placeholder: "p. ex. 2 kg pommes {store}", add_ph_store: "Magasin", note: "Note", save: "Enregistrer", cancel: "Annuler",
    done: "Terminé", clear: "Supprimer les terminés", own: "Liste propre", combined: "Combinée", foreign: "Externe",
    empty: "Rien à acheter 🎉", no_add: "L'ajout est désactivé pour cette liste.", open: "à faire",
    confirm_delete: "Supprimer vraiment cet article ?", confirm_clear: "Supprimer tous les articles terminés ?",
    error: "Erreur", loading: "Chargement …", readonly: "Lecture seule", delete: "Supprimer", edit: "Modifier",
    frequent: "Achetés souvent", src_manual: "mémorisé", src_learned: "appris", src_pack: "automatique", src_fallback: "inconnu",
    unit_hint: "unité habituelle", category: "Catégorie", settings: "Paramètres", naming: "Convention de nommage",
    naming_help: "Un caractère devant un mot en fait un badge. S'applique à toutes les listes et à tous les appareils.",
    kind_store: "Magasin", kind_person: "Personne", kind_tag: "Mot-clé", add_rule: "Ajouter une règle", example: "Exemple",
    learned: "Catégories mémorisées", learned_help: "Créées quand tu choisis une catégorie à la main.", forget: "Oublier",
    none_learned: "Rien de mémorisé pour l'instant.", saved: "Enregistré", admin_only: "Seuls les administrateurs peuvent modifier ceci.",
    in_list: "déjà sur la liste",
    tab_me: "Pour moi", tab_house: "Global", tab_list: "Cette liste", ui_me_help: "S'applique seulement à toi. Les écarts par rapport au réglage global sont marqués •.",
    ui_house: "Commandes – réglage par défaut pour tous", reset_default: "Rétablir les valeurs par défaut", about_list: "À propos de cette liste", type: "Type", entity: "Entité", sources: "Sources",
    type_combined: "Liste combinée", type_own: "Liste SmartLists propre", type_list: "Liste de tâches Home Assistant", char: "Caractère", kind: "Type",
    no_hits_short: "Aucun résultat.", by_hand: "à la main", search_learned: "Rechercher … (p. ex. lait)",
    automation: "Voix & automatisations", automation_help: "Assist et articles à racheter. Blueprints « Je suis au magasin » et rappel de magasin : voir le wiki.",
    auto_voice_default_list: "Liste par défaut pour Assist", auto_voice_help: "Utilisée quand la phrase ne cite aucune liste.",
    auto_auto_due_list: "Ajouter automatiquement les articles à racheter à", auto_due_help: "Toutes les heures, selon votre rythme d'achat. « — » = désactivé.",
    install_sentences: "Installer les phrases Assist", sentences_installed: "installées",
    devices: "Appareils connectés", devices_help: "Appareils avec l'app HA SmartLists. ⚠️ = pas synchronisé depuis plus de 7 jours. Pour retirer l'accès, supprime le jeton dans le profil.",
    no_devices: "Aucun appareil connecté.", remove_device: "Retirer de la liste", last_seen: "vu",
    role_all: "tous les droits", admin_always: "Admin – peut toujours tout faire", shop_large_help: "Plus facile à toucher avec le pouce. Désactivé : même taille que la vue normale.",
    new_list_help: "Tu en es le propriétaire et peux la partager ensuite.", new_list_placeholder: "p. ex. Droguerie", create: "Créer",
    p_columns: "Plusieurs listes côte à côte", p_wide: "Affichage large", p_settings: "Paramètres", p_back: "Retour aux listes",
    p_hint: "Touche des listes pour les afficher côte à côte (au-delà de 3, elles passent à la ligne). Glisse un article à la souris vers une autre liste pour le déplacer (Ctrl = copier).",
    p_empty: "Aucune liste trouvée. Crée-en une sous Paramètres → Appareils et services → SmartLists – ou avec + en haut.",
    owner: "propriétaire", shared: "partagée", private: "privée", admin: "admin", sharing: "Partage",
    sharing_help: "Qui peut voir et modifier cette liste. Les admins peuvent toujours tout faire. La vue To-do de HA montre chaque liste à tout le monde – elle n'est masquée que dans SmartLists (carte, page, app).",
    role_none: "aucun accès", role_viewer: "voir", role_checker: "cocher", role_editor: "modifier", role_owner: "propriétaire",
    no_users: "Aucun autre utilisateur dans Home Assistant.", delete_list: "Supprimer la liste", confirm_delete_list: "Supprimer cette liste avec tous ses articles ?",
    new_list: "Nouvelle liste", new_list_prompt: "Nom de la nouvelle liste :",
    due_every: "à racheter – vous l'achetez environ tous les", days: "jours", backup: "Sauvegarder & transférer",
    backup_help: "Catégories mémorisées, historique, convention de nommage et commandes dans un fichier – p. ex. pour une deuxième instance HA. L'import ajoute sans rien supprimer.",
    export: "Exporter", import: "Importer …",
    mini_open: "Ouvrir la liste", mini_close: "Réduire", card_version: "carte", stale_card: "Cette carte est obsolète – recharge la page (Ctrl+F5) ou vide le cache du frontend dans l'app.", offer: "Promo", offer_until: "jusqu'au", offer_expired: "expirée depuis",
    qty_less: "Diminuer la quantité", qty_more: "Augmenter la quantité", qty_changed: "quantité modifiée",
    search: "Rechercher", search_placeholder: "Rechercher dans la liste …", hits: "résultats", no_hits: "Aucun résultat pour", add_this: "ajouter",
    imp: "Importer", imp_ha: "Depuis Home Assistant", imp_text: "En texte", imp_source: "Liste",
    imp_done: "Inclure les terminés", imp_skip_dupes: "Ignorer ceux déjà présents", imp_go: "Importer",
    imp_text_help: "Un article par ligne. Puces, [ ] / [x] et numéros sont reconnus, ainsi que quantités et tags.",
    imp_preview: "Aperçu", imp_none: "Rien à importer.", imp_count: "articles", imported: "importés", imp_dupe: "existe",
    imp_no_lists: "Aucune autre liste trouvée dans Home Assistant.",
    shop_on: "Démarrer le mode courses", shop_off: "Terminer le mode courses", in_cart: "dans le chariot", undo: "Annuler", checked_off: "coché", unchecked: "rouvert",
    deleted: "supprimé", removed: "terminés supprimés", added: "ajouté", changed: "modifié",
    m_rename: "Renommer / modifier", m_move: "Déplacer vers …", m_copy: "Copier vers …", m_category: "Changer de catégorie", m_delete: "Supprimer",
    moved: "déplacé vers", copied: "copié vers", no_targets: "Aucune autre liste dans laquelle tu peux écrire.",
    ui: "Commandes", ui_help: "Chaque utilisateur règle ceci pour lui-même. Éventuellement différent par appareil.",
    scope_household: "Par défaut pour tous", scope_user: "Pour moi sur tous les appareils", scope_device: "Seulement sur cet appareil",
    scope_help_household: "S'applique à tous ceux qui n'ont rien réglé eux-mêmes.",
    scope_help_user: "Seuls tes écarts par rapport au défaut sont enregistrés (marqués •). « Réinitialiser » = retour au défaut.",
    scope_help_device: "S'applique seulement à ce navigateur ou cet appareil. « Réinitialiser » = retour à ton réglage.",
    press_gesture: "Geste pour le menu d'article", g_long: "Appui long", g_double: "Double-clic", g_right: "Clic droit", g_off: "Désactivé",
    press_target: "Où le geste agit", t_row: "Toute la ligne", t_name: "Seulement sur le nom",
    press_result: "Ce que fait le geste", r_menu: "Ouvrir le menu", r_edit: "Modifier directement", r_delete: "Supprimer (avec confirmation)",
    menu_actions: "Entrées du menu", row_buttons: "Afficher crayon et corbeille dans la ligne",
    shop: "Mode courses", shop_hide_checked: "Masquer les articles cochés", shop_keep_awake: "Garder l'écran allumé",
    shop_large: "Grandes lignes", shop_tap_row: "Toucher toute la ligne pour cocher", reset: "Réinitialiser",
    sort: "Tri", sort_category: "Catégorie", sort_alpha: "A–Z", sort_added: "Ajout", sort_list: "Par liste",
    packs: "Détection des catégories (packs de mots-clés)", packs_help: "Mots-clés → catégorie. Plusieurs packs peuvent être actifs (p. ex. français + le tien). Pour un même mot-clé, le pack le plus haut l'emporte. Les catégories mémorisées sont toujours prioritaires.",
    pack_terms: "mots-clés", pack_products: "produits", pack_builtin: "intégré", pack_custom: "personnel", pack_priority: "rang",
    pack_up: "Monter (priorité)", pack_download: "Télécharger", pack_delete: "Supprimer ce pack personnel ?", pack_bad_json: "Le fichier n'est pas un JSON valide.",
    pack_upload: "Importer un pack …", pack_name_help: "Nom du pack. Le même nom remplace un pack personnel existant.", pack_add: "Ajouter",
    pack_skipped: "ignorés (catégorie inconnue)", pack_template: "Modèle",
    card_desc: "Liste de courses avec catégories, suggestions, quantités, badges de magasin (@Carrefour) et droits d'accès.",
    imp_placeholder: "- Lait 2 l @Carrefour\n- [ ] Pain\n- [x] Beurre\n3 pommes",
    e_preset_pick: "— Choisir un modèle (règle plusieurs options) —", e_view_list: "Liste", e_view_tiles: "Tuiles (p. ex. tablette de cuisine)", e_view_mini: "Mini-tuile (résumé, dépliable)",
    e_sort_category: "Par catégorie", e_sort_added: "Ordre d'ajout", e_sort_list: "Par liste source (combinée)",
    e_layout_tabs: "Onglets", e_layout_columns: "Côte à côte", e_layout_stack: "Empilées",
    e_density_compact: "Compact", e_density_normal: "Normal", e_density_comfortable: "Grand (tactile)",
    e_sec_multi: "Plusieurs listes dans une carte", e_sec_filter: "Filtres", e_sec_look: "Apparence", e_sec_header: "En-tête", e_sec_input: "Saisie",
    e_sec_list: "Liste", e_sec_done: "Terminés", e_sec_shop: "Mode courses",
    e_pre_family: "Courses en famille (tout activé)", e_pre_kitchen: "Tablette de cuisine (grandes tuiles)", e_pre_store: "Au magasin (mode courses, sans saisie)",
    e_pre_readonly: "Lecture seule", e_pre_tile: "Tuile compacte pour tableau de bord",
    l_preset: "Modèle", l_entity: "Liste", l_entities: "Listes (au lieu de « Liste » ci-dessus)", l_layout: "Disposition", l_title: "Titre (vide = nom de la liste)",
    l_view: "Vue", l_sort: "Tri par défaut", l_advanced: "Afficher les options avancées",
    l_filter_store: "Seulement le magasin (p. ex. Carrefour ; plusieurs séparés par des virgules)", l_filter_person: "Seulement la personne (p. ex. Anna)", l_filter_tag: "Seulement le mot-clé (p. ex. bio)",
    l_filter_category: "Seulement les catégories", l_filter_offers: "Seulement les promos", l_filter_tags_new_items: "Les nouveaux articles reçoivent le tag du filtre (@Carrefour …)",
    l_show_filter_chips: "Barre de filtres (magasins, personnes, promos)",
    l_density: "Hauteur des lignes", l_font_scale: "Taille du texte", l_radius: "Rayon des coins", l_accent_color: "Couleur d'accent (vide = thème)",
    l_show_header: "Afficher l'en-tête", l_show_count: "Nombre à faire / résultats", l_show_search: "Recherche (loupe)",
    l_show_sort: "Choix du tri", l_show_shopping: "Bouton mode courses", l_show_undo: "Annuler (↶)",
    l_show_import: "Bouton d'import", l_show_settings: "Engrenage (paramètres personnels)",
    l_show_add: "Champ de saisie pour ajouter", l_show_frequent: "« Achetés souvent »",
    l_drag_drop: "Glisser-déposer (souris) : déplacer vers une autre liste, réordonner", l_show_stepper: "Sélecteur de quantité (− +)", l_show_offer: "Promos de l'app (magasin, prix, valable jusqu'au)",
    l_show_tags: "Badges (@magasin, *personne, #mot-clé)", l_show_source: "Origine (liste source / personne)", l_show_note: "Notes",
    l_show_category_titles: "Titres de catégorie", l_max_height: "Hauteur maximale de la liste (vide = illimitée)",
    l_show_completed: "Afficher les terminés", l_collapse_completed: "Terminés repliés au départ", l_start_shopping: "Démarrer en mode courses",
    hh_preset: "Règle les options adaptées d'un coup – ensuite tout reste modifiable individuellement.",
    hh_entities: "Plusieurs listes : en onglets, côte à côte ou empilées. Toutes les options s'appliquent à chaque liste.",
    hh_filter_tags_new_items: "Sinon, les nouveaux articles disparaîtraient aussitôt d'une carte filtrée.",
    hh_show_settings: "Geste, menu et mode courses sont réglés par chaque utilisateur dans l'engrenage.",
    hh_show_category_titles: "Désactivé : trié par catégorie, mais en une seule liste avec l'icône de catégorie devant.",
    hh_start_shopping: "Pratique pour une tablette dans l'entrée ou un tableau de bord dédié aux courses.",
    shop_auto_store: "Choisir le magasin selon la zone", shop_auto_store_help: "Quand tu es dans la zone d'un magasin (p. ex. Carrefour), le mode courses n'affiche que ses articles.",
    shop_untagged: "Afficher aussi les articles sans magasin", shop_untagged_help: "En mode courses pour un magasin, aussi tout ce qui n'a pas de @magasin.",
    shop_store: "Magasin", shop_all_stores: "Tous",
    pack_edit: "Modifier les mots-clés", pack_new: "Nouveau pack", pack_new_help: "Pack vide, p. ex. pour une autre langue ou tes propres termes. Il est activé tout en haut.", pack_new_placeholder: "p. ex. Nederlands",
    pack_empty: "Pas encore de mots-clés – ajoute-en ci-dessus.", pack_changed: "modifié", pack_revert: "Annuler la modification", pack_ignore: "Ignorer (comme Autres)",
    pack_more: "Charger plus", pack_term_placeholder: "Mot-clé (plusieurs séparés par des virgules)",
    pack_builtin_edit_help: "Pack intégré : les modifications vont dans le pack complémentaire « + » et sont conservées lors des mises à jour.", pack_edit_help: "Pack personnel : les modifications s'appliquent immédiatement.",
    zone: "Zone", zone_new: "Nouvelle zone", zone_new_help: "Nom de la zone. Position : emplacement actuel de cet appareil (sinon domicile), rayon 100 m – à ajuster dans Paramètres → Pièces et zones.",
    zone_wait: "Zone créée – elle apparaît dans un instant, associe-la ensuite ici.", zone_here: "emplacement de cet appareil", zone_home: "position du domicile – à ajuster",
    zone_none: "aucune zone", zone_manage: "Gérer les zones ↗", store_add: "Magasin avec zone", store_add_help: "Nom du magasin, comme dans @Carrefour. Une zone est ensuite créée pour lui.",
    stores: "Magasins & zones", stores_help: "Associe les magasins à des zones de Home Assistant. En mode courses, tu ne vois alors automatiquement que les articles du magasin où tu te trouves.",
    notes: "Notes de l'app", notes_help: "L'app HA SmartLists enregistre les notes dans sa propre liste de tâches. Ce ne sont pas des listes de courses, elles sont donc masquées par défaut.",
    notes_show: "Afficher dans SmartLists", notes_show_help: "Comme section 📝 séparée sur la page – pas dans Assist, les actions ni les listes combinées.",
    notes_scope: "Qui voit les notes", notes_scope_owner: "seulement son propre compte", notes_scope_household: "tous les utilisateurs",
    notes_lists: "Listes de notes et propriétaires", notes_none: "Aucune liste de notes de l'app trouvée.", notes_no_owner: "inconnu (admins seulement)",
    p_order: "Changer l'ordre", p_order_hint: "◀ ▶ déplace une liste. À la souris : glisse une puce sur une autre. L'ordre vaut aussi pour les colonnes.",
    p_left: "Vers la gauche", p_right: "Vers la droite",
    look: "Badges & couleurs", look_help: "Apparence des badges pour tous les utilisateurs. Les couleurs et noms des magasins s'appliquent aussi dans l'app. Vide ou ↺ = par défaut.",
    look_style: "Style", look_filled: "plein", look_soft: "discret", look_outline: "contour", look_text: "texte seul",
    look_color: "Couleur de fond", look_text: "Couleur du texte", look_icon: "Symbole devant", look_label: "Nom affiché", look_kinds: "Par type", look_values: "Badges individuels",
    look_search: "Chercher un badge … (p. ex. carrefour)", look_more: "Trouve les autres via la recherche.", look_add: "Colorer un badge",
    look_add_help: "Avec son caractère, p. ex. @Kaufland, *Max ou #vegan – même s'il n'est pas encore utilisé.",
    zone_count: "zones", zone_unlink: "Dissocier la zone", zone_add: "Zone",
    app_list: "liste combinée de l'app", app_list_connected: "associée", app_list_connect: "Associer",
    zone_name: "Nom de la zone, p. ex. Carrefour Centre", zone_radius: "Rayon", zone_coords: "Coordonnées ou lien de carte", zone_coords_placeholder: "48.8566, 2.3522 ou un lien Google/Apple/OSM", zone_coords_bad: "Aucune coordonnée reconnue.", zone_locating: "Localisation en cours …", zone_no_location: "Position indisponible – choisis une autre option.", zone_where: "Où ?", zone_here_opt: "Position actuelle (cet appareil)", zone_home_opt: "Domicile", zone_map_opt: "Choisir sur la carte", zone_after: "À ajuster à tout moment dans Paramètres → Pièces et zones.",
    note_new: "Nouvelle note", note_edit: "Modifier la note", note_view: "Liste / grille", note_empty: "Pas encore de notes.", note_locked: "Note chiffrée", note_locked_help: "Chiffrée avec le mot de passe des notes de l'app – lisible uniquement dans l'app.", note_title: "Titre", note_body: "Texte",
    p_settings_hint: "",
    list_settings_hint: "Commandes et réglages globaux : ⚙ en haut à droite de la page.",
    settings_list: "Paramètres de cette liste", settings_global: "Paramètres généraux", list_settings_hint_card: "Commandes et réglages globaux : l'icône de réglage dans l'en-tête.",
    tpl: "Modèles",
    scan: "Scanner le code-barres",
    price_sum: "Total",
    soft_checked: "marqué de l'extérieur (lien)",
    soft_checked_help: "Quelqu'un l'a marqué comme fait via un lien partagé – l'article reste ouvert jusqu'à ce que tu le coches.",
    price: "Prix",
    aisle: "Ordre",
    price_paid: "dernier prix payé",
    price_manual: "prix perso",
    price_last: "la dernière fois",
    tpl_servings: "Portions",
    tpl_new: "Nouveau modèle",
    tpl_from_list: "Liste comme modèle",
    tpl_increase: "déjà sur la liste → la quantité est augmentée",
    tpl_servings_help: "Les quantités sont recalculées",
    tpl_increased: "quantité augmentée",
    tpl_name: "Nom, ex. Crêpes",
    tpl_items_placeholder: "Farine 250 g\nLait 0,5 l\nŒufs 3",
    tpl_items: "Articles",
    tpl_items_help: "Un article par ligne, avec quantité et tags comme dans la liste. Portions (facultatif) = pour combien de personnes valent les quantités.",
    tpl_edit: "Modifier le modèle",
    scan_help: "Place le code-barres sur la ligne rouge – ou tape le numéro en dessous.",
    scan_code: "Numéro du code-barres",
    scan_unknown: "Produit introuvable – tape le nom toi-même.",
    scan_find: "Rechercher",
    scan_no_camera: "Le scan par caméra n'est pas pris en charge ici (ex. Safari sur iPhone, Firefox) – tape le numéro.",
    aisle_down: "Descendre",
    aisle_help: "C'est l'ordre du mode courses quand ce magasin est sélectionné. Fais glisser la poignée ⠿ ou utilise les flèches.",
    aisle_all_branches: "toutes les succursales",
    aisle_reset: "Par défaut",
    notify_to: "Envoyer à",
    notify_no_phone: "Aucun appareil avec l'application Companion trouvé.",
    notify_added: "Nouveaux articles",
    notify_checked: "Quand quelque chose est coché",
    notify_lists: "Listes",
    notify_all_lists: "toutes celles que je vois",
    notify_from: "De qui",
    notify_quiet: "Heures calmes",
    notify_quiet_none: "aucune",
    notify: "Notifications",
    notify_help: "Quand quelqu'un d'autre modifie quelque chose (tes propres modifications seulement si activé ci-dessous). Plusieurs modifications en une minute arrivent en un seul message.",
    stats_90: "90 jours",
    stats_year: "Année",
    stats_all: "tout",
    stats_top: "Achetés le plus souvent",
    stats_every: "tous les",
    stats_none: "Pas encore assez d'historique.",
    stats_overdue: "Pas acheté depuis longtemps",
    stats_add: "Ajouter à la liste",
    stats_usually: "d'habitude tous les",
    stats_since: "depuis",
    stats_shares: "Par catégorie · magasin",
    stats: "Statistiques",
    stats_help: "À partir de l'historique existant – aucune donnée supplémentaire n'est collectée.",
    exp_week: "Semaine",
    exp_month: "Mois",
    exp_year: "Année",
    exp_none: "Pas encore de dépenses – elles sont comptabilisées quand des articles avec un prix sont cochés.",
    exp_no_store: "sans magasin",
    exp: "Dépenses",
    exp_help: "Comptabilisées en cochant (prix × quantité). Les prix viennent des offres, de toi (ex. « Lait 2 l 1,19€ » ou ✏️) ou du dernier achat.",
    share_view: "lecture seule",
    share_soft: "cocher « soft » (reste ouvert)",
    share_check: "vraiment cocher",
    share_mode: "Autorisé",
    share_mode_help: "« soft » : tu vois ce qui a été marqué – l'article reste ouvert dans ta liste. Ce qui est ajouté via le lien est marqué 🔗 dans ta liste.",
    share_add: "Peut ajouter",
    share_valid: "Validité",
    share_2h: "2 heures",
    share_1d: "1 jour",
    share_7d: "7 jours",
    share_30d: "30 jours",
    share_forever: "jusqu'à révocation",
    share_create: "Créer un lien",
    soft_checked_by: "marqué par {name} (lien)", link_added_by: "ajouté par {name} via le lien",
    x_stats: "Statistiques et dépenses", x_stats_help: "Achetés le plus souvent, pas achetés depuis longtemps, parts par catégorie et magasin, dépenses par mois (📊 sur la page, capteur « Dépenses ce mois-ci »). Désactivé : masqué, le comptage continue en arrière-plan.", w_x_stats_sub: "Ce que vous achetez souvent et combien vous dépensez",
    share_soft_add: "cocher « soft » et ajouter", link_added: "ajouté via le lien", link_added_help: "Quelqu'un sans compte l'a ajouté via un lien partagé.",
    link_shared: "partagée sur le web", link_shared_help: "Accessible par {n} lien(s) pour des personnes sans compte. Touche pour voir ou révoquer les liens.",
    pub_cf_arch: "{path} est prévu pour un autre processeur ({found}). Ce système a besoin de {file} – supprime ou remplace l'ancien fichier.", pub_cf_kind_windows: "{path} est la version Windows. Home Assistant a besoin de {file}.", pub_cf_kind_mac: "{path} est la version macOS. Home Assistant a besoin de {file}.", pub_cf_kind_archive: "{path} est une archive (.tgz/.zip/.deb), pas le programme. Télécharge le fichier {file} sans extension.", pub_cf_kind_html: "{path} est une page web enregistrée, pas le programme. Télécharge directement le fichier {file} depuis la page des versions.", pub_cf_kind_not_executable: "{path} ne peut pas être exécuté (droits). Replace le fichier ou vérifie ses droits.", pub_cf_kind_unknown: "{path} ne convient pas à ce système. Il faut {file}.",
    shared_change_hint: "Pour modifier : engrenage de cette liste → Partage.",
    l_plain: "Liste simple", l_plain_help: "Sans catégories, suggestions, mots mémorisés ni prix. SmartLists ne retient rien de cette liste – ses articles n'apparaissent dans aucune autre (p. ex. bricolage).",
    l_categories: "Catégories automatiques", l_categories_help: "Désactivé : pas de classement par catégorie – ni dans la liste ni en tapant. Trier p. ex. par ajout.", l_suggest: "Achetés souvent & suggestions", l_suggest_list: "seulement de cette liste", l_suggest_sources: "de ses listes sources", l_suggest_all: "de toutes les listes", l_suggest_help: "Ce qui a été acheté dans une autre liste n'apparaît pas ici. Les anciennes entrées (avant 3.9.4) valent toujours partout.",
    zone_dup_title: "La zone existe déjà", zone_dup_text: "Il existe déjà une zone « {name} ». Tu peux garder le nom (il y aura alors deux zones du même nom, p. ex. deux magasins) ou renommer la nouvelle zone, p. ex. « {name} Centre ».", zone_dup_keep: "Garder le nom", zone_dup_rename: "Renommer", zone_dup_rename_help: "Nom de la nouvelle zone, p. ex. avec le quartier ou la rue du magasin.", app_title: "Enregistrer comme app sur l'écran d'accueil", app_lead: "Une icône sur ton téléphone qui ouvre directement cette liste – sans app supplémentaire. En plein écran comme une app.", app_list: "Liste", app_shop: "Ouvrir directement en mode courses", app_install: "Installer", app_close: "Fermer", app_ios: "Dans Safari, touche Partager (□↑) en bas\nChoisis Sur l'écran d'accueil\nTouche Ajouter – c'est fait", app_android: "Dans Chrome, touche ⋮ en haut à droite\nChoisis Ajouter à l'écran d'accueil ou Installer l'application\nConfirme Installer – c'est fait", app_other: "Dans le menu du navigateur, choisis Installer l'application ou Ajouter à l'écran d'accueil\nSur le téléphone : ouvre cette page dans Chrome (Android) ou Safari (iPhone)",
    x_title: "Extras", x_help: "Fonctions optionnelles. Pas nécessaires pour commencer – à activer ici au besoin.", x_notes: "Notes", x_notes_help: "Listes de notes (p. ex. de l'app HA SmartLists) dans une section 📝 à part. Qui les voit se règle sous Appareils et notes.", x_mealplan: "Menu de la semaine", x_mealplan_help: "Plats par jour, ingrédients sur la liste, calendrier « Menu ». Désactivé : l'onglet, l'entrée du menu et le calendrier disparaissent, les plats restent enregistrés.", w_x_optional: "Optionnel – aussi plus tard sous Paramètres → Extras", w_x_notes_sub: "Listes de notes dans une section à part, p. ex. de l'app", w_x_mealplan_sub: "Planifier les plats par jour et mettre les ingrédients sur la liste", share_leak: "Le lien contient l'adresse de ton Home Assistant. Pour la garder privée : Quick Tunnel ou ton propre proxy (Paramètres → Partage et droits → Adresse publique).", share_old_address: "l'adresse a changé, le lien ne marche plus", pub_title: "Adresse publique des liens", pub_help: "Par où les liens partagés sont accessibles. Avec un tunnel ou ton propre proxy, personne n'apprend l'adresse de ton Home Assistant.", pub_mode: "Liens via", pub_ha: "Adresse de Home Assistant", pub_tunnel: "Cloudflare Quick Tunnel", pub_proxy: "Propre proxy ou tunnel", pub_ha_help: "Comme avant : le lien pointe vers l'adresse externe de Home Assistant – qui le reçoit connaît cette adresse.", pub_tunnel_help: "SmartLists lance cloudflared et obtient une adresse aléatoire (…trycloudflare.com). Le tunnel mène uniquement à un petit serveur séparé qui ne sert que les listes partagées – pas à Home Assistant. Ni compte ni redirection de port nécessaires.", pub_proxy_help: "Redirige ton adresse vers http://<IP de Home Assistant>:{port} (Caddy, nginx, Cloudflare Tunnel avec ton domaine …). Seul le serveur de partage de SmartLists y tourne, pas Home Assistant.", pub_url: "Adresse publique", pub_port: "Port", pub_port_change: "modifier (facultatif)", pub_port_help: "Port du serveur de partage (par défaut 8126).", pub_starting: "Le tunnel démarre …", pub_server_ok: "Le serveur de partage tourne sur le port {port}.", pub_not_ready: "pas encore prêt", pub_tunnel_note: "L'adresse du tunnel change à chaque redémarrage de Home Assistant – les liens créés avant ne marchent plus. Pour des liens durables : ton propre proxy ou tunnel.", pub_cf_missing: "cloudflared est introuvable. SmartLists ne le télécharge pas lui-même.", pub_cf_not_exec: "{path} trouvé, mais non exécutable ou prévu pour un autre système.", pub_cf_download: "Télécharger cloudflared – pour ce système : {file}", pub_cf_where: "Place le fichier {file} dans l'un de ces dossiers (inutile de le renommer ; un sous-dossier « cloudflared » marche aussi) : {paths}. Puis Enregistrer.", pub_cf_or_proxy: "Ou utilise ton propre proxy.", pub_err_cloudflared_missing: "cloudflared manque.", pub_err_cloudflared_not_executable: "cloudflared n'est pas exécutable.", pub_err_port_in_use: "Le port {port} est occupé – choisis-en un autre.", pub_err_cloudflared_exit: "cloudflared s'est arrêté (code {code}) – redémarrage imminent.", pub_err_cloudflared_failed: "Impossible de lancer cloudflared : {code}",
    share_active: "Liens actifs",
    share_revoke: "Révoquer",
    share_expired: "expiré",
    share_until: "jusqu'au",
    share_opened: "ouvert",
    share_once: "Le lien n'est affiché que maintenant – il n'est pas enregistré. Plus tard : révoque-le et crées-en un nouveau.",
    share_local: "C'est une adresse de ton réseau local – depuis l'extérieur, le lien ne fonctionne qu'avec une URL externe (Paramètres → Système → Réseau).",
    share_copied: "copié",
    share_copy: "Copier le lien",
    share_send: "Partager …",
    share: "Partager par lien",
    share_help: "Pour les personnes sans compte Home Assistant. Elles ne voient que cette liste (sans notes) – rien d'autre de Home Assistant. Par défaut : lecture seule.",
    barcode_lookup: "Rechercher les codes-barres en ligne",
    barcode_lookup_help: "Open Food Facts, seul le numéro est envoyé. Désactivé : uniquement les codes déjà connus.",
    tab_stats: "Statistiques",
    l_show_templates: "Bouton modèles (📋)",
    l_show_scan: "Bouton code-barres",
    l_show_prices: "Prix et total",
    p_group_combined: "Listes combinées", p_group_lists: "Listes", p_group_notes: "Notes", app_list_pending: "Liste combinée de l'app – pas encore associée dans Home Assistant", app_list_admin: "Un admin Home Assistant peut l'associer (touche ici ou sous Appareils connectés).", share_combined: "Attention : une liste combinée partage les articles de toutes ses listes sources.",
    aisle_sort: "Trier", aisle_drag: "Glisser pour déplacer", emoji_pick: "Choisir un symbole", emoji_free: "personnalisé", emoji_food: "Nourriture", emoji_occasion: "Occasions & maison", emoji_people: "Personnes", emoji_symbols: "Symboles", emoji_none: "aucun",
    trip_done: "Courses terminées", trip_help: "Le total « dans le chariot » repart de 0. Les dépenses restent enregistrées. Pour les listes réutilisées, tu peux rouvrir tout ce qui est coché.", trip_reopen: "Tout rouvrir", trip_finish: "Terminer", stats_forget: "Supprimer de l'historique", stats_forget_help: "sera retiré des statistiques, suggestions et du rythme d'achat (p. ex. ajouté par erreur).", exp_entries: "Opérations", notes_create: "Créer une liste de notes", notes_create_help: "Nom de la liste de notes. Elle t'appartient ; créée en tant que todo.ha_smartlists_notes_<nom>.",
    p_lists_all: "Toutes les listes", p_lists_less: "Moins",
    scan_native_help: "Vise le code-barres sur l'emballage.", scan_type: "Saisir le numéro", scan_not_product: "Ce n'est pas un code-barres de produit (EAN).",
    scan_target: "Liste cible", scan_target_this: "cette liste (de la carte)", scan_mode: "Articles scannés", scan_mode_input: "dans le champ de saisie (vérifier, puis ajouter)", scan_mode_add: "ajouter directement", barcode_providers: "Services de recherche", barcode_providers_help: "Touche pour activer/désactiver, le numéro est l'ordre – le premier résultat compte. SmartLists mémorise les codes trouvés.", barcode_custom: "service personnalisé", barcode_custom_url: "URL avec {code}", barcode_custom_field: "Champ du nom",
    a_applies: "S'applique à", a_menu: "Menu d'article", a_shop: "Courses et scan", a_me_sub: "S'applique seulement à toi.", a_look: "Badges et couleurs", a_global_sub: "S'applique à tous les utilisateurs, aussi dans l'app.", a_cats: "Catégories", a_devices: "Appareils et notes", a_rights: "Partage et droits", a_rights_sub: "Ce que les utilisateurs sans droits d'admin peuvent faire.", a_data: "Voix, sauvegarde, réglages par défaut", a_stats: "Statistiques et dépenses", a_search: "Chercher un réglage", admin_only_short: "admins seulement", g_stats: "Analyse", ls_done: "Terminé", rights_who: "Peuvent créer des liens", rights_share_who: "Peuvent créer des liens", rights_who_admins: "admins seulement", rights_who_owners: "admins et propriétaire de la liste", rights_who_editors: "tous ceux qui peuvent modifier la liste", rights_who_nobody: "personne (partage désactivé)", rights_max: "Un lien permet au plus", rights_share_max: "Un lien permet au plus", rights_max_on: "cocher et ajouter", rights_limits_help: "Les limites s'appliquent aux utilisateurs sans droits d'admin.", rights_max_hours: "Validité maximale", rights_share_max_hours: "Validité maximale", rights_all_links: "Afficher les liens actifs de toutes les listes", rights_no_links: "Aucun lien actif.", rights_share_help: "Les liens donnent accès à une seule liste aux personnes sans compte.", rights_other: "Autorisé sans droits d'admin", rights_create_lists: "Créer ses propres listes", rights_templates: "Créer et modifier des modèles", rights_categories: "Attribuer des catégories à la main", rights_prices: "Saisir des prix", ls_list: "Liste", ls_list_help: "S'applique à cette liste sur tous les appareils, sauf si une carte ou un appareil en décide autrement.", ls_name: "Nom", ls_sort: "Triée par", ls_default: "réglage de la carte",
    w_title: "Configurer SmartLists", w_time: "Cela prend environ deux minutes.", w_step: "Étape {n} sur {m}", w_s_lists: "Listes", w_s_stores: "Magasins", w_s_naming: "Notation", w_s_lang: "Langue", w_s_people: "Personnes et application", w_s_extras: "Extras", w_s_done: "Terminé", w_lists_h: "Par quoi veux-tu commencer ?", w_lists_found: "SmartLists a trouvé {n} listes de tâches dans Home Assistant.", w_lists_none: "Il n’y a encore aucune liste de tâches dans Home Assistant.", w_use: "Utiliser les listes existantes", w_use_sub: "Elles restent telles quelles. SmartLists les affiche avec catégories, quantités et magasins.", w_combine: "Les regrouper en une liste combinée", w_combine_sub: "Chacun garde sa liste, la liste combinée les affiche toutes.", w_combine_name: "Nom de la liste combinée", w_combine_default: "Courses", w_new: "Créer une nouvelle liste", w_new_sub: "Uniquement dans SmartLists ; tu en es propriétaire et peux la partager.", w_new_name: "Nom de la liste", w_open: "ouverts", w_stores_h: "Où fais-tu tes courses ?", w_stores_lead: "Les magasins sont proposés pendant la saisie, et le mode courses n’affiche que ce dont tu as besoin dans ce magasin.", w_store_other: "Autre magasin", w_store_add: "Ajouter", w_chosen: "Sélectionnés : {list}", w_chosen_none: "Aucun magasin sélectionné pour l’instant", w_becomes: "devient", w_stores_later: "Tu pourras ajouter l’emplacement des magasins plus tard. SmartLists choisira alors le magasin tout seul quand tu y es.", w_naming_h: "Comment marques-tu magasin, personne et étiquette ?", w_naming_lead: "Un caractère placé juste avant un mot le transforme en badge. Il reste dans le texte de l’article, donc Home Assistant et l’application le voient aussi.", w_eg_store: "par exemple @REWE", w_eg_person: "par exemple *Anna", w_eg_tag: "par exemple #bio", w_naming_bad: "« {c} » n’est pas autorisé.", w_naming_dup: "Utilise chaque caractère une seule fois.", w_naming_hint: "Caractères autorisés : {chars}. Laisse vide pour désactiver un type. L’application HA SmartLists reprend ces caractères lors de l’association.", w_eg_item: "Lait", w_eg_qty: "2 l", w_lang_h: "Dans quelle langue écris-tu les articles ?", w_lang_lead: "C’est ainsi que SmartLists reconnaît la catégorie, par exemple le lait dans le rayon frais. Plusieurs langues peuvent être combinées.", w_words: "mots", w_people_h: "Qui participe ?", w_people_lead: "Droits pour la nouvelle liste. Tout le monde voit SmartLists dans sa barre latérale.", w_people_combined: "Les listes combinées sont visibles par toutes les personnes qui voient les listes sources. Les droits par personne existent pour les listes SmartLists propres.", w_you: "toi, admin", w_all: "peut tout faire", w_app: "Application HA SmartLists sur un appareil", w_app_sub: "Dans l’application, touche « Associer » sous Paramètres → Connexion. Les appareils connectés apparaissent ensuite sous Global → Appareils et notes.", w_extras_h: "Que doit encore faire SmartLists ?", w_extras_lead: "Tout peut être activé ou désactivé plus tard.", w_x_notify: "Me prévenir quand quelqu’un ajoute quelque chose", w_x_notify_sub: "Sur ton appareil avec l’application Home Assistant", w_x_notify_none: "Aucun appareil avec l’application Home Assistant trouvé", w_x_voice: "Ajouter des articles à la voix", w_x_voice_sub: "« Ajoute du lait à la liste de courses » avec Assist", w_x_prices: "Prix et dépenses", w_x_prices_sub: "Total de la liste et aperçu mensuel", w_x_barcode: "Rechercher les codes-barres en ligne", w_x_barcode_sub: "Sur Open Food Facts, seul le numéro est envoyé", w_x_share: "Les propriétaires peuvent partager des listes par lien", w_x_share_sub: "Pour les personnes sans compte Home Assistant, par exemple des voisins ou des invités", w_done_h: "Tout est prêt", w_done_lead: "Voici ce qui sera configuré. Tu peux tout modifier à tout moment dans les paramètres.", w_sum_combined: "Liste combinée « {name} » à partir de {lists}", w_sum_new: "Nouvelle liste « {name} »", w_sum_lists: "Listes : {lists}", w_sum_stores: "Magasins : {list}", w_sum_naming: "Notation : {list}", w_sum_lang: "Catégories : {list}", w_sum_people: "Partage : {list}", w_sum_extras: "Activé : {list}", w_off: "désactivé", w_tip: "Astuce : commence simplement à taper dans le champ de saisie, par exemple « 2 kg pommes @REWE ».", w_back: "Retour", w_next: "Suivant", w_skip: "Passer", w_finish: "Configurer", w_start: "C’est parti", w_later: "Modifiable plus tard dans les paramètres", w_close: "Fermer la configuration", w_restart: "Relancer la configuration", w_restart_sub: "L’assistant du premier démarrage, par ex. pour combiner d’autres listes.",
    more: "Plus", ih_title: "Historique", ih_none: "Pas encore d'entrées.", ih_add: "ajouté", ih_check: "coché", ih_uncheck: "rouvert", ih_rename: "renommé", ih_remove: "supprimé", ih_link: "via un lien partagé", ih_auto: "automatisation", mp_title: "Menu de la semaine", mp_add: "Plat", mp_help: "Les plats sont des modèles. « Ingrédients sur la liste » met tout ce qui est prévu cette semaine sur la liste ; les articles identiques sont additionnés. Le menu apparaît aussi comme calendrier dans Home Assistant.", mp_no_tpl: "Crée d'abord un modèle (⋯ → Modèles).", mp_prev: "Semaine précédente", mp_next: "Semaine suivante", mp_mealie: "Récupérer depuis Mealie", mp_recipes: "recettes importées", mp_to_list: "Ingrédients sur la liste", db_title: "Tableau de bord courses", db_help: "Crée une vue dans la barre latérale : toutes les listes, le menu et les statistiques. Modifiable ensuite comme tout tableau de bord.", db_create: "Créer le tableau de bord", db_open: "Ouvrir le tableau de bord", db_lists: "Listes", db_plan: "Menu", db_stats: "Statistiques",
    rs_title: "Repartir de zéro", rs_help: "Choisis ce qui est réinitialisé. L'assistant démarre ensuite. Les listes de tâches et leurs articles ne sont jamais supprimés ; les réglages personnels restent.", rs_settings: "Réinitialiser les réglages", rs_settings_sub: "Convention de nommage, badges et couleurs, magasins et zones, ordre des rayons, droits, voix et automatisations, affichage des listes, packs de mots-clés.", rs_data: "Supprimer les données apprises", rs_data_sub: "Catégories mémorisées, historique et statistiques, prix et dépenses, modèles et menu.", rs_links: "Révoquer tous les liens de partage", rs_links_sub: "Les liens partagés ne fonctionnent plus.", rs_combined: "Supprimer les listes combinées", rs_combined_sub: "Seulement la vue combinée – les listes sources restent inchangées.", rs_go: "Réinitialiser et lancer l'assistant",
    mp_saved: "Menu enregistré", mp_ask_add: "Mettre maintenant les ingrédients de la semaine sur la liste ?", mp_not_now: "Non, enregistrer seulement",
    notify_own: "Aussi pour mes propres modifications", notify_own_sub: "p. ex. quand tu ajoutes quelque chose sur le PC et le veux sur ton appareil – ou pour essayer.", notify_test: "Envoyer un message de test", notify_test_sent: "Message de test envoyé – s'il n'arrive pas, vérifie l'app Companion et l'autorisation des notifications.",
    m_select: "Sélectionner", sel_mode: "Sélectionner plusieurs", sel_count: "{n} sélectionné(s)", sel_all: "Tous", sel_none: "Aucun", sel_check: "Cocher", sel_checked: "cochés", sel_reopened: "rouverts", sel_delete_q: "Supprimer {n} articles ?",
    mp_target: "Ingrédients sur :",
    p_tab_lists: "Listes",
    nt_add: "Ajouter une cible", nt_none: "Aucune cible – aucun message ne sera envoyé.", nt_service: "Service de notification", nt_entity: "Entité de notification", nt_custom: "Service personnalisé", nt_no_services: "Aucun service notify trouvé.", nt_no_entities: "Aucune entité notify trouvée.", nt_custom_help: "N'importe quel service (admins seulement), p. ex. telegram_bot.send_message ou script.mon_message. Données en JSON ; {title} et {message} sont remplacés – sans espaces réservés, title et message sont ajoutés.", nt_help: "Plusieurs cibles possibles : app Companion, Telegram, e-mail, Signal, haut-parleurs … – tout ce que Home Assistant connaît comme notification.", nt_bad_service: "Indique le service sous la forme domaine.service.",
    mg_title: "Reprendre des listes", mg_sub: "Reprendre des listes de tâches existantes (liste de courses, Local To-do …) dans des listes SmartLists propres – avec articles, notes et coches.", mg_help: "Les nouvelles listes t'appartiennent et peuvent être partagées ensuite. Choisis une ou plusieurs listes.", mg_lists: "Listes", mg_none: "Aucune liste adaptée trouvée.", mg_how: "Plusieurs listes", mg_each: "Une liste propre chacune", mg_each_sub: "Même nom qu'avant.", mg_one: "Toutes dans une liste", mg_one_sub: "Tous les articles ensemble dans une nouvelle liste.", mg_name: "Nom de la nouvelle liste", mg_tag: "Marquer l'origine comme", mg_tag_none: "ne pas marquer", mg_old: "Ancienne liste", mg_used: "Utilisée dans des listes combinées : {lists}. Ajoutes-y la nouvelle liste avant de supprimer l'ancienne.", mg_pick: "Choisis au moins une liste.", mg_go: "Reprendre", mg_items: "articles",
    mg_pf_local: "To-do local", mg_pf_shopping: "Liste de courses", mg_pf_other: "Autre",
    mg_keep_info: "L'ancienne liste reste inchangée. Vérifie la nouvelle liste puis supprime l'ancienne toi-même.", mg_done_hint: "Les anciennes listes existent toujours. Si tout est bon dans la nouvelle liste, supprime-les toi-même (Paramètres → Appareils et services, p. ex. Local To-do ou l'intégration concernée) :", mg_done_combined: "Au moins une ancienne liste est source d'une liste combinée – ajoutes-y d'abord la nouvelle liste.",
    mg_pf_notes: "Notes", mg_as: "Reprendre comme", mg_as_list: "Liste", mg_as_list_sub: "Liste SmartLists propre avec catégories, quantités et fonctions de courses.", mg_as_notes: "Notes", mg_as_notes_sub: "Nouvelle liste de notes (visible seulement par toi), notes avec titre et texte – les chiffrées restent intactes.",
    owner_everyone: "— tous (sans restriction)", owner_combined_help: "Avec un propriétaire, seuls lui, les admins et les personnes partagées voient la liste.",
    lb_title: "Badges d'origine", lb_help: "Indique sur chaque article de quelle liste il vient.", lb_show: "Le badge affiche", lb_list: "Nom de la liste", lb_owner: "Propriétaire de la liste source", lb_both: "Propriétaire et nom de la liste", lb_show_help: "Les listes sans propriétaire (Local To-do …) affichent toujours le nom.", lb_only: "Seulement de ces listes", lb_all: "toutes",
    lb_colors: "Couleur par liste source (par défaut : automatique, une différente par liste)",
  },
  es: {
    add_placeholder: "p. ej. 2 kg manzanas {store}", add_ph_store: "Tienda", note: "Nota", save: "Guardar", cancel: "Cancelar",
    done: "Hecho", clear: "Quitar completados", own: "Lista propia", combined: "Combinada", foreign: "Ajena",
    empty: "Nada que comprar 🎉", no_add: "Añadir está desactivado para esta lista.", open: "pendientes",
    confirm_delete: "¿Seguro que quieres borrar el artículo?", confirm_clear: "¿Quitar todos los artículos completados?",
    error: "Error", loading: "Cargando …", readonly: "Solo ver", delete: "Borrar", edit: "Editar",
    frequent: "Comprados a menudo", src_manual: "recordada", src_learned: "aprendida", src_pack: "automática", src_fallback: "desconocida",
    unit_hint: "unidad habitual", category: "Categoría", settings: "Ajustes", naming: "Convención de nombres",
    naming_help: "Un carácter delante de una palabra la convierte en una etiqueta. Vale para todas las listas y dispositivos.",
    kind_store: "Tienda", kind_person: "Persona", kind_tag: "Etiqueta", add_rule: "Añadir regla", example: "Ejemplo",
    learned: "Categorías recordadas", learned_help: "Se crean cuando eliges una categoría a mano.", forget: "Olvidar",
    none_learned: "Todavía no hay nada recordado.", saved: "Guardado", admin_only: "Solo los administradores pueden cambiar esto.",
    in_list: "ya está en la lista",
    tab_me: "Para mí", tab_house: "Global", tab_list: "Esta lista", ui_me_help: "Solo se aplica a ti. Las diferencias con el ajuste global se marcan con •.",
    ui_house: "Controles – predeterminado para todos", reset_default: "Restablecer predeterminado", about_list: "Sobre esta lista", type: "Tipo", entity: "Entidad", sources: "Fuentes",
    type_combined: "Lista combinada", type_own: "Lista propia de SmartLists", type_list: "Lista de tareas de Home Assistant", char: "Carácter", kind: "Tipo",
    no_hits_short: "Sin resultados.", by_hand: "a mano", search_learned: "Buscar … (p. ej. leche)",
    automation: "Voz y automatizaciones", automation_help: "Assist y artículos pendientes de recompra. Blueprints «Estoy en la tienda» y recordatorio de tienda: ver la wiki.",
    auto_voice_default_list: "Lista predeterminada para Assist", auto_voice_help: "Se usa cuando la frase no nombra ninguna lista.",
    auto_auto_due_list: "Añadir automáticamente los artículos pendientes a", auto_due_help: "Cada hora, según vuestro ritmo de compra. «—» = desactivado.",
    install_sentences: "Instalar frases de Assist", sentences_installed: "instaladas",
    devices: "Dispositivos conectados", devices_help: "Dispositivos con la app HA SmartLists. ⚠️ = sin sincronizar desde hace más de 7 días. Para quitar el acceso, borra el token en el perfil.",
    no_devices: "Ningún dispositivo conectado todavía.", remove_device: "Quitar de la lista", last_seen: "visto",
    role_all: "todos los permisos", admin_always: "Admin – siempre puede hacerlo todo", shop_large_help: "Más fácil de tocar con el pulgar. Desactivado: mismo tamaño que la vista normal.",
    new_list_help: "Eres el propietario y luego puedes compartirla con otros.", new_list_placeholder: "p. ej. Droguería", create: "Crear",
    p_columns: "Varias listas una al lado de otra", p_wide: "Vista ancha", p_settings: "Ajustes", p_back: "Volver a las listas",
    p_hint: "Toca listas para verlas una al lado de otra (con más de 3 pasan a otra fila). Arrastra artículos con el ratón a otra lista para moverlos (Ctrl = copiar).",
    p_empty: "No se encontraron listas. Crea una en Ajustes → Dispositivos y servicios → SmartLists – o con + arriba.",
    owner: "propietario", shared: "compartida", private: "privada", admin: "admin", sharing: "Compartir",
    sharing_help: "Quién puede ver y cambiar esta lista. Los admins siempre pueden hacerlo todo. La vista de tareas de HA muestra cada lista a todos – solo se oculta en SmartLists (tarjeta, página, app).",
    role_none: "sin acceso", role_viewer: "ver", role_checker: "marcar", role_editor: "editar", role_owner: "propietario",
    no_users: "No hay más usuarios en Home Assistant.", delete_list: "Borrar lista", confirm_delete_list: "¿Borrar esta lista con todos sus artículos?",
    new_list: "Nueva lista", new_list_prompt: "Nombre de la nueva lista:",
    due_every: "toca comprar – lo compráis aprox. cada", days: "días", backup: "Copia y traspaso",
    backup_help: "Categorías recordadas, historial, convención de nombres y controles en un archivo – p. ej. para una segunda instancia de HA. Importar añade sin borrar nada.",
    export: "Exportar", import: "Importar …",
    mini_open: "Abrir lista", mini_close: "Contraer", card_version: "tarjeta", stale_card: "Esta tarjeta está desactualizada – recarga la página (Ctrl+F5) o borra la caché del frontend en la app.", offer: "Oferta", offer_until: "hasta", offer_expired: "caducada desde",
    qty_less: "Reducir cantidad", qty_more: "Aumentar cantidad", qty_changed: "cantidad cambiada",
    search: "Buscar", search_placeholder: "Buscar en la lista …", hits: "resultados", no_hits: "Nada encontrado para", add_this: "añadir",
    imp: "Importar", imp_ha: "Desde Home Assistant", imp_text: "Como texto", imp_source: "Lista",
    imp_done: "Incluir completados", imp_skip_dupes: "Omitir los que ya están", imp_go: "Importar",
    imp_text_help: "Un artículo por línea. Se reconocen viñetas, [ ] / [x] y números, así como cantidades y etiquetas.",
    imp_preview: "Vista previa", imp_none: "Nada que importar.", imp_count: "artículos", imported: "importados", imp_dupe: "existe",
    imp_no_lists: "No se encontraron otras listas en Home Assistant.",
    shop_on: "Iniciar modo compra", shop_off: "Terminar modo compra", in_cart: "en el carro", undo: "Deshacer", checked_off: "marcado", unchecked: "reabierto",
    deleted: "borrado", removed: "completados quitados", added: "añadido", changed: "cambiado",
    m_rename: "Renombrar / editar", m_move: "Mover a …", m_copy: "Copiar a …", m_category: "Cambiar categoría", m_delete: "Borrar",
    moved: "movido a", copied: "copiado a", no_targets: "No hay otra lista en la que puedas escribir.",
    ui: "Controles", ui_help: "Cada usuario lo ajusta para sí mismo. Opcionalmente distinto por dispositivo.",
    scope_household: "Predeterminado para todos", scope_user: "Para mí en todos los dispositivos", scope_device: "Solo en este dispositivo",
    scope_help_household: "Se aplica a todos los que no han ajustado nada propio.",
    scope_help_user: "Solo se guardan tus diferencias con el predeterminado (marcadas con •). «Restablecer» = volver al predeterminado.",
    scope_help_device: "Se aplica solo a este navegador o dispositivo. «Restablecer» = volver a tu ajuste.",
    press_gesture: "Gesto para el menú del artículo", g_long: "Pulsación larga", g_double: "Doble clic", g_right: "Clic derecho", g_off: "Desactivado",
    press_target: "Dónde funciona el gesto", t_row: "Toda la fila", t_name: "Solo en el nombre",
    press_result: "Qué hace el gesto", r_menu: "Abrir menú", r_edit: "Editar directamente", r_delete: "Borrar (con confirmación)",
    menu_actions: "Entradas del menú", row_buttons: "Mostrar lápiz y papelera en la fila",
    shop: "Modo compra", shop_hide_checked: "Ocultar marcados", shop_keep_awake: "Mantener la pantalla encendida",
    shop_large: "Filas grandes", shop_tap_row: "Tocar toda la fila para marcar", reset: "Restablecer",
    sort: "Orden", sort_category: "Categoría", sort_alpha: "A–Z", sort_added: "Añadido", sort_list: "Por lista",
    packs: "Detección de categorías (paquetes de palabras clave)", packs_help: "Palabras clave → categoría. Puede haber varios paquetes activos (p. ej. español + el tuyo). Con la misma palabra clave gana el paquete más arriba. Las categorías recordadas siempre tienen prioridad.",
    pack_terms: "palabras clave", pack_products: "productos", pack_builtin: "integrado", pack_custom: "propio", pack_priority: "puesto",
    pack_up: "Subir (prioridad)", pack_download: "Descargar", pack_delete: "¿Borrar el paquete propio?", pack_bad_json: "El archivo no es un JSON válido.",
    pack_upload: "Subir paquete …", pack_name_help: "Nombre del paquete. El mismo nombre reemplaza un paquete propio existente.", pack_add: "Añadir",
    pack_skipped: "omitidas (categoría desconocida)", pack_template: "Plantilla",
    card_desc: "Lista de la compra con categorías, sugerencias, cantidades, etiquetas de tienda (@Mercadona) y permisos.",
    imp_placeholder: "- Leche 2 l @Mercadona\n- [ ] Pan\n- [x] Mantequilla\n3 manzanas",
    e_preset_pick: "— Elegir plantilla (ajusta varias opciones) —", e_view_list: "Lista", e_view_tiles: "Mosaicos (p. ej. tablet de cocina)", e_view_mini: "Mini mosaico (resumen, desplegable)",
    e_sort_category: "Por categoría", e_sort_added: "Orden de añadido", e_sort_list: "Por lista de origen (combinada)",
    e_layout_tabs: "Pestañas", e_layout_columns: "Lado a lado", e_layout_stack: "Una debajo de otra",
    e_density_compact: "Compacto", e_density_normal: "Normal", e_density_comfortable: "Grande (táctil)",
    e_sec_multi: "Varias listas en una tarjeta", e_sec_filter: "Filtros", e_sec_look: "Apariencia", e_sec_header: "Cabecera", e_sec_input: "Entrada",
    e_sec_list: "Lista", e_sec_done: "Completados", e_sec_shop: "Modo compra",
    e_pre_family: "Compra familiar (todo activado)", e_pre_kitchen: "Tablet de cocina (mosaicos grandes)", e_pre_store: "En la tienda (modo compra, sin entrada)",
    e_pre_readonly: "Solo ver", e_pre_tile: "Mosaico compacto para el panel",
    l_preset: "Plantilla", l_entity: "Lista", l_entities: "Listas (en lugar de «Lista» arriba)", l_layout: "Disposición", l_title: "Título (vacío = nombre de la lista)",
    l_view: "Vista", l_sort: "Orden predeterminado", l_advanced: "Mostrar opciones avanzadas",
    l_filter_store: "Solo tienda (p. ej. Mercadona; varias separadas por comas)", l_filter_person: "Solo persona (p. ej. Anna)", l_filter_tag: "Solo etiqueta (p. ej. bio)",
    l_filter_category: "Solo categorías", l_filter_offers: "Solo ofertas", l_filter_tags_new_items: "Los artículos nuevos reciben la etiqueta del filtro (@Mercadona …)",
    l_show_filter_chips: "Barra de filtros (tiendas, personas, ofertas)",
    l_density: "Altura de fila", l_font_scale: "Tamaño de letra", l_radius: "Radio de las esquinas", l_accent_color: "Color de acento (vacío = tema)",
    l_show_header: "Mostrar cabecera", l_show_count: "Número pendiente / resultados", l_show_search: "Búsqueda (lupa)",
    l_show_sort: "Selector de orden", l_show_shopping: "Botón de modo compra", l_show_undo: "Deshacer (↶)",
    l_show_import: "Botón de importar", l_show_settings: "Engranaje (ajustes personales)",
    l_show_add: "Campo para añadir", l_show_frequent: "«Comprados a menudo»",
    l_drag_drop: "Arrastrar y soltar (ratón): mover a otra lista, reordenar", l_show_stepper: "Selector de cantidad (− +)", l_show_offer: "Ofertas de la app (tienda, precio, válida hasta)",
    l_show_tags: "Etiquetas (@tienda, *persona, #etiqueta)", l_show_source: "Origen (lista de origen / persona)", l_show_note: "Notas",
    l_show_category_titles: "Títulos de categoría", l_max_height: "Altura máxima de la lista (vacío = sin límite)",
    l_show_completed: "Mostrar completados", l_collapse_completed: "Completados contraídos al inicio", l_start_shopping: "Empezar en modo compra",
    hh_preset: "Ajusta las opciones adecuadas de una vez – después todo se puede cambiar por separado.",
    hh_entities: "Varias listas: en pestañas, lado a lado o una debajo de otra. Todas las opciones valen para cada lista.",
    hh_filter_tags_new_items: "Si no, los artículos nuevos desaparecerían enseguida en una tarjeta filtrada.",
    hh_show_settings: "Cada usuario ajusta gesto, menú y modo compra en el engranaje.",
    hh_show_category_titles: "Desactivado: ordenado por categoría, pero como una sola lista con el icono de categoría delante.",
    hh_start_shopping: "Práctico para una tablet en el pasillo o un panel solo para la compra.",
    shop_auto_store: "Elegir la tienda según la zona", shop_auto_store_help: "Si estás en la zona de una tienda (p. ej. Mercadona), el modo compra muestra solo sus artículos.",
    shop_untagged: "Mostrar también artículos sin tienda", shop_untagged_help: "En el modo compra de una tienda, además todo lo que no tiene @tienda.",
    shop_store: "Tienda", shop_all_stores: "Todas",
    pack_edit: "Editar palabras clave", pack_new: "Nuevo paquete", pack_new_help: "Paquete vacío, p. ej. para otro idioma o términos propios. Se activa arriba del todo.", pack_new_placeholder: "p. ej. Nederlands",
    pack_empty: "Aún no hay palabras clave – añade alguna arriba.", pack_changed: "cambiada", pack_revert: "Deshacer el cambio", pack_ignore: "Ignorar (como Otros)",
    pack_more: "Cargar más", pack_term_placeholder: "Palabra clave (varias separadas por comas)",
    pack_builtin_edit_help: "Paquete integrado: los cambios van al paquete complementario «+» y se conservan en las actualizaciones.", pack_edit_help: "Paquete propio: los cambios se aplican al momento.",
    zone: "Zona", zone_new: "Nueva zona", zone_new_help: "Nombre de la zona. Posición: ubicación actual de este dispositivo (si no, casa), radio 100 m – ajústala en Ajustes → Áreas y zonas.",
    zone_wait: "Zona creada – aparecerá enseguida; luego vincúlala aquí.", zone_here: "ubicación de este dispositivo", zone_home: "posición de casa – ajústala",
    zone_none: "sin zona", zone_manage: "Gestionar zonas ↗", store_add: "Tienda con zona", store_add_help: "Nombre de la tienda, como en @Mercadona. Después se crea una zona para ella.",
    stores: "Tiendas y zonas", stores_help: "Vincula tiendas con zonas de Home Assistant. En el modo compra verás automáticamente solo los artículos de la tienda en la que estás.",
    notes: "Notas de la app", notes_help: "La app HA SmartLists guarda las notas en su propia lista de tareas. No son listas de la compra, por eso están ocultas por defecto.",
    notes_show: "Mostrar en SmartLists", notes_show_help: "Como sección 📝 aparte en la página – no en Assist, acciones ni listas combinadas.",
    notes_scope: "Quién ve las notas", notes_scope_owner: "solo la propia cuenta", notes_scope_household: "todos los usuarios",
    notes_lists: "Listas de notas y propietarios", notes_none: "No se encontró ninguna lista de notas de la app.", notes_no_owner: "desconocido (solo admins)",
    p_order: "Cambiar el orden", p_order_hint: "◀ ▶ mueve una lista. Con el ratón: arrastra una etiqueta sobre otra. El orden vale también para las columnas.",
    p_left: "A la izquierda", p_right: "A la derecha",
    look: "Etiquetas y colores", look_help: "Aspecto de las etiquetas para todos los usuarios. Los colores y nombres de las tiendas también valen en la app. Vacío o ↺ = predeterminado.",
    look_style: "Estilo", look_filled: "relleno", look_soft: "suave", look_outline: "borde", look_text: "solo texto",
    look_color: "Color de fondo", look_text: "Color del texto", look_icon: "Símbolo delante", look_label: "Nombre mostrado", look_kinds: "Por tipo", look_values: "Etiquetas individuales",
    look_search: "Buscar etiqueta … (p. ej. mercadona)", look_more: "Encuentra más con la búsqueda.", look_add: "Colorear una etiqueta",
    look_add_help: "Con su carácter, p. ej. @Kaufland, *Max o #vegano – aunque aún no se haya usado.",
    zone_count: "zonas", zone_unlink: "Desvincular zona", zone_add: "Zona",
    app_list: "lista combinada de la app", app_list_connected: "vinculada", app_list_connect: "Vincular",
    zone_name: "Nombre de la zona, p. ej. Mercadona Centro", zone_radius: "Radio", zone_coords: "Coordenadas o enlace de mapa", zone_coords_placeholder: "40.4168, -3.7038 o un enlace de Google/Apple/OSM", zone_coords_bad: "No se reconocen coordenadas.", zone_locating: "Obteniendo ubicación …", zone_no_location: "Ubicación no disponible – elige otra opción.", zone_where: "¿Dónde?", zone_here_opt: "Ubicación actual (este dispositivo)", zone_home_opt: "Casa", zone_map_opt: "Elegir en el mapa", zone_after: "Ajústala cuando quieras en Ajustes → Áreas y zonas.",
    note_new: "Nueva nota", note_edit: "Editar nota", note_view: "Lista / cuadrícula", note_empty: "Aún no hay notas.", note_locked: "Nota cifrada", note_locked_help: "Cifrada con la contraseña de notas de la app – solo legible en la app.", note_title: "Título", note_body: "Texto",
    p_settings_hint: "",
    list_settings_hint: "Controles y ajustes globales: ⚙ arriba a la derecha de la página.",
    settings_list: "Ajustes de esta lista", settings_global: "Ajustes generales", list_settings_hint_card: "Controles y ajustes globales: el icono de controles en la cabecera.",
    tpl: "Plantillas",
    scan: "Escanear código de barras",
    price_sum: "Total",
    soft_checked: "marcado desde fuera (enlace)",
    soft_checked_help: "Alguien lo marcó como hecho mediante un enlace compartido – el artículo sigue abierto hasta que lo marques tú.",
    price: "Precio",
    aisle: "Orden",
    price_paid: "último pagado",
    price_manual: "precio propio",
    price_last: "la última vez",
    tpl_servings: "Raciones",
    tpl_new: "Nueva plantilla",
    tpl_from_list: "Lista como plantilla",
    tpl_increase: "ya está en la lista → se aumenta la cantidad",
    tpl_servings_help: "Las cantidades se recalculan",
    tpl_increased: "cantidad aumentada",
    tpl_name: "Nombre, p. ej. Tortitas",
    tpl_items_placeholder: "Harina 250 g\nLeche 0,5 l\nHuevos 3",
    tpl_items: "Artículos",
    tpl_items_help: "Un artículo por línea, con cantidad y etiquetas como en la lista. Raciones (opcional) = para cuántos son las cantidades.",
    tpl_edit: "Editar plantilla",
    scan_help: "Coloca el código de barras sobre la línea roja – o escribe el número de debajo.",
    scan_code: "Número del código de barras",
    scan_unknown: "Producto no encontrado – escribe el nombre tú mismo.",
    scan_find: "Buscar",
    scan_no_camera: "El escaneo con cámara no es compatible aquí (p. ej. Safari en iPhone, Firefox) – escribe el número.",
    aisle_down: "Bajar",
    aisle_help: "Así ordena el modo compra cuando esta tienda está seleccionada. Arrastra el asa ⠿ o usa las flechas.",
    aisle_all_branches: "todas las sucursales",
    aisle_reset: "Predeterminado",
    notify_to: "Enviar a",
    notify_no_phone: "No se encontró ningún dispositivo con la app Companion.",
    notify_added: "Con artículos nuevos",
    notify_checked: "Cuando se marca algo",
    notify_lists: "Listas",
    notify_all_lists: "todas las que puedo ver",
    notify_from: "De quién",
    notify_quiet: "Horas de silencio",
    notify_quiet_none: "ninguna",
    notify: "Notificaciones",
    notify_help: "Cuando otra persona cambia algo (tus propios cambios solo si está activado abajo). Varios cambios en un minuto llegan como un mensaje.",
    stats_90: "90 días",
    stats_year: "Año",
    stats_all: "todo",
    stats_top: "Comprado con más frecuencia",
    stats_every: "cada",
    stats_none: "Todavía no hay suficiente historial.",
    stats_overdue: "Hace tiempo que no se compra",
    stats_add: "Añadir a la lista",
    stats_usually: "normalmente cada",
    stats_since: "desde",
    stats_shares: "Por categoría · tienda",
    stats: "Estadísticas",
    stats_help: "A partir del historial existente – no se recopilan datos adicionales.",
    exp_week: "Semana",
    exp_month: "Mes",
    exp_year: "Año",
    exp_none: "Aún no hay gastos – se registran al marcar artículos con precio.",
    exp_no_store: "sin tienda",
    exp: "Gastos",
    exp_help: "Se registran al marcar (precio × cantidad). Los precios vienen de ofertas, a mano (p. ej. «Leche 2 l 1,19€» o ✏️) o de la última compra.",
    share_view: "solo ver",
    share_soft: "marcar «soft» (sigue abierto)",
    share_check: "marcar de verdad",
    share_mode: "Permitido",
    share_mode_help: "«soft»: ves lo que se ha marcado – el artículo sigue abierto en tu lista. Lo añadido por el enlace se marca con 🔗 en tu lista.",
    share_add: "Puede añadir",
    share_valid: "Validez",
    share_2h: "2 horas",
    share_1d: "1 día",
    share_7d: "7 días",
    share_30d: "30 días",
    share_forever: "hasta revocarlo",
    share_create: "Crear enlace",
    soft_checked_by: "marcado por {name} (enlace)", link_added_by: "añadido por {name} por enlace",
    x_stats: "Estadísticas y gastos", x_stats_help: "Lo más comprado, lo que hace tiempo que no se compra, porcentajes por categoría y tienda, gastos por mes (📊 en la página, sensor «Gastos este mes»). Desactivado: oculto, se sigue contando en segundo plano.", w_x_stats_sub: "Lo que compráis a menudo y cuánto gastáis",
    share_soft_add: "marcar «soft» y añadir", link_added: "añadido por enlace", link_added_help: "Alguien sin cuenta lo añadió mediante un enlace compartido.",
    link_shared: "compartida en la web", link_shared_help: "Accesible mediante {n} enlace(s) para personas sin cuenta. Toca para ver o revocar los enlaces.",
    pub_cf_arch: "{path} es para otro procesador ({found}). Este sistema necesita {file} – borra o sustituye el archivo antiguo.", pub_cf_kind_windows: "{path} es la versión de Windows. Home Assistant necesita {file}.", pub_cf_kind_mac: "{path} es la versión de macOS. Home Assistant necesita {file}.", pub_cf_kind_archive: "{path} es un archivo comprimido (.tgz/.zip/.deb), no el programa. Descarga el archivo {file} sin extensión.", pub_cf_kind_html: "{path} es una página web guardada, no el programa. Descarga el archivo {file} directamente desde la página de versiones.", pub_cf_kind_not_executable: "{path} no se puede ejecutar (permisos). Vuelve a colocar el archivo o revisa sus permisos.", pub_cf_kind_unknown: "{path} no sirve para este sistema. Se necesita {file}.",
    shared_change_hint: "Para cambiar: engranaje de esta lista → Compartir.",
    l_plain: "Lista simple", l_plain_help: "Sin categorías, sugerencias, palabras recordadas ni precios. SmartLists no recuerda nada de esta lista – sus artículos no aparecen en otras (p. ej. ferretería).",
    l_categories: "Categorías automáticas", l_categories_help: "Desactivado: sin clasificar por categorías – ni en la lista ni al escribir. Ordena p. ej. por añadido.", l_suggest: "Comprado a menudo y sugerencias", l_suggest_list: "solo de esta lista", l_suggest_sources: "de sus listas de origen", l_suggest_all: "de todas las listas", l_suggest_help: "Lo comprado en otra lista no aparece aquí. Las entradas antiguas (antes de 3.9.4) siguen valiendo en todas.",
    zone_dup_title: "La zona ya existe", zone_dup_text: "Ya existe una zona «{name}». Puedes mantener el nombre (habrá dos zonas con el mismo nombre, p. ej. dos tiendas) o renombrar la nueva zona, p. ej. «{name} Centro».", zone_dup_keep: "Mantener nombre", zone_dup_rename: "Renombrar", zone_dup_rename_help: "Nombre de la nueva zona, p. ej. con el barrio o la calle de la tienda.", app_title: "Guardar como app en la pantalla de inicio", app_lead: "Un icono en el móvil que abre esta lista directamente – sin app adicional. Pantalla completa como una app.", app_list: "Lista", app_shop: "Abrir directamente en modo compra", app_install: "Instalar", app_close: "Cerrar", app_ios: "En Safari toca Compartir (□↑) abajo\nElige Añadir a pantalla de inicio\nToca Añadir – listo", app_android: "En Chrome toca ⋮ arriba a la derecha\nElige Añadir a pantalla de inicio o Instalar aplicación\nConfirma Instalar – listo", app_other: "En el menú del navegador elige Instalar aplicación o Añadir a pantalla de inicio\nEn el móvil: abre esta página en Chrome (Android) o Safari (iPhone)",
    x_title: "Extras", x_help: "Funciones opcionales. No hacen falta para empezar – actívalas aquí cuando las quieras.", x_notes: "Notas", x_notes_help: "Listas de notas (p. ej. de la app HA SmartLists) como sección 📝 propia. Quién las ve se ajusta en Dispositivos y notas.", x_mealplan: "Plan semanal", x_mealplan_help: "Platos por día, ingredientes a la lista, calendario «Menú». Desactivado: la pestaña, la entrada del menú y el calendario desaparecen, los platos se conservan.", w_x_optional: "Opcional – también más tarde en Ajustes → Extras", w_x_notes_sub: "Listas de notas como sección propia, p. ej. de la app", w_x_mealplan_sub: "Planificar platos por día y poner los ingredientes en la lista", share_leak: "El enlace contiene la dirección de tu Home Assistant. Para no revelarla: Quick Tunnel o tu propio proxy (Ajustes → Compartir y permisos → Dirección pública).", share_old_address: "la dirección ha cambiado, el enlace ya no funciona", pub_title: "Dirección pública de los enlaces", pub_help: "Por dónde se accede a los enlaces compartidos. Con un túnel o tu propio proxy nadie conoce la dirección de tu Home Assistant.", pub_mode: "Enlaces por", pub_ha: "Dirección de Home Assistant", pub_tunnel: "Cloudflare Quick Tunnel", pub_proxy: "Proxy o túnel propio", pub_ha_help: "Como antes: el enlace apunta a la dirección externa de Home Assistant – quien lo recibe conoce esa dirección.", pub_tunnel_help: "SmartLists inicia cloudflared y obtiene una dirección aleatoria (…trycloudflare.com). El túnel solo lleva a un pequeño servidor propio que únicamente sirve listas compartidas – no a Home Assistant. Sin cuenta ni redirección de puertos.", pub_proxy_help: "Redirige tu dirección a http://<IP de Home Assistant>:{port} (Caddy, nginx, Cloudflare Tunnel con tu dominio …). Allí solo corre el servidor de compartir de SmartLists, no Home Assistant.", pub_url: "Dirección pública", pub_port: "Puerto", pub_port_change: "cambiar (opcional)", pub_port_help: "Puerto del servidor de compartir (por defecto 8126).", pub_starting: "El túnel se está iniciando …", pub_server_ok: "El servidor de compartir funciona en el puerto {port}.", pub_not_ready: "aún no está listo", pub_tunnel_note: "La dirección del túnel cambia con cada reinicio de Home Assistant – los enlaces creados antes dejan de funcionar. Para enlaces duraderos: proxy o túnel propio.", pub_cf_missing: "No se encontró cloudflared. SmartLists no lo descarga por sí mismo.", pub_cf_not_exec: "Se encontró {path}, pero no es ejecutable o es para otro sistema.", pub_cf_download: "Descargar cloudflared – para este sistema: {file}", pub_cf_where: "Pon el archivo {file} en una de estas carpetas (no hace falta renombrarlo; una subcarpeta «cloudflared» también vale): {paths}. Luego Guardar.", pub_cf_or_proxy: "O usa tu propio proxy.", pub_err_cloudflared_missing: "Falta cloudflared.", pub_err_cloudflared_not_executable: "cloudflared no es ejecutable.", pub_err_port_in_use: "El puerto {port} está ocupado – elige otro.", pub_err_cloudflared_exit: "cloudflared se detuvo (código {code}) – se reinicia en breve.", pub_err_cloudflared_failed: "No se pudo iniciar cloudflared: {code}",
    share_active: "Enlaces activos",
    share_revoke: "Revocar",
    share_expired: "caducado",
    share_until: "hasta",
    share_opened: "abierto",
    share_once: "El enlace solo se muestra ahora – no se guarda. Más tarde: revócalo y crea uno nuevo.",
    share_local: "Esta es una dirección de tu red doméstica – desde fuera el enlace solo funciona con una URL externa (Ajustes → Sistema → Red).",
    share_copied: "copiado",
    share_copy: "Copiar enlace",
    share_send: "Compartir …",
    share: "Compartir por enlace",
    share_help: "Para personas sin cuenta de Home Assistant. Solo ven esta lista (sin notas) – nada más de Home Assistant. Predeterminado: solo ver.",
    barcode_lookup: "Buscar códigos de barras en línea",
    barcode_lookup_help: "Open Food Facts, solo se envía el número. Desactivado: solo códigos ya conocidos.",
    tab_stats: "Estadísticas",
    l_show_templates: "Botón de plantillas (📋)",
    l_show_scan: "Botón de código de barras",
    l_show_prices: "Precios y total",
    p_group_combined: "Listas combinadas", p_group_lists: "Listas", p_group_notes: "Notas", app_list_pending: "Lista combinada de la app – aún no vinculada en Home Assistant", app_list_admin: "Un admin de Home Assistant puede vincularla (toca aquí o en Dispositivos conectados).", share_combined: "Atención: una lista combinada comparte los artículos de todas sus listas de origen.",
    aisle_sort: "Ordenar", aisle_drag: "Arrastrar para mover", emoji_pick: "Elegir símbolo", emoji_free: "propio", emoji_food: "Comida", emoji_occasion: "Ocasiones y hogar", emoji_people: "Personas", emoji_symbols: "Símbolos", emoji_none: "ninguno",
    trip_done: "Compra terminada", trip_help: "El total «en el carro» vuelve a 0. Los gastos siguen registrados. Para listas que reutilizas, puedes reabrir todo lo marcado.", trip_reopen: "Reabrir todo", trip_finish: "Terminar", stats_forget: "Borrar del historial", stats_forget_help: "se quita de estadísticas, sugerencias y ritmo de compra (p. ej. añadido por error).", exp_entries: "Movimientos", notes_create: "Crear lista de notas", notes_create_help: "Nombre de la lista de notas. Es tuya; se crea como todo.ha_smartlists_notes_<nombre>.",
    p_lists_all: "Todas las listas", p_lists_less: "Menos",
    scan_native_help: "Apunta al código de barras del envase.", scan_type: "Escribir el número", scan_not_product: "No es un código de barras de producto (EAN).",
    scan_target: "Lista de destino", scan_target_this: "esta lista (de la tarjeta)", scan_mode: "Artículos escaneados", scan_mode_input: "al campo de entrada (revisar y añadir)", scan_mode_add: "añadir directamente", barcode_providers: "Servicios de búsqueda", barcode_providers_help: "Toca para activar/desactivar, el número es el orden – cuenta el primer resultado. SmartLists recuerda los códigos encontrados.", barcode_custom: "servicio propio", barcode_custom_url: "URL con {code}", barcode_custom_field: "Campo con el nombre",
    a_applies: "Se aplica a", a_menu: "Menú del artículo", a_shop: "Comprar y escanear", a_me_sub: "Solo se aplica a ti.", a_look: "Etiquetas y colores", a_global_sub: "Se aplica a todos los usuarios, también en la app.", a_cats: "Categorías", a_devices: "Dispositivos y notas", a_rights: "Compartir y permisos", a_rights_sub: "Lo que pueden hacer los usuarios sin permisos de admin.", a_data: "Voz, copia, predeterminados", a_stats: "Estadísticas y gastos", a_search: "Buscar ajuste", admin_only_short: "solo admins", g_stats: "Análisis", ls_done: "Listo", rights_who: "Pueden crear enlaces", rights_share_who: "Pueden crear enlaces", rights_who_admins: "solo admins", rights_who_owners: "admins y propietario de la lista", rights_who_editors: "todos los que pueden editar la lista", rights_who_nobody: "nadie (compartir desactivado)", rights_max: "Un enlace permite como máximo", rights_share_max: "Un enlace permite como máximo", rights_max_on: "marcar y añadir", rights_limits_help: "Los límites se aplican a los usuarios sin permisos de admin.", rights_max_hours: "Validez máxima", rights_share_max_hours: "Validez máxima", rights_all_links: "Mostrar enlaces activos de todas las listas", rights_no_links: "No hay enlaces activos.", rights_share_help: "Los enlaces dan acceso a una sola lista a personas sin cuenta.", rights_other: "Permitido sin permisos de admin", rights_create_lists: "Crear listas propias", rights_templates: "Crear y cambiar plantillas", rights_categories: "Asignar categorías a mano", rights_prices: "Introducir precios", ls_list: "Lista", ls_list_help: "Se aplica a esta lista en todos los dispositivos, salvo que una tarjeta o un dispositivo indique otra cosa.", ls_name: "Nombre", ls_sort: "Ordenada por", ls_default: "predeterminado de la tarjeta",
    w_title: "Configurar SmartLists", w_time: "Tarda unos dos minutos.", w_step: "Paso {n} de {m}", w_s_lists: "Listas", w_s_stores: "Tiendas", w_s_naming: "Notación", w_s_lang: "Idioma", w_s_people: "Personas y app", w_s_extras: "Extras", w_s_done: "Listo", w_lists_h: "¿Con qué quieres empezar?", w_lists_found: "SmartLists ha encontrado {n} listas de tareas en Home Assistant.", w_lists_none: "Todavía no hay ninguna lista de tareas en Home Assistant.", w_use: "Usar las listas existentes", w_use_sub: "Se quedan como están. SmartLists las muestra con categorías, cantidades y tiendas.", w_combine: "Unirlas en una lista combinada", w_combine_sub: "Cada uno conserva su lista; la lista combinada las muestra todas.", w_combine_name: "Nombre de la lista combinada", w_combine_default: "Compra", w_new: "Crear una lista nueva", w_new_sub: "Solo en SmartLists; tú eres el propietario y puedes compartirla.", w_new_name: "Nombre de la lista", w_open: "abiertas", w_stores_h: "¿Dónde haces la compra?", w_stores_lead: "Las tiendas se sugieren mientras escribes, y el modo compra muestra solo lo que necesitas en esa tienda.", w_store_other: "Otra tienda", w_store_add: "Añadir", w_chosen: "Seleccionadas: {list}", w_chosen_none: "Aún no has seleccionado ninguna tienda", w_becomes: "se convierte en", w_stores_later: "Puedes añadir la ubicación de las tiendas más tarde. Así SmartLists elige la tienda automáticamente cuando estés allí.", w_naming_h: "¿Cómo marcas tienda, persona y etiqueta?", w_naming_lead: "Un carácter justo antes de una palabra la convierte en una insignia. Se queda en el texto del artículo, así que Home Assistant y la app también lo ven.", w_eg_store: "por ejemplo @REWE", w_eg_person: "por ejemplo *Anna", w_eg_tag: "por ejemplo #bio", w_naming_bad: "«{c}» no está permitido.", w_naming_dup: "Usa cada carácter solo una vez.", w_naming_hint: "Se permiten {chars}. Déjalo vacío para desactivar un tipo. La app HA SmartLists adopta estos caracteres al vincularse.", w_eg_item: "Leche", w_eg_qty: "2 l", w_lang_h: "¿En qué idioma escribes los artículos?", w_lang_lead: "Así SmartLists reconoce la categoría, por ejemplo la leche en refrigerados. Se pueden combinar varios idiomas.", w_words: "palabras", w_people_h: "¿Quién participa?", w_people_lead: "Permisos para la lista nueva. Todos ven SmartLists en su barra lateral.", w_people_combined: "Las listas combinadas son visibles para todas las personas que ven las listas de origen. Los permisos por persona existen para las listas propias de SmartLists.", w_you: "tú, admin", w_all: "puede hacerlo todo", w_app: "App HA SmartLists en un dispositivo", w_app_sub: "En la app, toca «Vincular» en Ajustes → Conexión. Los dispositivos conectados aparecen después en Global → Dispositivos y notas.", w_extras_h: "¿Qué más quieres que haga SmartLists?", w_extras_lead: "Todo se puede activar y desactivar más tarde.", w_x_notify: "Avisarme cuando alguien añada algo", w_x_notify_sub: "A tu dispositivo con la app de Home Assistant", w_x_notify_none: "No se ha encontrado ningún dispositivo con la app de Home Assistant", w_x_voice: "Añadir artículos por voz", w_x_voice_sub: "«Añade leche a la lista de la compra» con Assist", w_x_prices: "Precios y gastos", w_x_prices_sub: "Total de la lista y resumen mensual", w_x_barcode: "Buscar códigos de barras en línea", w_x_barcode_sub: "En Open Food Facts; solo se envía el número", w_x_share: "Los propietarios pueden compartir listas mediante enlace", w_x_share_sub: "Para personas sin cuenta de Home Assistant, por ejemplo vecinos o invitados", w_done_h: "Todo listo", w_done_lead: "Esto es lo que se configurará. Puedes cambiarlo todo en cualquier momento en los ajustes.", w_sum_combined: "Lista combinada «{name}» a partir de {lists}", w_sum_new: "Lista nueva «{name}»", w_sum_lists: "Listas: {lists}", w_sum_stores: "Tiendas: {list}", w_sum_naming: "Notación: {list}", w_sum_lang: "Categorías: {list}", w_sum_people: "Compartir: {list}", w_sum_extras: "Activado: {list}", w_off: "desactivado", w_tip: "Consejo: empieza a escribir en el campo de entrada, por ejemplo «2 kg manzanas @REWE».", w_back: "Atrás", w_next: "Siguiente", w_skip: "Omitir", w_finish: "Configurar", w_start: "Empezar", w_later: "Se puede cambiar más tarde en los ajustes", w_close: "Cerrar la configuración", w_restart: "Volver a ejecutar la configuración", w_restart_sub: "El asistente del primer inicio, p. ej. para combinar más listas.",
    more: "Más", ih_title: "Historial", ih_none: "Aún no hay entradas.", ih_add: "añadido", ih_check: "marcado", ih_uncheck: "reabierto", ih_rename: "renombrado", ih_remove: "borrado", ih_link: "mediante enlace compartido", ih_auto: "automatización", mp_title: "Plan semanal", mp_add: "Plato", mp_help: "Los platos son plantillas. «Ingredientes a la lista» pone todo lo de esta semana en la lista; los artículos iguales se suman. El plan también aparece como calendario en Home Assistant.", mp_no_tpl: "Crea primero una plantilla (⋯ → Plantillas).", mp_prev: "Semana anterior", mp_next: "Semana siguiente", mp_mealie: "Traer de Mealie", mp_recipes: "recetas importadas", mp_to_list: "Ingredientes a la lista", db_title: "Panel de compras", db_help: "Crea una vista propia en la barra lateral: todas las listas, el plan semanal y las estadísticas. Después se edita como cualquier panel.", db_create: "Crear panel", db_open: "Abrir panel", db_lists: "Listas", db_plan: "Plan semanal", db_stats: "Estadísticas",
    rs_title: "Empezar de cero", rs_help: "Elige qué se restablece. Después se inicia el asistente. Las listas de tareas y sus artículos nunca se borran; los ajustes personales se mantienen.", rs_settings: "Restablecer ajustes", rs_settings_sub: "Convención de nombres, etiquetas y colores, tiendas y zonas, orden de pasillos, permisos, voz y automatizaciones, vista de las listas, paquetes de palabras clave.", rs_data: "Borrar datos aprendidos", rs_data_sub: "Categorías recordadas, historial y estadísticas, precios y gastos, plantillas y plan semanal.", rs_links: "Revocar todos los enlaces", rs_links_sub: "Los enlaces compartidos dejan de funcionar.", rs_combined: "Quitar listas combinadas", rs_combined_sub: "Solo la vista combinada – las listas de origen no cambian.", rs_go: "Restablecer e iniciar asistente",
    mp_saved: "Plan guardado", mp_ask_add: "¿Añadir ahora los ingredientes de esta semana a la lista?", mp_not_now: "No, solo guardar",
    notify_own: "También con mis propios cambios", notify_own_sub: "p. ej. cuando añades algo en el PC y lo quieres en tu dispositivo – o para probar.", notify_test: "Enviar mensaje de prueba", notify_test_sent: "Mensaje de prueba enviado – si no llega, revisa la app Companion y el permiso de notificaciones.",
    m_select: "Seleccionar", sel_mode: "Seleccionar varios", sel_count: "{n} seleccionados", sel_all: "Todos", sel_none: "Ninguno", sel_check: "Marcar", sel_checked: "marcados", sel_reopened: "reabiertos", sel_delete_q: "¿Borrar {n} artículos?",
    mp_target: "Ingredientes a:",
    p_tab_lists: "Listas",
    nt_add: "Añadir destino", nt_none: "Aún no hay destino – no se enviarán mensajes.", nt_service: "Servicio de notificación", nt_entity: "Entidad de notificación", nt_custom: "Servicio propio", nt_no_services: "No se encontraron servicios notify.", nt_no_entities: "No se encontraron entidades notify.", nt_custom_help: "Cualquier servicio (solo admins), p. ej. telegram_bot.send_message o script.mi_mensaje. Datos en JSON; {title} y {message} se sustituyen – sin marcadores se añaden title y message.", nt_help: "Se pueden varios destinos: app Companion, Telegram, correo, Signal, altavoces … – todo lo que Home Assistant conoce como notificación.", nt_bad_service: "Indica el servicio como dominio.servicio.",
    mg_title: "Traspasar listas", mg_sub: "Traspasar listas de tareas existentes (lista de la compra, Local To-do …) a listas propias de SmartLists – con artículos, notas y marcas.", mg_help: "Las nuevas listas son tuyas y se pueden compartir después. Elige una o varias listas.", mg_lists: "Listas", mg_none: "No se encontraron listas adecuadas.", mg_how: "Varias listas", mg_each: "Una propia por lista", mg_each_sub: "Mismo nombre que antes.", mg_one: "Todas en una lista", mg_one_sub: "Todos los artículos juntos en una lista nueva.", mg_name: "Nombre de la nueva lista", mg_tag: "Marcar el origen como", mg_tag_none: "no marcar", mg_old: "Lista antigua", mg_used: "Se usa en listas combinadas: {lists}. Añade allí la nueva lista antes de borrar la antigua.", mg_pick: "Elige al menos una lista.", mg_go: "Traspasar", mg_items: "artículos",
    mg_pf_local: "To-do local", mg_pf_shopping: "Lista de la compra", mg_pf_other: "Otra",
    mg_keep_info: "La lista antigua queda sin cambios. Revisa la nueva lista y borra después la antigua tú mismo.", mg_done_hint: "Las listas antiguas siguen existiendo. Si todo está bien en la nueva lista, bórralas tú (Ajustes → Dispositivos y servicios, p. ej. Local To-do o la integración correspondiente):", mg_done_combined: "Al menos una lista antigua es fuente de una lista combinada – añade allí primero la nueva lista.",
    mg_pf_notes: "Notas", mg_as: "Traspasar como", mg_as_list: "Lista", mg_as_list_sub: "Lista propia de SmartLists con categorías, cantidades y funciones de compra.", mg_as_notes: "Notas", mg_as_notes_sub: "Nueva lista de notas (solo visible para ti), notas con título y texto – las cifradas se conservan.",
    owner_everyone: "— todos (sin restricción)", owner_combined_help: "Con propietario, solo él, los admins y las personas compartidas ven la lista.",
    lb_title: "Etiquetas de origen", lb_help: "Muestra en cada artículo de qué lista viene.", lb_show: "La etiqueta muestra", lb_list: "Nombre de la lista", lb_owner: "Propietario de la lista de origen", lb_both: "Propietario y nombre de la lista", lb_show_help: "Las listas sin propietario (Local To-do …) muestran siempre el nombre.", lb_only: "Solo de estas listas", lb_all: "todas",
    lb_colors: "Color por lista de origen (por defecto: automático, uno distinto por lista)",
  },
  it: {
    add_placeholder: "es. 2 kg mele {store}", add_ph_store: "Negozio", note: "Nota", save: "Salva", cancel: "Annulla",
    done: "Fatto", clear: "Rimuovi completati", own: "Lista propria", combined: "Combinata", foreign: "Esterna",
    empty: "Niente da comprare 🎉", no_add: "L'aggiunta è disattivata per questa lista.", open: "da fare",
    confirm_delete: "Eliminare davvero l'articolo?", confirm_clear: "Rimuovere tutti gli articoli completati?",
    error: "Errore", loading: "Caricamento …", readonly: "Solo lettura", delete: "Elimina", edit: "Modifica",
    frequent: "Acquistati spesso", src_manual: "memorizzata", src_learned: "appresa", src_pack: "automatica", src_fallback: "sconosciuta",
    unit_hint: "unità abituale", category: "Categoria", settings: "Impostazioni", naming: "Convenzione dei nomi",
    naming_help: "Un carattere davanti a una parola la trasforma in un badge. Vale per tutte le liste e tutti i dispositivi.",
    kind_store: "Negozio", kind_person: "Persona", kind_tag: "Tag", add_rule: "Aggiungi regola", example: "Esempio",
    learned: "Categorie memorizzate", learned_help: "Si creano quando scegli una categoria a mano.", forget: "Dimentica",
    none_learned: "Ancora niente di memorizzato.", saved: "Salvato", admin_only: "Solo gli amministratori possono modificarlo.",
    in_list: "è già nella lista",
    tab_me: "Per me", tab_house: "Globale", tab_list: "Questa lista", ui_me_help: "Vale solo per te. Le differenze rispetto all'impostazione globale sono segnate con •.",
    ui_house: "Comandi – predefinito per tutti", reset_default: "Ripristina predefinito", about_list: "Informazioni sulla lista", type: "Tipo", entity: "Entità", sources: "Origini",
    type_combined: "Lista combinata", type_own: "Lista SmartLists propria", type_list: "Lista to-do di Home Assistant", char: "Carattere", kind: "Tipo",
    no_hits_short: "Nessun risultato.", by_hand: "a mano", search_learned: "Cerca … (es. latte)",
    automation: "Voce e automazioni", automation_help: "Assist e articoli da ricomprare. Blueprint «Sono al negozio» e promemoria negozio: vedi wiki.",
    auto_voice_default_list: "Lista predefinita per Assist", auto_voice_help: "Usata quando la frase non nomina nessuna lista.",
    auto_auto_due_list: "Aggiungi automaticamente gli articoli da ricomprare a", auto_due_help: "Ogni ora, secondo il vostro ritmo di acquisto. «—» = disattivato.",
    install_sentences: "Installa frasi Assist", sentences_installed: "installate",
    devices: "Dispositivi collegati", devices_help: "Dispositivi con l'app HA SmartLists. ⚠️ = non sincronizzato da oltre 7 giorni. Per revocare l'accesso, elimina il token nel profilo.",
    no_devices: "Nessun dispositivo collegato.", remove_device: "Rimuovi dalla lista", last_seen: "visto",
    role_all: "tutti i permessi", admin_always: "Admin – può sempre fare tutto", shop_large_help: "Più facile da toccare con il pollice. Disattivato: stessa dimensione della vista normale.",
    new_list_help: "Sei il proprietario e poi puoi condividerla con altri.", new_list_placeholder: "es. Drogheria", create: "Crea",
    p_columns: "Più liste affiancate", p_wide: "Vista larga", p_settings: "Impostazioni", p_back: "Torna alle liste",
    p_hint: "Tocca le liste per affiancarle (oltre 3 vanno a capo). Trascina gli articoli col mouse in un'altra lista per spostarli (Ctrl = copia).",
    p_empty: "Nessuna lista trovata. Creane una in Impostazioni → Dispositivi e servizi → SmartLists – oppure con + in alto.",
    owner: "proprietario", shared: "condivisa", private: "privata", admin: "admin", sharing: "Condivisione",
    sharing_help: "Chi può vedere e modificare questa lista. Gli admin possono sempre fare tutto. La vista to-do di HA mostra ogni lista a tutti – è nascosta solo in SmartLists (scheda, pagina, app).",
    role_none: "nessun accesso", role_viewer: "vedere", role_checker: "spuntare", role_editor: "modificare", role_owner: "proprietario",
    no_users: "Nessun altro utente in Home Assistant.", delete_list: "Elimina lista", confirm_delete_list: "Eliminare questa lista con tutti gli articoli?",
    new_list: "Nuova lista", new_list_prompt: "Nome della nuova lista:",
    due_every: "da ricomprare – lo comprate circa ogni", days: "giorni", backup: "Backup e trasferimento",
    backup_help: "Categorie memorizzate, cronologia, convenzione dei nomi e comandi in un file – es. per una seconda istanza HA. L'importazione aggiunge senza cancellare nulla.",
    export: "Esporta", import: "Importa …",
    mini_open: "Apri lista", mini_close: "Comprimi", card_version: "scheda", stale_card: "Questa scheda è obsoleta – ricarica la pagina (Ctrl+F5) o svuota la cache del frontend nell'app.", offer: "Offerta", offer_until: "fino al", offer_expired: "scaduta dal",
    qty_less: "Diminuisci quantità", qty_more: "Aumenta quantità", qty_changed: "quantità modificata",
    search: "Cerca", search_placeholder: "Cerca nella lista …", hits: "risultati", no_hits: "Nessun risultato per", add_this: "aggiungi",
    imp: "Importa", imp_ha: "Da Home Assistant", imp_text: "Come testo", imp_source: "Lista",
    imp_done: "Includi completati", imp_skip_dupes: "Salta quelli già presenti", imp_go: "Importa",
    imp_text_help: "Un articolo per riga. Elenchi puntati, [ ] / [x] e numeri vengono riconosciuti, così come quantità e tag.",
    imp_preview: "Anteprima", imp_none: "Niente da importare.", imp_count: "articoli", imported: "importati", imp_dupe: "presente",
    imp_no_lists: "Nessun'altra lista trovata in Home Assistant.",
    shop_on: "Avvia modalità spesa", shop_off: "Termina modalità spesa", in_cart: "nel carrello", undo: "Annulla", checked_off: "spuntato", unchecked: "riaperto",
    deleted: "eliminato", removed: "completati rimossi", added: "aggiunto", changed: "modificato",
    m_rename: "Rinomina / modifica", m_move: "Sposta in …", m_copy: "Copia in …", m_category: "Cambia categoria", m_delete: "Elimina",
    moved: "spostato in", copied: "copiato in", no_targets: "Nessun'altra lista in cui puoi scrivere.",
    ui: "Comandi", ui_help: "Ogni utente lo imposta per sé. Facoltativamente diverso per dispositivo.",
    scope_household: "Predefinito per tutti", scope_user: "Per me su tutti i dispositivi", scope_device: "Solo su questo dispositivo",
    scope_help_household: "Vale per chi non ha impostato nulla di proprio.",
    scope_help_user: "Si salvano solo le tue differenze dal predefinito (segnate con •). «Ripristina» = torna al predefinito.",
    scope_help_device: "Vale solo per questo browser o dispositivo. «Ripristina» = torna alla tua impostazione.",
    press_gesture: "Gesto per il menu dell'articolo", g_long: "Pressione lunga", g_double: "Doppio clic", g_right: "Clic destro", g_off: "Disattivato",
    press_target: "Dove funziona il gesto", t_row: "Tutta la riga", t_name: "Solo sul nome",
    press_result: "Cosa fa il gesto", r_menu: "Apri menu", r_edit: "Modifica direttamente", r_delete: "Elimina (con conferma)",
    menu_actions: "Voci del menu", row_buttons: "Mostra matita e cestino nella riga",
    shop: "Modalità spesa", shop_hide_checked: "Nascondi spuntati", shop_keep_awake: "Mantieni lo schermo acceso",
    shop_large: "Righe grandi", shop_tap_row: "Tocca tutta la riga per spuntare", reset: "Ripristina",
    sort: "Ordine", sort_category: "Categoria", sort_alpha: "A–Z", sort_added: "Aggiunta", sort_list: "Per lista",
    packs: "Riconoscimento categorie (pacchetti di parole chiave)", packs_help: "Parole chiave → categoria. Possono essere attivi più pacchetti (es. italiano + il tuo). A parità di parola chiave vince il pacchetto più in alto. Le categorie memorizzate hanno sempre la precedenza.",
    pack_terms: "parole chiave", pack_products: "prodotti", pack_builtin: "integrato", pack_custom: "personale", pack_priority: "posizione",
    pack_up: "Sposta su (precedenza)", pack_download: "Scarica", pack_delete: "Eliminare il pacchetto personale?", pack_bad_json: "Il file non è un JSON valido.",
    pack_upload: "Carica pacchetto …", pack_name_help: "Nome del pacchetto. Lo stesso nome sostituisce un pacchetto personale esistente.", pack_add: "Aggiungi",
    pack_skipped: "saltate (categoria sconosciuta)", pack_template: "Modello",
    card_desc: "Lista della spesa con categorie, suggerimenti, quantità, badge dei negozi (@Esselunga) e permessi.",
    imp_placeholder: "- Latte 2 l @Esselunga\n- [ ] Pane\n- [x] Burro\n3 mele",
    e_preset_pick: "— Scegli un modello (imposta più opzioni) —", e_view_list: "Lista", e_view_tiles: "Riquadri (es. tablet in cucina)", e_view_mini: "Mini riquadro (riepilogo, espandibile)",
    e_sort_category: "Per categoria", e_sort_added: "Ordine di aggiunta", e_sort_list: "Per lista di origine (combinata)",
    e_layout_tabs: "Schede", e_layout_columns: "Affiancate", e_layout_stack: "Una sotto l'altra",
    e_density_compact: "Compatta", e_density_normal: "Normale", e_density_comfortable: "Grande (touch)",
    e_sec_multi: "Più liste in una scheda", e_sec_filter: "Filtri", e_sec_look: "Aspetto", e_sec_header: "Intestazione", e_sec_input: "Inserimento",
    e_sec_list: "Lista", e_sec_done: "Completati", e_sec_shop: "Modalità spesa",
    e_pre_family: "Spesa di famiglia (tutto attivo)", e_pre_kitchen: "Tablet in cucina (riquadri grandi)", e_pre_store: "Al negozio (modalità spesa, senza inserimento)",
    e_pre_readonly: "Solo lettura", e_pre_tile: "Riquadro compatto per la dashboard",
    l_preset: "Modello", l_entity: "Lista", l_entities: "Liste (al posto di «Lista» sopra)", l_layout: "Disposizione", l_title: "Titolo (vuoto = nome della lista)",
    l_view: "Vista", l_sort: "Ordine predefinito", l_advanced: "Mostra opzioni avanzate",
    l_filter_store: "Solo negozio (es. Esselunga; più negozi separati da virgole)", l_filter_person: "Solo persona (es. Anna)", l_filter_tag: "Solo tag (es. bio)",
    l_filter_category: "Solo categorie", l_filter_offers: "Solo offerte", l_filter_tags_new_items: "I nuovi articoli ricevono il tag del filtro (@Esselunga …)",
    l_show_filter_chips: "Barra dei filtri (negozi, persone, offerte)",
    l_density: "Altezza righe", l_font_scale: "Dimensione testo", l_radius: "Raggio degli angoli", l_accent_color: "Colore d'accento (vuoto = tema)",
    l_show_header: "Mostra intestazione", l_show_count: "Numero da fare / risultati", l_show_search: "Ricerca (lente)",
    l_show_sort: "Scelta dell'ordine", l_show_shopping: "Pulsante modalità spesa", l_show_undo: "Annulla (↶)",
    l_show_import: "Pulsante importa", l_show_settings: "Ingranaggio (impostazioni personali)",
    l_show_add: "Campo per aggiungere", l_show_frequent: "«Acquistati spesso»",
    l_drag_drop: "Trascina e rilascia (mouse): sposta in un'altra lista, riordina", l_show_stepper: "Selettore quantità (− +)", l_show_offer: "Offerte dall'app (negozio, prezzo, valida fino al)",
    l_show_tags: "Badge (@negozio, *persona, #tag)", l_show_source: "Origine (lista di origine / persona)", l_show_note: "Note",
    l_show_category_titles: "Titoli delle categorie", l_max_height: "Altezza massima della lista (vuoto = illimitata)",
    l_show_completed: "Mostra completati", l_collapse_completed: "Completati compressi all'inizio", l_start_shopping: "Avvia in modalità spesa",
    hh_preset: "Imposta le opzioni adatte in un colpo – dopo tutto resta modificabile singolarmente.",
    hh_entities: "Più liste: in schede, affiancate o una sotto l'altra. Tutte le opzioni valgono per ogni lista.",
    hh_filter_tags_new_items: "Altrimenti i nuovi articoli sparirebbero subito in una scheda filtrata.",
    hh_show_settings: "Gesto, menu e modalità spesa li imposta ogni utente nell'ingranaggio.",
    hh_show_category_titles: "Disattivato: ordinato per categoria, ma come un'unica lista con l'icona della categoria davanti.",
    hh_start_shopping: "Comodo per un tablet all'ingresso o una dashboard solo per la spesa.",
    shop_auto_store: "Scegli il negozio in base alla zona", shop_auto_store_help: "Quando sei nella zona di un negozio (es. Esselunga), la modalità spesa mostra solo i suoi articoli.",
    shop_untagged: "Mostra anche articoli senza negozio", shop_untagged_help: "Nella modalità spesa per un negozio, anche tutto ciò che non ha @negozio.",
    shop_store: "Negozio", shop_all_stores: "Tutti",
    pack_edit: "Modifica parole chiave", pack_new: "Nuovo pacchetto", pack_new_help: "Pacchetto vuoto, es. per un'altra lingua o termini propri. Viene attivato in cima.", pack_new_placeholder: "es. Nederlands",
    pack_empty: "Ancora nessuna parola chiave – aggiungine sopra.", pack_changed: "modificata", pack_revert: "Annulla modifica", pack_ignore: "Ignora (come Altro)",
    pack_more: "Carica altro", pack_term_placeholder: "Parola chiave (più parole separate da virgole)",
    pack_builtin_edit_help: "Pacchetto integrato: le modifiche finiscono nel pacchetto aggiuntivo «+» e restano dopo gli aggiornamenti.", pack_edit_help: "Pacchetto personale: le modifiche valgono subito.",
    zone: "Zona", zone_new: "Nuova zona", zone_new_help: "Nome della zona. Posizione: posizione attuale di questo dispositivo (altrimenti casa), raggio 100 m – da regolare in Impostazioni → Aree e zone.",
    zone_wait: "Zona creata – compare tra un attimo, poi collegala qui.", zone_here: "posizione di questo dispositivo", zone_home: "posizione di casa – da regolare",
    zone_none: "nessuna zona", zone_manage: "Gestisci zone ↗", store_add: "Negozio con zona", store_add_help: "Nome del negozio, come in @Esselunga. Poi viene creata una zona per esso.",
    stores: "Negozi e zone", stores_help: "Collega i negozi alle zone di Home Assistant. In modalità spesa vedrai automaticamente solo gli articoli del negozio in cui ti trovi.",
    notes: "Note dell'app", notes_help: "L'app HA SmartLists salva le note in una propria lista to-do. Non sono liste della spesa e perciò sono nascoste per impostazione predefinita.",
    notes_show: "Mostra in SmartLists", notes_show_help: "Come sezione 📝 separata nella pagina – non in Assist, azioni o liste combinate.",
    notes_scope: "Chi vede le note", notes_scope_owner: "solo il proprio account", notes_scope_household: "tutti gli utenti",
    notes_lists: "Liste di note e proprietari", notes_none: "Nessuna lista di note dell'app trovata.", notes_no_owner: "sconosciuto (solo admin)",
    p_order: "Cambia ordine", p_order_hint: "◀ ▶ sposta una lista. Col mouse: trascina un chip su un altro. L'ordine vale anche per le colonne.",
    p_left: "A sinistra", p_right: "A destra",
    look: "Badge e colori", look_help: "Aspetto dei badge per tutti gli utenti. Colori e nomi dei negozi valgono anche nell'app. Vuoto o ↺ = predefinito.",
    look_style: "Stile", look_filled: "pieno", look_soft: "tenue", look_outline: "contorno", look_text: "solo testo",
    look_color: "Colore di sfondo", look_text: "Colore del testo", look_icon: "Simbolo davanti", look_label: "Nome visualizzato", look_kinds: "Per tipo", look_values: "Singoli badge",
    look_search: "Cerca badge … (es. esselunga)", look_more: "Trova gli altri con la ricerca.", look_add: "Colora un badge",
    look_add_help: "Con il suo carattere, es. @Kaufland, *Max o #vegano – anche se non è ancora stato usato.",
    zone_count: "zone", zone_unlink: "Scollega zona", zone_add: "Zona",
    app_list: "lista combinata dell'app", app_list_connected: "collegata", app_list_connect: "Collega",
    zone_name: "Nome della zona, es. Esselunga Centro", zone_radius: "Raggio", zone_coords: "Coordinate o link della mappa", zone_coords_placeholder: "45.4642, 9.1900 o un link Google/Apple/OSM", zone_coords_bad: "Nessuna coordinata riconosciuta.", zone_locating: "Rilevamento posizione …", zone_no_location: "Posizione non disponibile – scegli un'altra opzione.", zone_where: "Dove?", zone_here_opt: "Posizione attuale (questo dispositivo)", zone_home_opt: "Casa", zone_map_opt: "Scegli sulla mappa", zone_after: "Regolala quando vuoi in Impostazioni → Aree e zone.",
    note_new: "Nuova nota", note_edit: "Modifica nota", note_view: "Lista / griglia", note_empty: "Ancora nessuna nota.", note_locked: "Nota cifrata", note_locked_help: "Cifrata con la password delle note dell'app – leggibile solo nell'app.", note_title: "Titolo", note_body: "Testo",
    p_settings_hint: "",
    list_settings_hint: "Comandi e impostazioni globali: ⚙ in alto a destra nella pagina.",
    settings_list: "Impostazioni di questa lista", settings_global: "Impostazioni generali", list_settings_hint_card: "Comandi e impostazioni globali: l'icona dei cursori nell'intestazione.",
    tpl: "Modelli",
    scan: "Scansiona codice a barre",
    price_sum: "Totale",
    soft_checked: "segnato dall'esterno (link)",
    soft_checked_help: "Qualcuno l'ha segnato come fatto tramite un link condiviso – l'articolo resta aperto finché non lo spunti tu.",
    price: "Prezzo",
    aisle: "Ordine",
    price_paid: "ultimo pagato",
    price_manual: "prezzo personale",
    price_last: "l'ultima volta",
    tpl_servings: "Porzioni",
    tpl_new: "Nuovo modello",
    tpl_from_list: "Lista come modello",
    tpl_increase: "già nella lista → la quantità viene aumentata",
    tpl_servings_help: "Le quantità vengono ricalcolate",
    tpl_increased: "quantità aumentata",
    tpl_name: "Nome, es. Pancake",
    tpl_items_placeholder: "Farina 250 g\nLatte 0,5 l\nUova 3",
    tpl_items: "Articoli",
    tpl_items_help: "Un articolo per riga, con quantità e tag come nella lista. Porzioni (facoltativo) = per quante persone valgono le quantità.",
    tpl_edit: "Modifica modello",
    scan_help: "Tieni il codice a barre sulla linea rossa – oppure digita il numero sotto.",
    scan_code: "Numero del codice a barre",
    scan_unknown: "Prodotto non trovato – digita tu il nome.",
    scan_find: "Cerca",
    scan_no_camera: "La scansione con fotocamera qui non è supportata (es. Safari su iPhone, Firefox) – digita il numero.",
    aisle_down: "Sposta giù",
    aisle_help: "Così ordina la modalità spesa quando è selezionato questo negozio. Trascina la maniglia ⠿ o usa le frecce.",
    aisle_all_branches: "tutte le filiali",
    aisle_reset: "Predefinito",
    notify_to: "Invia a",
    notify_no_phone: "Nessun dispositivo con l'app Companion trovato.",
    notify_added: "Per nuovi articoli",
    notify_checked: "Quando qualcosa viene spuntato",
    notify_lists: "Liste",
    notify_all_lists: "tutte quelle che vedo",
    notify_from: "Da chi",
    notify_quiet: "Ore di silenzio",
    notify_quiet_none: "nessuna",
    notify: "Notifiche",
    notify_help: "Quando qualcun altro modifica qualcosa (le tue modifiche solo se attivato sotto). Più modifiche entro un minuto arrivano come un unico messaggio.",
    stats_90: "90 giorni",
    stats_year: "Anno",
    stats_all: "tutto",
    stats_top: "Acquistati più spesso",
    stats_every: "ogni",
    stats_none: "Cronologia ancora insufficiente.",
    stats_overdue: "Non acquistato da tempo",
    stats_add: "Aggiungi alla lista",
    stats_usually: "di solito ogni",
    stats_since: "da",
    stats_shares: "Per categoria · negozio",
    stats: "Statistiche",
    stats_help: "Dalla cronologia esistente – non vengono raccolti dati aggiuntivi.",
    exp_week: "Settimana",
    exp_month: "Mese",
    exp_year: "Anno",
    exp_none: "Ancora nessuna spesa – viene registrata quando spunti articoli con un prezzo.",
    exp_no_store: "senza negozio",
    exp: "Spese",
    exp_help: "Registrate alla spunta (prezzo × quantità). I prezzi vengono dalle offerte, a mano (es. «Latte 2 l 1,19€» o ✏️) o dall'ultimo acquisto.",
    share_view: "solo visualizzazione",
    share_soft: "spunta «soft» (resta aperto)",
    share_check: "spunta davvero",
    share_mode: "Consentito",
    share_mode_help: "«soft»: vedi cosa è stato segnato – l'articolo resta aperto nella tua lista. Ciò che viene aggiunto tramite il link è segnato con 🔗 nella tua lista.",
    share_add: "Può aggiungere",
    share_valid: "Validità",
    share_2h: "2 ore",
    share_1d: "1 giorno",
    share_7d: "7 giorni",
    share_30d: "30 giorni",
    share_forever: "fino alla revoca",
    share_create: "Crea link",
    soft_checked_by: "segnato da {name} (link)", link_added_by: "aggiunto da {name} tramite link",
    x_stats: "Statistiche e spese", x_stats_help: "Acquistati più spesso, non acquistati da tempo, quote per categoria e negozio, spese mensili (📊 nella pagina, sensore «Spese questo mese»). Disattivato: nascosto, il conteggio continua in background.", w_x_stats_sub: "Cosa comprate spesso e quanto spendete",
    share_soft_add: "spuntare «soft» e aggiungere", link_added: "aggiunto tramite link", link_added_help: "Qualcuno senza account l'ha aggiunto tramite un link condiviso.",
    link_shared: "condivisa sul web", link_shared_help: "Raggiungibile tramite {n} link per persone senza account. Tocca per vedere o revocare i link.",
    pub_cf_arch: "{path} è per un altro processore ({found}). Questo sistema richiede {file} – elimina o sostituisci il vecchio file.", pub_cf_kind_windows: "{path} è la versione per Windows. Home Assistant richiede {file}.", pub_cf_kind_mac: "{path} è la versione per macOS. Home Assistant richiede {file}.", pub_cf_kind_archive: "{path} è un archivio (.tgz/.zip/.deb), non il programma. Scarica il file {file} senza estensione.", pub_cf_kind_html: "{path} è una pagina web salvata, non il programma. Scarica il file {file} direttamente dalla pagina delle release.", pub_cf_kind_not_executable: "{path} non è eseguibile (permessi). Rimetti il file o controlla i permessi.", pub_cf_kind_unknown: "{path} non è adatto a questo sistema. Serve {file}.",
    shared_change_hint: "Per modificare: ingranaggio di questa lista → Condivisione.",
    l_plain: "Lista semplice", l_plain_help: "Senza categorie, suggerimenti, parole memorizzate né prezzi. SmartLists non ricorda nulla di questa lista – i suoi articoli non compaiono in altre (ad es. fai da te).",
    l_categories: "Categorie automatiche", l_categories_help: "Disattivato: nessuna suddivisione in categorie – né nella lista né mentre scrivi. Ordina ad es. per aggiunta.", l_suggest: "Acquistati spesso e suggerimenti", l_suggest_list: "solo da questa lista", l_suggest_sources: "dalle sue liste di origine", l_suggest_all: "da tutte le liste", l_suggest_help: "Ciò che è stato comprato in un'altra lista non compare qui. Le voci più vecchie (prima della 3.9.4) valgono ancora ovunque.",
    zone_dup_title: "La zona esiste già", zone_dup_text: "Esiste già una zona «{name}». Puoi mantenere il nome (ci saranno due zone con lo stesso nome, ad es. due filiali) o rinominare la nuova zona, ad es. «{name} Centro».", zone_dup_keep: "Mantieni nome", zone_dup_rename: "Rinomina", zone_dup_rename_help: "Nome della nuova zona, ad es. con quartiere o via della filiale.", app_title: "Salva come app nella schermata Home", app_lead: "Un'icona sul telefono che apre direttamente questa lista – senza app aggiuntive. A schermo intero come un'app.", app_list: "Lista", app_shop: "Apri direttamente in modalità spesa", app_install: "Installa", app_close: "Chiudi", app_ios: "In Safari tocca Condividi (□↑) in basso\nScegli Aggiungi alla schermata Home\nTocca Aggiungi – fatto", app_android: "In Chrome tocca ⋮ in alto a destra\nScegli Aggiungi a schermata Home o Installa app\nConferma Installa – fatto", app_other: "Nel menu del browser scegli Installa app o Aggiungi a schermata Home\nSul telefono: apri questa pagina in Chrome (Android) o Safari (iPhone)",
    x_title: "Extra", x_help: "Funzioni opzionali. Non servono per iniziare – attivale qui quando vuoi.", x_notes: "Note", x_notes_help: "Liste di note (ad es. dall'app HA SmartLists) come sezione 📝 a parte. Chi le vede si imposta in Dispositivi e note.", x_mealplan: "Piano settimanale", x_mealplan_help: "Piatti per giorno, ingredienti sulla lista, calendario «Menu». Disattivato: scheda, voce di menu e calendario spariscono, i piatti restano salvati.", w_x_optional: "Opzionale – anche dopo in Impostazioni → Extra", w_x_notes_sub: "Liste di note come sezione a parte, ad es. dall'app", w_x_mealplan_sub: "Pianificare i piatti per giorno e mettere gli ingredienti sulla lista", share_leak: "Il link contiene l'indirizzo del tuo Home Assistant. Per non rivelarlo: Quick Tunnel o un tuo proxy (Impostazioni → Condivisione e permessi → Indirizzo pubblico).", share_old_address: "l'indirizzo è cambiato, il link non funziona più", pub_title: "Indirizzo pubblico dei link", pub_help: "Da dove si raggiungono i link condivisi. Con un tunnel o un tuo proxy nessuno scopre l'indirizzo del tuo Home Assistant.", pub_mode: "Link tramite", pub_ha: "Indirizzo di Home Assistant", pub_tunnel: "Cloudflare Quick Tunnel", pub_proxy: "Proxy o tunnel proprio", pub_ha_help: "Come prima: il link punta all'indirizzo esterno di Home Assistant – chi lo riceve conosce quell'indirizzo.", pub_tunnel_help: "SmartLists avvia cloudflared e ottiene un indirizzo casuale (…trycloudflare.com). Il tunnel porta solo a un piccolo server separato che serve esclusivamente le liste condivise – non a Home Assistant. Nessun account né port forwarding.", pub_proxy_help: "Inoltra il tuo indirizzo a http://<IP di Home Assistant>:{port} (Caddy, nginx, Cloudflare Tunnel con il tuo dominio …). Lì gira solo il server di condivisione di SmartLists, non Home Assistant.", pub_url: "Indirizzo pubblico", pub_port: "Porta", pub_port_change: "cambia (facoltativo)", pub_port_help: "Porta del server di condivisione (predefinita 8126).", pub_starting: "Il tunnel si avvia …", pub_server_ok: "Il server di condivisione è attivo sulla porta {port}.", pub_not_ready: "non ancora pronto", pub_tunnel_note: "L'indirizzo del tunnel cambia a ogni riavvio di Home Assistant – i link creati prima non funzionano più. Per link duraturi: un tuo proxy o tunnel.", pub_cf_missing: "cloudflared non trovato. SmartLists non lo scarica da solo.", pub_cf_not_exec: "Trovato {path}, ma non è eseguibile o è per un altro sistema.", pub_cf_download: "Scarica cloudflared – per questo sistema: {file}", pub_cf_where: "Metti il file {file} in una di queste cartelle (non serve rinominarlo; va bene anche una sottocartella «cloudflared»): {paths}. Poi Salva.", pub_cf_or_proxy: "Oppure usa un tuo proxy.", pub_err_cloudflared_missing: "Manca cloudflared.", pub_err_cloudflared_not_executable: "cloudflared non è eseguibile.", pub_err_port_in_use: "La porta {port} è occupata – scegline un'altra.", pub_err_cloudflared_exit: "cloudflared si è fermato (codice {code}) – riparte a breve.", pub_err_cloudflared_failed: "Impossibile avviare cloudflared: {code}",
    share_active: "Link attivi",
    share_revoke: "Revoca",
    share_expired: "scaduto",
    share_until: "fino al",
    share_opened: "aperto",
    share_once: "Il link viene mostrato solo ora – non viene salvato. In seguito: revocalo e creane uno nuovo.",
    share_local: "Questo è un indirizzo della tua rete domestica – dall'esterno il link funziona solo con un URL esterno (Impostazioni → Sistema → Rete).",
    share_copied: "copiato",
    share_copy: "Copia link",
    share_send: "Condividi …",
    share: "Condividi tramite link",
    share_help: "Per persone senza account Home Assistant. Vedono solo questa lista (senza note) – nient'altro di Home Assistant. Predefinito: solo visualizzazione.",
    barcode_lookup: "Cerca codici a barre online",
    barcode_lookup_help: "Open Food Facts, viene inviato solo il numero. Disattivato: solo codici già noti.",
    tab_stats: "Statistiche",
    l_show_templates: "Pulsante modelli (📋)",
    l_show_scan: "Pulsante codice a barre",
    l_show_prices: "Prezzi e totale",
    p_group_combined: "Liste combinate", p_group_lists: "Liste", p_group_notes: "Note", app_list_pending: "Lista combinata dall'app – non ancora collegata in Home Assistant", app_list_admin: "Un admin di Home Assistant può collegarla (tocca qui o in Dispositivi collegati).", share_combined: "Attenzione: una lista combinata condivide gli articoli di tutte le sue liste di origine.",
    aisle_sort: "Ordina", aisle_drag: "Trascina per spostare", emoji_pick: "Scegli simbolo", emoji_free: "personale", emoji_food: "Cibo", emoji_occasion: "Occasioni e casa", emoji_people: "Persone", emoji_symbols: "Simboli", emoji_none: "nessuno",
    trip_done: "Spesa finita", trip_help: "Il totale «nel carrello» riparte da 0. Le spese restano registrate. Per le liste che riusi puoi riaprire subito tutto ciò che è spuntato.", trip_reopen: "Riapri tutto", trip_finish: "Termina", stats_forget: "Elimina dalla cronologia", stats_forget_help: "viene rimosso da statistiche, suggerimenti e ritmo d'acquisto (es. aggiunto per errore).", exp_entries: "Movimenti", notes_create: "Crea lista di note", notes_create_help: "Nome della lista di note. È tua; creata come todo.ha_smartlists_notes_<nome>.",
    p_lists_all: "Tutte le liste", p_lists_less: "Meno",
    scan_native_help: "Inquadra il codice a barre sulla confezione.", scan_type: "Digita il numero", scan_not_product: "Non è un codice a barre di prodotto (EAN).",
    scan_target: "Lista di destinazione", scan_target_this: "questa lista (della scheda)", scan_mode: "Articoli scansionati", scan_mode_input: "nel campo di inserimento (controlla, poi aggiungi)", scan_mode_add: "aggiungi subito", barcode_providers: "Servizi di ricerca", barcode_providers_help: "Tocca per attivare/disattivare, il numero è l'ordine – vale il primo risultato. SmartLists ricorda i codici trovati.", barcode_custom: "servizio personale", barcode_custom_url: "URL con {code}", barcode_custom_field: "Campo con il nome",
    a_applies: "Vale per", a_menu: "Menu dell'articolo", a_shop: "Spesa e scansione", a_me_sub: "Vale solo per te.", a_look: "Badge e colori", a_global_sub: "Vale per tutti gli utenti, anche nell'app.", a_cats: "Categorie", a_devices: "Dispositivi e note", a_rights: "Condivisione e permessi", a_rights_sub: "Cosa possono fare gli utenti senza diritti di admin.", a_data: "Voce, backup, predefiniti", a_stats: "Statistiche e spese", a_search: "Cerca impostazione", admin_only_short: "solo admin", g_stats: "Analisi", ls_done: "Fatto", rights_who: "Possono creare link", rights_share_who: "Possono creare link", rights_who_admins: "solo admin", rights_who_owners: "admin e proprietario della lista", rights_who_editors: "tutti quelli che possono modificare la lista", rights_who_nobody: "nessuno (condivisione disattivata)", rights_max: "Un link permette al massimo", rights_share_max: "Un link permette al massimo", rights_max_on: "spuntare e aggiungere", rights_limits_help: "I limiti valgono per gli utenti senza diritti di admin.", rights_max_hours: "Validità massima", rights_share_max_hours: "Validità massima", rights_all_links: "Mostra i link attivi di tutte le liste", rights_no_links: "Nessun link attivo.", rights_share_help: "I link danno accesso a una sola lista a chi non ha un account.", rights_other: "Consentito senza diritti di admin", rights_create_lists: "Creare liste proprie", rights_templates: "Creare e modificare modelli", rights_categories: "Assegnare categorie a mano", rights_prices: "Inserire prezzi", ls_list: "Lista", ls_list_help: "Vale per questa lista su tutti i dispositivi, a meno che una scheda o un dispositivo non stabilisca altro.", ls_name: "Nome", ls_sort: "Ordinata per", ls_default: "predefinito della scheda",
    w_title: "Configura SmartLists", w_time: "Ci vogliono circa due minuti.", w_step: "Passo {n} di {m}", w_s_lists: "Liste", w_s_stores: "Negozi", w_s_naming: "Notazione", w_s_lang: "Lingua", w_s_people: "Persone e app", w_s_extras: "Extra", w_s_done: "Fatto", w_lists_h: "Da cosa vuoi iniziare?", w_lists_found: "SmartLists ha trovato {n} liste di cose da fare in Home Assistant.", w_lists_none: "In Home Assistant non c’è ancora nessuna lista di cose da fare.", w_use: "Usa le liste esistenti", w_use_sub: "Restano come sono. SmartLists le mostra con categorie, quantità e negozi.", w_combine: "Uniscile in una lista combinata", w_combine_sub: "Ognuno mantiene la propria lista, quella combinata le mostra tutte.", w_combine_name: "Nome della lista combinata", w_combine_default: "Spesa", w_new: "Crea una nuova lista", w_new_sub: "Solo in SmartLists; ne sei il proprietario e puoi condividerla.", w_new_name: "Nome della lista", w_open: "aperte", w_stores_h: "Dove fai la spesa?", w_stores_lead: "I negozi vengono proposti mentre scrivi, e la modalità spesa mostra solo ciò che ti serve in quel negozio.", w_store_other: "Altro negozio", w_store_add: "Aggiungi", w_chosen: "Selezionati: {list}", w_chosen_none: "Nessun negozio ancora selezionato", w_becomes: "diventa", w_stores_later: "Puoi aggiungere la posizione dei negozi in seguito. Così SmartLists sceglie il negozio da solo quando ci sei.", w_naming_h: "Come contrassegni negozio, persona e tag?", w_naming_lead: "Un carattere subito prima di una parola la trasforma in un badge. Resta nel testo dell’articolo, quindi lo vedono anche Home Assistant e l’app.", w_eg_store: "per esempio @REWE", w_eg_person: "per esempio *Anna", w_eg_tag: "per esempio #bio", w_naming_bad: "“{c}” non è consentito.", w_naming_dup: "Usa ogni carattere una sola volta.", w_naming_hint: "Sono consentiti {chars}. Lascia vuoto per disattivare un tipo. L’app HA SmartLists adotta questi caratteri durante l’associazione.", w_eg_item: "Latte", w_eg_qty: "2 l", w_lang_h: "In quale lingua scrivi gli articoli?", w_lang_lead: "Così SmartLists riconosce la categoria, per esempio il latte nei prodotti refrigerati. Si possono combinare più lingue.", w_words: "parole", w_people_h: "Chi partecipa?", w_people_lead: "Permessi per la nuova lista. Tutti vedono SmartLists nella propria barra laterale.", w_people_combined: "Le liste combinate sono visibili a tutte le persone che vedono le liste di origine. I permessi per persona esistono per le liste SmartLists proprie.", w_you: "tu, admin", w_all: "può fare tutto", w_app: "App HA SmartLists su un dispositivo", w_app_sub: "Nell’app, tocca “Associa” in Impostazioni → Connessione. I dispositivi connessi compaiono poi in Globale → Dispositivi e note.", w_extras_h: "Cos’altro deve fare SmartLists?", w_extras_lead: "Tutto si può attivare e disattivare in seguito.", w_x_notify: "Avvisami quando qualcuno aggiunge qualcosa", w_x_notify_sub: "Sul tuo dispositivo con l’app Home Assistant", w_x_notify_none: "Nessun dispositivo con l’app Home Assistant trovato", w_x_voice: "Aggiungi articoli con la voce", w_x_voice_sub: "“Aggiungi il latte alla lista della spesa” con Assist", w_x_prices: "Prezzi e spese", w_x_prices_sub: "Totale della lista e riepilogo mensile", w_x_barcode: "Cerca i codici a barre online", w_x_barcode_sub: "Su Open Food Facts, viene inviato solo il numero", w_x_share: "I proprietari possono condividere le liste tramite link", w_x_share_sub: "Per le persone senza account Home Assistant, per esempio vicini o ospiti", w_done_h: "Tutto pronto", w_done_lead: "Ecco cosa verrà configurato. Puoi cambiare tutto in qualsiasi momento nelle impostazioni.", w_sum_combined: "Lista combinata “{name}” da {lists}", w_sum_new: "Nuova lista “{name}”", w_sum_lists: "Liste: {lists}", w_sum_stores: "Negozi: {list}", w_sum_naming: "Notazione: {list}", w_sum_lang: "Categorie: {list}", w_sum_people: "Condivisione: {list}", w_sum_extras: "Attivo: {list}", w_off: "disattivato", w_tip: "Suggerimento: inizia semplicemente a scrivere nel campo di inserimento, per esempio “2 kg mele @REWE”.", w_back: "Indietro", w_next: "Avanti", w_skip: "Salta", w_finish: "Configura", w_start: "Iniziamo", w_later: "Modificabile in seguito nelle impostazioni", w_close: "Chiudi la configurazione", w_restart: "Esegui di nuovo la configurazione", w_restart_sub: "L’assistente del primo avvio, ad es. per combinare altre liste.",
    more: "Altro", ih_title: "Cronologia", ih_none: "Ancora nessuna voce.", ih_add: "aggiunto", ih_check: "spuntato", ih_uncheck: "riaperto", ih_rename: "rinominato", ih_remove: "eliminato", ih_link: "tramite link condiviso", ih_auto: "automazione", mp_title: "Piano settimanale", mp_add: "Piatto", mp_help: "I piatti sono modelli. «Ingredienti nella lista» mette in lista tutto quello di questa settimana; gli articoli uguali vengono sommati. Il piano compare anche come calendario in Home Assistant.", mp_no_tpl: "Crea prima un modello (⋯ → Modelli).", mp_prev: "Settimana precedente", mp_next: "Settimana successiva", mp_mealie: "Prendi da Mealie", mp_recipes: "ricette importate", mp_to_list: "Ingredienti nella lista", db_title: "Dashboard spesa", db_help: "Crea una vista nella barra laterale: tutte le liste, piano settimanale e statistiche. Poi si modifica come ogni dashboard.", db_create: "Crea dashboard", db_open: "Apri dashboard", db_lists: "Liste", db_plan: "Piano settimanale", db_stats: "Statistiche",
    rs_title: "Ricomincia da zero", rs_help: "Scegli cosa ripristinare. Poi parte l'assistente. Le liste di attività e i loro articoli non vengono mai eliminati; le impostazioni personali restano.", rs_settings: "Ripristina le impostazioni", rs_settings_sub: "Convenzione dei nomi, badge e colori, negozi e zone, ordine delle corsie, permessi, voce e automazioni, visualizzazione delle liste, pacchetti di parole chiave.", rs_data: "Elimina i dati appresi", rs_data_sub: "Categorie memorizzate, cronologia e statistiche, prezzi e spese, modelli e piano settimanale.", rs_links: "Revoca tutti i link di condivisione", rs_links_sub: "I link condivisi smettono di funzionare.", rs_combined: "Rimuovi le liste combinate", rs_combined_sub: "Solo la vista combinata – le liste di origine restano invariate.", rs_go: "Ripristina e avvia l'assistente",
    mp_saved: "Piano salvato", mp_ask_add: "Mettere ora in lista gli ingredienti di questa settimana?", mp_not_now: "No, salva soltanto",
    notify_own: "Anche per le mie modifiche", notify_own_sub: "ad es. quando aggiungi qualcosa dal PC e lo vuoi sul dispositivo – o per provare.", notify_test: "Invia messaggio di prova", notify_test_sent: "Messaggio di prova inviato – se non arriva, controlla l'app Companion e il permesso per le notifiche.",
    m_select: "Seleziona", sel_mode: "Seleziona più elementi", sel_count: "{n} selezionati", sel_all: "Tutti", sel_none: "Nessuno", sel_check: "Spunta", sel_checked: "spuntati", sel_reopened: "riaperti", sel_delete_q: "Eliminare {n} articoli?",
    mp_target: "Ingredienti in:",
    p_tab_lists: "Liste",
    nt_add: "Aggiungi destinazione", nt_none: "Nessuna destinazione – non verranno inviati messaggi.", nt_service: "Servizio di notifica", nt_entity: "Entità di notifica", nt_custom: "Servizio personalizzato", nt_no_services: "Nessun servizio notify trovato.", nt_no_entities: "Nessuna entità notify trovata.", nt_custom_help: "Qualsiasi servizio (solo admin), ad es. telegram_bot.send_message o script.mio_messaggio. Dati in JSON; {title} e {message} vengono sostituiti – senza segnaposto vengono aggiunti title e message.", nt_help: "Sono possibili più destinazioni: app Companion, Telegram, e-mail, Signal, altoparlanti … – tutto ciò che Home Assistant conosce come notifica.", nt_bad_service: "Indica il servizio come dominio.servizio.",
    mg_title: "Trasferisci liste", mg_sub: "Trasferisci liste di attività esistenti (lista della spesa, Local To-do …) in liste SmartLists proprie – con articoli, note e spunte.", mg_help: "Le nuove liste appartengono a te e si possono condividere in seguito. Scegli una o più liste.", mg_lists: "Liste", mg_none: "Nessuna lista adatta trovata.", mg_how: "Più liste", mg_each: "Una propria per ciascuna", mg_each_sub: "Stesso nome di prima.", mg_one: "Tutte in una lista", mg_one_sub: "Tutti gli articoli insieme in una nuova lista.", mg_name: "Nome della nuova lista", mg_tag: "Segna l'origine come", mg_tag_none: "non segnare", mg_old: "Vecchia lista", mg_used: "Usata in liste combinate: {lists}. Aggiungi lì la nuova lista prima di eliminare la vecchia.", mg_pick: "Scegli almeno una lista.", mg_go: "Trasferisci", mg_items: "articoli",
    mg_pf_local: "To-do locale", mg_pf_shopping: "Lista della spesa", mg_pf_other: "Altro",
    mg_keep_info: "La vecchia lista resta invariata. Controlla la nuova lista e poi elimina tu la vecchia.", mg_done_hint: "Le vecchie liste esistono ancora. Se nella nuova lista è tutto a posto, eliminale tu (Impostazioni → Dispositivi e servizi, ad es. Local To-do o l'integrazione relativa):", mg_done_combined: "Almeno una vecchia lista è fonte di una lista combinata – aggiungi prima lì la nuova lista.",
    mg_pf_notes: "Note", mg_as: "Trasferisci come", mg_as_list: "Lista", mg_as_list_sub: "Lista SmartLists propria con categorie, quantità e funzioni per la spesa.", mg_as_notes: "Note", mg_as_notes_sub: "Nuova lista di note (visibile solo a te), note con titolo e testo – quelle cifrate restano invariate.",
    owner_everyone: "— tutti (nessuna restrizione)", owner_combined_help: "Con un proprietario, solo lui, gli admin e le persone condivise vedono la lista.",
    lb_title: "Badge di origine", lb_help: "Mostra su ogni articolo da quale lista proviene.", lb_show: "Il badge mostra", lb_list: "Nome della lista", lb_owner: "Proprietario della lista di origine", lb_both: "Proprietario e nome della lista", lb_show_help: "Le liste senza proprietario (Local To-do …) mostrano sempre il nome.", lb_only: "Solo da queste liste", lb_all: "tutte",
    lb_colors: "Colore per lista di origine (predefinito: automatico, uno diverso per lista)",
  },
  pl: {
    add_placeholder: "np. 2 kg jabłek {store}", add_ph_store: "Sklep", note: "Notatka", save: "Zapisz", cancel: "Anuluj",
    done: "Zrobione", clear: "Usuń zrobione", own: "Własna lista", combined: "Połączona", foreign: "Obca",
    empty: "Nic do kupienia 🎉", no_add: "Dodawanie jest wyłączone dla tej listy.", open: "do kupienia",
    confirm_delete: "Na pewno usunąć produkt?", confirm_clear: "Usunąć wszystkie zrobione produkty?",
    error: "Błąd", loading: "Ładowanie …", readonly: "Tylko podgląd", delete: "Usuń", edit: "Edytuj",
    frequent: "Często kupowane", src_manual: "zapamiętana", src_learned: "nauczona", src_pack: "automatyczna", src_fallback: "nieznana",
    unit_hint: "zwykła jednostka", category: "Kategoria", settings: "Ustawienia", naming: "Konwencja nazw",
    naming_help: "Znak przed słowem zamienia je w plakietkę. Dotyczy wszystkich list i urządzeń.",
    kind_store: "Sklep", kind_person: "Osoba", kind_tag: "Tag", add_rule: "Dodaj regułę", example: "Przykład",
    learned: "Zapamiętane kategorie", learned_help: "Powstają, gdy wybierasz kategorię ręcznie.", forget: "Zapomnij",
    none_learned: "Nic jeszcze nie zapamiętano.", saved: "Zapisano", admin_only: "Tylko administratorzy mogą to zmienić.",
    in_list: "jest już na liście",
    tab_me: "Dla mnie", tab_house: "Globalne", tab_list: "Ta lista", ui_me_help: "Dotyczy tylko ciebie. Różnice względem ustawienia globalnego są oznaczone •.",
    ui_house: "Sterowanie – domyślne dla wszystkich", reset_default: "Przywróć domyślne", about_list: "O tej liście", type: "Typ", entity: "Encja", sources: "Źródła",
    type_combined: "Lista połączona", type_own: "Własna lista SmartLists", type_list: "Lista zadań Home Assistant", char: "Znak", kind: "Rodzaj",
    no_hits_short: "Nic nie znaleziono.", by_hand: "ręcznie", search_learned: "Szukaj … (np. mleko)",
    automation: "Głos i automatyzacje", automation_help: "Assist i produkty do ponownego zakupu. Blueprinty „Jestem w sklepie” i przypomnienie o sklepie: zobacz wiki.",
    auto_voice_default_list: "Domyślna lista dla Assist", auto_voice_help: "Używana, gdy zdanie nie wymienia listy.",
    auto_auto_due_list: "Automatycznie dodawaj produkty do ponownego zakupu do", auto_due_help: "Co godzinę, według waszego rytmu zakupów. „—” = wyłączone.",
    install_sentences: "Zainstaluj zdania Assist", sentences_installed: "zainstalowane",
    devices: "Połączone urządzenia", devices_help: "Urządzenia z aplikacją HA SmartLists. ⚠️ = brak synchronizacji od ponad 7 dni. Aby odebrać dostęp, usuń token w profilu.",
    no_devices: "Nie połączono jeszcze żadnego urządzenia.", remove_device: "Usuń z listy", last_seen: "ostatnio",
    role_all: "wszystkie prawa", admin_always: "Admin – zawsze może wszystko", shop_large_help: "Łatwiej trafić kciukiem. Wyłączone: rozmiar jak w zwykłym widoku.",
    new_list_help: "Jesteś właścicielem i możesz potem udostępnić ją innym.", new_list_placeholder: "np. Drogeria", create: "Utwórz",
    p_columns: "Kilka list obok siebie", p_wide: "Szeroki widok", p_settings: "Ustawienia", p_back: "Wróć do list",
    p_hint: "Dotknij list, aby pokazać je obok siebie (więcej niż 3 przechodzą do kolejnego rzędu). Przeciągnij produkt myszą na inną listę, aby go przenieść (Ctrl = kopiuj).",
    p_empty: "Nie znaleziono list. Utwórz ją w Ustawienia → Urządzenia i usługi → SmartLists – albo przyciskiem + u góry.",
    owner: "właściciel", shared: "udostępniona", private: "prywatna", admin: "admin", sharing: "Udostępnianie",
    sharing_help: "Kto może widzieć i zmieniać tę listę. Admini zawsze mogą wszystko. Widok zadań HA pokazuje każdą listę wszystkim – jest ukryta tylko w SmartLists (karta, strona, aplikacja).",
    role_none: "brak dostępu", role_viewer: "podgląd", role_checker: "odhaczanie", role_editor: "edycja", role_owner: "właściciel",
    no_users: "Brak innych użytkowników w Home Assistant.", delete_list: "Usuń listę", confirm_delete_list: "Usunąć tę listę ze wszystkimi produktami?",
    new_list: "Nowa lista", new_list_prompt: "Nazwa nowej listy:",
    due_every: "do kupienia – kupujecie mniej więcej co", days: "dni", backup: "Kopia i przeniesienie",
    backup_help: "Zapamiętane kategorie, historia, konwencja nazw i sterowanie w pliku – np. dla drugiej instancji HA. Import dodaje, niczego nie usuwając.",
    export: "Eksportuj", import: "Importuj …",
    mini_open: "Otwórz listę", mini_close: "Zwiń", card_version: "karta", stale_card: "Ta karta jest nieaktualna – odśwież stronę (Ctrl+F5) lub wyczyść pamięć podręczną frontendu w aplikacji.", offer: "Promocja", offer_until: "do", offer_expired: "wygasła",
    qty_less: "Zmniejsz ilość", qty_more: "Zwiększ ilość", qty_changed: "zmieniono ilość",
    search: "Szukaj", search_placeholder: "Szukaj na liście …", hits: "wyników", no_hits: "Nic nie znaleziono dla", add_this: "dodaj",
    imp: "Importuj", imp_ha: "Z Home Assistant", imp_text: "Jako tekst", imp_source: "Lista",
    imp_done: "Uwzględnij zrobione", imp_skip_dupes: "Pomiń już istniejące", imp_go: "Importuj",
    imp_text_help: "Jeden produkt w wierszu. Rozpoznawane są wypunktowania, [ ] / [x] i numery, a także ilości i tagi.",
    imp_preview: "Podgląd", imp_none: "Nic do zaimportowania.", imp_count: "produktów", imported: "zaimportowano", imp_dupe: "istnieje",
    imp_no_lists: "Nie znaleziono innych list w Home Assistant.",
    shop_on: "Włącz tryb zakupów", shop_off: "Zakończ tryb zakupów", in_cart: "w koszyku", undo: "Cofnij", checked_off: "odhaczono", unchecked: "przywrócono",
    deleted: "usunięto", removed: "usunięto zrobione", added: "dodano", changed: "zmieniono",
    m_rename: "Zmień nazwę / edytuj", m_move: "Przenieś do …", m_copy: "Kopiuj do …", m_category: "Zmień kategorię", m_delete: "Usuń",
    moved: "przeniesiono do", copied: "skopiowano do", no_targets: "Brak innej listy, do której możesz pisać.",
    ui: "Sterowanie", ui_help: "Każdy użytkownik ustawia to dla siebie. Opcjonalnie inaczej na każdym urządzeniu.",
    scope_household: "Domyślne dla wszystkich", scope_user: "Dla mnie na wszystkich urządzeniach", scope_device: "Tylko na tym urządzeniu",
    scope_help_household: "Dotyczy każdego, kto nie ustawił nic własnego.",
    scope_help_user: "Zapisywane są tylko twoje różnice względem domyślnych (oznaczone •). „Resetuj” = powrót do domyślnych.",
    scope_help_device: "Dotyczy tylko tej przeglądarki lub tego urządzenia. „Resetuj” = powrót do twojego ustawienia.",
    press_gesture: "Gest menu produktu", g_long: "Długie naciśnięcie", g_double: "Dwuklik", g_right: "Prawy przycisk", g_off: "Wyłączony",
    press_target: "Gdzie działa gest", t_row: "Cały wiersz", t_name: "Tylko na nazwie",
    press_result: "Co robi gest", r_menu: "Otwórz menu", r_edit: "Edytuj od razu", r_delete: "Usuń (z potwierdzeniem)",
    menu_actions: "Pozycje menu", row_buttons: "Pokaż ołówek i kosz w wierszu",
    shop: "Tryb zakupów", shop_hide_checked: "Ukryj odhaczone", shop_keep_awake: "Nie wygaszaj ekranu",
    shop_large: "Duże wiersze", shop_tap_row: "Dotknij całego wiersza, aby odhaczyć", reset: "Resetuj",
    sort: "Sortowanie", sort_category: "Kategoria", sort_alpha: "A–Z", sort_added: "Dodanie", sort_list: "Wg listy",
    packs: "Rozpoznawanie kategorii (pakiety słów kluczowych)", packs_help: "Słowa kluczowe → kategoria. Może być aktywnych kilka pakietów (np. polski + własny). Przy tym samym słowie wygrywa pakiet wyżej. Zapamiętane kategorie mają zawsze pierwszeństwo.",
    pack_terms: "słów kluczowych", pack_products: "produktów", pack_builtin: "wbudowany", pack_custom: "własny", pack_priority: "pozycja",
    pack_up: "W górę (pierwszeństwo)", pack_download: "Pobierz", pack_delete: "Usunąć własny pakiet?", pack_bad_json: "Plik nie jest poprawnym JSON-em.",
    pack_upload: "Wgraj pakiet …", pack_name_help: "Nazwa pakietu. Ta sama nazwa zastępuje istniejący własny pakiet.", pack_add: "Dodaj",
    pack_skipped: "pominięto (nieznana kategoria)", pack_template: "Szablon",
    card_desc: "Lista zakupów z kategoriami, podpowiedziami, ilościami, plakietkami sklepów (@Biedronka) i uprawnieniami.",
    imp_placeholder: "- Mleko 2 l @Biedronka\n- [ ] Chleb\n- [x] Masło\n3 jabłka",
    e_preset_pick: "— Wybierz szablon (ustawia kilka opcji) —", e_view_list: "Lista", e_view_tiles: "Kafelki (np. tablet w kuchni)", e_view_mini: "Mini kafelek (podsumowanie, rozwijany)",
    e_sort_category: "Wg kategorii", e_sort_added: "Kolejność dodania", e_sort_list: "Wg listy źródłowej (połączona)",
    e_layout_tabs: "Karty", e_layout_columns: "Obok siebie", e_layout_stack: "Jedna pod drugą",
    e_density_compact: "Kompaktowo", e_density_normal: "Normalnie", e_density_comfortable: "Duże (dotyk)",
    e_sec_multi: "Kilka list w jednej karcie", e_sec_filter: "Filtry", e_sec_look: "Wygląd", e_sec_header: "Nagłówek", e_sec_input: "Wprowadzanie",
    e_sec_list: "Lista", e_sec_done: "Zrobione", e_sec_shop: "Tryb zakupów",
    e_pre_family: "Zakupy rodzinne (wszystko włączone)", e_pre_kitchen: "Tablet w kuchni (duże kafelki)", e_pre_store: "W sklepie (tryb zakupów, bez wprowadzania)",
    e_pre_readonly: "Tylko podgląd", e_pre_tile: "Kompaktowy kafelek na pulpit",
    l_preset: "Szablon", l_entity: "Lista", l_entities: "Listy (zamiast „Lista” powyżej)", l_layout: "Układ", l_title: "Tytuł (pusty = nazwa listy)",
    l_view: "Widok", l_sort: "Domyślne sortowanie", l_advanced: "Pokaż opcje zaawansowane",
    l_filter_store: "Tylko sklep (np. Biedronka; kilka oddziel przecinkami)", l_filter_person: "Tylko osoba (np. Anna)", l_filter_tag: "Tylko tag (np. bio)",
    l_filter_category: "Tylko kategorie", l_filter_offers: "Tylko promocje", l_filter_tags_new_items: "Nowe produkty dostają tag filtra (@Biedronka …)",
    l_show_filter_chips: "Pasek filtrów (sklepy, osoby, promocje)",
    l_density: "Wysokość wierszy", l_font_scale: "Rozmiar czcionki", l_radius: "Promień narożników", l_accent_color: "Kolor akcentu (pusty = motyw)",
    l_show_header: "Pokaż nagłówek", l_show_count: "Liczba do kupienia / wyników", l_show_search: "Wyszukiwanie (lupa)",
    l_show_sort: "Wybór sortowania", l_show_shopping: "Przycisk trybu zakupów", l_show_undo: "Cofnij (↶)",
    l_show_import: "Przycisk importu", l_show_settings: "Zębatka (ustawienia osobiste)",
    l_show_add: "Pole do dodawania", l_show_frequent: "„Często kupowane”",
    l_drag_drop: "Przeciągnij i upuść (mysz): przenieś na inną listę, zmień kolejność", l_show_stepper: "Regulacja ilości (− +)", l_show_offer: "Promocje z aplikacji (sklep, cena, ważna do)",
    l_show_tags: "Plakietki (@sklep, *osoba, #tag)", l_show_source: "Pochodzenie (lista źródłowa / osoba)", l_show_note: "Notatki",
    l_show_category_titles: "Nagłówki kategorii", l_max_height: "Maksymalna wysokość listy (pusta = bez limitu)",
    l_show_completed: "Pokaż zrobione", l_collapse_completed: "Zrobione na początku zwinięte", l_start_shopping: "Uruchom w trybie zakupów",
    hh_preset: "Ustawia pasujące opcje za jednym razem – potem wszystko można zmieniać osobno.",
    hh_entities: "Kilka list: jako karty, obok siebie lub jedna pod drugą. Wszystkie opcje dotyczą każdej listy.",
    hh_filter_tags_new_items: "W przeciwnym razie nowe produkty od razu znikałyby z przefiltrowanej karty.",
    hh_show_settings: "Gest, menu i tryb zakupów każdy użytkownik ustawia sam w zębatce.",
    hh_show_category_titles: "Wyłączone: sortowane wg kategorii, ale jako jedna lista z ikoną kategorii z przodu.",
    hh_start_shopping: "Przydatne dla tabletu w przedpokoju lub pulpitu tylko do zakupów.",
    shop_auto_store: "Wybieraj sklep automatycznie wg strefy", shop_auto_store_help: "Gdy jesteś w strefie sklepu (np. Biedronka), tryb zakupów pokazuje tylko jego produkty.",
    shop_untagged: "Pokazuj też produkty bez sklepu", shop_untagged_help: "W trybie zakupów dla jednego sklepu dodatkowo wszystko bez @sklep.",
    shop_store: "Sklep", shop_all_stores: "Wszystkie",
    pack_edit: "Edytuj słowa kluczowe", pack_new: "Nowy pakiet", pack_new_help: "Pusty pakiet, np. dla innego języka lub własnych słów. Zostanie aktywowany na samej górze.", pack_new_placeholder: "np. Nederlands",
    pack_empty: "Brak słów kluczowych – dodaj je powyżej.", pack_changed: "zmienione", pack_revert: "Cofnij zmianę", pack_ignore: "Ignoruj (jako Inne)",
    pack_more: "Wczytaj więcej", pack_term_placeholder: "Słowo kluczowe (kilka oddziel przecinkami)",
    pack_builtin_edit_help: "Pakiet wbudowany: zmiany trafiają do pakietu uzupełniającego „+” i zostają po aktualizacjach.", pack_edit_help: "Własny pakiet: zmiany działają od razu.",
    zone: "Strefa", zone_new: "Nowa strefa", zone_new_help: "Nazwa strefy. Pozycja: obecna lokalizacja tego urządzenia (inaczej dom), promień 100 m – dostosuj w Ustawienia → Obszary i strefy.",
    zone_wait: "Strefa utworzona – pojawi się za chwilę, wtedy połącz ją tutaj.", zone_here: "lokalizacja tego urządzenia", zone_home: "pozycja domu – dostosuj",
    zone_none: "brak strefy", zone_manage: "Zarządzaj strefami ↗", store_add: "Sklep ze strefą", store_add_help: "Nazwa sklepu, jak w @Biedronka. Następnie zostanie dla niego utworzona strefa.",
    stores: "Sklepy i strefy", stores_help: "Połącz sklepy ze strefami Home Assistant. W trybie zakupów zobaczysz wtedy automatycznie tylko produkty ze sklepu, w którym jesteś.",
    notes: "Notatki aplikacji", notes_help: "Aplikacja HA SmartLists zapisuje notatki we własnej liście zadań. To nie są listy zakupów, dlatego domyślnie są ukryte.",
    notes_show: "Pokazuj w SmartLists", notes_show_help: "Jako osobna sekcja 📝 na stronie – nie w Assist, akcjach ani listach połączonych.",
    notes_scope: "Kto widzi notatki", notes_scope_owner: "tylko własne konto", notes_scope_household: "wszyscy użytkownicy",
    notes_lists: "Listy notatek i właściciele", notes_none: "Nie znaleziono listy notatek aplikacji.", notes_no_owner: "nieznany (tylko admini)",
    p_order: "Zmień kolejność", p_order_hint: "◀ ▶ przesuwa listę. Myszą: przeciągnij jeden chip na inny. Kolejność dotyczy też kolumn.",
    p_left: "W lewo", p_right: "W prawo",
    look: "Plakietki i kolory", look_help: "Wygląd plakietek dla wszystkich użytkowników. Kolory i nazwy sklepów obowiązują też w aplikacji. Puste lub ↺ = domyślne.",
    look_style: "Styl", look_filled: "wypełniony", look_soft: "delikatny", look_outline: "obramowanie", look_text: "tylko tekst",
    look_color: "Kolor tła", look_text: "Kolor tekstu", look_icon: "Symbol z przodu", look_label: "Nazwa wyświetlana", look_kinds: "Wg rodzaju", look_values: "Pojedyncze plakietki",
    look_search: "Szukaj plakietki … (np. biedronka)", look_more: "Pozostałe znajdziesz przez wyszukiwanie.", look_add: "Pokoloruj plakietkę",
    look_add_help: "Ze znakiem, np. @Kaufland, *Max lub #wege – nawet jeśli jeszcze nie była używana.",
    zone_count: "stref", zone_unlink: "Odłącz strefę", zone_add: "Strefa",
    app_list: "lista połączona aplikacji", app_list_connected: "połączona", app_list_connect: "Połącz",
    zone_name: "Nazwa strefy, np. Biedronka Centrum", zone_radius: "Promień", zone_coords: "Współrzędne lub link do mapy", zone_coords_placeholder: "52.2297, 21.0122 lub link z Google/Apple/OSM", zone_coords_bad: "Nie rozpoznano współrzędnych.", zone_locating: "Ustalanie lokalizacji …", zone_no_location: "Lokalizacja niedostępna – wybierz inną opcję.", zone_where: "Gdzie?", zone_here_opt: "Obecna lokalizacja (to urządzenie)", zone_home_opt: "Dom", zone_map_opt: "Wybierz na mapie", zone_after: "Dostosuj w dowolnej chwili w Ustawienia → Obszary i strefy.",
    note_new: "Nowa notatka", note_edit: "Edytuj notatkę", note_view: "Lista / siatka", note_empty: "Brak notatek.", note_locked: "Zaszyfrowana notatka", note_locked_help: "Zaszyfrowana hasłem notatek aplikacji – do odczytu tylko w aplikacji.", note_title: "Tytuł", note_body: "Treść",
    p_settings_hint: "",
    list_settings_hint: "Sterowanie i ustawienia globalne: ⚙ w prawym górnym rogu strony.",
    settings_list: "Ustawienia tej listy", settings_global: "Ustawienia ogólne", list_settings_hint_card: "Sterowanie i ustawienia globalne: ikona suwaków w nagłówku.",
    tpl: "Szablony",
    scan: "Skanuj kod kreskowy",
    price_sum: "Suma",
    soft_checked: "oznaczone z zewnątrz (link)",
    soft_checked_help: "Ktoś oznaczył to jako zrobione przez udostępniony link – produkt pozostaje otwarty, dopóki go nie odhaczysz.",
    price: "Cena",
    aisle: "Kolejność",
    price_paid: "ostatnio zapłacono",
    price_manual: "własna cena",
    price_last: "ostatnio",
    tpl_servings: "Porcje",
    tpl_new: "Nowy szablon",
    tpl_from_list: "Lista jako szablon",
    tpl_increase: "już jest na liście → ilość zostanie zwiększona",
    tpl_servings_help: "Ilości są przeliczane",
    tpl_increased: "ilość zwiększona",
    tpl_name: "Nazwa, np. Naleśniki",
    tpl_items_placeholder: "Mąka 250 g\nMleko 0,5 l\nJajka 3",
    tpl_items: "Produkty",
    tpl_items_help: "Jeden produkt w wierszu, z ilością i tagami jak na liście. Porcje (opcjonalnie) = dla ilu osób są podane ilości.",
    tpl_edit: "Edytuj szablon",
    scan_help: "Przytrzymaj kod kreskowy na czerwonej linii – albo wpisz numer pod nim.",
    scan_code: "Numer kodu kreskowego",
    scan_unknown: "Nie znaleziono produktu – wpisz nazwę samodzielnie.",
    scan_find: "Szukaj",
    scan_no_camera: "Skanowanie aparatem nie jest tu obsługiwane (np. Safari na iPhonie, Firefox) – wpisz numer.",
    aisle_down: "W dół",
    aisle_help: "Tak sortuje tryb zakupów, gdy wybrany jest ten sklep. Przeciągnij uchwyt ⠿ lub użyj strzałek.",
    aisle_all_branches: "wszystkie oddziały",
    aisle_reset: "Domyślnie",
    notify_to: "Wyślij do",
    notify_no_phone: "Nie znaleziono urządzenia z aplikacją Companion.",
    notify_added: "Przy nowych produktach",
    notify_checked: "Gdy coś zostanie odhaczone",
    notify_lists: "Listy",
    notify_all_lists: "wszystkie, które widzę",
    notify_from: "Od kogo",
    notify_quiet: "Godziny ciszy",
    notify_quiet_none: "brak",
    notify: "Powiadomienia",
    notify_help: "Gdy ktoś inny coś zmieni (własne zmiany tylko po włączeniu poniżej). Kilka zmian w ciągu minuty przychodzi jako jedna wiadomość.",
    stats_90: "90 dni",
    stats_year: "Rok",
    stats_all: "wszystko",
    stats_top: "Najczęściej kupowane",
    stats_every: "co",
    stats_none: "Za mało historii.",
    stats_overdue: "Dawno niekupowane",
    stats_add: "Dodaj do listy",
    stats_usually: "zwykle co",
    stats_since: "od",
    stats_shares: "Wg kategorii · sklepu",
    stats: "Statystyki",
    stats_help: "Na podstawie istniejącej historii – nie są zbierane żadne dodatkowe dane.",
    exp_week: "Tydzień",
    exp_month: "Miesiąc",
    exp_year: "Rok",
    exp_none: "Brak wydatków – są księgowane przy odhaczaniu produktów z ceną.",
    exp_no_store: "bez sklepu",
    exp: "Wydatki",
    exp_help: "Księgowane przy odhaczaniu (cena × ilość). Ceny pochodzą z ofert, wpisane ręcznie (np. „Mleko 2 l 4,99€” lub ✏️) lub z ostatniego zakupu.",
    share_view: "tylko podgląd",
    share_soft: "odhaczanie „soft” (pozostaje otwarte)",
    share_check: "naprawdę odhaczaj",
    share_mode: "Dozwolone",
    share_mode_help: "„soft”: widzisz, co zostało oznaczone – produkt pozostaje otwarty na twojej liście. To, co dodano przez link, jest na twojej liście oznaczone 🔗.",
    share_add: "Może dodawać",
    share_valid: "Ważność",
    share_2h: "2 godziny",
    share_1d: "1 dzień",
    share_7d: "7 dni",
    share_30d: "30 dni",
    share_forever: "do odwołania",
    share_create: "Utwórz link",
    soft_checked_by: "oznaczone przez {name} (link)", link_added_by: "dodane przez {name} przez link",
    x_stats: "Statystyki i wydatki", x_stats_help: "Najczęściej kupowane, dawno niekupowane, udziały kategorii i sklepów, wydatki miesięczne (📊 na stronie, czujnik „Wydatki w tym miesiącu”). Wyłączone: ukryte, liczenie trwa w tle.", w_x_stats_sub: "Co często kupujecie i ile wydajecie",
    share_soft_add: "odhaczanie „soft” i dodawanie", link_added: "dodane przez link", link_added_help: "Ktoś bez konta dodał to przez udostępniony link.",
    link_shared: "udostępniona w sieci", link_shared_help: "Dostępna przez {n} link(i) dla osób bez konta. Stuknij, aby zobaczyć lub cofnąć linki.",
    pub_cf_arch: "{path} jest dla innego procesora ({found}). Ten system potrzebuje {file} – usuń lub zastąp stary plik.", pub_cf_kind_windows: "{path} to wersja dla Windows. Home Assistant potrzebuje {file}.", pub_cf_kind_mac: "{path} to wersja dla macOS. Home Assistant potrzebuje {file}.", pub_cf_kind_archive: "{path} to archiwum (.tgz/.zip/.deb), a nie program. Pobierz plik {file} bez rozszerzenia.", pub_cf_kind_html: "{path} to zapisana strona internetowa, a nie program. Pobierz plik {file} bezpośrednio ze strony wydań.", pub_cf_kind_not_executable: "{path} nie da się uruchomić (uprawnienia). Umieść plik ponownie lub sprawdź uprawnienia.", pub_cf_kind_unknown: "{path} nie pasuje do tego systemu. Potrzebny jest {file}.",
    shared_change_hint: "Aby zmienić: koło zębate tej listy → Udostępnianie.",
    l_plain: "Prosta lista", l_plain_help: "Bez kategorii, podpowiedzi, zapamiętanych słów i cen. SmartLists nic z tej listy nie zapamiętuje – jej pozycje nie pojawiają się na innych listach (np. market budowlany).",
    l_categories: "Kategorie automatycznie", l_categories_help: "Wyłączone: brak podziału na kategorie – ani na liście, ani podczas wpisywania. Sortuj np. wg dodania.", l_suggest: "Często kupowane i podpowiedzi", l_suggest_list: "tylko z tej listy", l_suggest_sources: "z jej list źródłowych", l_suggest_all: "ze wszystkich list", l_suggest_help: "To, co kupiono na innej liście, nie pojawia się tutaj. Starsze wpisy (przed 3.9.4) nadal obowiązują wszędzie.",
    zone_dup_title: "Strefa już istnieje", zone_dup_text: "Istnieje już strefa „{name}”. Możesz zachować nazwę (będą wtedy dwie strefy o tej samej nazwie, np. dwa sklepy) albo zmienić nazwę nowej strefy, np. „{name} Centrum”.", zone_dup_keep: "Zachowaj nazwę", zone_dup_rename: "Zmień nazwę", zone_dup_rename_help: "Nazwa nowej strefy, np. z dzielnicą lub ulicą sklepu.", app_title: "Zapisz jako aplikację na ekranie głównym", app_lead: "Ikona na telefonie, która od razu otwiera tę listę – bez dodatkowej aplikacji. Pełny ekran jak aplikacja.", app_list: "Lista", app_shop: "Otwieraj od razu w trybie zakupów", app_install: "Zainstaluj", app_close: "Zamknij", app_ios: "W Safari stuknij Udostępnij (□↑) na dole\nWybierz Do ekranu początkowego\nStuknij Dodaj – gotowe", app_android: "W Chrome stuknij ⋮ w prawym górnym rogu\nWybierz Dodaj do ekranu głównego lub Zainstaluj aplikację\nPotwierdź Zainstaluj – gotowe", app_other: "W menu przeglądarki wybierz Zainstaluj aplikację lub Dodaj do ekranu głównego\nNa telefonie: otwórz tę stronę w Chrome (Android) lub Safari (iPhone)",
    x_title: "Dodatki", x_help: "Funkcje opcjonalne. Na start niepotrzebne – włącz je tutaj, gdy zechcesz.", x_notes: "Notatki", x_notes_help: "Listy notatek (np. z aplikacji HA SmartLists) jako osobna sekcja 📝. Kto je widzi, ustawisz w Urządzenia i notatki.", x_mealplan: "Plan tygodnia", x_mealplan_help: "Dania na każdy dzień, składniki na listę, kalendarz „Jadłospis”. Wyłączone: karta, pozycja menu i kalendarz znikają, zaplanowane dania zostają zapisane.", w_x_optional: "Opcjonalnie – także później w Ustawienia → Dodatki", w_x_notes_sub: "Listy notatek jako osobna sekcja, np. z aplikacji", w_x_mealplan_sub: "Planuj dania na każdy dzień i dodawaj składniki do listy", share_leak: "Link zawiera adres twojego Home Assistant. Aby go nie ujawniać: Quick Tunnel lub własny proxy (Ustawienia → Udostępnianie i uprawnienia → Adres publiczny).", share_old_address: "adres się zmienił, link już nie działa", pub_title: "Adres publiczny linków", pub_help: "Przez co dostępne są udostępnione linki. Z tunelem lub własnym proxy nikt nie pozna adresu twojego Home Assistant.", pub_mode: "Linki przez", pub_ha: "Adres Home Assistant", pub_tunnel: "Cloudflare Quick Tunnel", pub_proxy: "Własny proxy lub tunel", pub_ha_help: "Jak dotąd: link wskazuje na zewnętrzny adres Home Assistant – kto go dostanie, zna ten adres.", pub_tunnel_help: "SmartLists uruchamia cloudflared i dostaje losowy adres (…trycloudflare.com). Tunel prowadzi tylko do małego osobnego serwera, który udostępnia wyłącznie udostępnione listy – nie do Home Assistant. Bez konta i bez przekierowania portów.", pub_proxy_help: "Przekieruj swój adres na http://<IP Home Assistant>:{port} (Caddy, nginx, Cloudflare Tunnel z własną domeną …). Działa tam tylko serwer udostępniania SmartLists, nie Home Assistant.", pub_url: "Adres publiczny", pub_port: "Port", pub_port_change: "zmień (opcjonalnie)", pub_port_help: "Port serwera udostępniania (domyślnie 8126).", pub_starting: "Tunel się uruchamia …", pub_server_ok: "Serwer udostępniania działa na porcie {port}.", pub_not_ready: "jeszcze niegotowy", pub_tunnel_note: "Adres tunelu zmienia się przy każdym restarcie Home Assistant – wcześniej utworzone linki przestają działać. Dla trwałych linków: własny proxy lub tunel.", pub_cf_missing: "Nie znaleziono cloudflared. SmartLists nie pobiera go samodzielnie.", pub_cf_not_exec: "Znaleziono {path}, ale nie jest wykonywalny lub jest dla innego systemu.", pub_cf_download: "Pobierz cloudflared – dla tego systemu: {file}", pub_cf_where: "Umieść plik {file} w jednym z tych folderów (nie trzeba zmieniać nazwy; podfolder „cloudflared” też działa): {paths}. Potem Zapisz.", pub_cf_or_proxy: "Albo użyj własnego proxy.", pub_err_cloudflared_missing: "Brak cloudflared.", pub_err_cloudflared_not_executable: "cloudflared nie jest wykonywalny.", pub_err_port_in_use: "Port {port} jest zajęty – wybierz inny.", pub_err_cloudflared_exit: "cloudflared zakończył działanie (kod {code}) – zaraz uruchomi się ponownie.", pub_err_cloudflared_failed: "Nie udało się uruchomić cloudflared: {code}",
    share_active: "Aktywne linki",
    share_revoke: "Odwołaj",
    share_expired: "wygasł",
    share_until: "do",
    share_opened: "otwarty",
    share_once: "Link jest widoczny tylko teraz – nie jest zapisywany. Później: odwołaj go i utwórz nowy.",
    share_local: "To adres z twojej sieci domowej – z zewnątrz link działa tylko z zewnętrznym adresem URL (Ustawienia → System → Sieć).",
    share_copied: "skopiowano",
    share_copy: "Kopiuj link",
    share_send: "Udostępnij …",
    share: "Udostępnij przez link",
    share_help: "Dla osób bez konta Home Assistant. Widzą tylko tę listę (bez notatek) – nic więcej z Home Assistant. Domyślnie: tylko podgląd.",
    barcode_lookup: "Wyszukuj kody kreskowe online",
    barcode_lookup_help: "Open Food Facts, wysyłany jest tylko numer. Wyłączone: tylko już znane kody.",
    tab_stats: "Statystyki",
    l_show_templates: "Przycisk szablonów (📋)",
    l_show_scan: "Przycisk kodu kreskowego",
    l_show_prices: "Ceny i suma",
    p_group_combined: "Listy połączone", p_group_lists: "Listy", p_group_notes: "Notatki", app_list_pending: "Lista połączona z aplikacji – jeszcze niepołączona w Home Assistant", app_list_admin: "Admin Home Assistant może ją połączyć (dotknij tutaj lub w Połączonych urządzeniach).", share_combined: "Uwaga: lista połączona udostępnia produkty wszystkich swoich list źródłowych.",
    aisle_sort: "Sortuj", aisle_drag: "Przeciągnij, aby przenieść", emoji_pick: "Wybierz symbol", emoji_free: "własny", emoji_food: "Jedzenie", emoji_occasion: "Okazje i dom", emoji_people: "Osoby", emoji_symbols: "Symbole", emoji_none: "brak",
    trip_done: "Zakupy zakończone", trip_help: "Suma „w koszyku” znów zaczyna od 0. Wydatki zostają zapisane. Dla list używanych ponownie możesz od razu przywrócić wszystko, co odhaczone.", trip_reopen: "Przywróć wszystko", trip_finish: "Zakończ", stats_forget: "Usuń z historii", stats_forget_help: "zostanie usunięte ze statystyk, podpowiedzi i rytmu zakupów (np. dodane przez pomyłkę).", exp_entries: "Wpisy", notes_create: "Utwórz listę notatek", notes_create_help: "Nazwa listy notatek. Należy do ciebie; tworzona jako todo.ha_smartlists_notes_<nazwa>.",
    p_lists_all: "Wszystkie listy", p_lists_less: "Mniej",
    scan_native_help: "Skieruj aparat na kod kreskowy na opakowaniu.", scan_type: "Wpisz numer", scan_not_product: "To nie jest kod kreskowy produktu (EAN).",
    scan_target: "Lista docelowa", scan_target_this: "ta lista (karty)", scan_mode: "Zeskanowane produkty", scan_mode_input: "do pola wpisywania (sprawdź, potem dodaj)", scan_mode_add: "dodaj od razu", barcode_providers: "Usługi wyszukiwania", barcode_providers_help: "Dotknij, aby włączyć/wyłączyć, liczba to kolejność – liczy się pierwszy wynik. SmartLists zapamiętuje znalezione kody.", barcode_custom: "własna usługa", barcode_custom_url: "Adres z {code}", barcode_custom_field: "Pole z nazwą",
    a_applies: "Dotyczy", a_menu: "Menu produktu", a_shop: "Zakupy i skanowanie", a_me_sub: "Dotyczy tylko ciebie.", a_look: "Plakietki i kolory", a_global_sub: "Dotyczy wszystkich użytkowników, także w aplikacji.", a_cats: "Kategorie", a_devices: "Urządzenia i notatki", a_rights: "Udostępnianie i uprawnienia", a_rights_sub: "Co mogą robić użytkownicy bez uprawnień admina.", a_data: "Głos, kopia, ustawienia domyślne", a_stats: "Statystyki i wydatki", a_search: "Szukaj ustawienia", admin_only_short: "tylko admini", g_stats: "Analiza", ls_done: "Gotowe", rights_who: "Linki mogą tworzyć", rights_share_who: "Linki mogą tworzyć", rights_who_admins: "tylko admini", rights_who_owners: "admini i właściciel listy", rights_who_editors: "wszyscy, którzy mogą edytować listę", rights_who_nobody: "nikt (udostępnianie wyłączone)", rights_max: "Link pozwala najwyżej", rights_share_max: "Link pozwala najwyżej", rights_max_on: "odhaczać i dodawać", rights_limits_help: "Limity dotyczą użytkowników bez uprawnień admina.", rights_max_hours: "Najdłuższa ważność", rights_share_max_hours: "Najdłuższa ważność", rights_all_links: "Pokaż aktywne linki wszystkich list", rights_no_links: "Brak aktywnych linków.", rights_share_help: "Linki dają osobom bez konta dostęp do jednej listy.", rights_other: "Dozwolone bez uprawnień admina", rights_create_lists: "Tworzenie własnych list", rights_templates: "Tworzenie i zmiana szablonów", rights_categories: "Ręczne przypisywanie kategorii", rights_prices: "Wpisywanie cen", ls_list: "Lista", ls_list_help: "Dotyczy tej listy na wszystkich urządzeniach, chyba że karta lub urządzenie ustawi coś innego.", ls_name: "Nazwa", ls_sort: "Sortowanie", ls_default: "domyślne karty",
    w_title: "Konfiguracja SmartLists", w_time: "Zajmie to około dwóch minut.", w_step: "Krok {n} z {m}", w_s_lists: "Listy", w_s_stores: "Sklepy", w_s_naming: "Zapis", w_s_lang: "Język", w_s_people: "Osoby i aplikacja", w_s_extras: "Dodatki", w_s_done: "Gotowe", w_lists_h: "Od czego chcesz zacząć?", w_lists_found: "SmartLists znalazł listy zadań w Home Assistant: {n}.", w_lists_none: "W Home Assistant nie ma jeszcze żadnej listy zadań.", w_use: "Użyj istniejących list", w_use_sub: "Pozostają bez zmian. SmartLists pokazuje je z kategoriami, ilościami i sklepami.", w_combine: "Połącz w jedną listę połączoną", w_combine_sub: "Każdy zachowuje swoją listę, a lista połączona pokazuje wszystkie.", w_combine_name: "Nazwa listy połączonej", w_combine_default: "Zakupy", w_new: "Utwórz nową listę", w_new_sub: "Tylko w SmartLists; jesteś jej właścicielem i możesz ją udostępnić.", w_new_name: "Nazwa listy", w_open: "otwarte", w_stores_h: "Gdzie robisz zakupy?", w_stores_lead: "Sklepy są podpowiadane podczas pisania, a tryb zakupów pokazuje tylko to, czego potrzebujesz w danym sklepie.", w_store_other: "Inny sklep", w_store_add: "Dodaj", w_chosen: "Wybrane: {list}", w_chosen_none: "Nie wybrano jeszcze żadnego sklepu", w_becomes: "zmienia się w", w_stores_later: "Lokalizacje sklepów możesz dodać później. Wtedy SmartLists sam wybierze sklep, gdy w nim będziesz.", w_naming_h: "Jak oznaczasz sklep, osobę i tag?", w_naming_lead: "Znak tuż przed słowem zamienia je w plakietkę. Zostaje w tekście produktu, więc Home Assistant i aplikacja też go widzą.", w_eg_store: "na przykład @REWE", w_eg_person: "na przykład *Anna", w_eg_tag: "na przykład #eko", w_naming_bad: "„{c}” jest niedozwolony.", w_naming_dup: "Użyj każdego znaku tylko raz.", w_naming_hint: "Dozwolone są {chars}. Zostaw puste, aby wyłączyć dany rodzaj. Aplikacja HA SmartLists przejmuje te znaki podczas parowania.", w_eg_item: "Mleko", w_eg_qty: "2 l", w_lang_h: "W jakim języku zapisujesz produkty?", w_lang_lead: "Dzięki temu SmartLists rozpoznaje kategorię, na przykład mleko w produktach chłodzonych. Można łączyć kilka języków.", w_words: "słów", w_people_h: "Kto dołącza?", w_people_lead: "Uprawnienia do nowej listy. Wszyscy widzą SmartLists na swoim pasku bocznym.", w_people_combined: "Listy połączone widzą wszystkie osoby, które widzą listy źródłowe. Uprawnienia dla poszczególnych osób dotyczą własnych list SmartLists.", w_you: "ty, admin", w_all: "może wszystko", w_app: "Aplikacja HA SmartLists na urządzeniu", w_app_sub: "W aplikacji stuknij „Paruj” w Ustawienia → Połączenie. Połączone urządzenia pojawią się potem w Globalne → Urządzenia i notatki.", w_extras_h: "Co jeszcze ma robić SmartLists?", w_extras_lead: "Wszystko można później włączyć i wyłączyć.", w_x_notify: "Powiadom mnie, gdy ktoś coś doda", w_x_notify_sub: "Na twoje urządzenie z aplikacją Home Assistant", w_x_notify_none: "Nie znaleziono urządzenia z aplikacją Home Assistant", w_x_voice: "Dodawaj produkty głosem", w_x_voice_sub: "„Dodaj mleko do listy zakupów” z Assist", w_x_prices: "Ceny i wydatki", w_x_prices_sub: "Suma listy i przegląd miesięczny", w_x_barcode: "Wyszukuj kody kreskowe online", w_x_barcode_sub: "W Open Food Facts, wysyłany jest tylko numer", w_x_share: "Właściciele mogą udostępniać listy przez link", w_x_share_sub: "Dla osób bez konta Home Assistant, na przykład sąsiadów lub gości", w_done_h: "Wszystko gotowe", w_done_lead: "To zostanie skonfigurowane. Wszystko możesz zmienić w dowolnej chwili w ustawieniach.", w_sum_combined: "Lista połączona „{name}” z {lists}", w_sum_new: "Nowa lista „{name}”", w_sum_lists: "Listy: {lists}", w_sum_stores: "Sklepy: {list}", w_sum_naming: "Zapis: {list}", w_sum_lang: "Kategorie: {list}", w_sum_people: "Udostępnianie: {list}", w_sum_extras: "Włączone: {list}", w_off: "wyłączone", w_tip: "Wskazówka: po prostu zacznij pisać w polu wprowadzania, na przykład „2 kg jabłek @REWE”.", w_back: "Wstecz", w_next: "Dalej", w_skip: "Pomiń", w_finish: "Skonfiguruj", w_start: "Zaczynamy", w_later: "Można zmienić później w ustawieniach", w_close: "Zamknij konfigurację", w_restart: "Uruchom konfigurację ponownie", w_restart_sub: "Asystent pierwszego uruchomienia, np. aby połączyć kolejne listy.",
    more: "Więcej", ih_title: "Historia", ih_none: "Brak wpisów.", ih_add: "dodano", ih_check: "odhaczono", ih_uncheck: "przywrócono", ih_rename: "zmieniono nazwę", ih_remove: "usunięto", ih_link: "przez udostępniony link", ih_auto: "automatyzacja", mp_title: "Plan tygodnia", mp_add: "Danie", mp_help: "Dania to szablony. „Składniki na listę” dodaje wszystko z tego tygodnia; takie same produkty są sumowane. Plan pojawia się też jako kalendarz w Home Assistant.", mp_no_tpl: "Najpierw utwórz szablon (⋯ → Szablony).", mp_prev: "Poprzedni tydzień", mp_next: "Następny tydzień", mp_mealie: "Pobierz z Mealie", mp_recipes: "przepisów zaimportowano", mp_to_list: "Składniki na listę", db_title: "Pulpit zakupów", db_help: "Tworzy własny widok na pasku bocznym: wszystkie listy, plan tygodnia i statystyki. Potem można go edytować jak każdy pulpit.", db_create: "Utwórz pulpit", db_open: "Otwórz pulpit", db_lists: "Listy", db_plan: "Plan tygodnia", db_stats: "Statystyki",
    rs_title: "Zacznij od nowa", rs_help: "Wybierz, co zresetować. Potem uruchomi się kreator. Listy zadań i ich produkty nigdy nie są usuwane; ustawienia osobiste użytkowników zostają.", rs_settings: "Zresetuj ustawienia", rs_settings_sub: "Konwencja nazw, plakietki i kolory, sklepy i strefy, kolejność alejek, uprawnienia, głos i automatyzacje, wygląd list, pakiety słów kluczowych.", rs_data: "Usuń wyuczone dane", rs_data_sub: "Zapamiętane kategorie, historia i statystyki, ceny i wydatki, szablony i plan tygodnia.", rs_links: "Cofnij wszystkie linki", rs_links_sub: "Udostępnione linki przestaną działać.", rs_combined: "Usuń listy połączone", rs_combined_sub: "Tylko widok połączony – listy źródłowe pozostają bez zmian.", rs_go: "Zresetuj i uruchom kreator",
    mp_saved: "Plan zapisany", mp_ask_add: "Dodać teraz składniki z tego tygodnia do listy?", mp_not_now: "Nie, tylko zapisz",
    notify_own: "Także przy moich zmianach", notify_own_sub: "np. gdy dodajesz coś na komputerze i chcesz to na urządzeniu – albo żeby wypróbować.", notify_test: "Wyślij wiadomość testową", notify_test_sent: "Wysłano wiadomość testową – jeśli nie dotrze, sprawdź aplikację Companion i uprawnienia do powiadomień.",
    m_select: "Zaznacz", sel_mode: "Zaznacz kilka", sel_count: "Zaznaczono: {n}", sel_all: "Wszystkie", sel_none: "Żadne", sel_check: "Odhacz", sel_checked: "odhaczono", sel_reopened: "ponownie otwarte", sel_delete_q: "Usunąć {n} produktów?",
    mp_target: "Składniki na:",
    p_tab_lists: "Listy",
    nt_add: "Dodaj cel", nt_none: "Brak celu – wiadomości nie będą wysyłane.", nt_service: "Usługa powiadomień", nt_entity: "Encja powiadomień", nt_custom: "Własna usługa", nt_no_services: "Nie znaleziono usług notify.", nt_no_entities: "Nie znaleziono encji notify.", nt_custom_help: "Dowolna usługa (tylko admini), np. telegram_bot.send_message lub script.moja_wiadomosc. Dane jako JSON; {title} i {message} są podmieniane – bez symboli zastępczych dodawane są title i message.", nt_help: "Możliwych jest kilka celów: aplikacja Companion, Telegram, e-mail, Signal, głośniki … – wszystko, co Home Assistant zna jako powiadomienie.", nt_bad_service: "Podaj usługę jako domena.usługa.",
    mg_title: "Przejmij listy", mg_sub: "Przejmij istniejące listy zadań (lista zakupów, Local To-do …) do własnych list SmartLists – z produktami, notatkami i odhaczeniami.", mg_help: "Nowe listy należą do ciebie i można je potem udostępnić. Wybierz jedną lub kilka list.", mg_lists: "Listy", mg_none: "Nie znaleziono odpowiednich list.", mg_how: "Kilka list", mg_each: "Każda jako własna lista", mg_each_sub: "Taka sama nazwa jak wcześniej.", mg_one: "Wszystkie w jedną listę", mg_one_sub: "Wszystkie produkty razem w nowej liście.", mg_name: "Nazwa nowej listy", mg_tag: "Oznacz pochodzenie jako", mg_tag_none: "nie oznaczaj", mg_old: "Stara lista", mg_used: "Używana w listach połączonych: {lists}. Dodaj tam nową listę, zanim usuniesz starą.", mg_pick: "Wybierz co najmniej jedną listę.", mg_go: "Przejmij", mg_items: "produktów",
    mg_pf_local: "Lokalne To-do", mg_pf_shopping: "Lista zakupów", mg_pf_other: "Inne",
    mg_keep_info: "Stara lista pozostaje bez zmian. Sprawdź nową listę, a potem sam(a) usuń starą.", mg_done_hint: "Stare listy nadal istnieją. Jeśli w nowej liście wszystko się zgadza, usuń je sam(a) (Ustawienia → Urządzenia i usługi, np. Local To-do lub odpowiednia integracja):", mg_done_combined: "Co najmniej jedna stara lista jest źródłem listy połączonej – najpierw dodaj tam nową listę.",
    mg_pf_notes: "Notatki", mg_as: "Przejmij jako", mg_as_list: "Lista", mg_as_list_sub: "Własna lista SmartLists z kategoriami, ilościami i funkcjami zakupów.", mg_as_notes: "Notatki", mg_as_notes_sub: "Nowa lista notatek (widoczna tylko dla ciebie), notatki z tytułem i treścią – zaszyfrowane pozostają bez zmian.",
    owner_everyone: "— wszyscy (bez ograniczeń)", owner_combined_help: "Z właścicielem listę widzą tylko on, admini i osoby, którym ją udostępniono.",
    lb_title: "Plakietki pochodzenia", lb_help: "Pokazują przy każdym produkcie, z której listy pochodzi.", lb_show: "Plakietka pokazuje", lb_list: "Nazwa listy", lb_owner: "Właściciel listy źródłowej", lb_both: "Właściciel i nazwa listy", lb_show_help: "Listy bez właściciela (Local To-do …) zawsze pokazują nazwę.", lb_only: "Tylko z tych list", lb_all: "wszystkie",
    lb_colors: "Kolor dla listy źródłowej (domyślnie: automatycznie, inny dla każdej listy)",
  },
};

/* ------------------------------------------------------------------ */
/* Artikeltext – gleiche Regeln wie itemtext.py in der Integration     */
/* ------------------------------------------------------------------ */
const NUM = "[0-9]+(?:[.,][0-9]+)?";
const UNIT = "[a-zA-Z\\u00C0-\\u024F%°]+\\.?";
const RE_SUFFIX_UNIT = new RegExp(`^(.+?)\\s+(?:([0-9]+)[×xX]\\s+)?(${NUM})\\s+(${UNIT})$`);
const RE_SUFFIX_ONLY = new RegExp(`^(.+?)\\s+(?:([0-9]+)[×xX]\\s+)?(${NUM})$`);
const RE_PREFIX_QTY = new RegExp(`^(${NUM})\\s*(?:(${UNIT})\\s+)?(.+)$`);
const UNIT_WORDS = new Set(("stk stück st kg g gr l ml cl pck pk packung packungen fl flasche flaschen dose dosen becher " +
  "glas gläser tube bund netz beutel tüte kiste kasten rolle rollen scheiben pkg x " +
  // weitere Sprachen (gleiche Liste in itemtext.py)
  "pcs pc piece pieces pack packs bottle bottles can cans jar jars box boxes bag bags roll rolls tin tins bunch slices dozen pièce pièces paquet paquets bouteille bouteilles boîte boîtes sachet sachets rouleau rouleaux tranches ud uds unidad unidades paquete paquetes botella botellas lata latas bolsa bolsas caja cajas bote botes rollo rollos pz pezzo pezzi confezione confezioni bottiglia bottiglie lattina lattine scatola scatole busta buste vasetto rotolo rotoli szt sztuka sztuki opak opakowanie butelka butelki puszka puszki paczka paczki słoik słoiki rolka rolki").split(" "));
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const num = (s) => Number(String(s).replace(",", "."));
const fmtQty = (q) => (Number.isInteger(q) ? String(q) : String(q).replace(".", ","));

function tagRegex(rules) {
  if (!rules || !rules.length) return null;
  const chars = rules.map((r) => escRe(r.prefix)).join("");
  return new RegExp(`(^|\\s)([${chars}])([\\p{L}\\p{N}_][\\p{L}\\p{N}_.\\-]*)`, "gu");
}
function storeInfo(value, stores) {
  const s = (stores || []).find((k) => k.value.toLowerCase() === value.toLowerCase());
  return s ? { label: s.value, color: s.color } : { label: value, color: null };
}
function splitTags(text, rules, stores) {
  const re = tagRegex(rules);
  if (!re) return [text.trim(), []];
  const kinds = Object.fromEntries(rules.map((r) => [r.prefix, r.kind]));
  const tags = [];
  const seen = new Set();
  for (const m of text.matchAll(re)) {
    const kind = kinds[m[2]];
    const value = m[3].replace(/[.\-]+$/, "");
    const key = `${kind}:${value.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const info = kind === "store" ? storeInfo(value, stores) : { label: value, color: null };
    tags.push({ kind, value, prefix: m[2], ...info });
  }
  return [text.replace(re, " ").split(/\s+/).filter(Boolean).join(" "), tags];
}
// Preis im Text (wie extras.split_price): "Milch 2 l 1,19€ @REWE" → ["Milch 2 l @REWE", 1.19]
const PRICE_RE = /(^|\s)(?:€\s?(\d+(?:[.,]\d{1,2})?)|(\d+(?:[.,]\d{1,2})?)\s?(?:€|EUR\b|eur\b))(?=\s|$)/g;
function splitPrice(text) {
  let last = null;
  for (const m of String(text).matchAll(PRICE_RE)) last = m;
  if (!last) return [text, null];
  const start = last.index + last[1].length, end = last.index + last[0].length;
  return [(text.slice(0, start) + " " + text.slice(end)).split(/\s+/).filter(Boolean).join(" "), Number((last[2] || last[3]).replace(",", "."))];
}
function parseText(text, rules, stores, typed = false) {
  const [rest, tags] = splitTags(text || "", rules, stores);
  let m;
  if ((m = rest.match(RE_SUFFIX_UNIT))) return { name: m[1].trim(), quantity: num(m[3]), unit: m[4], pack_count: m[2] ? +m[2] : null, tags };
  if ((m = rest.match(RE_SUFFIX_ONLY))) return { name: m[1].trim(), quantity: num(m[3]), unit: null, pack_count: m[2] ? +m[2] : null, tags };
  if (typed && (m = rest.match(RE_PREFIX_QTY))) {
    let [, q, unit, name] = m;
    name = name.trim();
    if (unit && !UNIT_WORDS.has(unit.replace(/\.$/, "").toLowerCase())) { name = `${unit} ${name}`.trim(); unit = null; }
    if (name) return { name, quantity: num(q), unit: unit ? unit.replace(/\.$/, "") : null, pack_count: null, tags };
  }
  return { name: rest, quantity: null, unit: null, pack_count: null, tags };
}
function encodeText(item, rules) {
  const parts = [item.name.trim()];
  if (item.quantity != null && !Number.isNaN(item.quantity)) {
    if (item.pack_count > 1) parts.push(`${item.pack_count}×`);
    parts.push(fmtQty(item.quantity));
    if (item.unit) parts.push(item.unit.trim());
  }
  const pre = Object.fromEntries((rules || []).map((r) => [r.kind, r.prefix]));
  for (const t of item.tags || []) {
    const p = pre[t.kind] || t.prefix;
    const v = String(t.value || "").trim().replace(/\s+/g, "-");
    if (p && v) parts.push(p + v);
  }
  return parts.filter(Boolean).join(" ");
}
function openTagQuery(text, rules) {
  if (!text || /\s$/.test(text)) return null;
  const last = text.split(/\s+/).pop() || "";
  const r = (rules || []).find((x) => last.startsWith(x.prefix));
  return r ? { kind: r.kind, partial: last.slice(1) } : null;
}
// Eingefügten Text in Zeilen zerlegen: Aufzählungen, Checkboxen und Nummern entfernen.
// "* Milch" ist eine Aufzählung (Leerzeichen danach), "*Anna" dagegen ein Tag.
function parseImportText(text) {
  const out = [];
  for (let line of String(text || "").split(/\r?\n/)) {
    line = line.trim();
    if (!line) continue;
    let checked = false;
    line = line.replace(/^(?:[-*•·–—+]|\d+[.)])\s+/, "");
    const box = line.match(/^(?:\[( |x|X)\]|([☐☑☒✓✔]))\s*/);
    if (box) { checked = box[1] ? box[1].toLowerCase() === "x" : box[2] !== "☐"; line = line.slice(box[0].length); }
    line = line.trim();
    if (line) out.push({ text: line, checked });
  }
  return out;
}
/* Eigener Dialog statt Browser-confirm/prompt – im Stil von HA, Hell/Dunkel über Theme-Variablen.
 * slDialog(root, {title, text, input, value, placeholder, ok, cancel, danger}) → Promise<string|true|null> */
const DIALOG_STYLE = `
  .dlg-back { position:fixed; inset:0; z-index:999; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; padding:16px;
    animation:dlgfade .12s ease-out; }
  .dlg { width:100%; max-width:380px; background:var(--card-background-color,#fff); color:var(--primary-text-color,#212121);
    border-radius:16px; box-shadow:0 12px 40px rgba(0,0,0,.4); padding:20px 20px 14px; font-family:inherit; }
  .dlg h2 { margin:0 0 6px; font-size:1.1rem; font-weight:600; }
  .dlg p { margin:0 0 14px; color:var(--secondary-text-color,#727272); font-size:.9rem; line-height:1.4; }
  .dlg input { width:100%; box-sizing:border-box; height:42px; border-radius:10px; border:1px solid var(--divider-color,#ccc);
    background:var(--secondary-background-color,#f2f2f2); color:inherit; font:inherit; padding:0 12px; margin:0 0 14px; }
  .dlg input:focus { outline:2px solid var(--primary-color,#03a9f4); outline-offset:-1px; border-color:transparent; }
  .dlg .row { display:flex; justify-content:flex-end; gap:8px; }
  .dlg button { height:38px; padding:0 16px; border-radius:19px; font:inherit; font-weight:500; cursor:pointer; border:1px solid var(--divider-color,#ccc);
    background:none; color:var(--primary-color,#03a9f4); }
  .dlg button.ok { background:var(--primary-color,#03a9f4); border-color:var(--primary-color,#03a9f4); color:var(--text-primary-color,#fff); }
  .dlg button.ok.danger { background:var(--error-color,#db4437); border-color:var(--error-color,#db4437); }
  .dlg button:disabled { opacity:.5; cursor:default; }
  @keyframes dlgfade { from { opacity:0; } to { opacity:1; } }
`;
function slDialog(root, opts) {
  return new Promise((resolve) => {
    const input = opts.input ? h("input", { value: opts.value || "", placeholder: opts.placeholder || "", "aria-label": opts.title, maxlength: "60" }) : null;
    const ok = h("button", { type: "button", class: `ok ${opts.danger ? "danger" : ""}` }, opts.ok);
    const close = (v) => { back.remove(); document.removeEventListener("keydown", onKey, true); resolve(v); };
    const submit = () => { if (input) { const v = input.value.trim(); if (v) close(v); } else close(true); };
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(null); } else if (e.key === "Enter") { e.preventDefault(); submit(); } };
    ok.addEventListener("click", submit);
    if (input) { const upd = () => { ok.disabled = !input.value.trim(); }; input.addEventListener("input", upd); upd(); }
    const back = h("div", { class: "dlg-back", onpointerdown: (ev) => { back._down = ev.target === back; if (!back._down && ev.target.closest && ev.target.closest("input, textarea, select, .emo, .swatch")) back._dirty = true; }, oninput: () => { back._dirty = true; }, onclick: (ev) => { if (backdropClose(back, ev)) close(null); } },
      h("style", {}, DIALOG_STYLE),
      h("div", { class: "dlg", role: "dialog", "aria-modal": "true", "aria-label": opts.title },
        h("h2", {}, opts.title), opts.text ? h("p", { style: "white-space:pre-line" }, opts.text) : null, input,
        h("div", { class: "row" }, opts.cancel ? h("button", { type: "button", onclick: () => close(null) }, opts.cancel) : null, ok)));
    document.addEventListener("keydown", onKey, true);
    root.append(back);
    setTimeout(() => (input || ok).focus(), 30);
  });
}

// Gerade gezogener Artikel (Ziehen & Ablegen zwischen Karten im selben Fenster)
let SL_DRAG = null;

/* Zone anlegen: Name, Ort (aktueller Standort / Zuhause / Karte / Koordinaten bzw. Karten-Link), Radius.
 * Die Karte nutzt HAs eigenen Orts-Editor (ha-locations-editor), sofern das Frontend ihn geladen hat –
 * sonst bleiben Standort, Zuhause und Koordinaten. → Promise<{name, latitude, longitude, radius} | null> */
function parseCoords(text) {
  const s = String(text || "").trim();
  const pats = [/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/, /[?&](?:q|ll|query|center)=(-?\d+(?:\.\d+)?)(?:,|%2C)\s*(-?\d+(?:\.\d+)?)/i,
    /mlat=(-?\d+(?:\.\d+)?).*mlon=(-?\d+(?:\.\d+)?)/i, /#map=\d+\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/, /^(-?\d+(?:[.,]\d+)?)\s*[,; ]\s*(-?\d+(?:[.,]\d+)?)$/];
  for (const re of pats) {
    const m = re.exec(s);
    if (m) {
      const lat = Number(m[1].replace(",", ".")), lon = Number(m[2].replace(",", "."));
      if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return { latitude: lat, longitude: lon };
    }
  }
  return null;
}
function slZoneDialog(root, hass, t, name) {
  return new Promise((resolve) => {
    const home = { latitude: hass.config && hass.config.latitude, longitude: hass.config && hass.config.longitude };
    let pos = null, mode = "here";
    const nameIn = h("input", { value: name || "", "aria-label": t.zone_name, placeholder: t.zone_name, maxlength: "60" });
    const radiusIn = h("input", { type: "number", min: "20", max: "5000", step: "10", value: "100", "aria-label": t.zone_radius, style: "width:100px;margin:0" });
    const coordIn = h("input", { placeholder: t.zone_coords_placeholder, "aria-label": t.zone_coords });
    const info = h("p", { style: "margin:8px 0" });
    const mapBox = h("div", { style: "height:240px;border-radius:10px;overflow:hidden;margin:0 0 10px" });
    const hasMap = !!customElements.get("ha-locations-editor");
    const ok = h("button", { type: "button", class: "ok" }, t.create);
    const update = () => {
      coordIn.hidden = mode !== "coords";
      mapBox.hidden = mode !== "map";
      if (mode === "home") pos = home;
      if (mode === "coords") pos = parseCoords(coordIn.value);
      info.textContent = pos && pos.latitude != null ? `📍 ${Number(pos.latitude).toFixed(5)}, ${Number(pos.longitude).toFixed(5)}`
        : mode === "here" ? t.zone_locating : mode === "coords" && coordIn.value ? t.zone_coords_bad : "";
      ok.disabled = !(pos && pos.latitude != null && nameIn.value.trim());
    };
    const locate = () => {
      pos = null; update();
      if (!navigator.geolocation) { info.textContent = t.zone_no_location; return; }
      navigator.geolocation.getCurrentPosition((p) => { if (mode === "here") { pos = { latitude: p.coords.latitude, longitude: p.coords.longitude }; update(); } },
        () => { if (mode === "here") info.textContent = t.zone_no_location; }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
    };
    const showMap = () => {
      if (!hasMap) return;
      const start = pos && pos.latitude != null ? pos : home;
      pos = { ...start };
      const ed = document.createElement("ha-locations-editor");
      ed.hass = hass;
      ed.style.height = "100%";
      ed.locations = [{ id: "new", latitude: start.latitude, longitude: start.longitude, radius: Number(radiusIn.value) || 100,
        radius_color: "var(--accent-color)", icon: "mdi:cart", location_editable: true, radius_editable: true }];
      ed.addEventListener("location-updated", (e) => { pos = { latitude: e.detail.location[0], longitude: e.detail.location[1] }; update(); });
      ed.addEventListener("radius-updated", (e) => { radiusIn.value = String(Math.round(e.detail.radius)); });
      fill(mapBox, ed);
      update();
    };
    const opt = (value, label) => h("label", { style: "display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer" },
      h("input", { type: "radio", name: "zpos", value, checked: value === mode, style: "width:auto;height:auto;margin:0",
        onchange: () => { mode = value; if (value === "here") locate(); else if (value === "map") showMap(); else update(); } }), label);
    const close = (v) => { back.remove(); resolve(v); };
    ok.addEventListener("click", () => {
      if (ok.disabled) return;
      close({ name: nameIn.value.trim(), latitude: Number(pos.latitude), longitude: Number(pos.longitude), radius: Math.max(20, Number(radiusIn.value) || 100) });
    });
    nameIn.addEventListener("input", update);
    coordIn.addEventListener("input", update);
    const back = h("div", { class: "dlg-back", onpointerdown: (ev) => { back._down = ev.target === back; if (!back._down && ev.target.closest && ev.target.closest("input, textarea, select, .emo, .swatch")) back._dirty = true; }, oninput: () => { back._dirty = true; }, onclick: (ev) => { if (backdropClose(back, ev)) close(null); } },
      h("style", {}, DIALOG_STYLE),
      h("div", { class: "dlg", role: "dialog", "aria-modal": "true", "aria-label": t.zone_new, style: "max-width:460px" },
        h("h2", {}, t.zone_new),
        nameIn,
        h("div", { style: "margin:0 0 6px;font-weight:600" }, t.zone_where),
        opt("here", "📍 " + t.zone_here_opt), opt("home", "🏠 " + t.zone_home_opt),
        hasMap ? opt("map", "🗺️ " + t.zone_map_opt) : null, opt("coords", "⌨️ " + t.zone_coords),
        coordIn, mapBox, info,
        h("label", { style: "display:flex;align-items:center;gap:8px;margin:0 0 14px" }, t.zone_radius, radiusIn, "m"),
        h("p", {}, t.zone_after),
        h("div", { class: "row" }, h("button", { type: "button", onclick: () => close(null) }, t.cancel), ok)));
    root.append(back);
    coordIn.hidden = true; mapBox.hidden = true;
    locate();
    setTimeout(() => nameIn.focus(), 30);
  });
}

/* Kleiner QR-Code-Erzeuger (Byte-Modus, Fehlerkorrektur M, Version 1–15) – ohne externe Bibliothek.
 * Nach dem Verfahren von Project Nayuki (MIT). qrMatrix(text) → Array von Zeilen (true = dunkel). */
const QR_ECC_M = { // je Version: [EC-Codewörter je Block, Blöcke]
  1: [10, 1], 2: [16, 1], 3: [26, 1], 4: [18, 2], 5: [24, 2], 6: [16, 4], 7: [18, 4], 8: [22, 4], 9: [22, 5], 10: [26, 5],
  11: [30, 5], 12: [22, 8], 13: [22, 9], 14: [24, 9], 15: [24, 10],
};
function qrRawModules(ver) {
  let r = (16 * ver + 128) * ver + 64;
  if (ver >= 2) { const n = Math.floor(ver / 7) + 2; r -= (25 * n - 10) * n - 55; if (ver >= 7) r -= 36; }
  return r;
}
function qrAlignPos(ver) {
  if (ver === 1) return [];
  const n = Math.floor(ver / 7) + 2;
  const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
  const out = [6];
  for (let p = ver * 4 + 10; out.length < n; p -= step) out.splice(1, 0, p);
  return out;
}
function rsDivisor(degree) {
  const res = new Array(degree).fill(0); res[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < res.length; j++) { res[j] = rsMul(res[j], root); if (j + 1 < res.length) res[j] ^= res[j + 1]; }
    root = rsMul(root, 0x02);
  }
  return res;
}
function rsRemainder(data, div) {
  const res = div.map(() => 0);
  for (const b of data) {
    const f = b ^ res.shift(); res.push(0);
    div.forEach((c, i) => { res[i] ^= rsMul(c, f); });
  }
  return res;
}
function rsMul(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; }
  return z & 0xff;
}
function qrMatrix(text) {
  const bytes = Array.from(new TextEncoder().encode(text));
  let ver = 1;
  for (; ver <= 15; ver++) {
    const [ecLen, blocks] = QR_ECC_M[ver];
    const dataCap = Math.floor(qrRawModules(ver) / 8) - ecLen * blocks;
    const need = 4 + (ver < 10 ? 8 : 16) + bytes.length * 8;
    if (need <= dataCap * 8) break;
  }
  if (ver > 15) throw new Error("text too long for QR");
  const [ecLen, numBlocks] = QR_ECC_M[ver];
  const rawCw = Math.floor(qrRawModules(ver) / 8);
  const dataCw = rawCw - ecLen * numBlocks;
  // Bitstrom
  const bits = [];
  const put = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(0b0100, 4); put(bytes.length, ver < 10 ? 8 : 16); bytes.forEach((b) => put(b, 8));
  put(0, Math.min(4, dataCw * 8 - bits.length));
  put(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < dataCw * 8; pad ^= 0xec ^ 0x11) put(pad, 8);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  // Blöcke + Fehlerkorrektur, verschränkt
  const shortBlocks = numBlocks - (rawCw % numBlocks);
  const shortLen = Math.floor(rawCw / numBlocks);
  const div = rsDivisor(ecLen);
  const blocks = [];
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const dat = data.slice(k, k + shortLen - ecLen + (i < shortBlocks ? 0 : 1));
    k += dat.length;
    const ecc = rsRemainder(dat, div);
    if (i < shortBlocks) dat.push(0);
    blocks.push(dat.concat(ecc));
  }
  const cw = [];
  for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - ecLen || j >= shortBlocks) cw.push(b[i]); });
  // Matrix
  const size = ver * 4 + 17;
  const m = Array.from({ length: size }, () => new Array(size).fill(false));
  const fn = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (x, y, v) => { m[y][x] = v; fn[y][x] = true; };
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
      if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4);
    }
  };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  const al = qrAlignPos(ver);
  al.forEach((a, i) => al.forEach((b, j) => {
    if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) return;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(a + dx, b + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }));
  const drawFormat = (mask) => {
    const dataBits = (0 << 3) | mask; // ECC M = 00
    let rem = dataBits;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const b = ((dataBits << 10) | rem) ^ 0x5412;
    const bit = (i) => ((b >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true);
  };
  drawFormat(0);
  if (ver >= 7) {
    let rem = ver;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const b = (ver << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const v = ((b >>> i) & 1) !== 0, a = size - 11 + (i % 3), c = Math.floor(i / 3);
      set(a, c, v); set(c, a, v);
    }
  }
  // Daten im Zickzack
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j, upward = ((right + 1) & 2) === 0, y = upward ? size - 1 - vert : vert;
      if (!fn[y][x] && i < cw.length * 8) { m[y][x] = ((cw[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0; i++; }
    }
  }
  // Maske mit geringster Strafe wählen
  const masks = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0];
  const apply = (k) => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && masks[k](x, y)) m[y][x] = !m[y][x]; };
  const penalty = () => {
    let p = 0;
    const line = (get) => {
      for (let a = 0; a < size; a++) {
        let run = 1;
        for (let b = 1; b <= size; b++) {
          if (b < size && get(a, b) === get(a, b - 1)) run++;
          else { if (run >= 5) p += run - 2; run = 1; }
        }
        for (let b = 0; b + 10 < size + 1; b++) {
          const s = Array.from({ length: 11 }, (_, k) => (b + k < size ? get(a, b + k) : false));
          const pat = [true, false, true, true, true, false, true];
          const w = [false, false, false, false];
          if ((pat.every((v, k) => s[k] === v) && w.every((v, k) => s[7 + k] === v)) ||
              (w.every((v, k) => s[k] === v) && pat.every((v, k) => s[4 + k] === v))) p += 40;
        }
      }
    };
    line((a, b) => m[a][b]); line((a, b) => m[b][a]);
    for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) {
      const c = m[y][x];
      if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3;
    }
    const dark = m.flat().filter(Boolean).length, total = size * size;
    p += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
    return p;
  };
  let best = 0, bestP = Infinity;
  for (let k = 0; k < 8; k++) {
    apply(k); drawFormat(k);
    const p = penalty();
    if (p < bestP) { bestP = p; best = k; }
    apply(k);
  }
  apply(best); drawFormat(best);
  return m;
}
// als SVG (mit Ruhezone), für <img src> bzw. direkt einfügen
function qrSvg(text, px = 4) {
  const m = qrMatrix(text);
  const n = m.length + 8;
  let d = "";
  m.forEach((row, y) => row.forEach((v, x) => { if (v) d += `M${x + 4},${y + 4}h1v1h-1z`; }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" width="${n * px}" height="${n * px}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

// Anzeigename eines Marktes ("rewe" → "REWE") aus den bekannten Märkten
const itemStoreLabel = (key, cfg) => { const k = ((cfg && cfg.known_stores) || []).find((x) => String(x.value).toLowerCase() === key); return k ? k.value : key; };
// Geldbetrag in der Sprache von HA ("2,38 €")
const fmtMoney = (v, lang) => (v == null ? "" : new Intl.NumberFormat(lang || "de", { style: "currency", currency: "EUR" }).format(v));

/* Symbol-Auswahl (Emoji) für Vorlagen und Badges: Raster nach Gruppen + freie Eingabe.
 * slEmojiPicker(root, current, t) → Promise<string | null> ("" = ohne Symbol) */
const EMOJI_GROUPS = [
  ["food", "🥞🍝🍕🍔🌭🥗🍲🍛🍜🍣🥘🌮🥪🍳🥐🍞🥖🧀🥩🍗🥓🐟🍤🥦🥕🍅🍎🍌🍓🍇🍉🥑🌽🥔🧅🧄🍰🎂🍪🍫🍦☕🍵🍺🍷🥂🧃🥤"],
  ["occasion", "🔥🎉🎄🎃🥳🏕️🧺🛒🛍️🎁🍼🧹🧴🧻🧼🧽🐶🐱🌿🏠🚗🏖️"],
  ["people", "👤👥👨👩👧👦🧑👵👴🧔👶🙂😀😎🤓🦸🧙🤖"],
  ["symbols", "#️⃣🏷️✅⭐❤️💚💙💛🧡💜🖤🌱♻️🔖📌🔔❗💶🎯⚡"],
];
function slEmojiPicker(root, current, t) {
  return new Promise((resolve) => {
    const close = (v) => { back.remove(); document.removeEventListener("keydown", onKey, true); resolve(v); };
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(null); } };
    const free = h("input", { value: current || "", placeholder: t.emoji_free, "aria-label": t.emoji_free, maxlength: "8", style: "width:90px;text-align:center;margin:0" });
    // Antippen wählt nur aus (Vorschau im Feld) – übernommen wird mit OK
    const btn = (e) => h("button", { type: "button", class: "emo", title: e, "aria-label": e, onclick: () => { free.value = e; free.focus(); } }, e);
    const back = h("div", { class: "dlg-back", style: "z-index:1001", onpointerdown: (ev) => { back._down = ev.target === back; if (!back._down && ev.target.closest && ev.target.closest("input, textarea, select, .emo, .swatch")) back._dirty = true; }, oninput: () => { back._dirty = true; }, onclick: (ev) => { if (backdropClose(back, ev)) close(null); } },
      h("style", {}, DIALOG_STYLE + `.dlg .emo{width:42px;height:42px;border-radius:10px;border:none;background:none;font-size:22px;line-height:1;cursor:pointer;padding:0;
          display:inline-flex;align-items:center;justify-content:center;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
        .dlg .emo:hover,.dlg .emo:focus-visible{background:var(--secondary-background-color,#eee)}.egrid{display:flex;flex-wrap:wrap;gap:2px;margin:0 0 10px}
        .eh{font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--secondary-text-color,#777);margin:6px 0 2px}`),
      h("div", { class: "dlg", role: "dialog", "aria-modal": "true", "aria-label": t.emoji_pick, style: "max-width:420px;max-height:85vh;overflow:auto" },
        h("h2", {}, t.emoji_pick),
        EMOJI_GROUPS.map(([key, list]) => [h("div", { class: "eh" }, t["emoji_" + key]),
          h("div", { class: "egrid" }, Array.from(new Intl.Segmenter ? [...new Intl.Segmenter().segment(list)].map((x) => x.segment) : [...list]).map(btn))]),
        h("div", { class: "row", style: "align-items:center" }, free,
          h("button", { type: "button", onclick: () => close(free.value.trim()) }, "OK"),
          h("button", { type: "button", style: "margin-right:auto", onclick: () => close("") }, t.emoji_none),
          h("button", { type: "button", onclick: () => close(null) }, t.cancel))));
    document.addEventListener("keydown", onKey, true);
    root.append(back);
  });
}
// Eingabefeld mit Symbol-Auswahl: Antippen öffnet das Raster, Tippen ins Feld geht weiterhin
function emojiField(root, input, t, onpick) {
  input.readOnly = false;
  input.style.cursor = "pointer";
  input.addEventListener("click", async () => {
    const v = await slEmojiPicker(root, input.value, t);
    if (v == null) return;
    input.value = v;
    if (onpick) onpick(v);
    input.dispatchEvent(new Event("change"));
  });
  return input;
}

// Für die Suche: klein, ohne Akzente/Umlaut-Punkte ("Äpfel" → "apfel"), ß → ss
function searchKey(s) {
  return String(s || "").toLowerCase().replace(/ß/g, "ss").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
// Gegenstück zu itemtext.split_offer (Angebots-Zeile der App in der Notiz)
function parseOfferNote(note, stores) {
  const m = /[⚙\u2699]\ufe0f?\s*OFFER\s*:/i.exec(note || "");
  if (!m) return { note, offer: null };
  const clean = note.slice(0, m.index).trim();
  try {
    const j = JSON.parse(note.slice(m.index + m[0].length).trim());
    if (!j || !j.s) return { note: clean, offer: null };
    const k = (stores || []).find((x) => x.value.toLowerCase() === String(j.s).toLowerCase());
    const num = (v) => (v == null || v === "" ? null : Number(String(v).replace(",", ".").replace("€", "").trim()));
    return { note: clean, offer: { store: j.s, store_label: k ? k.value : j.s, color: k ? k.color : null, price: num(j.p), old_price: num(j.o),
      discount: j.d || null, valid_from: j.v || null, valid_until: j.e || null, expired: !!j.e && String(j.e).slice(0, 10) < new Date().toISOString().slice(0, 10) } };
  } catch (e) { return { note: clean, offer: null }; }
}
window.SmartListsText = { parseText, encodeText, openTagQuery, splitTags, parseImportText };

/* ------------------------------------------------------------------ */
function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className = v;
    else if (k === "value") el.value = v;
    else if (k === "style") el.style.cssText = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat(Infinity)) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
}
function svg(path, size = 20, cls) {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("width", size);
  s.setAttribute("height", size);
  if (cls) s.setAttribute("class", cls);
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", path);
  p.setAttribute("fill", "currentColor");
  s.append(p);
  return s;
}
// Wie el.replaceChildren(), aber null/false/"" werden übersprungen statt als Text "null" zu erscheinen
function fill(el, ...children) {
  el.replaceChildren(...children.flat(Infinity).filter((c) => c != null && c !== false && c !== ""));
  return el;
}
// Klick neben ein Fenster schließt es nur, wenn der Klick dort auch begann (nicht beim Markieren von Text)
// und noch nichts eingetippt/geändert wurde – sonst wackelt das Fenster kurz.
function backdropClose(back, ev) {
  if (ev.target !== back || !back._down) return false;
  if (back._dirty) {
    const d = back.querySelector(".dlg, .lsd-win, .wiz");
    if (d && d.animate) d.animate([{ transform: "scale(1)" }, { transform: "scale(1.015)" }, { transform: "scale(1)" }], { duration: 180 });
    return false;
  }
  return true;
}
const iconBtn = (path, title, onclick, cls = "") =>
  h("button", { class: `icon-btn ${cls}`, title, "aria-label": title, type: "button", onclick }, svg(path, 18));
const emojiOf = (label) => (label || "").split(" ")[0];
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
function hashColor(s) {
  let x = 0;
  for (const c of s.toLowerCase()) x = (x * 31 + c.charCodeAt(0)) >>> 0;
  return `hsl(${x % 360} 55% 42%)`;
}
/* Badges & Farben des Haushalts (smartlists/config → appearance). Wird beim Laden gesetzt; ohne
 * Einstellung sehen Badges aus wie bisher (Markt gefüllt in Markenfarbe, Person/Schlagwort dezent). */
let SL_LOOK = { kinds: {}, values: {} };
const BADGE_STYLES = ["filled", "soft", "outline", "text"];
const BADGE_DEFAULTS = { store: { style: "filled", icon: "" }, person: { style: "soft", icon: "👤" }, tag: { style: "soft", icon: "#" } };
function textOn(color) {
  // helle Farben → dunkle Schrift (Lesbarkeit bei „gefüllt“)
  const m = /^#([0-9a-f]{6})$/i.exec(color || "");
  if (!m) return "#fff";
  const n = parseInt(m[1], 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 170 ? "#1a1a1a" : "#fff";
}
function badge(tag, look = SL_LOOK) {
  if (!look || typeof look !== "object") look = SL_LOOK; // auch bei tags.map(badge) (2. Argument = Index)
  const kind = tag.kind === "store" || tag.kind === "person" ? tag.kind : "tag";
  const k = { ...BADGE_DEFAULTS[kind], ...((look.kinds || {})[kind] || {}) };
  const v = (look.values || {})[`${kind}:${String(tag.value).toLowerCase()}`] || {};
  const label = (kind === "store" && v.label) || tag.label || tag.value;
  const color = v.color || (kind === "store" ? tag.color || k.color || hashColor(String(tag.value)) : tag.color || k.color);
  const text = v.text || k.text; // eigene Schriftfarbe (optional)
  const css = !color ? (text ? `color:${text}` : "") : k.style === "filled" ? `background:${color};color:${text || textOn(color)}`
    : k.style === "soft" ? `background:color-mix(in srgb, ${color} 18%, transparent);color:${text || color}`
    : `color:${text || color}`;
  const cls = { store: "store", person: "person", tag: "hash" }[kind];
  // Herkunfts-Badge (implizit, aus dem Listennamen): ohne Symbol – nur der Name in der Farbe der Quell-Liste
  const icon = k.icon && !tag.implicit ? (kind === "person" ? `${k.icon} ` : k.icon) : "";
  return h("span", { class: `tag ${cls} s-${k.style}`, style: css, title: label }, icon, label);
}

const STYLE = `
  /* Anpassbar per Theme oder card-mod: --smartlists-accent, --smartlists-radius, --smartlists-row-height */
  :host { display:block; --sl-accent: var(--smartlists-accent, var(--primary-color)); }
  ha-card { border-radius: var(--smartlists-radius, var(--ha-card-border-radius, 12px)); }
  [hidden] { display:none !important; }
  ha-card { overflow:visible; position:relative; }
  .head { display:flex; align-items:center; gap:4px 8px; padding:16px 12px 8px 16px; flex-wrap:wrap; }
  .title { font-size:1.25rem; font-weight:500; flex:1 1 120px; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  /* schmale Karten (Handy, mehrere Spalten): Knöpfe brechen in eine zweite Zeile um statt die Karte zu verbreitern */
  .head .sort select { max-width:110px; }
  ha-card { max-width:100%; }
  .badge { font-size:.7rem; padding:2px 8px; border-radius:10px; background:var(--sl-accent); color:var(--text-primary-color,#fff); white-space:nowrap; }
  .badge.foreign { background:var(--warning-color,#f5a623); }
  .badge.own { background:var(--secondary-background-color,#eee); color:var(--primary-text-color); }
  button.badge { border:none; font:inherit; font-size:.7rem; cursor:pointer; line-height:inherit; }
  button.badge:hover { filter:brightness(1.1); }
  .badge.combined { background:var(--info-color,#2196f3); }
  .badge.public { background:color-mix(in srgb, var(--warning-color,#ff9800) 22%, transparent); color:var(--warning-color,#ff9800); font-weight:600; }
  .count { color:var(--secondary-text-color); font-size:.85rem; white-space:nowrap; }
  .sort { display:flex; align-items:center; gap:2px; color:var(--secondary-text-color); }
  .sort select { background:none; border:none; padding:4px 2px; font-size:.85rem; color:var(--secondary-text-color); cursor:pointer; }

  .add { position:relative; padding:4px 16px 10px; }
  .add-row { display:flex; gap:6px; }
  input, select { font:inherit; color:var(--primary-text-color); background:var(--secondary-background-color,#f2f2f2);
    border:1px solid transparent; border-radius:8px; padding:9px 11px; min-width:0; box-sizing:border-box; }
  input:focus, select:focus { outline:none; border-color:var(--sl-accent); }
  .add .smart { flex:1; min-width:0; }
  .go { border:none; border-radius:8px; background:var(--sl-accent); color:var(--text-primary-color,#fff);
    padding:0 14px; cursor:pointer; display:flex; align-items:center; }
  .go:disabled { opacity:.45; cursor:default; }
  .preview { display:flex; flex-wrap:wrap; align-items:center; gap:6px; min-height:24px; margin-top:6px; font-size:.82rem; color:var(--secondary-text-color); }
  .preview:empty { display:none; }
  .catchip { display:inline-flex; align-items:center; gap:4px; border:1px dashed var(--divider-color,#ccc); background:none; border-radius:12px;
    padding:2px 9px; font:inherit; font-size:.8rem; color:var(--primary-text-color); cursor:pointer; }
  .catchip:hover { border-color:var(--sl-accent); }
  .catchip .src { color:var(--secondary-text-color); font-size:.72rem; }
  .catchip.manual { border-style:solid; border-color:var(--sl-accent); }
  .hint { font-size:.75rem; color:var(--secondary-text-color); }
  .catpick { position:absolute; z-index:6; left:16px; right:16px; top:calc(100% - 6px); background:var(--card-background-color,#fff);
    border-radius:10px; box-shadow:0 4px 16px rgba(0,0,0,.2); padding:6px; display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:2px; }
  .catpick button { text-align:left; border:none; background:none; border-radius:6px; padding:7px 8px; font:inherit; font-size:.85rem; cursor:pointer; color:var(--primary-text-color); }
  .catpick button:hover, .catpick button.sel { background:var(--secondary-background-color,#eee); }
  .catpick button.auto { grid-column:1/-1; color:var(--secondary-text-color); }

  .sugg { position:absolute; z-index:5; left:16px; right:16px; top:52px; background:var(--card-background-color,#fff);
    border-radius:10px; box-shadow:0 4px 16px rgba(0,0,0,.2); padding:4px 0; margin:0; list-style:none; max-height:320px; overflow:auto; }
  .sugg li { display:flex; align-items:center; gap:10px; padding:8px 12px; cursor:pointer; }
  .sugg li:hover { background:var(--secondary-background-color,#eee); }
  .sugg li.active { background:color-mix(in srgb, var(--sl-accent) 22%, transparent); box-shadow:inset 3px 0 0 var(--sl-accent); }
  .sugg .e { width:22px; text-align:center; }
  .editwrap { position:relative; flex:1 1 100%; min-width:0; display:flex; }
  .editwrap > input { flex:1; min-width:0; }
  .sugg.editsugg { left:0; right:0; top:calc(100% + 4px); }
  .sugg .n { flex:1; min-width:0; }
  .sugg .n b { font-weight:600; }
  .sugg .u { font-size:.75rem; color:var(--secondary-text-color); }
  .sugg .s { color:var(--secondary-text-color); opacity:.7; display:flex; }
  .sugg .in { font-size:.72rem; color:var(--secondary-text-color); font-style:italic; }

  .frequent { display:flex; gap:6px; overflow-x:auto; padding:2px 16px 10px; scrollbar-width:none; }
  .frequent .lbl { font-size:.75rem; color:var(--secondary-text-color); align-self:center; white-space:nowrap; }
  .fchip { border:1px solid var(--divider-color,#ddd); background:none; border-radius:16px; padding:4px 10px; font:inherit; font-size:.82rem;
    white-space:nowrap; cursor:pointer; color:var(--primary-text-color); }
  .fchip:hover { border-color:var(--sl-accent); color:var(--sl-accent); }

  .locked { display:flex; align-items:center; gap:8px; padding:4px 16px 12px; color:var(--secondary-text-color); font-size:.85rem; }
  .group { padding:2px 0; }
  .group-title { padding:8px 16px 2px; font-size:.78rem; font-weight:600; letter-spacing:.03em; color:var(--secondary-text-color); text-transform:uppercase; }
  /* Feste Spalten, damit Menge und Einheit in allen Zeilen untereinander stehen:
     Haken | (Emoji) | Name + Badges | Menge | Einheit | Aktionen */
  /* Alle Zeilen eines Abschnitts teilen sich EIN Raster: jede Spalte ist so breit wie ihr längster
     Eintrag, dazwischen überall derselbe Abstand (--gap) – wie zwischen Menge/Einheit und Stift/Papierkorb. */
  .items { --gap:12px; display:grid; grid-template-columns:auto minmax(0,1fr) auto auto auto; column-gap:var(--gap); }
  .items.emoji { grid-template-columns:auto auto minmax(0,1fr) auto auto auto; }
  .items > .full { grid-column:1 / -1; }
  .row { display:grid; grid-template-columns:subgrid; grid-column:1 / -1; align-items:center;
    padding:6px 8px 6px 16px; min-height:40px; }
  @supports not (grid-template-columns: subgrid) {
    .row { grid-template-columns:22px minmax(0,1fr) 48px 44px 64px; column-gap:var(--gap); }
    .items.emoji .row { grid-template-columns:22px 20px minmax(0,1fr) 48px 44px 64px; }
  }
  .qtycol { text-align:right; font-variant-numeric:tabular-nums; font-weight:600; color:var(--sl-accent); white-space:nowrap; font-size:.9rem; }
  .unitcol { text-align:left; color:var(--secondary-text-color); white-space:nowrap; font-size:.85rem; }
  .row.checked .qtycol { color:var(--secondary-text-color); font-weight:400; }
  /* Mengen-Stepper − 2 + (wie in der App) */
  .stepper { display:inline-flex; align-items:center; gap:2px; justify-content:flex-end; }
  .stepper .sbtn { width:24px; height:24px; border-radius:50%; border:1px solid var(--divider-color,#ddd); background:none; padding:0;
    display:inline-flex; align-items:center; justify-content:center; color:var(--secondary-text-color); cursor:pointer; flex:none; }
  .stepper .sbtn:hover { border-color:var(--sl-accent); color:var(--sl-accent); }
  .stepper .sval { min-width:1.6em; text-align:center; }
  .shopping .row.large .stepper .sbtn { width:30px; height:30px; }
  .row:hover { background:var(--secondary-background-color,#f6f6f6); }
  .box { flex:none; width:22px; height:22px; border-radius:6px; border:2px solid var(--secondary-text-color); background:none;
    padding:0; cursor:pointer; display:flex; align-items:center; justify-content:center; color:transparent; }
  .box.on { background:var(--sl-accent); border-color:var(--sl-accent); color:var(--text-primary-color,#fff); }
  .box:disabled { opacity:.45; cursor:not-allowed; }
  .main { flex:1; min-width:0; }
  .name-line { display:flex; align-items:center; gap:6px; flex-wrap:wrap; min-width:0; }
  /* Lange Namen hart umbrechen statt die Spalten zu verschieben */
  .iname { overflow-wrap:anywhere; word-break:break-word; hyphens:auto; min-width:0; }
  .row.checked .iname { text-decoration:line-through; color:var(--secondary-text-color); }
  .row.checked .tag { opacity:.55; }
  .chip { font-size:.72rem; padding:1px 7px; border-radius:9px; background:var(--secondary-background-color,#eee); color:var(--secondary-text-color); white-space:nowrap; }
  .chip.qty { background:color-mix(in srgb, var(--sl-accent) 14%, transparent); color:var(--sl-accent); font-weight:600; }
  .tag { font-size:.7rem; font-weight:700; padding:1px 7px; border-radius:4px; white-space:nowrap; letter-spacing:.02em; }
  .tag.store { color:#fff; }
  .tag.person { background:color-mix(in srgb, var(--info-color,#7b61ff) 15%, transparent); color:var(--info-color,#7b61ff); font-weight:600; border-radius:9px; }
  .tag.hash { background:var(--secondary-background-color,#eee); color:var(--secondary-text-color); font-weight:600; border-radius:9px; }
  .tag.s-filled.person, .tag.s-filled.hash { border-radius:4px; }
  .notes { padding:4px 12px 12px; display:grid; gap:10px; }
  .priceline { font-size:.78rem; color:var(--secondary-text-color); font-variant-numeric:tabular-nums; }
  .priceline b { color:var(--primary-text-color); font-weight:600; }
  .softchk { font-size:.74rem; color:var(--sl-accent); }
  .sumbar { display:flex; justify-content:space-between; align-items:center; gap:8px; padding:10px 16px; background:var(--secondary-background-color,#f2f2f2); font-variant-numeric:tabular-nums; }
  .sumbar small { color:var(--secondary-text-color); font-weight:400; }
  .edit .price-in { width:120px; }
  .tplbar { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:8px; padding:8px 12px 10px; }
  .tcard { position:relative; text-align:left; border:1px solid var(--divider-color,#ddd); border-radius:12px; padding:10px; background:var(--secondary-background-color,#f6f6f6); font:inherit; color:inherit; cursor:pointer; }
  .tcard b { display:block; overflow-wrap:anywhere; } .tcard small { color:var(--secondary-text-color); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .tcard.new { border-style:dashed; display:grid; place-items:center; color:var(--sl-accent); }
  .tcard .ed { position:absolute; top:4px; right:4px; }
  .bars { display:flex; align-items:flex-end; gap:6px; height:120px; margin:8px 0 22px; }
  .bars .b { flex:1; display:flex; flex-direction:column-reverse; border-radius:6px 6px 0 0; overflow:hidden; position:relative; min-height:2px; }
  .bars .b span { position:absolute; bottom:-18px; left:-4px; right:-4px; text-align:center; font-size:.68rem; color:var(--secondary-text-color); }
  .legend { display:flex; gap:10px; flex-wrap:wrap; font-size:.78rem; color:var(--secondary-text-color); }
  .legend i { display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:4px; vertical-align:-1px; }
  .statrow { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:2px 10px; padding:4px 0; }
  .statrow .bar2 { grid-column:1/-1; height:5px; border-radius:3px; background:var(--divider-color,#ddd); overflow:hidden; }
  .statrow .bar2 i { display:block; height:100%; background:var(--sl-accent); }
  .qr { display:grid; place-items:center; margin:8px 0; } .qr svg { width:180px; height:180px; border-radius:8px; }
  .sharelink { font:600 .78rem ui-monospace,monospace; overflow-wrap:anywhere; padding:8px; border-radius:8px; background:var(--secondary-background-color,#f2f2f2); }
  .aisle { display:flex; align-items:center; gap:8px; padding:6px 8px; border:1px solid var(--divider-color,#ddd); border-radius:10px; margin:5px 0; background:var(--secondary-background-color,#f6f6f6); }
  .aisle .n { width:22px; height:22px; border-radius:50%; background:var(--sl-accent); color:var(--text-primary-color,#fff); display:grid; place-items:center; font-size:.72rem; font-weight:700; flex:none; }
  .aisle .grow { flex:1; }
  .selbar { position:sticky; top:0; z-index:4; display:flex; flex-wrap:wrap; align-items:center; gap:6px; padding:8px 12px; margin:0 8px 6px;
    border-radius:12px; background:color-mix(in srgb, var(--sl-accent) 14%, var(--card-background-color,#fff)); }
  .selbar .grow { flex:1; min-width:90px; } .selbar .btn2 { height:32px; padding:0 12px; } .selbar .btn2:disabled { opacity:.45; cursor:default; }
  .row.selmode { cursor:pointer; user-select:none; } .row.selmode.sel { background:color-mix(in srgb, var(--sl-accent) 12%, transparent); }
  .row.selmode .selbox { display:grid; place-items:center; border-radius:6px; }
  .row.selmode .selbox.on { background:var(--sl-accent); border-color:var(--sl-accent); color:var(--text-primary-color,#fff); }
  .xdel { background:none; border:none; color:var(--secondary-text-color); cursor:pointer; font-size:1rem; padding:0 6px; }
  .xdel:hover { color:var(--error-color,#db4437); }
  .sumbar .btn2 { margin-left:8px; }
  .aisle .handle { cursor:grab; touch-action:none; user-select:none; font-size:1.1rem; padding:0 4px; color:var(--secondary-text-color); }
  .aisle.dragging { opacity:.5; } .aisle.drop { outline:2px dashed var(--sl-accent); outline-offset:1px; }
  .scanbox { position:relative; border-radius:12px; overflow:hidden; background:#000; aspect-ratio:4/3; margin:0 0 10px; }
  .scanbox video { width:100%; height:100%; object-fit:cover; display:block; }
  .scanbox::after { content:""; position:absolute; left:12%; right:12%; top:50%; height:2px; background:var(--error-color,#db4437); box-shadow:0 0 8px var(--error-color,#db4437); }
  .notes.grid { grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); }
  .notes.list { grid-template-columns:minmax(0,1fr); }
  .notecard { text-align:left; font:inherit; color:inherit; cursor:pointer; border:1px solid var(--divider-color,#e0e0e0); border-radius:12px;
    background:var(--secondary-background-color,#f6f6f6); padding:10px 12px; min-height:64px; display:flex; flex-direction:column; gap:4px; }
  .notecard:hover { border-color:var(--sl-accent); }
  .notecard .nt { font-weight:600; overflow-wrap:anywhere; }
  .notecard .nb { font-size:.86rem; color:var(--secondary-text-color); white-space:pre-wrap; overflow-wrap:anywhere;
    display:-webkit-box; -webkit-line-clamp:6; -webkit-box-orient:vertical; overflow:hidden; }
  .notes.list .notecard .nb { -webkit-line-clamp:2; }
  .notecard.done { opacity:.6; }
  .tag.s-outline { background:none !important; border:1px solid currentColor; padding:0 6px; }
  .tag.s-text { background:none !important; padding:0 2px; }
  .look-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .look-row input[type=color] { width:36px; height:30px; padding:0 2px; border:1px solid var(--divider-color,#ddd); border-radius:8px; background:none; cursor:pointer; flex:none; }
  .look-row input.icon { width:46px; text-align:center; height:30px; }
  .look-row select { width:auto !important; }
  .zchips { display:flex; flex-wrap:wrap; gap:6px; justify-content:flex-end; align-items:center; }
  .srow2.storerow { flex-wrap:wrap; align-items:flex-start; }
  .storerow .sl { flex:0 0 auto; min-width:90px; }
  .storerow .sl small { white-space:nowrap; margin-top:4px; }
  .storerow .zchips { flex:1 1 240px; }
  .storerow .zchips select { width:auto !important; min-width:110px; }
  .zchip { display:inline-flex; align-items:center; gap:2px; border:1px solid var(--divider-color,#ddd); border-radius:14px; padding:2px 4px 2px 10px; font-size:.8rem; }
  .zchip button { background:none; border:none; color:var(--secondary-text-color); cursor:pointer; font-size:1rem; line-height:1; padding:0 4px; }
  .tags { display:flex; gap:4px; margin-left:auto; flex-wrap:wrap; justify-content:flex-end; }
  .catemoji { text-align:center; }
  .offer { display:flex; flex-wrap:wrap; align-items:center; gap:6px; margin-top:2px; font-size:.78rem; color:var(--secondary-text-color); }
  .offer .olabel { font-weight:600; color:var(--success-color,#43a047); }
  .offer .oprice { font-weight:700; color:var(--primary-text-color); }
  .offer .oold { text-decoration:line-through; }
  .offer .odisc { font-weight:700; color:var(--error-color,#db4437); }
  .offer.expired .olabel, .offer.expired .odate { color:var(--error-color,#db4437); }
  .offer.expired .oprice { color:var(--secondary-text-color); }
  .row.checked .offer { opacity:.55; }
  .note { font-size:.8rem; color:var(--secondary-text-color); margin-top:1px; }
  .actions { display:flex; justify-content:flex-end; gap:2px; }
  .icon-btn { background:none; border:none; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center;
    color:var(--secondary-text-color); cursor:pointer; padding:0; flex:none; }
  .icon-btn:hover { background:var(--divider-color,#ddd); color:var(--primary-text-color); }
  .icon-btn.danger:hover { color:var(--error-color,#db4437); }
  .lock-ic { color:var(--secondary-text-color); opacity:.7; display:flex; padding:0 6px; }
  .edit { grid-column:1 / -1; display:flex; flex-wrap:wrap; gap:6px; padding:8px 16px 10px; background:var(--secondary-background-color,#f6f6f6); }
  .edit input, .edit select { background:var(--card-background-color,#fff); }
  .edit .text { flex:1 1 100%; } .edit .cat { flex:1 1 160px; } .edit .note-in { flex:2 1 200px; }
  .edit .btns { display:flex; gap:8px; flex:1 1 100%; justify-content:flex-end; }
  .btn { font:inherit; border:none; border-radius:8px; padding:6px 14px; cursor:pointer; background:none; color:var(--sl-accent); }
  .btn.primary { background:var(--sl-accent); color:var(--text-primary-color,#fff); }
  .btn.small { padding:4px 10px; font-size:.85rem; }
  .done-head { display:flex; align-items:center; gap:6px; padding:8px 8px 8px 16px; cursor:pointer; color:var(--secondary-text-color);
    font-size:.85rem; border-top:1px solid var(--divider-color,#e0e0e0); user-select:none; }
  .done-head .grow { flex:1; }
  .done-head .chev { transition:transform .15s; } .done-head.collapsed .chev { transform:rotate(-90deg); }
  .empty, .msg { padding:20px 16px; text-align:center; color:var(--secondary-text-color); }
  .msg.err { color:var(--error-color,#db4437); padding:8px 16px; }

  .compact .row { min-height:30px; padding-top:2px; padding-bottom:2px; }
  .compact .group-title { padding-top:4px; }
  .compact .head { padding-top:10px; }
  .row.press { cursor:default; -webkit-touch-callout:none; user-select:none; }
  .row.pressing { background:var(--secondary-background-color,#eee); transition:background .4s; }
  .morewrap { position:static; }
  .moreback { position:fixed; inset:0; z-index:7; }
  .menu.morepop { top:52px; right:10px; left:auto; width:260px; position:absolute; }
  .morepop .sortrow { cursor:default; padding:6px 10px; } .morepop .sortrow:hover { background:none; }
  .morepop .sortrow select { flex:1; min-width:0; width:auto; max-width:100%; box-sizing:border-box; margin:0; }
  ha-card { position:relative; }
  .menu { position:absolute; z-index:8; left:16px; right:16px; max-width:340px; margin:0 auto; background:var(--card-background-color,#fff);
    border-radius:12px; box-shadow:0 6px 24px rgba(0,0,0,.25); padding:6px; }
  .menu .mh { display:flex; align-items:center; gap:6px; padding:6px 8px 8px; font-weight:600; border-bottom:1px solid var(--divider-color,#e0e0e0); margin-bottom:4px; }
  .menu .mh span { flex:1; min-width:0; overflow-wrap:anywhere; }
  .ihist { padding:2px 6px 6px; max-height:300px; overflow:auto; }
  .ih { display:grid; grid-template-columns:96px minmax(0,1fr); gap:8px; padding:7px 4px; border-bottom:1px solid var(--divider-color,#e0e0e0); font-size:.88rem; }
  .ih:last-child { border-bottom:none; } .ih .a { color:var(--secondary-text-color); } .ih small { display:block; color:var(--secondary-text-color); font-size:.76rem; }
  .menu .mi { display:flex; align-items:center; gap:12px; width:100%; border:none; background:none; border-radius:8px; padding:10px; font:inherit;
    color:var(--primary-text-color); cursor:pointer; text-align:left; }
  .menu .mi:hover { background:var(--secondary-background-color,#eee); }
  .menu .mi.danger { color:var(--error-color,#db4437); }
  .menu .mi svg { color:var(--secondary-text-color); flex:none; } .menu .mi.danger svg { color:inherit; }
  .menu .mgrid { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:2px; }
  .menu .empty { padding:12px; }
  .backdrop { position:fixed; inset:0; z-index:7; }

  /* Einkaufsmodus */
  .shopbtn.on { color:var(--text-primary-color,#fff); background:var(--sl-accent); }
  .progress { height:4px; margin:0 16px 8px; border-radius:2px; background:var(--secondary-background-color,#eee); overflow:hidden; }
  .progress > div { height:100%; background:var(--success-color,#43a047); transition:width .3s; }
  .shopping .row.large { min-height:54px; font-size:1.08rem; }
  .shopping .row.large .box { width:28px; height:28px; }
  .shopping .row.tap { cursor:pointer; user-select:none; -webkit-user-select:none; -webkit-tap-highlight-color:transparent; }
  .snack { position:sticky; bottom:8px; margin:8px 16px; display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:10px;
    background:#323232; color:#fff; font-size:.9rem; z-index:4; }
  .snack span { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .snack button { border:none; background:none; color:#8ab4f8; font:inherit; font-weight:600; cursor:pointer; padding:2px 4px; }
  .uigrid { display:grid; grid-template-columns:auto 1fr; gap:6px 10px; align-items:center; font-size:.88rem; }
  .uigrid select { padding:6px 8px; }
  .checks { display:flex; flex-direction:column; gap:4px; font-size:.88rem; margin:6px 0; }
  .checks label, .inline-checks label { display:flex; align-items:center; gap:8px; cursor:pointer; }
  .own { color:var(--sl-accent); font-weight:700; margin-left:2px; }
  .inline-checks { display:flex; flex-wrap:wrap; gap:4px 14px; font-size:.85rem; }

  .tabs { display:flex; gap:4px; margin:10px 0 8px; }
  .tabs button { flex:1; border:1px solid var(--divider-color,#ddd); background:none; border-radius:8px; padding:7px; font:inherit; font-size:.88rem;
    cursor:pointer; color:var(--primary-text-color); }
  .tabs button.on { background:var(--sl-accent); border-color:var(--sl-accent); color:var(--text-primary-color,#fff); }
  textarea { font:inherit; width:100%; box-sizing:border-box; min-height:120px; resize:vertical; color:var(--primary-text-color);
    background:var(--secondary-background-color,#f2f2f2); border:1px solid transparent; border-radius:8px; padding:9px 11px; }
  textarea:focus { outline:none; border-color:var(--sl-accent); }
  .imp-src { width:100%; }
  .imp-prev { max-height:220px; overflow:auto; border:1px solid var(--divider-color,#e0e0e0); border-radius:8px; margin-top:8px; }
  .imp-prev .ir { display:flex; align-items:center; gap:8px; padding:5px 10px; font-size:.88rem; border-bottom:1px solid var(--divider-color,#eee); }
  .imp-prev .ir:last-child { border-bottom:none; }
  .imp-prev .ir.dupe { opacity:.45; }
  .imp-prev .ir .n { flex:1; min-width:0; overflow-wrap:anywhere; }
  .imp-prev .ir.checked .n { text-decoration:line-through; }

  .searchbar { display:flex; align-items:center; gap:6px; padding:0 16px 10px; }
  .searchbar input { flex:1; }
  .iname mark { background:color-mix(in srgb, var(--warning-color,#f5a623) 35%, transparent); color:inherit; border-radius:2px; padding:0 1px; }
  .nohits { padding:16px; text-align:center; color:var(--secondary-text-color); }
  .nohits .btn { margin-top:6px; }

  .settings { padding:4px 16px 16px; border-top:1px solid var(--divider-color,#e0e0e0); }
  .settings h3 { font-size:.95rem; font-weight:600; margin:14px 0 2px; }
  .settings .help { font-size:.8rem; color:var(--secondary-text-color); margin:0 0 8px; }
  .rule { display:flex; gap:6px; align-items:center; margin-bottom:6px; }
  .rule input { width:48px; text-align:center; font-weight:700; font-size:1.05rem; padding:6px; }
  .rule select { flex:1; padding:7px 9px; }
  .example { display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-size:.85rem; padding:8px 10px; border-radius:8px;
    background:var(--secondary-background-color,#f4f4f4); margin:6px 0; }
  .example code { font-family:ui-monospace,monospace; font-size:.8rem; color:var(--secondary-text-color); }
  .srow { display:flex; align-items:center; gap:8px; justify-content:flex-end; margin-top:6px; }
  .srow .ok { color:var(--success-color,#43a047); font-size:.85rem; }
  .learned { max-height:200px; overflow:auto; }
  .lrow { display:flex; align-items:center; gap:8px; padding:3px 0; font-size:.88rem; }
  .lrow .w { flex:1; }

  .row[draggable="true"] { cursor:grab; }
  .row.dragging { opacity:.4; }
  .row.dropbefore { box-shadow: inset 0 3px 0 var(--sl-accent); }
  ha-card.droptarget { outline:2px dashed var(--sl-accent); outline-offset:-4px; }
  .density-compact .row { min-height:30px; padding-top:2px; padding-bottom:2px; }
  .density-comfortable .row { min-height:var(--smartlists-row-height, 54px); }
  .density-comfortable .box { width:26px; height:26px; }
  .filterbar { display:flex; gap:6px; overflow-x:auto; padding:0 16px 8px; scrollbar-width:none; }
  .fchip.on { background:var(--sl-accent); border-color:var(--sl-accent); color:var(--text-primary-color,#fff); }
  .fixedfilter { padding:0 16px 6px; font-size:.78rem; color:var(--secondary-text-color); display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
  .tiles { display:grid; grid-template-columns:repeat(auto-fill,minmax(var(--smartlists-tile-size,110px),1fr)); gap:8px; padding:4px 16px 12px; }
  .tile { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; min-height:96px; padding:10px 6px;
    border-radius:12px; border:1px solid var(--divider-color,#e0e0e0); background:var(--card-background-color,#fff); cursor:pointer; text-align:center;
    font:inherit; color:var(--primary-text-color); }
  .tile:hover { border-color:var(--sl-accent); }
  .tile .te { font-size:1.8rem; line-height:1; }
  .tile .tn { font-size:.9rem; overflow-wrap:anywhere; }
  .tile .tq { font-size:.78rem; font-weight:700; color:var(--sl-accent); }
  .tile .tb { display:flex; gap:3px; flex-wrap:wrap; justify-content:center; }
  .tile.checked { opacity:.45; } .tile.checked .tn { text-decoration:line-through; }
  .tile:disabled { cursor:default; }
  .mini { display:flex; align-items:center; gap:10px; padding:14px 16px; cursor:pointer; }
  .mini .mt { font-weight:600; flex:1; min-width:0; }
  .mini .ms { font-size:.82rem; color:var(--secondary-text-color); display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
  .mini .mcount { font-size:1.6rem; font-weight:700; color:var(--sl-accent); }

  /* Zahnrad-Menü */
  .sl-settings { border-top:1px solid var(--divider-color,#e0e0e0); container-type:inline-size; }
  .sgrid { display:grid; grid-template-columns:minmax(0,1fr); }
  .snav { padding:12px 10px 14px; }
  .snav .search2 { margin:0 0 6px; height:36px; }
  .snav h4 { margin:14px 10px 4px; font-size:.76rem; font-weight:600; color:var(--secondary-text-color); }
  .snav h4 span { font-weight:400; }
  .snav button { display:block; width:100%; text-align:left; border:none; background:none; color:var(--primary-text-color); font:inherit; padding:8px 10px; border-radius:8px; cursor:pointer; }
  .snav button:hover { background:var(--secondary-background-color,#f2f2f2); }
  .snav button.on { color:var(--sl-accent); font-weight:600; background:color-mix(in srgb, var(--sl-accent) 10%, transparent); }
  .snav .ver { display:flex; justify-content:space-between; margin:16px 10px 0; font-size:.75rem; color:var(--secondary-text-color); }
  .snav .ver a { color:var(--sl-accent); text-decoration:none; }
  .smain { padding:14px 16px 4px; min-width:0; }
  .smain > header h2 { margin:0; font-size:1.3rem; font-weight:600; letter-spacing:-.01em; }
  .smain > header p { margin:2px 0 0; color:var(--secondary-text-color); font-size:.88rem; max-width:70ch; }
  .smain > header { margin-bottom:18px; }
  .sback { border:none; background:none; color:var(--sl-accent); font:inherit; padding:0 0 10px; cursor:pointer; }
  .sgrid:not(.detail) .smain { display:none; } .sgrid.detail .snav { display:none; }
  @container (min-width: 720px) {
    .sgrid { grid-template-columns:210px minmax(0,1fr); }
    .sgrid:not(.detail) .smain, .sgrid.detail .snav { display:block; }
    .snav { border-right:1px solid var(--divider-color,#e0e0e0); }
    .sback { display:none; }
    .smain { padding:20px 26px 6px; }
    .acols { columns:2 300px; column-gap:40px; }
  }
  .linkbtn { border:none; background:none; color:var(--sl-accent); font:inherit; padding:8px 0; cursor:pointer; }
  /* Gruppen ohne Kästen: Überschrift, feine Linien, Abstand */
  .sec { break-inside:avoid; margin:0 0 26px; }
  .sh { display:flex; align-items:baseline; gap:8px; }
  .sh h3 { margin:0; font-size:.82rem; font-weight:600; color:var(--secondary-text-color); flex:1; min-width:0; }
  .sh .cnt { font-size:.75rem; color:var(--secondary-text-color); white-space:nowrap; }
  .shelp { margin:2px 0 4px; padding:0; color:var(--secondary-text-color); font-size:.8rem; }
  .sbody { padding:0; }
  .srow2 { display:flex; align-items:center; gap:12px; padding:9px 0; border-top:1px solid var(--divider-color,#e0e0e0); }
  .sbody > .srow2:first-child, .chips + .srow2, .grp + .srow2 { border-top:none; }
  .srow2 .sl { flex:1; min-width:0; }
  .srow2 .sl small { display:block; color:var(--secondary-text-color); font-size:.76rem; overflow-wrap:anywhere; }
  .srow2 select { width:180px; flex:none; height:36px; padding:0 10px; }
  .srow2 .val { color:var(--secondary-text-color); font-size:.85rem; text-align:right; overflow-wrap:anywhere; }
  .grp { font-size:.8rem; font-weight:600; color:var(--secondary-text-color); margin:14px 0 2px; }
  .chips { display:flex; flex-wrap:wrap; gap:6px; }
  .chip2 { border:1px solid var(--divider-color,#ddd); background:none; color:var(--primary-text-color); border-radius:16px; padding:6px 12px; font:inherit; font-size:.85rem; cursor:pointer; }
  .chip2.on { background:color-mix(in srgb, var(--sl-accent) 18%, transparent); border-color:var(--sl-accent); color:var(--sl-accent); font-weight:600; }
  .switch { position:relative; width:38px; height:22px; flex:none; display:inline-block; }
  .switch input { opacity:0; width:0; height:0; position:absolute; }
  .switch span { position:absolute; inset:0; border-radius:11px; background:var(--divider-color,#ccc); transition:.15s; cursor:pointer; }
  .switch span::after { content:""; position:absolute; width:16px; height:16px; left:3px; top:3px; border-radius:50%; background:#bdbdbd; transition:.15s; }
  .switch input:checked + span { background:color-mix(in srgb, var(--sl-accent) 55%, transparent); }
  .switch input:checked + span::after { left:19px; background:var(--sl-accent); }
  .switch input:focus-visible + span { outline:2px solid var(--sl-accent); outline-offset:2px; }
  .rule2 { display:grid; grid-template-columns:44px 1fr 32px; gap:8px; align-items:center; margin-bottom:8px; }
  .rule2 .char { height:40px; text-align:center; font:700 1.1rem/1 ui-monospace, monospace; padding:0; }
  .rule2 select { height:40px; width:100%; }
  .preview2 { padding:10px 12px; border-radius:10px; background:var(--secondary-background-color,#f2f2f2); display:flex; flex-wrap:wrap; align-items:center; gap:6px; font-size:.85rem; }
  .preview2 code { color:var(--secondary-text-color); font-size:.8rem; }
  .preview2 .arrow { color:var(--secondary-text-color); }
  .acts { display:flex; justify-content:flex-end; align-items:center; gap:8px; margin-top:12px; flex-wrap:wrap; }
  .ok2 { margin-right:auto; color:var(--success-color,#43a047); font-size:.8rem; }
  .btn2 { height:36px; padding:0 14px; border-radius:18px; font:inherit; font-weight:500; cursor:pointer; border:1px solid var(--divider-color,#ddd); background:none; color:var(--sl-accent); }
  .btn2.primary { background:var(--sl-accent); border-color:var(--sl-accent); color:var(--text-primary-color,#fff); }
  .srow2 .icon-btn.up svg, .aisle .icon-btn.up svg, .icon-btn.up svg { transform:rotate(180deg); }
  .btn2.danger { color:var(--error-color,#db4437); }
  .search2 { width:100%; height:40px; box-sizing:border-box; }
  .packadd { display:flex; flex-direction:column; gap:8px; margin:4px 0 10px; }
  .packadd2 { display:flex; gap:8px; align-items:center; }
  .packadd2 select { flex:1 1 auto; min-width:0; height:40px; }
  .packadd2 .btn2, .btn2 { white-space:nowrap; flex:none; }
  .learned2 { max-height:236px; overflow:auto; margin-top:8px; border:1px solid var(--divider-color,#e0e0e0); border-radius:10px; }
  .lrow2 { display:grid; grid-template-columns:minmax(0,1fr) auto 30px; align-items:center; gap:8px; padding:4px 4px 4px 12px; border-bottom:1px solid var(--divider-color,#e0e0e0); }
  .lrow2:last-child { border-bottom:none; }
  .lrow2:nth-child(odd) { background:color-mix(in srgb, var(--secondary-background-color,#f2f2f2) 45%, transparent); }
  .lrow2 .w { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lrow2 select.cat { height:30px; max-width:170px; }
  .lrow2 .cat { font-size:.78rem; padding:3px 9px; border-radius:12px; background:var(--secondary-background-color,#eee); border:1px solid var(--divider-color,#ddd); white-space:nowrap; }
  .manual { font-size:.68rem; color:var(--sl-accent); margin-left:6px; }
  .foot2 { display:flex; justify-content:space-between; padding:0 4px; font-size:.75rem; color:var(--secondary-text-color); }
  .foot2 a { color:var(--sl-accent); text-decoration:none; }
`;

const WIZARD_STYLE = `
  .wiz-back { padding:16px; }
  .dlg.wiz { position:relative; max-width:960px; width:100%; padding:0; display:grid; grid-template-columns:minmax(0,1fr); max-height:94vh; overflow:auto;
    --sl-accent:var(--primary-color,#03a9f4); }
  .wside { display:none; padding:26px 18px; border-right:1px solid var(--divider-color,#e0e0e0); }
  .wside h1 { font-size:1.15rem; margin:0 0 2px; }
  .wsteps { list-style:none; margin:18px 0 0; padding:0; }
  .wsteps li { display:flex; gap:12px; align-items:center; padding:8px 6px; border-radius:8px; color:var(--secondary-text-color); cursor:pointer; }
  .wsteps li .n { width:24px; height:24px; border-radius:50%; border:1.5px solid var(--divider-color,#ccc); display:grid; place-items:center; font-size:.75rem; flex:none; }
  .wsteps li.now { color:var(--primary-text-color); font-weight:600; } .wsteps li.now .n { border-color:var(--sl-accent); color:var(--sl-accent); }
  .wsteps li.done .n { background:var(--success-color,#43a047); border-color:var(--success-color,#43a047); color:#fff; }
  .wpane { display:flex; flex-direction:column; min-width:0; min-height:520px; }
  .wbar { padding:16px 20px 0; } .wbar small { color:var(--secondary-text-color); }
  .wbar div { height:4px; border-radius:2px; background:var(--divider-color,#ddd); margin-top:8px; overflow:hidden; } .wbar i { display:block; height:100%; background:var(--sl-accent); }
  .wbody { padding:18px 20px 8px; flex:1; }
  .wbody h2 { font-size:1.35rem; font-weight:600; margin:0 0 4px; letter-spacing:-.01em; }
  .wbody .lead { margin:0 0 18px; color:var(--secondary-text-color); max-width:56ch; font-size:.95rem; }
  .m { color:var(--secondary-text-color); } .small { font-size:.82rem; }
  .wset { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:4px 16px; padding:10px 0; border-bottom:1px solid var(--divider-color,#e0e0e0); min-height:46px; }
  .wset small { display:block; color:var(--secondary-text-color); font-size:.8rem; }
  .wpick { display:flex; gap:12px; align-items:flex-start; width:100%; text-align:left; padding:12px 14px; border:1px solid var(--divider-color,#ddd); border-radius:10px;
    margin:0 0 10px; background:none; color:inherit; font:inherit; cursor:pointer; height:auto; }
  .wpick small { display:block; color:var(--secondary-text-color); font-size:.82rem; }
  .wpick .r { width:18px; height:18px; border-radius:50%; border:2px solid var(--secondary-text-color); margin-top:2px; flex:none; box-sizing:border-box; }
  .wpick.on { border-color:var(--sl-accent); background:color-mix(in srgb, var(--sl-accent) 7%, transparent); }
  .wpick.on .r { border-color:var(--sl-accent); background:radial-gradient(var(--sl-accent) 42%, transparent 48%); }
  .winset { margin:0 0 12px 30px; }
  .wchk { width:22px; height:22px; border-radius:6px; border:2px solid var(--secondary-text-color); background:none; padding:0; cursor:pointer; display:grid; place-items:center; color:#fff; }
  .wchk.on { background:var(--sl-accent); border-color:var(--sl-accent); } .wchk.on::after { content:"✓"; font-size:13px; line-height:1; }
  .wstores { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  .wstore { display:inline-flex; align-items:center; gap:8px; height:36px; padding:0 14px 0 10px; border:1px solid var(--divider-color,#ddd); border-radius:8px;
    background:none; color:var(--primary-text-color); font:inherit; line-height:1; cursor:pointer; }
  .wstore::before { content:""; box-sizing:border-box; width:18px; height:18px; border-radius:50%; border:1.5px solid var(--secondary-text-color); flex:none;
    display:grid; place-items:center; font-size:11px; line-height:1; }
  .wstore.on { border-color:var(--sl-accent); background:color-mix(in srgb, var(--sl-accent) 14%, transparent); }
  .wstore.on::before { content:"✓"; border-color:var(--sl-accent); background:var(--sl-accent); color:#fff; }
  .wrow { display:inline-flex; gap:8px; align-items:center; }
  .wchar { width:48px !important; text-align:center; font-weight:600; padding:0; }
  .werr { color:var(--error-color,#db4437); font-size:.85rem; margin:8px 0 0; min-height:1em; }
  .weg { margin:12px 0 0; padding:10px 12px; background:var(--secondary-background-color,#f2f2f2); border-radius:10px; display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  .weg code { color:var(--secondary-text-color); } .weg .q { color:var(--sl-accent); }
  .wsum { list-style:none; padding:0; margin:0; } .wsum li { padding:10px 0; border-bottom:1px solid var(--divider-color,#e0e0e0); display:flex; gap:10px; }
  .wsum li::before { content:"✓"; color:var(--success-color,#43a047); font-weight:700; }
  .wfoot { display:flex; align-items:center; gap:10px; padding:12px 20px 16px; border-top:1px solid var(--divider-color,#e0e0e0); position:sticky; bottom:0; background:var(--card-background-color,#fff); }
  .wfoot .grow { flex:1; } .wfoot .wl { display:none; }
  .wx { position:absolute; top:10px; right:10px; width:34px; height:34px; border-radius:50%; border:none; background:none; color:var(--secondary-text-color); cursor:pointer; font-size:1rem; }
  .dlg.wiz input, .dlg.wiz select { margin:0; width:auto; height:36px; }
  .dlg.wiz .wset select { width:180px; } .dlg.wiz .wset .search2 { width:200px; }
  @media (min-width: 760px) {
    .dlg.wiz { grid-template-columns:230px minmax(0,1fr); }
    .wside { display:block; } .wbar { display:none; }
    .wbody { padding:30px 34px 8px; } .wfoot { padding:14px 34px 18px; } .wfoot .wl { display:inline; }
  }
`;

const LIST_DIALOG_STYLE = `
  .lsd { align-items:flex-end; padding:0; }
  .lsheet { max-width:none; width:100%; max-height:92vh; overflow:auto; padding:0; border-radius:16px 16px 0 0; --sl-accent:var(--primary-color,#03a9f4); }
  .ltop { display:flex; align-items:center; gap:10px; padding:14px 18px 12px; border-bottom:1px solid var(--divider-color,#e0e0e0); position:sticky; top:0; background:var(--card-background-color,#fff); z-index:1; }
  .lwho { flex:1; min-width:0; display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; }
  .lwho h2 { margin:0; font-size:1.15rem; } .lwho small { color:var(--secondary-text-color); }
  .ltwo { display:grid; grid-template-columns:minmax(0,1fr); gap:0 40px; padding:18px 18px 0; }
  .lfoot { display:flex; align-items:center; gap:10px; padding:10px 18px 14px; border-top:1px solid var(--divider-color,#e0e0e0); }
  .lfoot .shelp { flex:1; margin:0; }
  .dlg.lsheet input, .dlg.lsheet select { width:auto; margin:0; height:36px; }
  /* Farbwähler (z. B. Farbe je Quell-Liste): sonst schrumpft er im Listen-Fenster auf einen Strich */
  .dlg.lsheet .look-row input[type=color], .dlg .look-row input[type=color] { width:44px; min-width:44px; height:32px; padding:2px; margin:0;
    border:1px solid var(--divider-color,#ccc); border-radius:8px; background:none; cursor:pointer; flex:none; box-sizing:border-box; }
  .dlg.lsheet .srow2 select { width:180px; }
  .dlg.lsheet button { height:auto; }
  .dlg.lsheet .btn2 { height:36px; } .dlg.lsheet .icon-btn { border:none; padding:0; }
  .dlg.lsheet .lfoot .ok { height:38px; }
  @media (min-width: 760px) {
    .lsd { align-items:center; padding:16px; }
    .lsheet { max-width:860px; border-radius:16px; }
    .ltwo:not(.one) { grid-template-columns:minmax(0,1fr) minmax(0,1fr); }
    .ltwo { padding:22px 24px 0; } .ltop, .lfoot { padding-left:24px; padding-right:24px; }
  }
`;

class SmartListsCard extends HTMLElement {
  setConfig(config) {
    const many = Array.isArray(config && config.entities) ? config.entities.filter(Boolean) : [];
    if (!config || (!config.entity && !many.length && config.view !== "mealplan")) throw new Error("Please set 'entity' (one list) or 'entities' (several).");
    if (many.length && !config.entity) return this._setupMulti(config, many);
    this._multi = null;
    this._rawConfig = config;
    this._initVersion = CARD_VERSION;
    if (this._config && this._config.entity !== config.entity) this._unsubscribe();
    this._config = { ...CARD_DEFAULTS, ...config };
    // alte Option group_by_category: false → A–Z
    if (config.group_by_category === false && !config.sort) this._config.sort = "alpha";
    let saved = null;
    try { saved = localStorage.getItem(`smartlists-sort:${config.entity}`); } catch (e) { /* privater Modus */ }
    this._sortMode = SORT_MODES.includes(saved) ? saved : this._config.sort;
    this._loadUi();
    this._shopping = !!this._config.start_shopping;
    this._menu = null;
    this._snack = null;
    this._data = null;
    this._editing = null;
    this._collapsedDone = this._config.collapse_completed !== false;
    this._showSettings = false;
    this._rev = null;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._resetDraft();
    this._suggest = debounce(() => this._fetchSuggestions(), 120);
    this._describe = debounce(() => this._fetchDescribe(), 200);
    this._render();
  }

  set hass(hass) {
    if (this._multi) { this._hass = hass; this._multi.children.forEach((c) => { c.hass = hass; }); this._renderMultiTabs(); return; }
    // Karte stammt noch aus einer älteren, inzwischen ersetzten Datei → einmal sauber neu aufbauen
    if (this._initVersion !== CARD_VERSION && (this._rawConfig || this._config)) {
      this._card = null; this._hass = null;
      this.setConfig(this._rawConfig || this._config);
    }
    const first = !this._hass;
    this._hass = hass;
    if (this._config.view === "mealplan") { this._renderMealPlanView(); return; }
    if (first || !this._cfg) this._loadConfig();
    if (first) this._loadUserUi();
    this._subscribe();
    const st = hass.states && hass.states[this._config.entity];
    const rev = st ? `${st.state}|${st.last_updated}` : "missing";
    if (rev !== this._rev) {
      const firstLoad = this._rev == null;
      this._rev = rev;
      this._load(!firstLoad);  // Zustandswechsel kommen auch von anderen → wie Hintergrund-Aktualisierung
    }
  }

  getCardSize() { return 6; }
  static getConfigElement() { return document.createElement("smartlists-card-editor"); }
  static getStubConfig(hass) {
    const st = (hass && hass.states) || {};
    const e = Object.keys(st).find((k) => k.startsWith("todo.") && !isNotesEntity(k, st[k].attributes && st[k].attributes.friendly_name));
    return { entity: e || "todo.einkaufsliste" };
  }

  get _lang() { return ((this._hass && this._hass.language) || "de").slice(0, 2); }
  get _t() { return TEXTS[this._lang] || TEXTS.en; }
  get _isAdmin() { return !this._hass.user || this._hass.user.is_admin; }
  _call(type, extra = {}, withEntity = true) {
    return this._hass.callWS({ type: `smartlists/${type}`, ...(withEntity ? { entity_id: this._config.entity } : {}), ...extra });
  }
  _resetDraft() {
    this._draft = { text: "", parsed: null, info: null, pickedCat: null, sugg: [], suggMode: "name", active: -1 };
  }

  // Nutzt jemand die Karte gerade (Bearbeiten, Eingabe, Menü, Dialog, Einstellungen, Ziehen)? Dann keine
  // Hintergrund-Aktualisierung zeichnen – sie wird nachgeholt, sobald man fertig ist.
  _busy() {
    const root = this.shadowRoot;
    const active = root && root.activeElement;
    const typing = active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName) && (active.value || active.tagName !== "INPUT");
    return !!(this._editing || this._menu || this._showSettings || this._showImport || this._dragging || SL_DRAG
      || (root && root.querySelector && root.querySelector(".dlg-back")) || typing);
  }
  _defer(fn) {
    this._deferredFns = this._deferredFns || new Set();
    this._deferredFns.add(fn);
    if (this._deferTimer) return;
    this._deferTimer = setInterval(() => {
      if (this._busy()) return;
      clearInterval(this._deferTimer); this._deferTimer = null;
      const fns = [...this._deferredFns]; this._deferredFns.clear();
      fns.forEach((f) => f());
    }, 1000);
  }

  async _loadConfig(live = false) {
    try {
      const cfg = await this._call("config", { language: this._lang }, false);
      const sig = JSON.stringify(cfg);
      if (live && sig === this._cfgSig) return;  // nichts geändert → nicht neu zeichnen
      if (live && this._busy()) { this._defer(() => this._loadConfig(true)); return; }
      this._cfgSig = sig;
      this._cfg = cfg;
      // Erster Start: Einrichtungs-Assistent einmal zeigen (nur Admins, nur eine Karte gleichzeitig)
      // …oder auf Wunsch über den Link der Integration (/smartlists?setup=1)
      let wanted = false;
      try { wanted = new URLSearchParams(window.location.search).get("setup") === "1"; } catch (e) { /* */ }
      if (cfg && (cfg.setup_needed || wanted) && this._isAdmin && !window.__smartlistsSetupOpen && !this._config.settings_only) {
        window.__smartlistsSetupOpen = true;
        if (wanted) {
          try { const u = new URL(window.location.href); u.searchParams.delete("setup"); window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash); } catch (e) { /* */ }
        }
        setTimeout(() => this._setupWizard(), 300);
      }
      if (this._cfg && this._cfg.appearance) SL_LOOK = this._cfg.appearance;
      if (this._input) { const ph = this._addPlaceholder(); this._input.placeholder = ph; this._input.setAttribute("aria-label", ph); }
      // Version der Integration für die Anzeige im Zahnrad (hilft bei „neue Funktion fehlt“)
      this._call("info", {}, false).then((i) => {
        this._version = i.version;
        // Integration neuer als diese Karte → Browser hat eine alte Karten-Datei zwischengespeichert
        if (i.version && i.version !== CARD_VERSION && !this._error) { this._error = this._t.stale_card; this._render(); }
      }).catch(() => {});
      this._render();
    } catch (e) {
      this._cfg = null;
    }
  }
  /* live = Aktualisierung im Hintergrund (andere haben etwas geändert, Abo, Minuten-Abgleich): zeichnet nur,
   * wenn sich wirklich etwas geändert hat, und nie während man gerade etwas bearbeitet (dann danach). */
  async _load(live = false) {
    try {
      const data = await this._call("get_list", { language: this._lang });
      if (!data || !Array.isArray(data.items)) throw new Error("Unexpected response from the SmartLists integration – please update the integration.");
      const sig = JSON.stringify(data);
      if (live && sig === this._dataSig && !this._error) return;
      if (live && this._busy()) { this._defer(() => this._load(true)); return; }
      this._dataSig = sig;
      // Rückfall: steht die ⚙OFFER-Zeile der App noch in der Notiz, hier selbst zerlegen
      for (const it of data.items) {
        if (!it.offer && it.note) { const r = parseOfferNote(it.note, this._cfg && this._cfg.known_stores); if (r.offer) { it.offer = r.offer; it.note = r.note; } }
      }
      if (data.type === "notes" && !this._notesApplied) {
        this._notesApplied = true;
        for (const [k, v] of Object.entries(NOTES_DEFAULTS)) if (!(k in (this._rawConfig || {}))) this._config[k] = v;
        this._sortMode = this._config.sort;
      }
      this._data = data;
      // Darstellung dieser Liste (für alle Geräte gemerkt): gilt, solange die Karte bzw. dieses Gerät nichts anderes festlegt
      const ls = data.settings || {};
      if (JSON.stringify(ls) !== this._listSettingsApplied) {
        this._listSettingsApplied = JSON.stringify(ls);
        const raw = this._rawConfig || {};
        if (!("show_prices" in raw)) this._config.show_prices = ls.show_prices !== false;
        // Kategorien je Liste ausgeschaltet: keine Gruppen, kein Symbol, keine Kategorie beim Eintippen
        // „Einfache Liste“ (z. B. Baumarkt): keine Kategorien, keine Vorschläge, nichts gemerkt
        this._plain = ls.plain === true;
        this._noCats = ls.categories === false || this._plain;
        let saved = null;
        try { saved = localStorage.getItem(`smartlists-sort:${this._config.entity}`); } catch (e) { /* */ }
        if (!SORT_MODES.includes(saved) && !("sort" in raw) && ls.sort) this._sortMode = ls.sort;
      }
      // noch nicht gespeicherte Stepper-Werte beibehalten (sonst springt die Anzeige zurück)
      for (const it of this._data.items) {
        const pend = this._qtyPending && this._qtyPending[it.uid];
        if (pend) { it.quantity = pend.quantity; it.pack_count = pend.pack_count; }
      }
      this._error = null;
    } catch (e) {
      this._error = (e && e.message) || this._t.error;
    }
    this._render();
    if (this._config.show_frequent) this._loadFrequent();
  }
  async _act(type, extra) {
    let result = null;
    try { result = await this._call(type, extra); this._error = null; } catch (e) { this._error = (e && e.message) || this._t.error; }
    await this._load();
    return result;
  }

  /* ---------------- Rückgängig ----------------
   * Jede Änderung merkt sich, wie sie sich zurücknehmen lässt. Die letzte bleibt über den
   * ↶-Knopf im Kopf erreichbar (bis zur nächsten Änderung), zusätzlich kurz als Leiste unten. */
  async _change(label, type, extra, makeUndo, { snack = true, snackMs = 5000 } = {}) {
    const before = this._error;
    const result = await this._act(type, extra);
    if (this._error && this._error !== before) return result;
    this._undo = makeUndo ? { label, run: makeUndo(result || {}) } : null;
    this._render();
    if (snack) this._showSnack(label, this._undo ? () => this._runUndo() : null, snackMs);
    return result;
  }
  async _runUndo() {
    const u = this._undo;
    if (!u) return;
    this._undo = null;
    this._snack = null;
    this._renderSnack();
    try { await u.run(); this._error = null; } catch (e) { this._error = (e && e.message) || this._t.error; }
    await this._load();
  }
  async _deleteItems(items, label) {
    if (!items.length) return;
    const t = this._t;
    const many = items.length > 1;
    const yes = await slDialog(this.shadowRoot, { title: many ? t.clear : t.delete, danger: true, ok: t.delete, cancel: t.cancel,
      text: many ? `${t.confirm_clear} (${items.length})` : `„${items[0].name}“ – ${t.confirm_delete}` });
    if (!yes) return;
    return this._change(label || `${items[0].name} ${this._t.deleted}`, "remove_items", { uids: items.map((i) => i.uid) },
      () => async () => { for (const i of items) await this._call("add_item", { text: i.text, note: i.note || "", checked: i.checked }); });
  }
  async _loadFrequent() {
    try {
      const r = await this._call("suggest", { query: "", limit: 10 });
      this._frequent = r.suggestions || [];
    } catch (e) { this._frequent = []; }
    this._renderFrequent();
  }

  /* ---------------- Rendering ---------------- */
  // Grundgerüst einmal bauen; Eingabefeld bleibt beim Neuladen der Liste erhalten (Fokus, Text).
  _ensureSkeleton() {
    if (this._card && this._skeletonVersion === CARD_VERSION) return;
    this._skeletonVersion = CARD_VERSION;
    const root = this.shadowRoot;
    this._headEl = h("div", { class: "head" });
    this._searchEl = h("div");
    this._filterEl = h("div");
    this._settingsEl = h("div");
    this._importEl = h("div");
    this._addEl = h("div");
    this._freqEl = h("div");
    this._tplEl = h("div");
    this._msgEl = h("div");
    this._listEl = h("div");
    this._progressEl = h("div");
    this._menuEl = h("div");
    this._moreEl = h("div", { class: "morewrap" });
    this._snackEl = h("div");
    this._card = h("ha-card", {}, this._headEl, this._searchEl, this._filterEl, this._progressEl, this._settingsEl, this._importEl, this._tplEl, this._addEl, this._freqEl, this._msgEl,
      this._listEl, this._snackEl, this._menuEl, this._moreEl);
    fill(root, h("style", {}, STYLE), this._card);
    this._bindDropZone();
    const density = this._config.compact ? "compact" : this._config.density;
    this._card.classList.toggle("compact", density === "compact");
    ["compact", "normal", "comfortable"].forEach((x) => this._card.classList.toggle(`density-${x}`, density === x));
    // Aussehen pro Karte: Akzentfarbe (Hex oder [r,g,b] vom Farbwähler), Eckenradius, Schriftgröße
    const acc = this._config.accent_color;
    const accent = Array.isArray(acc) ? `rgb(${acc.join(",")})` : acc;
    if (accent) this.style.setProperty("--smartlists-accent", accent); else this.style.removeProperty("--smartlists-accent");
    if (this._config.radius != null && this._config.radius !== "") this.style.setProperty("--smartlists-radius", `${Number(this._config.radius)}px`);
    else this.style.removeProperty("--smartlists-radius");
    const scale = Number(this._config.font_scale) || 1;
    this._card.style.zoom = scale !== 1 ? String(scale) : "";
    this._card.classList.toggle("shopping", this._shopping);
    if (this._config.max_height) this._listEl.style.cssText = `max-height:${Number(this._config.max_height)}px;overflow:auto`;
    if (this._shopping && this._ui && this._ui.shop_keep_awake) this._wake(true);
  }

  _render() {
    if (!this.shadowRoot) return;
    this._ensureSkeleton();
    const t = this._t;
    const d = this._data;
    if (!d) {
      fill(this._headEl, );
      fill(this._listEl, h("div", { class: `msg ${this._error ? "err" : ""}` }, this._error || t.loading));
      return;
    }
    const open = d.items.filter((i) => !i.checked);
    // Trefferzahl schon hier, der Kopf wird vor der Liste gezeichnet
    this._hitCount = this._searchQuery ? d.items.filter((i) => this._passesFilters(i) && this._matches(i, d)).length : 0;
    fill(this._headEl, 
      h("div", { class: "title" }, this._config.title || d.name),
      d.type === "combined" ? h("span", { class: "badge combined" }, t.combined) : null,
      // Antippen: mit wem die Liste geteilt ist (nur Anzeige; ändern im Zahnrad der Liste).
      // „privat“ nur, solange auch kein Link aktiv ist – sonst wäre das irreführend
      d.own && !(d.own.role === "owner" && !Object.keys(d.own.shares || {}).length && d.links) ? h("button", { type: "button", class: "badge own", title: `${t.owner}: ${d.own.owner || "?"} – ${t.sharing}`,
        "aria-haspopup": "dialog", onclick: () => this._sharedWithDialog(d) },
        d.own.role === "owner" ? (Object.keys(d.own.shares || {}).length ? `👥 ${t.shared}` : `🔒 ${t.private}`) : `👤 ${d.own.owner || "?"} · ${t["role_" + d.own.role]}`) : null,
      // Solange ein Teilen-Link gilt, ist die Liste im Internet erreichbar – deutlich zeigen; antippen = Links verwalten
      d.links ? h("button", { type: "button", class: "badge public", title: t.link_shared_help.replace("{n}", d.links),
        "aria-label": t.link_shared_help.replace("{n}", d.links), onclick: () => this._listDialog() },
        `🌐 ${t.link_shared}${d.links > 1 ? " · " + d.links : ""}`) : null,
      d.foreign ? h("span", { class: "badge foreign" }, t.foreign) : null,
      !this._config.show_count ? null : h("span", { class: "count" }, this._searchQuery
        ? `${this._hitCount ?? 0} ${t.hits}`
        : this._shopping ? `${d.items.length - open.length}/${d.items.length} ${t.in_cart}` : `${open.length} ${t.open}`),
      // Kopfzeile schlank: Suche, Rückgängig (wenn möglich), Einkaufsmodus und ⋯ – der Rest steckt im ⋯-Menü
      this._config.show_search ? iconBtn(this._search != null ? ICON.close : ICON.search, t.search, () => this._toggleSearch()) : null,
      this._undo && this._config.show_undo ? iconBtn(ICON.undo, `${t.undo}: ${this._undo.label}`, () => this._runUndo()) : null,
      !this._config.show_shopping || d.type === "notes" ? null : h("button", { class: `icon-btn shopbtn ${this._shopping ? "on" : ""}`, type: "button", "aria-pressed": String(this._shopping),
        title: this._shopping ? t.shop_off : t.shop_on, "aria-label": this._shopping ? t.shop_off : t.shop_on,
        onclick: () => this._toggleShopping() }, svg(ICON.cart, 18)),
      this._showSettings || this._showImport || this._showTpl
        ? iconBtn(ICON.close, t.cancel, () => { this._showSettings = false; this._showImport = false; this._showTpl = false; this._renderSettings(); this._renderImport(); this._renderTemplates(); this._render(); })
        : this._moreItems(d).length ? iconBtn(ICON.dots, t.more, () => { this._moreOpen = !this._moreOpen; this._renderMore(); }, "morebtn") : null
    );
    this._renderMore();
    const pct = d.items.length ? Math.round((100 * (d.items.length - open.length)) / d.items.length) : 0;
    fill(this._progressEl, this._shopping ? h("div", { class: "progress", role: "progressbar", "aria-valuenow": String(pct),
      "aria-valuemin": "0", "aria-valuemax": "100" }, h("div", { style: `width:${pct}%` })) : "");
    this._headEl.hidden = !this._config.show_header;
    if (this._config.settings_only) {
      // Seitenleiste → Einstellungen: nur das Menü, ohne Liste und Kopfzeile
      this._showSettings = true;
      [this._headEl, this._searchEl, this._filterEl, this._progressEl, this._addEl, this._freqEl, this._listEl].forEach((e) => { e.hidden = true; });
      if (!this._settingsRendered && this._cfg) { this._settingsRendered = true; this._renderSettings(); }
      fill(this._msgEl, this._error ? h("div", { class: "msg err" }, this._error) : "");
      return;
    }
    // Mini-Ansicht: nur eine Zusammenfassung, Antippen klappt die Liste auf
    const mini = this._config.view === "mini" && !this._miniOpen;
    [this._searchEl, this._filterEl, this._progressEl, this._addEl, this._freqEl].forEach((e) => { e.hidden = mini; });
    if (mini) { this._headEl.hidden = true; fill(this._listEl, this._renderMini(d)); fill(this._msgEl, this._error ? h("div", { class: "msg err" }, this._error) : ""); return; }
    if (this._config.view === "mini" && this._config.show_header) {
      this._headEl.prepend(iconBtn(ICON.chevron, this._t.mini_close, () => { this._miniOpen = false; this._render(); }, "collapse"));
    }
    this._renderFilterBar(d);
    this._renderTemplates();
    this._renderAdd();
    fill(this._msgEl, this._error ? h("div", { class: "msg err" }, this._error) : "");
    this._renderList();
  }

  /* ---------------- Mehrere Listen in einer Karte ----------------
   * entities: [todo.a, {entity: todo.b, title: "…", filter_store: "REWE"}] – jede Liste ist eine eigene
   * Karte mit denselben Optionen; layout: tabs (Reiter), columns (nebeneinander), stack (untereinander). */
  _setupMulti(config, many) {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._config = { ...CARD_DEFAULTS, ...config };
    const base = { ...config }; delete base.entities; delete base.type;
    const layout = ["tabs", "columns", "stack"].includes(config.layout) ? config.layout : "tabs";
    const children = many.map((e) => {
      const own = typeof e === "string" ? { entity: e } : { ...e };
      const card = document.createElement("smartlists-card");
      card.setConfig({ ...base, ...own, title: own.title || (layout === "tabs" ? "" : undefined) });
      if (this._hass) card.hass = this._hass;
      return card;
    });
    let active = 0;
    try { active = Math.min(children.length - 1, Number(localStorage.getItem(`smartlists-multi:${many.map((e) => e.entity || e).join(",")}`)) || 0); } catch (e) { /* */ }
    this._multi = { layout, children, active, key: `smartlists-multi:${many.map((e) => e.entity || e).join(",")}`, titles: many.map((e) => (typeof e === "object" && e.title) || null) };
    const style = h("style", {}, ":host{display:block} "
      + ".multi-tabs{display:flex;gap:6px;overflow-x:auto;padding:0 0 8px;scrollbar-width:none} .multi-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px} .multi-stack{display:flex;flex-direction:column;gap:12px}"
      + ".tab{flex:none;border:1px solid var(--divider-color,#ddd);background:var(--card-background-color,#fff);border-radius:18px;padding:6px 12px;font:inherit;font-size:.9rem;cursor:pointer;color:var(--primary-text-color);white-space:nowrap}"
      + ".tab.on{background:var(--smartlists-accent,var(--primary-color));border-color:var(--smartlists-accent,var(--primary-color));color:var(--text-primary-color,#fff)} .tab .n{font-size:.75rem;opacity:.75;margin-left:4px}");
    this._multiTabsEl = h("div", { class: "multi-tabs", role: "tablist" });
    const body = h("div", { class: layout === "tabs" ? "multi-tabs-body" : layout === "columns" ? "multi-cols" : "multi-stack" }, children);
    this.shadowRoot.replaceChildren(style, layout === "tabs" ? this._multiTabsEl : "", body);
    this._renderMultiTabs();
  }
  _renderMultiTabs() {
    const m = this._multi;
    if (!m || m.layout !== "tabs") return;
    m.children.forEach((c, i) => { c.hidden = i !== m.active; });
    const st = (this._hass && this._hass.states) || {};
    fill(this._multiTabsEl, m.children.map((c, i) => {
      const e = c._config.entity; const s = st[e];
      const name = m.titles[i] || (s && s.attributes.friendly_name) || e;
      return h("button", { type: "button", role: "tab", class: `tab ${i === m.active ? "on" : ""}`, "aria-selected": String(i === m.active),
        onclick: () => { m.active = i; try { localStorage.setItem(m.key, String(i)); } catch (err) { /* */ } this._renderMultiTabs(); } },
        name, s ? h("span", { class: "n" }, String(Number(s.state) || 0)) : null);
    }));
  }

  /* ---------------- Filter ----------------
   * Feste Filter aus der Karten-Konfiguration + Auswahl in der Filter-Leiste (nur für diese Sitzung). */
  _fixedFilters() {
    const c = this._config;
    const list = (v) => (Array.isArray(v) ? v : String(v || "").split(",")).map((x) => String(x).trim()).filter(Boolean);
    return { store: list(c.filter_store), person: list(c.filter_person), tag: list(c.filter_tag), category: list(c.filter_category), offers: !!c.filter_offers };
  }
  _passesFilters(it) {
    const f = this._fixedFilters();
    const has = (kind, values) => !values.length || (it.tags || []).some((t) => t.kind === kind && values.some((v) => v.toLowerCase() === String(t.value).toLowerCase()))
      || (kind === "store" && it.offer && values.some((v) => v.toLowerCase() === String(it.offer.store).toLowerCase()));
    if (!has("store", f.store) || !has("person", f.person) || !has("tag", f.tag)) return false;
    if (f.category.length && !f.category.includes(it.category)) return false;
    if (f.offers && !it.offer) return false;
    // Einkaufsmodus für einen Markt: nur dessen Artikel (optional auch solche ohne Markt)
    if (this._shopping && this._shopStore) {
      const stores = (it.tags || []).filter((t) => t.kind === "store").map((t) => String(t.value).toLowerCase());
      if (it.offer && it.offer.store) stores.push(String(it.offer.store).toLowerCase());
      if (stores.length ? !stores.includes(this._shopStore) : !(this._ui && this._ui.shop_untagged)) return false;
    }
    const chip = this._chip;
    if (chip) {
      if (chip.kind === "category") return it.category === chip.value;
      if (chip.kind === "offer") return !!it.offer;
      return has(chip.kind, [chip.value]);
    }
    return true;
  }
  /* Märkte & Zonen: In welcher Markt-Zone ist meine Person gerade? (zone.* → Markt aus smartlists/config) */
  _storeHere() {
    const zones = (this._cfg && this._cfg.store_zones) || {};
    const st = this._hass.states;
    const me = Object.values(st).find((s) => s.entity_id.startsWith("person.") && s.attributes.user_id === (this._hass.user && this._hass.user.id));
    if (!me) return null;
    for (const [store, list] of Object.entries(zones)) {
      // mehrere Zonen je Markt (Filialen); ältere Integration: eine Zone als Text
      for (const zone of Array.isArray(list) ? list : [list]) {
        const z = st[zone];
        if (!z) continue;
        // Person-Zustand = Name der Zone; zusätzlich: Zone zählt Personen (attributes.persons)
        if (me.state === z.attributes.friendly_name || (z.attributes.persons || []).includes(me.entity_id)) { this._shopZone = zone; return store; }
      }
    }
    return null;
  }
  // Leiste im Einkaufsmodus: Alle | REWE · 4 | Lidl · 2 … (Markt der aktuellen Zone vorausgewählt)
  _shopStoreBar(d) {
    const t = this._t;
    const open = d.items.filter((i) => !i.checked);
    const counts = new Map();
    for (const it of open) {
      const seen = new Set();
      (it.tags || []).filter((x) => x.kind === "store").forEach((x) => seen.add(JSON.stringify([String(x.value).toLowerCase(), x.label, x.color])));
      if (it.offer && it.offer.store) seen.add(JSON.stringify([String(it.offer.store).toLowerCase(), it.offer.store_label || it.offer.store, it.offer.color]));
      for (const k of seen) { const [key, label, color] = JSON.parse(k); const e = counts.get(key) || { key, label, color, n: 0 }; e.n++; counts.set(key, e); }
    }
    if (this._shopStore && !counts.has(this._shopStore)) counts.set(this._shopStore, { key: this._shopStore, label: this._shopStore.toUpperCase(), n: 0 });
    if (!counts.size) return null;
    const zones = (this._cfg && this._cfg.store_zones) || {};
    const chip = (key, label, n, color) => {
      const on = (this._shopStore || null) === key;
      return h("button", { type: "button", class: `fchip ${on ? "on" : ""}`, "aria-pressed": String(on),
        style: on && color ? `background:${color};border-color:${color};color:#fff` : "",
        onclick: () => { this._shopStore = key; this._render(); } }, key && zones[key] ? "📍 " : "", label, n != null ? ` · ${n}` : "");
    };
    return h("div", { class: "filterbar shopstores", role: "toolbar", "aria-label": t.shop_store },
      chip(null, t.shop_all_stores, open.length),
      [...counts.values()].sort((a, b) => b.n - a.n).map((c) => chip(c.key, c.label, c.n, c.color)));
  }
  _renderFilterBar(d) {
    const el = this._filterEl;
    if (!el) return;
    const f = this._fixedFilters();
    const fixed = [...f.store.map((v) => ({ kind: "store", value: v, label: v })), ...f.person.map((v) => ({ kind: "person", value: v, label: v })),
      ...f.tag.map((v) => ({ kind: "tag", value: v, label: v }))];
    const parts = [];
    if (this._shopping && !f.store.length) parts.push(this._shopStoreBar(d));
    if (fixed.length || f.category.length || f.offers) {
      parts.push(h("div", { class: "fixedfilter" }, "Filter:", fixed.map((x) => badge(x)),
        f.category.map((cid) => h("span", { class: "chip" }, (d.categories.find((c) => c.id === cid) || {}).label || cid)),
        f.offers ? h("span", { class: "chip" }, "🏷️ " + this._t.offer) : null));
    }
    if (this._config.show_filter_chips) {
      const open = d.items.filter((i) => !i.checked);
      const counts = new Map();
      const add = (key, chip) => { const e = counts.get(key) || { ...chip, n: 0 }; e.n++; counts.set(key, e); };
      for (const it of open) {
        (it.tags || []).forEach((t) => add(`${t.kind}:${String(t.value).toLowerCase()}`, { kind: t.kind, value: t.value, label: t.label }));
        if (it.offer) add("offer:", { kind: "offer", value: "", label: "🏷️ " + this._t.offer });
      }
      const chips = [...counts.values()].sort((a, b) => b.n - a.n).slice(0, 12);
      if (chips.length) {
        parts.push(h("div", { class: "filterbar", role: "toolbar" }, chips.map((c) => {
          const on = this._chip && this._chip.kind === c.kind && String(this._chip.value).toLowerCase() === String(c.value).toLowerCase();
          return h("button", { type: "button", class: `fchip ${on ? "on" : ""}`, "aria-pressed": String(on),
            onclick: () => { this._chip = on ? null : { kind: c.kind, value: c.value }; this._render(); } },
            c.kind === "person" ? "👤 " : c.kind === "tag" ? "#" : "", c.label, ` · ${c.n}`);
        })));
      }
    }
    fill(el, ...parts);
  }

  /* ---------------- Ziehen & Ablegen (Maus/Stift) ----------------
   * Auf eine andere SmartLists-Karte/Liste ziehen = verschieben (Strg/Alt = kopieren). Innerhalb der
   * Liste auf einen Artikel ziehen = davor einsortieren (nur bei Sortierung „Hinzugefügt“ und Listen,
   * die das können). Auf Touch-Geräten geht Verschieben über langes Drücken → Menü. */
  _bindDrag(row, it, d) {
    if (this._config.drag_drop === false || this._shopping) return;
    row.setAttribute("draggable", "true");
    row.addEventListener("dragstart", (e) => {
      SL_DRAG = { entity: this._config.entity, uid: it.uid, name: it.name, canRemove: !!it.permissions.delete };
      try { e.dataTransfer.effectAllowed = "copyMove"; e.dataTransfer.setData("text/plain", it.text || it.name); } catch (err) { /* */ }
      row.classList.add("dragging");
    });
    row.addEventListener("dragend", () => { SL_DRAG = null; row.classList.remove("dragging"); this._clearDropMarks(); });
    row.addEventListener("dragover", (e) => {
      if (!SL_DRAG || SL_DRAG.entity !== this._config.entity || SL_DRAG.uid === it.uid || !this._canReorder(d)) return;
      e.preventDefault(); e.stopPropagation();
      this._clearDropMarks(); row.classList.add("dropbefore");
    });
    row.addEventListener("drop", async (e) => {
      if (!SL_DRAG || SL_DRAG.entity !== this._config.entity || SL_DRAG.uid === it.uid || !this._canReorder(d)) return;
      e.preventDefault(); e.stopPropagation();
      const moving = SL_DRAG.uid; SL_DRAG = null; this._clearDropMarks();
      // HA erwartet den Vorgänger: den Artikel direkt vor dem Ziel (keiner = an den Anfang)
      const idx = d.items.findIndex((x) => x.uid === it.uid);
      const prev = d.items.slice(0, idx).reverse().find((x) => x.uid !== moving);
      const msg = { type: "todo/item/move", entity_id: this._config.entity, uid: moving };
      if (prev) msg.previous_uid = prev.uid;
      try { await this._hass.callWS(msg); this._error = null; } catch (err) { this._error = (err && err.message) || this._t.error; }
      this._load();
    });
  }
  _canReorder(d) { return this._sortMode === "added" && d.type !== "combined" && !!(d.permissions && d.permissions.reorder); }
  _clearDropMarks() {
    if (!this._card) return;
    this._card.classList.remove("droptarget");
    const walk = (n) => { if (n.classList) n.classList.remove("dropbefore"); (n.childNodes || []).forEach(walk); };
    walk(this._listEl);
  }
  _bindDropZone() {
    const card = this._card;
    card.addEventListener("dragover", (e) => {
      if (!SL_DRAG || SL_DRAG.entity === this._config.entity || !this._data || !this._data.permissions.add) return;
      e.preventDefault(); card.classList.add("droptarget");
    });
    card.addEventListener("dragleave", (e) => { if (e.target === card) card.classList.remove("droptarget"); });
    card.addEventListener("drop", async (e) => {
      if (!SL_DRAG || SL_DRAG.entity === this._config.entity) return;
      e.preventDefault(); card.classList.remove("droptarget");
      const src = SL_DRAG; SL_DRAG = null;
      const copy = !src.canRemove || e.ctrlKey || e.altKey;
      try {
        await this._hass.callWS({ type: "smartlists/move_item", entity_id: src.entity, uid: src.uid, target: this._config.entity, copy });
        this._showSnack(`${src.name} ${copy ? this._t.copied : this._t.moved} ${this._data.name}`);
        this._error = null;
      } catch (err) { this._error = (err && err.message) || this._t.error; }
      this._load();
    });
  }

  /* ---------------- Mini-Ansicht ---------------- */
  _renderMini(d) {
    const t = this._t;
    const open = d.items.filter((i) => !i.checked && this._passesFilters(i));
    const stores = new Map();
    open.forEach((i) => (i.tags || []).filter((x) => x.kind === "store").forEach((x) => stores.set(x.label, (stores.get(x.label) || { ...x, n: 0 })) && stores.get(x.label).n++));
    const today = new Date().toISOString().slice(0, 10);
    const ending = open.filter((i) => i.offer && i.offer.valid_until && i.offer.valid_until >= today).sort((a, b) => a.offer.valid_until.localeCompare(b.offer.valid_until))[0];
    const day = (iso) => { const p = String(iso).slice(0, 10).split("-"); return `${p[2]}.${p[1]}.`; };
    return h("div", { class: "mini", role: "button", tabindex: "0", title: t.mini_open,
      onclick: () => { this._miniOpen = true; this._render(); }, onkeydown: (e) => { if (e.key === "Enter") { this._miniOpen = true; this._render(); } } },
      h("span", { class: "mcount" }, String(open.length)),
      h("div", { class: "mt" }, this._config.title || d.name,
        h("div", { class: "ms" }, `${t.open}`, [...stores.values()].slice(0, 4).map((x) => [badge(x), ` ${x.n}`]),
          ending ? h("span", {}, `· 🏷️ ${ending.name} ${t.offer_until} ${day(ending.offer.valid_until)}`) : null)),
      svg(ICON.chevron, 20));
  }

  /* ---------------- Kachel-Ansicht ---------------- */
  _tile(it, d) {
    const cat = d.categories.find((c) => c.id === it.category);
    const p = it.permissions;
    const qty = it.quantity != null ? `${it.pack_count > 1 ? it.pack_count + "× " : ""}${fmtQty(it.quantity)}${it.unit ? " " + it.unit : ""}` : "";
    const tags = !this._config.show_tags ? [] : (it.tags || []).filter((x) => this._config.show_source || !x.implicit);
    const el = h("button", { type: "button", class: `tile ${it.checked ? "checked" : ""}`, disabled: !p.toggle, "aria-pressed": String(it.checked),
      title: it.name, onclick: () => { if (this._suppressClick) { this._suppressClick = false; return; } this._toggleItem(it); } },
      h("span", { class: "te" }, cat ? emojiOf(cat.label) : "📦"),
      h("span", { class: "tn" }, it.name),
      qty ? h("span", { class: "tq" }, qty) : null,
      tags.length || it.offer ? h("span", { class: "tb" }, tags.map(badge), it.offer && it.offer.price != null ? h("span", { class: "chip" }, `${it.offer.price.toFixed(2).replace(".", ",")} €`) : null) : null);
    this._bindPress(el, it, el);
    return el;
  }

  /* ---------------- Bedienung & Einkaufsmodus ---------------- */
  _deviceUi() {
    try { return JSON.parse(localStorage.getItem(UI_KEY) || "null"); } catch (e) { return null; }
  }
  // eingebaut < Haushalts-Standard < Benutzer < Gerät
  _loadUi() {
    this._ui = { ...UI_DEFAULTS, ...(this._houseUi || {}), ...(this._userUi || {}), ...(this._deviceUi() || {}) };
  }
  // Was im Einstellungs-Bereich für die gewählte Ebene angezeigt wird
  _scopeValues(scope) {
    if (scope === "household") return { ...UI_DEFAULTS, ...(this._houseUi || {}) };
    if (scope === "user") return { ...UI_DEFAULTS, ...(this._houseUi || {}), ...(this._userUi || {}) };
    return this._ui;
  }
  get _uiScope() {
    if (this._deviceUi()) return "device";
    return this._editScope === "household" && this._isAdmin ? "household" : "user";
  }
  async _loadUserUi() {
    try {
      const r = await this._call("user_settings", {}, false);
      this._houseUi = r.defaults || {};
      this._userUi = r.settings || {};
    } catch (e) { this._houseUi = {}; this._userUi = {}; }
    this._loadUi();
    if (this._data) this._renderList();
    if (this._showSettings) this._renderSettings();
  }
  async _saveUi(patch, scopeOverride) {
    const scope = scopeOverride || this._uiScope;
    if (scope === "device") {
      try { localStorage.setItem(UI_KEY, JSON.stringify({ ...this._deviceUi(), ...patch })); } catch (e) { /* */ }
    } else {
      // Benutzer: nur Abweichungen vom Haushalts-Standard speichern → Standard-Änderungen wirken weiter
      const base = scope === "household" ? { ...(this._houseUi || {}) } : { ...(this._userUi || {}) };
      const next = { ...base, ...patch };
      if (scope === "user") {
        const house = { ...UI_DEFAULTS, ...(this._houseUi || {}) };
        for (const k of Object.keys(next)) if (JSON.stringify(next[k]) === JSON.stringify(house[k])) delete next[k];
      }
      try {
        const r = await this._call("set_user_settings", { settings: next, scope }, false);
        this._houseUi = r.defaults || {};
        this._userUi = r.settings || {};
      } catch (e) { this._error = (e && e.message) || this._t.error; this._render(); return; }
    }
    this._loadUi();
    this._renderSettings();
    this._renderList();
  }
  _setScope(scope) {
    try {
      if (scope === "device") { if (!this._deviceUi()) localStorage.setItem(UI_KEY, JSON.stringify({ ...this._ui })); }
      else localStorage.removeItem(UI_KEY);
    } catch (e) { /* */ }
    this._editScope = scope;
    this._loadUi();
    this._renderSettings();
    this._renderList();
  }
  async _resetUi(scopeOverride) {
    const scope = scopeOverride || this._uiScope;
    if (scope === "device") { this._setScope("user"); return; }
    try {
      const r = await this._call("set_user_settings", { settings: {}, scope }, false);
      this._houseUi = r.defaults || {};
      this._userUi = r.settings || {};
    } catch (e) { /* */ }
    this._loadUi();
    this._renderSettings();
    this._renderList();
  }

  async _toggleShopping() {
    this._shopping = !this._shopping;
    if (this._shopping) { this._editing = null; this._closeMenu && this._closeMenu(); }  // offene Bearbeitung beenden
    this._shopStore = this._shopping && this._ui && this._ui.shop_auto_store !== false ? this._storeHere() : null;
    this._card.classList.toggle("shopping", this._shopping);
    if (this._shopping && this._ui.shop_keep_awake) await this._wake(true);
    if (!this._shopping) await this._wake(false);
    this._render();
    // „Bin im Laden“: Ereignis smartlists_shopping für Automationen/Blueprint (Markt = fester Filter, falls einer)
    const f = this._fixedFilters();
    const open = this._data ? this._data.items.filter((i) => !i.checked).length : null;
    this._call("shopping", { active: this._shopping, store: f.store.length === 1 ? f.store[0] : this._shopStore || null, open_items: open }).catch(() => {});
  }
  async _wake(on) {
    try {
      if (on && "wakeLock" in navigator) {
        this._wakeLock = await navigator.wakeLock.request("screen");
        if (!this._onVis) {
          // Wake Lock fällt beim Wechsel in den Hintergrund weg → beim Zurückkommen neu anfordern
          this._onVis = () => { if (document.visibilityState === "visible" && this._shopping && this._ui.shop_keep_awake) this._wake(true); };
          document.addEventListener("visibilitychange", this._onVis);
        }
      } else if (!on && this._wakeLock) {
        await this._wakeLock.release();
        this._wakeLock = null;
      }
    } catch (e) { /* nicht unterstützt (z.B. ohne HTTPS) */ }
  }
  connectedCallback() {
    if (this._hass) this._subscribe();
    // Badges & Farben geändert (in irgendeiner Karte) → neu zeichnen
    if (!this._onLook) { this._onLook = () => this._render(); window.addEventListener("smartlists-look-changed", this._onLook); }
  }
  disconnectedCallback() {
    this._wake(false); this._unsubscribe();
    if (this._onLook) { window.removeEventListener("smartlists-look-changed", this._onLook); this._onLook = null; }
  }

  // Live: Änderungen von anderen Geräten/Benutzern sofort zeigen (HA-eigenes todo/item/subscribe).
  // Der Zustand der Liste ändert sich z.B. beim Umbenennen nicht – darum reicht "hass" allein nicht.
  async _subscribe() {
    const conn = this._hass && this._hass.connection;
    if (!conn || this._unsub || this._subscribing) return;
    this._subscribing = true;
    const entity = this._config.entity;
    try {
      let first = true;
      this._unsub = await conn.subscribeMessage(() => {
        if (first) { first = false; return; } // erste Nachricht = aktueller Stand
        if (!this._reloadSoon) this._reloadSoon = debounce(() => this._load(true), 250);
        this._reloadSoon();
      }, { type: "todo/item/subscribe", entity_id: entity });
      // Haushaltsdaten (Kategorien, Preise, Vorlagen, Badges, Links …) live: neu laden, wenn sie sich ändern
      try {
        this._unsubData = await conn.subscribeMessage(() => {
          if (!this._dataSoon) this._dataSoon = debounce(async () => { await this._loadConfig(true); this._load(true); }, 800);
          this._dataSoon();
        }, { type: "smartlists/subscribe" });
      } catch (e) { this._unsubData = null; } // ältere Integration ohne smartlists/subscribe
      this._startLive();
    } catch (e) { this._unsub = null; } finally { this._subscribing = false; }
  }
  _unsubscribe() {
    if (this._unsub) { try { this._unsub(); } catch (e) { /* */ } this._unsub = null; }
    if (this._unsubData) { try { this._unsubData(); } catch (e) { /* */ } this._unsubData = null; }
    this._stopLive();
  }
  // Sicherheitsnetz für Tablets/Handys: nach dem Aufwachen bzw. Zurückkehren zum Tab und einmal pro Minute
  // still neu laden – falls unterwegs eine Meldung verloren ging (Funkloch, Energiesparen).
  _startLive() {
    if (this._liveTimer) return;
    this._hiddenAt = 0;
    this._onVisible = () => {
      if (document.visibilityState === "hidden") { this._hiddenAt = Date.now(); return; }
      if (this._hiddenAt && Date.now() - this._hiddenAt > 15000) { this._loadConfig(true); this._load(true); }
      this._hiddenAt = 0;
    };
    document.addEventListener("visibilitychange", this._onVisible);
    this._liveTimer = setInterval(() => { if (document.visibilityState !== "hidden" && this.isConnected !== false) this._load(true); }, 60000);
  }
  _stopLive() {
    clearInterval(this._liveTimer); this._liveTimer = null;
    if (this._onVisible) { document.removeEventListener("visibilitychange", this._onVisible); this._onVisible = null; }
  }

  async _toggleItem(it) {
    const checked = !it.checked;
    // Einkaufsmodus: jedes Abhaken mit Rückgängig-Leiste unten (3 s) – fängt Fehltipper auf der ganzen Zeile auf.
    // Sonst reicht ↶ im Kopf.
    await this._change(`${it.name} ${checked ? this._t.checked_off : this._t.unchecked}`, "update_item", { uid: it.uid, checked },
      () => () => this._call("update_item", { uid: it.uid, checked: !checked }), { snack: this._shopping, snackMs: 3000 });
  }
  _showSnack(text, undo, ms = 5000) {
    clearTimeout(this._snackTimer);
    this._snack = { text, undo };
    this._renderSnack();
    this._snackTimer = setTimeout(() => { this._snack = null; this._renderSnack(); }, ms);
  }
  _renderSnack() {
    if (!this._snackEl) return;
    const s = this._snack;
    fill(this._snackEl, s ? h("div", { class: "snack", role: "status" }, h("span", {}, s.text),
      s.undo ? h("button", { type: "button", onclick: () => { const u = s.undo; this._snack = null; this._renderSnack(); u(); } }, this._t.undo) : null) : "");
  }

  // Geste (lange drücken / Doppelklick / Rechtsklick) an Zeile oder Namen binden
  _bindPress(el, it, row) {
    const ui = this._ui;
    if (ui.press_gesture === "off" || this._shopping) return;  // Einkaufsmodus: kein Menü/Bearbeiten per Geste
    const fire = () => this._pressAction(it, row);
    if (ui.press_gesture === "double") { el.addEventListener("dblclick", (e) => { e.preventDefault(); fire(); }); return; }
    el.addEventListener("contextmenu", (e) => { e.preventDefault(); fire(); });
    if (ui.press_gesture !== "long") return;
    row.classList.add("press");
    let timer = null, start = null;
    const cancel = () => { clearTimeout(timer); timer = null; row.classList.remove("pressing"); };
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.target.closest("button")) return;
      start = [e.clientX, e.clientY];
      row.classList.add("pressing");
      timer = setTimeout(() => {
        timer = null;
        row.classList.remove("pressing");
        // Den Klick direkt nach dem Loslassen schlucken – aber nur kurz, sonst ginge der nächste
        // echte Tipper verloren (auf Touch-Geräten folgt einem langen Druck oft gar kein Klick).
        this._suppressClick = true;
        setTimeout(() => { this._suppressClick = false; }, 400);
        fire();
      }, LONG_PRESS_MS);
    });
    el.addEventListener("pointermove", (e) => { if (timer && start && Math.hypot(e.clientX - start[0], e.clientY - start[1]) > 8) cancel(); });
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => el.addEventListener(ev, cancel));
  }
  _pressAction(it, row) {
    const r = this._ui.press_result;
    const p = it.permissions;
    if (r === "edit" && p.rename) { this._editing = it.uid; this._renderList(); return; }
    if (r === "delete" && p.delete) { this._deleteItems([it]); return; }
    this._openMenu(it, row, "main");
  }

  async _openMenu(it, row, view) {
    this._menu = { it, row, view };
    if ((view === "move" || view === "copy") && !this._targets) {
      try { this._targets = (await this._call("lists", {}, false)).lists; } catch (e) { this._targets = []; }
    }
    this._renderMenu();
  }
  _closeMenu() { this._menu = null; this._renderMenu(); }
  _renderMenu() {
    const el = this._menuEl;
    if (!el) return;
    const m = this._menu;
    if (!m) return fill(el, );
    const t = this._t;
    const it = m.it;
    const p = it.permissions;
    const d = this._data;
    const top = Math.max(8, m.row.offsetTop + m.row.offsetHeight - 4);
    const head = (title, back) => h("div", { class: "mh" },
      back ? iconBtn(ICON.back, t.cancel, () => this._openMenu(it, m.row, "main")) : null,
      h("span", {}, title), iconBtn(ICON.close, t.cancel, () => this._closeMenu()));
    const item = (icon, label, onclick, cls = "") => h("button", { class: `mi ${cls}`, type: "button", onclick }, svg(icon, 20), label);
    let body;
    if (m.view === "main") {
      const allowed = {
        rename: p.rename, move: p.delete, copy: true, category: !this._noCats, delete: p.delete,
      };
      const icons = { rename: ICON.pencil, move: ICON.move, copy: ICON.copy, category: ICON.tagIcon, delete: ICON.trash };
      const actions = (this._ui.menu_actions || MENU_ACTIONS).filter((a) => allowed[a]);
      body = [head(it.name), ...actions.map((a) => item(icons[a], t["m_" + a], () => {
        if (a === "rename") { this._closeMenu(); this._editing = it.uid; this._renderList(); }
        else if (a === "delete") { this._closeMenu(); this._deleteItems([it]); }
        else this._openMenu(it, m.row, a);
      }, a === "delete" ? "danger" : ""))];
      if (!actions.length) body.push(h("div", { class: "empty" }, t.readonly));
      if (d.type !== "notes") body.push(item(ICON.check, t.m_select, () => this._startSelect(it)));
      if (d.type !== "notes") body.push(item(ICON.history, t.ih_title, () => this._openMenu(it, m.row, "history")));
    } else if (m.view === "move" || m.view === "copy") {
      const targets = (this._targets || []).filter((l) => l.entity_id !== this._config.entity && l.can_add
        && (l.type === "notes") === (d.type === "notes"));
      body = [head(t["m_" + m.view], true), targets.length
        ? targets.map((l) => item(ICON.list, l.name, async () => {
          this._closeMenu();
          const copy = m.view === "copy";
          const source = this._config.entity;
          await this._change(`${it.name} ${copy ? t.copied : t.moved} ${l.name}`, "move_item", { uid: it.uid, target: l.entity_id, copy },
            (res) => () => copy
              ? this._call("remove_items", { entity_id: l.entity_id, uids: [res.uid] }, false)
              : this._call("move_item", { entity_id: l.entity_id, uid: res.uid, target: source, copy: false }, false));
        }))
        : h("div", { class: "empty" }, t.no_targets)];
    } else if (m.view === "history") {
      // Wer hat den Artikel wann hinzugefügt, abgehakt, umbenannt, gelöscht
      const listEl = h("div", { class: "empty" }, t.loading);
      body = [head(t.ih_title, true), listEl];
      this._call("item_history", { name: it.name }).then((r) => {
        const fmtT = (ts) => new Date(ts * 1000).toLocaleString(this._hass.language || "de", { dateStyle: "short", timeStyle: "short" });
        if (!r.entries.length) return fill(listEl, t.ih_none);
        listEl.className = "ihist";
        fill(listEl, r.entries.map((e) => h("div", { class: "ih" },
          h("span", { class: "a" }, t["ih_" + e.a] || e.a),
          h("span", { class: "w" }, e.a === "rename" ? `${e.old} → ${e.text}` : e.text,
            h("small", {}, `${e.link ? (e.by ? `${e.by} · ${t.ih_link}` : t.ih_link) : e.user_name || t.ih_auto} · ${fmtT(e.t)}`)))));
      }).catch(() => fill(listEl, t.error));
    } else if (m.view === "category") {
      body = [head(t.m_category, true), h("div", { class: "mgrid" }, d.categories.map((c) => item("", c.label, async () => {
        this._closeMenu();
        await this._call("set_category", { name: it.name, category: c.id }, false);
        await this._load();
      }, c.id === it.category ? "sel" : "")))];
    }
    fill(el, h("div", { class: "backdrop", onclick: () => this._closeMenu() }),
      h("div", { class: "menu", role: "menu", style: `top:${top}px` }, body));
  }

  /* ---------------- Angebote aus der App ----------------
   * Die App speichert Angebote als ⚙OFFER-Zeile in der Notiz; die Integration liefert sie zerlegt
   * als it.offer. Markt-Badge nur, wenn nicht schon ein @Markt-Tag dasselbe zeigt. */
  _offerLine(it, tags) {
    const o = it.offer;
    const t = this._t;
    const euro = (v) => `${v.toFixed(2).replace(".", ",")} €`;
    const day = (iso) => { const p = String(iso).slice(0, 10).split("-"); return p.length === 3 ? `${p[2]}.${p[1]}.` : iso; };
    const hasStoreTag = tags.some((x) => x.kind === "store" && x.label.toLowerCase() === String(o.store_label).toLowerCase());
    return h("div", { class: `offer ${o.expired ? "expired" : ""}` },
      hasStoreTag ? null : badge({ kind: "store", value: o.store, label: o.store_label, color: o.color }),
      h("span", { class: "olabel" }, "🏷️ " + t.offer),
      o.price != null ? h("span", { class: "oprice" }, euro(o.price)) : null,
      o.old_price != null ? h("span", { class: "oold" }, euro(o.old_price)) : null,
      o.discount ? h("span", { class: "odisc" }, o.discount) : null,
      o.valid_until ? h("span", { class: "odate" }, o.expired ? `${t.offer_expired} ${day(o.valid_until)}` : `${t.offer_until} ${day(o.valid_until)}`) : null);
  }

  /* ---------------- Mengen-Stepper ----------------
   * Wie in der App: ±1, nie unter 0; bei Mehrfachpackungen ("4× 150 g") ändert sich die Anzahl
   * der Packungen (nie unter 1). Schnelles Tippen wird gesammelt und nach kurzer Pause einmal
   * gespeichert; die Anzeige ändert sich sofort. */
  _stepQty(it, delta) {
    const multi = it.pack_count > 1;
    if (multi) it.pack_count = Math.max(1, it.pack_count + delta);
    else it.quantity = Math.max(0, Math.round(((it.quantity || 0) + delta) * 1000) / 1000);
    this._qtyPending = this._qtyPending || {};
    const entry = this._qtyPending[it.uid] || { original: it.text, timer: null };
    clearTimeout(entry.timer);
    entry.quantity = it.quantity;
    entry.pack_count = it.pack_count;
    this._qtyPending[it.uid] = entry;
    this._renderList();
    entry.timer = setTimeout(() => {
      delete this._qtyPending[it.uid];
      const parsed = parseText(entry.original, this._cfg.tag_rules, this._cfg.known_stores);
      const text = encodeText({ ...parsed, quantity: it.quantity, pack_count: it.pack_count }, this._cfg.tag_rules);
      if (text === entry.original) return;
      this._change(`${it.name}: ${this._t.qty_changed}`, "update_item", { uid: it.uid, text },
        () => () => this._call("update_item", { uid: it.uid, text: entry.original }), { snack: false });
    }, 600);
  }

  /* ---------------- Suche ---------------- */
  get _searchQuery() { return this._search ? searchKey(this._search.trim()) : ""; }

  _toggleSearch() {
    if (this._search != null) { this._search = null; fill(this._searchEl); this._searchInput = null; }
    else { this._search = ""; this._renderSearch(); setTimeout(() => this._searchInput && this._searchInput.focus(), 0); }
    this._render();
  }
  _renderSearch() {
    if (this._search == null) return fill(this._searchEl);
    if (this._searchInput) return; // Feld bleibt beim Neuzeichnen erhalten (Fokus, Cursor)
    const t = this._t;
    this._searchInput = h("input", { type: "search", placeholder: t.search_placeholder, "aria-label": t.search, value: this._search, autocomplete: "off",
      oninput: (e) => { this._search = e.target.value; this._render(); },
      onkeydown: (e) => { if (e.key === "Escape") this._toggleSearch(); } });
    fill(this._searchEl, h("div", { class: "searchbar" }, this._searchInput));
  }
  // Treffer in Name, Notiz, Tags, Quelle und Kategorie
  _matches(it, d) {
    const q = this._searchQuery;
    if (!q) return true;
    const cat = d.categories.find((c) => c.id === it.category);
    const hay = [it.name, it.note, it.source, cat && cat.label, ...(it.tags || []).map((x) => x.label),
      ...(it.offer ? [it.offer.store_label, this._t.offer] : [])].map(searchKey).join("\n");
    return q.split(/\s+/).every((w) => hay.includes(w));
  }
  // Treffer im Namen markieren (Position über die normalisierte Form, Länge bleibt bis auf ß gleich)
  _highlight(name) {
    const q = this._searchQuery;
    if (!q) return name;
    const word = q.split(/\s+/)[0];
    const i = searchKey(name).indexOf(word);
    if (i < 0 || /ß/.test(name)) return name;
    return [name.slice(0, i), h("mark", {}, name.slice(i, i + word.length)), name.slice(i + word.length)];
  }

  _sortSelect(d) {
    const t = this._t;
    const modes = SORT_MODES.filter((m) => (m !== "list" || d.type === "combined") && !(m === "category" && this._noCats));
    return h("label", { class: "sort", title: t.sort },
      svg(ICON.sort, 16),
      h("select", { "aria-label": t.sort, onchange: (e) => {
        this._sortMode = e.target.value;
        try { localStorage.setItem(`smartlists-sort:${this._config.entity}`, this._sortMode); } catch (err) { /* */ }
        this._renderList();
      } }, modes.map((m) => h("option", { value: m, selected: m === this._sortMode }, t["sort_" + m]))));
  }

  /* ---------------- Eingabe ---------------- */
  _renderAdd() {
    if (!this._config.show_add) return fill(this._addEl);
    const d = this._data;
    if (d.type === "notes") {
      // Notizliste: kein Schnell-Eingabefeld (Mengen/Tags/Kategorie), sondern „Neue Notiz“ mit Titel + Text
      this._addAllowed = null;
      return fill(this._addEl, d.permissions.add
        ? h("div", { class: "acts", style: "margin:4px 12px 8px;justify-content:flex-start" },
          h("button", { class: "btn2 primary", type: "button", onclick: () => this._noteDialog(null) }, "＋ " + this._t.note_new),
          h("button", { class: "btn2", type: "button", title: this._t.note_view, "aria-label": this._t.note_view, onclick: () => {
            this._notesGrid = !this._notesView();
            try { localStorage.setItem("smartlists-notes-grid", this._notesGrid ? "1" : "0"); } catch (e) { /* */ }
            this._renderList();
          } }, this._notesView() ? "☰" : "▦"))
        : h("div", { class: "locked" }, svg(ICON.lock, 16), this._t.no_add));
    }
    const allowed = d.permissions.add;
    if (this._addAllowed === allowed && this._addEl.firstChild) return;
    this._addAllowed = allowed;
    if (!allowed) {
      fill(this._addEl, h("div", { class: "locked" }, svg(ICON.lock, 16), this._t.no_add));
      return;
    }
    const t = this._t;
    this._input = h("input", { class: "smart", placeholder: this._addPlaceholder(), value: this._draft.text, autocomplete: "off",
      enterkeyhint: "done", "aria-label": this._addPlaceholder(),
      oninput: () => this._onInput(), onkeydown: (e) => this._onKey(e),
      onfocus: () => { this._focused = true; this._renderFrequent(); },
      onblur: () => setTimeout(() => { this._focused = false; this._closeSugg(); this._renderFrequent(); }, 150) });
    this._goBtn = h("button", { class: "go", type: "button", title: this._addPlaceholder(), onclick: () => this._submit() }, svg(ICON.plus));
    this._previewEl = h("div", { class: "preview" });
    this._suggEl = h("ul", { class: "sugg", role: "listbox", hidden: true });
    this._pickEl = h("div", { class: "catpick", hidden: true });
    const scanBtn = this._config.show_scan !== false ? iconBtn(ICON.barcode, t.scan, () => this._scanDialog(), "scanbtn") : null;
    fill(this._addEl, h("div", { class: "add" }, h("div", { class: "add-row" }, this._input, scanBtn, this._goBtn), this._previewEl, this._suggEl, this._pickEl));
    this._renderPreview();
  }

  // Beispiel im Eingabefeld: allgemein und mit dem Markt-Zeichen der eigenen Namenskonvention ("@Markt", "!Markt" …)
  _addPlaceholder() {
    const t = this._t;
    const rule = ((this._cfg && this._cfg.tag_rules) || [{ kind: "store", prefix: "@" }]).find((r) => r.kind === "store");
    return t.add_placeholder.replace("{store}", rule ? rule.prefix + t.add_ph_store : "").trim();
  }

  _onInput() {
    const text = this._input.value;
    if (!text.trim()) { this._resetDraft(); this._renderPreview(); this._closeSugg(); this._renderFrequent(); return; }
    this._draft.text = text;
    const [noPrice, price] = splitPrice(text);
    this._draft.price = price;
    this._draft.parsed = this._cfg ? parseText(noPrice, this._cfg.tag_rules, this._cfg.known_stores, true) : null;
    this._renderPreview();
    this._renderFrequent();
    this._suggest();
    this._describe();
  }

  async _fetchDescribe() {
    const p = this._draft.parsed;
    if (!p || !p.name) return;
    const name = p.name;
    try {
      const r = await this._call("describe", { texts: [name] }, false);
      if (this._draft.parsed && this._draft.parsed.name === name) {
        this._draft.info = r.items[0];
        this._renderPreview();
      }
    } catch (e) { /* Vorschau ist optional */ }
  }

  async _fetchSuggestions() {
    const text = this._draft.text;
    if (!text.trim()) return this._closeSugg();
    try {
      const r = await this._call("suggest", { query: text, limit: 8 });
      if (this._draft.text !== text) return;
      this._draft.sugg = r.suggestions || [];
      this._draft.suggMode = r.mode;
      this._draft.active = -1;
      this._renderSugg();
    } catch (e) { this._closeSugg(); }
  }

  _renderPreview() {
    const el = this._previewEl;
    if (!el) return;
    const t = this._t;
    const p = this._draft.parsed;
    if (this._goBtn) this._goBtn.disabled = !(p && p.name);
    if (!p || !p.name) return fill(el, );
    const info = this._draft.info && this._draft.info.name === p.name ? this._draft.info : null;
    const catId = this._draft.pickedCat || (info && info.category);
    const cat = catId && this._cfg ? this._cfg.categories.find((c) => c.id === catId) : null;
    const source = this._draft.pickedCat ? "manual" : info ? info.category_source : null;
    const unit = p.unit || (p.quantity != null && info && info.unit_hint && !this._plain) || null;
    fill(el, 
      h("span", {}, p.name),
      p.quantity != null ? h("span", { class: "chip qty" }, `${p.pack_count > 1 ? p.pack_count + "× " : ""}${fmtQty(p.quantity)}${unit ? " " + unit : ""}`) : null,
      this._noCats ? null : h("button", { class: `catchip ${source === "manual" ? "manual" : ""}`, type: "button", title: t.category,
        onmousedown: (e) => e.preventDefault(), onclick: () => this._togglePicker() },
        cat ? cat.label : "…", source ? h("span", { class: "src" }, "· " + t["src_" + source]) : null),
      p.quantity == null && info && info.unit_hint && !this._plain ? h("span", { class: "hint" }, `${t.unit_hint}: ${info.unit_hint}`) : null,
      this._draft.price != null && this._config.show_prices !== false ? h("span", { class: "chip qty" }, fmtMoney(this._draft.price, this._hass.language)) : null,
      p.tags.map(badge)
    );
  }

  _togglePicker() {
    const el = this._pickEl;
    if (!el.hidden) { el.hidden = true; return; }
    const current = this._draft.pickedCat || (this._draft.info && this._draft.info.category);
    this._closeSugg();
    fill(el, 
      ...this._cfg.categories.map((c) => h("button", { type: "button", class: c.id === current ? "sel" : "",
        onmousedown: (e) => e.preventDefault(), onclick: () => this._pickCategory(c.id) }, c.label)),
      this._draft.pickedCat ? h("button", { type: "button", class: "auto", onmousedown: (e) => e.preventDefault(),
        onclick: () => this._pickCategory(null) }, "↺ " + this._t.src_pack) : null
    );
    el.hidden = false;
  }
  _pickCategory(id) {
    this._draft.pickedCat = id;
    this._pickEl.hidden = true;
    this._renderPreview();
    this._input && this._input.focus();
  }

  _renderSugg() {
    const el = this._suggEl;
    if (!el) return;
    const list = this._draft.sugg;
    if (!list.length || !this._focused) return this._closeSugg();
    const t = this._t;
    const present = new Set((this._data ? this._data.items.filter((i) => !i.checked) : []).map((i) => i.name.toLowerCase()));
    const q = (this._draft.parsed && this._draft.parsed.name.toLowerCase()) || "";
    const bold = (name) => {
      const i = name.toLowerCase().indexOf(q);
      return i < 0 || !q ? name : [name.slice(0, i), h("b", {}, name.slice(i, i + q.length)), name.slice(i + q.length)];
    };
    fill(el, ...list.map((s, i) => {
      const isTag = this._draft.suggMode === "tag";
      return h("li", { role: "option", class: i === this._draft.active ? "active" : "",
        onmousedown: (e) => { e.preventDefault(); this._applySugg(i); } },
        isTag ? badge(s) : h("span", { class: "e" }, this._noCats ? "" : emojiOf(s.category_label)),
        h("span", { class: "n" }, isTag ? "" : bold(s.name)),
        !isTag && present.has(s.name.toLowerCase()) ? h("span", { class: "in" }, t.in_list) : null,
        !isTag && s.unit ? h("span", { class: "u" }, s.unit) : null,
        h("span", { class: "s" }, s.source === "history" ? svg(ICON.history, 15) : s.source === "list" ? svg(ICON.list, 15) : ""));
    }));
    el.hidden = false;
    const act = el.querySelector("li.active");
    if (act && act.scrollIntoView) act.scrollIntoView({ block: "nearest" });
  }
  _closeSugg() {
    if (this._suggEl) this._suggEl.hidden = true;
    this._draft.active = -1;
  }

  // Markt/Person/Schlagwort beim Bearbeiten: „@R“ → Auswahl wie im Eingabefeld (@REWE …). Gibt die Liste zurück,
  // die unter das Feld gehört; Pfeiltasten, Tab/Enter übernehmen, Esc schließt nur die Auswahl.
  _tagAutocomplete(input) {
    const list = h("ul", { class: "sugg editsugg", role: "listbox", hidden: true });
    let items = [], active = 0, seq = 0;
    const close = () => { items = []; list.hidden = true; fill(list); };
    const before = () => input.value.slice(0, input.selectionStart ?? input.value.length);
    const draw = () => {
      if (!items.length) return close();
      fill(list, ...items.map((s, i) => h("li", { role: "option", class: i === active ? "active" : "",
        onmousedown: (e) => { e.preventDefault(); apply(i); } }, badge(s))));
      list.hidden = false;
    };
    const apply = (i) => {
      const s = items[i];
      if (!s) return;
      const rule = ((this._cfg && this._cfg.tag_rules) || []).find((r) => r.kind === s.kind);
      if (!rule) return close();
      const pos = input.selectionStart ?? input.value.length;
      const head = input.value.slice(0, pos).replace(/\S+$/, rule.prefix + s.value) + " ";
      const tail = input.value.slice(pos).replace(/^\S*/, "").replace(/^ /, "");
      input.value = head + tail;
      input.setSelectionRange(head.length, head.length);
      close();
      input.focus();
    };
    const ask = debounce(async () => {
      const q = before();
      const word = (q.match(/\S+$/) || [""])[0];
      const prefixes = ((this._cfg && this._cfg.tag_rules) || []).map((r) => r.prefix);
      if (!word || !prefixes.includes(word[0])) return close();
      const mine = ++seq;
      try {
        const r = await this._call("suggest", { query: q, limit: 6 });
        if (mine !== seq) return;
        items = r.mode === "tag" ? r.suggestions || [] : [];
        active = 0;
        draw();
      } catch (e) { close(); }
    }, 120);
    input.addEventListener("input", ask);
    input.addEventListener("blur", () => setTimeout(close, 150));
    input.addEventListener("keydown", (e) => {
      if (list.hidden || !items.length || e.isComposing) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); active = (active + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length; draw();
      } else if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault(); e.stopImmediatePropagation(); apply(active);  // nicht gleich speichern
      } else if (e.key === "Escape") {
        e.preventDefault(); e.stopImmediatePropagation(); close();       // Bearbeiten nicht abbrechen
      }
    });
    return list;
  }

  _applySugg(i) {
    const s = this._draft.sugg[i];
    if (!s) return;
    const rules = this._cfg.tag_rules;
    if (this._draft.suggMode === "tag") {
      const prefix = rules.find((r) => r.kind === s.kind).prefix;
      this._input.value = this._input.value.replace(/\S+$/, prefix + s.value) + " ";
    } else {
      const p = parseText(this._input.value, rules, this._cfg.known_stores, true);
      this._input.value = encodeText({ ...p, name: s.name }, rules) + " ";
    }
    this._closeSugg();
    this._input.focus();
    this._onInput();
    this._closeSugg();
  }

  _onKey(e) {
    const open = this._suggEl && !this._suggEl.hidden && this._draft.sugg.length;
    if (e.isComposing) return;
    // Pfeil runter bei geschlossener Liste: Vorschläge wieder öffnen
    if (e.key === "ArrowDown" && !open && this._draft.sugg && this._draft.sugg.length && this._draft.text.trim()) { e.preventDefault(); this._draft.active = 0; this._renderSugg(); return; }
    if (e.key === "ArrowDown" && open) { e.preventDefault(); this._draft.active = (this._draft.active + 1) % this._draft.sugg.length; this._renderSugg(); }
    else if (e.key === "ArrowUp" && open) { e.preventDefault(); this._draft.active = (this._draft.active - 1 + this._draft.sugg.length) % this._draft.sugg.length; this._renderSugg(); }
    else if (e.key === "Tab" && open && !e.shiftKey) { e.preventDefault(); this._applySugg(Math.max(0, this._draft.active)); }
    else if (e.key === "Escape") { this._closeSugg(); if (this._pickEl) this._pickEl.hidden = true; }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (open && this._draft.active >= 0) this._applySugg(this._draft.active);
      else this._submit();
    }
  }

  async _submit(textOverride) {
    const cfg = this._cfg;
    const p = textOverride ? parseText(textOverride, cfg.tag_rules, cfg.known_stores, true) : this._draft.parsed;
    if (!p || !p.name) return;
    const info = this._draft.info && this._draft.info.name === p.name ? this._draft.info : null;
    // Nur Zahl getippt ("Äpfel 2")? → gemerkte bzw. übliche Einheit ergänzen
    if (p.quantity != null && !p.unit && info && info.unit_hint && !this._plain) p.unit = info.unit_hint;
    const picked = textOverride || this._noCats ? null : this._draft.pickedCat;
    // Karte mit festem Filter „@REWE“ / „*Anna“: neue Artikel bekommen den Tag automatisch, sonst wären sie unsichtbar
    if (this._config.filter_tags_new_items !== false) {
      const f = this._fixedFilters();
      for (const [kind, values] of [["store", f.store], ["person", f.person], ["tag", f.tag]]) {
        if (values.length === 1 && !p.tags.some((x) => x.kind === kind)) {
          const rule = cfg.tag_rules.find((r) => r.kind === kind);
          if (rule) p.tags.push({ kind, value: values[0], prefix: rule.prefix, label: values[0] });
        }
      }
    }
    // Preis aus dem Text mitschicken – die Integration merkt ihn sich (je Einheit) und nimmt ihn aus dem Namen
    const price = textOverride ? null : this._draft.price;
    const text = encodeText(p, cfg.tag_rules) + (price != null ? ` ${String(price).replace(".", ",")}€` : "");
    this._resetDraft();
    if (this._input) { this._input.value = ""; this._renderPreview(); this._closeSugg(); if (this._pickEl) this._pickEl.hidden = true; }
    if (picked) {
      try { await this._call("set_category", { name: p.name, category: picked }, false); } catch (e) { /* weiter hinzufügen */ }
    }
    await this._change(`${p.name} ${this._t.added}`, "add_item", { text },
      (res) => () => this._call("remove_items", { uids: [res.uid] }), { snack: false });
  }

  _renderFrequent() {
    const el = this._freqEl;
    if (!el) return;
    const items = (this._frequent || []).slice(0, 8);
    const show = this._config.show_frequent && !this._plain && this._config.show_add && items.length && this._data && this._data.permissions.add && !this._draft.text.trim();
    if (!show) return fill(el, );
    fill(el, h("div", { class: "frequent" },
      h("span", { class: "lbl" }, this._t.frequent),
      items.map((s) => h("button", { class: "fchip", type: "button", title: s.category_label,
        onmousedown: (e) => e.preventDefault(), onclick: () => this._submit(s.name) },
        // fällig nach eurem Rhythmus → ⏰ vorne, Tooltip mit Abstand
        s.source === "due" ? h("span", { title: `${this._t.due_every} ${s.every_days} ${this._t.days}` }, "⏰ ") : null,
        this._noCats ? s.name : `${emojiOf(s.category_label)} ${s.name}`))));
  }

  /* ---------------- Liste ---------------- */
  _notesView() {
    if (this._notesGrid == null) { try { this._notesGrid = localStorage.getItem("smartlists-notes-grid") !== "0"; } catch (e) { this._notesGrid = true; } }
    return this._notesGrid;
  }
  // Notizliste wie in der App: Karten mit Titel und Textvorschau, antippen = bearbeiten
  _renderNotes(d) {
    const t = this._t;
    const q = searchKey(this._searchQuery || "");
    const notes = d.items.filter((n) => !q || searchKey(`${n.text} ${n.note}`).includes(q));
    this._hitCount = notes.length;
    if (!notes.length) return fill(this._listEl, h("div", { class: "msg" }, q ? t.no_hits_short : t.note_empty));
    fill(this._listEl, h("div", { class: `notes ${this._notesView() ? "grid" : "list"}` }, notes.map((n) => {
      const locked = n.encrypted;
      return h("button", { type: "button", class: `notecard ${n.checked ? "done" : ""}`, disabled: locked && !n.permissions.delete,
        onclick: () => (locked ? this._noteLocked(n) : this._noteDialog(n)) },
        h("div", { class: "nt" }, locked ? "🔒 " + t.note_locked : n.text || "—"),
        locked ? h("div", { class: "nb" }, t.note_locked_help) : n.note ? h("div", { class: "nb" }, n.note) : null);
    })));
  }
  async _noteLocked(n) {
    const t = this._t;
    if (!n.permissions.delete) return;
    if (await slDialog(this.shadowRoot, { title: "🔒 " + t.note_locked, text: t.note_locked_help, ok: t.delete, cancel: t.cancel, danger: true })) this._deleteItems([n]);
  }
  // Notiz anlegen (n = null) oder bearbeiten: Titel + mehrzeiliger Text, Löschen
  _noteDialog(n) {
    const t = this._t;
    const title = h("input", { value: n ? n.text : "", placeholder: t.note_title, "aria-label": t.note_title, maxlength: "255" });
    const body = h("textarea", { placeholder: t.note_body, "aria-label": t.note_body, rows: "8",
      style: "width:100%;box-sizing:border-box;border-radius:10px;border:1px solid var(--divider-color,#ccc);background:var(--secondary-background-color,#f2f2f2);color:inherit;font:inherit;padding:10px 12px;margin:0 0 14px;resize:vertical" });
    body.value = n ? n.note || "" : "";
    const close = () => back.remove();
    const save = async () => {
      const text = title.value.trim() || body.value.trim().split("\n")[0].slice(0, 60);
      if (!text) return;
      close();
      try {
        if (n) await this._call("update_item", { uid: n.uid, text, note: body.value });
        else await this._call("add_item", { text, note: body.value });
        await this._load();
      } catch (err) { this._error = (err && err.message) || t.error; this._render(); }
    };
    const back = h("div", { class: "dlg-back", onpointerdown: (ev) => { back._down = ev.target === back; if (!back._down && ev.target.closest && ev.target.closest("input, textarea, select, .emo, .swatch")) back._dirty = true; }, oninput: () => { back._dirty = true; }, onclick: (ev) => { if (backdropClose(back, ev)) close(); } },
      h("style", {}, DIALOG_STYLE),
      h("div", { class: "dlg", role: "dialog", "aria-modal": "true", "aria-label": n ? t.note_edit : t.note_new, style: "max-width:560px" },
        h("h2", {}, n ? t.note_edit : t.note_new), title, body,
        h("div", { class: "row" },
          n && n.permissions.delete ? h("button", { type: "button", style: "margin-right:auto;color:var(--error-color,#db4437)", onclick: async () => {
            close(); this._deleteItems([n]);
          } }, t.delete) : null,
          h("button", { type: "button", onclick: close }, t.cancel),
          h("button", { type: "button", class: "ok", onclick: save }, t.save))));
    title.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); body.focus(); } else if (e.key === "Escape") close(); });
    this.shadowRoot.append(back);
    setTimeout(() => (n ? body : title).focus(), 30);
  }

  _renderList() {
    const t = this._t;
    const d = this._data;
    if (d.type === "notes") return this._renderNotes(d);
    const searching = !!this._searchQuery;
    const filtered = d.items.filter((i) => this._passesFilters(i));
    const visible = searching ? filtered.filter((i) => this._matches(i, d)) : filtered;
    this._hitCount = visible.length;
    const open = visible.filter((i) => !i.checked);
    const done = visible.filter((i) => i.checked);
    const out = [];
    if (this._sel) out.push(this._selBar(d, visible));
    const mode = this._noCats && this._sortMode === "category" ? "added" : this._sortMode;
    const byName = (a, b) => a.name.localeCompare(b.name, this._hass.language || "de", { sensitivity: "base", numeric: true });
    const rows = [];
    let emoji = false;
    const grouped = (keyOf, groupsInOrder, labelOf) => {
      const groups = new Map();
      for (const it of open) {
        const k = keyOf(it);
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(it);
      }
      groupsInOrder([...groups.keys()]).forEach((k) => {
        const items = groups.get(k).sort(byName);
        rows.push(h("div", { class: "group-title full" }, `${labelOf(k)} · ${items.length}`), items.map((i) => this._row(i, d, false)));
      });
    };
    if (searching && !visible.length) {
      // nichts gefunden → direkt hinzufügen anbieten
      const term = this._search.trim();
      out.push(h("div", { class: "nohits" }, `${t.no_hits} „${term}“`,
        d.permissions.add ? h("div", {}, h("button", { class: "btn primary", type: "button",
          onclick: () => { this._toggleSearch(); this._submit(term); } }, `„${term}“ ${t.add_this}`)) : null));
    } else if (!open.length && searching) { /* nur erledigte Treffer – unten anzeigen */ }
    else if (!open.length) out.push(h("div", { class: "empty" }, t.empty));
    else if (mode === "category" && this._config.show_category_titles === false) {
      // nach Kategorie, aber ohne Überschriften: eine Liste mit Kategorie-Symbol vorne
      const order = this._catOrder(d);
      emoji = true;
      rows.push([...open].sort((a, b) => (order.indexOf(a.category) - order.indexOf(b.category)) || byName(a, b)).map((i) => this._row(i, d, true)));
    } else if (mode === "category") {
      // wie in der App: Gruppen in fester Markt-Reihenfolge, innerhalb A–Z (im Einkaufsmodus: Gänge des Marktes)
      const order = this._catOrder(d);
      grouped((i) => i.category, (keys) => keys.sort((a, b) => order.indexOf(a) - order.indexOf(b)),
        (k) => { const c = d.categories.find((x) => x.id === k); return c ? c.label : k; });
    } else if (mode === "list" && d.type === "combined") {
      const order = d.source_lists || [];
      grouped((i) => i.source || "", (keys) => keys.sort((a, b) => order.indexOf(a) - order.indexOf(b)), (k) => k || "–");
    } else {
      const items = mode === "alpha" ? [...open].sort(byName) : open;
      emoji = true;
      rows.push(items.map((i) => this._row(i, d, true)));
    }
    if (this._config.view === "tiles" && open.length) {
      // Kacheln: gleiche Reihenfolge wie die Liste, ohne Gruppen-Überschriften
      const order = this._catOrder(d);
      const tiles = mode === "category" ? [...open].sort((a, b) => (order.indexOf(a.category) - order.indexOf(b.category)) || byName(a, b))
        : mode === "alpha" ? [...open].sort(byName) : open;
      out.splice(0, out.length, ...out.filter((x) => x.className === "nohits" || x.className === "empty"));
      out.push(h("div", { class: "tiles" }, tiles.map((i) => this._tile(i, d))));
    } else if (rows.length) out.push(h("div", { class: `items ${emoji ? "emoji" : ""}` }, rows));
    // Summe, sobald Preise bekannt sind: offen und (im Einkaufsmodus) im Wagen
    const sumOf = (list) => list.reduce((a, i) => a + (i.price && i.price.total ? i.price.total : 0), 0);
    if (this._config.show_prices !== false && d.items.some((i) => i.price)) {
      // „im Wagen“ = seit dem letzten „Einkauf beendet“ abgehakt
      const inTrip = done.filter((i) => !d.trip_start || (i.checked_at && i.checked_at >= d.trip_start));
      const openSum = sumOf(open), cartSum = sumOf(inTrip);
      out.push(h("div", { class: "sumbar" }, h("span", {}, t.price_sum, " ", h("small", {}, `${t.open} ${fmtMoney(openSum, this._hass.language)}${cartSum ? ` · ${t.in_cart} ${fmtMoney(cartSum, this._hass.language)}` : ""}`)),
        h("b", {}, fmtMoney(openSum + cartSum, this._hass.language)),
        done.length && d.permissions.toggle ? h("button", { class: "btn2", type: "button", style: "height:30px", onclick: () => this._finishShopping(done.length) }, "✓ " + t.trip_done) : null));
    }

    const hideDone = this._shopping && this._ui.shop_hide_checked;
    // bei der Suche erledigte Treffer immer zeigen (aufgeklappt), „Erledigte entfernen“ nur ohne Filter
    const collapsed = this._collapsedDone && !searching;
    if (this._config.show_completed && done.length && !hideDone) {
      out.push(h("div", { class: `done-head ${collapsed ? "collapsed" : ""}`,
        onclick: () => { this._collapsedDone = !this._collapsedDone; this._renderList(); } },
        svg(ICON.chevron, 18, "chev"), `${t.done} (${done.length})`, h("span", { class: "grow" }),
        d.permissions.delete && !searching ? iconBtn(ICON.sweep, t.clear, (e) => { e.stopPropagation(); this._deleteItems(done, `${done.length} ${t.removed}`); }) : null));
      const doneSorted = mode === "added" ? done : [...done].sort(byName);
      if (!collapsed) out.push(h("div", { class: "items emoji" }, doneSorted.map((i) => this._row(i, d, true))));
    }
    fill(this._listEl, ...out);
    if (this._menu) this._renderMenu();
  }

  _row(it, d, showEmoji) {
    if (this._noCats) showEmoji = false;
    if (this._sel) return this._selRow(it, d, showEmoji);
    // Einkaufsmodus: Bearbeiten gesperrt (kein Umbenennen per Fehltipp) – die Zeile hakt nur ab
    if (this._editing === it.uid && !this._shopping) return this._editRow(it, d);
    const t = this._t;
    const p = it.permissions;
    const qty = it.quantity != null ? `${it.pack_count > 1 ? it.pack_count + "× " : ""}${fmtQty(it.quantity)}` : "";
    const readonly = !p.toggle && !p.rename && !p.delete;
    const cat = d.categories.find((c) => c.id === it.category);
    // Badges und Herkunft lassen sich pro Karte ausblenden
    const tags = !this._config.show_tags ? [] : (it.tags || []).filter((x) => this._config.show_source || !x.implicit);
    // Reihenfolge: Name (+ Badges dahinter) | Menge | Einheit – jeweils eigene, gleich breite Spalte
    const ui = this._ui;
    const shop = this._shopping;
    const buttons = ui.row_buttons && !shop;
    // Einkaufsmodus: Tipp irgendwo auf die Zeile hakt ab (nicht nur das kleine Kästchen); Fehltipper fängt
    // die Rückgängig-Leiste unten auf (3 s)
    const tapRow = shop && ui.shop_tap_row !== false && p.toggle;
    const nameEl = h("span", { class: "iname" }, this._highlight(it.name));
    const row = h("div", { class: `row ${showEmoji ? "emoji" : ""} ${it.checked ? "checked" : ""} ${shop && ui.shop_large ? "large" : ""} ${tapRow ? "tap" : ""} ${shop && buttons ? "btns" : ""}`,
      onclick: (e) => {
        if (this._suppressClick) { this._suppressClick = false; return; }
        if (tapRow && !e.target.closest("button")) this._toggleItem(it);
      } },
      h("button", { class: `box ${it.checked ? "on" : ""}`, type: "button", disabled: !p.toggle, "aria-label": it.name,
        onclick: () => this._toggleItem(it) }, svg(ICON.check, shop && ui.shop_large ? 20 : 16)),
      showEmoji ? h("span", { class: "catemoji", title: cat ? cat.label : "" }, cat ? emojiOf(cat.label) : "") : null,
      h("div", { class: "main" },
        h("div", { class: "name-line" },
          nameEl,
          tags.map(badge),
          // Quelle nur als Text, wenn sie nicht schon als Person-Badge erscheint (todo.peter → 👤 Peter)
          this._config.show_source && it.source && !tags.some((x) => x.implicit) ? h("span", { class: "chip" }, it.source) : null),
        it.offer && this._config.show_offer !== false ? this._offerLine(it, tags) : null,
        !it.offer && it.price && this._config.show_prices !== false ? this._priceLine(it) : null,
        // über einen geteilten Link: mit dem Namen, den die Person dort angegeben hat („von Max markiert (Link)“)
        it.soft_checked && !it.checked ? h("div", { class: "softchk", title: t.soft_checked_help }, "✓ ",
          it.soft_by ? t.soft_checked_by.replace("{name}", it.soft_by) : t.soft_checked) : null,
        it.link_added && !it.checked ? h("div", { class: "softchk", title: t.link_added_help }, "🔗 ",
          it.link_by ? t.link_added_by.replace("{name}", it.link_by) : t.link_added) : null,
        this._config.show_note && it.note ? h("div", { class: "note" }, it.note) : null),
      h("span", { class: "qtycol" }, p.rename && !shop && it.quantity != null && this._config.show_stepper !== false
        ? h("span", { class: "stepper" },
          h("button", { class: "sbtn", type: "button", title: t.qty_less, "aria-label": t.qty_less, onclick: () => this._stepQty(it, -1) }, svg(ICON.minus, 14)),
          h("span", { class: "sval" }, qty),
          h("button", { class: "sbtn", type: "button", title: t.qty_more, "aria-label": t.qty_more, onclick: () => this._stepQty(it, 1) }, svg(ICON.plus, 14)))
        : qty),
      h("span", { class: "unitcol", title: it.unit || "" }, it.unit || ""),
      h("div", { class: "actions" },
        readonly && !shop ? h("span", { class: "lock-ic", title: t.readonly }, svg(ICON.lock, 16)) : null,
        buttons && p.rename ? iconBtn(ICON.pencil, t.edit, () => { this._editing = it.uid; this._renderList(); }) : null,
        buttons && p.delete ? iconBtn(ICON.trash, t.delete, () => this._deleteItems([it]), "danger") : null));
    this._bindPress(ui.press_target === "name" ? nameEl : row, it, row);
    this._bindDrag(row, it, d);
    return row;
  }

  // Mehrfachauswahl: Zeile antippen = markieren; Leiste oben mit Verschieben, Kopieren, Abhaken, Löschen
  _selRow(it, d, showEmoji) {
    const on = this._sel.has(it.uid);
    const cat = d.categories.find((c) => c.id === it.category);
    const tags = !this._config.show_tags ? [] : (it.tags || []).filter((x) => this._config.show_source || !x.implicit);
    const toggle = () => { if (on) this._sel.delete(it.uid); else this._sel.add(it.uid); this._renderList(); };
    return h("div", { class: `row selmode ${showEmoji ? "emoji" : ""} ${it.checked ? "checked" : ""} ${on ? "sel" : ""}`, role: "checkbox", "aria-checked": String(on), tabindex: "0",
      onclick: toggle, onkeydown: (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); } } },
      h("span", { class: `box selbox ${on ? "on" : ""}` }, on ? svg(ICON.check, 16) : null),
      showEmoji ? h("span", { class: "catemoji" }, cat ? emojiOf(cat.label) : "") : null,
      h("div", { class: "main" }, h("div", { class: "name-line" }, h("span", { class: "iname" }, it.name), tags.map(badge))),
      h("span", { class: "qtycol" }, it.quantity != null ? `${it.pack_count > 1 ? it.pack_count + "× " : ""}${fmtQty(it.quantity)}` : ""),
      h("span", { class: "unitcol" }, it.unit || ""));
  }
  _startSelect(it) {
    this._sel = new Set(it ? [it.uid] : []);
    this._closeMenu(); this._moreOpen = false; this._renderMore && this._renderMore();
    this._editing = null; this._renderList();
  }
  _endSelect() { this._sel = null; this._renderList(); }
  _selBar(d, visible) {
    const t = this._t;
    const items = d.items.filter((i) => this._sel.has(i.uid));
    // nicht mehr vorhandene (von anderen gelöscht) aus der Auswahl nehmen
    if (items.length !== this._sel.size) this._sel = new Set(items.map((i) => i.uid));
    const n = items.length;
    const all = visible.length && visible.every((i) => this._sel.has(i.uid));
    const canDel = d.permissions.delete, canAdd = (this._targets || []).some((l) => l.entity_id !== this._config.entity && l.can_add);
    const btn = (label, fn, cls = "", dis = !n) => h("button", { class: `btn2 ${cls}`, type: "button", disabled: dis, onclick: fn }, label);
    return h("div", { class: "selbar" },
      iconBtn(ICON.close, t.cancel, () => this._endSelect()),
      h("b", { class: "grow" }, t.sel_count.replace("{n}", n)),
      btn(all ? t.sel_none : t.sel_all, () => { this._sel = all ? new Set() : new Set(visible.map((i) => i.uid)); this._renderList(); }, "", !visible.length),
      d.permissions.toggle ? btn("✓ " + t.sel_check, () => this._selCheck(items)) : null,
      canDel && canAdd ? btn(t.m_move, () => this._selMove(items, false)) : null,
      canAdd ? btn(t.m_copy, () => this._selMove(items, true)) : null,
      canDel ? btn(t.delete, () => this._selDelete(items), "danger") : null);
  }
  async _selDelete(items) {
    const t = this._t;
    if (!items.length) return;
    const yes = await slDialog(this.shadowRoot, { title: t.delete, danger: true, ok: t.delete, cancel: t.cancel, text: t.sel_delete_q.replace("{n}", items.length) });
    if (!yes) return;
    this._sel = null;
    await this._change(`${items.length} ${t.removed}`, "remove_items", { uids: items.map((i) => i.uid) },
      () => async () => { for (const i of items) await this._call("add_item", { text: i.text, note: i.note || "", checked: i.checked }); });
  }
  async _selCheck(items) {
    const open = items.filter((i) => !i.checked);
    const target = open.length ? open : items; // alles schon abgehakt → wieder öffnen
    const checked = !!open.length;
    this._sel = null;
    const label = `${target.length} ${checked ? this._t.sel_checked : this._t.sel_reopened}`;
    try { for (const i of target) await this._call("update_item", { uid: i.uid, checked }); this._error = null; } catch (e) { this._error = (e && e.message) || this._t.error; }
    this._undo = { label, run: async () => { for (const i of target) await this._call("update_item", { uid: i.uid, checked: !checked }); } };
    await this._load();
    this._render();
    this._showSnack(label, () => this._runUndo());
  }
  _selMove(items, copy) {
    const t = this._t;
    const d = this._data;
    const targets = (this._targets || []).filter((l) => l.entity_id !== this._config.entity && l.can_add && (l.type === "notes") === (d.type === "notes"));
    const dlg = this._dialog(`${copy ? t.m_copy : t.m_move} (${items.length})`, h("div", { class: "seltargets" },
      h("style", {}, ".seltargets{display:flex;flex-direction:column;gap:6px}.seltargets button{justify-content:flex-start;text-align:left;width:100%}"),
      targets.length ? targets.map((l) => h("button", { type: "button", onclick: async () => {
        dlg.remove();
        this._sel = null;
        const source = this._config.entity;
        const moved = [];
        try {
          for (const i of items) {
            const r = await this._call("move_item", { uid: i.uid, target: l.entity_id, copy });
            if (r && r.uid) moved.push(r.uid);
          }
          this._error = null;
        } catch (e) { this._error = (e && e.message) || t.error; }
        const label = `${moved.length} ${copy ? t.copied : t.moved} ${l.name}`;
        this._undo = { label, run: async () => { for (const uid of moved) {
          if (copy) await this._call("remove_items", { entity_id: l.entity_id, uids: [uid] }, false);
          else await this._call("move_item", { entity_id: l.entity_id, uid, target: source, copy: false }, false);
        } } };
        await this._load();
        this._render();
        this._showSnack(label, () => this._runUndo());
      } }, "📋 " + l.name)) : h("p", {}, t.no_targets)), [h("button", { type: "button", onclick: () => dlg.remove() }, t.cancel)]);
  }

  _editRow(it, d) {
    const t = this._t;
    const text = h("input", { class: "text", value: it.clean_text || it.text || it.name, "aria-label": it.name, autocomplete: "off" });
    const tagSugg = this._tagAutocomplete(text);
    const cat = h("select", { class: "cat", "aria-label": t.category },
      d.categories.map((c) => h("option", { value: c.id, selected: c.id === it.category }, c.label)));
    // Notizen nur, wenn die Liste sie speichern kann (z.B. nicht bei der einfachen HA-Einkaufsliste)
    const canNote = d.permissions.note !== false;
    const note = canNote ? h("input", { class: "note-in", placeholder: t.note, value: it.note || "" }) : null;
    // Preis je Einheit (bzw. Stück) – gilt für diesen Artikel, auch wenn er später wieder auf die Liste kommt
    const priceIn = h("input", { class: "price-in", type: "number", min: "0", step: "0.01", inputmode: "decimal", placeholder: `${t.price} €${it.unit ? " / " + it.unit : ""}`,
      "aria-label": t.price, value: it.price && it.price.source !== "offer" && it.price.unit_price != null ? String(it.price.unit_price) : "" });
    const save = async () => {
      this._editing = null;
      // Preis im Text ("… 1,19€") gilt wie das Preisfeld (je Einheit umgerechnet wie beim Hinzufügen)
      const [noPrice, typedPrice] = splitPrice(text.value);
      const parsed = parseText(noPrice, this._cfg.tag_rules, this._cfg.known_stores, true);
      const before = it.price && it.price.source !== "offer" ? it.price.unit_price : null;
      const nowP = typedPrice != null ? Math.round(typedPrice / ((parsed.quantity || 1) * (parsed.pack_count || 1)) * 1000) / 1000
        : priceIn.value === "" ? null : Number(priceIn.value.replace(",", "."));
      if (nowP !== before && !(nowP != null && Number.isNaN(nowP))) {
        try { await this._call("set_price", { name: parsed.name || it.name, price: nowP, store: (parsed.tags.find((x) => x.kind === "store") || {}).value || null }, false); } catch (e) { /* */ }
      }
      if (!this._noCats && cat.value !== it.category) {
        try { await this._call("set_category", { name: parsed.name || it.name, category: cat.value }, false); } catch (e) { /* */ }
      }
      this._change(`${it.name} ${t.changed}`, "update_item", { uid: it.uid, text: encodeText(parsed, this._cfg.tag_rules) || it.text, note: note ? note.value : it.note || "" },
        () => () => this._call("update_item", { uid: it.uid, text: it.text, note: it.note || "" }));
    };
    [text, note, priceIn].filter(Boolean).forEach((el) => el.addEventListener("keydown", (e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { this._editing = null; this._renderList(); } }));
    setTimeout(() => text.focus(), 0);
    return h("div", { class: "edit" }, h("div", { class: "editwrap" }, text, tagSugg), this._noCats ? null : cat, note, this._config.show_prices !== false ? priceIn : null,
      h("div", { class: "btns" },
        h("button", { class: "btn", type: "button", onclick: () => { this._editing = null; this._renderList(); } }, t.cancel),
        h("button", { class: "btn primary", type: "button", onclick: save }, t.save)));
  }

  /* ---------------- Import ---------------- */
  _renderImport() {
    const el = this._importEl;
    if (!this._showImport || !this._cfg || !this._data) return fill(el);
    const t = this._t;
    const st = (this._imp = this._imp || { tab: "ha", source: "", text: "", done: false, dupes: true, rows: null });
    const present = new Set(this._data.items.filter((i) => !i.checked).map((i) => i.name.toLowerCase()));
    const prevEl = h("div");
    const goBtn = h("button", { class: "btn small primary", type: "button", disabled: true, onclick: () => this._runImport() }, t.imp_go);
    const drawPreview = () => {
      const rows = (st.rows || []).filter((r) => st.done || !r.checked).map((r) => {
        const p = parseText(r.text, this._cfg.tag_rules, this._cfg.known_stores, true);
        return { ...r, parsed: p, dupe: st.dupes && present.has(p.name.toLowerCase()) };
      });
      st.ready = rows.filter((r) => !r.dupe && r.parsed.name);
      goBtn.disabled = !st.ready.length;
      goBtn.textContent = `${t.imp_go} (${st.ready.length})`;
      if (st.rows == null) return fill(prevEl);
      if (!rows.length) return fill(prevEl, h("p", { class: "help" }, st.tab === "ha" && !st.source ? "" : t.imp_none));
      fill(prevEl, h("p", { class: "help", style: "margin:8px 0 0" }, `${t.imp_preview}: ${st.ready.length} ${t.imp_count}`),
        h("div", { class: "imp-prev" }, rows.map((r) => h("div", { class: `ir ${r.dupe ? "dupe" : ""} ${r.checked ? "checked" : ""}` },
          h("span", { class: "n" }, r.parsed.name), r.parsed.tags.map(badge),
          r.parsed.quantity != null ? h("span", { class: "chip qty" }, `${fmtQty(r.parsed.quantity)}${r.parsed.unit ? " " + r.parsed.unit : ""}`) : null,
          r.dupe ? h("span", { class: "chip" }, t.imp_dupe) : null))));
    };
    const loadHa = async (entity) => {
      st.source = entity;
      st.rows = null;
      if (!entity) return drawPreview();
      try {
        const r = await this._hass.callWS({ type: "todo/item/list", entity_id: entity });
        st.rows = (r.items || []).map((i) => ({ text: i.summary || "", note: i.description || "", checked: i.status === "completed" }));
      } catch (e) { st.rows = []; this._error = (e && e.message) || t.error; }
      drawPreview();
    };
    const tab = (id, label) => h("button", { type: "button", class: st.tab === id ? "on" : "",
      onclick: () => { st.tab = id; st.rows = id === "text" ? parseImportText(st.text) : null; if (id === "ha" && st.source) loadHa(st.source); this._renderImport(); } }, label);
    let body;
    if (st.tab === "ha") {
      const lists = Object.keys(this._hass.states).filter((e) => e.startsWith("todo.") && e !== this._config.entity)
        .map((e) => ({ e, name: (this._hass.states[e].attributes || {}).friendly_name || e }))
        .sort((a, b) => a.name.localeCompare(b.name));
      body = lists.length
        ? h("select", { class: "imp-src", "aria-label": t.imp_source, onchange: (e) => loadHa(e.target.value) },
          h("option", { value: "" }, `${t.imp_source} …`), lists.map((l) => h("option", { value: l.e, selected: l.e === st.source }, l.name)))
        : h("p", { class: "help" }, t.imp_no_lists);
    } else {
      body = [h("p", { class: "help" }, t.imp_text_help),
        h("textarea", { "aria-label": t.imp_text, placeholder: t.imp_placeholder, value: st.text,
          oninput: (e) => { st.text = e.target.value; st.rows = parseImportText(st.text); drawPreview(); } })];
    }
    const opt = (key, label) => h("label", {}, h("input", { type: "checkbox", checked: st[key],
      onchange: (e) => { st[key] = e.target.checked; drawPreview(); } }), label);
    fill(el, h("div", { class: "settings" },
      h("h3", {}, t.imp),
      h("div", { class: "tabs" }, tab("ha", t.imp_ha), tab("text", t.imp_text)),
      body,
      h("div", { class: "inline-checks", style: "margin-top:8px" }, opt("done", t.imp_done), opt("dupes", t.imp_skip_dupes)),
      prevEl,
      h("div", { class: "srow" }, goBtn)));
    drawPreview();
  }

  async _runImport() {
    const st = this._imp;
    const rows = st.ready || [];
    if (!rows.length) return;
    const added = [];
    try {
      for (const r of rows) {
        const res = await this._call("add_item", { text: encodeText(r.parsed, this._cfg.tag_rules), note: r.note || "", checked: !!r.checked });
        if (res && res.uid) added.push(res.uid);
      }
      this._error = null;
    } catch (e) { this._error = (e && e.message) || this._t.error; }
    this._imp = null;
    this._showImport = false;
    this._renderImport();
    this._undo = { label: `${added.length} ${this._t.imported}`, run: () => this._call("remove_items", { uids: added }) };
    await this._load();
    this._showSnack(this._undo.label, () => this._runUndo());
  }

  /* ---------------- Einstellungen (Zahnrad) ----------------
   * Reiter: „Für mich“ (persönliche Bedienung), „Haushalt“ (Admins: Namenskonvention, Kategorien,
   * Sprache & Automationen, Geräte, Sichern, Bedienung für alle), „Diese Liste“ (Freigaben, Infos).
   * Alle Texte in TEXTS (de/en). */
  _sec(icon, title, help, body, count) {
    return h("div", { class: "sec" },
      h("div", { class: "sh" }, h("h3", {}, title), count != null ? h("span", { class: "cnt" }, String(count)) : null),
      help ? h("p", { class: "shelp" }, help) : null,
      h("div", { class: "sbody" }, body));
  }
  _switch(checked, onchange, label) {
    return h("label", { class: "switch", title: label }, h("input", { type: "checkbox", checked: !!checked, "aria-label": label, onchange: (e) => onchange(e.target.checked) }), h("span"));
  }
  _setRow(label, control, sub, mark) {
    return h("div", { class: "srow2" }, h("div", { class: "sl" }, label, mark ? h("span", { class: "own" }, " •") : null, sub ? h("small", {}, sub) : null), control);
  }

  // Bedienung für eine Ebene: user/device (Für mich) oder household (Standard für alle)
  _controls(scope, part) {
    const t = this._t;
    const ui = this._scopeValues(scope);
    const house = this._scopeValues("household");
    const differs = (key) => scope !== "household" && JSON.stringify(ui[key]) !== JSON.stringify(house[key]);
    const save = (patch) => this._saveUi(patch, scope);
    const sel = (key, opts) => h("select", { "aria-label": t[key], onchange: (e) => save({ [key]: e.target.value }) },
      opts.map(([v, l]) => h("option", { value: v, selected: ui[key] === v }, t[l])));
    const sw = (key, sub) => this._setRow(t[key], this._switch(ui[key], (v) => save({ [key]: v }), t[key]), sub, differs(key));
    const actions = ui.menu_actions || MENU_ACTIONS;
    const parts = {};
    parts.menu = [
      this._setRow(t.press_gesture, sel("press_gesture", [["long", "g_long"], ["double", "g_double"], ["right", "g_right"], ["off", "g_off"]]), null, differs("press_gesture")),
      this._setRow(t.press_result, sel("press_result", [["menu", "r_menu"], ["edit", "r_edit"], ["delete", "r_delete"]]), null, differs("press_result")),
      this._setRow(t.press_target, sel("press_target", [["row", "t_row"], ["name", "t_name"]]), null, differs("press_target")),
      sw("row_buttons"),
    ];
    parts.actions = [
      h("div", { class: "chips", style: "padding-top:8px" }, MENU_ACTIONS.map((a) => h("button", { type: "button", class: `chip2 ${actions.includes(a) ? "on" : ""}`, "aria-pressed": String(actions.includes(a)),
        onclick: () => save({ menu_actions: MENU_ACTIONS.filter((x) => (x === a ? !actions.includes(a) : actions.includes(x))) }) }, t["m_" + a]))),
    ];
    parts.shop = [
      sw("shop_hide_checked"), sw("shop_keep_awake"), sw("shop_large", t.shop_large_help), sw("shop_tap_row"),
      sw("shop_auto_store", t.shop_auto_store_help), sw("shop_untagged", t.shop_untagged_help),
    ];
    parts.scan = [
      this._setRow(t.scan_target, h("select", { "aria-label": t.scan_target, onchange: (e) => save({ scan_target: e.target.value }) },
        h("option", { value: "", selected: !ui.scan_target }, t.scan_target_this),
        Object.keys(this._hass.states).filter((e) => e.startsWith("todo.") && !isNotesEntity(e, this._hass.states[e].attributes.friendly_name))
          .map((e) => h("option", { value: e, selected: ui.scan_target === e }, this._hass.states[e].attributes.friendly_name || e))), null, differs("scan_target")),
      this._setRow(t.scan_mode, sel("scan_mode", [["input", "scan_mode_input"], ["add", "scan_mode_add"]]), null, differs("scan_mode")),
    ];
    return part ? parts[part] : [...parts.menu, h("div", { class: "grp" }, t.menu_actions), ...parts.actions,
      h("div", { class: "grp" }, t.shop), ...parts.shop, h("div", { class: "grp" }, t.scan), ...parts.scan];
  }

  /* Allgemeine Einstellungen: Bereiche (links Navigation, rechts der Bereich in Spalten; schmal: erst die
   * Bereiche, dann der gewählte). Gruppen: Für mich · Global (nur Admins) · Auswertung. */
  _areas() {
    const t = this._t;
    const device = this._uiScope === "device";
    const scope = device ? "device" : "user";
    const chip = (on, label, fn) => h("button", { type: "button", class: `chip2 ${on ? "on" : ""}`, onclick: fn }, label);
    const scopeRow = () => this._setRow(t.a_applies, h("div", { class: "chips" },
      chip(!device, t.scope_user, () => this._setScope("user")), chip(device, t.scope_device, () => this._setScope("device"))));
    const reset = (sc) => h("button", { class: "linkbtn", type: "button", onclick: () => this._resetUi(sc) }, sc === "household" ? t.reset : t.reset_default);
    const me = [
      { g: "me", id: "controls", label: t.ui, sub: t.ui_me_help, kw: [t.press_gesture, t.menu_actions, t.row_buttons], build: () => [
        this._sec("", t.a_menu, null, [scopeRow(), ...this._controls(scope, "menu")]),
        this._sec("", t.menu_actions, null, [...this._controls(scope, "actions"), reset(scope)])] },
      { g: "me", id: "shop", label: t.a_shop, sub: t.a_me_sub, kw: [t.shop, t.scan, t.scan_target], build: () => [
        this._sec("", t.shop, null, this._controls(scope, "shop")),
        this._sec("", t.scan, null, this._controls(scope, "scan"))] },
      { g: "me", id: "notify", label: t.notify, sub: t.a_me_sub, kw: [t.notify_to, t.notify_quiet], build: () => [this._notifySection()] },
    ];
    const global = !this._isAdmin ? [] : [
      { g: "global", id: "look", label: t.a_look, sub: t.a_global_sub, kw: [t.naming, t.look, t.look_color], build: () => [this._namingSection(), this._appearanceSection()] },
      { g: "global", id: "stores", label: t.stores, sub: t.a_global_sub, kw: [t.zone, t.aisle], build: () => [this._storesSection()] },
      { g: "global", id: "cats", label: t.a_cats, sub: t.learned_help, kw: [t.packs, t.learned, t.category], build: () => [this._packsSection(), this._learnedSection()] },
      { g: "global", id: "extras", label: t.x_title, sub: t.x_help, kw: [t.notes, t.mp_title, t.x_notes, t.x_mealplan, t.x_stats, t.stats, t.exp], build: () => [this._extrasSection()] },
      { g: "global", id: "devices", label: t.a_devices, sub: t.devices_help, kw: [t.devices, t.notes, t.app_list], build: () => [this._devicesSection(), this._notesSection()] },
      { g: "global", id: "rights", label: t.a_rights, sub: t.a_rights_sub, kw: [t.share, t.rights_who, t.pub_title, t.pub_tunnel, t.pub_proxy, "cloudflared", "tunnel", "proxy"], build: () => [this._rightsShareSection(), this._publicSection(), this._rightsOtherSection()] },
      { g: "global", id: "data", label: t.a_data, sub: t.a_global_sub, kw: [t.automation, t.backup, t.barcode_providers, t.ui_house, t.w_restart], build: () => [
        this._automationSection(), this._exportImport(),
        this._sec("", t.mg_title, t.mg_sub, [h("button", { class: "btn2", type: "button", onclick: () => this._migrateDialog() }, "📥 " + t.mg_title + " …")]),
        this._sec("", t.w_restart, t.w_restart_sub, [h("div", { class: "acts", style: "justify-content:flex-start" },
          h("button", { class: "btn2", type: "button", onclick: () => this._setupWizard() }, t.w_restart),
          h("button", { class: "btn2 danger", type: "button", onclick: () => this._resetDialog() }, t.rs_title + " …"))]),
        (() => { const st = h("span", { class: "ok2" }); return this._sec("", t.db_title, t.db_help, [h("div", { class: "acts", style: "justify-content:flex-start" },
          h("button", { class: "btn2", type: "button", onclick: () => this._createDashboard(st) }, t.db_create), st)]); })(),
        this._sec("", t.ui_house, t.scope_help_household, [...this._controls("household"), reset("household")])] },
    ];
    // Statistik und Ausgaben: optionales Extra (Einstellungen → Extras)
    const stats = !this._feat("stats") ? [] : [{ g: "stats", id: "stats", label: t.a_stats, sub: null, kw: [t.stats, t.exp], build: () => [this._statsSection(), this._expensesSection()] }];
    return [...me, ...global, ...stats];
  }

  // Global → Teilen und Rechte: was Benutzer ohne Admin-Rechte dürfen
  _rightsShareSection() {
    const t = this._t;
    const status = h("span", { class: "ok2" });
    const body = h("div");
    const linksEl = h("div");
    let rights = { ...((this._cfg && this._cfg.rights) || {}) };
    const save = async (patch) => {
      rights = { ...rights, ...patch };
      try { rights = (await this._call("set_rights", { rights }, false)).rights; this._cfg = { ...this._cfg, rights }; status.textContent = "✓ " + t.saved; }
      catch (err) { status.textContent = (err && err.message) || t.error; }
      draw();
    };
    const pick = (key, opts, map = (v) => v) => h("select", { "aria-label": t["rights_" + key], onchange: (e) => save({ [key]: map(e.target.value) }) },
      opts.map(([v, l]) => h("option", { value: String(v), selected: String(rights[key] ?? "") === String(v) }, l)));
    const fmt = (ts) => new Date(ts * 1000).toLocaleDateString(this._hass.language || "de");
    const showLinks = async () => {
      fill(linksEl, h("div", { class: "shelp" }, t.loading));
      let links = [];
      try { links = (await this._call("share_links_all", {}, false)).links; } catch (e) { /* */ }
      if (!links.length) return fill(linksEl, h("div", { class: "shelp" }, t.rights_no_links));
      fill(linksEl, ...links.map((l) => this._setRow(l.list_name,
        h("button", { class: "linkbtn", type: "button", onclick: async () => { await this._hass.callWS({ type: "smartlists/share_revoke", entity_id: l.entity_id, link_id: l.id }); showLinks(); } }, t.share_revoke),
        `${({ off: t.share_view, soft: t.share_soft, on: t.share_check })[l.check]}${l.add ? ", " + t.share_add : ""}, ${l.expired ? t.share_expired : l.expires ? `${t.share_until} ${fmt(l.expires)}` : t.share_forever}, ${l.opens}× ${t.share_opened}`)));
    };
    const draw = () => fill(body,
      this._setRow(t.rights_who, pick("share_who", [["admins", t.rights_who_admins], ["owners", t.rights_who_owners], ["editors", t.rights_who_editors], ["nobody", t.rights_who_nobody]])),
      this._setRow(t.rights_max, pick("share_max", [["off", t.share_view], ["soft", t.share_soft], ["soft_add", t.share_soft_add], ["on", t.rights_max_on]]), t.rights_limits_help),
      this._setRow(t.rights_max_hours, pick("share_max_hours", [["", t.share_forever], [24, t.share_1d], [168, t.share_7d], [720, t.share_30d]], (v) => (v ? Number(v) : null))),
      h("div", { class: "acts", style: "justify-content:flex-start" }, h("button", { class: "linkbtn", type: "button", onclick: showLinks }, t.rights_all_links), status),
      linksEl);
    draw();
    return this._sec("", t.share, t.rights_share_help, [body]);
  }
  // Global → Teilen und Rechte → Öffentliche Adresse: Links über Quick Tunnel oder eigenen Proxy statt über die
  // Adresse von Home Assistant (public.py). SmartLists lädt cloudflared nie selbst herunter – nur Hinweis.
  _publicSection() {
    const t = this._t;
    const fmt = (str, vars) => String(str).replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : ""));
    const status = h("span", { class: "ok2" });
    const body = h("div", {}, h("div", { class: "shelp" }, t.loading));
    let st = null, mode = "ha", port = 8126, url = "", polls = 0, portOpen = false;
    // „<art>|<pfad>“ (siehe public.py binary_kind) → verständlicher Satz mit der passenden Datei
    const wrongText = (code) => {
      const i = code.indexOf("|");
      const kind = i < 0 ? "unknown" : code.slice(0, i), path = i < 0 ? code : code.slice(i + 1);
      const file = (st && st.cloudflared_file) || "cloudflared-linux-arm64";
      const key = ["amd64", "arm64", "arm", "386"].includes(kind) ? "pub_cf_arch" : "pub_cf_kind_" + kind;
      return fmt(t[key] || t.pub_cf_kind_unknown, { path, found: `cloudflared-linux-${kind}`, file });
    };
    const errText = (e) => {
      if (!e) return "";
      if (e.startsWith("cloudflared_wrong:")) return wrongText(e.slice("cloudflared_wrong:".length));
      const i = e.indexOf(":");
      const code = i < 0 ? e : e.slice(0, i), arg = i < 0 ? "" : e.slice(i + 1);
      return t["pub_err_" + code] ? fmt(t["pub_err_" + code], { port: arg, code: arg }) : e;
    };
    const load = async () => {
      try { st = await this._call("share_public", {}, false); } catch (err) { fill(body, h("div", { class: "shelp" }, (err && err.message) || t.error)); return; }
      if (polls === 0) { mode = st.mode; port = st.port; url = st.url; }
      draw();
      // Tunnel startet: ein paar Mal nachfragen, bis die Adresse da ist
      if (st.mode === "tunnel" && !st.tunnel_url && !st.error && polls < 15) { polls++; setTimeout(load, 2000); } else polls = 0;
    };
    const save = async () => {
      status.textContent = t.loading;
      try { st = await this._call("set_share_public", { mode, port: Number(port) || 8126, url }, false); status.textContent = "✓ " + t.saved; polls = 0; }
      catch (err) { status.textContent = (err && err.message) || t.error; return; }
      if (st.mode === "tunnel" && !st.tunnel_url && !st.error) { polls = 1; setTimeout(load, 2000); }
      draw();
    };
    const a = (href, label) => h("a", { href, target: "_blank", rel: "noreferrer noopener" }, label);
    const cfHint = () => h("div", { class: "shelp", style: "padding:6px 0;color:var(--warning-color,#ff9800)" },
      st.cloudflared_problem ? "⚠️ " + wrongText(st.cloudflared_problem) + " " : "⚠️ " + t.pub_cf_missing + " ",
      a(st.download, fmt(t.pub_cf_download, { file: st.cloudflared_file || "cloudflared-linux-arm64" })), " · ",
      fmt(t.pub_cf_where, { paths: (st.cloudflared_dirs || []).join(", "), file: st.cloudflared_file || "cloudflared-linux-arm64" }), " ", t.pub_cf_or_proxy);
    const draw = () => {
      if (!st) return;
      const live = st.mode === mode;  // gespeicherter Zustand gehört zur gewählten Art
      const state = !live ? null
        : mode === "tunnel" ? (st.tunnel_url ? h("div", { class: "sharelink" }, "✓ " + st.tunnel_url) : st.error ? h("div", { class: "shelp", style: "color:var(--error-color,#db4437)" }, "⚠️ " + errText(st.error))
          : h("div", { class: "shelp" }, "⏳ " + t.pub_starting))
        : mode === "proxy" ? (st.server ? h("div", { class: "shelp" }, "✓ " + fmt(t.pub_server_ok, { port: st.port })) : h("div", { class: "shelp", style: "color:var(--error-color,#db4437)" }, "⚠️ " + errText(st.error)))
        : null;
      fill(body,
        this._setRow(t.pub_mode, h("select", { "aria-label": t.pub_mode, onchange: (e) => { mode = e.target.value; draw(); } },
          [["ha", t.pub_ha], ["tunnel", t.pub_tunnel], ["proxy", t.pub_proxy]].map(([v, l]) => h("option", { value: v, selected: mode === v }, l)))),
        h("div", { class: "shelp", style: "padding:4px 0" }, mode === "ha" ? "ℹ️ " + t.pub_ha_help : mode === "tunnel" ? t.pub_tunnel_help : fmt(t.pub_proxy_help, { port })),
        mode === "tunnel" && !st.cloudflared ? cfHint() : null,
        mode === "tunnel" && st.cloudflared ? h("div", { class: "shelp" }, "✓ cloudflared: " + st.cloudflared) : null,
        mode === "proxy" ? this._setRow(t.pub_url, h("input", { class: "search2", style: "width:240px;margin:0", type: "url", value: url, placeholder: "https://liste.example.org",
          "aria-label": t.pub_url, oninput: (e) => { url = e.target.value.trim(); } })) : null,
        // Port optional: Standard 8126, nur auf Wunsch ändern
        mode !== "ha" && !portOpen && Number(port) === 8126 ? h("div", { class: "acts", style: "justify-content:flex-start" },
          h("button", { class: "linkbtn", type: "button", onclick: () => { portOpen = true; draw(); } }, `${t.pub_port}: 8126 · ${t.pub_port_change}`)) : null,
        mode !== "ha" && (portOpen || Number(port) !== 8126) ? this._setRow(t.pub_port, h("input", { class: "search2", style: "width:100px;margin:0", type: "number", min: "1024", max: "65535", value: String(port),
          "aria-label": t.pub_port, oninput: (e) => { port = e.target.value; } }), t.pub_port_help) : null,
        state,
        mode === "tunnel" ? h("div", { class: "shelp", style: "padding:4px 0" }, "ℹ️ " + t.pub_tunnel_note, " ", a(st.docs, "trycloudflare")) : null,
        h("div", { class: "acts" }, status, h("button", { class: "btn2 primary", type: "button", onclick: save }, t.save)));
    };
    load();
    return this._sec("🛡️", t.pub_title, t.pub_help, [body]);
  }
  _rightsOtherSection() {
    const t = this._t;
    const body = h("div");
    let rights = { ...((this._cfg && this._cfg.rights) || {}) };
    const draw = () => fill(body, ...["create_lists", "templates", "categories", "prices"].map((key) =>
      this._setRow(t["rights_" + key], this._switch(rights[key] !== false, async (on) => {
        rights = { ...rights, [key]: on };
        try { rights = (await this._call("set_rights", { rights }, false)).rights; this._cfg = { ...this._cfg, rights }; } catch (e) { /* */ }
        draw();
      }, t["rights_" + key]))));
    draw();
    return this._sec("", t.rights_other, null, [body]);
  }

  // „geteilt“ antippen: Besitzer und Freigaben anzeigen (nur lesen). Ändern: Zahnrad → Freigaben (Besitzer/Admins).
  async _sharedWithDialog(d) {
    const t = this._t;
    let users = [];
    try { users = (await this._call("users", {}, false)).users || []; } catch (e) { /* Namen fehlen dann */ }
    const nameOf = (id) => (users.find((u) => u.id === id) || {}).name || "?";
    const shares = Object.entries((d.own && d.own.shares) || {});
    const rows = [`👑 ${d.own.owner || nameOf(d.own.owner_id)} · ${t.role_owner}`,
      ...shares.map(([id, role]) => `👤 ${nameOf(id)} · ${t["role_" + role] || role}`)];
    const canChange = this._isAdmin || d.own.role === "owner";
    await slDialog(this.shadowRoot, { title: `${t.sharing}: ${d.name}`,
      text: [...rows, ...(shares.length ? [] : ["", "🔒 " + t.private]), ...(canChange ? ["", t.shared_change_hint] : [])].join("\n"),
      ok: "OK" });
  }

  // Einstellungen dieser Liste – als Fenster über der Liste (breit: zwei Spalten, Handy: Blatt von unten)
  _listSections() {
    const t = this._t;
    const d = this._data;
    const canEdit = !!d && (this._isAdmin || (d.own && d.own.role === "owner"));
    const type = !d ? "?" : d.type === "combined" ? t.type_combined : d.type === "own" ? t.type_own : d.type === "notes" ? t.p_group_notes : t.type_list;
    const status = h("span", { class: "ok2" });
    const set = async (patch) => {
      try { await this._call("set_list_settings", patch); status.textContent = "✓ " + t.saved; this._listSettingsApplied = null; await this._load(); }
      catch (err) { status.textContent = (err && err.message) || t.error; }
    };
    const cur = (d && d.settings) || {};
    const modes = SORT_MODES.filter((m) => (m !== "list" || (d && d.type === "combined")) && !(m === "category" && this._noCats));
    const listSec = this._sec("", t.ls_list, canEdit ? t.ls_list_help : null, [
      canEdit ? this._setRow(t.ls_name, h("input", { class: "search2", style: "width:180px;margin:0", value: d.name, maxlength: "60", "aria-label": t.ls_name,
        onchange: (e) => { const v = e.target.value.trim(); if (v && v !== d.name) set({ name: v }); } })) : null,
      canEdit && d.type !== "notes" ? this._setRow(t.ls_sort, h("select", { "aria-label": t.ls_sort, onchange: (e) => set({ sort: e.target.value || null }) },
        h("option", { value: "", selected: !cur.sort }, t.ls_default), modes.map((m) => h("option", { value: m, selected: cur.sort === m }, t["sort_" + m])))) : null,
      canEdit && d.type !== "notes" ? this._setRow(t.l_show_prices, this._switch(cur.show_prices !== false, (v) => set({ show_prices: v }), t.l_show_prices)) : null,
      // je Liste: einfache Liste (nichts merken), Kategorien aus, woher „häufig gekauft“/Vorschläge kommen
      canEdit && d.type !== "notes" ? this._setRow(t.l_plain, this._switch(cur.plain === true, (v) => set({ plain: v }), t.l_plain), t.l_plain_help) : null,
      canEdit && d.type !== "notes" && !cur.plain ? this._setRow(t.l_categories, this._switch(cur.categories !== false, (v) => set({ categories: v }), t.l_categories), t.l_categories_help) : null,
      canEdit && d.type !== "notes" && !cur.plain ? this._setRow(t.l_suggest, h("select", { "aria-label": t.l_suggest, onchange: (e) => set({ suggest_scope: e.target.value }) },
        [["list", d.type === "combined" ? t.l_suggest_sources : t.l_suggest_list], ["all", t.l_suggest_all]]
          .map(([v, l]) => h("option", { value: v, selected: (cur.suggest_scope || "list") === v }, l))), t.l_suggest_help) : null,
      this._setRow(t.type, h("span", { class: "val" }, type)),
      this._setRow(t.entity, h("code", { class: "val" }, this._config.entity)),
      d && (d.type === "combined" || d.type === "own") && (this._isAdmin || (d.own && d.own.role === "owner"))
        ? this._setRow(t.owner, this._ownerSelect(d, status), d.type === "combined" ? t.owner_combined_help : null)
        : d && d.own ? this._setRow(t.owner, h("span", { class: "val" }, d.own.owner || "?")) : null,
      d && d.source_lists && d.source_lists.length ? this._setRow(t.sources, h("span", { class: "val" }, d.source_lists.join(", "))) : null,
      h("div", { class: "acts" }, status),
    ]);
    const left = [listSec];
    // Herkunfts-Badges (kombinierte Listen): was sie zeigen und von welchen Quell-Listen – Admins und Besitzer
    if (d && d.type === "combined" && d.sources && d.sources.length > 1 && (this._isAdmin || (d.own && d.own.role === "owner")))
      left.push(this._labelSection(d));
    if (d && d.own && d.own.can_share) left.push(this._sharing());
    const right = [];
    const rights = (this._cfg && this._cfg.rights) || {};
    const mayLink = d && d.type !== "notes" && rights.share_who !== "nobody" && (this._isAdmin
      || (rights.share_who === "owners" && d.own && d.own.role === "owner")
      || (rights.share_who === "editors" && (!d.own || ["owner", "editor"].includes(d.own.role))));
    if (mayLink) right.push(this._shareLinkSection());
    return { left, right };
  }
  /* ---------------- Einrichtungs-Assistent (erster Start) ----------------
   * Sieben Schritte, jeder überspringbar. Am Ende ein Aufruf smartlists/setup mit allem. Texte in TEXTS (w_…). */
  async _setupWizard() {
    const t = this._t;
    const fmt = (str, vars) => String(str).replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : ""));
    const st = this._hass.states;
    const todo = Object.keys(st).filter((e) => e.startsWith("todo.") && !isNotesEntity(e, st[e].attributes.friendly_name)
      && !st[e].attributes.smartlists_combined).sort();
    const nameOf = (e) => (st[e] && st[e].attributes.friendly_name) || e;
    let users = [], packs = [], services = [];
    try { users = (await this._call("users", {}, false)).users || []; } catch (e) { /* */ }
    try { packs = (await this._call("packs", {}, false)).packs || []; } catch (e) { /* */ }
    try { services = (await this._call("notify", {}, false)).services || []; } catch (e) { /* */ }
    const me = this._hass.user || {};
    const rules0 = Object.fromEntries(((this._cfg && this._cfg.tag_rules) || []).map((r) => [r.kind, r.prefix]));
    const S = {
      mode: todo.length ? "use" : "new", lists: [...todo], combine: todo.length >= 2, combineName: t.w_combine_default,
      newName: t.w_combine_default, stores: ["REWE", "LIDL"].filter(() => this._lang === "de"),
      rules: { store: rules0.store ?? "@", person: rules0.person ?? "*", tag: rules0.tag ?? "#" },
      packs: packs.filter((p) => p.active).map((p) => p.id), shares: {},
      notify: services.find((x) => x.startsWith("mobile_app_")) || "", voice: true, prices: true, barcode: true, share: false,
      // Extras: beim ersten Einrichten aus (aufgeräumt für Einsteiger), beim erneuten Starten wie eingestellt
      notes: !(this._cfg && this._cfg.setup_needed) && !!(this._cfg && this._cfg.features && this._cfg.features.notes),
      mealplan: !(this._cfg && this._cfg.setup_needed) && !!(this._cfg && this._cfg.features && this._cfg.features.mealplan),
      stats: !(this._cfg && this._cfg.setup_needed) && !!(this._cfg && this._cfg.features && this._cfg.features.stats),
    };
    const steps = ["lists", "stores", "naming", "lang", "people", "extras", "done"];
    let i = 0;
    const chk = (on, fn, label) => h("button", { type: "button", class: `wchk ${on ? "on" : ""}`, role: "checkbox", "aria-checked": String(on), "aria-label": label, onclick: fn });
    const row = (label, sub, ctrl) => h("div", { class: "wset" }, h("div", {}, label, sub ? h("small", {}, sub) : null), ctrl);
    const pick = (on, title, sub, fn, extra) => [h("button", { type: "button", class: `wpick ${on ? "on" : ""}`, "aria-pressed": String(on), onclick: fn },
      h("span", { class: "r" }), h("span", {}, title, h("small", {}, sub))), on && extra ? h("div", { class: "winset" }, extra) : null];
    const known = ((this._cfg && this._cfg.known_stores) || []).map((k) => k.value);
    const allowed = (this._cfg && this._cfg.allowed_prefixes) || "@*#!+~$&%^=";
    const ruleError = () => {
      const used = Object.values(S.rules).filter(Boolean);
      const bad = used.find((c) => !allowed.includes(c));
      return bad ? fmt(t.w_naming_bad, { c: bad }) : used.length !== new Set(used).size ? t.w_naming_dup : "";
    };
    const example = () => {
      const r = S.rules;
      const text = [t.w_eg_item + " " + t.w_eg_qty, r.store && r.store + "REWE", r.person && r.person + "Anna", r.tag && r.tag + t.w_eg_tag.split("#").pop()].filter(Boolean).join(" ");
      return h("div", { class: "weg" }, h("code", {}, text), h("span", { class: "m" }, t.w_becomes), h("span", {}, t.w_eg_item),
        r.store ? badge({ kind: "store", value: "REWE", label: "REWE", color: "var(--secondary-text-color)" }, { kinds: {}, values: {} }) : null,
        r.person ? badge({ kind: "person", value: "Anna", label: "Anna" }) : null,
        r.tag ? badge({ kind: "tag", value: "bio", label: t.w_eg_tag.split("#").pop() }) : null,
        h("b", { class: "q" }, t.w_eg_qty));
    };
    const body = h("div", { class: "wbody" });
    const stepsEl = h("ol", { class: "wsteps" });
    const barEl = h("div", { class: "wbar" });
    const prev = h("button", { type: "button", class: "btn2", onclick: () => { i = Math.max(0, i - 1); draw(); } }, t.w_back);
    const skip = h("button", { type: "button", class: "linkbtn", onclick: () => { i = Math.min(steps.length - 1, i + 1); draw(); } }, t.w_skip);
    const next = h("button", { type: "button", class: "btn2 primary", onclick: () => go() });
    const status = h("span", { class: "ok2" });
    const views = {
      lists: () => [h("h2", {}, t.w_lists_h), h("p", { class: "lead" }, todo.length ? fmt(t.w_lists_found, { n: todo.length }) : t.w_lists_none),
        todo.length ? pick(S.mode === "use", t.w_use, t.w_use_sub, () => { S.mode = "use"; draw(); }, [
          ...todo.map((e) => row(nameOf(e), `${e} · ${st[e].state} ${t.w_open}`, chk(S.lists.includes(e), () => { S.lists = S.lists.includes(e) ? S.lists.filter((x) => x !== e) : [...S.lists, e]; draw(); }, nameOf(e)))),
          S.lists.length >= 2 ? row(t.w_combine, t.w_combine_sub, this._switch(S.combine, (v) => { S.combine = v; draw(); }, t.w_combine)) : null,
          S.lists.length >= 2 && S.combine ? row(t.w_combine_name, null, h("input", { class: "search2", value: S.combineName, maxlength: "60", "aria-label": t.w_combine_name, oninput: (e) => { S.combineName = e.target.value; } })) : null,
        ]) : null,
        pick(S.mode === "new", t.w_new, t.w_new_sub, () => { S.mode = "new"; draw(); },
          row(t.w_new_name, null, h("input", { class: "search2", value: S.newName, maxlength: "60", "aria-label": t.w_new_name, oninput: (e) => { S.newName = e.target.value; } })))],
      stores: () => {
        const all = [...new Set([...known, ...S.stores])];
        const other = h("input", { class: "search2", placeholder: t.w_store_other, "aria-label": t.w_store_other, style: "width:180px" });
        const addOther = () => { const v = other.value.trim().replace(/^@/, ""); if (v && !S.stores.includes(v)) { S.stores.push(v); draw(); } };
        other.addEventListener("keydown", (e) => { if (e.key === "Enter") addOther(); });
        return [h("h2", {}, t.w_stores_h), h("p", { class: "lead" }, t.w_stores_lead),
          h("div", { class: "wstores" }, all.map((v) => {
            const on = S.stores.some((x) => x.toLowerCase() === v.toLowerCase());
            return h("button", { type: "button", class: `wstore ${on ? "on" : ""}`, "aria-pressed": String(on),
              onclick: () => { S.stores = on ? S.stores.filter((x) => x.toLowerCase() !== v.toLowerCase()) : [...S.stores, v]; draw(); } }, v);
          })),
          h("p", { class: "m small" }, S.stores.length ? fmt(t.w_chosen, { list: S.stores.join(", ") }) : t.w_chosen_none),
          row(t.w_store_other, null, h("span", { class: "wrow" }, other, h("button", { type: "button", class: "btn2", onclick: addOther }, t.w_store_add))),
          h("p", { class: "m small" }, t.w_stores_later)];
      },
      naming: () => {
        const err = h("p", { class: "werr" }, ruleError());
        const ex = h("div", {}, example());
        const field = (kind, label, sub) => row(label, sub, h("input", { class: "search2 wchar", value: S.rules[kind], maxlength: "1", "aria-label": label,
          oninput: (e) => { S.rules[kind] = e.target.value.trim(); err.textContent = ruleError(); next.disabled = !!ruleError(); fill(ex, example()); } }));
        return [h("h2", {}, t.w_naming_h), h("p", { class: "lead" }, t.w_naming_lead),
          field("store", t.kind_store, t.w_eg_store), field("person", t.kind_person, t.w_eg_person), field("tag", t.kind_tag, t.w_eg_tag),
          err, ex, h("p", { class: "m small" }, fmt(t.w_naming_hint, { chars: allowed.split("").join(" ") }))];
      },
      lang: () => [h("h2", {}, t.w_lang_h), h("p", { class: "lead" }, t.w_lang_lead),
        packs.filter((p) => p.builtin).map((p) => row(p.name, `${p.terms.toLocaleString(this._hass.language || "de")} ${t.w_words}`,
          chk(S.packs.includes(p.id), () => { S.packs = S.packs.includes(p.id) ? S.packs.filter((x) => x !== p.id) : [...S.packs, p.id]; draw(); }, p.name)))],
      people: () => [h("h2", {}, t.w_people_h),
        S.mode === "new" ? [h("p", { class: "lead" }, t.w_people_lead),
          row(me.name || "", t.w_you, h("span", { class: "m" }, t.w_all)),
          users.filter((u) => u.id !== me.id).map((u) => row(u.name, u.is_admin ? t.admin_always : null, u.is_admin ? h("span", { class: "m" }, t.w_all)
            : h("select", { "aria-label": u.name, onchange: (e) => { if (e.target.value) S.shares[u.id] = e.target.value; else delete S.shares[u.id]; } },
              [["", t.role_none], ["viewer", t.role_viewer], ["checker", t.role_checker], ["editor", t.role_editor]].map(([v, l]) => h("option", { value: v, selected: (S.shares[u.id] || "") === v }, l)))))]
          : h("p", { class: "lead" }, t.w_people_combined),
        row(t.w_app, t.w_app_sub, null)],
      extras: () => [h("h2", {}, t.w_extras_h), h("p", { class: "lead" }, t.w_extras_lead),
        row(t.w_x_notify, services.length ? t.w_x_notify_sub : t.w_x_notify_none, services.length
          ? h("select", { "aria-label": t.w_x_notify, onchange: (e) => { S.notify = e.target.value; } }, h("option", { value: "", selected: !S.notify }, t.w_off),
            services.map((sv) => h("option", { value: sv, selected: S.notify === sv }, sv.replace(/^mobile_app_/, "").replace(/_/g, " ")))) : null),
        row(t.w_x_voice, t.w_x_voice_sub, this._switch(S.voice, (v) => { S.voice = v; }, t.w_x_voice)),
        row(t.w_x_prices, t.w_x_prices_sub, this._switch(S.prices, (v) => { S.prices = v; }, t.w_x_prices)),
        row(t.w_x_barcode, t.w_x_barcode_sub, this._switch(S.barcode, (v) => { S.barcode = v; }, t.w_x_barcode)),
        row(t.w_x_share, t.w_x_share_sub, this._switch(S.share, (v) => { S.share = v; }, t.w_x_share)),
        h("div", { class: "grp" }, t.w_x_optional),
        row(t.x_notes, t.w_x_notes_sub, this._switch(S.notes, (v) => { S.notes = v; }, t.x_notes)),
        row(t.x_mealplan, t.w_x_mealplan_sub, this._switch(S.mealplan, (v) => { S.mealplan = v; }, t.x_mealplan)),
        row(t.x_stats, t.w_x_stats_sub, this._switch(S.stats, (v) => { S.stats = v; }, t.x_stats))],
      done: () => {
        const listsTxt = S.lists.map(nameOf).join(", ");
        const sum = [
          S.mode === "new" ? fmt(t.w_sum_new, { name: S.newName }) : S.lists.length >= 2 && S.combine ? fmt(t.w_sum_combined, { name: S.combineName, lists: listsTxt })
            : S.lists.length ? fmt(t.w_sum_lists, { lists: listsTxt }) : null,
          fmt(t.w_sum_stores, { list: S.stores.join(", ") || t.w_off }),
          fmt(t.w_sum_naming, { list: [S.rules.store && S.rules.store + t.kind_store, S.rules.person && S.rules.person + t.kind_person, S.rules.tag && S.rules.tag + t.kind_tag].filter(Boolean).join(", ") || t.w_off }),
          fmt(t.w_sum_lang, { list: packs.filter((p) => S.packs.includes(p.id)).map((p) => p.name).join(", ") || t.w_off }),
          S.mode === "new" && Object.keys(S.shares).length ? fmt(t.w_sum_people, { list: Object.entries(S.shares).map(([id, r]) => `${(users.find((u) => u.id === id) || {}).name}: ${t["role_" + r]}`).join(", ") }) : null,
          fmt(t.w_sum_extras, { list: [S.notify && t.w_x_notify, S.voice && t.w_x_voice, S.prices && t.w_x_prices, S.barcode && t.w_x_barcode, S.share && t.w_x_share, S.notes && t.x_notes, S.mealplan && t.x_mealplan, S.stats && t.x_stats].filter(Boolean).join(", ") || t.w_off }),
        ].filter(Boolean);
        return [h("h2", {}, t.w_done_h), h("p", { class: "lead" }, t.w_done_lead), h("ul", { class: "wsum" }, sum.map((x) => h("li", {}, x))), h("p", { class: "m small" }, t.w_tip)];
      },
    };
    const labels = [t.w_s_lists, t.w_s_stores, t.w_s_naming, t.w_s_lang, t.w_s_people, t.w_s_extras, t.w_s_done];
    const finished = { v: false };
    const draw = () => {
      fill(stepsEl, labels.map((l, k) => h("li", { class: k < i ? "done" : k === i ? "now" : "", onclick: () => { i = k; draw(); } }, h("span", { class: "n" }, k < i ? "✓" : String(k + 1)), l)));
      fill(barEl, h("small", {}, `${fmt(t.w_step, { n: i + 1, m: steps.length })}: ${labels[i]}`), h("div", {}, h("i", { style: `width:${((i + 1) / steps.length) * 100}%` })));
      fill(body, views[steps[i]]());
      prev.style.visibility = i ? "visible" : "hidden";
      skip.hidden = i >= steps.length - 2;
      next.textContent = finished.v ? t.w_start : i === steps.length - 2 ? t.w_next : i === steps.length - 1 ? t.w_finish : t.w_next;
      next.disabled = steps[i] === "naming" && !!ruleError();
    };
    const close = () => { back.remove(); window.__smartlistsSetupOpen = false; };
    const go = async () => {
      if (finished.v) { close(); return; }
      if (i < steps.length - 1) { i++; draw(); return; }
      next.disabled = true; status.textContent = t.loading;
      const r = S.rules;
      try {
        await this._call("setup", {
          lists: S.mode === "use" ? S.lists : [], combine_name: S.mode === "use" && S.lists.length >= 2 && S.combine ? (S.combineName.trim() || t.w_combine_default) : null,
          new_list: S.mode === "new" ? (S.newName.trim() || t.w_combine_default) : null, shares: S.mode === "new" ? S.shares : {},
          stores: S.stores, tag_rules: [["store", r.store], ["person", r.person], ["tag", r.tag]].filter(([, p]) => p).map(([kind, prefix]) => ({ kind, prefix })),
          packs: S.packs.length ? S.packs : undefined, notify_service: S.notify || null, voice: S.voice, prices: S.prices, barcode: S.barcode, share_links: S.share,
          notes: S.notes, mealplan: S.mealplan, stats: S.stats,
        }, false);
        finished.v = true; status.textContent = "✓"; next.disabled = false; draw();
        window.dispatchEvent(new CustomEvent("smartlists-lists-changed"));
        await this._loadConfig(); this._load();
      } catch (err) { status.textContent = (err && err.message) || t.error; next.disabled = false; }
    };
    const back = h("div", { class: "dlg-back wiz-back" },
      h("style", {}, DIALOG_STYLE + STYLE + WIZARD_STYLE),
      h("div", { class: "dlg wiz", role: "dialog", "aria-modal": "true", "aria-label": t.w_title },
        h("aside", { class: "wside" }, h("h1", {}, t.w_title), h("p", { class: "m small" }, t.w_time), stepsEl),
        h("div", { class: "wpane" }, barEl, body,
          h("div", { class: "wfoot" }, prev, h("span", { class: "m small wl" }, t.w_later), h("span", { class: "grow" }), status, skip, next)),
        h("button", { type: "button", class: "wx", "aria-label": t.w_close, title: t.w_close, onclick: async () => {
          try { await this._call("setup", { skip: true }, false); } catch (e) { /* */ }
          close();
        } }, "✕")));
    this.shadowRoot.append(back);
    draw();
  }

  _listDialog() {
    const t = this._t;
    const d = this._data;
    if (!d) return;
    const { left, right } = this._listSections();
    const close = () => back.remove();
    const meta = [d.type === "combined" ? t.type_combined : d.type === "own" ? t.type_own : d.type === "notes" ? t.p_group_notes : t.type_list,
      d.own && d.own.owner ? `${t.owner}: ${d.own.owner}` : null].filter(Boolean).join(", ");
    const back = h("div", { class: "dlg-back lsd", onpointerdown: (ev) => { back._down = ev.target === back; if (!back._down && ev.target.closest && ev.target.closest("input, textarea, select, .emo, .swatch")) back._dirty = true; }, oninput: () => { back._dirty = true; }, onclick: (ev) => { if (backdropClose(back, ev)) close(); } },
      h("style", {}, DIALOG_STYLE + STYLE + LIST_DIALOG_STYLE),
      h("div", { class: "dlg lsheet", role: "dialog", "aria-modal": "true", "aria-label": t.settings_list },
        h("div", { class: "ltop" }, h("div", { class: "lwho" }, h("h2", {}, d.name), h("small", {}, meta)),
          iconBtn(ICON.close, t.cancel, close)),
        h("div", { class: `ltwo ${right.length ? "" : "one"}` }, h("div", {}, left), right.length ? h("div", {}, right) : null),
        h("div", { class: "lfoot" }, h("span", { class: "shelp" }, this._config.settings_scope === "list" ? t.list_settings_hint : t.list_settings_hint_card),
          h("button", { type: "button", class: "ok", onclick: close }, t.ls_done))));
    this.shadowRoot.append(back);
  }

  _namingSection() {
    const t = this._t;
    const cfg = this._cfg;
    let rules = cfg.tag_rules.map((r) => ({ ...r }));
    const rulesEl = h("div");
    const exampleEl = h("div", { class: "preview2" });
    const status = h("span", { class: "ok2" });
    const drawExample = () => {
      const p = Object.fromEntries(rules.map((r) => [r.kind, r.prefix]));
      const txt = ["Milch 2 l", p.store && `${p.store}REWE`, p.person && `${p.person}Anna`, p.tag && `${p.tag}bio`].filter(Boolean).join(" ");
      const parsed = parseText(txt, rules.filter((r) => r.prefix), cfg.known_stores);
      fill(exampleEl, h("code", {}, txt), h("span", { class: "arrow" }, "→"), h("b", {}, parsed.name),
        h("span", { class: "qtycol" }, `${fmtQty(parsed.quantity)} ${parsed.unit}`), parsed.tags.map(badge));
    };
    const drawRules = () => fill(rulesEl, ...rules.map((r, i) => h("div", { class: "rule2" },
      h("input", { class: "char", value: r.prefix, maxlength: "1", "aria-label": t.char, oninput: (e) => { r.prefix = e.target.value.trim(); drawExample(); } }),
      h("select", { "aria-label": t.kind, onchange: (e) => { r.kind = e.target.value; drawExample(); } },
        cfg.tag_kinds.map((k) => h("option", { value: k, selected: k === r.kind }, t["kind_" + k]))),
      iconBtn(ICON.close, t.delete, () => { rules.splice(i, 1); drawRules(); drawExample(); }, "danger"))));
    drawRules(); drawExample();
    const save = async () => {
      status.textContent = "";
      try {
        this._cfg = await this._call("set_tag_rules", { rules: rules.filter((r) => r.prefix) }, false);
        status.textContent = "✓ " + t.saved;
        await this._load();
      } catch (e) { status.textContent = (e && e.message) || t.error; }
    };
    return this._sec("#", t.naming, t.naming_help, [rulesEl, exampleEl,
      h("div", { class: "acts" }, status,
        h("button", { class: "btn2", type: "button", onclick: () => {
          const free = [...cfg.allowed_prefixes].find((c) => !rules.some((r) => r.prefix === c));
          rules.push({ prefix: free || "", kind: "tag" }); drawRules(); drawExample(); } }, "+ " + t.add_rule),
        h("button", { class: "btn2 primary", type: "button", onclick: save }, t.save))]);
  }

  // Kategorie-Erkennung: eingebaute + eigene Keyword-Packs, an/aus und Reihenfolge (vorne gewinnt)
  _packsSection() {
    const t = this._t;
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    const status = h("span", { class: "ok2" });
    const count = h("span", { class: "cnt" });
    let packs = [];
    const fail = (err) => { status.textContent = (err && err.message) || t.error; };
    const changed = async (r) => { packs = r.packs; draw(); status.textContent = "✓ " + t.saved; this._cfg = await this._call("config", { language: this._lang }, false); };
    const activeIds = () => packs.filter((p) => p.active).sort((a, b) => a.priority - b.priority).map((p) => p.id);
    const setActive = async (ids) => { try { await changed(await this._call("pack_set_active", { active: ids }, false)); } catch (err) { fail(err); } };
    const download = (data, name) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: "application/json" }));
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    };
    const draw = () => {
      const ids = activeIds();
      count.textContent = `${ids.length}/${packs.length}`;
      fill(body, ...packs.map((p) => {
        const pos = ids.indexOf(p.id);
        const lang = p.language ? p.language.toUpperCase() + " · " : "";
        const sub = `${lang}${p.terms.toLocaleString(this._hass.language || "de")} ${t.pack_terms}${p.products ? ` · ${p.products} ${t.pack_products}` : ""} · ${p.builtin ? t.pack_builtin : t.pack_custom}${pos >= 0 ? ` · ${t.pack_priority} ${pos + 1}` : ""}`;
        return h("div", { class: "srow2" },
          h("div", { class: "sl" }, p.name, h("small", {}, sub)),
          iconBtn(ICON.pencil, t.pack_edit, () => this._packEditor(sec, p, () => this._call("packs", {}, false).then((r) => { packs = r.packs; draw(); }))),
          pos > 0 ? iconBtn(ICON.chevron, t.pack_up, () => { const n = [...ids]; n.splice(pos, 1); n.splice(pos - 1, 0, p.id); setActive(n); }, "up") : null,
          iconBtn(ICON.import, t.pack_download, async () => {
            try { download(await this._call("pack_export", { pack_id: p.id }, false), `smartlists-pack-${p.id}.json`); } catch (err) { fail(err); }
          }, "dl"),
          p.builtin ? null : iconBtn(ICON.trash, t.delete, async () => {
            if (!(await slDialog(this.shadowRoot, { title: t.pack_delete, text: p.name, ok: t.delete, cancel: t.cancel, danger: true }))) return;
            try { await changed(await this._call("pack_delete", { pack_id: p.id }, false)); } catch (err) { fail(err); }
          }, "danger"),
          this._switch(pos >= 0, (on) => setActive(on ? [...ids, p.id] : ids.filter((x) => x !== p.id)), p.name));
      }));
    };
    const file = h("input", { type: "file", accept: "application/json,.json", hidden: true, onchange: async (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!f) return;
      let pack;
      try { pack = JSON.parse(await f.text()); } catch (err) { status.textContent = t.pack_bad_json; return; }
      const name = await slDialog(this.shadowRoot, { title: t.pack_upload, text: t.pack_name_help, input: true,
        value: (pack && pack.name) || f.name.replace(/\.json$/i, ""), ok: t.pack_add, cancel: t.cancel });
      if (!name) return;
      try {
        const r = await this._call("pack_upload", { pack, name: String(name) }, false);
        await changed(r);
        status.textContent = `✓ ${r.terms} ${t.pack_terms}${r.skipped ? ` · ${r.skipped} ${t.pack_skipped}` : ""}`;
      } catch (err) { fail(err); }
    } });
    this._call("packs", {}, false).then((r) => { packs = r.packs; draw(); }).catch(() => fill(body, t.error));
    const sec = this._sec("🧠", t.packs, t.packs_help, [body,
      h("div", { class: "acts" }, status,
        h("button", { class: "btn2", type: "button", onclick: () => download(PACK_TEMPLATE, "smartlists-pack-template.json") }, "⬇ " + t.pack_template),
        h("button", { class: "btn2", type: "button", onclick: async () => {
          const name = await slDialog(this.shadowRoot, { title: t.pack_new, text: t.pack_new_help, input: true, placeholder: t.pack_new_placeholder, ok: t.create, cancel: t.cancel });
          if (!name) return;
          try {
            const r = await this._call("pack_create", { name, language: "" }, false);
            packs = r.packs; draw();
            const p = packs.find((x) => x.id === r.pack_id);
            if (p) this._packEditor(sec, p, () => this._call("packs", {}, false).then((x) => { packs = x.packs; draw(); }));
          } catch (err) { fail(err); }
        } }, "＋ " + t.pack_new),
        h("button", { class: "btn2 primary", type: "button", onclick: () => file.click() }, "⬆ " + t.pack_upload), file)]);
    sec.firstChild.append(count);
    return sec;
  }

  // Stichwörter eines Packs bearbeiten (im Abschnitt, statt der Pack-Liste). Eingebaute Packs bleiben
  // unverändert – Änderungen landen im Ergänzungs-Pack „<Name> +“ (siehe packs.py).
  _packEditor(sec, pack, onClose) {
    const t = this._t;
    const body = sec.querySelector ? sec.querySelector(".sbody") : sec.childNodes[sec.childNodes.length - 1];
    const saved = [...body.childNodes];
    const cats = (this._cfg && this._cfg.categories) || categoryOptions(this._lang).map(([id, label]) => ({ id, label }));
    const status = h("span", { class: "ok2" });
    const listEl = h("div", { class: "learned2" });
    const more = h("div", { class: "acts", style: "margin-top:6px" });
    let query = "", offset = 0, rows = [], total = 0, seq = 0;
    const catSelect = (value, onchange, label) => h("select", { "aria-label": label || t.category, onchange: (e) => onchange(e.target.value) },
      cats.map((c) => h("option", { value: c.id, selected: c.id === value }, c.label)));
    const save = async (changes) => {
      try {
        await this._call("pack_update", { pack_id: pack.id, terms: changes }, false);
        status.textContent = "✓ " + t.saved;
        this._cfg = await this._call("config", { language: this._lang }, false);
        return true;
      } catch (err) { status.textContent = (err && err.message) || t.error; return false; }
    };
    const load = async (append) => {
      const mine = ++seq;  // nur die Antwort zur letzten Suche zählt (ältere, langsamere Antworten verwerfen)
      try {
        const r = await this._call("pack_terms", { pack_id: pack.id, query, offset: append ? offset : 0, limit: 100 }, false);
        if (mine !== seq) return;
        rows = append ? [...rows, ...r.terms] : r.terms;
        total = r.total; offset = rows.length;
        draw();
      } catch (err) { status.textContent = (err && err.message) || t.error; }
    };
    const draw = () => {
      if (!rows.length) fill(listEl, h("div", { class: "shelp", style: "padding:10px" }, query ? t.no_hits_short : t.pack_empty));
      else fill(listEl, ...rows.map((r) => h("div", { class: "lrow2" },
        h("span", { class: "w" }, r.term, r.changed ? h("span", { class: "manual" }, t.pack_changed) : null),
        catSelect(r.category, async (v) => { if (await save({ [r.term]: v })) { r.category = v; r.changed = pack.builtin || r.changed; draw(); } }, r.term),
        iconBtn(ICON.close, pack.builtin ? (r.changed ? t.pack_revert : t.pack_ignore) : t.delete, async () => {
          // eingebaut: Ergänzung zurücknehmen bzw. Stichwort ignorieren (= Sonstiges); eigenes Pack: löschen
          const v = pack.builtin ? (r.changed ? null : "sonstiges") : null;
          if (await save({ [r.term]: v })) load(false);
        }, "danger"))));
      fill(more, rows.length < total ? h("button", { class: "btn2", type: "button", onclick: () => load(true) }, `${t.pack_more} (${rows.length}/${total})`)
        : h("span", { class: "shelp" }, `${total} ${t.pack_terms}`));
    };
    const term = h("input", { class: "search2", placeholder: t.pack_term_placeholder, "aria-label": t.pack_term_placeholder });
    let newCat = cats[0] ? cats[0].id : "sonstiges";
    const add = async () => {
      const v = term.value.trim();
      if (!v) return;
      // mehrere auf einmal: "dinkelmehl, roggenmehl"
      const changes = Object.fromEntries(v.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean).map((x) => [x, newCat]));
      if (await save(changes)) { term.value = ""; query = ""; search.value = ""; load(false); }
    };
    term.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); add(); } });
    // Suche: sofort im Geladenen filtern, dann beim Server nachfragen. Wert direkt aus dem Feld lesen (nicht aus dem
    // Ereignis) und auch auf „search“ (✕) und keyup reagieren – auf manchen Handys kommt „input“ nicht zuverlässig.
    const search = h("input", { type: "search", class: "search2", placeholder: t.search_learned, "aria-label": t.search, autocomplete: "off" });
    const ask = debounce(() => load(false), 250);
    const onSearch = () => {
      const v = search.value.trim();
      if (v === query) return;
      query = v;
      const q = v.toLowerCase();
      rows = rows.filter((r) => r.term.toLowerCase().includes(q));
      total = rows.length;
      draw();
      ask();
    };
    ["input", "search", "keyup", "change"].forEach((ev) => search.addEventListener(ev, onSearch));
    fill(body,
      h("div", { class: "srow2", style: "border-top:none" },
        iconBtn(ICON.back, t.p_back, () => { fill(body, ...saved); onClose && onClose(); }),
        h("div", { class: "sl" }, h("b", {}, pack.name), h("small", {}, pack.builtin ? t.pack_builtin_edit_help : t.pack_edit_help))),
      // Zeile 1: Stichwort(e) über die ganze Breite; Zeile 2: Kategorie + Hinzufügen
      h("div", { class: "packadd" }, term,
        h("div", { class: "packadd2" }, catSelect(newCat, (v) => { newCat = v; }),
          h("button", { class: "btn2 primary", type: "button", onclick: add }, "＋ " + t.pack_add))),
      search, listEl, more, h("div", { class: "acts" }, status));
    load(false);
  }

  // Badges & Farben: Aussehen je Art (Markt/Person/Schlagwort) und einzelner Badges, Farben/Namen der Märkte.
  // Alles optional – leere Angaben = eingebautes Aussehen. Gilt für den Haushalt (auch für die App: Märkte).
  _appearanceSection() {
    const t = this._t;
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    const status = h("span", { class: "ok2" });
    let look = { kinds: {}, values: {} }, tags = [], query = "";
    const save = debounce(async () => {
      try {
        const r = await this._call("set_appearance", { appearance: look }, false);
        look = r.appearance; tags = r.tags; SL_LOOK = look;
        if (this._cfg) this._cfg = { ...this._cfg, appearance: look };
        status.textContent = "✓ " + t.saved;
        window.dispatchEvent(new CustomEvent("smartlists-look-changed"));
        draw();
      } catch (err) { status.textContent = (err && err.message) || t.error; }
    }, 400);
    const sample = { store: { kind: "store", value: "REWE", label: "REWE", color: "#cc071e" }, person: { kind: "person", value: "Anna", label: "Anna" }, tag: { kind: "tag", value: "bio", label: "bio" } };
    // Farbwähler: beim Ziehen nur die Vorschau ändern (Wähler bleibt offen), gespeichert wird beim Schließen/Bestätigen
    const colorInput = (value, onlive, oncommit, label) => h("input", { type: "color", value: value || "#888888", "aria-label": label, title: label,
      oninput: (e) => onlive(e.target.value), onchange: (e) => oncommit(e.target.value) });
    const reset = (onclick, label) => h("button", { class: "btn2", type: "button", style: "height:30px;padding:0 10px", title: label, "aria-label": label, onclick }, "↺");
    const kindRow = (kind) => {
      const k = look.kinds[kind] || {};
      let prevK = null;
      const setK = (patch) => {
        const next = { ...k, ...patch };
        Object.keys(next).forEach((x) => (next[x] == null || next[x] === "") && delete next[x]);
        look = { ...look, kinds: { ...look.kinds, [kind]: next } };
        if (!Object.keys(next).length) delete look.kinds[kind];
        draw(); save();
      };
      return h("div", { class: "srow2" },
        (prevK = h("div", { class: "sl" }, t["kind_" + kind], h("small", {}, badge(sample[kind], look)))),
        h("div", { class: "look-row" },
          h("select", { "aria-label": `${t["kind_" + kind]}: ${t.look_style}`, onchange: (e) => setK({ style: e.target.value === BADGE_DEFAULTS[kind].style ? null : e.target.value }) },
            BADGE_STYLES.map((st) => h("option", { value: st, selected: (k.style || BADGE_DEFAULTS[kind].style) === st }, t["look_" + st]))),
          kind === "store" ? null : colorInput(k.color,
            (c) => fill(prevK.lastChild, badge(sample[kind], { ...look, kinds: { ...look.kinds, [kind]: { ...k, color: c } } })),
            (c) => setK({ color: c }), `${t["kind_" + kind]}: ${t.look_color}`),
          colorInput(k.text || (k.color ? textOn(k.color) : "#ffffff"),
            (c) => fill(prevK.lastChild, badge(sample[kind], { ...look, kinds: { ...look.kinds, [kind]: { ...k, text: c } } })),
            (c) => setK({ text: c }), `${t["kind_" + kind]}: ${t.look_text}`),
          kind === "store" ? null : emojiField(this.shadowRoot, h("input", { class: "icon", value: k.icon != null ? k.icon : BADGE_DEFAULTS[kind].icon, maxlength: "8", "aria-label": t.look_icon, title: t.emoji_pick,
            onchange: (e) => setK({ icon: e.target.value === BADGE_DEFAULTS[kind].icon ? null : e.target.value }) }), t),
          reset(() => { const n = { ...look.kinds }; delete n[kind]; look = { ...look, kinds: n }; draw(); save(); }, t.reset_default)));
    };
    const listEl = h("div");
    const drawValues = () => {
      const q = searchKey(query);
      const rows = tags.filter((x) => !q || searchKey(x.label + " " + x.value).includes(q)).slice(0, 60);
      fill(listEl, ...rows.map((x) => {
        const cur = look.values[x.key] || {};
        let prevV = null;
        const setV = (patch) => {
          const next = { ...cur, ...patch };
          Object.keys(next).forEach((y) => (next[y] == null || next[y] === "") && delete next[y]);
          const values = { ...look.values };
          if (Object.keys(next).length) values[x.key] = next; else delete values[x.key];
          look = { ...look, values };
          drawValues(); save();
        };
        const preview = { kind: x.kind, value: x.value, label: x.kind === "store" ? (cur.label || x.label) : x.label, color: x.kind === "store" ? x.color : null };
        return h("div", { class: "srow2" },
          (prevV = h("div", { class: "sl" }, badge(preview, look), x.count ? h("small", {}, `${x.count}×`) : null)),
          h("div", { class: "look-row" },
            x.kind === "store" ? h("input", { class: "search2", style: "width:110px;margin:0", value: cur.label || "", placeholder: x.label, "aria-label": `${x.label}: ${t.look_label}`, title: t.look_label,
              onchange: (e) => setV({ label: e.target.value.trim() || null }) }) : null,
            colorInput(cur.color || (x.kind === "store" ? x.color : null),
              (c) => fill(prevV, badge({ ...preview, color: x.kind === "store" ? c : preview.color }, { ...look, values: { ...look.values, [x.key]: { ...cur, color: c } } }),
                x.count ? h("small", {}, `${x.count}×`) : null),
              (c) => setV({ color: c }), `${x.label}: ${t.look_color}`),
            colorInput(cur.text || textOn(cur.color || (x.kind === "store" ? x.color : null) || "#888888"),
              (c) => fill(prevV, badge(preview, { ...look, values: { ...look.values, [x.key]: { ...cur, text: c } } }),
                x.count ? h("small", {}, `${x.count}×`) : null),
              (c) => setV({ text: c }), `${x.label}: ${t.look_text}`),
            Object.keys(cur).length ? reset(() => setV({ color: null, text: null, label: null }), t.reset_default) : null));
      }), tags.length > 60 && !query ? h("div", { class: "shelp" }, t.look_more) : null);
    };
    const draw = () => {
      fill(body,
        h("div", { class: "grp" }, t.look_kinds), kindRow("store"), kindRow("person"), kindRow("tag"),
        h("div", { class: "grp" }, t.look_values),
        h("input", { type: "search", class: "search2", placeholder: t.look_search, "aria-label": t.look_search, value: query, oninput: (e) => { query = e.target.value; drawValues(); } }),
        listEl,
        h("div", { class: "acts" }, status, h("button", { class: "btn2", type: "button", onclick: async () => {
          // neues Badge vorab einfärben: "@Kaufland", "*Max", "#vegan"
          const v = await slDialog(this.shadowRoot, { title: t.look_add, text: t.look_add_help, input: true, placeholder: "@Kaufland", ok: t.pack_add, cancel: t.cancel });
          if (!v) return;
          const rules = (this._cfg && this._cfg.tag_rules) || [];
          const rule = rules.find((r) => v.startsWith(r.prefix));
          const kind = rule ? rule.kind : "store";
          const value = (rule ? v.slice(rule.prefix.length) : v).trim();
          if (!value) return;
          const key = `${kind}:${value.toLowerCase()}`;
          if (!tags.some((x) => x.key === key)) tags = [{ key, kind, value, label: value, color: null, count: 0, custom: {} }, ...tags];
          look = { ...look, values: { ...look.values, [key]: { color: kind === "store" ? "#1747b5" : "#7b61ff" } } };
          query = ""; draw(); save();
        } }, "＋ " + t.look_add)));
      drawValues();
    };
    this._call("appearance", {}, false).then((r) => { look = r.appearance; tags = r.tags; draw(); }).catch(() => fill(body, t.error));
    return this._sec("🎨", t.look, t.look_help, [body]);
  }

  // Märkte & Zonen: Markt (@REWE) mit einer HA-Zone verknüpfen oder dafür direkt eine Zone anlegen.
  // Im Einkaufsmodus zeigt die Karte dann automatisch nur den Markt, in dessen Zone man gerade ist.
  _storesSection() {
    const t = this._t;
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    const status = h("span", { class: "ok2" });
    // gleichnamige Zonen (zwei Filialen „REWE“) unterscheidbar machen: dann mit Entitäts-ID dahinter
    const zones = () => {
      const all = Object.values(this._hass.states).filter((s) => s.entity_id.startsWith("zone."))
        .map((s) => [s.entity_id, s.attributes.friendly_name || s.entity_id]);
      const count = {};
      all.forEach(([, n]) => { const k = n.trim().toLowerCase(); count[k] = (count[k] || 0) + 1; });
      return all.map(([id, n]) => [id, count[n.trim().toLowerCase()] > 1 ? `${n} (${id})` : n]).sort((a, b) => a[1].localeCompare(b[1]));
    };
    const link = async (store, zones) => {
      try {
        const r = await this._call("set_store_zone", { store, zones }, false);
        status.textContent = "✓ " + t.saved;
        this._cfg = { ...this._cfg, store_zones: r.store_zones };
        draw(r.stores);
      } catch (err) { status.textContent = (err && err.message) || t.error; }
    };
    const createZone = async (store) => {
      // fragt Name, Ort (Standort / Zuhause / Karte / Koordinaten) und Radius
      const z = await slZoneDialog(this.shadowRoot, this._hass, t, store || "");
      if (!z) return;
      let name = z.name;
      // Gibt es schon eine Zone mit diesem Namen (z. B. zweite REWE-Filiale)? Warnen – behalten oder umbenennen
      const zoneNames = () => Object.values(this._hass.states).filter((s) => s.entity_id.startsWith("zone."))
        .map((s) => String(s.attributes.friendly_name || "").trim().toLowerCase());
      const taken = (n) => zoneNames().includes(String(n).trim().toLowerCase());
      while (taken(name)) {
        const keep = await slDialog(this.shadowRoot, { title: t.zone_dup_title, text: t.zone_dup_text.split("{name}").join(name), ok: t.zone_dup_keep, cancel: t.zone_dup_rename });
        if (keep) break;
        let k = 2;
        while (taken(`${name} ${k}`)) k++;
        const renamed = await slDialog(this.shadowRoot, { title: t.zone_dup_rename, text: t.zone_dup_rename_help, input: true, value: `${name} ${k}`, ok: t.create, cancel: t.cancel });
        if (!renamed) return;
        name = renamed;
      }
      try {
        const before = new Set(Object.keys(this._hass.states).filter((e) => e.startsWith("zone.")));
        await this._hass.callWS({ type: "zone/create", name, icon: "mdi:cart", latitude: z.latitude, longitude: z.longitude, radius: z.radius, passive: false });
        // auf die neue Zone warten (Entität erscheint kurz danach) – die NEUE, nicht eine gleichnamige vorhandene
        let zone = null;
        for (let i = 0; i < 20 && !zone; i++) {
          await new Promise((r) => setTimeout(r, 250));
          const hit = Object.values(this._hass.states).find((s) => s.entity_id.startsWith("zone.") && !before.has(s.entity_id) && s.attributes.friendly_name === name);
          zone = hit && hit.entity_id;
        }
        if (!zone) { status.textContent = t.zone_wait; return; }
        const key = String(store || name).trim().replace(/^@/, "").toLowerCase();
        await link(key, [...(((this._cfg && this._cfg.store_zones) || {})[key] || []), zone]);
        status.textContent = `✓ ${name}`;
      } catch (err) { status.textContent = (err && err.message) || t.error; }
    };
    const draw = (stores) => {
      const zs = zones();
      const nameOf = (id) => { const hit = zs.find(([z]) => z === id); return hit ? hit[1] : this._hass.states[id] ? id : `⚠️ ${id}`; };
      // je Markt beliebig viele Zonen (Filialen): Chips mit ×, dazu Auswahl „＋ Zone“
      fill(body, ...stores.map((st) => {
        const linked = st.zones || (st.zone ? [st.zone] : []);
        return h("div", { class: "srow2 storerow" },
          h("div", { class: "sl" }, badge({ kind: "store", value: st.value, label: st.label, color: st.color }),
            h("small", {}, linked.length ? `${linked.length} ${t.zone_count}` : t.zone_none),
            h("button", { class: "btn2", type: "button", style: "height:28px;padding:0 10px;margin-top:4px;font-size:.8rem",
              onclick: () => this._aisleEditor(body, st, linked, () => this._call("stores", {}, false).then((r) => draw(r.stores))) },
              "🛤️ " + t.aisle + (((this._cfg && this._cfg.store_order) || {})[st.key] ? " ✓" : ""))),
          h("div", { class: "zchips" },
            linked.map((z) => h("span", { class: "zchip" }, "📍 ", nameOf(z),
              h("button", { type: "button", title: t.zone_unlink, "aria-label": `${t.zone_unlink}: ${nameOf(z)}`, onclick: () => link(st.key, linked.filter((x) => x !== z)) }, "×"))),
            h("select", { "aria-label": `${st.label}: ${t.zone_add}`, onchange: (e) => {
              const v = e.target.value; e.target.value = "";
              if (v === "__new") createZone(st.label); else if (v) link(st.key, [...linked, v]);
            } }, h("option", { value: "" }, "＋ " + t.zone_add),
              zs.filter(([id]) => !linked.includes(id)).map(([id, n]) => h("option", { value: id }, n)),
              h("option", { value: "__new" }, "＋ " + t.zone_new + " …"))));
      }),
        h("div", { class: "acts" }, status,
          h("a", { class: "btn2", href: "/config/zone", target: "_top", style: "display:inline-flex;align-items:center;text-decoration:none" }, t.zone_manage),
          h("button", { class: "btn2", type: "button", onclick: async () => {
            const store = await slDialog(this.shadowRoot, { title: t.store_add, text: t.store_add_help, input: true, placeholder: "REWE", ok: t.create, cancel: t.cancel });
            if (store) createZone(store);
          } }, "＋ " + t.store_add)));
    };
    this._call("stores", {}, false).then((r) => draw(r.stores)).catch(() => fill(body, t.error));
    return this._sec("📍", t.stores, t.stores_help, [body]);
  }

  // Notizlisten der App: aus SmartLists ausblenden (Standard) oder als eigener Bereich; an Konto gebunden
  _notesSection() {
    const t = this._t;
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    const status = h("span", { class: "ok2" });
    const set = async (patch) => {
      try { const r = await this._call("set_notes", patch, false); status.textContent = "✓ " + t.saved; draw(r); this._refreshPanel();
        if (this._cfg && patch.mode) this._cfg = { ...this._cfg, features: { ...(this._cfg.features || {}), notes: patch.mode === "section" } }; }
      catch (err) { status.textContent = (err && err.message) || t.error; }
    };
    let users = [];
    const draw = (info) => {
      fill(body,
        this._setRow(t.notes_show, this._switch(info.mode === "section", (on) => set({ mode: on ? "section" : "hidden" }), t.notes_show), t.notes_show_help),
        this._setRow(t.notes_scope, h("select", { "aria-label": t.notes_scope, onchange: (e) => set({ scope: e.target.value }) },
          [["owner", t.notes_scope_owner], ["household", t.notes_scope_household]].map(([v, l]) => h("option", { value: v, selected: info.scope === v }, l)))),
        info.lists.length ? h("div", { class: "grp" }, t.notes_lists) : h("div", { class: "shelp", style: "padding:6px 0" }, t.notes_none),
        h("div", { class: "acts", style: "justify-content:flex-start;margin-top:4px" }, h("button", { class: "btn2", type: "button", onclick: async () => {
          const name = await slDialog(this.shadowRoot, { title: t.notes_create, text: t.notes_create_help, input: true, value: (this._hass.user && this._hass.user.name) || "", ok: t.create, cancel: t.cancel });
          if (!name) return;
          status.textContent = t.loading;
          try { const r = await this._call("create_notes", { name }, false); status.textContent = `✓ ${r.entity_id}`; draw(await this._call("notes", {}, false)); this._refreshPanel(); }
          catch (err) { status.textContent = (err && err.message) || t.error; }
        } }, "＋ " + t.notes_create)),
        ...info.lists.map((n) => this._setRow(n.name,
          h("select", { "aria-label": `${n.name}: ${t.owner}`, onchange: (e) => set({ owners: { [n.entity_id]: e.target.value || null } }) },
            h("option", { value: "" }, "— " + t.notes_no_owner),
            users.map((u) => h("option", { value: u.id, selected: n.owner_id === u.id }, u.name))),
          n.entity_id)),
        h("div", { class: "acts" }, status));
    };
    Promise.all([this._call("notes", {}, false), this._call("users", {}, false).catch(() => ({ users: [] }))])
      .then(([info, u]) => { users = u.users || []; draw(info); }).catch(() => fill(body, t.error));
    return this._sec("📝", t.notes, t.notes_help, [body]);
  }
  // Seitenleisten-Seite neu laden lassen (Notizen ein/aus ändert die Listen-Auswahl)
  _refreshPanel() { window.dispatchEvent(new CustomEvent("smartlists-lists-changed")); }
  // Extras (Notizen, Wochenplan): an, solange die Integration nichts anderes meldet
  _feat(name) { const f = this._cfg && this._cfg.features; return !f || f[name] !== false; }

  // Global → Extras: optionale Bereiche, die Einsteiger nicht brauchen (im Assistenten standardmäßig aus)
  _extrasSection() {
    const t = this._t;
    const status = h("span", { class: "ok2" });
    const body = h("div");
    const set = async (patch) => {
      try {
        const r = await this._call("set_features", patch, false);
        this._cfg = { ...this._cfg, features: r.features };
        status.textContent = "✓ " + t.saved;
        this._refreshPanel();
      } catch (err) { status.textContent = (err && err.message) || t.error; }
      draw();
    };
    const draw = () => {
      const f = (this._cfg && this._cfg.features) || {};
      fill(body,
        this._setRow(t.x_notes, this._switch(!!f.notes, (on) => set({ notes: on }), t.x_notes), t.x_notes_help),
        this._setRow(t.x_mealplan, this._switch(f.mealplan !== false, (on) => set({ mealplan: on }), t.x_mealplan), t.x_mealplan_help),
        this._setRow(t.x_stats, this._switch(f.stats !== false, (on) => set({ stats: on }), t.x_stats), t.x_stats_help),
        h("div", { class: "acts" }, status));
    };
    draw();
    return this._sec("🧩", t.x_title, t.x_help, [body]);
  }

  /* ---------------- 2.8: Markt-Reihenfolge, Preise, Vorlagen, Scannen, Statistik, Teilen, Benachrichtigungen ---------------- */
  // Reihenfolge der Kategorien: im Einkaufsmodus für einen Markt dessen Gänge (Filiale vor Markt), sonst Standard
  _catOrder(d) {
    const base = d.categories.map((c) => c.id);
    const so = (this._cfg && this._cfg.store_order) || {};
    if (!this._shopping || !this._shopStore) return base;
    const order = (this._shopZone && so[`${this._shopStore}@${this._shopZone}`]) || so[this._shopStore];
    return order ? [...order, ...base.filter((c) => !order.includes(c))] : base;
  }
  // „Einkauf beendet“: Summe im Wagen auf 0 – optional alles wieder offen für den nächsten Einkauf
  _finishShopping(doneCount) {
    const t = this._t;
    const run = async (reopen) => {
      dlg.remove();
      try {
        const r = await this._call("finish_shopping", { reopen });
        if (this._shopping) this._toggleShopping();
        this._toast(reopen ? `✓ ${t.trip_done} · ${r.reopened} ${t.unchecked}` : `✓ ${t.trip_done}`);
        await this._load();
      } catch (err) { this._toast((err && err.message) || t.error); }
    };
    const dlg = this._dialog(t.trip_done, h("p", {}, t.trip_help), [
      h("button", { type: "button", onclick: () => dlg.remove() }, t.cancel),
      h("button", { type: "button", onclick: () => run(true) }, `${t.trip_reopen} (${doneCount})`),
      h("button", { type: "button", class: "ok", onclick: () => run(false) }, t.trip_finish)]);
  }
  _priceLine(it) {
    const t = this._t, p = it.price, lang = this._hass.language;
    const qty = (it.quantity || 1) * (it.pack_count || 1);
    const per = qty !== 1 && p.unit_price != null ? ` · ${fmtMoney(p.unit_price, lang)}${it.unit ? "/" + it.unit : ""}` : "";
    return h("div", { class: "priceline", title: p.source === "paid" ? t.price_paid : t.price_manual },
      p.source === "paid" ? "~ " : "", h("b", {}, fmtMoney(p.total, lang)), per, p.source === "paid" ? ` ${t.price_last}` : "");
  }

  // Vorlagen-Leiste über dem Eingabefeld (Knopf 📋 in der Kopfzeile)
  async _renderTemplates() {
    const el = this._tplEl;
    if (!el) return;
    if (!this._showTpl || !this._data) return fill(el);
    const t = this._t;
    if (!this._tpls) {
      fill(el, h("div", { class: "shelp", style: "padding:8px 14px" }, t.loading));
      try { this._tpls = (await this._call("templates", {}, false)).templates; } catch (e) { this._tpls = []; }
    }
    const tiles = this._tpls.map((tp) => h("button", { type: "button", class: "tcard", onclick: () => this._templateDialog(tp) },
      h("b", {}, `${tp.emoji ? tp.emoji + " " : ""}${tp.name}`),
      h("small", {}, `${tp.items.length} ${t.imp_count}${tp.servings ? ` · ${tp.servings} ${t.tpl_servings}` : ""} · ${tp.items.slice(0, 3).join(", ")}`),
      h("span", { class: "ed" }, iconBtn(ICON.pencil, t.edit, (e) => { e.stopPropagation(); this._templateEditor(tp); }))));
    fill(el, h("div", { class: "grp", style: "padding:8px 14px 0" }, t.tpl),
      h("div", { class: "tplbar" }, tiles,
        h("button", { type: "button", class: "tcard new", onclick: () => this._templateEditor(null) }, "＋ " + t.tpl_new),
        this._data.items.some((i) => !i.checked) ? h("button", { type: "button", class: "tcard new", onclick: () => this._templateEditor({
          name: "", emoji: "", servings: null, items: this._data.items.filter((i) => !i.checked).map((i) => i.text) }, true) }, "📥 " + t.tpl_from_list) : null));
  }
  _dialog(title, body, actions, width = 460) {
    const back = h("div", { class: "dlg-back", onpointerdown: (ev) => { back._down = ev.target === back; if (!back._down && ev.target.closest && ev.target.closest("input, textarea, select, .emo, .swatch")) back._dirty = true; }, oninput: () => { back._dirty = true; }, onclick: (ev) => { if (backdropClose(back, ev)) back.remove(); } },
      h("style", {}, DIALOG_STYLE),
      h("div", { class: "dlg", role: "dialog", "aria-modal": "true", "aria-label": title, style: `max-width:${width}px;max-height:90vh;overflow:auto` },
        h("h2", {}, title), body, h("div", { class: "row", style: "margin-top:12px" }, actions)));
    this.shadowRoot.append(back);
    return back;
  }
  // Vorlage hinzufügen: Portionen wählen, einzelne Artikel abwählen
  _templateDialog(tp) {
    const t = this._t;
    let servings = tp.servings || null;
    const skip = new Set();
    const listEl = h("div");
    const scale = (text) => {
      if (!servings || !tp.servings || servings === tp.servings) return text;
      const p = parseText(text, this._cfg.tag_rules, this._cfg.known_stores, true);
      if (p.quantity == null) return text;
      p.quantity = Math.round(p.quantity * servings / tp.servings * 100) / 100;
      return encodeText(p, this._cfg.tag_rules);
    };
    const present = new Set(this._data.items.filter((i) => !i.checked).map((i) => i.name.toLowerCase()));
    const draw = () => fill(listEl, tp.items.map((text, i) => {
      const p = parseText(text, this._cfg.tag_rules, this._cfg.known_stores, true);
      return h("label", { class: "srow2", style: "cursor:pointer" },
        h("input", { type: "checkbox", checked: !skip.has(i), style: "width:auto;height:auto;margin:0", onchange: (e) => { if (e.target.checked) skip.delete(i); else skip.add(i); } }),
        h("div", { class: "sl" }, scale(text), present.has(p.name.toLowerCase()) ? h("small", {}, t.tpl_increase) : null));
    }));
    draw();
    const body = h("div", {},
      tp.servings ? this._setRow(t.tpl_servings, h("input", { type: "number", min: "1", max: "100", value: String(servings), style: "width:80px;margin:0",
        oninput: (e) => { servings = Math.max(1, Number(e.target.value) || tp.servings); draw(); } }), t.tpl_servings_help) : null,
      listEl);
    const dlg = this._dialog(`${tp.emoji ? tp.emoji + " " : ""}${tp.name}`, body, [
      h("button", { type: "button", onclick: () => dlg.remove() }, t.cancel),
      h("button", { type: "button", class: "ok", onclick: async () => {
        dlg.remove();
        try {
          const r = await this._call("add_template", { template_id: tp.id, servings, skip: [...skip] });
          this._toast(`${tp.name}: ${r.added} ${t.added}${r.increased ? `, ${r.increased} ${t.tpl_increased}` : ""}`);
          await this._load();
        } catch (err) { this._error = (err && err.message) || t.error; this._render(); }
      } }, t.pack_add)]);
  }
  // Vorlage anlegen/bearbeiten: Name, Symbol, Portionen, ein Artikel pro Zeile
  _templateEditor(tp, fromList = false) {
    const t = this._t;
    const name = h("input", { value: (tp && tp.name) || "", placeholder: t.tpl_name, "aria-label": t.tpl_name, maxlength: "60" });
    const emoji = emojiField(this.shadowRoot, h("input", { value: (tp && tp.emoji) || "", placeholder: "🥞", "aria-label": t.look_icon, title: t.emoji_pick, maxlength: "8", style: "width:64px;text-align:center;font-size:1.2rem" }), t);
    const servings = h("input", { type: "number", min: "1", max: "100", value: tp && tp.servings ? String(tp.servings) : "", placeholder: t.tpl_servings, "aria-label": t.tpl_servings, style: "width:110px" });
    const items = h("textarea", { rows: "8", placeholder: t.tpl_items_placeholder, "aria-label": t.tpl_items,
      style: "width:100%;box-sizing:border-box;border-radius:10px;border:1px solid var(--divider-color,#ccc);background:var(--secondary-background-color,#f2f2f2);color:inherit;font:inherit;padding:10px 12px;margin:0 0 6px" });
    items.value = ((tp && tp.items) || []).join("\n");
    const body = h("div", {}, h("div", { style: "display:flex;gap:8px" }, emoji, name), servings,
      h("p", {}, t.tpl_items_help), items);
    const actions = [];
    if (tp && tp.id) actions.push(h("button", { type: "button", style: "margin-right:auto;color:var(--error-color,#db4437)", onclick: async () => {
      dlg.remove(); await this._call("delete_template", { template_id: tp.id }, false); this._tpls = null; this._renderTemplates();
    } }, t.delete));
    actions.push(h("button", { type: "button", onclick: () => dlg.remove() }, t.cancel),
      h("button", { type: "button", class: "ok", onclick: async () => {
        const lines = items.value.split("\n").map((x) => x.trim()).filter(Boolean);
        if (!name.value.trim() || !lines.length) return;
        try {
          await this._call("save_template", { ...(tp && tp.id ? { template_id: tp.id } : {}), name: name.value.trim(), items: lines,
            emoji: emoji.value.trim(), servings: servings.value ? Number(servings.value) : null }, false);
          dlg.remove(); this._tpls = null; this._showTpl = true; this._renderTemplates();
        } catch (err) { this._toast((err && err.message) || t.error); }
      } }, t.save));
    const dlg = this._dialog(tp && tp.id ? t.tpl_edit : fromList ? t.tpl_from_list : t.tpl_new, body, actions);
    setTimeout(() => name.focus(), 30);
  }
  // Wochenplan: Gerichte (Vorlagen) je Tag, Zutaten auf die Liste, optional aus Mealie holen
  // Wochenplan als Fenster (⋯ → Wochenplan) …
  async _mealPlanDialog() {
    const t = this._t;
    let dlg = null;
    const mp = await this._mealPlanBuild(() => dlg && dlg.remove(), () => dlg);
    dlg = this._dialog(t.mp_title, mp.body, mp.actions, 640);
    dlg.prepend(mp.style);
    mp.load();
  }
  // … oder direkt in der Karte bzw. auf der Seite /smartlists (Tab „Wochenplan“, Karte mit view: mealplan)
  async _renderMealPlanView() {
    const t = this._t;
    if (this._mpView && this._mpView.lang === this._lang) return;
    this._mpView = { lang: this._lang };
    const card = h("ha-card", {}, h("div", { class: "mpwrap" }, h("div", { class: "mph" }, "🗓️ " + t.mp_title), h("div", { class: "shelp" }, t.loading)));
    fill(this.shadowRoot, h("style", {}, STYLE), card);
    const mp = await this._mealPlanBuild(null, () => this._mpView);
    fill(card, mp.style, h("div", { class: "mpwrap" }, h("div", { class: "mph" }, "🗓️ " + t.mp_title), mp.body, h("div", { class: "acts mpacts" }, mp.actions)));
    mp.load();
  }
  // Gemeinsamer Aufbau. close: Fenster schließen (null = eingebettet), holder(): Objekt für _dirty
  async _mealPlanBuild(close, holder) {
    const t = this._t;
    const lang = this._hass.language || "de";
    const inline = !close;
    const startOf = (off) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + off * 7); return d; };
    let week = 0, tpls = [], days = [], mealie = false, lists = [];
    try { tpls = (await this._call("templates", {}, false)).templates; } catch (e) { /* */ }
    try { mealie = (await this._call("mealie_status", {}, false)).available; } catch (e) { /* */ }
    try { lists = (await this._call("lists", {}, false)).lists.filter((l) => l.can_add && l.type !== "notes"); } catch (e) { /* */ }
    // Ziel-Liste für „Zutaten auf die Liste“: die Liste der Karte, sonst die erste passende
    let target = (lists.find((l) => l.entity_id === this._config.entity) || lists[0] || { entity_id: this._config.entity }).entity_id;
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const status = h("span", { class: "ok2" });
    const grid = h("div", { class: "mpgrid" });
    const title = h("b", {});
    const setDirty = (v) => { const o = holder && holder(); if (o) o._dirty = v; };
    const load = async () => {
      const s0 = startOf(week);
      title.textContent = `${s0.toLocaleDateString(lang, { day: "numeric", month: "short" })} – ${new Date(s0.getTime() + 6 * 864e5).toLocaleDateString(lang, { day: "numeric", month: "short" })}`;
      try { days = (await this._call("mealplan", { start: iso(s0), days: 7 }, false)).days; } catch (e) { days = []; }
      draw();
    };
    // Änderungen erst sammeln (auch über mehrere Wochen), gespeichert wird mit „Speichern“ bzw. „Zutaten auf die Liste“
    const pending = {};
    const change = (date, ids) => { pending[date] = ids; setDirty(true); draw(); };
    const saveAll = async () => {
      for (const [date, ids] of Object.entries(pending)) { await this._call("set_meals", { date, template_ids: ids }, false); delete pending[date]; }
      setDirty(false);
    };
    const tplById = (id) => tpls.find((x) => x.id === id) || { id, name: id };
    const today = iso(new Date());
    const draw = () => fill(grid, days.map((day) => {
      const ids = pending[day.date] || day.templates.map((x) => x.id);
      const shown = pending[day.date] ? ids.map(tplById) : day.templates;
      const sel = h("select", { "aria-label": day.date, onchange: (e) => {
        if (!e.target.value) return;
        change(day.date, [...ids, e.target.value]);
      } }, h("option", { value: "" }, "＋ " + t.mp_add), tpls.filter((x) => !ids.includes(x.id)).map((x) => h("option", { value: x.id }, `${x.emoji || ""} ${x.name}`.trim())));
      return h("div", { class: `mpday ${day.date === today ? "today" : ""} ${pending[day.date] ? "changed" : ""}` },
        h("div", { class: "mpd" }, new Date(day.date + "T12:00").toLocaleDateString(lang, { weekday: "short", day: "numeric", month: "numeric" })),
        h("div", { class: "mpm" }, shown.map((x) => h("span", { class: "chip2 on" }, `${x.emoji || ""} ${x.name}`.trim(),
          h("button", { type: "button", class: "xdel", "aria-label": t.delete, onclick: () => change(day.date, ids.filter((y) => y !== x.id)) }, "×"))),
          tpls.length ? sel : h("span", { class: "shelp" }, t.mp_no_tpl)));
    }));
    const finish = (msg) => { if (close) { close(); this._toast(msg); } else { load(); status.textContent = msg; } };
    const addMeals = async () => {
      const r = await this._call("add_meals", { entity_id: target, start: iso(startOf(week)), days: 7 }, false);
      finish(`✓ ${r.added} ${t.added}${r.increased ? `, ${r.increased} ${t.tpl_increased}` : ""}`);
      if (target === this._config.entity && this._data) this._load();
    };
    const body = h("div", {},
      h("div", { class: "mpnav" }, iconBtn(ICON.back, t.mp_prev, () => { week--; load(); }), title, h("button", { type: "button", class: "icon-btn mpnext", title: t.mp_next, "aria-label": t.mp_next, onclick: () => { week++; load(); } }, svg(ICON.back, 18))),
      h("p", { class: "shelp" }, t.mp_help), grid,
      h("div", { class: "acts", style: "justify-content:flex-start;align-items:center;flex-wrap:wrap" },
        lists.length > 1 ? h("label", { class: "mptarget" }, t.mp_target + " ", h("select", { "aria-label": t.mp_target, onchange: (e) => { target = e.target.value; } },
          lists.map((l) => h("option", { value: l.entity_id, selected: l.entity_id === target }, l.name)))) : null,
        mealie ? h("button", { class: "btn2", type: "button", onclick: async () => {
          status.textContent = t.loading;
          try { const r = await this._call("mealie_import", { start: iso(startOf(week)), days: 7, plan: true }, false);
            status.textContent = `✓ ${r.recipes} ${t.mp_recipes}`; tpls = (await this._call("templates", {}, false)).templates; this._tpls = null; load(); }
          catch (err) { status.textContent = (err && err.message) || t.error; }
        } }, "🍽️ " + t.mp_mealie) : null),
      h("div", {}, status));
    const actions = [
      close ? h("button", { type: "button", onclick: () => close() }, t.cancel) : null,
      h("button", { type: "button", class: inline ? "btn2" : "", onclick: async () => {
        try {
          await saveAll();
          const yes = await slDialog(this.shadowRoot, { title: t.mp_saved, text: t.mp_ask_add, ok: t.mp_to_list, cancel: t.mp_not_now });
          if (!yes) { finish("✓ " + t.mp_saved); return; }
          await addMeals();
        } catch (err) { status.textContent = (err && err.message) || t.error; }
      } }, t.save),
      h("button", { type: "button", class: inline ? "btn2 primary" : "ok", onclick: async () => {
        try { await saveAll(); await addMeals(); }
        catch (err) { status.textContent = (err && err.message) || t.error; }
      } }, t.mp_to_list)].filter(Boolean);
    const style = h("style", {}, `.mpgrid{display:grid;gap:0}.mpday{display:grid;grid-template-columns:110px minmax(0,1fr);gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--divider-color,#e0e0e0)}
      .mpday.today .mpd{color:var(--primary-color)}.mpday.changed .mpd::after{content:" •";color:var(--primary-color)}
      .mpd{font-weight:600}.mpm{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.mpm select,.mptarget select{width:auto;height:auto;min-height:34px;line-height:1.4;padding:5px 30px 5px 10px;margin:0;box-sizing:border-box}
      .mptarget{display:inline-flex;align-items:center;gap:6px;font-size:.88rem;color:var(--secondary-text-color)}
      .chip2{border:1px solid var(--divider-color,#ddd);border-radius:16px;padding:3px 4px 3px 10px;font-size:.85rem;display:inline-flex;align-items:center;gap:2px}
      .chip2.on{border-color:var(--primary-color);color:var(--primary-color)}.xdel{background:none;border:none;color:inherit;cursor:pointer;font-size:1rem;padding:0 4px;height:auto}
      .mpnav{display:flex;align-items:center;gap:8px;justify-content:space-between;margin-bottom:6px}.mpnav .icon-btn{background:none;border:none;color:inherit;cursor:pointer;height:32px;width:32px;padding:0}
      .mpnext svg{transform:rotate(180deg)}.btn2{height:34px;padding:0 14px;border-radius:17px;border:1px solid var(--divider-color,#ddd);background:none;color:var(--primary-color);cursor:pointer}
      .btn2.primary{background:var(--primary-color);color:var(--text-primary-color,#fff);border-color:var(--primary-color)}
      .shelp{color:var(--secondary-text-color);font-size:.82rem}.acts{display:flex;gap:8px;margin-top:10px}.ok2{font-size:.85rem;color:var(--secondary-text-color)}
      .mpwrap{padding:16px}.mph{font-size:1.25rem;font-weight:500;margin-bottom:8px}.mpacts{justify-content:flex-end}
      @media(max-width:520px){.mpday{grid-template-columns:minmax(0,1fr)}}`);
    return { body, actions, style, load };
  }

  // Global → Sprache, Sichern, Standard: fertige Einkaufs-Ansicht (Dashboard) mit einem Klick
  async _createDashboard(status) {
    const t = this._t;
    const st = this._hass.states;
    const lists = Object.keys(st).filter((e) => e.startsWith("todo.") && !isNotesEntity(e, st[e].attributes.friendly_name))
      .sort((a, b) => (Number(!!st[b].attributes.smartlists_combined) - Number(!!st[a].attributes.smartlists_combined)) || a.localeCompare(b));
    // Entitäts-IDs hängen von der Sprache beim Anlegen ab → über Merkmale suchen statt fest eintragen
    const cal = Object.keys(st).find((e) => e.startsWith("calendar.smartlists")) || "calendar.smartlists_meal_plan";
    const exp = Object.keys(st).find((e) => e.startsWith("sensor.smartlists") && st[e].attributes.unit_of_measurement === "€") || "sensor.smartlists_expenses_this_month";
    const config = { views: [
      { title: t.db_lists, path: "lists", icon: "mdi:cart", type: "panel", cards: [{ type: "custom:smartlists-card", entities: lists, layout: "tabs" }] },
      this._feat("mealplan") ? { title: t.db_plan, path: "plan", icon: "mdi:silverware-fork-knife", cards: [{ type: "calendar", entities: [cal], initial_view: "listWeek" }] } : null,
      this._feat("stats") ? { title: t.db_stats, path: "stats", icon: "mdi:chart-bar", cards: [
        { type: "entities", entities: [exp] },
        { type: "custom:smartlists-card", entity: lists[0], settings_only: true, settings_scope: "stats" }] } : null,
    ].filter(Boolean) };
    status.textContent = t.loading;
    try {
      try { await this._hass.callWS({ type: "lovelace/dashboards/create", url_path: "smartlists-shopping", title: t.db_title, icon: "mdi:cart-outline", show_in_sidebar: true, require_admin: false, mode: "storage" }); }
      catch (e) { if (!/exist|unique/i.test((e && e.message) || "")) throw e; }
      await this._hass.callWS({ type: "lovelace/config/save", url_path: "smartlists-shopping", config });
      status.textContent = "";
      fill(status, "✓ ", h("a", { href: "/smartlists-shopping/lists", target: "_top" }, t.db_open));
    } catch (err) { status.textContent = (err && err.message) || t.error; }
  }

  // Von vorn anfangen: Teile zurücksetzen, dann den Assistenten starten. To-do-Listen bleiben immer erhalten.
  _resetDialog() {
    const t = this._t;
    const opts = { settings: true, data: false, links: false, combined: false };
    const box = (key) => h("label", { class: "rsrow" },
      h("input", { type: "checkbox", checked: opts[key], onchange: (e) => { opts[key] = e.target.checked; } }),
      h("span", {}, h("b", {}, t["rs_" + key]), h("small", {}, t["rs_" + key + "_sub"])));
    const status = h("span", { class: "ok2" });
    const dlg = this._dialog(t.rs_title, h("div", {},
      h("style", {}, `.rsrow{display:flex;gap:12px;align-items:flex-start;padding:9px 0;border-bottom:1px solid var(--divider-color,#e0e0e0);cursor:pointer}
        .rsrow input{width:18px!important;height:18px!important;margin:3px 0 0!important;flex:none}.rsrow small{display:block;color:var(--secondary-text-color);font-size:.8rem}`),
      h("p", {}, t.rs_help), box("settings"), box("data"), box("links"), box("combined"), status), [
      h("button", { type: "button", onclick: () => dlg.remove() }, t.cancel),
      h("button", { type: "button", class: "ok danger", onclick: async () => {
        status.textContent = t.loading;
        try {
          await this._call("reset", opts, false);
          dlg.remove();
          this._showSettings = false; this._render();
          window.__smartlistsSetupOpen = true; // nicht zusätzlich automatisch öffnen
          await this._loadConfig();
          window.dispatchEvent(new CustomEvent("smartlists-lists-changed"));
          this._setupWizard();
        } catch (err) { status.textContent = (err && err.message) || t.error; }
      } }, t.rs_go)]);
  }

  // Vorhandene To-do-Listen in eigene SmartLists-Listen übernehmen (Admins)
  async _migrateDialog() {
    const t = this._t;
    let cands = [];
    try { cands = (await this._call("migrate_candidates", {}, false)).lists; } catch (err) { this._toast((err && err.message) || t.error); return; }
    const S = { sel: new Set(), mode: "each", name: "", tag: "", target: null };
    // Herkunft vor dem Namen: Lokale To-do, Einkaufsliste oder die Integration (Google Tasks, Todoist, CalDAV …)
    const platformChip = (pf) => {
      const known = { local_todo: t.mg_pf_local, shopping_list: t.mg_pf_shopping };
      const label = known[pf] || (pf ? pf.replace(/_/g, " ").replace(/\b\w/g, (x) => x.toUpperCase()) : t.mg_pf_other);
      return h("span", { class: `pfchip ${pf === "local_todo" ? "local" : ""}` }, label);
    };
    const box = h("div", { class: "mgbox" });
    const status = h("span", { class: "ok2" });
    const draw = () => {
      const chosen = cands.filter((c) => S.sel.has(c.entity_id));
      if (!S.targetTouched) S.target = chosen.length && chosen.every((c) => c.notes) ? "notes" : "list";
      const used = chosen.filter((c) => c.used_in.length);
      const radio = (group, value, label, sub, disabled) => h("label", { class: `mgopt ${disabled ? "dis" : ""}` },
        h("input", { type: "radio", name: group, checked: S[group] === value, disabled: !!disabled, onchange: () => { S[group] = value; if (group === "target") S.targetTouched = true; draw(); } }),
        h("span", {}, h("b", {}, label), sub ? h("small", {}, sub) : null));
      fill(box,
        h("style", {}, `.mgbox .mgl,.mgbox .mgopt{display:flex;gap:10px;align-items:flex-start;padding:7px 0;cursor:pointer}
          .mgbox input[type=checkbox],.mgbox input[type=radio]{width:18px!important;height:18px!important;margin:2px 0 0!important;flex:none}
          .mgbox small{display:block;color:var(--secondary-text-color);font-size:.8rem}.mgbox .mgopt.dis{opacity:.45;cursor:default}
          .mgbox h3{font-size:.78rem;text-transform:uppercase;letter-spacing:.04em;color:var(--secondary-text-color);margin:14px 0 2px}
          .mgbox .warn{color:var(--warning-color,#f57c00);font-size:.85rem}
          .mgbox .pfchip{display:inline-block;font-size:.7rem;font-weight:600;padding:1px 7px;border-radius:9px;margin-right:6px;vertical-align:1px;
            background:var(--secondary-background-color,#eee);color:var(--secondary-text-color)}
          .mgbox .pfchip.local{background:color-mix(in srgb, var(--primary-color) 18%, transparent);color:var(--primary-color)}`),
        h("p", { class: "shelp" }, t.mg_help),
        h("h3", {}, t.mg_lists),
        cands.length ? cands.map((c) => h("label", { class: "mgl" },
          h("input", { type: "checkbox", checked: S.sel.has(c.entity_id), onchange: (e) => { if (e.target.checked) S.sel.add(c.entity_id); else S.sel.delete(c.entity_id); draw(); } }),
          h("span", {}, platformChip(c.platform), c.notes ? h("span", { class: "pfchip local" }, "📝 " + t.mg_pf_notes) : null, h("b", {}, c.name), h("small", {}, `${c.entity_id} · ${c.open} ${t.open}`)))) : h("p", {}, t.mg_none),
        // Ziel: als Liste oder als Notizen (Standard: Notizen, wenn nur Notizlisten gewählt sind)
        chosen.length ? [h("h3", {}, t.mg_as),
          radio("target", "list", t.mg_as_list, t.mg_as_list_sub),
          radio("target", "notes", t.mg_as_notes, t.mg_as_notes_sub)] : null,
        chosen.length > 1 ? [h("h3", {}, t.mg_how),
          radio("mode", "each", t.mg_each, t.mg_each_sub),
          radio("mode", "one", t.mg_one, t.mg_one_sub),
          S.mode === "one" ? h("div", { style: "padding-left:28px" },
            h("input", { placeholder: t.mg_name, "aria-label": t.mg_name, value: S.name, oninput: (e) => { S.name = e.target.value; }, style: "width:100%;box-sizing:border-box" }),
            h("label", { class: "mgopt" }, h("span", {}, t.mg_tag + " "),
              h("select", { "aria-label": t.mg_tag, onchange: (e) => { S.tag = e.target.value; } },
                [["", t.mg_tag_none], ["person", t.kind_person], ["tag", t.kind_tag]].map(([v, l]) => h("option", { value: v, selected: S.tag === v }, l))))) : null] : null,
        chosen.length ? [h("h3", {}, t.mg_old),
          h("p", { class: "shelp" }, t.mg_keep_info),
          used.length ? h("p", { class: "warn" }, "⚠️ " + t.mg_used.replace("{lists}", used.map((c) => `${c.name} → ${c.used_in.join(", ")}`).join("; "))) : null] : null,
        status);
    };
    draw();
    const dlg = this._dialog("📥 " + t.mg_title, box, [
      h("button", { type: "button", onclick: () => dlg.remove() }, t.cancel),
      h("button", { type: "button", class: "ok", onclick: async () => {
        if (!S.sel.size) { status.textContent = t.mg_pick; return; }
        status.textContent = t.loading;
        try {
          const r = await this._call("migrate", { sources: [...S.sel], mode: S.sel.size > 1 ? S.mode : "each", name: S.name || null, tag_kind: S.tag || null, target: S.target || "list" }, false);
          dlg.remove();
          window.dispatchEvent(new CustomEvent("smartlists-lists-changed"));
          // Hinweis: die alten Listen gibt es noch – bitte selbst löschen, wenn alles passt
          const olds = cands.filter((c) => S.sel.has(c.entity_id));
          await slDialog(this.shadowRoot, { title: "✓ " + t.mg_title, ok: "OK", cancel: null,
            text: r.lists.map((l) => `${l.name}: ${l.items} ${t.mg_items}`).join("\n")
              + `\n\n${t.mg_done_hint}\n` + olds.map((c) => `• ${c.name} (${c.entity_id})`).join("\n")
              + (olds.some((c) => c.used_in.length) ? `\n\n⚠️ ${t.mg_done_combined}` : "") });
        } catch (err) { status.textContent = (err && err.message) || t.error; }
      } }, t.mg_go)], 520);
  }

  _toast(text) {
    clearTimeout(this._toastT);
    const el = h("div", { class: "msg" }, text);
    fill(this._msgEl, el);
    this._toastT = setTimeout(() => { if (this._msgEl.firstChild === el) fill(this._msgEl); }, 4000);
  }

  // In der Companion-App (Android/iOS): deren eigenen Scanner nutzen (External Bus „bar_code/scan“) –
  // zuverlässiger als die Kamera im WebView. Ergebnis kommt als Befehl „bar_code/scan_result“ zurück.
  _nativeScanner() {
    const ext = this._hass && this._hass.auth && this._hass.auth.external;
    return ext && ext.config && Number(ext.config.hasBarCodeScanner) > 0 && typeof window.externalBus === "function" ? ext : null;
  }
  _scanNative(ext) {
    const t = this._t;
    const orig = window.externalBus;
    let finished = false;
    const restore = () => { if (window.externalBus === hook) window.externalBus = orig; };
    const finish = () => { finished = true; restore(); try { ext.fireMessage({ type: "bar_code/close" }); } catch (e) { /* */ } };
    const hook = (raw) => {
      let msg = raw;
      try { if (typeof raw === "string") msg = JSON.parse(raw); } catch (e) { /* */ }
      if (!finished && msg && msg.type === "command" && msg.command === "bar_code/scan_result") {
        const code = String((msg.payload && (msg.payload.rawValue || msg.payload.code)) || "").trim();
        if (/^\d{6,14}$/.test(code)) { finish(); this._barcodeLookup(code); }
        else { try { ext.fireMessage({ type: "bar_code/notify", payload: { message: t.scan_not_product } }); } catch (e) { /* */ } }
      } else if (!finished && msg && msg.type === "command" && msg.command === "bar_code/aborted") {
        finished = true; restore();
        if (msg.payload && msg.payload.reason === "alternative_options") this._scanDialog(true);
      }
      return orig(raw); // HA beantwortet den Befehl wie gewohnt
    };
    window.externalBus = hook;
    try {
      ext.fireMessage({ type: "bar_code/scan", payload: { title: t.scan, description: t.scan_native_help, alternative_option_label: t.scan_type } });
    } catch (e) { restore(); this._scanDialog(true); }
  }
  // Strichcode → Produkt (Speicher der Integration, sonst Open Food Facts) → Name ins Eingabefeld
  async _barcodeLookup(code) {
    const t = this._t;
    try {
      const r = await this._call("barcode", { code }, false);
      if (!r.found) { this._toast(`${code}: ${t.scan_unknown}`); return; }
      const text = [r.name, r.brand && !r.name.toLowerCase().includes(r.brand.toLowerCase()) ? `(${r.brand})` : ""].filter(Boolean).join(" ");
      // Einstellung „Für mich → Scanner“: Ziel-Liste und ob direkt hinzufügen oder erst ins Eingabefeld
      const target = (this._ui && this._ui.scan_target) || this._config.entity;
      const direct = (this._ui && this._ui.scan_mode === "add") || target !== this._config.entity;
      if (direct) {
        await this._hass.callWS({ type: "smartlists/add_item", entity_id: target, text });
        const name = (this._hass.states[target] && this._hass.states[target].attributes.friendly_name) || target;
        this._toast(`✓ ${text} → ${name}`);
        if (target === this._config.entity) this._load();
        return;
      }
      if (this._input) { this._input.value = text; this._input.dispatchEvent(new Event("input")); this._input.focus(); }
    } catch (err) { this._toast((err && err.message) || t.error); }
  }
  // Strichcode scannen (Kamera, BarcodeDetector) oder eintippen → Name über SmartLists/Open Food Facts ins Eingabefeld
  async _scanDialog(manualOnly = false) {
    const ext = !manualOnly && this._nativeScanner();
    if (ext) { this._scanNative(ext); return; }
    const t = this._t;
    const video = h("video", { autoplay: "", playsinline: "", muted: "" });
    // Android-WebView (Companion-App) spielt nur stumm + inline und erst nach play() ab
    video.muted = true; video.playsInline = true; video.setAttribute("webkit-playsinline", "");
    const box = h("div", { class: "scanbox" }, video);
    const info = h("p", {}, t.scan_help);
    const code = h("input", { inputmode: "numeric", placeholder: t.scan_code, "aria-label": t.scan_code, maxlength: "14" });
    let stream = null, timer = null, done = false;
    const stop = () => { done = true; clearInterval(timer); if (stream) stream.getTracks().forEach((tr) => tr.stop()); };
    const lookup = async (value) => {
      if (!/^\d{6,14}$/.test(value)) return;
      stop();
      info.textContent = t.loading;
      try {
        const r = await this._call("barcode", { code: value }, false);
        if (!r.found) { info.textContent = t.scan_unknown; return; }
        dlg.remove();
        const text = [r.name, r.brand && !r.name.toLowerCase().includes(r.brand.toLowerCase()) ? `(${r.brand})` : ""].filter(Boolean).join(" ");
        if (this._input) { this._input.value = text; this._input.dispatchEvent(new Event("input")); this._input.focus(); }
      } catch (err) { info.textContent = (err && err.message) || t.error; }
    };
    code.addEventListener("keydown", (e) => { if (e.key === "Enter") lookup(code.value.trim()); });
    const dlg = this._dialog(t.scan, h("div", {}, "BarcodeDetector" in window ? box : null, info, code), [
      h("button", { type: "button", onclick: () => { stop(); dlg.remove(); } }, t.cancel),
      h("button", { type: "button", class: "ok", onclick: () => lookup(code.value.trim()) }, t.scan_find)]);
    const observer = new MutationObserver(() => { if (!dlg.isConnected) { stop(); observer.disconnect(); } });
    if (this.shadowRoot && observer.observe) observer.observe(this.shadowRoot, { childList: true });
    if (!("BarcodeDetector" in window) || !navigator.mediaDevices) { info.textContent = t.scan_no_camera; return; }
    try {
      const detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (done) { stop(); return; }
      video.srcObject = stream;
      try { await video.play(); } catch (e) { /* Autoplay blockiert → Nutzer kann ins Bild tippen */ }
      video.addEventListener("click", () => video.play().catch(() => {}));
      timer = setInterval(async () => {
        if (done || video.readyState < 2) return;
        try { const hits = await detector.detect(video); if (hits.length) lookup(hits[0].rawValue); } catch (e) { /* */ }
      }, 300);
    } catch (err) { box.remove(); info.textContent = t.scan_no_camera; }
  }

  // Reihenfolge der Gänge für einen Markt (optional je Filiale) – ▲▼
  _aisleEditor(body, st, zones, onClose) {
    const t = this._t;
    const saved = [...body.childNodes];
    const so = (this._cfg && this._cfg.store_order) || {};
    const cats = categoryOptions(this._lang);
    let zone = "";
    let order = [];
    const load = () => { const cur = so[zone ? `${st.key}@${zone}` : st.key] || (zone ? so[st.key] : null); order = cur ? [...cur] : cats.map(([id]) => id); };
    load();
    const status = h("span", { class: "ok2" });
    const listEl = h("div");
    const label = (id) => (cats.find(([c]) => c === id) || [id, id])[1];
    const move = (i, d) => { const j = i + d; if (j < 0 || j >= order.length) return; [order[i], order[j]] = [order[j], order[i]]; draw(); };
    // Zeilen am Griff ⠿ ziehen (Maus, Finger, Stift) oder mit ▲▼ verschieben
    const sorting = true;
    const startDrag = (e, from) => {
      e.preventDefault();
      const handle = e.currentTarget;
      try { handle.setPointerCapture(e.pointerId); } catch (err) { /* */ }
      const rows = [...listEl.childNodes];
      rows[from].classList.add("dragging");
      let to = from;
      const onMove = (ev) => {
        const hit = (this.shadowRoot.elementFromPoint ? this.shadowRoot.elementFromPoint(ev.clientX, ev.clientY) : null);
        const row = hit && hit.closest ? hit.closest(".aisle") : null;
        const idx = row ? rows.indexOf(row) : -1;
        if (idx >= 0 && idx !== to) { rows.forEach((r) => r.classList.remove("drop")); rows[idx].classList.add("drop"); to = idx; }
      };
      const onUp = () => {
        handle.removeEventListener("pointermove", onMove); handle.removeEventListener("pointerup", onUp); handle.removeEventListener("pointercancel", onUp);
        if (to !== from) { const [x] = order.splice(from, 1); order.splice(to, 0, x); }
        draw();
      };
      handle.addEventListener("pointermove", onMove); handle.addEventListener("pointerup", onUp); handle.addEventListener("pointercancel", onUp);
    };
    const draw = () => fill(listEl, order.map((id, i) => h("div", { class: `aisle ${sorting ? "sorting" : ""}` },
      sorting ? h("span", { class: "handle", title: t.aisle_drag, "aria-label": t.aisle_drag, onpointerdown: (e) => startDrag(e, i) }, "⠿") : null,
      h("span", { class: "n" }, String(i + 1)), h("span", { class: "grow" }, label(id)),
      iconBtn(ICON.chevron, t.pack_up, () => move(i, -1), "up"), iconBtn(ICON.chevron, t.aisle_down, () => move(i, 1)))));
    const save = async (o) => {
      try {
        const r = await this._call("store_order", { store: st.key, zone: zone || null, order: o }, false);
        this._cfg = { ...this._cfg, store_order: r.store_order };
        status.textContent = "✓ " + t.saved;
      } catch (err) { status.textContent = (err && err.message) || t.error; }
    };
    fill(body,
      h("div", { class: "srow2", style: "border-top:none" }, iconBtn(ICON.back, t.p_back, () => { fill(body, ...saved); onClose && onClose(); }),
        h("div", { class: "sl" }, h("b", {}, `${st.label} – ${t.aisle}`), h("small", {}, t.aisle_help)),
        zones.length ? h("select", { "aria-label": t.zone, onchange: (e) => { zone = e.target.value; load(); draw(); } },
          h("option", { value: "" }, t.aisle_all_branches),
          zones.map((z) => h("option", { value: z }, (this._hass.states[z] && this._hass.states[z].attributes.friendly_name) || z))) : null),
      listEl,
      h("div", { class: "acts" }, status,
        h("button", { class: "btn2", type: "button", onclick: () => { save(null); order = cats.map(([id]) => id); draw(); } }, t.aisle_reset),
        h("button", { class: "btn2 primary", type: "button", onclick: () => save(order) }, t.save)));
    draw();
  }

  // Für mich → Benachrichtigungen (jeder für sich)
  _notifySection() {
    const t = this._t;
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    const status = h("span", { class: "ok2" });
    let cur = null, services = [], entities = [], customAllowed = false, users = [];
    const save = async (patch) => {
      cur = { ...cur, ...patch };
      try { cur = (await this._call("set_notify", { settings: cur }, false)).settings; status.textContent = "✓ " + t.saved; draw(); }
      catch (err) { status.textContent = (err && err.message) || t.error; }
    };
    const lists = () => Object.keys(this._hass.states).filter((e) => e.startsWith("todo.") && !isNotesEntity(e, this._hass.states[e].attributes.friendly_name))
      .map((e) => [e, this._hass.states[e].attributes.friendly_name || e]);
    const chipOf = (on, label, fn) => h("button", { type: "button", class: `chip2 ${on ? "on" : ""}`, "aria-pressed": String(on), onclick: fn }, label);
    const pretty = (name) => name.replace(/_/g, " ");
    const targetLabel = (x) => {
      if (x.label) return x.label;
      const name = x.id.split(".")[1] || x.id;
      if (x.kind === "entity") { const e = entities.find((y) => y.id === x.id); return "🔔 " + (e ? e.name : x.id); }
      if (x.kind === "custom") return "⚙️ " + x.id;
      return name.startsWith("mobile_app_") ? "📱 " + pretty(name.slice(11)) : /telegram/.test(name) ? "✈️ " + pretty(name) : "✉️ " + pretty(name);
    };
    // Ziel hinzufügen: Dienst | Entität | eigener Dienst (Admins, z. B. telegram_bot.send_message mit {"target": 123})
    const addTarget = () => {
      let kind = services.length ? "service" : entities.length ? "entity" : "custom";
      const box = h("div", {});
      const err = h("div", { class: "shelp" });
      const fields = {};
      const drawBox = () => {
        const tabs = [["service", t.nt_service], ["entity", t.nt_entity], ...(customAllowed ? [["custom", t.nt_custom]] : [])];
        fields.select = null; fields.id = null; fields.data = null;
        fill(box,
          h("div", { class: "chips", style: "margin-bottom:10px" }, tabs.map(([k, l]) => h("button", { type: "button", class: `chip2 ${kind === k ? "on" : ""}`, onclick: () => { kind = k; drawBox(); } }, l))),
          kind === "service" ? (services.length ? (fields.select = h("select", { "aria-label": t.nt_service, style: "width:100%" },
            services.map((sv) => h("option", { value: "notify." + sv }, targetLabel({ kind: "service", id: "notify." + sv }))))) : h("p", { class: "shelp" }, t.nt_no_services)) : null,
          kind === "entity" ? (entities.length ? (fields.select = h("select", { "aria-label": t.nt_entity, style: "width:100%" },
            entities.map((e) => h("option", { value: e.id }, `${e.name} (${e.id})`)))) : h("p", { class: "shelp" }, t.nt_no_entities)) : null,
          kind === "custom" ? [
            (fields.id = h("input", { placeholder: "telegram_bot.send_message", "aria-label": t.nt_custom, style: "width:100%;box-sizing:border-box" })),
            (fields.data = h("textarea", { rows: "4", placeholder: '{"target": 123456789}', "aria-label": "JSON", style: "width:100%;box-sizing:border-box;margin-top:8px;font-family:monospace" })),
            h("p", { class: "shelp" }, t.nt_custom_help)] : null,
          h("p", { class: "shelp" }, t.nt_help), err);
      };
      drawBox();
      const dlg = this._dialog(t.nt_add, box, [
        h("button", { type: "button", onclick: () => dlg.remove() }, t.cancel),
        h("button", { type: "button", class: "ok", onclick: async () => {
          let target;
          if (kind === "custom") {
            let data = {};
            try { data = fields.data.value.trim() ? JSON.parse(fields.data.value) : {}; } catch (e) { err.textContent = t.pack_bad_json; return; }
            if (!/^[a-z0-9_]+\.[a-z0-9_]+$/.test(fields.id.value.trim())) { err.textContent = t.nt_bad_service; return; }
            target = { kind, id: fields.id.value.trim(), data };
          } else if (fields.select) target = { kind, id: fields.select.value };
          else return;
          dlg.remove();
          await save({ targets: [...cur.targets, target] });
        } }, t.nt_add)]);
    };
    const draw = () => {
      const q = cur.quiet;
      fill(body,
        // Ziele: beliebig viele – Companion-App, andere notify-Dienste (Telegram, E-Mail …), notify-Entitäten, eigene Dienste
        h("div", { class: "grp" }, t.notify_to),
        h("div", { class: "chips" }, cur.targets.map((x, i) => h("span", { class: "chip2 on" }, targetLabel(x),
          h("button", { type: "button", class: "xdel", "aria-label": t.delete, title: t.delete, onclick: () => save({ targets: cur.targets.filter((_, j) => j !== i) }) }, "×"))),
          h("button", { type: "button", class: "chip2", onclick: () => addTarget() }, "＋ " + t.nt_add)),
        cur.targets.length ? null : h("div", { class: "shelp" }, t.nt_none),
        this._setRow(t.notify_added, this._switch(cur.added, (v) => save({ added: v }), t.notify_added)),
        this._setRow(t.notify_checked, this._switch(cur.checked, (v) => save({ checked: v }), t.notify_checked)),
        this._setRow(t.notify_own, this._switch(!!cur.own, (v) => save({ own: v }), t.notify_own), t.notify_own_sub),
        h("div", { class: "grp" }, t.notify_lists),
        h("div", { class: "chips" }, chipOf(!cur.lists.length, t.notify_all_lists, () => save({ lists: [] })),
          lists().map(([e, n]) => chipOf(cur.lists.includes(e), n, () => save({ lists: cur.lists.includes(e) ? cur.lists.filter((x) => x !== e) : [...cur.lists, e] })))),
        users.length ? h("div", { class: "grp" }, t.notify_from) : null,
        users.length ? h("div", { class: "chips" }, users.filter((u) => u.id !== (this._hass.user && this._hass.user.id)).map((u) =>
          chipOf(!cur.muted.includes(u.id), u.name, () => save({ muted: cur.muted.includes(u.id) ? cur.muted.filter((x) => x !== u.id) : [...cur.muted, u.id] })))) : null,
        this._setRow(t.notify_quiet, h("select", { "aria-label": t.notify_quiet, onchange: (e) => save({ quiet: e.target.value ? e.target.value.split("-").map(Number) : null }) },
          [["", t.notify_quiet_none], ["22-7", "22–7"], ["21-7", "21–7"], ["23-8", "23–8"]].map(([v, l]) =>
            h("option", { value: v, selected: (q ? q.join("-") : "") === v }, l)))),
        h("div", { class: "acts" }, status, cur.targets.length ? h("button", { class: "btn2", type: "button", onclick: async () => {
          status.textContent = t.loading;
          try {
            const r = await this._call("notify_test", {}, false);
            status.textContent = "✓ " + t.notify_test_sent + (r.errors && r.errors.length ? ` – ${t.error}: ${r.errors.join("; ")}` : "");
          }
          catch (err) { status.textContent = `${t.error}: ${(err && err.message) || ""}`; }
        } }, "🔔 " + t.notify_test) : null));
    };
    Promise.all([this._call("notify", {}, false), this._call("users", {}, false).catch(() => ({ users: [] }))])
      .then(([r, u]) => { cur = r.settings; services = r.services || []; entities = r.entities || []; customAllowed = !!r.custom_allowed; users = u.users || []; draw(); }).catch(() => fill(body, t.error));
    return this._sec("🔔", t.notify, t.notify_help, [body]);
  }

  // Statistik + Ausgaben (Reiter „Statistik“ der allgemeinen Einstellungen bzw. 📊 auf der Seite)
  _paneStats() { return [this._statsSection(), this._expensesSection()]; }
  _statsSection() {
    const t = this._t;
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    let days = 90;
    const load = () => this._call("stats", { days }, false).then(draw).catch(() => fill(body, t.error));
    const chipOf = (on, label, fn) => h("button", { type: "button", class: `chip2 ${on ? "on" : ""}`, onclick: fn }, label);
    const draw = (r) => {
      const max = Math.max(1, ...r.top.map((x) => x.count));
      fill(body,
        h("div", { class: "chips" }, [[90, t.stats_90], [365, t.stats_year], [0, t.stats_all]].map(([d, l]) => chipOf(days === d, l, () => { days = d; load(); }))),
        h("div", { class: "grp" }, t.stats_top),
        r.top.length ? r.top.slice(0, 10).map((x) => h("div", { class: "statrow" }, h("span", {}, x.name,
            this._isAdmin ? h("button", { class: "xdel", type: "button", title: t.stats_forget, "aria-label": `${t.stats_forget}: ${x.name}`,
              onclick: async () => { if (await slDialog(this.shadowRoot, { title: t.stats_forget, text: `${x.name}: ${t.stats_forget_help}`, ok: t.delete, cancel: t.cancel, danger: true })) { await this._call("forget_history", { name: x.name }, false); load(); } } }, "×") : null),
          h("span", { class: "shelp", style: "padding:0" }, `${x.count}×${x.every_days ? ` · ${t.stats_every} ${x.every_days} ${t.days}` : ""}`),
          h("div", { class: "bar2" }, h("i", { style: `width:${Math.round(100 * x.count / max)}%` }))))
          : h("div", { class: "shelp" }, t.stats_none),
        r.overdue.length ? h("div", { class: "grp" }, t.stats_overdue) : null,
        r.overdue.map((x) => this._setRow(x.name, this._data && this._data.permissions.add
          ? h("button", { class: "btn2", type: "button", onclick: async (e) => { e.target.disabled = true; await this._call("add_item", { text: x.name }); this._load(); } }, "＋ " + t.stats_add)
          : null, `${t.stats_usually} ${x.every_days} ${t.days} · ${t.stats_since} ${x.since_days} ${t.days}`)),
        r.categories.length ? h("div", { class: "grp" }, t.stats_shares) : null,
        h("div", { class: "chips" }, r.categories.slice(0, 6).map((c) => h("span", { class: "chip2" }, `${c.label} ${c.share} %`)),
          r.stores.map((x) => h("span", { class: "chip2" }, `${x.label} ${x.share} %`))));
    };
    load();
    return this._sec("📊", t.stats, t.stats_help, [body]);
  }
  _expensesSection() {
    const t = this._t;
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    let period = "month";
    const lang = this._hass.language;
    const colorOf = (store) => {
      if (!store) return "#9e9e9e";
      const known = ((this._cfg && this._cfg.known_stores) || []).find((k) => String(k.value).toLowerCase() === store);
      return (known && known.color) || hashColor(store);
    };
    const chipOf = (on, label, fn) => h("button", { type: "button", class: `chip2 ${on ? "on" : ""}`, onclick: fn }, label);
    const load = () => this._call("expenses", { period, count: 6 }, false).then(draw).catch(() => fill(body, t.error));
    const draw = (r) => {
      const max = Math.max(1, ...r.rows.map((x) => x.total));
      const totals = {};
      r.rows.forEach((row) => Object.entries(row.stores).forEach(([k, v]) => { totals[k] = (totals[k] || 0) + v; }));
      const last = r.rows[r.rows.length - 1];
      fill(body,
        h("div", { class: "chips" }, [["week", t.exp_week], ["month", t.exp_month], ["year", t.exp_year]].map(([p, l]) => chipOf(period === p, l, () => { period = p; load(); }))),
        r.rows.length ? h("div", { class: "bars" }, r.rows.map((row) => h("div", { class: "b", title: `${row.period}: ${fmtMoney(row.total, lang)}`, style: `height:${Math.max(3, Math.round(100 * row.total / max))}%` },
          Object.entries(row.stores).map(([k, v]) => h("div", { style: `flex:${v};background:${colorOf(k)}` })),
          h("span", {}, row.period.slice(period === "year" ? 0 : 5))))) : h("div", { class: "shelp" }, t.exp_none),
        r.rows.length ? h("div", { class: "legend" }, Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
          h("span", {}, h("i", { style: `background:${colorOf(k)}` }), `${k ? itemStoreLabel(k, this._cfg) : t.exp_no_store} ${fmtMoney(v, lang)}`))) : null,
        last ? h("p", { class: "shelp", style: "padding:6px 0 0" }, `${last.period}: ${fmtMoney(last.total, lang)} (Ø ${fmtMoney(r.average, lang)})`) : null,
        h("div", { class: "acts", style: "justify-content:flex-start" }, h("button", { class: "btn2", type: "button", onclick: () => { showEntries = !showEntries; drawEntries(); } }, `🧾 ${t.exp_entries}`)),
        entriesEl);
      drawEntries();
    };
    // einzelne Buchungen prüfen und falsche löschen (Admins: alle, sonst eigene)
    let showEntries = false;
    const entriesEl = h("div");
    const drawEntries = async () => {
      if (!showEntries) return fill(entriesEl);
      fill(entriesEl, h("div", { class: "shelp" }, t.loading));
      let entries = [];
      try { entries = (await this._call("expense_entries", { limit: 100 }, false)).entries; } catch (e) { /* */ }
      if (!entries.length) return fill(entriesEl, h("div", { class: "shelp" }, t.exp_none));
      fill(entriesEl, h("div", { class: "learned2" }, entries.map((e) => h("div", { class: "lrow2" },
        h("span", { class: "w" }, e.name, h("span", { class: "manual" }, `${new Date(e.t * 1000).toLocaleDateString(lang || "de")}${e.store ? " · " + itemStoreLabel(e.store, this._cfg) : ""}`)),
        h("span", { class: "cat" }, fmtMoney(e.amount, lang)),
        iconBtn(ICON.close, t.delete, async () => { await this._call("delete_expense", { expense_id: e.id }, false); load(); }, "danger")))));
    };
    load();
    return this._sec("💶", t.exp, t.exp_help, [body]);
  }

  // Diese Liste → Teilen per Link (Standard: nur ansehen; Optionen beim Erstellen)
  _shareLinkSection() {
    const t = this._t;
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    const status = h("span", { class: "ok2" });
    let check = "off", add = false, hours = 168, links = [], pub = { public_mode: "ha", public_base: null };
    // Stufen wie unter Teilen und Rechte: nur ansehen · „soft“ abhaken · „soft“ abhaken + hinzufügen · abhaken + hinzufügen
    const LEVELS = [["off", "off", false, t.share_view], ["soft", "soft", false, t.share_soft], ["soft_add", "soft", true, t.share_soft_add], ["on", "on", true, t.rights_max_on]];
    const levelOf = (c, a) => (c === "on" ? "on" : c === "soft" ? (a ? "soft_add" : "soft") : "off");
    const lang = this._hass.language;
    // Nicht-Admins: nur anbieten, was der Admin erlaubt (Global → Teilen und Rechte)
    const rights = this._isAdmin ? {} : (this._cfg && this._cfg.rights) || {};
    const lvl = LEVELS.map((l) => l[0]);
    const maxLvl = lvl.indexOf(rights.share_max || "on");
    const maxHours = rights.share_max_hours || null;
    if (maxHours && hours > maxHours) hours = maxHours;
    const base = () => {
      const c = this._hass.config || {};
      return String(c.external_url || (this._hass.auth && this._hass.auth.data && this._hass.auth.data.hassUrl) || location.origin).replace(/\/$/, "");
    };
    const fmtDate = (ts) => new Date(ts * 1000).toLocaleString(lang || "de", { dateStyle: "short", timeStyle: "short" });
    const modeLabel = (c, a) => (c === "on" && !a ? t.share_check : (LEVELS.find((l) => l[0] === levelOf(c, a)) || LEVELS[0])[3]);
    const created = h("div");
    const draw = () => fill(body,
      this._setRow(t.share_mode, h("select", { "aria-label": t.share_mode, onchange: (e) => {
        const l = LEVELS.find((x) => x[0] === e.target.value) || LEVELS[0]; check = l[1]; add = l[2]; } },
        LEVELS.filter((l, i) => i <= (maxLvl < 0 ? 3 : maxLvl))
          .map(([v, , , l]) => h("option", { value: v, selected: levelOf(check, add) === v }, l))), t.share_mode_help),
      this._setRow(t.share_valid, h("select", { "aria-label": t.share_valid, onchange: (e) => { hours = e.target.value ? Number(e.target.value) : null; } },
        [[2, t.share_2h], [24, t.share_1d], [168, t.share_7d], [720, t.share_30d], ["", t.share_forever]]
          .filter(([v]) => !maxHours || (v !== "" && v <= maxHours)).map(([v, l]) =>
          h("option", { value: String(v), selected: String(hours ?? "") === String(v) }, l)))),
      this._data && this._data.type === "combined" ? h("div", { class: "shelp", style: "padding:6px 0" }, "⚠️ " + t.share_combined) : null,
      // Wohin zeigt der Link? Tunnel/Proxy verraten die HA-Adresse nicht (Global → Teilen und Rechte → Öffentliche Adresse)
      h("div", { class: "shelp", style: "padding:6px 0" }, pub.public_mode === "ha" ? "ℹ️ " + t.share_leak
        : `🛡️ ${pub.public_mode === "tunnel" ? t.pub_tunnel : t.pub_proxy}${pub.public_base ? ": " + pub.public_base : " – " + t.pub_not_ready}`),
      h("div", { class: "acts" }, status, h("button", { class: "btn2 primary", type: "button", onclick: create }, "🔗 " + t.share_create)),
      created,
      links.length ? h("div", { class: "grp" }, t.share_active) : null,
      ...links.map((l) => this._setRow(modeLabel(l.check, l.add),
        iconBtn(ICON.close, t.share_revoke, async () => { links = (await this._call("share_revoke", { link_id: l.id })).links; draw(); }, "danger"),
        `${l.expired ? "⚠️ " + t.share_expired : l.expires ? `${t.share_until} ${fmtDate(l.expires)}` : t.share_forever} · ${l.opens}× ${t.share_opened}`
        // Tunnel-Adresse inzwischen neu (Neustart) → dieser Link führt ins Leere
        + (l.base && l.base !== pub.public_base ? ` · ⚠️ ${t.share_old_address}` : ""))));
    const create = async () => {
      try {
        const r = await this._call("share_create", { check, add, hours });
        const url = (r.base || base()) + r.path;
        ({ links, ...pub } = { ...pub, ...(await this._call("share_links", {})) });
        draw();
        const isLocal = !r.base && /\/\/(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|[^/]*\.local)/i.test(url);
        let svgText = "";
        try { svgText = qrSvg(url, 4); } catch (e) { svgText = ""; }
        const qrBox = h("div", { class: "qr" });
        qrBox.innerHTML = svgText;
        fill(created, h("div", { class: "sec", style: "margin:8px 0" }, h("div", { class: "sbody", style: "padding-top:10px" },
          h("div", { class: "shelp" }, t.share_once),
          isLocal ? h("div", { class: "shelp", style: "color:var(--warning-color,#ff9800)" }, "⚠️ " + t.share_local) : null,
          qrBox, h("div", { class: "sharelink" }, url),
          h("div", { class: "acts" },
            h("button", { class: "btn2", type: "button", onclick: async () => { try { await navigator.clipboard.writeText(url); status.textContent = "✓ " + t.share_copied; } catch (e) { status.textContent = url; } } }, t.share_copy),
            navigator.share ? h("button", { class: "btn2 primary", type: "button", onclick: () => navigator.share({ title: this._data ? this._data.name : "SmartLists", url }).catch(() => {}) }, t.share_send) : null))));
      } catch (err) { status.textContent = err && err.code === "public_unavailable" ? `⚠️ ${t.pub_not_ready} (${err.message})` : (err && err.message) || t.error; }
    };
    this._call("share_links", {}).then((r) => { ({ links, ...pub } = { ...pub, ...r }); draw(); }).catch((err) => fill(body, h("div", { class: "shelp" }, (err && err.message) || t.error)));
    return this._sec("🔗", t.share, t.share_help, [body]);
  }

  _learnedSection() {
    const t = this._t;
    const listEl = h("div", { class: "learned2" }, h("div", { class: "shelp", style: "padding:10px" }, t.loading));
    const count = h("span", { class: "cnt" });
    let all = [];
    let query = "";
    const draw = () => {
      const q = searchKey(query);
      const rows = all.filter((l) => !q || searchKey(l.word + " " + l.label).includes(q));
      count.textContent = String(all.length);
      if (!rows.length) return fill(listEl, h("div", { class: "shelp", style: "padding:10px" }, all.length ? t.no_hits_short : t.none_learned));
      fill(listEl, ...rows.map((l) => h("div", { class: "lrow2" },
        h("span", { class: "w" }, l.word, l.manual ? h("span", { class: "manual" }, t.by_hand) : null),
        // Kategorie nachträglich ändern: Auswahl statt nur Anzeige (gilt dann als „von Hand“)
        h("select", { class: "cat", "aria-label": `${l.word}: ${t.category}`, onchange: async (e) => {
          try { await this._call("set_category", { name: l.word, category: e.target.value }, false); l.category = e.target.value; l.manual = true;
            l.label = ((this._cfg && this._cfg.categories) || []).find((c) => c.id === e.target.value)?.label || l.label; draw(); this._load(); }
          catch (err) { /* */ }
        } }, ((this._cfg && this._cfg.categories) || []).map((c) => h("option", { value: c.id, selected: c.id === l.category }, c.label))),
        iconBtn(ICON.close, t.forget, async () => { all = (await this._call("forget", { word: l.word }, false)).learned; draw(); }, "danger"))));
    };
    this._call("learned", {}, false).then((r) => { all = r.learned; draw(); }).catch(() => fill(listEl, t.error));
    const sec = this._sec("🏷️", t.learned, t.learned_help, [
      h("input", { type: "search", class: "search2", placeholder: t.search_learned, "aria-label": t.search_learned, oninput: (e) => { query = e.target.value; draw(); } }),
      listEl]);
    sec.querySelector && sec.querySelector(".sh") ? sec.querySelector(".sh").append(count) : sec.firstChild.append(count);
    return sec;
  }

  _automationSection() {
    const t = this._t;
    const status = h("span", { class: "ok2" });
    const lists = Object.keys(this._hass.states).filter((e) => e.startsWith("todo.")).sort()
      .map((e) => [e, (this._hass.states[e].attributes || {}).friendly_name || e]);
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    this._call("automation", {}, false).then((r) => {
      const cur = r.settings || {};
      const pick = (key) => h("select", { "aria-label": t["auto_" + key], onchange: async (e) => {
        try { await this._call("set_automation", { settings: { ...cur, [key]: e.target.value || null } }, false); cur[key] = e.target.value; status.textContent = "✓ " + t.saved; }
        catch (err) { status.textContent = (err && err.message) || t.error; }
      } }, h("option", { value: "" }, "—"), lists.map(([e, n]) => h("option", { value: e, selected: cur[key] === e }, n)));
      fill(body,
        this._setRow(t.auto_voice_default_list, pick("voice_default_list"), t.auto_voice_help),
        this._setRow(t.auto_auto_due_list, pick("auto_due_list"), t.auto_due_help),
        this._setRow(t.barcode_lookup, this._switch(cur.barcode_lookup !== false, async (on) => {
          try { await this._call("set_automation", { settings: { ...cur, barcode_lookup: on } }, false); cur.barcode_lookup = on; status.textContent = "✓ " + t.saved; }
          catch (err) { status.textContent = (err && err.message) || t.error; }
        }, t.barcode_lookup), t.barcode_lookup_help),
        this._barcodeProviders(cur, status),
        h("div", { class: "acts" }, status, h("button", { class: "btn2", type: "button", onclick: async () => {
          try { const res = await this._call("install_sentences", {}, false); status.textContent = `✓ ${t.sentences_installed}: ${res.languages.join(", ")}`; }
          catch (err) { status.textContent = (err && err.message) || t.error; }
        } }, t.install_sentences)));
    }).catch(() => fill(body, t.error));
    return this._sec("🎙️", t.automation, t.automation_help, [body]);
  }

  // Dienste fürs Nachschlagen: antippen = an/aus, Zahl = Reihenfolge (der erste Treffer zählt); eigener Dienst per URL
  _barcodeProviders(cur, status) {
    const t = this._t;
    const box = h("div");
    const save = async (patch) => {
      Object.assign(cur, patch);
      try { await this._call("set_automation", { settings: { ...cur } }, false); status.textContent = "✓ " + t.saved; } catch (err) { status.textContent = (err && err.message) || t.error; }
      draw();
    };
    const draw = () => {
      const order = cur.barcode_providers && cur.barcode_providers.length ? cur.barcode_providers : ["off"];
      fill(box, h("div", { class: "grp" }, t.barcode_providers),
        h("div", { class: "chips" }, BARCODE_PROVIDERS.map(([id, name]) => {
          const pos = order.indexOf(id);
          return h("button", { type: "button", class: `chip2 ${pos >= 0 ? "on" : ""}`, "aria-pressed": String(pos >= 0),
            onclick: () => save({ barcode_providers: pos >= 0 ? order.filter((x) => x !== id) : [...order, id] }) },
            pos >= 0 ? `${pos + 1}. ` : "", name || t.barcode_custom);
        })),
        h("div", { class: "shelp", style: "padding:2px 0 6px" }, t.barcode_providers_help),
        order.includes("custom") ? h("div", { class: "rule2", style: "grid-template-columns:minmax(0,1fr) 140px;margin-top:4px" },
          h("input", { value: cur.barcode_custom_url || "", placeholder: "https://example.org/api/{code}", "aria-label": t.barcode_custom_url,
            onchange: (e) => save({ barcode_custom_url: e.target.value.trim() }) }),
          h("input", { value: cur.barcode_custom_field || "", placeholder: "product.name", "aria-label": t.barcode_custom_field,
            onchange: (e) => save({ barcode_custom_field: e.target.value.trim() }) })) : null);
    };
    draw();
    return box;
  }

  _devicesSection() {
    const t = this._t;
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    const count = h("span", { class: "cnt" });
    const fmt = (ts) => (ts ? new Date(ts * 1000).toLocaleString(this._hass.language || "de", { dateStyle: "short", timeStyle: "short" }) : "?");
    let appLists = [];
    const status = h("span", { class: "ok2" });
    const draw = (devices) => {
      count.textContent = String(devices.length);
      if (!devices.length) return fill(body, h("div", { class: "shelp", style: "padding:6px 0" }, t.no_devices));
      fill(body, ...devices.flatMap((dv) => [this._setRow(`${dv.stale ? "⚠️ " : ""}${dv.name}`,
        iconBtn(ICON.close, t.remove_device, async () => draw((await this._call("remove_device", { device_id: dv.device_id }, false)).devices), "danger"),
        `${dv.user_name || "?"} · ${dv.model || ""} · App ${dv.app_version || "?"} · Android ${dv.os_version || "?"} · ${t.last_seen} ${fmt(dv.last_seen)}`),
        // kombinierte Listen dieser App: verbinden = in HA als kombinierte Liste anlegen (gehört zum Handy)
        ...appLists.filter((l) => l.device_id === dv.device_id).map((l) => h("div", { class: "srow2", style: "padding-left:16px" },
          h("div", { class: "sl" }, "↳ ", l.name, h("small", {}, `${t.app_list} · ${l.sources.join(", ")}${l.missing.length ? ` · ⚠️ ${l.missing.join(", ")}` : ""}`)),
          l.connected ? h("span", { class: "val" }, "✓ " + t.app_list_connected)
            : this._isAdmin ? h("button", { class: "btn2", type: "button", onclick: async () => {
              try { appLists = (await this._call("connect_app_list", { device_id: l.device_id, list_id: l.id }, false)).lists; status.textContent = "✓ " + t.app_list_connected; draw(devices); }
              catch (err) { status.textContent = (err && err.message) || t.error; }
            } }, t.app_list_connect) : null))]),
        h("div", { class: "acts" }, status));
    };
    Promise.all([this._call("devices", {}, false), this._call("app_lists", {}, false).catch(() => ({ lists: [] }))])
      .then(([r, a]) => { appLists = a.lists || []; draw(r.devices); }).catch(() => fill(body, t.error));
    const sec = this._sec("📱", t.devices, t.devices_help, [body]);
    sec.firstChild.append(count);
    return sec;
  }

  // Freigaben einer eigenen Liste (nur Besitzer/Admins): pro Person keine / sehen / abhaken / bearbeiten
  // Herkunfts-Badge einer kombinierten Liste: „Liste“, „Besitzer“ oder „Besitzer Liste“; nur bestimmte Quell-Listen
  _labelSection(d) {
    const t = this._t;
    const status = h("span", { class: "ok2" });
    let show = (d.label && d.label.show) || "list";
    let only = new Set((d.label && d.label.sources) || []);
    let colors = { ...((d.label && d.label.colors) || {}) };
    const auto = (d.label && d.label.auto_colors) || {};
    let dirty = false;
    const saveBtn = h("button", { class: "btn2 primary", type: "button", disabled: true, onclick: async () => {
      status.textContent = t.loading; saveBtn.disabled = true;
      try {
        await this._call("set_labels", { show, sources: [...only], colors });
        dirty = false; status.textContent = "✓ " + t.saved;
        this._listSettingsApplied = null;
        await this._load();
      } catch (err) { status.textContent = (err && err.message) || t.error; saveBtn.disabled = false; }
    } }, t.save);
    const touch = () => { dirty = true; saveBtn.disabled = false; status.textContent = ""; };
    const box = h("div", {});
    const draw = () => fill(box,
      this._setRow(t.lb_show, h("select", { "aria-label": t.lb_show, onchange: (e) => { show = e.target.value; touch(); } },
        [["list", t.lb_list], ["owner", t.lb_owner], ["owner_list", t.lb_both]].map(([v, l]) => h("option", { value: v, selected: show === v }, l))), t.lb_show_help),
      h("div", { class: "grp" }, t.lb_only),
      h("div", { class: "chips" }, h("button", { type: "button", class: `chip2 ${only.size ? "" : "on"}`, "aria-pressed": String(!only.size),
        onclick: () => { only = new Set(); touch(); draw(); } }, t.lb_all),
        d.sources.map((src) => h("button", { type: "button", class: `chip2 ${only.has(src.entity_id) ? "on" : ""}`, "aria-pressed": String(only.has(src.entity_id)),
          onclick: () => { if (only.has(src.entity_id)) only.delete(src.entity_id); else only.add(src.entity_id); touch(); draw(); } }, src.name))),
      h("div", { class: "grp" }, t.lb_colors),
      d.sources.map((src) => this._setRow(src.name, h("span", { class: "look-row" },
        h("input", { type: "color", value: colors[src.entity_id] || auto[src.entity_id] || "#888888", "aria-label": `${src.name}: ${t.look_color}`, title: t.look_color,
          onchange: (e) => { colors[src.entity_id] = e.target.value; touch(); draw(); } }),
        colors[src.entity_id] ? h("button", { class: "btn2", type: "button", style: "height:30px;padding:0 10px", title: t.reset_default, "aria-label": t.reset_default,
          onclick: () => { delete colors[src.entity_id]; touch(); draw(); } }, "↺") : null))),
      h("div", { class: "acts" }, status, saveBtn));
    draw();
    return this._sec("🏷️", t.lb_title, t.lb_help, [box]);
  }

  // Besitzer wählen: eigene Listen (Pflicht) und kombinierte Listen („— alle“ = keine Einschränkung)
  _ownerSelect(d, status) {
    const t = this._t;
    const sel = h("select", { "aria-label": t.owner, disabled: true }, h("option", {}, t.loading));
    this._call("users", {}, false).then((r) => {
      const current = (d.own && d.own.owner_id) || "";
      fill(sel, d.type === "combined" ? h("option", { value: "", selected: !current }, t.owner_everyone) : null,
        r.users.map((u) => h("option", { value: u.id, selected: u.id === current }, u.name)));
      sel.disabled = false;
    }).catch(() => fill(sel, h("option", {}, t.error)));
    sel.addEventListener("change", async () => {
      try {
        await this._call("set_owner", { owner: sel.value || null });
        status.textContent = "✓ " + t.saved;
        await this._load();
        // Fenster neu aufbauen (Freigaben erscheinen bzw. verschwinden je nach Besitzer)
        const open = this.shadowRoot.querySelector(".dlg-back.lsd");
        if (open) { open.remove(); this._listDialog(); }
      } catch (err) { status.textContent = (err && err.message) || t.error; }
    });
    return sel;
  }

  _sharing() {
    const t = this._t;
    const own = this._data.own;
    const box = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    const status = h("span", { class: "ok2" });
    (async () => {
      let users = [];
      try { users = (await this._call("users", {}, false)).users; } catch (e) { fill(box, t.error); return; }
      const others = users.filter((u) => u.id !== own.owner_id);
      if (!others.length) { fill(box, h("div", { class: "shelp" }, t.no_users)); return; }
      fill(box, ...others.map((u) => this._setRow(u.name, u.is_admin
        ? h("span", { class: "val" }, t.role_all)
        : h("select", { "aria-label": u.name, onchange: async (e) => {
          try { await this._call("share", { user_id: u.id, role: e.target.value || null }); status.textContent = "✓ " + t.saved; await this._load(); }
          catch (err) { status.textContent = (err && err.message) || t.error; }
        } }, [["", t.role_none], ["viewer", t.role_viewer], ["checker", t.role_checker], ["editor", t.role_editor]].map(([v, l]) =>
          h("option", { value: v, selected: (own.shares[u.id] || "") === v }, l))), u.is_admin ? t.admin_always : null)));
    })();
    const del = h("button", { class: "btn2 danger", type: "button", onclick: async () => {
      if (!(await slDialog(this.shadowRoot, { title: t.delete_list, text: t.confirm_delete_list, ok: t.delete, cancel: t.cancel, danger: true }))) return;
      try { await this._call("delete_list", {}); status.textContent = "✓"; } catch (err) { status.textContent = (err && err.message) || t.error; }
    } }, t.delete_list);
    const sec = this._sec("👥", t.sharing, t.sharing_help, [box, h("div", { class: "acts" }, status, del)]);
    sec.firstChild.append(h("span", { class: "cnt" }, `${t.owner}: ${own.owner || "?"}`));
    return sec;
  }

  // Haushalts-Einstellungen sichern/übertragen: gemerkte Kategorien, Verlauf, Namenskonvention, Bedienung
  _exportImport() {
    const t = this._t;
    const status = h("span", { class: "ok2" });
    const file = h("input", { type: "file", accept: "application/json,.json", hidden: true, onchange: async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        const r = await this._call("import", { data, replace: false }, false);
        status.textContent = `✓ ${t.imported}: ${Object.entries(r.imported).map(([k, v]) => `${v} ${k}`).join(", ")}`;
        await this._load();
      } catch (err) { status.textContent = (err && err.message) || t.error; }
      e.target.value = "";
    } });
    const exp = async () => {
      try {
        const data = await this._call("export", { include_history: true }, false);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
        a.download = `smartlists-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        status.textContent = "✓";
      } catch (err) { status.textContent = (err && err.message) || t.error; }
    };
    return this._sec("💾", t.backup, t.backup_help, [h("div", { class: "acts", style: "margin-top:0" }, status,
      h("button", { class: "btn2", type: "button", onclick: exp }, "⬇ " + t.export),
      h("button", { class: "btn2", type: "button", onclick: () => file.click() }, "⬆ " + t.import), file)]);
  }

  // Einträge des ⋯-Menüs (abhängig von Karte, Liste und Rechten)
  _moreItems(d) {
    const t = this._t;
    const c = this._config;
    const out = [];
    const closeAll = () => { this._moreOpen = false; this._showSettings = false; this._showImport = false; this._showTpl = false; };
    if (d.type !== "notes" && d.items.length) out.push([ICON.check, t.sel_mode, () => this._startSelect(null)]);
    if (d.permissions.add && c.show_import !== false && d.type !== "notes")
      out.push([ICON.importIcon, t.imp, () => { closeAll(); this._showImport = true; this._renderSettings(); this._renderImport(); this._render(); }]);
    if (d.type !== "notes" && d.permissions.add && c.show_templates !== false) {
      out.push([ICON.template, t.tpl, () => { closeAll(); this._showTpl = true; this._renderTemplates(); this._render(); }]);
      if (this._feat("mealplan")) out.push([ICON.calendar, t.mp_title, () => { this._moreOpen = false; this._renderMore(); this._mealPlanDialog(); }]);
    }
    if (c.show_settings !== false) {
      if (c.settings_scope !== "list") out.push([ICON.tune, t.settings_global, () => { closeAll(); this._showSettings = true; this._setChosen = false; this._renderImport(); this._renderSettings(); this._render(); }]);
      out.push([ICON.gear, t.settings_list, () => { this._moreOpen = false; this._renderMore(); this._listDialog(); }]);
    }
    return out;
  }
  _renderMore() {
    if (!this._moreEl) return;
    const d = this._data;
    if (!this._moreOpen || !d) return fill(this._moreEl);
    const t = this._t;
    const items = this._moreItems(d);
    // Sortierung: nur das Auswahlfeld (ohne zweites Symbol), das Menü direkt unter dem ⋯-Knopf
    const sortRow = this._config.show_sort && d.type !== "notes" ? h("div", { class: "mi sortrow" }, svg(ICON.sort, 20), this._sortSelect(d).querySelector("select")) : null;
    const btn = this.shadowRoot && this.shadowRoot.querySelector(".morebtn");
    const card = this.shadowRoot && this.shadowRoot.querySelector("ha-card");
    let top = 52;
    if (btn && card && btn.getBoundingClientRect) {
      const b = btn.getBoundingClientRect(), c = card.getBoundingClientRect();
      if (b.height) top = Math.round(b.bottom - c.top + 4);
    }
    fill(this._moreEl, h("div", { class: "moreback", onclick: () => { this._moreOpen = false; this._renderMore(); } }),
      h("div", { class: "menu morepop", role: "menu", "aria-label": t.more, style: `top:${top}px` },
        sortRow,
        items.map(([icon, label, fn]) => h("button", { class: "mi", type: "button", role: "menuitem", onclick: fn }, svg(icon, 20), label))));
  }

  _settingsBtn(scope, icon, label) {
    if (scope === "list") return iconBtn(icon, label, () => this._listDialog());
    const open = this._showSettings;
    return iconBtn(open ? ICON.close : icon, label, () => {
      this._showSettings = !open;
      this._setChosen = false;
      this._showImport = false;
      this._renderImport(); this._renderSettings(); this._render();
    });
  }

  async _renderSettings() {
    const el = this._settingsEl;
    if (!this._showSettings || !this._cfg) return fill(el);
    const t = this._t;
    const areas = this._areas();
    // 📊 auf der Seite öffnet direkt die Auswertung
    if (this._config.settings_scope === "stats" && !this._setArea) { this._setArea = "stats"; this._setChosen = true; }
    const cur = areas.find((a) => a.id === this._setArea) || areas[0];
    const open = (id) => { this._setArea = id; this._setChosen = true; this._renderSettings(); };
    const btns = [];
    const group = (g, title, extra) => {
      const list = areas.filter((a) => a.g === g);
      if (!list.length) return null;
      return [h("h4", {}, title, extra ? h("span", {}, ` (${extra})`) : null), list.map((a) => {
        const b = h("button", { type: "button", class: a.id === cur.id ? "on" : "", "aria-current": a.id === cur.id ? "page" : "false", onclick: () => open(a.id) }, a.label);
        btns.push([b, searchKey([a.label, a.sub, ...(a.kw || [])].join(" "))]);
        return b;
      })];
    };
    const search = h("input", { type: "search", class: "search2", placeholder: t.a_search, "aria-label": t.a_search,
      oninput: (e) => { const q = searchKey(e.target.value); btns.forEach(([b, key]) => { b.hidden = !!q && !key.includes(q); }); } });
    const nav = h("nav", { class: "snav", "aria-label": t.settings }, search,
      group("me", t.tab_me), group("global", t.tab_house, t.admin_only_short), group("stats", t.g_stats),
      h("div", { class: "ver" }, h("span", {}, `SmartLists ${this._version || CARD_VERSION}`),
        h("a", { href: "https://github.com/m3m0rex/ha_smartlists/wiki", target: "_blank", rel: "noopener" }, "Wiki")));
    const main = h("div", { class: "smain" },
      h("button", { class: "sback", type: "button", onclick: () => { this._setChosen = false; this._renderSettings(); } }, "← " + t.settings),
      h("header", {}, h("h2", {}, cur.label), cur.sub ? h("p", {}, cur.sub) : null),
      h("div", { class: "acols" }, cur.build()));
    fill(el, h("div", { class: "sl-settings" }, h("div", { class: `sgrid ${this._setChosen ? "detail" : ""}` }, nav, main)));
  }
}

/* Visueller Editor für den Dashboard-Karten-Dialog */
class SmartListsCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; this._build(); }
  set hass(hass) {
    const relabel = this._form && this._hass && hass && this._hass.language !== hass.language;
    this._hass = hass;
    if (this._form) { this._form.hass = hass; if (relabel) this._form.schema = this._schema(); }
  }
  get _lang() { return ((this._hass && this._hass.language) || "de").slice(0, 2); }
  get _t() { return TEXTS[this._lang] || TEXTS.en; }

  // Einfach: nur das Wichtigste. Erweitert: alle Abschnitte. Merkt sich die Wahl im Browser.
  get _advanced() { try { return localStorage.getItem("smartlists-editor-advanced") === "1"; } catch (e) { return false; } }
  set _advanced(v) { try { localStorage.setItem("smartlists-editor-advanced", v ? "1" : "0"); } catch (e) { /* */ } }

  // Notizlisten der App sind keine Einkaufslisten – nur anbieten, wenn sie schon gewählt sind
  _noNotes() {
    const st = (this._hass && this._hass.states) || {};
    const cur = [this._config && this._config.entity, ...((this._config && this._config.entities) || [])].map((e) => (typeof e === "string" ? e : e && e.entity));
    const ex = Object.keys(st).filter((e) => e.startsWith("todo.") && isNotesEntity(e, st[e].attributes.friendly_name) && !cur.includes(e));
    return ex.length ? { exclude_entities: ex } : {};
  }
  _schema() {
    const t = this._t;
    const b = (name) => ({ name, selector: { boolean: {} } });
    const section = (key, icon, schema) => ({ type: "expandable", name: "", flatten: true, title: t["e_sec_" + key], icon, schema });
    const sel = (name, options) => ({ name, selector: { select: { mode: "dropdown", options: options.map(([value, label]) => ({ value, label })) } } });
    const basic = [
      sel("preset", [["", t.e_preset_pick], ...Object.keys(PRESETS).map((k) => [k, t["e_pre_" + k]])]),
      { name: "entity", selector: { entity: { domain: "todo", ...this._noNotes() } } },
      { name: "title", selector: { text: {} } },
      sel("view", [["list", t.e_view_list], ["tiles", t.e_view_tiles], ["mini", t.e_view_mini]]),
      sel("sort", [["category", t.e_sort_category], ["alpha", t.sort_alpha], ["added", t.e_sort_added], ["list", t.e_sort_list]]),
      b("advanced"),
    ];
    if (!this._advanced) return basic;
    return [
      ...basic,
      section("multi", "mdi:view-column-outline", [
        { name: "entities", selector: { entity: { domain: "todo", multiple: true, ...this._noNotes() } } },
        sel("layout", [["tabs", t.e_layout_tabs], ["columns", t.e_layout_columns], ["stack", t.e_layout_stack]]),
      ]),
      section("filter", "mdi:filter-outline", [
        { name: "filter_store", selector: { text: {} } },
        { name: "filter_person", selector: { text: {} } },
        { name: "filter_tag", selector: { text: {} } },
        { name: "filter_category", selector: { select: { multiple: true, mode: "dropdown", options: categoryOptions(this._lang).map(([value, label]) => ({ value, label })) } } },
        b("filter_offers"), b("filter_tags_new_items"), b("show_filter_chips"),
      ]),
      section("look", "mdi:palette-outline", [
        sel("density", [["compact", t.e_density_compact], ["normal", t.e_density_normal], ["comfortable", t.e_density_comfortable]]),
        { name: "font_scale", selector: { number: { min: 0.8, max: 1.6, step: 0.05, mode: "slider" } } },
        { name: "radius", selector: { number: { min: 0, max: 32, step: 1, mode: "box", unit_of_measurement: "px" } } },
        { name: "accent_color", selector: { color_rgb: {} } },
        { name: "max_height", selector: { number: { min: 150, max: 2000, step: 50, mode: "box", unit_of_measurement: "px" } } },
      ]),
      section("header", "mdi:page-layout-header",
        [b("show_header"), b("show_count"), b("show_search"), b("show_sort"), b("show_shopping"), b("show_undo"), b("show_import"), b("show_settings")]),
      section("input", "mdi:plus-box-outline", [b("show_add"), b("show_frequent"), b("show_templates"), b("show_scan")]),
      section("list", "mdi:format-list-bulleted",
        [b("drag_drop"), b("show_stepper"), b("show_offer"), b("show_prices"), b("show_tags"), b("show_source"), b("show_note"), b("show_category_titles")]),
      section("done", "mdi:check-all", [b("show_completed"), b("collapse_completed")]),
      section("shop", "mdi:cart-outline", [b("start_shopping")]),
    ];
  }

  _build() {
    if (!this._form) {
      this._form = document.createElement("ha-form");
      // Texte in TEXTS (l_… = Beschriftung, hh_… = Hilfe), Sprache von HA
      this._form.computeLabel = (sch) => this._t["l_" + sch.name] || sch.name;
      this._form.computeHelper = (sch) => this._t["hh_" + sch.name];
      this._form.addEventListener("value-changed", (e) => {
        const cfg = { ...e.detail.value };
        if ("advanced" in cfg) {
          const adv = !!cfg.advanced; delete cfg.advanced;
          if (adv !== this._advanced) { this._advanced = adv; this._form.schema = this._schema(); }
        }
        if (cfg.preset) { Object.assign(cfg, PRESETS[cfg.preset] ? PRESETS[cfg.preset].values : {}); }
        delete cfg.preset;
        // nur Abweichungen vom Standard speichern → schlankes YAML
        for (const [k, v] of Object.entries(CARD_DEFAULTS)) if (JSON.stringify(cfg[k]) === JSON.stringify(v)) delete cfg[k];
        for (const k of ["max_height", "radius", "title", "accent_color", "filter_store", "filter_person", "filter_tag"]) if (cfg[k] === "" || cfg[k] == null) delete cfg[k];
        if (Array.isArray(cfg.entities) && !cfg.entities.length) delete cfg.entities;
        if (Array.isArray(cfg.entities) && cfg.entities.length) delete cfg.entity;
        this._config = cfg;
        this._form.data = this._data();
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: cfg }, bubbles: true, composed: true }));
      });
      this.append(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = this._schema();
    this._form.data = this._data();
  }
  _data() { return { ...CARD_DEFAULTS, ...this._config, preset: "", advanced: this._advanced }; }
}

/* ------------------------------------------------------------------ */
/* Seitenleisten-Seite „SmartLists“ (von der Integration registriert)  */
/* ------------------------------------------------------------------ */
const PANEL_KEY = "smartlists-panel-list";
const PANEL_PREFS = "smartlists-panel-prefs";
const PANEL_STYLE = `
  :host { display:block; min-height:100vh; background:var(--primary-background-color,#fafafa); color:var(--primary-text-color); }
  .toolbar { display:flex; align-items:center; gap:4px; height:56px; padding:0 12px; box-sizing:border-box;
    background:var(--app-header-background-color, var(--primary-color)); color:var(--app-header-text-color, var(--text-primary-color,#fff));
    font-size:20px; position:sticky; top:0; z-index:3; }
  .toolbar .title { flex:1; margin-left:8px; }
  .toolbar button { background:none; border:none; color:inherit; width:40px; height:40px; border-radius:50%; cursor:pointer;
    display:flex; align-items:center; justify-content:center; }
  .toolbar button:hover, .toolbar button.on { background:rgba(255,255,255,.18); }
  .ptabs { display:flex; gap:4px; padding:0 12px; overflow-x:auto; scrollbar-width:none; position:sticky; top:56px; z-index:3;
    background:var(--app-header-background-color, var(--primary-color)); }
  .ptab { flex:none; background:none; border:none; border-bottom:2px solid transparent; padding:10px 14px; font:inherit; font-size:.95rem; cursor:pointer;
    color:var(--app-header-text-color, var(--text-primary-color,#fff)); opacity:.75; }
  .ptab.on { opacity:1; border-bottom-color:currentColor; font-weight:500; }
  .ptabs:empty { display:none; }
  .chips { display:flex; gap:8px; overflow-x:auto; padding:12px 16px 4px; scrollbar-width:none; margin:0 auto; box-sizing:border-box; }
  .chip { flex:none; display:flex; align-items:center; gap:6px; border:1px solid var(--divider-color,#ddd); background:var(--card-background-color,#fff);
    border-radius:18px; padding:6px 12px; font:inherit; font-size:.9rem; cursor:pointer; color:var(--primary-text-color); white-space:nowrap; }
  .chip.on { background:var(--primary-color); border-color:var(--primary-color); color:var(--text-primary-color,#fff); }
  .chip .n { font-size:.75rem; opacity:.75; }
  .hint { font-size:.8rem; color:var(--secondary-text-color); padding:2px 16px 0; margin:0 auto; box-sizing:border-box; }
  .content { margin:0 auto; padding:8px 16px 32px; box-sizing:border-box; display:grid; gap:16px; align-items:start; }
  .w-normal { max-width:760px; } .w-wide { max-width:none; } .w-settings { max-width:1180px; }
  .cols-1 { grid-template-columns:minmax(0,1fr); }
  .cols-2 { grid-template-columns:repeat(2,minmax(0,1fr)); } .cols-3 { grid-template-columns:repeat(3,minmax(0,1fr)); }
  .cols-4 { grid-template-columns:repeat(4,minmax(0,1fr)); }
  @media (max-width: 1300px) { .cols-4 { grid-template-columns:repeat(3,minmax(0,1fr)); } }
  @media (max-width: 900px) { .cols-2, .cols-3, .cols-4 { grid-template-columns:minmax(0,1fr); } }
  .chip.ordering { cursor:grab; } .chip.drop { outline:2px dashed var(--primary-color); outline-offset:2px; }
  .chip .mv { padding:0 4px; opacity:.8; cursor:pointer; } .chip .mv:hover { opacity:1; }
  .chips .sep { flex:none; width:1px; align-self:stretch; background:var(--divider-color,#ddd); margin:0 4px; }
  .chips { flex-direction:column; gap:6px; overflow:visible; }
  .cgroup { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  .cgroup .glabel { flex:0 0 100%; font-size:.72rem; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:var(--secondary-text-color); margin-top:4px; }
  .chip.pending { border-style:dashed; color:var(--secondary-text-color); }
  .chip.toggle { background:none; color:var(--primary-color); border-color:transparent; font-weight:500; }
  .empty { text-align:center; padding:48px 16px; color:var(--secondary-text-color); }
`;
const ICON_COLUMNS = "M3,3H11V21H3V3M13,3H21V21H13V3M5,5V19H9V5H5M15,5V19H19V5H15Z";
const ICON_PHONE = "M17,19H7V5H17M17,1H7C5.89,1 5,1.89 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3C19,1.89 18.1,1 17,1M12,14L8,10H11V6H13V10H16L12,14Z";

/* ---------------- Als App auf dem Startbildschirm (PWA, siehe pwa.py) ----------------
 * Auf /smartlists zeigt der Manifest-Link auf das SmartLists-Manifest (Start: gewählte Liste, auf Wunsch im
 * Einkaufsmodus); beim Verlassen der Seite wieder auf das von Home Assistant. */
let SL_INSTALL = null;  // Chrome/Edge: „App installieren“ (beforeinstallprompt), sonst Anleitung
window.addEventListener("beforeinstallprompt", (e) => { SL_INSTALL = e; });
const slStandalone = () => { try { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; } catch (e) { return false; } };
const slCompanion = () => /Home ?Assistant\//i.test(navigator.userAgent || "");  // App von HA: hat eigene Widgets
const slPlatform = () => { const ua = navigator.userAgent || "";
  return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? "ios" : /Android/i.test(ua) ? "android" : "other"; };
function slAppUrl(list, shop) {
  const q = new URLSearchParams({ app: "1" });
  if (list) q.set("list", list);
  if (shop) q.set("shopping", "1");
  return q.toString();
}
function slSetHeadLink(rel, href, keep) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement("link"); el.rel = rel; document.head.append(el); keep[rel] = null; }
  else if (!(rel in keep)) keep[rel] = el.getAttribute("href");
  if (el.getAttribute("href") !== href) el.setAttribute("href", href);
}
function slRestoreHeadLinks(keep) {
  for (const [rel, href] of Object.entries(keep)) {
    const el = document.head.querySelector(`link[rel="${rel}"]`);
    if (!el) continue;
    if (href == null) el.remove(); else el.setAttribute("href", href);
  }
}
const ICON_WIDE = "M3,5H21V7H3V5M3,11H21V13H3V11M3,17H21V19H3V17M1,9L4,12L1,15V9M23,9V15L20,12L23,9Z";

/* Seite „SmartLists“: eine Liste oder bis zu drei nebeneinander (zwischen ihnen Ziehen & Ablegen),
 * normale oder breite Darstellung. Einstellungen werden im Browser gemerkt. */
class SmartListsPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._cards = new Map();
    let prefs = {};
    try { prefs = JSON.parse(localStorage.getItem(PANEL_PREFS) || "{}"); } catch (e) { prefs = {}; }
    let legacy = null;
    try { legacy = localStorage.getItem(PANEL_KEY); } catch (e) { /* */ }
    // listsOpen: Listen-Übersicht oben aufgeklappt (Standard: zu – mehr Platz für die Listen, v. a. am Handy)
    this._prefs = { columns: false, wide: false, selected: legacy ? [legacy] : [], order: [], listsOpen: false, ...prefs };
    // Start als App vom Startbildschirm: /smartlists?app=1&list=todo.x&shopping=1
    let q = null;
    try { q = new URLSearchParams(window.location.search); } catch (e) { q = null; }
    this._appMode = !!q && q.get("app") === "1";
    // Sprung aus der Integration (Konfigurieren → Einstellungen): /smartlists?settings=global
    if (q && ["global", "stats"].includes(q.get("settings"))) {
      this._settingsOpen = q.get("settings");
      try { const u = new URL(window.location.href); u.searchParams.delete("settings"); window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash); } catch (e) { /* */ }
    }
    this._startShop = !!q && q.get("shopping") === "1";
    this._headKeep = {};
    // Einstellungen (z.B. Notizen ein/aus) ändern, welche Listen erscheinen
    window.addEventListener("smartlists-lists-changed", () => { this._visibleKey = null; this._render(); });
  }
  set hass(hass) {
    this._hass = hass;
    if (!this._liveSub && hass.connection) {
      // neue/verbundene Listen, App-Listen, Notizen ein/aus → Auswahl oben ohne Neuladen aktualisieren
      this._liveSub = hass.connection.subscribeMessage(() => { this._visibleKey = null; this._render(); }, { type: "smartlists/subscribe" })
        .catch(() => null);
    }
    this._render();
    this._cards.forEach((c) => { c.hass = hass; });
  }
  set narrow(v) { this._narrow = v; this._render(); }
  set panel(p) { this._panelInfo = p; }
  _save() { try { localStorage.setItem(PANEL_PREFS, JSON.stringify(this._prefs)); } catch (e) { /* */ } }

  // Sichtbare Listen kommen von der Integration (eigene Listen nur mit Freigabe); neu laden, wenn sich die
  // Menge der To-do-Entitäten ändert
  _refreshVisible() {
    const st = (this._hass && this._hass.states) || {};
    // auch „nicht verfügbar → verfügbar“ zählt: beim Neuladen der Integration (neue Liste angelegt/übernommen) sind die
    // Listen kurz nicht verfügbar – ohne das blieb eine in diesem Moment geholte Auswahl bis zum Neuladen der Seite veraltet
    const key = Object.keys(st).filter((e) => e.startsWith("todo.")).sort().map((e) => (st[e].state === "unavailable" ? "!" : "") + e).join(",");
    if (key === this._visibleKey) return;
    this._visibleKey = key;
    this._hass.callWS({ type: "smartlists/lists" }).then((r) => { this._visible = new Map(r.lists.map((l) => [l.entity_id, l.type])); this._render(); })
      .catch(() => { this._visible = null; });
    // Extras (Wochenplan ein/aus) – ohne Antwort: wie bisher anzeigen
    this._hass.callWS({ type: "smartlists/config" }).then((r) => { this._features = r.features || null; this._render(); })
      .catch(() => { this._features = null; });
    // kombinierte Listen aus der App, die noch nicht in HA verbunden sind (Chip „verbinden“)
    this._hass.callWS({ type: "smartlists/app_lists" }).then((r) => { this._appLists = r.lists.filter((l) => !l.connected); this._render(); })
      .catch(() => { this._appLists = []; });
  }
  get _t() { return TEXTS[((this._hass && this._hass.language) || "de").slice(0, 2)] || TEXTS.en; }
  async _newList() {
    const t = this._t;
    const name = await slDialog(this.shadowRoot, { title: t.new_list, text: t.new_list_help, input: true, placeholder: t.new_list_placeholder, ok: t.create, cancel: t.cancel });
    if (!name) return;
    try {
      await this._hass.callWS({ type: "smartlists/create_list", name });
      this._visibleKey = null;
      this._pendingSelect = name; // neue Liste gleich auswählen, sobald sie da ist
    } catch (e) {
      await slDialog(this.shadowRoot, { title: t.error, text: (e && e.message) || t.error, ok: "OK", cancel: t.cancel });
    }
  }
  _lists() {
    const st = (this._hass && this._hass.states) || {};
    this._refreshVisible();
    // ohne Antwort der Integration: Notizlisten der App trotzdem ausblenden
    const ok = (e) => (this._visible ? this._visible.has(e) : !isNotesEntity(e, st[e].attributes.friendly_name));
    const order = this._prefs.order || [];
    const rank = (e) => { const i = order.indexOf(e); return i < 0 ? 1e6 : i; };
    return Object.keys(st).filter((e) => e.startsWith("todo.") && st[e].state !== "unavailable" && ok(e))
      .map((e) => ({ e, name: st[e].attributes.friendly_name || e, open: Number(st[e].state) || 0,
        notes: this._visible ? this._visible.get(e) === "notes" : false,
        combined: !!st[e].attributes.smartlists_combined || Array.isArray(st[e].attributes.source_lists) }))
      // eigene Reihenfolge (Ziehen bzw. ◀ ▶), sonst kombinierte zuerst und dann alphabetisch
      .sort((a, b) => (rank(a.e) - rank(b.e)) || (b.combined - a.combined) || a.name.localeCompare(b.name));
  }

  _render() {
    if (!this._hass) return;
    const lists = this._lists();
    // Sprung aus der Integration („Besuchen“ beim Gerät der Liste): /smartlists?list=todo.…
    if (this._wantList === undefined) {
      try { this._wantList = new URLSearchParams(window.location.search).get("list") || null; } catch (e) { this._wantList = null; }
    }
    if (this._wantList && lists.some((l) => l.e === this._wantList)) {
      this._prefs.selected = this._prefs.columns ? [...this._prefs.selected.filter((e) => e !== this._wantList), this._wantList] : [this._wantList];
      this._prefs.tab = "lists"; this._settingsOpen = false; this._wantList = null; this._save();
      // als App gestartet: Adresse so lassen (sonst landet ein Neuladen bzw. „Zum Home-Bildschirm“ woanders)
      if (!this._appMode) try { const u = new URL(window.location.href); u.searchParams.delete("list"); window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash); } catch (e) { /* */ }
    }
    if (this._pendingSelect) {
      const hit = lists.find((l) => l.name === this._pendingSelect);
      if (hit) { this._pendingSelect = null; this._prefs.selected = this._prefs.columns ? [...this._prefs.selected, hit.e] : [hit.e]; this._save(); }
    }
    // beliebig viele Listen; Reihenfolge der Spalten = Reihenfolge der Chips
    const pos = new Map(lists.map((l, i) => [l.e, i]));
    // Gemerkte Auswahl NICHT überschreiben: Beim Laden oder Neuladen der Integration fehlt eine Liste oft kurz
    // (noch nicht da / „nicht verfügbar“). Früher wurde dann die erste Liste gewählt und gespeichert – danach
    // stand eine andere Liste da als eingestellt. Jetzt wird nur angezeigt, gemerkt bleibt die Wahl.
    const stored = Array.isArray(this._prefs.selected) ? this._prefs.selected : [];
    let sel = (this._prefs.columns ? stored : stored.slice(0, 1)).filter((e) => pos.has(e)).sort((a, b) => pos.get(a) - pos.get(b));
    if (!sel.length && lists.length) sel = [lists[0].e];
    this._effSel = sel;
    this._syncApp(sel);
    if (!this._root) {
      this._chipsEl = h("div", { class: "chips", role: "tablist" });
      this._hintEl = h("div", { class: "hint" });
      this._contentEl = h("div", { class: "content" });
      const t = this._t;
      this._menuBtn = h("button", { type: "button", "aria-label": "Menu", title: "Menu",
        onclick: () => this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true })) }, svg(ICON_MENU, 24));
      this._colBtn = h("button", { type: "button", title: t.p_columns, "aria-label": t.p_columns,
        onclick: () => { this._prefs.columns = !this._prefs.columns; this._save(); this._render(); } }, svg(ICON_COLUMNS, 22));
      this._wideBtn = h("button", { type: "button", title: t.p_wide, "aria-label": t.p_wide,
        onclick: () => { this._prefs.wide = !this._prefs.wide; this._save(); this._render(); } }, svg(ICON_WIDE, 22));
      // 📲 Als App speichern – nicht in der Home-Assistant-App und nicht, wenn schon als App geöffnet
      this._appBtn = h("button", { type: "button", title: t.app_title, "aria-label": t.app_title, onclick: () => this._appDialog() }, svg(ICON_PHONE, 22));
      this._appBtn.hidden = slStandalone() || slCompanion();
      this._orderBtn = h("button", { type: "button", title: t.p_order, "aria-label": t.p_order,
        onclick: () => { this._ordering = !this._ordering; this._render(); } }, svg(ICON.sort, 22));
      this._newBtn = h("button", { type: "button", title: this._t.new_list, "aria-label": this._t.new_list, onclick: () => this._newList() }, svg(ICON.plus, 22));
      // Einstellungen: dieselbe Ansicht wie im Zahnrad der Karte, aber auf der ganzen Seite
      this._gearBtn = h("button", { type: "button", title: t.p_settings, "aria-label": t.p_settings,
        onclick: () => { this._settingsOpen = this._settingsOpen === "global" ? false : "global"; this._render(); } }, svg(ICON.gear, 22));
      this._statsBtn = h("button", { type: "button", title: t.stats, "aria-label": t.stats,
        onclick: () => { this._settingsOpen = this._settingsOpen === "stats" ? false : "stats"; this._render(); } }, svg(ICON.chart, 22));
      // Tabs wie in Home Assistant: Listen | Wochenplan
      this._tabsEl = h("div", { class: "ptabs", role: "tablist" });
      this._root = h("div", {}, h("div", { class: "toolbar" }, this._menuBtn, h("span", { class: "title" }, "SmartLists"), this._appBtn, this._newBtn, this._orderBtn, this._colBtn, this._wideBtn, this._statsBtn, this._gearBtn),
        this._tabsEl, this._chipsEl, this._hintEl, this._contentEl);
      this.shadowRoot.replaceChildren(h("style", {}, PANEL_STYLE), this._root);
    }
    this._menuBtn.hidden = !this._narrow;
    const planOn = !this._features || this._features.mealplan !== false;
    const tab = this._settingsOpen ? null : (planOn && this._prefs.tab) || "lists";
    // nur ein Tab (Wochenplan unter Extras aus) → keine Tab-Leiste
    fill(this._tabsEl, this._settingsOpen || !planOn ? null : [["lists", "📋 " + this._t.p_tab_lists], ["plan", "🗓️ " + this._t.mp_title]].map(([id, label]) =>
      h("button", { type: "button", role: "tab", class: `ptab ${tab === id ? "on" : ""}`, "aria-selected": String(tab === id),
        onclick: () => { this._prefs.tab = id; this._save(); this._render(); } }, label)));
    this._gearBtn.classList.toggle("on", this._settingsOpen === "global");
    this._gearBtn.setAttribute("aria-pressed", String(this._settingsOpen === "global"));
    // 📊 nur, wenn Statistik und Ausgaben unter Extras an sind
    const statsOn = !this._features || this._features.stats !== false;
    this._statsBtn.hidden = !statsOn;
    if (!statsOn && this._settingsOpen === "stats") this._settingsOpen = false;
    this._statsBtn.classList.toggle("on", this._settingsOpen === "stats");
    [this._newBtn, this._orderBtn, this._colBtn, this._wideBtn].forEach((b) => { b.hidden = !!this._settingsOpen || tab === "plan"; });
    this._orderBtn.classList.toggle("on", !!this._ordering);
    this._orderBtn.setAttribute("aria-pressed", String(!!this._ordering));
    if (this._settingsOpen) {
      // Allgemeine Einstellungen (Für mich / Global / Auswertung). Was nur eine Liste betrifft, steht im Zahnrad der Karte.
      if (!lists.some((l) => l.e === this._settingsEntity)) this._settingsEntity = sel[0] || (lists[0] && lists[0].e);
      const entity = this._settingsEntity;
      if (!entity) { fill(this._contentEl, h("div", { class: "empty" }, this._t.p_empty)); return; }
      const scope = this._settingsOpen === "stats" ? "stats" : "global";
      if (!this._settingsCard || this._settingsCard._config.entity !== entity || this._settingsCard._config.settings_scope !== scope) {
        this._settingsCard = document.createElement("smartlists-card");
        this._settingsCard.setConfig({ entity, settings_only: true, settings_scope: scope });
      }
      this._settingsCard.hass = this._hass;
      fill(this._chipsEl); fill(this._hintEl);
      this._contentEl.className = "content w-settings cols-1";
      if (this._contentEl.firstChild !== this._settingsCard) fill(this._contentEl, this._settingsCard);
      return;
    }
    if (tab === "plan") {
      // Wochenplan direkt auf der Seite; „Zutaten auf die Liste“ geht standardmäßig an die gewählte Liste
      if (!this._planCard) {
        this._planCard = document.createElement("smartlists-card");
        this._planCard.setConfig({ view: "mealplan", entity: sel[0] || (lists[0] && lists[0].e) || "" });
      }
      this._planCard.hass = this._hass;
      fill(this._chipsEl); fill(this._hintEl);
      this._contentEl.className = "content w-normal cols-1";
      if (this._contentEl.firstChild !== this._planCard) fill(this._contentEl, this._planCard);
      return;
    }
    this._colBtn.classList.toggle("on", this._prefs.columns);
    this._wideBtn.classList.toggle("on", this._prefs.wide);
    this._colBtn.setAttribute("aria-pressed", String(this._prefs.columns));
    this._wideBtn.setAttribute("aria-pressed", String(this._prefs.wide));
    const width = this._prefs.wide || this._prefs.columns ? "w-wide" : "w-normal";
    [this._chipsEl, this._hintEl].forEach((e) => { e.className = e.className.split(" ")[0] + " " + width; });
    const chip = (l, i, group) => {
      const el = h("button", { type: "button", role: "tab", class: `chip ${sel.includes(l.e) ? "on" : ""} ${this._ordering ? "ordering" : ""}`,
        "aria-selected": String(sel.includes(l.e)), draggable: "true", onclick: () => { if (!this._ordering) this._select(l.e); } },
        this._ordering && i > 0 ? h("span", { class: "mv", role: "button", "aria-label": this._t.p_left, title: this._t.p_left,
          onclick: (e) => { e.stopPropagation(); this._move(lists, l.e, group[i - 1].e, false); } }, "◀") : null,
        l.notes ? "📝 " : "", chipName(l.name), h("span", { class: "n" }, String(l.open)),
        this._ordering && i < group.length - 1 ? h("span", { class: "mv", role: "button", "aria-label": this._t.p_right, title: this._t.p_right,
          onclick: (e) => { e.stopPropagation(); this._move(lists, l.e, group[i + 1].e, true); } }, "▶") : null);
      // Ziehen & Ablegen mit der Maus: Chip auf einen anderen ziehen = davor einsortieren
      el.addEventListener("dragstart", (e) => { this._dragChip = l.e; try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", l.name); } catch (err) { /* */ } });
      el.addEventListener("dragover", (e) => { if (this._dragChip && this._dragChip !== l.e) { e.preventDefault(); el.classList.add("drop"); } });
      el.addEventListener("dragleave", () => el.classList.remove("drop"));
      el.addEventListener("drop", (e) => { e.preventDefault(); el.classList.remove("drop"); if (this._dragChip) this._move(lists, this._dragChip, l.e, false); this._dragChip = null; });
      el.addEventListener("dragend", () => { this._dragChip = null; });
      return el;
    };
    // getrennt nach Art: Kombinierte Listen | Listen | Notizen (je Gruppe eigene Reihenfolge)
    const combined = lists.filter((l) => !l.notes && l.combined);
    const normal = lists.filter((l) => !l.notes && !l.combined);
    const notes = lists.filter((l) => l.notes);
    const pending = (this._appLists || []);
    const group = (label, items, extra) => (items.length || (extra && extra.length) ? h("div", { class: "cgroup" },
      h("span", { class: "glabel" }, label), items.map((l, i) => chip(l, i, items)), extra) : null);
    const pendingChips = pending.map((a) => h("button", { type: "button", class: "chip pending", title: this._t.app_list_pending,
      onclick: async () => {
        if (!(this._hass.user && this._hass.user.is_admin)) { await slDialog(this.shadowRoot, { title: a.name, text: this._t.app_list_admin, ok: "OK", cancel: this._t.cancel }); return; }
        if (!(await slDialog(this.shadowRoot, { title: a.name, text: `${this._t.app_list_pending}: ${a.sources.join(", ")}`, ok: this._t.app_list_connect, cancel: this._t.cancel }))) return;
        try { await this._hass.callWS({ type: "smartlists/connect_app_list", device_id: a.device_id, list_id: a.id }); this._visibleKey = null; this._pendingSelect = a.name; }
        catch (err) { await slDialog(this.shadowRoot, { title: this._t.error, text: (err && err.message) || this._t.error, ok: "OK", cancel: this._t.cancel }); }
      } }, "📱 ", a.name, h("span", { class: "n" }, "＋")));
    const newNotes = notes.length || (this._visible && [...this._visible.values()].includes("notes")) ? h("button", { type: "button", class: "chip pending", title: this._t.notes_create, onclick: async () => {
      const name = await slDialog(this.shadowRoot, { title: this._t.notes_create, text: this._t.notes_create_help, input: true, value: (this._hass.user && this._hass.user.name) || "", ok: this._t.create, cancel: this._t.cancel });
      if (!name) return;
      try { await this._hass.callWS({ type: "smartlists/create_notes", name }); this._visibleKey = null; }
      catch (err) { await slDialog(this.shadowRoot, { title: this._t.error, text: (err && err.message) || this._t.error, ok: "OK", cancel: this._t.cancel }); }
    } }, "＋ 📝") : null;
    // eingeklappt: eine Zeile mit den gewählten Listen und „Alle Listen ▾“; im Sortiermodus immer offen
    const open = this._prefs.listsOpen || this._ordering;
    const toggle = h("button", { type: "button", class: "chip toggle", "aria-expanded": String(open),
      onclick: () => { this._prefs.listsOpen = !this._prefs.listsOpen; this._save(); this._render(); } },
      open ? `▴ ${this._t.p_lists_less}` : `▾ ${this._t.p_lists_all} (${lists.length + pending.length})`);
    if (!open) {
      const chosen = lists.filter((l) => sel.includes(l.e));
      fill(this._chipsEl, h("div", { class: "cgroup collapsed" }, chosen.map((l, i) => chip(l, i, chosen)), toggle));
    } else {
      fill(this._chipsEl, group(this._t.p_group_combined, combined, pendingChips), group(this._t.p_group_lists, normal),
        group(this._t.p_group_notes, notes, newNotes ? [newNotes] : null), h("div", { class: "cgroup" }, toggle));
    }
    fill(this._hintEl, this._ordering ? this._t.p_order_hint : this._prefs.columns ? this._t.p_hint : "");
    if (!sel.length) {
      this._cards.clear();
      this._contentEl.className = `content ${width}`;
      fill(this._contentEl, h("div", { class: "empty" }, this._t.p_empty));
      return;
    }
    // Karten wiederverwenden (Eingaben/Zustand bleiben), nur neue anlegen bzw. abgewählte entfernen
    for (const e of [...this._cards.keys()]) if (!sel.includes(e)) this._cards.delete(e);
    const cards = sel.map((e) => {
      if (!this._cards.has(e)) {
        const c = document.createElement("smartlists-card");
        // Zahnrad je Karte = nur Einstellungen dieser Liste; Globales über ⚙ oben in der Werkzeugleiste
        c.setConfig({ entity: e, settings_scope: "list", ...(this._startShop ? { start_shopping: true } : {}) });
        c.hass = this._hass;
        this._cards.set(e, c);
      }
      return this._cards.get(e);
    });
    this._contentEl.className = `content ${width} cols-${Math.min(cards.length, this._prefs.wide ? 4 : 3)}`;
    const current = [...this._contentEl.childNodes];
    if (current.length !== cards.length || current.some((n, i) => n !== cards[i])) fill(this._contentEl, ...cards);
    if (this._startShop && !this._wantList) this._startShop = false;  // nur beim Start als App
  }
  connectedCallback() { this._attached = true; if (this._effSel) this._syncApp(this._effSel); }
  disconnectedCallback() { this._attached = false; slRestoreHeadLinks(this._headKeep); this._headKeep = {}; }
  // Manifest der Seite: „Installieren“/„Zum Startbildschirm“ öffnet direkt die gewählte Liste
  _syncApp(sel) {
    if (this._attached === false) return;
    const prefs = this._prefs.app || {};
    const list = prefs.list && this._hass && this._hass.states[prefs.list] ? prefs.list : sel[0];
    const shop = prefs.shopping !== false;
    const name = list && this._hass && this._hass.states[list] ? this._hass.states[list].attributes.friendly_name || "" : "";
    slSetHeadLink("manifest", `/smartlists-files/app.webmanifest?${slAppUrl(list, shop)}${name ? "&name=" + encodeURIComponent(name) : ""}`, this._headKeep);
    slSetHeadLink("apple-touch-icon", "/smartlists-files/brand/icon@2x.png", this._headKeep);
  }
  // 📲 Als App auf dem Startbildschirm speichern: Liste und Einkaufsmodus wählen, dann installieren bzw. Anleitung
  _appDialog() {
    const t = this._t;
    const lists = this._lists().filter((l) => !l.notes);
    const prefs = { list: (this._prefs.app && this._prefs.app.list) || (this._effSel || [])[0] || (lists[0] && lists[0].e) || "", shopping: !(this._prefs.app && this._prefs.app.shopping === false) };
    const platform = slPlatform();
    const apply = () => {
      this._prefs.app = { ...prefs }; this._save(); this._syncApp(this._effSel || []);
      // iOS nimmt beim „Zum Home-Bildschirm“ die aktuelle Adresse → passend setzen
      try { window.history.replaceState(window.history.state, "", `${window.location.pathname}?${slAppUrl(prefs.list, prefs.shopping)}`); this._appMode = true; } catch (e) { /* */ }
    };
    const box = h("input", { type: "checkbox", checked: prefs.shopping, onchange: (e) => { prefs.shopping = e.target.checked; apply(); } });
    box.checked = prefs.shopping;
    const steps = { ios: t.app_ios, android: t.app_android, other: t.app_other }[platform];
    const close = () => back.remove();
    const install = SL_INSTALL ? h("button", { type: "button", class: "ok", onclick: async () => {
      apply();
      try { await SL_INSTALL.prompt(); SL_INSTALL = null; close(); } catch (e) { /* Anleitung bleibt sichtbar */ }
    } }, "📲 " + t.app_install) : null;
    const back = h("div", { class: "dlg-back", onclick: (ev) => { if (ev.target === back) close(); } },
      h("style", {}, DIALOG_STYLE + `.dlg label{display:flex;align-items:center;gap:10px;margin:0 0 12px;font-size:.95rem}
        .dlg select{width:100%;height:42px;border-radius:10px;border:1px solid var(--divider-color,#ccc);background:var(--secondary-background-color,#f2f2f2);color:inherit;font:inherit;padding:0 10px;margin:0 0 12px}
        .dlg ol{margin:0 0 14px;padding-left:20px;font-size:.9rem;line-height:1.5}.dlg input[type=checkbox]{width:20px;height:20px;margin:0}`),
      h("div", { class: "dlg", role: "dialog", "aria-modal": "true", "aria-label": t.app_title },
        h("h2", {}, "📲 " + t.app_title),
        h("p", {}, t.app_lead),
        h("select", { "aria-label": t.app_list, onchange: (e) => { prefs.list = e.target.value; apply(); } },
          lists.map((l) => h("option", { value: l.e, selected: l.e === prefs.list }, l.name))),
        h("label", {}, box, t.app_shop),
        h("ol", {}, steps.split("\n").map((x) => h("li", {}, x))),
        h("div", { class: "row" }, h("button", { type: "button", onclick: close }, t.app_close), install)));
    apply();
    this.shadowRoot.append(back);
  }
  _select(entity) {
    // Basis: was gerade zu sehen ist; gemerkte, gerade fehlende Listen bleiben dahinter erhalten
    const sel = this._effSel || this._prefs.selected || [];
    const away = (this._prefs.selected || []).filter((e) => !sel.includes(e) && !(this._hass && this._hass.states[e] && this._hass.states[e].state !== "unavailable"));
    if (!this._prefs.columns) this._prefs.selected = [entity];
    else if (sel.includes(entity)) { if (sel.length > 1) this._prefs.selected = [...sel.filter((e) => e !== entity), ...away]; }
    else this._prefs.selected = [...sel, entity, ...away];
    this._save();
    this._render();
  }
  // Liste `entity` vor (bzw. nach) `target` einsortieren; gemerkt pro Browser
  _move(lists, entity, target, after) {
    const ids = lists.map((l) => l.e).filter((e) => e !== entity);
    const i = ids.indexOf(target);
    ids.splice(i < 0 ? ids.length : i + (after ? 1 : 0), 0, entity);
    this._prefs.order = ids;
    this._save();
    this._render();
  }
}
const ICON_MENU = "M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z";



/* Registrieren. Ist schon eine ÄLTERE Fassung geladen (z.B. eine alte Kopie als Dashboard-Ressource
 * oder über HACS als „Dashboard“), lässt sich das Element nicht neu definieren – dann werden die
 * Methoden der vorhandenen Klasse durch die neuen ersetzt, damit überall die aktuelle Karte läuft. */
function semverNewer(a, b) {
  const pa = String(a || "0").split("."), pb = String(b || "0").split(".");
  for (let i = 0; i < 3; i++) { const d = (Number(pa[i]) || 0) - (Number(pb[i]) || 0); if (d) return d > 0; }
  return false;
}
function defineOrUpgrade(tag, cls) {
  const existing = customElements.get(tag);
  if (!existing) { customElements.define(tag, cls); return "neu"; }
  if (existing === cls || !semverNewer(CARD_VERSION, existing.__smartlistsVersion)) return "vorhanden";
  for (const target of [existing.prototype, existing]) {
    const source = target === existing ? cls : cls.prototype;
    for (const name of Object.getOwnPropertyNames(source)) {
      if (["prototype", "length", "name", "constructor"].includes(name)) continue;
      Object.defineProperty(target, name, Object.getOwnPropertyDescriptor(source, name));
    }
  }
  existing.__smartlistsVersion = CARD_VERSION;
  return "ersetzt";
}
for (const c of [SmartListsCard, SmartListsCardEditor, SmartListsPanel]) c.__smartlistsVersion = CARD_VERSION;
const _slResult = defineOrUpgrade("smartlists-card", SmartListsCard);
defineOrUpgrade("smartlists-card-editor", SmartListsCardEditor);
defineOrUpgrade("smartlists-panel", SmartListsPanel);
if (_slResult !== "vorhanden" || !(window.customCards || []).some((c) => c.type === "smartlists-card")) {
  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === "smartlists-card")) {
    window.customCards.push({
      type: "smartlists-card",
      name: "SmartLists",
      description: (TEXTS[String((document.documentElement && document.documentElement.lang) || navigator.language || "en").slice(0, 2)] || TEXTS.en).card_desc,
      preview: false,
    });
  }
}
if (_slResult.startsWith("ersetzt")) {
  console.warn(`SmartLists: eine ältere Karten-Datei war schon geladen und wurde durch ${CARD_VERSION} ersetzt. `
    + "Bitte die alte Dashboard-Ressource bzw. den HACS-Eintrag vom Typ „Dashboard“ entfernen.");
}
console.info(`%c SmartLists %c ${CARD_VERSION} `, "background:#1747B5;color:#fff;border-radius:3px 0 0 3px", "background:#3E7BFA;color:#fff;border-radius:0 3px 3px 0");

