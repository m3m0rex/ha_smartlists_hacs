# Shopping helpers

All of these are optional – without settings SmartLists behaves as before.

## Aisle order per store

*General settings → Global → Stores & zones → 🛤️ Order* next to a store. Drag the rows by the handle ⠿
(mouse, finger or pen) or move them with ▲▼ into the order of the aisles. If the store has several zones (branches), choose a
branch to give it its own order. In **shopping mode**, when that store is selected (by hand or
automatically through its zone), the list is grouped in this order.

## Prices & expenses

- **Price of an item:** type it at the end – `Milk 2 l 1,19€` (the price is not part of the name), or
  ✏️ → *Price*. A typed price is for the whole line (`Milk 2 l 1,19€` = 2 l for 1,19 €) and is stored
  **per unit** (0,60 €/l), so other quantities are calculated correctly; in ✏️ you enter the price per
  unit. Offers from the app bring their own price.
- The row shows the total and the unit price; a **total** bar below the list shows open and in-cart sums.
- **Expenses** are booked when an item with a price is **checked off** in the card or the sidebar page
  (re-opening within 6 hours takes it back). *General settings → Statistics → Expenses* shows weeks,
  months or years per store; `sensor.smartlists_expenses_this_month` has the current month.
- Items checked off directly in the app or HA's own to-do view are not booked yet.
- **Shopping done** next to the total sets the "in cart" sum back to 0 (expenses stay booked); optionally
  it reopens everything checked for lists you reuse every week.

## Templates & recipes

*⋯ → Templates* in the card header opens the templates: tap one to add it – choose servings (quantities are scaled),
untick items you don't need. Items already open on the list get their quantity increased instead of
being added twice. *＋ New template* (one item per line, with quantities and tags), *List as template*
takes the open items. Assist: "Put pancakes on the shopping list" uses the template of that name;
action `smartlists.add_template` does the same in automations.

## Share via link / QR code

<img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/share.svg" alt="Share window with QR code" width="620">

*Gear of the list (settings of this list) → Share via link*. Who may create links is decided by an admin
under *General settings → Global → Sharing and permissions*: admins only, admins and the list's owner
(default), everyone who may edit the list, or nobody (sharing off). There the admin also sets what a link
may allow at most, the longest validity for users without admin rights, and sees – and can revoke – the
active links of all lists.

- Options when creating: **checking off** – *view only* (default), *“soft”* (the person can mark
  items; you see "✓ marked from outside" but the item stays open until you check it off) or *really
  check off*; **may add**; **valid** for 2 hours, 1 day, 7 days, 30 days or until revoked.
- You get the link and a **QR code** once; copy or share it. The list shows active links with expiry
  and how often they were opened; **revoke** any time.
- **Security:** the link contains a random 256-bit key; only its SHA-256 hash is stored, so even
  someone reading `.storage` cannot rebuild a link. Without login only two addresses are reachable
  (`/smartlists-share/<key>` and `/api/smartlists/share/<key>`); they return the list name and the
  item texts with checkmarks – no notes, no entities, no users, nothing else from Home Assistant.
  Writing is limited (30 actions per minute, 120 characters), wrong keys are answered slowly, the page
  is not indexed and cannot be framed. Note lists of the app cannot be shared.
- By default the link uses the external address of Home Assistant (Nabu Casa or your own domain,
  *Settings → System → Network → external URL*) – whoever gets the link learns that address. To avoid
  that, see the next section.

### Share without revealing your Home Assistant address

*General settings → Global → Sharing and permissions → Public address for links* (admins):

| Links via | What happens |
|---|---|
| **Home Assistant address** (default, as before) | The link points to the external URL of Home Assistant. |
| **Cloudflare Quick Tunnel** | SmartLists starts `cloudflared` and gets a random address `https://….trycloudflare.com`. No Cloudflare account, no port forwarding. |
| **Own proxy or tunnel** | Your own address (Caddy, nginx, Traefik, Cloudflare Tunnel with your own domain, …). |

For the tunnel and the own proxy SmartLists starts a **small server of its own (default port 8126)** that
serves *only* the share page and the share API – no login page, no API, nothing else from Home Assistant.
The tunnel/proxy points to that port, never to Home Assistant itself. With the tunnel the server listens on
`127.0.0.1` only; with an own proxy on all addresses (the proxy often runs in another container or device).
If the chosen way is not ready (tunnel still starting, port in use), **no link is created** – SmartLists
never falls back silently to the Home Assistant address.

**cloudflared** – SmartLists does **not download it by itself**. If it is already installed (in `PATH`),
it is used. Otherwise the setting shows a hint: download it from the
[cloudflared releases](https://github.com/cloudflare/cloudflared/releases/latest) (Home Assistant OS on a
Raspberry Pi: `cloudflared-linux-arm64`, on x86: `cloudflared-linux-amd64`), rename it to `cloudflared`
and put it at `/config/cloudflared` or `/config/bin/cloudflared` (e.g. via the Samba or File editor add-on),
then press *Save*. A missing execute permission is added automatically.

Good to know about Quick Tunnels: the address **changes every time Home Assistant restarts**, so links
created before stop working (the card marks them "address has changed"). Cloudflare offers Quick Tunnels
for testing and without uptime guarantee. For lasting links use your own proxy or a named Cloudflare Tunnel
with your own domain.

**Own proxy – examples** (replace `192.168.1.10` with the IP of Home Assistant):

```caddyfile
liste.example.org {
    reverse_proxy 192.168.1.10:8126
}
```

```nginx
server {
    server_name liste.example.org;
    location / { proxy_pass http://192.168.1.10:8126; }
}
```

Cloudflare Tunnel with your own domain (e.g. the *Cloudflared* add-on): add a public hostname
`liste.example.org` → `http://homeassistant:8126`. Then enter `https://liste.example.org` as the public
address. A sub-path such as `https://example.org/list` works as well, as long as the proxy strips it.

## Notifications

*General settings → For me → Notifications* – everyone for themselves: **where to** (one or more
targets), on new items and/or when something is checked off, which lists, from whom (per person), quiet hours.
Your own changes only notify you if *Also for my own changes* is on (handy to try it out, or when you add
something on the PC and want it on your phone). Several changes within a minute arrive as one message ("Anna
added milk 2 l, bread to Shopping"). Changes from the card, the app, HA itself and shared links count. Messages are sent about a minute after the first change (several changes are combined). If you pick a
combined list, changes in its source lists count too.
*Send test message* checks the device right away – if nothing arrives, check the companion app and its
notification permission; failed messages are logged in *Settings → System → Logs*.

**Targets** (*Send to → ＋ Add target*) – as many as you like, no companion app required:

- **Notification service** – every `notify.*` service: companion app devices (📱), Telegram (`notify.telegram_…`),
  e-mail, Signal, Pushover, groups … – whatever is set up in Home Assistant.
- **Notification entity** – new-style `notify.*` entities (sent with `notify.send_message`).
- **Custom service** (admins) – any service with JSON data, e.g. `telegram_bot.send_message` with
  `{"target": 123456789}` or a `script.*` that does whatever you want. `{title}` and `{message}` in the data
  are replaced; without them `title` and `message` are added.

A failing target does not stop the others; *Send test message* shows which one failed.

## Barcode scan

The barcode button next to the input opens the scanner. In the Home Assistant companion app (Android/iOS)
its own full-screen scanner is used; in a browser the camera (Chrome) or a field to type the number.
The product name comes from SmartLists' own memory or a lookup service (only the number is sent).

- *For me → Shopping and scanning*: the **target list** (this card's list or any other) and whether a
  scanned product goes into the input field to check or is **added directly**.
- *Global → Voice, backup, defaults*: which **lookup services** in which order – Open Food Facts, Open
  Beauty Facts, Open Pet Food Facts, Open Products Facts, UPCitemdb, or your own (URL with `{code}` and the
  JSON field holding the name). *Look up barcodes online* turns the lookup off altogether.

## Statistics

📊 on the sidebar page (or *General settings → Statistics*): bought most often with rhythm ("every
4 days"), *not bought for a while* (with ＋ to put it back on the list), shares per category and store.
It uses the existing history – nothing new is collected. Admins can remove wrong items (×) from the
history, and single expense bookings can be deleted under *Bookings* (admins all, others their own).

## Meal plan

<img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/mealplan.svg" alt="Meal plan">

The meal plan is an **extra**: switch it on or off under *General settings → Global → Extras* (the setup
assistant leaves it off). Off hides the tab, the menu entry and the calendar; planned dishes are kept.

*⋯ → Meal plan* shows a week (← → for other weeks). Put dishes – i.e. templates – on days. Changes are
kept until you press **Save** (then you are asked whether the ingredients should go on the list) or **Add
ingredients to list** (saves and puts everything of that week on the list; equal items are added up).
Clicking next to the window does not discard changes. The plan is also the calendar
**SmartLists Meal plan** in Home Assistant (for dashboards and automations).

**Mealie:** if the Mealie integration is set up, *Get from Mealie* takes the recipes of the week's Mealie
meal plan: each recipe becomes a template (🍽️) with its ingredients and is entered in the plan.

## Item history

Long press an item → *History*: who added, checked off, reopened, renamed or deleted it, and when – also
changes from the app, Home Assistant, automations ("automation") and shared links. The last 400 changes per
list are kept.

## Shopping dashboard

*General settings → Global → Voice, backup, defaults → Create dashboard* adds a dashboard *Shopping
dashboard* to the sidebar with all lists, the meal plan calendar and statistics. It is a normal dashboard
afterwards – edit or delete it like any other.
