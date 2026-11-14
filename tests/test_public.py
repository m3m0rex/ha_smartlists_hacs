"""Teilen ohne die HA-Adresse: eigene Proxy-Adresse prüfen, cloudflared finden (nie herunterladen), Basis-Adresse."""

import asyncio
import os
import stat
import tempfile
import types

import pytest

from smartlists.public import _TUNNEL_URL, PublicShare, find_cloudflared, normalize_url


def test_normalize_url():
    assert normalize_url(" https://liste.example.org/ ") == "https://liste.example.org"
    assert normalize_url("https://example.org/smartlists") == "https://example.org/smartlists"
    assert normalize_url("") == ""
    for bad in ("ftp://x.org", "liste.example.org", "https://user:pw@x.org", "https://x.org/?a=1", "javascript:alert(1)"):
        with pytest.raises(ValueError):
            normalize_url(bad)


def test_tunnel_url_pattern():
    line = "2026-11-14T10:00:00Z INF |  https://quiet-river-1234.trycloudflare.com                |"
    assert _TUNNEL_URL.search(line).group(0) == "https://quiet-river-1234.trycloudflare.com"
    assert _TUNNEL_URL.search("https://evil.example.com/?x=.trycloudflare.com") is None


def test_find_cloudflared_in_config_dir():
    with tempfile.TemporaryDirectory() as cfg:
        old_path = os.environ.get("PATH", "")
        os.environ["PATH"] = ""  # ein installiertes cloudflared des Testrechners nicht mitzählen
        try:
            assert find_cloudflared(cfg) == (None, None)
            os.makedirs(os.path.join(cfg, "bin"))
            path = os.path.join(cfg, "bin", "cloudflared")
            with open(path, "w") as f:
                f.write("#!/bin/sh\n")
            os.chmod(path, stat.S_IRUSR | stat.S_IWUSR)  # ohne Ausführrecht → wird einmal ergänzt
            found, problem = find_cloudflared(cfg)
            assert found == path and problem is None
            assert os.access(path, os.X_OK)
        finally:
            os.environ["PATH"] = old_path


def _public(mode, **kw):
    hass = types.SimpleNamespace(data={}, config=types.SimpleNamespace(config_dir="/config"))
    p = PublicShare(hass)
    p.mode = mode
    for k, v in kw.items():
        setattr(p, k, v)
    return p


def test_base_url_never_falls_back_to_ha_address():
    assert _public("ha").base_url() is None
    # Tunnel gewählt, aber (noch) nicht bereit → Fehler statt stillem Rückfall auf die HA-Adresse
    with pytest.raises(ValueError):
        _public("tunnel").base_url()
    with pytest.raises(ValueError):
        _public("tunnel", _runner=object()).base_url()
    assert _public("tunnel", _runner=object(), tunnel_url="https://a-b.trycloudflare.com").base_url() == "https://a-b.trycloudflare.com"
    with pytest.raises(ValueError):
        _public("proxy", url="https://liste.example.org").base_url()  # Server läuft nicht (Port belegt)
    assert _public("proxy", _runner=object(), url="https://liste.example.org").base_url() == "https://liste.example.org"


def test_update_validates_without_starting():
    p = _public("ha")

    async def apply():
        p.applied = True

    p.async_apply = apply
    with pytest.raises(ValueError):
        asyncio.run(p.async_update(mode="proxy"))  # ohne Adresse
    with pytest.raises(ValueError):
        asyncio.run(p.async_update(mode="tunnel", port=80))
    assert p.mode == "ha"
    status = asyncio.run(p.async_update(mode="proxy", url="https://liste.example.org/", port=8200))
    assert (p.mode, p.url, p.port, p.applied) == ("proxy", "https://liste.example.org", 8200, True)
    assert status["mode"] == "proxy" and status["download"].startswith("https://github.com/cloudflare/cloudflared")
    assert p._store.saved == {"mode": "proxy", "port": 8200, "url": "https://liste.example.org"}


def _elf(path, arch):
    """Kleine Datei mit ELF-Kopf für die Architektur (reicht für binary_kind)."""
    machine = {"amd64": 0x3E, "arm64": 0xB7, "arm": 0x28, "386": 0x03}[arch]
    with open(path, "wb") as f:
        f.write(b"\x7fELF\x02\x01\x01" + bytes(11) + machine.to_bytes(2, "little") + bytes(44))


def test_binary_kind_explains_exec_format_error():
    from smartlists.public import _arch, binary_kind, find_cloudflared

    other = "arm64" if _arch() != "arm64" else "amd64"
    old_path = os.environ.get("PATH", "")
    os.environ["PATH"] = ""
    try:
        with tempfile.TemporaryDirectory() as cfg:
            os.makedirs(os.path.join(cfg, "bin"))
            path = os.path.join(cfg, "bin", "cloudflared")
            _elf(path, other)  # umbenannte Datei für den falschen Prozessor
            assert binary_kind(path) == other
            assert find_cloudflared(cfg) == (None, f"{other}|{path}")
            for content, kind in ((b"MZ\x90\x00", "windows"), (b"\x1f\x8b\x08\x00", "archive"),
                                  (b"<!DOCTYPE html><html>", "html")):
                with open(path, "wb") as f:
                    f.write(content)
                assert binary_kind(path) == kind
                assert find_cloudflared(cfg)[1] == f"{kind}|{path}"
            _elf(path, _arch())
            assert find_cloudflared(cfg)[0] == path
    finally:
        os.environ["PATH"] = old_path


def test_find_cloudflared_original_name_and_nested_folder():
    """Originalname (cloudflared-linux-<arch>) und Ordner „cloudflared“ mit der Datei tief darin werden gefunden."""
    from smartlists.public import _arch

    old_path = os.environ.get("PATH", "")
    os.environ["PATH"] = ""
    try:
        with tempfile.TemporaryDirectory() as cfg:
            path = os.path.join(cfg, f"cloudflared-linux-{_arch()}")
            _elf(path, _arch())
            assert find_cloudflared(cfg)[0] == path
        with tempfile.TemporaryDirectory() as cfg:
            nested = os.path.join(cfg, "cloudflared", "config", "bin")
            os.makedirs(nested)
            path = os.path.join(nested, "cloudflared")
            open(path, "w").close()
            assert find_cloudflared(cfg)[0] == path
        with tempfile.TemporaryDirectory() as cfg:
            other = "arm64" if _arch() != "arm64" else "amd64"
            path = os.path.join(cfg, f"cloudflared-linux-{other}")
            _elf(path, other)
            assert find_cloudflared(cfg) == (None, f"{other}|{path}")  # falsche Architektur: Problem statt „fehlt“
    finally:
        os.environ["PATH"] = old_path
