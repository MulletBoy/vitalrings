"""Scores from 0 to 100 against published benchmarks. Nothing here knows about Home Assistant.

Each score says where a value sits between "poor" and "excellent" for a
healthy adult. The benchmarks are reference ranges from the literature turned
into straight lines, which is a simplification: they are a guide, not a
medical judgement.

Resting heart rate, heart rate variability, respiratory rate and blood oxygen
are scored on the average of the last 24 hours where there is one (the caller
works it out): a watch takes them as spot readings, and one odd reading would
otherwise empty a ring.

- Resting heart rate: 60-100 bpm is the normal adult range (American Heart
  Association); well-trained people rest at 40-60. Full marks at 50 or lower,
  none at 100.
- Sleeping heart rate: runs below the resting rate. Full marks at 45 or lower,
  none at 85.
- Heart rate variability (SDNN, as Apple Watch reports it): higher is better,
  and it falls with age. There is no agreed population table for wrist
  readings, so this uses one broad scale for all adults: none at 15 ms, full
  marks at 100 ms, on a logarithmic scale because variability is spread that way.
- Respiratory rate: 12-20 breaths a minute is the normal adult range at rest.
  Full marks from 12 to 18, falling to none at 28 and at 6.
- Blood oxygen: 95-100 % is normal, below 90 % is low. Full marks at 97,
  85 at 95, none at 90.
- VO2 max: the percentile for the person's age and sex in the FRIEND registry
  (Kaminsky et al., Mayo Clinic Proceedings 2015, treadmill tests of 7783
  adults without cardiovascular disease). The 95th percentile and above scores
  100. Without an age the 40-49 row is used; without a sex, the mean of the
  men's and women's rows.
"""

from __future__ import annotations

from bisect import bisect_right
from dataclasses import dataclass
from math import log

from .const import (
    HEART_RATE_VARIABILITY,
    OXYGEN_SATURATION,
    RESPIRATORY_RATE,
    RESTING_HEART_RATE,
    SLEEPING_HEART_RATE,
    VO2_MAX,
)

SEX_MALE = "male"
SEX_FEMALE = "female"

# (value, score) corner points; the score runs in straight lines between them
# and stays level outside them.
CURVES: dict[str, tuple[tuple[float, float], ...]] = {
    RESTING_HEART_RATE: ((50, 100), (100, 0)),
    SLEEPING_HEART_RATE: ((45, 100), (85, 0)),
    RESPIRATORY_RATE: ((6, 0), (12, 100), (18, 100), (28, 0)),
    OXYGEN_SATURATION: ((90, 0), (95, 85), (97, 100)),
}
# Heart rate variability, on a logarithmic scale.
HRV_NONE = 15.0
HRV_FULL = 100.0

# FRIEND registry, treadmill, measured VO2 max in mL/kg/min: the 5th, 10th,
# 25th, 50th, 75th, 90th and 95th percentile for each decade from 20 to 79.
PERCENTILES = (5, 10, 25, 50, 75, 90, 95)
VO2_DECADES = (20, 30, 40, 50, 60, 70)
VO2_TABLE: dict[str, tuple[tuple[float, ...], ...]] = {
    SEX_MALE: (
        (29.0, 32.1, 40.1, 48.0, 55.2, 61.8, 66.3),
        (27.2, 30.2, 35.9, 42.4, 49.2, 56.5, 59.8),
        (24.2, 26.8, 31.9, 37.8, 45.0, 52.1, 55.6),
        (20.9, 22.8, 27.1, 32.6, 39.7, 45.6, 50.7),
        (17.4, 19.8, 23.7, 28.2, 34.5, 40.3, 43.0),
        (16.3, 17.1, 20.4, 24.4, 30.4, 36.6, 39.7),
    ),
    SEX_FEMALE: (
        (21.7, 23.9, 30.5, 37.6, 44.7, 51.3, 56.0),
        (19.0, 20.9, 25.3, 30.2, 36.1, 41.4, 45.8),
        (17.0, 18.8, 22.1, 26.7, 32.4, 38.4, 41.7),
        (16.0, 17.3, 19.9, 23.4, 27.6, 32.0, 35.9),
        (13.4, 14.6, 17.2, 20.0, 23.8, 27.0, 29.4),
        (13.1, 13.6, 15.6, 18.3, 20.8, 23.1, 24.1),
    ),
}
DEFAULT_DECADE = 40


@dataclass(frozen=True, slots=True)
class Score:
    """A score with what earns full marks, for the card to say so."""

    score: float
    # "low": full marks at ``full_low`` or lower; "high": at ``full_high`` or
    # higher; "range": between the two.
    direction: str
    full_low: float | None = None
    full_high: float | None = None
    percentile: float | None = None


def _interpolate(points: tuple[tuple[float, float], ...], value: float) -> float:
    """Follow straight lines through the points; level before the first and after the last."""
    if value <= points[0][0]:
        return points[0][1]
    for (x0, y0), (x1, y1) in zip(points, points[1:], strict=False):
        if value <= x1:
            return y0 + (y1 - y0) * (value - x0) / (x1 - x0)
    return points[-1][1]


def _curve_score(metric: str, value: float) -> Score:
    points = CURVES[metric]
    full = [x for x, y in points if y >= 100]
    falls_before = points[0][1] < 100
    falls_after = points[-1][1] < 100
    if falls_before and falls_after:
        direction, low, high = "range", min(full), max(full)
    elif falls_after:
        direction, low, high = "low", max(full), None
    else:
        direction, low, high = "high", None, min(full)
    return Score(
        score=_interpolate(points, value), direction=direction, full_low=low, full_high=high
    )


def _hrv_score(value: float) -> Score:
    position = (log(max(value, 1.0)) - log(HRV_NONE)) / (log(HRV_FULL) - log(HRV_NONE))
    return Score(score=min(100.0, max(0.0, position * 100)), direction="high", full_high=HRV_FULL)


def vo2_row(age: int | None, sex: str | None) -> tuple[float, ...]:
    """The percentile values for a person: their decade's row for their sex."""
    decade = DEFAULT_DECADE if age is None else min(70, max(20, age // 10 * 10))
    index = VO2_DECADES.index(decade)
    if sex in VO2_TABLE:
        return VO2_TABLE[sex][index]
    return tuple(
        round((men + women) / 2, 2)
        for men, women in zip(VO2_TABLE[SEX_MALE][index], VO2_TABLE[SEX_FEMALE][index], strict=True)
    )


def _vo2_score(value: float, age: int | None, sex: str | None) -> Score:
    row = vo2_row(age, sex)
    # Below the 5th percentile the line continues down to zero; from the 95th up it is 100.
    points = (
        (row[0] - (row[1] - row[0]), 0.0),
        *zip(row[:-1], (float(p) for p in PERCENTILES[:-1]), strict=True),
        (row[-1], 100.0),
    )
    score = _interpolate(points, value)
    place = bisect_right(row, value)
    percentile = (
        float(PERCENTILES[0])
        if place == 0
        else float(PERCENTILES[-1])
        if place == len(row)
        else PERCENTILES[place - 1]
        + (PERCENTILES[place] - PERCENTILES[place - 1])
        * (value - row[place - 1])
        / (row[place] - row[place - 1])
    )
    return Score(score=score, direction="high", full_high=row[-1], percentile=percentile)


def score(
    metric: str, value: float | None, age: int | None = None, sex: str | None = None
) -> Score | None:
    """Score one metric's value, or None when it has no benchmark or no value."""
    if value is None:
        return None
    if metric in CURVES:
        return _curve_score(metric, value)
    if metric == HEART_RATE_VARIABILITY:
        return _hrv_score(value)
    if metric == VO2_MAX:
        return _vo2_score(value, age, sex)
    return None


def average(scores: list[float]) -> float | None:
    """The score of a set of rings: the mean of the ones that exist."""
    return sum(scores) / len(scores) if scores else None
