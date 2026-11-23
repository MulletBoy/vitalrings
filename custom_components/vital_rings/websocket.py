"""WebSocket API for the dashboard card: the figures, and the points of a chart."""

from __future__ import annotations

from datetime import timedelta
from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util

from .const import DOMAIN, MAX_SERIES_SPAN, SERIES_METRICS
from .manager import VitalRingsManager

PERIODS = ("hour", "day", "week", "month")


@callback
def async_register_websocket(hass: HomeAssistant) -> None:
    """Register the commands."""
    websocket_api.async_register_command(hass, websocket_summary)
    websocket_api.async_register_command(hass, websocket_series)


def _manager(hass: HomeAssistant, entity_id: str) -> VitalRingsManager | None:
    """Return the manager behind any entity of a VitalRings device."""
    registry_entry = er.async_get(hass).async_get(entity_id)
    entry = (
        hass.config_entries.async_get_entry(registry_entry.config_entry_id)
        if registry_entry and registry_entry.config_entry_id
        else None
    )
    if entry is None or entry.domain != DOMAIN or entry.state is not ConfigEntryState.LOADED:
        return None
    return entry.runtime_data


@websocket_api.websocket_command(
    {
        vol.Required("type"): "vital_rings/summary",
        vol.Required("entity_id"): cv.entity_id,
    }
)
@callback
def websocket_summary(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Return every figure of the person an entity belongs to."""
    manager = _manager(hass, msg["entity_id"])
    if manager is None:
        connection.send_error(msg["id"], websocket_api.ERR_NOT_FOUND, "Not a VitalRings entity")
        return
    connection.send_result(msg["id"], manager.summary())


@websocket_api.websocket_command(
    {
        vol.Required("type"): "vital_rings/series",
        vol.Required("entity_id"): cv.entity_id,
        vol.Required("metric"): vol.In(SERIES_METRICS),
        vol.Required("period"): vol.In(PERIODS),
        vol.Required("start"): cv.datetime,
        vol.Optional("end"): cv.datetime,
    }
)
@websocket_api.async_response
async def websocket_series(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Return the points of one chart: a metric's statistics over a period."""
    manager = _manager(hass, msg["entity_id"])
    if manager is None:
        connection.send_error(msg["id"], websocket_api.ERR_NOT_FOUND, "Not a VitalRings entity")
        return
    try:
        start = dt_util.as_utc(msg["start"])
        end = dt_util.as_utc(msg["end"]) if "end" in msg else dt_util.utcnow() + timedelta(hours=1)
    except OverflowError, ValueError:
        # A date at the very edge of the calendar cannot be moved to UTC.
        connection.send_error(msg["id"], websocket_api.ERR_INVALID_FORMAT, "Not a usable date")
        return
    if not timedelta(0) < end - start <= MAX_SERIES_SPAN[msg["period"]]:
        connection.send_error(
            msg["id"], websocket_api.ERR_INVALID_FORMAT, "The period asked for is too long"
        )
        return
    series = await manager.async_series(msg["metric"], msg["period"], start, end)
    if series is None:
        connection.send_error(msg["id"], websocket_api.ERR_NOT_FOUND, "No history for this metric")
        return
    connection.send_result(msg["id"], series)
