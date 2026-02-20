"""ElevenLabs Voice Agent integration for Home Assistant."""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

from .const import (
    CONF_AGENT_ID,
    DOMAIN,
    PANEL_FRONTEND_URL_PATH,
    PANEL_ICON,
    PANEL_TITLE,
    PANEL_URL,
)

_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the ElevenLabs Voice Agent integration."""
    hass.data.setdefault(DOMAIN, {})
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up ElevenLabs Voice Agent from a config entry."""
    agent_id = entry.data[CONF_AGENT_ID]

    # Register the frontend directory as a static path
    frontend_path = str(Path(__file__).parent / "frontend")
    await hass.http.async_register_static_paths(
        [StaticPathConfig(PANEL_URL, frontend_path, cache_headers=False)]
    )

    # Load custom icon set at frontend startup
    add_extra_js_url(hass, f"{PANEL_URL}/icons.js")

    # Register the sidebar panel
    await panel_custom.async_register_panel(
        hass,
        webcomponent_name="elevenlabs-agent-panel",
        frontend_url_path=PANEL_FRONTEND_URL_PATH,
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        module_url=f"{PANEL_URL}/elevenlabs-agent-panel.js",
        embed_iframe=False,
        require_admin=False,
        config={"agent_id": agent_id},
    )

    hass.data[DOMAIN][entry.entry_id] = {"agent_id": agent_id}
    _LOGGER.info("ElevenLabs Voice Agent panel registered as '%s'", PANEL_TITLE)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    frontend.async_remove_panel(hass, PANEL_FRONTEND_URL_PATH)
    hass.data[DOMAIN].pop(entry.entry_id, None)
    return True
