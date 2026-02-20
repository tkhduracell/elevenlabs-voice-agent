class ElevenLabsAgentPanel extends HTMLElement {
  constructor() {
    super();
    this._agentId = null;
    this._scriptLoaded = false;
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

  async _render() {
    if (!this._agentId) return;

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
        .elevenlabs-error {
          font-family: var(--paper-font-body1_-_font-family, "Roboto", sans-serif);
          color: var(--error-color, #db4437);
          font-size: 16px;
          text-align: center;
          padding: 16px;
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
        </style>
        <div class="elevenlabs-container">
          <elevenlabs-convai agent-id="${this._agentId}"></elevenlabs-convai>
        </div>
      `;
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
