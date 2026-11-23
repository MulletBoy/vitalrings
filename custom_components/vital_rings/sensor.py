"""Sensors for the figures VitalRings works out."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from homeassistant.components.sensor import (
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import (
    AWAKE_HEART_RATE,
    AWAKE_HEART_RATE_PREVIOUS,
    BMI,
    DOMAIN,
    FITNESS_SCORE,
    HEART_RATE_VARIABILITY,
    RESTING_HEART_RATE,
    SLEEPING_HEART_RATE,
    VITALS_SCORE,
    WORKOUT_HEART_RATE,
)
from .manager import VitalRingsConfigEntry, VitalRingsManager

BPM = "bpm"


@dataclass(frozen=True, kw_only=True)
class VitalRingsSensorDescription(SensorEntityDescription):
    """Describes a VitalRings sensor: which metric, which field, which extras."""

    metric: str
    field: str = "value"
    attributes: tuple[str, ...] = ()


SENSORS: tuple[VitalRingsSensorDescription, ...] = (
    VitalRingsSensorDescription(
        key="vitals_score",
        translation_key="vitals_score",
        metric=VITALS_SCORE,
        attributes=("rings",),
    ),
    VitalRingsSensorDescription(
        key="fitness_score",
        translation_key="fitness_score",
        metric=FITNESS_SCORE,
        attributes=("rings",),
    ),
    VitalRingsSensorDescription(
        key="sleeping_heart_rate",
        translation_key="sleeping_heart_rate",
        metric=SLEEPING_HEART_RATE,
        native_unit_of_measurement=BPM,
        attributes=("score", "lowest", "highest", "hours", "night"),
    ),
    VitalRingsSensorDescription(
        key="awake_heart_rate",
        translation_key="awake_heart_rate",
        metric=AWAKE_HEART_RATE,
        native_unit_of_measurement=BPM,
        attributes=("lowest", "highest", "hours", "since"),
    ),
    VitalRingsSensorDescription(
        key="awake_heart_rate_previous_day",
        translation_key="awake_heart_rate_previous_day",
        metric=AWAKE_HEART_RATE_PREVIOUS,
        native_unit_of_measurement=BPM,
        attributes=("lowest", "highest", "hours", "start", "end"),
    ),
    VitalRingsSensorDescription(
        key="resting_heart_rate_average",
        translation_key="resting_heart_rate_average",
        metric=RESTING_HEART_RATE,
        field="average",
        native_unit_of_measurement=BPM,
        attributes=("average_7d", "low", "high", "days"),
    ),
    VitalRingsSensorDescription(
        key="heart_rate_variability_average",
        translation_key="heart_rate_variability_average",
        metric=HEART_RATE_VARIABILITY,
        field="average",
        native_unit_of_measurement="ms",
        attributes=("average_7d", "low", "high", "days"),
    ),
    VitalRingsSensorDescription(
        key="workout_heart_rate",
        translation_key="workout_heart_rate",
        metric=WORKOUT_HEART_RATE,
        native_unit_of_measurement=BPM,
        attributes=("max", "min", "workout", "start", "end", "duration_minutes"),
    ),
    VitalRingsSensorDescription(
        key="bmi",
        translation_key="bmi",
        metric=BMI,
        attributes=("category",),
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: VitalRingsConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add the sensors of one config entry."""
    manager = entry.runtime_data
    async_add_entities(VitalRingsSensor(manager, description) for description in SENSORS)


class VitalRingsSensor(SensorEntity):
    """One figure, kept current by the manager."""

    entity_description: VitalRingsSensorDescription
    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_suggested_display_precision = 0
    # When you fell asleep, woke up or trained is shown live, not kept in the history.
    _unrecorded_attributes = frozenset({"start", "end", "since"})

    def __init__(
        self, manager: VitalRingsManager, description: VitalRingsSensorDescription
    ) -> None:
        """Initialise the sensor."""
        self.entity_description = description
        self._manager = manager
        entry = manager.entry
        self._attr_unique_id = f"{entry.entry_id}_{description.key}"
        if description.key == "bmi":
            self._attr_suggested_display_precision = 1
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=entry.title,
            manufacturer="VitalRings",
            model="Heart, vitals and body",
            entry_type=DeviceEntryType.SERVICE,
        )

    async def async_added_to_hass(self) -> None:
        """Follow the manager."""
        self.async_on_remove(self._manager.async_add_listener(self._handle_update))

    @callback
    def _handle_update(self) -> None:
        self.async_write_ha_state()

    @property
    def native_value(self) -> Any:
        """Return the figure."""
        description = self.entity_description
        return self._manager.value(description.metric, description.field)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        """Return the details that belong to the figure."""
        description = self.entity_description
        values = self._manager.metrics.get(description.metric)
        if not values:
            return None
        return {name: values.get(name) for name in description.attributes if name in values}
