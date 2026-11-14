# Troubleshooting

**"Custom element doesn't exist: smartlists-card"**
The integration is not set up yet. Add it under *Settings → Devices & services*, restart Home
Assistant and reload the page.

**New features missing in the dashboard card, but the sidebar page is fine**
An older copy of the card is loaded as a dashboard resource. Remove `smartlists` entries under
*Settings → Dashboards → ⋮ → Resources* and, in HACS, a repository entry of type "Dashboard". The
browser console (F12) shows `SmartLists <version>`; the card's gear menu shows the versions and warns
when the card is outdated.

**My device does not appear under "Connected devices"**
- The integration must be 1.7.0 or newer (*Settings → Devices & services → SmartLists*).
- The app must be a build that includes device registration, and paired: *App → Settings →
  Connection → SmartLists integration* must say "Paired". Tap *Sync*.
- Check *Settings → System → Logs* for `smartlists`.

**Offer shows raw `⚙OFFER:{…}` text**
That is HA's own to-do view of a regular list – it cannot be changed. Use the card or the sidebar page.

**Icon missing in the HACS list**
HACS loads icons from its own catalogue; the integration's own icon shows on the Integrations page
(HA 2026.3+). It appears in HACS once SmartLists is part of the default catalogue.

**Push rejected: "refusing to allow an OAuth App to create or update workflow"** (developers)
Use a token with the *workflow* permission, e.g.
`git -c credential.helper= push https://github.com/m3m0rex/ha_smartlists.git main`.

**The sidebar page shows a different list than the one I chose**
Fixed in 3.9.3: while Home Assistant (re)loads, a list is briefly missing; the page used to remember the first list
instead. Update and choose your list once more.

**A share link shows "This link has expired or was revoked"**
With *Cloudflare Quick Tunnel* the address changes after every restart of Home Assistant, so older links no longer
work (the share window marks them "address has changed"). Create a new link, or use your own proxy for lasting links.

**"Share" says the tunnel is not ready / cloudflared missing**
SmartLists does not download `cloudflared` by itself. Put the binary at `/config/cloudflared` or
`/config/bin/cloudflared` (see [Shopping helpers](Shopping-helpers#share-without-revealing-your-home-assistant-address))
or choose *Own proxy or tunnel*.

**The 📲 button for the home screen is missing**
It is hidden inside the Home Assistant companion app (use its widgets there) and when the page already runs as an app.
Open `/smartlists` in Chrome (Android) or Safari (iPhone).

## Diagnostics and repairs

- *Settings → Devices & services → SmartLists → ⋮ → Download diagnostics* creates a file with version,
  settings and counters – no item texts, tokens, link keys or user names. Attach it to bug reports.
- SmartLists reports problems under *Settings → Repairs*: a combined list whose source list no longer
  exists, devices with the app that have not synced for 30 days, and **lists of the app
  (`todo.ha_smartlists_*`) that are not yet taken over** – *Fix* there takes the list over (see
  [Own lists and sharing](Own-lists-and-sharing#take-over-existing-lists)). Share links of deleted lists are
  removed automatically.
