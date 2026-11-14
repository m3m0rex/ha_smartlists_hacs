"""Karte und Integration müssen dieselbe Version haben – sonst meldet die Karte dauerhaft „Die Karte ist veraltet“."""

import json
import re
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent / "custom_components" / "smartlists"


def test_card_version_matches_manifest():
    manifest = json.loads((BASE / "manifest.json").read_text(encoding="utf-8"))["version"]
    card = re.search(r'const CARD_VERSION = "([^"]+)"', (BASE / "www" / "smartlists-card.js").read_text(encoding="utf-8")).group(1)
    assert card == manifest, f"CARD_VERSION {card} ≠ manifest {manifest}"


def test_changelog_has_current_version():
    manifest = json.loads((BASE / "manifest.json").read_text(encoding="utf-8"))["version"]
    changelog = (BASE.parent.parent / "CHANGELOG.md").read_text(encoding="utf-8")
    assert f"## [{manifest}]" in changelog
