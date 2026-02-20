# ElevenLabs Voice Agent for Home Assistant

## Home Assistant

Home Assistant is an open-source home automation platform that runs on Python. It tracks the state of all devices and services in a home and provides a UI for control and automation.

### Core Architecture

Home Assistant's core consists of four interconnected components:

- **Event Bus** — Central communication channel. All components broadcast and listen for events (e.g. `state_changed`, `call_service`, `time_changed`, `homeassistant_stop`).
- **State Machine** — Maintains current state of every entity. Fires `state_changed` events when state updates. States are stored in memory and accessed synchronously.
- **Service Registry** — Registers callable services and responds to `call_service` events on the bus. Services are how automations and the UI trigger actions.
- **Timer** — Fires `time_changed` events every second, providing a heartbeat for time-based automations.

### Entity / Device / Area Model

- **Entity** — The atomic unit. Has exactly one state value (e.g. `on`, `21.5`, `open`) and optional attributes (brightness, unit_of_measurement, friendly_name, device_class). Each entity has a unique `entity_id` in the format `<domain>.<object_id>` (e.g. `sensor.living_room_temperature`).
- **Device** — A physical or logical unit containing one or more entities. Has an ID, manufacturer, model, firmware version, and is matched via identifiers or connections (serial numbers, MAC addresses).
- **Area** — A logical room grouping of devices and entities. Areas can be assigned to floors for multi-level organization.

---

## Home Assistant Integrations

Integrations extend Home Assistant with support for devices, services, and platforms. They are Python packages placed in `custom_components/<domain>/`.

### Directory Structure

    custom_components/<domain>/
      __init__.py          # Required — main integration module
      manifest.json        # Required — integration metadata
      config_flow.py       # Optional — UI-based configuration wizard
      const.py             # Optional — shared constants
      sensor.py            # Optional — sensor entity platform
      switch.py            # Optional — switch entity platform
      binary_sensor.py     # Optional — binary sensor platform
      light.py             # Optional — light platform
      services.yaml        # Optional — service definitions
      strings.json         # Optional — UI strings
      translations/        # Optional — localized strings
        en.json

### manifest.json

Describes the integration. Key fields:

| Field | Description |
|---|---|
| `domain` | Unique identifier (matches directory name) |
| `name` | Display name in the UI |
| `version` | Semver version string |
| `config_flow` | `true` if the integration has a config flow UI |
| `documentation` | URL to docs |
| `issue_tracker` | URL to bug tracker |
| `codeowners` | GitHub usernames of maintainers |
| `requirements` | External PyPI packages needed at runtime |
| `dependencies` | Other HA integrations required |
| `iot_class` | How the integration communicates (see below) |

### IoT Class

| Class | Description |
|---|---|
| `local_push` | Communicates locally; device/service pushes updates to HA |
| `local_polling` | Communicates locally; HA polls for updates |
| `cloud_push` | Communicates via cloud; pushes updates |
| `cloud_polling` | Communicates via cloud; HA polls |
| `assumed_state` | Cannot determine actual state; assumes last command |
| `calculated` | Derives values from other data; no direct communication |

### Setup Lifecycle

Two entry points:

- **`async_setup(hass, config)`** — Called once on HA startup. Receives the full YAML configuration.
- **`async_setup_entry(hass, entry)`** — Called when a config entry is created or loaded. This is the modern approach. Paired with `async_unload_entry()`.

### Config Flow

Defined in `config_flow.py`. Subclass `ConfigFlow` and implement `async_step_user()`. Each step either shows a form or creates an entry. Prevents duplicates via `async_set_unique_id()`.

### Entity Platforms

Platform files define entity classes inheriting from domain base classes (`SensorEntity`, `SwitchEntity`, etc.). Set `_attr_unique_id`, `_attr_name`, and implement domain-specific properties.

### Data Fetching Patterns

- **Push model** — Subscribe to events/callbacks, call `async_write_ha_state()`.
- **Polling model** — Set `should_poll = True` and implement `async_update()`.
- **DataUpdateCoordinator** — Shared polling coordinator for multiple entities.

---

## HACS (Home Assistant Community Store)

HACS is a custom integration for discovering, installing, and managing community-made integrations.

### Repository Requirements

- Public GitHub repository
- Descriptive README
- Integration files in `custom_components/<DOMAIN>/`
- One integration per repository
- `hacs.json` in the repo root
- `manifest.json` with required fields

---

## This Repository — ElevenLabs Voice Agent

Embeds an ElevenLabs conversational AI voice agent as a Home Assistant sidebar panel called "Ringer". Users configure their ElevenLabs agent ID, and the integration registers a custom panel that loads the ElevenLabs widget from CDN.

- **Domain:** `elevenlabs_agent`
- **IoT Class:** `cloud_polling`
- **Version:** 1.0.0
- **Codeowner:** @tkhduracell
- **No external Python dependencies** (uses HA built-in components only)
- **HA Dependencies:** `http`, `frontend`, `panel_custom`

### Repository Structure

    ├── custom_components/elevenlabs_agent/
    │   ├── __init__.py                     # Integration setup: static path, icons, panel registration
    │   ├── config_flow.py                  # Config flow: collects ElevenLabs agent ID
    │   ├── const.py                        # Constants: domain, panel URL/path/title/icon
    │   ├── manifest.json                   # Integration metadata
    │   ├── strings.json                    # UI strings for config flow
    │   ├── frontend/
    │   │   ├── elevenlabs-agent-panel.js   # Web Component: loads and renders ElevenLabs widget
    │   │   └── icons.js                    # Custom "elevenlabs" icon set registration
    │   └── translations/
    │       └── en.json                     # English translations
    ├── hacs.json                           # HACS metadata
    ├── pyproject.toml                      # Ruff + MyPy configuration
    └── README.md

### File Breakdown

#### `const.py`

Defines all shared constants:

| Constant | Value | Purpose |
|---|---|---|
| `DOMAIN` | `elevenlabs_agent` | Integration domain identifier |
| `CONF_AGENT_ID` | `agent_id` | Config entry key for the ElevenLabs agent ID |
| `PANEL_URL` | `/elevenlabs_agent_panel` | Static path where frontend files are served |
| `PANEL_FRONTEND_URL_PATH` | `elevenlabs-agent` | URL path for the sidebar panel |
| `PANEL_TITLE` | `Ringer` | Sidebar display name |
| `PANEL_ICON` | `elevenlabs:agent` | Custom icon reference |

#### `__init__.py`

Integration entry point with two functions:

- **`async_setup_entry(hass, entry)`** — Registers the `frontend/` directory as a static path at `PANEL_URL`, loads `icons.js` via `add_extra_js_url()`, and registers a custom sidebar panel via `panel_custom.async_register_panel()` with the agent ID passed as panel config.
- **`async_unload_entry(hass, entry)`** — Removes the panel via `frontend.async_remove_panel()` and cleans up `hass.data`.

#### `config_flow.py`

**`ElevenLabsAgentConfigFlow`** (VERSION = 1):

- Single step (`async_step_user`): shows a form collecting `agent_id`
- Validates the ID is non-empty after stripping whitespace
- Calls `async_set_unique_id(agent_id)` + `_abort_if_unique_id_configured()` to prevent duplicates
- Creates a config entry titled `"ElevenLabs Agent ({first_8_chars}...)"`

#### `frontend/elevenlabs-agent-panel.js`

Web Component class `ElevenLabsAgentPanel` extending `HTMLElement`:

- **`panel` setter** — Receives config with `agent_id` from HA, triggers render
- **`hass` setter** — Receives Home Assistant instance (stored but not currently used)
- **`_loadScript()`** — Dynamically loads `@elevenlabs/convai-widget-embed` from unpkg CDN. Checks if `elevenlabs-convai` custom element already exists to avoid duplicate loads.
- **`_render()`** — Three states:
  1. Loading: shows "Loading voice agent..." text
  2. Success: renders `<elevenlabs-convai agent-id="...">` widget
  3. Error: shows error message with network check suggestion
- Uses HA CSS variables (`--primary-background-color`, `--primary-text-color`, `--error-color`) for theming

#### `frontend/icons.js`

Registers a custom icon set named `"elevenlabs"` with a single `"agent"` icon (SVG path). Uses `customIconsets` on the HA `window` object.

#### `strings.json` / `translations/en.json`

Config flow UI text: step title ("Configure ElevenLabs Voice Agent"), description with instructions to find the agent ID in the ElevenLabs dashboard, field label ("Agent ID"), and error/abort messages.

### CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push to `main` and PRs to `main`:

| Job | Tool | What it checks |
|---|---|---|
| hassfest | `home-assistant/actions/hassfest@master` | Integration structure, manifest validity |
| hacs | `hacs/action@main` | HACS repository requirements |
| ruff | `ruff` | Linting (`ruff check .`) and formatting (`ruff format --check .`) |
| mypy | `mypy` + `homeassistant-stubs` | Type checking with strict mode |

### Quick Reference

```bash
# Setup dev environment
python3.12 -m venv .venv && .venv/bin/pip install -q -r requirements_dev.txt

# Lint
ruff check .

# Format check / auto-format
ruff format --check .
ruff format .

# Type check
mypy custom_components/elevenlabs_agent
```

- Python target: 3.12
- Docstring convention: Google
- Ruff config: `pyproject.toml` (ALL rules with targeted ignores for HA patterns)
- MyPy config: `pyproject.toml` (strict mode with HA-specific relaxations)
