"""Config flow for ElevenLabs Voice Agent integration."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
import voluptuous as vol

from .const import CONF_AGENT_ID, DOMAIN

STEP_USER_DATA_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_AGENT_ID): str,
    }
)


class ElevenLabsAgentConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for ElevenLabs Voice Agent."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the initial step -- collect agent ID."""
        errors: dict[str, str] = {}

        if user_input is not None:
            agent_id = user_input[CONF_AGENT_ID].strip()

            if not agent_id:
                errors[CONF_AGENT_ID] = "invalid_agent_id"
            else:
                await self.async_set_unique_id(agent_id)
                self._abort_if_unique_id_configured()

                return self.async_create_entry(
                    title=f"ElevenLabs Agent ({agent_id[:8]}...)",
                    data={CONF_AGENT_ID: agent_id},
                )

        return self.async_show_form(
            step_id="user",
            data_schema=STEP_USER_DATA_SCHEMA,
            errors=errors,
        )
