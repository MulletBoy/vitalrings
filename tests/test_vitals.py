"""Tests for the arithmetic (no Home Assistant needed). All numbers are invented."""

from custom_components.vital_rings.vitals import (
    Sample,
    baseline,
    bmi,
    bmi_class,
    number,
    samples,
    window_average,
)

HOUR = 3600.0
DAY = 86400.0


def hour(index: int, mean: float, low: float | None = None, high: float | None = None) -> Sample:
    return Sample(
        start=index * HOUR,
        end=(index + 1) * HOUR,
        mean=mean,
        low=mean if low is None else low,
        high=mean if high is None else high,
    )


def test_number_accepts_only_plausible_finite_values() -> None:
    assert number("47.5") == 47.5
    assert number(None) is None
    assert number("unknown") is None
    assert number(float("nan")) is None
    assert number(float("inf")) is None
    assert number(300, (20, 250)) is None
    assert number(20, (20, 250)) == 20


def test_samples_drop_bad_rows_and_fill_missing_extremes() -> None:
    rows = [
        {"start": 2 * HOUR, "end": 3 * HOUR, "mean": 60, "min": 55, "max": 70},
        {"start": 0, "end": HOUR, "mean": 50, "min": None, "max": None},
        {"start": HOUR, "end": 2 * HOUR, "mean": None},
        {"start": 3 * HOUR, "end": 4 * HOUR, "mean": 900},
        {"start": 5 * HOUR, "end": 4 * HOUR, "mean": 60},
        {"start": 6 * HOUR, "end": 7 * HOUR, "mean": 61, "min": 2, "max": 62},
    ]
    result = samples(rows, (20, 250))
    assert [s.mean for s in result] == [50, 60, 61]
    # Sorted by time; a missing or implausible low or high falls back to the mean.
    assert (result[0].low, result[0].high) == (50, 50)
    assert (result[1].low, result[1].high) == (55, 70)
    assert (result[2].low, result[2].high) == (61, 62)


def test_window_average_counts_only_whole_hours_inside() -> None:
    hours = [hour(0, 70), hour(1, 50, 44, 58), hour(2, 46, 41, 52), hour(3, 48), hour(4, 72)]
    # Asleep from 0:40 to 4:10: hours 1, 2 and 3 lie completely inside.
    result = window_average(hours, 0.67 * HOUR, 4.17 * HOUR, minimum=2)
    assert result is not None
    assert result.hours == 3
    assert result.mean == (50 + 46 + 48) / 3
    assert (result.lowest, result.highest) == (41, 58)


def test_window_average_needs_enough_hours() -> None:
    hours = [hour(0, 60), hour(1, 62)]
    assert window_average(hours, 0, 2 * HOUR, minimum=3) is None
    assert window_average([], 0, None) is None
    # No end: everything from the start on.
    open_ended = window_average(hours, HOUR, None)
    assert open_ended is not None and open_ended.hours == 1 and open_ended.mean == 62


def test_baseline_summarises_daily_values() -> None:
    now = 30 * DAY
    days = [
        Sample(start=d * DAY, end=(d + 1) * DAY, mean=50.0 if d < 23 else 46.0, low=0, high=0)
        for d in range(30)
    ]
    usual = baseline(days, now)
    assert usual is not None
    assert usual.days == 30
    assert usual.low == 46 and usual.high == 50
    assert usual.first == 50
    assert usual.average_7d == 46
    assert round(usual.average, 3) == round((23 * 50 + 7 * 46) / 30, 3)
    assert baseline([], now) is None
    # Nothing in the last week: no weekly average, the rest still stands.
    old = baseline(days[:10], now)
    assert old is not None and old.average_7d is None and old.days == 10


def test_bmi_and_its_classes() -> None:
    assert round(bmi(80, 1.8), 1) == 24.7
    assert bmi(None, 1.8) is None
    assert bmi(80, 0) is None
    assert bmi_class(17.0) == "underweight"
    assert bmi_class(18.5) == "healthy"
    assert bmi_class(24.9) == "healthy"
    assert bmi_class(25.0) == "overweight"
    assert bmi_class(31.2) == "obese"
