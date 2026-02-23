class ElevenLabsAgentPanel extends HTMLElement {
  constructor() {
    super();
    this._agentId = null;
    this._scriptLoaded = false;
    this._shadowPollInterval = null;
  }

  set panel(panel) {
    if (panel && panel.config && panel.config.agent_id) {
      this._agentId = panel.config.agent_id;
      this._render();
    }
  }

  set hass(hass) {
    this._hass = hass;
  }

  _loadScript() {
    if (this._scriptLoaded) return Promise.resolve();

    return new Promise((resolve, reject) => {
      if (customElements.get("elevenlabs-convai")) {
        this._scriptLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src =
        "https://unpkg.com/@elevenlabs/convai-widget-embed@latest/dist/index.js";
      script.async = true;
      script.onload = () => {
        this._scriptLoaded = true;
        resolve();
      };
      script.onerror = () =>
        reject(new Error("Failed to load ElevenLabs widget script"));
      document.head.appendChild(script);
    });
  }

  _injectShadowStyles() {
    if (this._shadowPollInterval) {
      clearInterval(this._shadowPollInterval);
    }

    const widget = this.querySelector("elevenlabs-convai");
    if (!widget) return;

    let attempts = 0;
    const maxAttempts = 50;

    this._shadowPollInterval = setInterval(() => {
      attempts++;
      const shadow = widget.shadowRoot;

      if (shadow) {
        clearInterval(this._shadowPollInterval);
        this._shadowPollInterval = null;

        const style = document.createElement("style");
        style.textContent = `
          :host {
            position: absolute !important;
            inset: 0 !important;
          }

          .overlay {
            --el-overlay-padding: 0px !important;
            padding: 0 !important;
          }

          [data-variant="expanded"].sheet,
          [data-variant="compact"].sheet,
          [data-variant="fullscreen"].sheet {
            border-radius: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: 100% !important;
            max-height: 100% !important;
            margin: 0 !important;
            bottom: 0 !important;
          }
        `;
        shadow.appendChild(style);
        return;
      }

      if (attempts >= maxAttempts) {
        clearInterval(this._shadowPollInterval);
        this._shadowPollInterval = null;
        console.warn("ElevenLabs widget: could not access shadowRoot after 5s");
      }
    }, 100);
  }

  async _fetchDebugConfig() {
    const el = this.querySelector("#debug-config");
    if (!el) return;
    try {
      const resp = await fetch(
        `https://api.elevenlabs.io/v1/convai/agents/${this._agentId}/widget`
      );
      const data = await resp.json();
      el.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      el.textContent = "Failed to fetch config: " + err.message;
    }
  }

  async _render() {
    if (!this._agentId) return;

    if (!window.isSecureContext) {
      this.innerHTML = `
        <style>
          elevenlabs-agent-panel {
            display: block;
            width: 100%;
            height: 100%;
            background-color: var(--primary-background-color, #fafafa);
          }
          .elevenlabs-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100vh;
            font-family: var(--paper-font-body1_-_font-family, "Roboto", sans-serif);
            color: var(--error-color, #db4437);
            font-size: 16px;
            text-align: center;
            padding: 16px;
            box-sizing: border-box;
          }
        </style>
        <div class="elevenlabs-error">
          <strong>HTTPS Required</strong><br>
          The voice agent requires a secure (HTTPS) connection to access the microphone.<br>
          Please configure Home Assistant with SSL/TLS or access it via HTTPS.
        </div>
      `;
      return;
    }

    this.innerHTML = `
      <style>
        elevenlabs-agent-panel {
          display: block;
          width: 100%;
          height: 100%;
          background-color: var(--primary-background-color, #fafafa);
        }
        .elevenlabs-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100vh;
          box-sizing: border-box;
        }
        .elevenlabs-loading {
          font-family: var(--paper-font-body1_-_font-family, "Roboto", sans-serif);
          color: var(--primary-text-color, #333);
          font-size: 16px;
        }
      </style>
      <div class="elevenlabs-container">
        <span class="elevenlabs-loading">Loading voice agent...</span>
      </div>
    `;

    try {
      await this._loadScript();

      this.innerHTML = `
        <style>
          elevenlabs-agent-panel {
            display: block;
            width: 100%;
            overflow-y: auto;
            background-color: var(--primary-background-color, #fafafa);
          }
          .elevenlabs-container {
            position: relative;
            width: 100%;
            height: 100vh;
            overflow: hidden;
            box-sizing: border-box;
          }
          .elevenlabs-debug {
            padding: 16px;
            font-family: monospace;
            font-size: 12px;
            color: var(--primary-text-color, #ccc);
            background: var(--primary-background-color, #111);
          }
          .elevenlabs-debug h3 {
            margin: 0 0 8px 0;
            font-size: 14px;
          }
          .elevenlabs-debug pre {
            white-space: pre-wrap;
            word-break: break-all;
            margin: 0;
          }
        </style>
        <div class="elevenlabs-container">
          <elevenlabs-convai agent-id="${this._agentId}" always-expanded="true" default-expanded="true"></elevenlabs-convai>
        </div>
        <div class="elevenlabs-debug">
          <h3>Agent Widget Config</h3>
          <pre id="debug-config">Loading...</pre>
        </div>
      `;

      this._injectShadowStyles();
      this._fetchDebugConfig();
    } catch (err) {
      this.innerHTML = `
        <style>
          elevenlabs-agent-panel { display: block; width: 100%; height: 100%; }
          .elevenlabs-error {
            display: flex; align-items: center; justify-content: center;
            width: 100%; height: 100vh;
            font-family: var(--paper-font-body1_-_font-family, "Roboto", sans-serif);
            color: var(--error-color, #db4437);
            font-size: 16px; text-align: center; padding: 16px;
          }
        </style>
        <div class="elevenlabs-error">
          Failed to load ElevenLabs voice agent widget.<br>
          Please check your network connection.
        </div>
      `;
    }
  }
}

customElements.define("elevenlabs-agent-panel", ElevenLabsAgentPanel);
