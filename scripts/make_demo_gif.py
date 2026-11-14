"""Animiertes Demo für die README: „Milch 2 l 1,19€ @REWE *Anna #bio“ eintippen → Vorschau mit Menge, Kategorie,
Preis, Markt-, Personen- und Schlagwort-Badge → Hinzufügen → der Artikel landet sortiert in der Gruppe „Kühlung“.

Gezeichnet (Mockup im Stil der übrigen Bilder unter docs/images, HA dunkel) – kein Screenshot, kein Browser nötig.
Benötigt: Pillow, ffmpeg (für eine kleine GIF-Datei mit guter Palette), Schrift Lato.

    python scripts/make_demo_gif.py            # → docs/images/demo.gif (englisch) und docs/images/demo-de.gif
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "images"
FONT_DIRS = ["/usr/share/fonts/truetype/lato", "C:/Windows/Fonts", str(Path.home() / ".fonts")]
S = 2  # in doppelter Größe zeichnen, dann verkleinern (glatte Kanten)
W, H = 640, 456
FPS = 12.5
FRAME_MS = int(1000 / FPS)

BG, CARD, FIELD, LINE = "#111318", "#1c1f26", "#2a2e37", "#2a2e37"
TEXT, DIM, ACCENT, GO = "#e3e3e3", "#9aa0a6", "#8ab4f8", "#5b7fc7"
REWE, LIDL = "#c62828", "#1565c0"
PERSON = ("#2e2850", "#b4a6ff")  # *Person: Hintergrund, Schrift (wie in den anderen Bildern)
TAG = ("#1d3324", "#81c784")     # #Schlagwort

TEXTS = {
    "en": {
        "title": "Weekly shop", "open": "open", "typed": "Milk 2 l 1,19€ @REWE *Anna #organic", "name": "Milk",
        "cat_src": "Chilled · learned", "sum": "Total",
        "groups": [("FRUIT & VEG", "#43a047", [("Apples", "1", "kg", ["#organic"], "2,49 €"), ("Bananas", "6", "", ["*Max"], None)]),
                   ("CHILLED", "#29b6f6", []),
                   ("BREAD & BAKERY", "#ffb300", [("Wholegrain bread", "1", "", ["@LIDL"], "1,99 €")])],
        "sugg": [("Milk", "2 l", "history"), ("Milk chocolate", "", "pack"), ("Oat milk", "", "in list")],
        "new": ("Milk", "2", "l", ["@REWE", "*Anna", "#organic"], "2,38 € · 1,19 €/l"), "sum0": "4,48 €", "sum1": "6,86 €",
    },
    "de": {
        "title": "Wocheneinkauf", "open": "offen", "typed": "Milch 2 l 1,19€ @REWE *Anna #bio", "name": "Milch",
        "cat_src": "Kühlung · gemerkt", "sum": "Summe",
        "groups": [("OBST & GEMÜSE", "#43a047", [("Äpfel", "1", "kg", ["#bio"], "2,49 €"), ("Bananen", "6", "", ["*Max"], None)]),
                   ("KÜHLUNG", "#29b6f6", []),
                   ("BROT & BACKWAREN", "#ffb300", [("Vollkornbrot", "1", "", ["@LIDL"], "1,99 €")])],
        "sugg": [("Milch", "2 l", "Verlauf"), ("Milchschokolade", "", "Paket"), ("Hafermilch", "", "auf der Liste")],
        "new": ("Milch", "2", "l", ["@REWE", "*Anna", "#bio"], "2,38 € · 1,19 €/l"), "sum0": "4,48 €", "sum1": "6,86 €",
    },
}


def font(name: str, size: float) -> ImageFont.FreeTypeFont:
    for d in FONT_DIRS:
        p = Path(d) / f"Lato-{name}.ttf"
        if p.exists():
            return ImageFont.truetype(str(p), int(size * S))
    return ImageFont.load_default(size=int(size * S))


F = {k: font(n, s) for k, (n, s) in {
    "title": ("Semibold", 18), "body": ("Regular", 14.5), "small": ("Regular", 12), "tiny": ("Bold", 10.5),
    "cat": ("Bold", 11), "bodyb": ("Bold", 14.5), "input": ("Regular", 15), "badge": ("Black", 10), "go": ("Bold", 20)}.items()}


class Canvas:
    def __init__(self) -> None:
        self.im = Image.new("RGB", (W * S, H * S), BG)
        self.d = ImageDraw.Draw(self.im)

    def rect(self, x, y, w, h, r, fill, outline=None, width=1):
        self.d.rounded_rectangle([x * S, y * S, (x + w) * S, (y + h) * S], radius=r * S, fill=fill,
                                 outline=outline, width=width * S)

    def text(self, x, y, s, f, fill=TEXT, anchor="lm"):
        self.d.text((x * S, y * S), s, font=F[f], fill=fill, anchor=anchor)

    def width(self, s, f) -> float:
        return F[f].getlength(s) / S

    def badge(self, x, y, label, color) -> float:
        w = self.width(label, "badge") + 12
        self.rect(x, y - 8, w, 16, 4, color)
        self.text(x + 6, y, label, "badge", "#ffffff")
        return w

    def tag(self, x, y, token) -> float:
        """@Markt → Markt-Badge, *Person → lila, #Schlagwort → grün (wie die Karte)."""
        kind, value = token[0], token[1:]
        if kind == "@":
            return self.badge(x, y, value.upper(), REWE if value.upper() == "REWE" else LIDL)
        bg, fg = PERSON if kind == "*" else TAG
        w = self.width(value, "tiny") + 14
        self.rect(x, y - 9, w, 18, 9, bg)
        self.text(x + 7, y, value, "tiny", fg)
        return w

    def pill(self, x, y, label, f="small", fill=FIELD, color=TEXT) -> float:
        w = self.width(label, f) + 16
        self.rect(x, y - 10, w, 20, 10, fill)
        self.text(x + 8, y, label, f, color)
        return w

    def checkbox(self, x, y, on=False):
        self.rect(x, y - 8, 16, 16, 4, ACCENT if on else None, outline=ACCENT if on else "#8a8f99", width=2)


def mix(c1: str, c2: str, t: float) -> str:
    a = [int(c1[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(c2[i:i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(x + (y - x) * t):02x}" for x, y in zip(a, b))


def parse_preview(typed: str, tx: dict) -> list[tuple]:
    """Was die Vorschau unter dem Eingabefeld beim Tippen zeigt (wie die Karte)."""
    out = []
    if len(typed) >= 1:
        out.append(("name", typed.split(" ")[0]))
    if len(typed) >= len(tx["name"]):
        out.append(("cat", tx["cat_src"]))
    if "2 l" in typed:
        out.append(("pill", "2 l"))
    if "€" in typed:
        out.append(("pill", "1,19 €"))
    # Tags erst, wenn das Wort fertig getippt ist (wie die Karte: Leerzeichen oder Ende)
    for word in typed.split(" "):
        if len(word) > 1 and word[0] in "@*#" and (typed.endswith(" ") or not typed.endswith(word) or word in tx["typed"].split(" ")):
            if word in tx["typed"].split(" "):
                out.append(("tag", word))
    return out


def draw(tx: dict, typed: str, cursor: bool, *, added: float = 0.0, glow: float = 0.0, press: bool = False,
         sugg: bool = False) -> Image.Image:
    c = Canvas()
    x0, y0, cw = 20, 16, W - 40
    c.rect(x0, y0, cw, H - 32, 14, CARD)
    # Kopf
    n_open = 3 + (1 if added >= 1 else 0)
    c.text(x0 + 18, y0 + 26, tx["title"], "title")
    c.text(x0 + cw - 18, y0 + 26, f"{n_open} {tx['open']}", "small", DIM, "rm")
    # Eingabe
    iy = y0 + 50
    c.rect(x0 + 16, iy, cw - 32 - 46, 38, 9, FIELD)
    c.text(x0 + 28, iy + 19, typed, "input")
    if cursor:
        cx = x0 + 28 + c.width(typed, "input") + 2
        c.rect(cx, iy + 9, 2, 20, 1, ACCENT)
    c.rect(x0 + cw - 16 - 38, iy, 38, 38, 9, mix(GO, "#ffffff", 0.25) if press else GO)
    c.text(x0 + cw - 16 - 19, iy + 18, "+", "go", "#ffffff", "mm")
    # Vorschau
    py = iy + 54
    px = x0 + 20
    for kind, val in parse_preview(typed, tx):
        if kind == "name":
            c.text(px, py, val, "body"); px += c.width(val, "body") + 10
        elif kind == "cat":
            px += c.pill(px, py, "● " + val, fill="#16324a", color="#81d4fa") + 6
        elif kind == "pill":
            px += c.pill(px, py, val) + 6
        else:
            px += c.tag(px, py, val) + 6
    # Liste
    ly = py + 24
    for g, (label, color, rows) in enumerate(tx["groups"]):
        rows = list(rows)
        new_row = g == 1
        if new_row and added <= 0:
            continue
        hfac = min(1.0, added) if new_row else 1.0
        gy = ly
        c.rect(x0 + 18, gy + 9, 8, 8, 4, color)
        c.text(x0 + 32, gy + 13, label, "cat", mix(CARD, DIM, hfac))
        ly += 26 * hfac
        if new_row:
            rows = [tx["new"]]
        for name, qty, unit, tags, price in rows:
            rh = (40 if price else 32) * (hfac if new_row else 1)
            if new_row and glow > 0:
                c.rect(x0 + 10, ly - 2, cw - 20, rh + 2, 8, mix(CARD, "#26406b", glow))
            if not new_row or hfac > 0.6:
                cy = ly + (13 if price else 15)
                c.checkbox(x0 + 20, cy)
                c.text(x0 + 46, cy, name, "body")
                bx = x0 + 46 + c.width(name, "body") + 8
                for token in tags or []:
                    bx += c.tag(bx, cy, token) + 5
                if price:
                    c.text(x0 + 46, cy + 17, price, "small", DIM)
                c.text(x0 + cw - 56, cy, qty, "body", TEXT, "rm")
                c.text(x0 + cw - 50, cy, unit, "small", DIM)
            ly += rh
            c.d.line([(x0 + 16) * S, ly * S, (x0 + cw - 16) * S, ly * S], fill=LINE, width=S)
        ly += 6
    # Summe
    sy = H - 16 - 26
    c.d.line([(x0 + 16) * S, (sy - 16) * S, (x0 + cw - 16) * S, (sy - 16) * S], fill=LINE, width=S)
    c.text(x0 + 18, sy, tx["sum"], "small", DIM)
    c.text(x0 + cw - 18, sy, tx["sum1"] if added >= 1 else tx["sum0"], "body", TEXT, "rm")
    # Vorschläge (über der Liste)
    if sugg:
        sx, sy2, sw = x0 + 16, iy + 42, 300
        c.rect(sx, sy2, sw, 3 * 32 + 6, 9, "#232731", outline="#353a45")
        q = typed
        for i, (name, extra, src) in enumerate(tx["sugg"]):
            ry = sy2 + 3 + i * 32
            if i == 0:
                c.rect(sx + 3, ry, sw - 6, 30, 7, "#2f3542")
            # Treffer fett: der getippte Anfang
            k = name.lower().find(q.lower()) if q else -1
            rx = sx + 14
            if k >= 0:
                for part, f in ((name[:k], "body"), (name[k:k + len(q)], "bodyb"), (name[k + len(q):], "body")):
                    if part:
                        c.text(rx, ry + 15, part, f, TEXT if f == "body" else "#ffffff")
                        rx += c.width(part, f)
            else:
                c.text(rx, ry + 15, name, "body"); rx += c.width(name, "body")
            if extra:
                c.text(rx + 8, ry + 15, extra, "small", DIM)
            c.text(sx + sw - 12, ry + 15, src, "small", DIM, "rm")
    return c.im.resize((W, H), Image.LANCZOS)


def frames(tx: dict) -> list[tuple[Image.Image, int]]:
    out: list[tuple[Image.Image, int]] = []
    add = lambda im, ms=FRAME_MS: out.append((im, ms))  # noqa: E731
    # Ruhe, Cursor blinkt
    for i in range(4):
        add(draw(tx, "", i % 2 == 0), 300)
    typed = tx["typed"]
    for i in range(1, len(typed) + 1):
        t = typed[:i]
        ms = 260 if typed[i - 1] == " " else 110
        add(draw(tx, t, True, sugg=1 <= len(t) <= len(tx["name"])), ms)
    for i in range(3):
        add(draw(tx, typed, i % 2 == 0), 300)
    add(draw(tx, typed, False, press=True), 160)
    # hinzugefügt: Zeile wächst, leuchtet kurz
    steps = 6
    for i in range(1, steps + 1):
        add(draw(tx, "", True, added=i / steps, glow=1.0), FRAME_MS)
    for i in range(10):
        add(draw(tx, "", i % 6 < 3, added=1.0, glow=1 - i / 10), 120)
    for i in range(6):
        add(draw(tx, "", i % 2 == 0, added=1.0), 450)
    return out


def write_gif(frames_: list[tuple[Image.Image, int]], path: Path) -> None:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:  # einfacher Weg ohne ffmpeg (größere Datei)
        ims = [f.convert("P", palette=Image.ADAPTIVE, colors=128) for f, _ in frames_]
        ims[0].save(path, save_all=True, append_images=ims[1:], duration=[ms for _, ms in frames_], loop=0, optimize=True)
        return
    with tempfile.TemporaryDirectory() as tmp:
        lines = []
        for i, (im, ms) in enumerate(frames_):
            p = os.path.join(tmp, f"f{i:04d}.png")
            im.save(p)
            lines += [f"file '{p}'", f"duration {ms / 1000:.3f}"]
        lines.append(f"file '{os.path.join(tmp, f'f{len(frames_) - 1:04d}.png')}'")
        listing = os.path.join(tmp, "list.txt")
        Path(listing).write_text("\n".join(lines))
        vf = "split[a][b];[a]palettegen=max_colors=96:stats_mode=full[p];[b][p]paletteuse=dither=none"
        subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", listing,
                        "-vf", vf, "-loop", "0", str(path)], check=True)


def main() -> None:
    langs = sys.argv[1:] or ["en", "de"]
    for lang in langs:
        path = OUT / ("demo.gif" if lang == "en" else f"demo-{lang}.gif")
        write_gif(frames(TEXTS[lang]), path)
        print(f"{path.relative_to(ROOT)}: {path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
