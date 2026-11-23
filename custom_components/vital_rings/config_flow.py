"""Config flow for VitalRings."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.const import CONF_NAME
from homeassistant.core import callback
from homeassistant.helpers import selector
from homeassistant.util import dt as dt_util

from .const import (
    CONF_BIRTH_YEAR,
    CONF_SEX,
    CONF_SOURCE,
    CONF_SOURCE_ENTRY,
    DOMAIN,
    HEART_RATE,
)
from .scores import SEX_FEMALE, SEX_MALE
from .sources import SOURCES, source_for_domain

DEFAULT_NAME = "Vitals"
OLDEST_AGE = 120
MAX_NAME_LENGTH = 60


def _person_schema(current: dict[str, Any]) -> dict[Any, Any]:
    """Year of birth and sex: both optional, both only for the VO2 max benchmark."""
    this_year = dt_util.now().year
    birth_year = current.get(CONF_BIRTH_YEAR)
    sex = current.get(CONF_SEX)
    return {
        vol.Optional(
            CONF_BIRTH_YEAR,
            description={"suggested_value": birth_year} if birth_year else None,
        ): selector.NumberSelector(
            selector.NumberSelectorConfig(
                mode=selector.NumberSelectorMode.BOX,
                min=this_year - OLDEST_AGE,
                max=this_year,
                step=1,
            )
        ),
        vol.Optional(
            CONF_SEX,
            description={"suggested_value": sex} if sex else None,
        ): selector.SelectSelector(
            selector.SelectSelectorConfig(
                mode=selector.SelectSelectorMode.DROPDOWN,
                options=[SEX_MALE, SEX_FEMALE],
                translation_key="sex",
            )
        ),
    }


def _person_options(user_input: dict[str, Any]) -> dict[str, Any] | None:
    """Check the answers on the server; the selector limits are only a UI hint."""
    options: dict[str, Any] = {}
    if user_input.get(CONF_BIRTH_YEAR) is not None:
        try:
            birth_year = int(user_input[CONF_BIRTH_YEAR])
        except TypeError, ValueError:
            return None
        this_year = dt_util.now().year
        if not this_year - OLDEST_AGE <= birth_year <= this_year:
            return None
        options[CONF_BIRTH_YEAR] = birth_year
    if user_input.get(CONF_SEX):
        if user_input[CONF_SEX] not in (SEX_MALE, SEX_FEMALE):
            return None
        options[CONF_SEX] = user_input[CONF_SEX]
    return options


class VitalRingsConfigFlow(ConfigFlow, domain=DOMAIN):
    """Set up the figures for one person."""

    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> VitalRingsOptionsFlow:
        """Return the options flow."""
        return VitalRingsOptionsFlow()

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Pick whose health data to use: an entry of a supported integration."""
        candidates = [
            entry
            for source in SOURCES.values()
            for entry in self.hass.config_entries.async_entries(source.domain)
        ]
        if not candidates:
            return self.async_abort(reason="no_source")

        errors: dict[str, str] = {}
        if user_input is not None:
            entry = self.hass.config_entries.async_get_entry(user_input[CONF_SOURCE_ENTRY])
            source = source_for_domain(entry.domain) if entry is not None else None
            options = _person_options(user_input)
            name = str(user_input.get(CONF_NAME, "")).strip()
            if not 0 < len(name) <= MAX_NAME_LENGTH:
                errors[CONF_NAME] = "invalid_name"
            elif entry is None or source is None:
                errors[CONF_SOURCE_ENTRY] = "not_a_source"
            elif HEART_RATE not in source.entities(self.hass, entry.entry_id):
                errors[CONF_SOURCE_ENTRY] = "no_heart_rate"
            elif options is None:
                errors["base"] = "invalid_person"
            else:
                await self.async_set_unique_id(entry.entry_id)
                self._abort_if_unique_id_configured()
                return self.async_create_entry(
                    title=name,
                    data={CONF_SOURCE: source.key, CONF_SOURCE_ENTRY: entry.entry_id},
                    options=options,
                )

        schema = vol.Schema(
            {
                vol.Required(CONF_NAME, default=DEFAULT_NAME): selector.TextSelector(),
                vol.Required(CONF_SOURCE_ENTRY): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        mode=selector.SelectSelectorMode.DROPDOWN,
                        options=[
                            selector.SelectOptionDict(value=entry.entry_id, label=entry.title)
                            for entry in candidates
                        ],
                    )
                ),
                **_person_schema({}),
            }
        )
        return self.async_show_form(
            step_id="user",
            data_schema=self.add_suggested_values_to_schema(schema, user_input),
            errors=errors,
        )


class VitalRingsOptionsFlow(OptionsFlow):
    """Change the year of birth and sex used for the VO2 max benchmark."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Show the two optional fields; leaving one empty removes it."""
        errors: dict[str, str] = {}
        if user_input is not None:
            options = _person_options(user_input)
            if options is not None:
                return self.async_create_entry(data=options)
            errors["base"] = "invalid_person"
        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(_person_schema(dict(self.config_entry.options))),
            errors=errors,
        )
