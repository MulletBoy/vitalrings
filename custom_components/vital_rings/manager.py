"""Works out the heart, vitals and body figures and keeps them current.

Nothing is stored: every figure is read from the source's entities and its
long-term statistics, so it can be worked out again at any time.
"""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Callable
from datetime import date, datetime, timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import ATTR_UNIT_OF_MEASUREMENT, UnitOfLength, UnitOfMass
from homeassistant.core import CALLBACK_TYPE, Event, HomeAssistant, State, callback
from homeassistant.helpers.debounce import Debouncer
from homeassistant.helpers.event import async_track_state_change_event, async_track_time_interval
from homeassistant.helpers.start import async_at_started
from homeassistant.util import dt as dt_util
from homeassistant.util.unit_conversion import DistanceConverter, MassConverter

from .const import (
    AWAKE_HEART_RATE,
    AWAKE_HEART_RATE_PREVIOUS,
    BASELINE_DAYS,
    BMI,
    CONF_BIRTH_YEAR,
    CONF_SEX,
    CONF_SOURCE,
    CONF_SOURCE_ENTRY,
    HEART_RATE,
    HEART_RATE_VARIABILITY,
    HEIGHT,
    LAST_SLEEP,
    LAST_SYNC,
    LAST_WORKOUT,
    LIMITS,
    MAX_SERIES_POINTS,
    MIN_AWAKE_HOURS,
    MIN_PREVIOUS_DAY_HOURS,
    MIN_SLEEPING_HOURS,
    OXYGEN_SATURATION,
    PREVIOUS_DAY_DEFAULT_HOURS,
    PREVIOUS_DAY_MAX_HOURS,
    REFRESH_COOLDOWN,
    REFRESH_INTERVAL,
    RESPIRATORY_RATE,
    RESTING_HEART_RATE,
    RING_SETS,
    SERIES_METRICS,
    SLEEPING_HEART_RATE,
    VO2_MAX,
    WEIGHT,
    WORKOUT_HEART_RATE,
)
from .scores import average, score
from .sources import SOURCES, SleepWindow, VitalsSource
from .vitals import Sample, baseline, bmi, bmi_class, number, samples, window_average

_LOGGER = logging.getLogger(__name__)

type VitalRingsConfigEntry = ConfigEntry[VitalRingsManager]

# Metrics shown as "latest value, compared with what is usual".
LATEST_METRICS = (
    HEART_RATE,
    RESTING_HEART_RATE,
    HEART_RATE_VARIABILITY,
    OXYGEN_SATURATION,
    RESPIRATORY_RATE,
    VO2_MAX,
    WEIGHT,
    HEIGHT,
)
# Statistics are always read in these units.
STATISTIC_UNITS = {"mass": UnitOfMass.KILOGRAMS}
# How far back the hourly heart rate is read: last night and the day before it.
HEART_RATE_LOOKBACK = timedelta(hours=50)


def _iso(value: datetime | None) -> str | None:
    return None if value is None else value.isoformat()


def _round(value: float | None, digits: int = 1) -> float | None:
    return None if value is None else round(value, digits)


class VitalRingsManager:
    """Holds one person's figures and tells the sensors when they change."""

    def __init__(self, hass: HomeAssistant, entry: VitalRingsConfigEntry) -> None:
        """Initialise the manager."""
        self.hass = hass
        self.entry = entry
        self.source: VitalsSource = SOURCES[entry.data[CONF_SOURCE]]
        self.source_entry_id: str = entry.data[CONF_SOURCE_ENTRY]
        self.entities: dict[str, str] = {}
        self.metrics: dict[str, dict[str, Any]] = {}
        self.updated: datetime | None = None
        self.synced: datetime | None = None
        self._listeners: list[Callable[[], None]] = []
        self._unsubscribe: list[CALLBACK_TYPE] = []
        self._previous_wake: tuple[date, datetime | None] | None = None
        # One statistics read at a time, however many charts ask at once.
        self._statistics_lock = asyncio.Lock()
        self._debouncer = Debouncer(
            hass,
            _LOGGER,
            cooldown=REFRESH_COOLDOWN,
            immediate=False,
            function=self.async_refresh,
        )

    async def async_setup(self) -> None:
        """Find the source's entities and start following them."""
        self.entities = self.source.entities(self.hass, self.source_entry_id)
        if self.entities:
            self._unsubscribe.append(
                async_track_state_change_event(
                    self.hass, list(self.entities.values()), self._handle_source_change
                )
            )
        self._unsubscribe.append(
            async_track_time_interval(self.hass, self._handle_timer, REFRESH_INTERVAL)
        )
        # The recorder answers once Home Assistant has started.
        self._unsubscribe.append(async_at_started(self.hass, self._handle_started))

    async def async_unload(self) -> None:
        """Stop following the source."""
        self._debouncer.async_shutdown()
        while self._unsubscribe:
            self._unsubscribe.pop()()

    @callback
    def async_add_listener(self, listener: Callable[[], None]) -> CALLBACK_TYPE:
        """Call ``listener`` whenever the figures change."""
        self._listeners.append(listener)

        @callback
        def remove() -> None:
            self._listeners.remove(listener)

        return remove

    @callback
    def _handle_source_change(self, event: Event) -> None:
        self._debouncer.async_schedule_call()

    async def _handle_timer(self, now: datetime) -> None:
        await self.async_refresh()

    async def _handle_started(self, hass: HomeAssistant) -> None:
        await self.async_refresh()

    def value(self, metric: str, field: str = "value") -> Any:
        """Return one field of one metric, or None."""
        return self.metrics.get(metric, {}).get(field)

    def summary(self) -> dict[str, Any]:
        """Everything the card shows apart from the charts."""
        return {
            "updated": _iso(self.updated),
            "synced": _iso(self.synced),
            "metrics": self.metrics,
        }

    async def async_refresh(self) -> None:
        """Work every figure out again and tell the listeners if any changed."""
        try:
            metrics = await self._async_metrics()
        except Exception:  # noqa: BLE001 - a broken source must not break the rest
            _LOGGER.exception("Could not work out the figures")
            return
        self.updated = dt_util.utcnow()
        if metrics == self.metrics:
            return
        self.metrics = metrics
        for listener in list(self._listeners):
            listener()

    def _state(self, metric: str) -> State | None:
        entity_id = self.entities.get(metric)
        state = self.hass.states.get(entity_id) if entity_id else None
        if state is None or state.state in ("unknown", "unavailable"):
            return None
        return state

    def _latest(self, metric: str) -> float | None:
        """The source entity's value, in kilograms or metres where that applies."""
        state = self._state(metric)
        if state is None:
            return None
        value = number(state.state)
        unit = state.attributes.get(ATTR_UNIT_OF_MEASUREMENT)
        try:
            if value is not None and metric == WEIGHT and unit in MassConverter.VALID_UNITS:
                value = MassConverter.convert(value, unit, UnitOfMass.KILOGRAMS)
            if value is not None and metric == HEIGHT and unit in DistanceConverter.VALID_UNITS:
                value = DistanceConverter.convert(value, unit, UnitOfLength.METERS)
        except ValueError:
            return None
        return number(value, LIMITS[metric])

    async def _async_metrics(self) -> dict[str, dict[str, Any]]:
        now = dt_util.utcnow()
        metrics: dict[str, dict[str, Any]] = {}

        sync = self._state(LAST_SYNC)
        synced = None
        if sync is not None:
            try:
                synced = dt_util.parse_datetime(sync.state)
            except ValueError:
                synced = None

        # Latest values, with when they were measured.
        for metric in LATEST_METRICS:
            value = self._latest(metric)
            if value is None:
                continue
            state = self._state(metric)
            measured = self.source.measured_at(state) if state else None
            metrics[metric] = {"value": _round(value, 2)}
            if measured is not None:
                metrics[metric]["measured_at"] = _iso(measured)

        # What is usual: daily values over the last weeks.
        for metric, days in await self._async_daily(now):
            usual = baseline(days, now.timestamp())
            if usual is None:
                continue
            metrics.setdefault(metric, {}).update(
                {
                    "average": _round(usual.average, 2),
                    "average_7d": _round(usual.average_7d, 2),
                    "low": _round(usual.low, 2),
                    "high": _round(usual.high, 2),
                    "first": _round(usual.first, 2),
                    "days": usual.days,
                    "window_days": BASELINE_DAYS[metric],
                }
            )

        # Heart rate asleep, awake today and awake on the day before.
        sleep_state = self._state(LAST_SLEEP)
        sleep = self.source.sleep_window(sleep_state) if sleep_state else None
        hours = await self._async_heart_rate_hours(now, sleep)
        metrics.update(await self._async_heart_windows(hours, sleep, now))

        workout_state = self._state(LAST_WORKOUT)
        workout = self.source.workout(workout_state) if workout_state else None
        if workout is not None:
            metrics[WORKOUT_HEART_RATE] = {
                "value": _round(workout.average),
                "max": _round(workout.maximum),
                "min": _round(workout.minimum),
                "workout": workout.kind,
                "start": _iso(workout.start),
                "end": _iso(workout.end),
                "duration_minutes": _round(workout.duration_minutes, 0),
            }

        index = bmi(metrics.get(WEIGHT, {}).get("value"), metrics.get(HEIGHT, {}).get("value"))
        if index is not None:
            metrics[BMI] = {"value": round(index, 1), "category": bmi_class(index)}
        self._add_scores(metrics, now)
        # Only now: a failed refresh must not look freshly synced.
        self.synced = synced
        return metrics

    def _add_scores(self, metrics: dict[str, dict[str, Any]], now: datetime) -> None:
        """Score the six ring metrics against their benchmarks, and each set of three."""
        options = self.entry.options
        birth_year = number(options.get(CONF_BIRTH_YEAR), (1900, 2200))
        local_year = dt_util.as_local(now).year
        age = None if birth_year is None else max(0, local_year - int(birth_year))
        sex = options.get(CONF_SEX)
        for set_key, ring_metrics in RING_SETS.items():
            found: list[float] = []
            for metric in ring_metrics:
                values = metrics.get(metric)
                result = score(metric, values.get("value") if values else None, age, sex)
                if values is None or result is None:
                    continue
                found.append(result.score)
                values["score"] = round(result.score)
                values["full"] = {
                    "direction": result.direction,
                    "low": result.full_low,
                    "high": result.full_high,
                }
                if result.percentile is not None:
                    values["percentile"] = round(result.percentile)
            mean = average(found)
            if mean is not None:
                metrics[set_key] = {"value": round(mean), "rings": len(found)}

    async def _async_heart_windows(
        self, hours: list[Sample], sleep: SleepWindow | None, now: datetime
    ) -> dict[str, dict[str, Any]]:
        result: dict[str, dict[str, Any]] = {}
        midnight = dt_util.start_of_local_day(now)

        if sleep is not None:
            asleep = window_average(
                hours, sleep.start.timestamp(), sleep.end.timestamp(), MIN_SLEEPING_HOURS
            )
            if asleep is not None:
                result[SLEEPING_HEART_RATE] = {
                    "value": _round(asleep.mean),
                    "lowest": _round(asleep.lowest),
                    "highest": _round(asleep.highest),
                    "hours": asleep.hours,
                    "night": sleep.night.isoformat(),
                    "start": _iso(sleep.start),
                    "end": _iso(sleep.end),
                }

        # Awake today: since this morning's wake-up, or since midnight when the
        # newest night is an older one (the watch was not worn last night).
        since = max(sleep.end, midnight) if sleep is not None else midnight
        today = window_average(hours, since.timestamp(), None, MIN_AWAKE_HOURS)
        if today is not None:
            result[AWAKE_HEART_RATE] = {
                "value": _round(today.mean),
                "lowest": _round(today.lowest),
                "highest": _round(today.highest),
                "hours": today.hours,
                "since": _iso(since),
            }

        # The day that ended when last night began: from that day's wake-up.
        if sleep is not None:
            woke = await self._async_previous_wake(sleep.night)
            earliest = sleep.start - timedelta(hours=PREVIOUS_DAY_MAX_HOURS)
            start = (
                max(woke, earliest)
                if woke is not None and woke < sleep.start
                else sleep.start - timedelta(hours=PREVIOUS_DAY_DEFAULT_HOURS)
            )
            previous = window_average(
                hours, start.timestamp(), sleep.start.timestamp(), MIN_PREVIOUS_DAY_HOURS
            )
            if previous is not None:
                result[AWAKE_HEART_RATE_PREVIOUS] = {
                    "value": _round(previous.mean),
                    "lowest": _round(previous.lowest),
                    "highest": _round(previous.highest),
                    "hours": previous.hours,
                    "start": _iso(start),
                    "end": _iso(sleep.start),
                }
        return result

    async def _async_previous_wake(self, night: date) -> datetime | None:
        """The wake-up before ``night``; asked once per night, the answer is kept."""
        if self._previous_wake is None or self._previous_wake[0] != night:
            woke = await self.source.async_previous_wake(self.hass, self.source_entry_id, night)
            self._previous_wake = (night, woke)
        return self._previous_wake[1]

    async def _async_heart_rate_hours(
        self, now: datetime, sleep: SleepWindow | None
    ) -> list[Sample]:
        statistic_id = self.source.statistic_id(self.source_entry_id, HEART_RATE)
        if statistic_id is None:
            return []
        start = now - HEART_RATE_LOOKBACK
        if sleep is not None:
            start = min(start, sleep.start - timedelta(hours=PREVIOUS_DAY_MAX_HOURS + 2))
        # Never further back than a few days, whatever the sleep entity says.
        start = max(start, now - timedelta(days=4))
        rows = await self._async_statistics({statistic_id}, start, now + timedelta(hours=1), "hour")
        return samples(rows.get(statistic_id, []), LIMITS[HEART_RATE])

    async def _async_daily(self, now: datetime) -> list[tuple[str, list[Sample]]]:
        ids = {
            metric: statistic_id
            for metric in BASELINE_DAYS
            if (statistic_id := self.source.statistic_id(self.source_entry_id, metric))
        }
        if not ids:
            return []
        end = dt_util.as_utc(dt_util.start_of_local_day(now)) + timedelta(days=1)
        longest = max(BASELINE_DAYS.values())
        rows = await self._async_statistics(
            set(ids.values()), end - timedelta(days=longest), end, "day"
        )
        result = []
        for metric, statistic_id in ids.items():
            earliest = (end - timedelta(days=BASELINE_DAYS[metric])).timestamp()
            days = [
                day
                for day in samples(rows.get(statistic_id, []), LIMITS[metric])
                if day.start >= earliest
            ]
            result.append((metric, days))
        return result

    async def async_series(
        self, metric: str, period: str, start: datetime, end: datetime
    ) -> dict[str, Any] | None:
        """Chart points for one metric; None if the source has no such history."""
        if metric not in SERIES_METRICS:
            return None
        statistic_id = self.source.statistic_id(self.source_entry_id, metric)
        if statistic_id is None:
            return None
        rows = await self._async_statistics({statistic_id}, start, end, period)
        points = samples(rows.get(statistic_id, []), LIMITS[metric])[-MAX_SERIES_POINTS:]
        return {
            "metric": metric,
            "period": period,
            "points": [
                {
                    "start": round(point.start * 1000),
                    "end": round(point.end * 1000),
                    "mean": round(point.mean, 2),
                    "min": round(point.low, 2),
                    "max": round(point.high, 2),
                }
                for point in points
            ],
        }

    async def _async_statistics(
        self, statistic_ids: set[str], start: datetime, end: datetime, period: str
    ) -> dict[str, list[dict[str, Any]]]:
        """Read long-term statistics; empty when there is no recorder."""
        if not statistic_ids or "recorder" not in self.hass.config.components:
            return {}
        # Imported here: the recorder is an optional dependency.
        from homeassistant.components.recorder import get_instance  # noqa: PLC0415
        from homeassistant.components.recorder.statistics import (  # noqa: PLC0415
            statistics_during_period,
        )

        async with self._statistics_lock:
            return await get_instance(self.hass).async_add_executor_job(
                statistics_during_period,
                self.hass,
                start,
                end,
                statistic_ids,
                period,
                STATISTIC_UNITS,
                {"mean", "min", "max"},
            )
