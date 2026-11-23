"""The arithmetic behind VitalRings. Nothing here knows about Home Assistant."""

from __future__ import annotations

from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from math import isfinite
from typing import Any

# World Health Organization adult BMI classes: lower limit of each.
BMI_CLASSES = (
    (30.0, "obese"),
    (25.0, "overweight"),
    (18.5, "healthy"),
    (0.0, "underweight"),
)


@dataclass(frozen=True, slots=True)
class Sample:
    """One statistics row: an hour, a day or a longer period."""

    start: float  # seconds since the epoch
    end: float
    mean: float
    low: float
    high: float


@dataclass(frozen=True, slots=True)
class WindowAverage:
    """The average over a stretch of whole hours."""

    mean: float
    lowest: float
    highest: float
    hours: int


@dataclass(frozen=True, slots=True)
class Baseline:
    """What is usual for a metric: its daily values over the last weeks."""

    average: float
    average_7d: float | None
    low: float
    high: float
    first: float
    days: int


def number(value: Any, limits: tuple[float, float] | None = None) -> float | None:
    """Return a finite number inside the limits, or None."""
    try:
        result = float(value)
    except TypeError, ValueError, OverflowError:
        return None
    if not isfinite(result):
        return None
    if limits is not None and not limits[0] <= result <= limits[1]:
        return None
    return result


def samples(
    rows: Iterable[Mapping[str, Any]], limits: tuple[float, float] | None = None
) -> list[Sample]:
    """Turn recorder statistics rows into samples, dropping implausible ones."""
    result: list[Sample] = []
    for row in rows:
        start = number(row.get("start"))
        end = number(row.get("end"))
        mean = number(row.get("mean"), limits)
        if start is None or end is None or mean is None or end <= start:
            continue
        low = number(row.get("min"), limits)
        high = number(row.get("max"), limits)
        result.append(
            Sample(
                start=start,
                end=end,
                mean=mean,
                low=mean if low is None else low,
                high=mean if high is None else high,
            )
        )
    result.sort(key=lambda sample: sample.start)
    return result


def window_average(
    hours: Sequence[Sample], start: float, end: float | None, minimum: int = 1
) -> WindowAverage | None:
    """Average the hours that lie completely inside a window.

    Only whole hours count, so the minutes around falling asleep or waking up
    do not leak into a sleeping or an awake average. ``end`` None means "until
    now". Fewer than ``minimum`` hours is not an average.
    """
    inside = [hour for hour in hours if hour.start >= start and (end is None or hour.end <= end)]
    if len(inside) < max(1, minimum):
        return None
    return WindowAverage(
        mean=sum(hour.mean for hour in inside) / len(inside),
        lowest=min(hour.low for hour in inside),
        highest=max(hour.high for hour in inside),
        hours=len(inside),
    )


def baseline(days: Sequence[Sample], now: float) -> Baseline | None:
    """Summarise daily values: the average, the last week's, and the range."""
    if not days:
        return None
    values = [day.mean for day in days]
    week = [day.mean for day in days if day.start >= now - 7 * 86400]
    return Baseline(
        average=sum(values) / len(values),
        average_7d=sum(week) / len(week) if week else None,
        low=min(values),
        high=max(values),
        first=values[0],
        days=len(values),
    )


def bmi(weight_kg: float | None, height_m: float | None) -> float | None:
    """Body mass index: kilograms per square metre."""
    if weight_kg is None or height_m is None or weight_kg <= 0 or height_m <= 0:
        return None
    return weight_kg / (height_m * height_m)


def bmi_class(value: float) -> str:
    """Return the WHO class for an adult BMI."""
    for lower, name in BMI_CLASSES:
        if value >= lower:
            return name
    return BMI_CLASSES[-1][1]
