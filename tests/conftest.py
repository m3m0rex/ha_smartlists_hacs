"""Tests ohne Home-Assistant-Installation: die wenigen HA-Module, die die getesteten Dateien importieren,
werden durch kleine Platzhalter ersetzt. Getestet werden die reinen Logik-Teile (Text, Rechte, Rhythmus)."""

import sys
import types
from pathlib import Path


def _mod(name, **attrs):
    module = sys.modules.get(name) or types.ModuleType(name)
    module.__dict__.update(attrs)
    module.__path__ = []
    sys.modules[name] = module
    return module


class _Store:
    def __init__(self, *args):
        self.saved = None

    async def async_load(self):
        return None

    def async_delay_save(self, func, delay):
        self.saved = func()


if "homeassistant" not in sys.modules:
    _mod("homeassistant")
    _mod("homeassistant.core", HomeAssistant=object, callback=lambda f: f, Context=object, Event=object)
    _mod("homeassistant.helpers")
    _mod("homeassistant.helpers.storage", Store=_Store)
    _mod("homeassistant.helpers.dispatcher", async_dispatcher_send=lambda *a: None)
    _mod("homeassistant.const", ATTR_FRIENDLY_NAME="friendly_name", EVENT_CALL_SERVICE="call_service",
         EVENT_HOMEASSISTANT_STOP="homeassistant_stop")
    _mod("homeassistant.components")
    _mod("homeassistant.components.http", HomeAssistantView=object)
    _mod("homeassistant.helpers.aiohttp_client", async_get_clientsession=lambda hass: None)
    _mod("homeassistant.helpers.event", async_call_later=lambda *a: (lambda: None), async_track_time_interval=lambda *a: (lambda: None))
    _mod("homeassistant.helpers.issue_registry")
if "aiohttp" not in sys.modules:
    _mod("aiohttp", web=types.SimpleNamespace(Request=object, Response=object, json_response=None))

# Paket „smartlists“ direkt aus custom_components laden, ohne dessen __init__ (braucht echtes HA)
_pkg = _mod("smartlists")
_pkg.__path__ = [str(Path(__file__).resolve().parent.parent / "custom_components" / "smartlists")]
