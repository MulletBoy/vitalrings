"""Life Dashboard (https://github.com/owen282000/life-dashboard-ha).

Life Dashboard gives every value its own sensor (unique id
``<entry id>_<key>``) and writes the history to long-term statistics named
``life_dashboard:<entry id>_<key>``, stamped with when a value was measured.
Earlier nights come from its action ``life_dashboard.get_sleep_nights``
(Life Dashboard 1.4.0 and newer).
"""

from __future__ import annotations

import logging
from collections.abc import Mapping
from datetime import date, datetime, timedelta
from typing import Any

import voluptuous as vol
from homeassistant.core import HomeAssistant, State
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util

from ..const import (
    HEART_RATE,
    HEART_RATE_VARIABILITY,
    HEIGHT,
    LAST_SLEEP,
    LAST_SYNC,
    LAST_WORKOUT,
    LIMITS,
    MAX_NIGHT_AGE,
    MAX_SLEEP_HOURS,
    OXYGEN_SATURATION,
    RESPIRATORY_RATE,
    RESTING_HEART_RATE,
    SERIES_METRICS,
    SOURCE_LIFE_DASHBOARD,
    VO2_MAX,
    WEIGHT,
)
from ..vitals import number
from . import SleepWindow, Workout

_LOGGER = logging.getLogger(__name__)

LIFE_DASHBOARD_DOMAIN = "life_dashboard"
ACTION_GET_SLEEP_NIGHTS = "get_sleep_nights"
MAX_ACTION_SESSIONS = 200

# The end of each sensor's unique id, and the metric it carries.
UNIQUE_ID_KEYS = {
    "heart_rate": HEART_RATE,
    "resting_heart_rate": RESTING_HEART_RATE,
    "heart_rate_variability": HEART_RATE_VARIABILITY,
    "oxygen_saturation": OXYGEN_SATURATION,
    "respiratory_rate": RESPIRATORY_RATE,
    "vo2_max": VO2_MAX,
    "weight": WEIGHT,
    "height": HEIGHT,
    "last_sleep_asleep": LAST_SLEEP,
    "last_workout": LAST_WORKOUT,
    "last_health_sync": LAST_SYNC,
}


def _parse_datetime(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        parsed: datetime | None = value
    elif isinstance(value, str):
        try:
            parsed = dt_util.parse_datetime(value)
        except ValueError:
            # Well-formed but impossible, such as 30 February.
            return None
    else:
        return None
    if parsed is None:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=dt_util.DEFAULT_TIME_ZONE)


def _parse_date(value: Any) -> date | None:
    try:
        return date.fromisoformat(str(value))
    except ValueError:
        return None


class LifeDashboardSource:
    """Adapter for the Life Dashboard integration."""

    key = SOURCE_LIFE_DASHBOARD
    domain = LIFE_DASHBOARD_DOMAIN

    def entities(self, hass: HomeAssistant, source_entry_id: str) -> dict[str, str]:
        """Find the entry's sensors by the end of their unique ids."""
        prefix = f"{source_entry_id.lower()}_"
        found: dict[str, str] = {}
        registry = er.async_get(hass)
        for entry in er.async_entries_for_config_entry(registry, source_entry_id):
            unique_id = str(entry.unique_id).lower()
            if entry.disabled_by is not None or not unique_id.startswith(prefix):
                continue
            metric = UNIQUE_ID_KEYS.get(unique_id[len(prefix) :])
            if metric is not None:
                found[metric] = entry.entity_id
        return found

    def statistic_id(self, source_entry_id: str, metric: str) -> str | None:
        """Life Dashboard names a statistic after its entry and the metric."""
        if metric not in SERIES_METRICS:
            return None
        return f"{LIFE_DASHBOARD_DOMAIN}:{source_entry_id.lower()}_{metric}"

    def measured_at(self, state: State) -> datetime | None:
        """Every Life Dashboard value says when it was measured."""
        return _parse_datetime(state.attributes.get("measured_at"))

    def sleep_window(self, state: State) -> SleepWindow | None:
        """Read the night from the sleep sensor's attributes."""
        return self._sleep_window(state.attributes)

    @staticmethod
    def _sleep_window(attributes: Mapping[str, Any]) -> SleepWindow | None:
        night = _parse_date(attributes.get("night"))
        start = _parse_datetime(attributes.get("start"))
        end = _parse_datetime(attributes.get("end"))
        if night is None or start is None or end is None:
            return None
        if not timedelta(0) < end - start <= timedelta(hours=MAX_SLEEP_HOURS):
            return None
        # A night far from today is a broken clock or a broken record.
        now = dt_util.utcnow()
        if not now - MAX_NIGHT_AGE <= end <= now + timedelta(days=2):
            return None
        if abs(night - end.date()) > timedelta(days=2):
            return None
        return SleepWindow(night=night, start=start, end=end)

    def workout(self, state: State) -> Workout | None:
        """Read the workout sensor: its state is the kind of workout."""
        if state.state in ("unknown", "unavailable", ""):
            return None
        attributes = state.attributes
        limits = LIMITS[HEART_RATE]
        return Workout(
            kind=state.state[:60],
            average=number(attributes.get("heart_rate_avg"), limits),
            maximum=number(attributes.get("heart_rate_max"), limits),
            minimum=number(attributes.get("heart_rate_min"), limits),
            start=_parse_datetime(attributes.get("start")),
            end=_parse_datetime(attributes.get("end")),
            duration_minutes=number(attributes.get("duration_minutes"), (0, 24 * 60)),
        )

    async def async_previous_wake(
        self, hass: HomeAssistant, source_entry_id: str, night: date
    ) -> datetime | None:
        """Ask Life Dashboard for the nights just before ``night``.

        Each day's longest sleep is its night (a nap is shorter); the newest of
        those nights ended with the wake-up that started the day in question.
        """
        if not hass.services.has_service(LIFE_DASHBOARD_DOMAIN, ACTION_GET_SLEEP_NIGHTS):
            return None
        try:
            response = await hass.services.async_call(
                LIFE_DASHBOARD_DOMAIN,
                ACTION_GET_SLEEP_NIGHTS,
                {
                    "config_entry": source_entry_id,
                    "start": (night - timedelta(days=2)).isoformat(),
                    "end": (night - timedelta(days=1)).isoformat(),
                },
                blocking=True,
                return_response=True,
            )
        except HomeAssistantError, vol.Invalid:
            _LOGGER.debug("Life Dashboard did not return earlier nights", exc_info=True)
            return None
        raw = response.get("nights") if isinstance(response, Mapping) else None
        if not isinstance(raw, list):
            return None

        longest: dict[date, tuple[float, datetime]] = {}
        for item in raw[-MAX_ACTION_SESSIONS:]:
            if not isinstance(item, Mapping):
                continue
            window = self._sleep_window(item)
            if window is None or window.night >= night:
                continue
            asleep = number(item.get("asleep_minutes"), (0, MAX_SLEEP_HOURS * 60)) or 0.0
            if window.night not in longest or asleep > longest[window.night][0]:
                longest[window.night] = (asleep, window.end)
        if not longest:
            return None
        return longest[max(longest)][1]
