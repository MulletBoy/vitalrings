"""Health data sources.

A source says where another integration keeps its health data: which entities
carry the latest values, which long-term statistics hold the history, and how
to read its sleep and workout entities. To support another source: write a
class with the ``VitalsSource`` shape and add it to ``SOURCES``. Nothing else
in the integration knows where the data comes from.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Protocol

from homeassistant.core import HomeAssistant, State

from ..const import SOURCE_LIFE_DASHBOARD


@dataclass(frozen=True, slots=True)
class SleepWindow:
    """The newest night: when it started and ended, dated by the wake-up day."""

    night: date
    start: datetime
    end: datetime


@dataclass(frozen=True, slots=True)
class Workout:
    """The newest workout and its heart rate."""

    kind: str
    average: float | None
    maximum: float | None
    minimum: float | None
    start: datetime | None
    end: datetime | None
    duration_minutes: float | None


class VitalsSource(Protocol):
    """What the integration needs from a source."""

    key: str
    domain: str

    def entities(self, hass: HomeAssistant, source_entry_id: str) -> dict[str, str]:
        """Return the entity id for each metric the source provides."""

    def statistic_id(self, source_entry_id: str, metric: str) -> str | None:
        """Return the id of a metric's long-term statistic, if it has one."""

    def measured_at(self, state: State) -> datetime | None:
        """Return when an entity's value was measured (not when it arrived)."""

    def sleep_window(self, state: State) -> SleepWindow | None:
        """Return the newest night carried by the sleep entity."""

    def workout(self, state: State) -> Workout | None:
        """Return the newest workout carried by the workout entity."""

    async def async_previous_wake(
        self, hass: HomeAssistant, source_entry_id: str, night: date
    ) -> datetime | None:
        """Return when the person woke up on the day before ``night``, if known."""


def _sources() -> dict[str, VitalsSource]:
    # Imported here: the source modules import the classes above.
    from .life_dashboard import LifeDashboardSource  # noqa: PLC0415

    return {SOURCE_LIFE_DASHBOARD: LifeDashboardSource()}


SOURCES: dict[str, VitalsSource] = _sources()


def source_for_domain(domain: str) -> VitalsSource | None:
    """Return the source that reads an integration's data."""
    for source in SOURCES.values():
        if source.domain == domain:
            return source
    return None
