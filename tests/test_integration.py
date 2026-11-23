"""Integration tests with a fake Life Dashboard entry. All health numbers are invented."""

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path
from unittest.mock import patch

import pytest
from homeassistant.config_entries import SOURCE_USER
from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant.common import MockConfigEntry, async_fire_time_changed

from custom_components.vital_rings.const import (
    CONF_SOURCE,
    CONF_SOURCE_ENTRY,
    DOMAIN,
    SOURCE_LIFE_DASHBOARD,
)
from custom_components.vital_rings.diagnostics import async_get_config_entry_diagnostics
from custom_components.vital_rings.manager import VitalRingsManager

MANIFEST = Path(__file__).parent.parent / "custom_components/vital_rings/manifest.json"
SOURCE_ENTRY_ID = "01TESTSOURCE0000000000000A"
STAT = f"life_dashboard:{SOURCE_ENTRY_ID.lower()}_"

# Sydney is UTC+11 in March. "Now" is 14:30 local on 10 March 2030.
NOW = datetime(2030, 3, 10, 3, 30, tzinfo=UTC)
SLEEP_START = datetime(2030, 3, 9, 12, 20, tzinfo=UTC)  # 23:20 local
SLEEP_END = datetime(2030, 3, 9, 20, 10, tzinfo=UTC)  # 07:10 local
PREVIOUS_WAKE = datetime(2030, 3, 8, 20, 0, tzinfo=UTC)  # 07:00 local the day before

SOURCE_SENSORS = {
    "heart_rate": (
        "61",
        {"unit_of_measurement": "bpm", "measured_at": "2030-03-10T03:21:00+00:00"},
    ),
    "resting_heart_rate": ("48", {"unit_of_measurement": "bpm"}),
    "heart_rate_variability": ("66", {"unit_of_measurement": "ms"}),
    "oxygen_saturation": ("97", {"unit_of_measurement": "%"}),
    "respiratory_rate": ("14.5", {"unit_of_measurement": "breaths/min"}),
    "vo2_max": ("44.2", {"unit_of_measurement": "mL/min/kg"}),
    "weight": ("80", {"unit_of_measurement": "kg"}),
    "height": ("1.8", {"unit_of_measurement": "m"}),
    "last_health_sync": ("2030-03-10T03:22:00+00:00", {}),
    "last_sleep_asleep": (
        "7.5",
        {
            "night": "2030-03-10",
            "start": SLEEP_START.isoformat(),
            "end": SLEEP_END.isoformat(),
            "asleep_minutes": 450,
        },
    ),
    "last_workout": (
        "running",
        {
            "heart_rate_avg": 141,
            "heart_rate_max": 168,
            "heart_rate_min": 96,
            "start": "2030-03-09T06:00:00+00:00",
            "end": "2030-03-09T06:42:00+00:00",
            "duration_minutes": 42,
        },
    ),
}


def entity_id(key: str) -> str:
    return f"sensor.phone_{key}"


def heart_rate_hours(start: datetime, end: datetime) -> list[dict]:
    """Hourly rows: 45 asleep (low 40), 70 before last night, 65 since waking."""
    rows = []
    at = start.replace(minute=0, second=0, microsecond=0)
    while at + timedelta(hours=1) <= min(end, NOW):
        if at >= SLEEP_START and at + timedelta(hours=1) <= SLEEP_END:
            mean, low, high = 45.0, 40.0, 52.0
        elif at < SLEEP_START:
            mean, low, high = 70.0, 58.0, 110.0
        else:
            mean, low, high = 65.0, 55.0, 90.0
        rows.append(
            {
                "start": at.timestamp(),
                "end": (at + timedelta(hours=1)).timestamp(),
                "mean": mean,
                "min": low,
                "max": high,
            }
        )
        at += timedelta(hours=1)
    return rows


def daily_rows(start: datetime, end: datetime, older: float, last_week: float) -> list[dict]:
    rows = []
    at = start
    while at < end:
        value = last_week if at >= NOW - timedelta(days=7) else older
        rows.append(
            {
                "start": at.timestamp(),
                "end": (at + timedelta(days=1)).timestamp(),
                "mean": value,
                "min": value - 1,
                "max": value + 1,
            }
        )
        at += timedelta(days=1)
    return rows


DAILY = {
    "resting_heart_rate": (50.0, 48.0),
    "heart_rate_variability": (70.0, 64.0),
    "oxygen_saturation": (96.0, 97.0),
    "respiratory_rate": (14.0, 15.0),
    "vo2_max": (43.0, 44.0),
    "weight": (81.0, 80.0),
}


async def fake_statistics(self, statistic_ids, start, end, period):
    """Stand-in for the recorder: invented rows for the ids asked for."""
    result = {}
    for statistic_id in statistic_ids:
        key = statistic_id.removeprefix(STAT)
        if period == "hour" and key == "heart_rate":
            result[statistic_id] = heart_rate_hours(start, end)
        elif key in DAILY:
            result[statistic_id] = daily_rows(start, min(end, NOW), *DAILY[key])
    return result


@pytest.fixture(autouse=True)
async def _setup(hass: HomeAssistant, hass_storage, freezer):
    freezer.move_to(NOW)
    await hass.config.async_set_time_zone("Australia/Sydney")
    with patch.object(VitalRingsManager, "_async_statistics", fake_statistics):
        yield


def add_source(hass: HomeAssistant, *, without: tuple[str, ...] = ()) -> MockConfigEntry:
    """A Life Dashboard entry with its sensors, as that integration creates them."""
    source = MockConfigEntry(domain="life_dashboard", title="Phone", entry_id=SOURCE_ENTRY_ID)
    source.add_to_hass(hass)
    registry = er.async_get(hass)
    for key, (state, attributes) in SOURCE_SENSORS.items():
        if key in without:
            continue
        registry.async_get_or_create(
            "sensor",
            "life_dashboard",
            f"{SOURCE_ENTRY_ID}_{key}",
            config_entry=source,
            suggested_object_id=f"phone_{key}",
        )
        hass.states.async_set(entity_id(key), state, attributes)

    async def get_sleep_nights(call: ServiceCall) -> dict:
        assert call.data["config_entry"] == SOURCE_ENTRY_ID
        return {
            "nights": [
                {
                    "night": "2030-03-09",
                    "start": "2030-03-08T12:00:00+00:00",
                    "end": PREVIOUS_WAKE.isoformat(),
                    "asleep_minutes": 440,
                },
                # A nap on the same day must not count as the wake-up.
                {
                    "night": "2030-03-09",
                    "start": "2030-03-09T03:00:00+00:00",
                    "end": "2030-03-09T03:40:00+00:00",
                    "asleep_minutes": 35,
                },
            ]
        }

    hass.services.async_register(
        "life_dashboard",
        "get_sleep_nights",
        get_sleep_nights,
        supports_response=SupportsResponse.ONLY,
    )
    return source


async def setup_entry(hass: HomeAssistant, **kwargs) -> MockConfigEntry:
    add_source(hass, **kwargs)
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Sample",
        unique_id=SOURCE_ENTRY_ID,
        data={CONF_SOURCE: SOURCE_LIFE_DASHBOARD, CONF_SOURCE_ENTRY: SOURCE_ENTRY_ID},
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


def test_manifest_is_complete() -> None:
    manifest = json.loads(MANIFEST.read_text())
    assert manifest["domain"] == DOMAIN
    assert manifest["config_flow"] is True
    assert manifest["version"].count(".") == 2


async def test_config_flow(hass: HomeAssistant) -> None:
    # Without a supported integration there is nothing to choose from.
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "no_source"

    add_source(hass)
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"name": "Sample", CONF_SOURCE_ENTRY: SOURCE_ENTRY_ID}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Sample"
    assert result["data"] == {
        CONF_SOURCE: SOURCE_LIFE_DASHBOARD,
        CONF_SOURCE_ENTRY: SOURCE_ENTRY_ID,
    }

    # The same health data cannot be set up twice.
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"name": "Again", CONF_SOURCE_ENTRY: SOURCE_ENTRY_ID}
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "already_configured"


async def test_config_flow_needs_a_heart_rate_sensor(hass: HomeAssistant) -> None:
    add_source(hass, without=("heart_rate",))
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"name": "Sample", CONF_SOURCE_ENTRY: SOURCE_ENTRY_ID}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {CONF_SOURCE_ENTRY: "no_heart_rate"}


async def test_heart_rate_asleep_and_awake(hass: HomeAssistant) -> None:
    await setup_entry(hass)

    sleeping = hass.states.get("sensor.sample_sleeping_heart_rate")
    assert float(sleeping.state) == 45
    # Hours 13:00 to 20:00 UTC lie completely inside the night: seven of them.
    assert sleeping.attributes["hours"] == 7
    assert sleeping.attributes["lowest"] == 40
    assert sleeping.attributes["night"] == "2030-03-10"

    awake = hass.states.get("sensor.sample_awake_heart_rate")
    assert float(awake.state) == 65
    assert awake.attributes["since"] == SLEEP_END.isoformat()
    assert awake.attributes["hours"] == 6  # 21:00 to 03:00 UTC

    # The day before: from that morning's wake-up (not the nap) to falling asleep.
    previous = hass.states.get("sensor.sample_awake_heart_rate_previous_day")
    assert float(previous.state) == 70
    assert previous.attributes["start"] == PREVIOUS_WAKE.isoformat()
    assert previous.attributes["hours"] == 16


async def test_previous_day_without_the_action_looks_back_a_fixed_time(
    hass: HomeAssistant,
) -> None:
    entry = await setup_entry(hass)
    hass.services.async_remove("life_dashboard", "get_sleep_nights")
    manager = entry.runtime_data
    manager._previous_wake = None
    await manager.async_refresh()
    previous = manager.metrics["awake_heart_rate_previous"]
    assert previous["start"] == (SLEEP_START - timedelta(hours=16)).isoformat()
    assert previous["value"] == 70


async def test_usual_values_workout_and_body(hass: HomeAssistant) -> None:
    entry = await setup_entry(hass)
    metrics = entry.runtime_data.metrics

    resting = metrics["resting_heart_rate"]
    assert resting["value"] == 48
    assert resting["low"] == 48 and resting["high"] == 50
    assert resting["average_7d"] == 48
    assert 48 < resting["average"] < 50
    assert resting["window_days"] == 30
    assert metrics["vo2_max"]["window_days"] == 90
    assert metrics["vo2_max"]["days"] > resting["days"]
    assert metrics["heart_rate"]["measured_at"] == "2030-03-10T03:21:00+00:00"

    average = hass.states.get("sensor.sample_resting_heart_rate_30_day_average")
    assert float(average.state) == resting["average"]
    assert average.attributes["average_7d"] == 48

    workout = hass.states.get("sensor.sample_workout_heart_rate")
    assert float(workout.state) == 141
    assert workout.attributes["workout"] == "running"
    assert workout.attributes["max"] == 168
    assert workout.attributes["duration_minutes"] == 42

    bmi = hass.states.get("sensor.sample_body_mass_index")
    assert float(bmi.state) == 24.7
    assert bmi.attributes["category"] == "healthy"


async def test_weight_and_height_in_other_units(hass: HomeAssistant) -> None:
    entry = await setup_entry(hass)
    hass.states.async_set(entity_id("weight"), "176.37", {"unit_of_measurement": "lb"})
    hass.states.async_set(entity_id("height"), "180", {"unit_of_measurement": "cm"})
    await entry.runtime_data.async_refresh()
    metrics = entry.runtime_data.metrics
    assert metrics["weight"]["value"] == 80.0
    assert metrics["height"]["value"] == 1.8
    assert metrics["bmi"]["value"] == 24.7


async def test_a_sync_refreshes_after_a_short_wait(hass: HomeAssistant, freezer) -> None:
    entry = await setup_entry(hass)
    hass.states.async_set(entity_id("resting_heart_rate"), "51", {"unit_of_measurement": "bpm"})
    await hass.async_block_till_done()
    # Several sensors change in one sync, so the figures follow a moment later.
    assert entry.runtime_data.metrics["resting_heart_rate"]["value"] == 48
    freezer.tick(timedelta(seconds=15))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert entry.runtime_data.metrics["resting_heart_rate"]["value"] == 51


async def test_bad_source_data_is_ignored(hass: HomeAssistant) -> None:
    entry = await setup_entry(hass)
    hass.states.async_set(entity_id("heart_rate"), "999", {"unit_of_measurement": "bpm"})
    hass.states.async_set(entity_id("weight"), "unavailable")
    hass.states.async_set(
        entity_id("last_sleep_asleep"),
        "7",
        {"night": "not a date", "start": "x", "end": "y"},
    )
    hass.states.async_set(entity_id("last_workout"), "unknown")
    await entry.runtime_data.async_refresh()
    metrics = entry.runtime_data.metrics
    assert "value" not in metrics.get("heart_rate", {})
    assert "value" not in metrics["weight"]
    assert "bmi" not in metrics
    assert "sleeping_heart_rate" not in metrics
    assert "workout_heart_rate" not in metrics
    # Without a night, "awake today" counts from local midnight (13:00 UTC).
    assert metrics["awake_heart_rate"]["since"] == "2030-03-10T00:00:00+11:00"
    assert hass.states.get("sensor.sample_sleeping_heart_rate").state == "unknown"


async def test_card_reads_the_summary_and_chart_points(hass: HomeAssistant, hass_ws_client) -> None:
    await setup_entry(hass)
    client = await hass_ws_client(hass)
    sensor = "sensor.sample_sleeping_heart_rate"

    await client.send_json_auto_id({"type": "vital_rings/summary", "entity_id": sensor})
    response = await client.receive_json()
    assert response["success"]
    summary = response["result"]
    assert summary["synced"] == "2030-03-10T03:22:00+00:00"
    assert summary["metrics"]["sleeping_heart_rate"]["value"] == 45
    assert summary["metrics"]["bmi"]["category"] == "healthy"

    await client.send_json_auto_id(
        {
            "type": "vital_rings/series",
            "entity_id": sensor,
            "metric": "heart_rate",
            "period": "hour",
            "start": (NOW - timedelta(hours=48)).isoformat(),
        }
    )
    response = await client.receive_json()
    assert response["success"]
    points = response["result"]["points"]
    assert len(points) == 48
    assert points[-1] == {
        "start": int((NOW - timedelta(minutes=90)).timestamp() * 1000),
        "end": int((NOW - timedelta(minutes=30)).timestamp() * 1000),
        "mean": 65,
        "min": 55,
        "max": 90,
    }

    bad_requests = (
        # Not a VitalRings entity.
        {"entity_id": entity_id("heart_rate"), "metric": "weight", "period": "week"},
        # Hourly points for years would be a very large answer.
        {"entity_id": sensor, "metric": "heart_rate", "period": "hour", "days": 400},
        # A metric that is not on the list.
        {"entity_id": sensor, "metric": "steps", "period": "day"},
    )
    for request in bad_requests:
        days = request.pop("days", 30)
        await client.send_json_auto_id(
            {
                "type": "vital_rings/series",
                "start": (NOW - timedelta(days=days)).isoformat(),
                **request,
            }
        )
        response = await client.receive_json()
        assert not response["success"]

    await client.send_json_auto_id(
        {"type": "vital_rings/summary", "entity_id": entity_id("heart_rate")}
    )
    response = await client.receive_json()
    assert response["error"]["code"] == "not_found"


async def test_card_is_served_and_loaded(hass: HomeAssistant, hass_client) -> None:
    with patch("custom_components.vital_rings.frontend.add_extra_js_url") as add_url:
        await setup_entry(hass)
    url = add_url.call_args.args[1]
    assert url.startswith("/vital_rings/vital-rings-card.js?v=")
    client = await hass_client()
    response = await client.get("/vital_rings/vital-rings-card.js")
    assert response.status == 200
    assert "vital-rings-card" in await response.text()


async def test_diagnostics_hold_nothing_personal(hass: HomeAssistant) -> None:
    entry = await setup_entry(hass)
    diagnostics = await async_get_config_entry_diagnostics(hass, entry)
    text = json.dumps(diagnostics)
    # Names of figures, never their values, times or entity ids.
    assert "sleeping_heart_rate" in diagnostics["metrics"]
    for private in ("sensor.", "2030", "24.7", "running", SOURCE_ENTRY_ID):
        assert private not in text


async def test_unload_and_reload(hass: HomeAssistant) -> None:
    entry = await setup_entry(hass)
    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()
    assert hass.states.get("sensor.sample_sleeping_heart_rate").state == "unavailable"
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert float(hass.states.get("sensor.sample_sleeping_heart_rate").state) == 45


async def test_rings_are_scored_against_benchmarks(hass: HomeAssistant) -> None:
    entry = await setup_entry(hass)
    metrics = entry.runtime_data.metrics

    # Resting 48 bpm and 14.5 breaths a minute earn full marks; 66 ms is most of the way.
    assert metrics["resting_heart_rate"]["score"] == 100
    assert metrics["resting_heart_rate"]["full"] == {"direction": "low", "low": 50, "high": None}
    assert metrics["heart_rate_variability"]["score"] == 78
    assert metrics["respiratory_rate"]["score"] == 100
    assert metrics["vitals_score"] == {"value": 93, "rings": 3}

    assert metrics["sleeping_heart_rate"]["score"] == 100
    assert metrics["oxygen_saturation"]["score"] == 100
    # No age or sex given: the mean of the men's and women's 40-49 benchmark.
    assert metrics["vo2_max"]["score"] == 88
    assert metrics["fitness_score"] == {"value": 96, "rings": 3}

    assert float(hass.states.get("sensor.sample_vitals_score").state) == 93
    assert float(hass.states.get("sensor.sample_fitness_score").state) == 96
    assert hass.states.get("sensor.sample_sleeping_heart_rate").attributes["score"] == 100


async def test_age_and_sex_choose_the_vo2_max_benchmark(hass: HomeAssistant) -> None:
    entry = await setup_entry(hass)
    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"birth_year": 1985, "sex": "male"}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()

    # A man of 45 in 2030: 44.2 sits between the median (37.8) and the 75th percentile (45.0).
    vo2 = entry.runtime_data.metrics["vo2_max"]
    assert vo2["score"] == 72
    assert vo2["percentile"] == 72
    assert vo2["full"]["high"] == 55.6

    # Leaving both empty removes them again.
    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(result["flow_id"], {})
    await hass.async_block_till_done()
    assert dict(entry.options) == {}
    assert entry.runtime_data.metrics["vo2_max"]["score"] == 88


async def test_options_reject_an_impossible_year_of_birth(hass: HomeAssistant) -> None:
    entry = await setup_entry(hass)
    result = await hass.config_entries.options.async_init(entry.entry_id)
    for bad in ({"birth_year": 1700}, {"birth_year": 2090}, {"sex": "other"}):
        try:
            result = await hass.config_entries.options.async_configure(result["flow_id"], bad)
        except Exception:  # noqa: BLE001 - the selector may refuse it before the flow does
            continue
        assert result["type"] is FlowResultType.FORM
        assert result["errors"] == {"base": "invalid_person"}


async def test_a_missing_ring_metric_is_left_out_of_its_set(hass: HomeAssistant) -> None:
    entry = await setup_entry(hass, without=("vo2_max", "respiratory_rate"))
    metrics = entry.runtime_data.metrics
    assert "score" not in metrics.get("respiratory_rate", {})
    assert metrics["vitals_score"]["rings"] == 2
    assert metrics["fitness_score"] == {"value": 100, "rings": 2}


async def test_impossible_source_values_do_not_stop_the_figures(hass: HomeAssistant) -> None:
    entry = await setup_entry(hass)
    manager = entry.runtime_data
    # A number too large for a float, a date that does not exist, a night in year 1.
    hass.states.async_set(entity_id("last_workout"), "running", {"heart_rate_avg": 10**400})
    hass.states.async_set(entity_id("last_health_sync"), "2030-02-30T10:00:00+00:00")
    hass.states.async_set(
        entity_id("last_sleep_asleep"),
        "7",
        {
            "night": "0001-01-02",
            "start": "0001-01-01T22:00:00+00:00",
            "end": "0001-01-02T06:00:00+00:00",
        },
    )
    await manager.async_refresh()
    metrics = manager.metrics
    assert metrics["workout_heart_rate"]["value"] is None
    assert "sleeping_heart_rate" not in metrics
    assert manager.synced is None
    # Everything that does not depend on the broken values is still there.
    assert metrics["resting_heart_rate"]["score"] == 100
    assert metrics["bmi"]["value"] == 24.7

    hass.states.async_set(
        entity_id("last_sleep_asleep"),
        "7",
        {
            "night": "2030-03-10",
            "start": "2030-03-09T12:20:00+00:00",
            "end": "2030-02-30T20:10:00+00:00",
        },
    )
    await manager.async_refresh()
    assert "sleeping_heart_rate" not in manager.metrics


async def test_chart_requests_are_bounded(hass: HomeAssistant, hass_ws_client) -> None:
    await setup_entry(hass)
    client = await hass_ws_client(hass)
    request = {"type": "vital_rings/series", "entity_id": "sensor.sample_sleeping_heart_rate"}

    # A date at the edge of the calendar is refused, not an unhandled error.
    await client.send_json_auto_id(
        {**request, "metric": "weight", "period": "month", "start": "0001-01-01T00:00:00"}
    )
    response = await client.receive_json()
    assert response["error"]["code"] == "invalid_format"

    # Each kind of point has its own longest stretch.
    for period, days, accepted in (
        ("day", 399, True),
        ("day", 500, False),
        ("week", 1000, True),
        ("week", 1500, False),
        ("month", 365 * 19, True),
        ("month", 366 * 21, False),
    ):
        await client.send_json_auto_id(
            {
                **request,
                "metric": "weight",
                "period": period,
                "start": (NOW - timedelta(days=days)).isoformat(),
            }
        )
        response = await client.receive_json()
        assert response["success"] is accepted, (period, days)


async def test_config_flow_needs_a_sensible_name(hass: HomeAssistant) -> None:
    add_source(hass)
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    for name in ("   ", "x" * 61):
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], {"name": name, CONF_SOURCE_ENTRY: SOURCE_ENTRY_ID}
        )
        assert result["type"] is FlowResultType.FORM
        assert result["errors"] == {"name": "invalid_name"}


async def test_times_of_day_are_not_recorded(hass: HomeAssistant) -> None:
    await setup_entry(hass)
    from custom_components.vital_rings.sensor import VitalRingsSensor  # noqa: PLC0415

    assert {"start", "end", "since"} <= VitalRingsSensor._unrecorded_attributes
