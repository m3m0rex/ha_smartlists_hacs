"""Startbildschirm-App: Manifest startet die gewählte Liste, auf Wunsch im Einkaufsmodus; nichts Fremdes durchreichen."""

from smartlists.pwa import build_manifest


def test_manifest_start_url():
    m = build_manifest("todo.einkauf", True, "Einkauf")
    assert m["start_url"] == "/smartlists?app=1&list=todo.einkauf&shopping=1"
    assert m["id"] == m["start_url"]  # eigenes Symbol je Liste möglich
    assert m["display"] == "standalone" and m["name"] == "Einkauf"
    assert {i["sizes"] for i in m["icons"]} == {"256x256", "512x512"}


def test_manifest_rejects_odd_input():
    m = build_manifest("javascript:alert(1)", False, "")
    assert m["start_url"] == "/smartlists?app=1" and m["name"] == "SmartLists"
    assert build_manifest("todo.x&evil=1")["start_url"] == "/smartlists?app=1"
    assert len(build_manifest("", False, "x" * 200)["name"]) == 40
