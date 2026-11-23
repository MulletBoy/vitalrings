"""Constants for VitalRings."""

from __future__ import annotations

from datetime import timedelta

DOMAIN = "vital_rings"

CONF_SOURCE = "source"
CONF_SOURCE_ENTRY = "source_entry"
# Optional, for the VO2 max benchmark, which depends on age and sex.
CONF_BIRTH_YEAR = "birth_year"
CONF_SEX = "sex"

SOURCE_LIFE_DASHBOARD = "life_dashboard"

# What a source can provide. The first group has a latest value and long-term
# statistics; the second group are entities the figures are worked out from.
HEART_RATE = "heart_rate"
RESTING_HEART_RATE = "resting_heart_rate"
HEART_RATE_VARIABILITY = "heart_rate_variability"
OXYGEN_SATURATION = "oxygen_saturation"
RESPIRATORY_RATE = "respiratory_rate"
VO2_MAX = "vo2_max"
WEIGHT = "weight"
HEIGHT = "height"

LAST_SLEEP = "last_sleep"
LAST_WORKOUT = "last_workout"
LAST_SYNC = "last_sync"

# Figures VitalRings works out itself.
SLEEPING_HEART_RATE = "sleeping_heart_rate"
AWAKE_HEART_RATE = "awake_heart_rate"
AWAKE_HEART_RATE_PREVIOUS = "awake_heart_rate_previous"
WORKOUT_HEART_RATE = "workout_heart_rate"
BMI = "bmi"
# The two sets of rings: the mean score of the three rings in each.
VITALS_SCORE = "vitals_score"
FITNESS_SCORE = "fitness_score"

# Metrics with statistics, which the card may chart.
SERIES_METRICS = (
    HEART_RATE,
    RESTING_HEART_RATE,
    HEART_RATE_VARIABILITY,
    OXYGEN_SATURATION,
    RESPIRATORY_RATE,
    VO2_MAX,
    WEIGHT,
)

# Days of daily values behind "usual" (average and range). VO2 max moves slowly
# and is measured only on some workouts, so it looks further back.
BASELINE_DAYS = {
    RESTING_HEART_RATE: 30,
    HEART_RATE_VARIABILITY: 30,
    OXYGEN_SATURATION: 30,
    RESPIRATORY_RATE: 30,
    VO2_MAX: 90,
    WEIGHT: 30,
}

# Values outside these are measuring errors or a wrong unit, and are ignored.
LIMITS: dict[str, tuple[float, float]] = {
    HEART_RATE: (20, 250),
    RESTING_HEART_RATE: (20, 200),
    HEART_RATE_VARIABILITY: (1, 400),
    OXYGEN_SATURATION: (50, 100),
    RESPIRATORY_RATE: (3, 80),
    VO2_MAX: (5, 100),
    WEIGHT: (15, 500),  # kilograms
    HEIGHT: (0.4, 2.8),  # metres
}

REFRESH_INTERVAL = timedelta(minutes=15)
# Several source entities change in the same sync: wait for them all.
REFRESH_COOLDOWN = 10

# Whole hours needed before an average is worth showing.
MIN_SLEEPING_HOURS = 2
MIN_AWAKE_HOURS = 1
MIN_PREVIOUS_DAY_HOURS = 4
# The day before last night is looked at this far back at most.
PREVIOUS_DAY_MAX_HOURS = 18
PREVIOUS_DAY_DEFAULT_HOURS = 16
# A sleep longer than this is not one night.
MAX_SLEEP_HOURS = 36
# The newest night may be this old (the watch was not worn for a while).
MAX_NIGHT_AGE = timedelta(days=60)

# Limits on what one chart request may ask for.
MAX_SERIES_POINTS = 2000
# The longest stretch per kind of point: enough for every chart of the card,
# and no more, so one request cannot make the recorder read years of hours.
MAX_SERIES_SPAN = {
    "hour": timedelta(days=32),
    "day": timedelta(days=400),
    "week": timedelta(days=366 * 3),
    "month": timedelta(days=366 * 20),
}

# The rings: each set's metrics, outermost ring first.
RING_SETS: dict[str, tuple[str, ...]] = {
    VITALS_SCORE: (RESTING_HEART_RATE, HEART_RATE_VARIABILITY, RESPIRATORY_RATE),
    FITNESS_SCORE: (SLEEPING_HEART_RATE, OXYGEN_SATURATION, VO2_MAX),
}
