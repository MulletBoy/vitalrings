"""Tests for the benchmark scores (no Home Assistant needed)."""

import pytest

from custom_components.vital_rings.scores import (
    PERCENTILES,
    VO2_TABLE,
    average,
    score,
    vo2_row,
)


def points(metric: str, value: float, **person) -> float:
    result = score(metric, value, **person)
    assert result is not None
    return round(result.score, 1)


def test_lower_is_better_for_heart_rates() -> None:
    assert points("resting_heart_rate", 44) == 100
    assert points("resting_heart_rate", 50) == 100
    assert points("resting_heart_rate", 60) == 80
    assert points("resting_heart_rate", 75) == 50
    assert points("resting_heart_rate", 100) == 0
    assert points("resting_heart_rate", 130) == 0
    assert points("sleeping_heart_rate", 45) == 100
    assert points("sleeping_heart_rate", 65) == 50
    full = score("resting_heart_rate", 60)
    assert (full.direction, full.full_low, full.full_high) == ("low", 50, None)


def test_heart_rate_variability_uses_a_logarithmic_scale() -> None:
    assert points("heart_rate_variability", 100) == 100
    assert points("heart_rate_variability", 180) == 100
    assert points("heart_rate_variability", 15) == 0
    assert points("heart_rate_variability", 5) == 0
    # Halfway on a logarithmic scale is the geometric mean of the two ends.
    assert points("heart_rate_variability", (15 * 100) ** 0.5) == 50
    assert score("heart_rate_variability", 60).direction == "high"


def test_respiratory_rate_has_a_best_range() -> None:
    for value in (12, 15, 18):
        assert points("respiratory_rate", value) == 100
    assert points("respiratory_rate", 23) == 50
    assert points("respiratory_rate", 9) == 50
    assert points("respiratory_rate", 30) == 0
    full = score("respiratory_rate", 15)
    assert (full.direction, full.full_low, full.full_high) == ("range", 12, 18)


def test_blood_oxygen() -> None:
    assert points("oxygen_saturation", 99) == 100
    assert points("oxygen_saturation", 97) == 100
    assert points("oxygen_saturation", 95) == 85
    assert points("oxygen_saturation", 92.5) == 42.5
    assert points("oxygen_saturation", 88) == 0


def test_vo2_max_is_the_percentile_for_age_and_sex() -> None:
    # A man of 45: the 40-49 row. Its median is 37.8, its 95th percentile 55.6.
    man = {"age": 45, "sex": "male"}
    assert points("vo2_max", 37.8, **man) == 50
    assert points("vo2_max", 45.0, **man) == 75
    assert points("vo2_max", 55.6, **man) == 100
    assert points("vo2_max", 70, **man) == 100
    assert points("vo2_max", 24.2, **man) == 5
    assert points("vo2_max", 10, **man) == 0
    # The same value ranks higher for a woman, and for an older person.
    assert points("vo2_max", 37.8, age=45, sex="female") > 85
    assert points("vo2_max", 37.8, age=65, sex="male") > 80
    result = score("vo2_max", 41.4, **man)
    assert round(result.percentile) == 62
    assert result.full_high == 55.6


def test_vo2_max_without_age_or_sex() -> None:
    assert vo2_row(None, "male") == VO2_TABLE["male"][2]
    assert vo2_row(17, "male") == VO2_TABLE["male"][0]
    assert vo2_row(93, "female") == VO2_TABLE["female"][5]
    blended = vo2_row(45, None)
    assert blended[3] == pytest.approx((37.8 + 26.7) / 2)
    assert points("vo2_max", blended[3]) == 50


def test_the_table_is_complete_and_rising() -> None:
    for rows in VO2_TABLE.values():
        assert len(rows) == 6
        for row in rows:
            assert len(row) == len(PERCENTILES)
            assert list(row) == sorted(row)


def test_no_value_or_no_benchmark_gives_no_score() -> None:
    assert score("resting_heart_rate", None) is None
    assert score("weight", 80) is None
    assert average([]) is None
    assert average([100, 50]) == 75
