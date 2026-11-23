"""Serves the bundled dashboard card and loads it in the frontend."""

from __future__ import annotations

import hashlib
from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant
from homeassistant.loader import async_get_integration

from .const import DOMAIN

CARD_FILE = "vital-rings-card.js"
URL_BASE = f"/{DOMAIN}"


def _fingerprint(path: Path) -> str:
    """Return a short hash of the card bundle."""
    return hashlib.sha1(path.read_bytes(), usedforsecurity=False).hexdigest()[:8]


async def async_register_card(hass: HomeAssistant) -> None:
    """Make the card available on every dashboard (storage and YAML mode alike)."""
    path = Path(__file__).parent / "frontend" / CARD_FILE
    await hass.http.async_register_static_paths(
        [StaticPathConfig(f"{URL_BASE}/{CARD_FILE}", str(path), cache_headers=True)]
    )
    integration = await async_get_integration(hass, DOMAIN)
    fingerprint = await hass.async_add_executor_job(_fingerprint, path)
    # Version and content hash in the URL make browsers fetch the new card
    # after an update instead of a cached copy.
    try:
        add_extra_js_url(hass, f"{URL_BASE}/{CARD_FILE}?v={integration.version}-{fingerprint}")
    except KeyError:
        # No frontend on this installation: nothing to load the card into.
        return
