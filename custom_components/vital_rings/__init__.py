"""VitalRings: heart, vitals and body figures for Home Assistant, with a dashboard card."""

from __future__ import annotations

from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .const import CONF_SOURCE, DOMAIN
from .frontend import async_register_card
from .manager import VitalRingsConfigEntry, VitalRingsManager
from .sources import SOURCES
from .websocket import async_register_websocket

PLATFORMS = [Platform.SENSOR]
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register the dashboard card and the commands it uses."""
    await async_register_card(hass)
    async_register_websocket(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: VitalRingsConfigEntry) -> bool:
    """Set up one person's figures."""
    if entry.data.get(CONF_SOURCE) not in SOURCES:
        return False
    manager = VitalRingsManager(hass, entry)
    await manager.async_setup()
    entry.runtime_data = manager
    entry.async_on_unload(entry.add_update_listener(_async_reload))
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: VitalRingsConfigEntry) -> bool:
    """Unload a config entry."""
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        await entry.runtime_data.async_unload()
    return unloaded


async def _async_reload(hass: HomeAssistant, entry: VitalRingsConfigEntry) -> None:
    """Reload after the options changed (age and sex choose the VO2 max benchmark)."""
    await hass.config_entries.async_reload(entry.entry_id)
