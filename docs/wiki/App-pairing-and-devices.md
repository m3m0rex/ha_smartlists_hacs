# App pairing and devices

> ℹ️ **The HA SmartLists Android app is not published yet.** This page describes how the integration works with
> it once it is available. Until then you need none of this – SmartLists works fully in Home Assistant, the card,
> the sidebar page and the official Home Assistant app (including its home-screen widgets).

The **HA SmartLists** Android app pairs with the integration automatically when it can reach it:
*App → Settings → Connection → SmartLists integration* shows "Paired · version …". Tap *Sync* to sync
now; otherwise the app checks at most every 15 minutes while refreshing.

When paired, the app:

- shows the same badges, naming convention, categories and offers,
- shows combined lists from the integration as combined lists (managed in HA),
- syncs remembered categories in both directions, including deletions,
- registers itself as a **device**.

## Backups

When paired, *App → Settings → Backup → Back up to Home Assistant* stores the **complete** app state –
all lists and every setting (theme, colours, font size, categories, offers, sort orders, reminders,
notes encryption, local account) – permanently in the integration. Restoring brings everything back
and restarts the app. Not included on purpose: the Home Assistant token and the WebDAV password (the
current ones are kept) and device-specific data (backup folder permission). Encrypted notes stay
encrypted with your own password.

**Backup password** (*App → Settings → Backup → Backup password*): encrypts every backup – Home
Assistant, WebDAV and file – with AES-256-GCM before it leaves the device. Home Assistant only stores
unreadable data; nobody can read it without the password, not even an admin. The password is kept only
on the device and is never part of a backup. After a reinstall the app asks for it when restoring.
**If you forget it, the backup cannot be restored.**

## Connected devices

*General settings → Global → Devices and notes* lists every device with user, model, app and Android version and last
seen (⚠️ after 7 days). Each one is also an HA device under SmartLists with the sensors
**Last seen** (usable in automations) and **App version**.

Removing a device only removes it from the list; it reappears on the next sync. To revoke access delete
the device's token under *Profile → Security → Long-lived access tokens*. Use one token per person so
everyone gets their own settings.

Interface details for developers: [`docs/app-api.md`](https://github.com/m3m0rex/ha_smartlists/blob/main/docs/app-api.md).

## Combined lists from the app

Combined lists created **in the app** (from Home Assistant lists) are reported to the integration when
the app syncs. You find them

- in the general settings → *Global → Devices and notes*, below the device, with **Connect**,
- on the sidebar page as a dashed 📱 chip under *Combined lists*.

Lists of the app that are still plain Local To-do lists (`todo.ha_smartlists_*`) are reported under
*Settings → Repairs*; *Fix* takes them over as own SmartLists lists.

Connecting creates a real combined list in Home Assistant with the same sources. It **belongs to the
device of the app** (it shows up on its device page) and can be edited like any combined list. From then on
the app shows the list from Home Assistant instead of its own, so it is not there twice. Lists that
also contain local (non-HA) lists of the app cannot be connected.

Lists that also contain **local** lists of the app are not reported. In the app, open *Combined lists → ⋮ →
Send to Home Assistant*: the local source lists are moved to Home Assistant (items included) and the combined
list is connected right away if your HA account is an admin.

## Naming convention and badge look in the app

When paired, the app takes the **naming convention** (`@` store, `*` person, `#` tag – or whatever you set
under *Global → Badges and colours*) and the **look of the badges** from Home Assistant: style per kind
(filled, subtle, outline, text only), colours, the symbol in front, and colour/display name of individual
stores, people and tags. The app refreshes this on every sync (at most every 15 minutes), so a change in
Home Assistant shows up in the app without doing anything.
