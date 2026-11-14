# Settings

<img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/settings.svg" alt="General settings with areas and two columns">

There are two places, so that nothing is mixed up.

## General settings

Card: **⋯ → General settings**. Sidebar page: **⚙** at the top right.

On a wide screen the areas are listed on the left and the selected area is shown next to it in two
columns; on a narrow screen you first see the areas and open one. The search field filters the areas.

| Group | Area | What |
|---|---|---|
| For me | Controls | gesture for the item menu, menu entries, pencil/bin in the row – for all your devices or only this one |
| For me | Shopping and scanning | shopping mode (hide checked, keep screen on, large rows, store by zone), barcode target list and mode |
| For me | Notifications | device, new items / checked off, lists, people, quiet hours |
| Global (admins) | Badges and colours | naming convention (`@` `*` `#`), badge style per kind, background and text colours, names of single badges |
| Global (admins) | Stores & zones | zones per store, aisle order |
| Global (admins) | Categories | keyword packs, remembered categories |
| Global (admins) | Extras | optional areas: notes (📝 section) and meal plan – off in the setup assistant by default |
| Global (admins) | Devices and notes | connected devices, combined lists from the app, app notes |
| Global (admins) | Sharing and permissions | who may share lists via link and how far; public address for links (HA address, Quick Tunnel, own proxy); what users without admin rights may do |
| Global (admins) | Voice, backup, defaults | Assist, due items, barcode lookup services, export/import, default controls for everyone, take over existing lists, run setup again, start from scratch |
| Insights | Statistics and expenses | bought most often, not bought for a while, expenses, bookings |

*For me* applies to you only; a dot marks where you differ from the global default. *Global* applies to
all users and also to the app.

*Settings → Devices & services → SmartLists → Configure* only offers *Run setup again / start from scratch*
(see [Setup](Setup#run-again-or-start-from-scratch)) and **Open settings**, which jumps here
(`/smartlists?settings=global`).

## Sharing and permissions

Admins decide under *Global → Sharing and permissions*:

- **Links**: who may create share links (admins only · admins and the list's owner · everyone who may
  edit the list · nobody), what a link may allow at most (view only · "soft" check · check off and add) and
  the longest validity. The limits apply to users without admin rights. *Show active links of all lists*
  lists every link and lets you revoke it.
- **Public address for links**: Home Assistant address, Cloudflare Quick Tunnel or own proxy – so people you
  share with do not learn the address of your Home Assistant. See
  [Shopping helpers](Shopping-helpers#share-without-revealing-your-home-assistant-address).
- **Allowed without admin rights**: create own lists, create and change templates, assign categories by
  hand, enter prices. Switched off, these actions answer with a hint for non-admins.

## Settings of a list

**⋯ → Settings of this list** opens a window over the list (two columns on wide screens, a sheet from
the bottom on small ones):

- **List** – name (the display name in Home Assistant), default sort order and prices on/off. These apply
  to the list on all devices unless a dashboard card or a device sets something else. Admins, and the
  owner of an own list.
  - **Plain list** – a "dumb" list, e.g. for the hardware store: no categories, no suggestions, no
    remembered words, units or prices. SmartLists remembers **nothing** from it, so "wood" typed there never
    shows up in another list. Badges (`@store`, `*person`) and quantities still work as plain text.
  - **Categories automatically** – off: this list is not sorted into categories, neither the items nor what you
    type (no category chip in the preview, no category picker, no category sort). Useful e.g. for a hardware
    store or packing list.
  - **Bought often & suggestions** – *only from this list* (default; a combined list: *from its source lists*)
    or *from all lists*. Since 3.9.4 SmartLists counts per list where an item was added; history from before
    that has no list and keeps showing everywhere.
- **Sharing** with people in Home Assistant (own lists): view, check off, edit.
- **Share via link** for people without an account – see [[Shopping helpers]].
