# Sidebar page

<img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/hero.svg" alt="Sidebar page with a combined list">

The integration adds **SmartLists** to the sidebar (`/smartlists`). It shows all to-do lists as tabs in
three groups – **Combined lists**, **Lists** and **Notes** – each rendered like the card. The overview is
collapsed by default (the selected lists and *All lists ▾*). Combined lists
created in the app that are not connected yet appear dashed with 📱; tap to connect (admins).

Two tabs below the toolbar: **📋 Lists** and **🗓️ Meal plan**. The meal plan tab shows the week right on
the page (same as *⋯ → Meal plan* in the card); *Ingredients to:* picks the list the ingredients go to. The
plan is also the calendar **SmartLists Meal plan** in Home Assistant.

<img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/mealplan.svg" alt="Meal plan tab">

Toolbar buttons:

- **📲 Save as app** – puts a **SmartLists icon on the phone's home screen** that opens one list directly
  (optionally straight in **shopping mode**), full screen like an app – no extra app to install. Pick the list,
  then follow the steps shown: Android/Chrome *⋮ → Add to Home screen / Install app* (or the *Install* button),
  iPhone/Safari *Share → Add to Home Screen*. Several icons for different lists are possible. The button is
  hidden inside the Home Assistant companion app and when the page already runs as an app. Behind it: on this
  page SmartLists points the browser to its own web-app manifest (`/smartlists?app=1&list=…&shopping=1`); on
  other pages Home Assistant's own manifest applies as usual. Login is shared with Home Assistant in the same
  browser.
- **+** – create an own list (you are the owner, see [[Own lists and sharing]]). Lists that are not
  shared with you are not shown.
- **Side by side** – tap as many lists as you like; they appear in columns (up to 3, or 4 in wide layout,
  more wrap into further rows). Drag items between them with the mouse (Ctrl = copy).
- **Order** (⇅) – ◀ ▶ on each chip moves a list; with the mouse you can also drag a chip onto another.
  The order applies to the chips and the columns and is remembered per browser.
- **Wide** – use the full screen width.
- **⚙ Settings** – the general settings (each list's own settings are in the gear of its card): *For me* (your controls), *Global* (naming
  convention, remembered categories, voice & automations, connected devices, backup, controls for
  everyone – admins) and *This list* (sharing, details).

<img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/notes.svg" alt="Notes as note cards">

**App notes** (`todo.ha_smartlists_note…` of the HA SmartLists app) are not shopping lists and are
hidden by default. Admins can show them as a separate 📝 section: *⚙ → Global → Devices and notes*. A note list can also be created there (or with ＋📝 on the page) if the app has none yet. Notes are
bound to an account – by default only their owner sees them (the app reports the owner when it syncs;
admins can change it there). Optionally all users can see them. They are shown **like in the app**: note cards with
title and text (grid or list, ▦/☰), *＋ New note* and tap to edit – no categories, quantities or
checkboxes. Notes encrypted with the app's notes password stay locked (🔒, readable only in the app).
Notes never appear in Assist,
actions (`get_items`) or the list pickers for combined lists.

The choice is remembered per browser. Hide the page via *Edit sidebar* if you only use the card.
