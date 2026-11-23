"""Diagnostics for VitalRings.

Diagnostics files get attached to public bug reports, so this deliberately
leaves out anything personal: no heart rate, weight or other health value, no
times, and no entity ids (which usually contain a name). It says only which
figures exist.
"""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant

from .const import CONF_SOURCE
from .manager import VitalRingsConfigEntry


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: VitalRingsConfigEntry
) -> dict[str, Any]:
    """Return diagnostics for a config entry."""
    manager = entry.runtime_data
    return {
        "source": entry.data.get(CONF_SOURCE),
        # Whether they are set, never what they are.
        "options_set": sorted(entry.options),
        "source_entities_found": sorted(manager.entities),
        "has_recorder": "recorder" in hass.config.components,
        "refreshed": manager.updated is not None,
        "metrics": {
            metric: sorted(name for name, value in values.items() if value is not None)
            for metric, values in sorted(manager.metrics.items())
        },
    }
