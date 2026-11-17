/* Battery Card v2 - visual editor, multiple devices, charging status.
 * No build step or external dependencies; designed for HACS Lovelace resources.
 */
(() => {
  "use strict";

  const POSITIONS = [
    "top-left", "top-center", "top-right",
    "middle-left", "middle-center", "middle-right",
    "bottom-left", "bottom-center", "bottom-right"
  ];
  const FIELDS = ["name", "image", "level", "status"];
  const DEFAULT_POSITIONS = {
    name: "top-center", image: "middle-center",
    level: "bottom-center", status: "bottom-center"
  };
  const PRESETS = {
    default: DEFAULT_POSITIONS,
    bottom: { name: "middle-center", image: "top-center", level: "bottom-center", status: "bottom-center" },
    left: { name: "top-center", image: "middle-left", level: "middle-right", status: "bottom-center" },
    right: { name: "top-center", image: "middle-right", level: "middle-left", status: "bottom-center" },
    top: { name: "top-center", image: "bottom-center", level: "middle-center", status: "middle-center" },
    line_left: { name: "middle-left", image: "middle-right", level: "bottom-left", status: "bottom-left" },
    line_right: { name: "middle-right", image: "middle-left", level: "bottom-right", status: "bottom-right" }
  };
  const POSITION_LABELS = {
    "top-left": "Oben links", "top-center": "Oben Mitte", "top-right": "Oben rechts",
    "middle-left": "Mitte links", "middle-center": "Mitte", "middle-right": "Mitte rechts",
    "bottom-left": "Unten links", "bottom-center": "Unten Mitte", "bottom-right": "Unten rechts"
  };
  const html = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
  const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));
  const entriesOf = (cfg) => {
    if (Array.isArray(cfg.entities)) return cfg.entities.map((item) =>
      typeof item === "string" ? { entity: item } : { ...item });
    if (cfg.entity) return [{ entity: cfg.entity, name: cfg.name,
      charging_entity: cfg.charging_entity, charging_on_state: cfg.charging_on_state }];
    return [];
  };
  const styleOf = (items) => Array.isArray(items) ? items.map((part) => {
    if (typeof part !== "string") return "";
    return part.replace(/^size\s*:/i, "width:");
  }).join(";") : "";
  const stateOf = (hass, id) => id && hass && hass.states ? hass.states[id] : undefined;
  const batteryOf = (value) => {
    if (value == null || ["unknown", "unavailable", ""].includes(String(value).toLowerCase())) return null;
    const n = parseFloat(String(value).replace(",", "."));
    return Number.isFinite(n) ? clamp(n, 0, 100) : null;
  };
  function chargingOf(hass, item) {
    if (!item.charging_entity) return null;
    const state = stateOf(hass, item.charging_entity);
    if (!state) return null;
    const raw = String(state.state || "").trim().toLowerCase();
    const norm = raw.replace(/[\s-]+/g, "_");
    if (item.charging_on_state) return raw === String(item.charging_on_state).trim().toLowerCase();
    if (["on", "charging", "true", "1", "yes", "laden", "lädt", "plugged_in"].includes(norm)) return true;
    if (["off", "discharging", "not_charging", "false", "0", "no", "battery", "not_plugged_in", "idle", "full"].includes(norm)) return false;
    return null;
  }
  function colorOf(level, cfg) {
    if (level === null) return "var(--secondary-text-color, #888)";
    if (level <= Number(cfg.low_threshold ?? 20)) return "var(--error-color, #e53935)";
    if (level <= Number(cfg.warn_threshold ?? 50)) return "var(--warning-color, #f4a62a)";
    return "var(--success-color, #43a047)";
  }
  function iconOf(level, charging, cfg) {
    const color = colorOf(level, cfg);
    const percent = level === null ? 0 : level;
    const mode = cfg.battery_style || "bar";
    const rounded = Math.min(100, Math.max(10, Math.round(percent / 10) * 10));
    const mdi = level === null ? "mdi:battery-unknown" :
      charging ? (rounded >= 100 ? "mdi:battery-charging-100" : "mdi:battery-charging-" + rounded) :
      percent <= 5 ? "mdi:battery-outline" : rounded >= 100 ? "mdi:battery" : "mdi:battery-" + rounded;
    const bar = '<div class="battery-outline" role="img" aria-label="Batterie ' +
      (level === null ? "unbekannt" : percent + " Prozent") +
      '"><div class="battery-fill" style="width:' + percent + '%;background:' + color +
      '"></div>' + (charging === true ? '<span class="bolt">⚡</span>' : "") + '</div>';
    const symbol = '<ha-icon class="battery-icon" icon="' + mdi + '" style="color:' + color + '"></ha-icon>';
    return '<div class="battery-visual">' + (mode === "icon" ? symbol :
      mode === "both" ? symbol + bar : bar) + '</div>';
  }

  class BatteryCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }
    static getConfigElement() { return document.createElement("battery-card-editor"); }
    static getStubConfig(hass) {
      const ids = Object.keys((hass && hass.states) || {});
      const candidate = ids.find((id) =>
        hass.states[id].attributes.device_class === "battery") ||
        ids.find((id) => /_battery(_level)?$/.test(id)) || "";
      return { entities: [{ entity: candidate }], view: "list", layout: "default", battery_style: "bar" };
    }
    setConfig(config) {
      if (!config || (!config.entity && !Array.isArray(config.entities))) {
        throw new Error("Battery Card: entity oder entities konfigurieren.");
      }
      this._config = config;
      this._render();
    }
    set hass(hass) {
      this._hass = hass;
      this._render();
    }
    getCardSize() { return Math.max(1, entriesOf(this._config || {}).length * 2); }
    _render() {
      if (!this._hass || !this._config) return;
      const cfg = this._config;
      const items = entriesOf(cfg);
      const preset = PRESETS[cfg.layout] || DEFAULT_POSITIONS;
      const placement = { ...preset, ...(cfg.positions || {}) };
      const view = cfg.view === "grid" ? "grid" : "list";
      const count = clamp(cfg.columns || 2, 1, 4);
      const cardStyle = styleOf(cfg.styles && cfg.styles.card);
      const nameStyle = styleOf(cfg.styles && cfg.styles.name);
      const valueStyle = styleOf(cfg.styles && cfg.styles.state);
      const imageStyle = styleOf(cfg.styles && cfg.styles.image);
      const gap = html(cfg.rowGap || "12px");
      const columnGap = html(cfg.columnGap || gap);
      const rendered = items.map((item) => {
        if (!item.entity) return '<div class="missing">Bitte Batteriesensor auswählen</div>';
        const entity = stateOf(this._hass, item.entity);
        const level = entity ? batteryOf(entity.state) : null;
        const charging = chargingOf(this._hass, item);
        const name = item.name || (entity && entity.attributes.friendly_name) || item.entity;
        const chargeStatus = charging === true ? "Lädt" :
          charging === false ? "Lädt nicht" : "Ladestatus unbekannt";
        const fields = {
          name: '<span class="device-name" style="' + html(nameStyle) + '">' + html(name) + '</span>',
          image: '<span style="' + html(imageStyle) + '">' + iconOf(level, charging, cfg) + '</span>',
          level: '<span class="device-level" style="color:' + colorOf(level, cfg) + ";" +
            html(valueStyle) + '">' + (level === null ? "—" : level + "%") + '</span>',
          status: '<span class="charge-status">' + html(chargeStatus) + '</span>'
        };
        const parts = {};
        for (const field of FIELDS) {
          if (cfg["show_" + field] === false) continue;
          if (field === "status" && !item.charging_entity) continue;
          const slot = POSITIONS.includes(placement[field]) ? placement[field] : DEFAULT_POSITIONS[field];
          (parts[slot] ||= []).push(fields[field]);
        }
        const slots = POSITIONS.map((slot) =>
          '<div class="slot ' + slot + '">' + (parts[slot] || []).join("") + '</div>').join("");
        const issue = !entity ? '<div class="missing">Nicht verfügbar: ' + html(item.entity) + '</div>' : "";
        return '<div class="battery-device">' + '<div class="slots">' + slots + '</div>' + issue + '</div>';
      }).join("");
      this.shadowRoot.innerHTML =
        '<style>' +
        ':host{display:block;--bc-radius:var(--ha-card-border-radius,12px)}' +
        'ha-card{height:100%;box-sizing:border-box}' +
        '.battery-list{display:grid;grid-template-columns:repeat(' + (view === "grid" ? count : 1) +
        ',minmax(0,1fr));gap:' + columnGap + ';padding:12px}' +
        '.battery-device{min-width:0;min-height:82px;border-radius:var(--bc-radius);' +
        'background:var(--secondary-background-color,rgba(128,128,128,.07));padding:12px;box-sizing:border-box}' +
        '.slots{display:grid;grid-template-areas:"top-left top-center top-right" ' +
        '"middle-left middle-center middle-right" "bottom-left bottom-center bottom-right";' +
        'grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);grid-template-rows:auto auto auto;' +
        'align-items:center;row-gap:' + gap + ';column-gap:6px;min-height:60px}' +
        '.slot{min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px}' +
        '.slot.top-left,.slot.middle-left,.slot.bottom-left{align-items:flex-start;text-align:left}' +
        '.slot.top-right,.slot.middle-right,.slot.bottom-right{align-items:flex-end;text-align:right}' +
        '.top-left{grid-area:top-left}.top-center{grid-area:top-center}.top-right{grid-area:top-right}' +
        '.middle-left{grid-area:middle-left}.middle-center{grid-area:middle-center}.middle-right{grid-area:middle-right}' +
        '.bottom-left{grid-area:bottom-left}.bottom-center{grid-area:bottom-center}.bottom-right{grid-area:bottom-right}' +
        '.device-name{font-size:16px;font-weight:600;overflow-wrap:anywhere}.device-level{font-size:22px;font-weight:600}' +
        '.charge-status{font-size:12px;color:var(--secondary-text-color);white-space:nowrap}' +
        '.battery-visual{display:flex;align-items:center;justify-content:center;gap:10px}' +
        '.battery-outline{width:64px;height:27px;position:relative;border:2px solid var(--primary-text-color);' +
        'border-radius:5px;padding:3px;box-sizing:border-box;display:flex;align-items:stretch}' +
        '.battery-outline:after{content:"";position:absolute;right:-6px;top:8px;width:4px;height:8px;' +
        'background:var(--primary-text-color);border-radius:0 2px 2px 0}' +
        '.battery-fill{border-radius:2px;transition:width .2s ease}.battery-icon{--mdc-icon-size:36px}' +
        '.bolt{position:absolute;inset:0;text-align:center;font-size:21px;line-height:22px;color:var(--primary-text-color)}' +
        '.missing{font-size:12px;color:var(--error-color,#e53935);text-align:center;margin-top:8px}' +
        '@media(max-width:380px){.battery-list{grid-template-columns:1fr}}' +
        '</style><ha-card style="' + html(cardStyle) + '"><div class="battery-list">' +
        (items.length ? rendered : '<div class="missing">Im Editor eine Batterie hinzufügen.</div>') +
        '</div></ha-card>';
    }
  }

  class BatteryCardEditor extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }
    setConfig(config) {
      this._config = { ...config, entities: entriesOf(config) };
      this._render();
    }
    set hass(hass) {
      this._hass = hass;
      this.shadowRoot.querySelectorAll("ha-entity-picker").forEach((picker) => { picker.hass = hass; });
    }
    _emit() {
      this.dispatchEvent(new CustomEvent("config-changed", {
        detail: { config: { ...this._config } }, bubbles: true, composed: true
      }));
    }
    _set(key, value) {
      this._config = { ...this._config, [key]: value };
      this._emit();
    }
    _setEntry(i, key, value) {
      const entities = this._config.entities.map((item, n) =>
        n === i ? { ...item, [key]: value } : item);
      this._config = { ...this._config, entities };
      this._emit();
    }
    _positions() {
      return { ...(PRESETS[this._config.layout] || DEFAULT_POSITIONS), ...(this._config.positions || {}) };
    }
    _render() {
      if (!this._config) return;
      const cfg = this._config;
      const options = (choices, selected) => choices.map(([value, label]) =>
        '<option value="' + html(value) + '"' + (value === selected ? " selected" : "") +
        '>' + html(label) + '</option>').join("");
      const select = (label, key, choices, value) =>
        '<label>' + html(label) + '<select data-key="' + key + '">' +
        options(choices, value) + '</select></label>';
      const checkbox = (label, key, defaultOn = true) =>
        '<label class="check"><input type="checkbox" data-key="' + key + '"' +
        ((cfg[key] ?? defaultOn) ? " checked" : "") + '>' + html(label) + '</label>';
      const rows = (cfg.entities || []).map((item, i) =>
        '<section class="entity"><div class="entity-header"><strong>Gerät ' + (i + 1) +
        '</strong><div><button type="button" data-action="up" data-i="' + i +
        '" aria-label="Nach oben" ' + (i === 0 ? "disabled" : "") + '>↑</button>' +
        '<button type="button" data-action="down" data-i="' + i + '" aria-label="Nach unten" ' +
        (i === cfg.entities.length - 1 ? "disabled" : "") + '>↓</button>' +
        '<button type="button" data-action="remove" data-i="' + i + '" aria-label="Entfernen">✕</button></div></div>' +
        '<label>Batteriestand (0–100 %) <ha-entity-picker data-i="' + i +
        '" data-field="entity" allow-custom-entity></ha-entity-picker></label>' +
        '<label>Eigener Gerätename <input data-i="' + i + '" data-field="name" ' +
        'placeholder="Name der Entität übernehmen" value="' + html(item.name || "") + '"></label>' +
        '<label>Ladestatus (optional) <ha-entity-picker data-i="' + i +
        '" data-field="charging_entity" allow-custom-entity></ha-entity-picker></label>' +
        '<label>Wert für „lädt“ (optional) <input data-i="' + i +
        '" data-field="charging_on_state" placeholder="Automatisch erkennen" value="' +
        html(item.charging_on_state || "") + '"></label></section>'
      ).join("");
      const views = [["list", "Liste"], ["grid", "Raster"]];
      const layouts = Object.keys(PRESETS).map((k) => [k, k]).concat([["custom", "Benutzerdefiniert"]]);
      const styles = [["bar", "Batteriebalken"], ["icon", "MDI-Symbol"], ["both", "Symbol + Balken"]];
      const positions = this._positions();
      this.shadowRoot.innerHTML =
        '<style>:host{display:block;color:var(--primary-text-color)}' +
        '.wrap{display:flex;flex-direction:column;gap:15px;font-family:var(--paper-font-body1_-_font-family,inherit)}' +
        'h3{font-size:16px;margin:2px 0 6px}p{margin:2px 0;color:var(--secondary-text-color);font-size:12px}' +
        'section.entity{padding:12px;border:1px solid var(--divider-color,#ddd);border-radius:10px;' +
        'display:flex;flex-direction:column;gap:12px}' +
        '.entity-header{display:flex;justify-content:space-between;align-items:center}' +
        '.entity-header button{width:32px;height:30px;margin-left:3px}' +
        'label{display:flex;flex-direction:column;gap:5px;font-size:13px;min-width:0}' +
        'input,select{box-sizing:border-box;width:100%;min-height:38px;padding:7px;' +
        'border:1px solid var(--divider-color,#aaa);background:var(--card-background-color);' +
        'color:var(--primary-text-color);border-radius:7px;font:inherit}' +
        'ha-entity-picker{display:block;min-height:40px}' +
        '.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}' +
        '.checks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}' +
        '.check{flex-direction:row;align-items:center}.check input{width:auto;min-height:auto}' +
        'button.add{padding:9px;border:1px solid var(--primary-color);color:var(--primary-color);' +
        'border-radius:8px;background:transparent;cursor:pointer}' +
        'button{cursor:pointer;background:transparent;border:1px solid var(--divider-color);' +
        'color:var(--primary-text-color);border-radius:6px}' +
        'button:disabled{opacity:.3;cursor:default}@media(max-width:430px){.grid{grid-template-columns:1fr}}' +
        '</style><div class="wrap">' +
        '<div><h3>Batterien</h3><p>Jedes Gerät kann einen eigenen Batterie- und Ladesensor verwenden.</p></div>' +
        rows + '<button type="button" class="add" data-action="add">+ Batterie hinzufügen</button>' +
        '<div><h3>Darstellung</h3><div class="grid">' +
        select("Geräte anordnen", "view", views, cfg.view || "list") +
        select("Spalten im Raster", "columns", [["1","1"],["2","2"],["3","3"],["4","4"]],
          String(cfg.columns || 2)) +
        select("Layout", "layout", layouts, cfg.layout || "default") +
        select("Batterieanzeige", "battery_style", styles, cfg.battery_style || "bar") +
        '</div></div>' +
        '<div><h3>Elemente anzeigen</h3><div class="checks">' +
        checkbox("Name", "show_name") + checkbox("Batteriesymbol", "show_image") +
        checkbox("Prozentwert", "show_level") + checkbox("Ladestatus", "show_status") +
        '</div></div>' +
        '<div><h3>Positionen</h3><p>Für eigene Positionen das Layout „Benutzerdefiniert“ wählen.</p>' +
        '<div class="grid">' + FIELDS.map((field) =>
          select(({name:"Name",image:"Batterie",level:"Prozentwert",status:"Ladestatus"})[field],
            "position:" + field, POSITIONS.map((p) => [p, POSITION_LABELS[p]]),
            positions[field])).join("") +
        '</div></div>' +
        '<div><h3>Warnfarben</h3><div class="grid">' +
        '<label>Rot bis einschließlich (%)<input type="number" min="0" max="100" data-key="low_threshold" value="' +
        html(cfg.low_threshold ?? 20) + '"></label>' +
        '<label>Gelb bis einschließlich (%)<input type="number" min="0" max="100" data-key="warn_threshold" value="' +
        html(cfg.warn_threshold ?? 50) + '"></label></div></div></div>';
      this.shadowRoot.querySelectorAll("ha-entity-picker").forEach((picker) => {
        const i = Number(picker.dataset.i);
        const field = picker.dataset.field;
        picker.hass = this._hass;
        picker.value = cfg.entities[i][field] || "";
        picker.label = field === "entity" ? "Batteriesensor" : "Ladesensor (optional)";
        picker.addEventListener("value-changed", (ev) => {
          this._setEntry(i, field, ev.detail && ev.detail.value || "");
        });
      });
      this.shadowRoot.querySelectorAll("[data-field]:not(ha-entity-picker)").forEach((el) =>
        el.addEventListener("change", () => this._setEntry(Number(el.dataset.i), el.dataset.field, el.value)));
      this.shadowRoot.querySelectorAll("[data-key]").forEach((el) =>
        el.addEventListener("change", () => {
          const key = el.dataset.key;
          const value = el.type === "checkbox" ? el.checked :
            el.type === "number" ? clamp(el.value, 0, 100) :
            key === "columns" ? clamp(el.value, 1, 4) : el.value;
          if (key.startsWith("position:")) {
            this._config = { ...this._config, layout: "custom",
              positions: { ...this._positions(), [key.slice(9)]: value } };
            this._emit();
            this._render();
          } else {
            this._set(key, value);
            if (key === "layout") this._render();
          }
        }));
      this.shadowRoot.querySelectorAll("[data-action]").forEach((btn) =>
        btn.addEventListener("click", () => {
          const i = Number(btn.dataset.i);
          const action = btn.dataset.action;
          const entities = [...cfg.entities];
          if (action === "add") entities.push({ entity: "" });
          if (action === "remove") entities.splice(i, 1);
          if (action === "up" && i > 0) [entities[i - 1], entities[i]] = [entities[i], entities[i - 1]];
          if (action === "down" && i < entities.length - 1) [entities[i + 1], entities[i]] = [entities[i], entities[i + 1]];
          this._config = { ...this._config, entities };
          this._emit();
          this._render();
        }));
    }
  }
  if (!customElements.get("battery-card")) customElements.define("battery-card", BatteryCard);
  if (!customElements.get("battery-card-editor")) customElements.define("battery-card-editor", BatteryCardEditor);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((card) => card.type === "battery-card")) {
    window.customCards.push({ type: "battery-card", name: "Battery Card",
      description: "Batteriestände und Ladestatus für mehrere Geräte",
      preview: true, documentationURL: "https://github.com/MaxxKra/battery-card" });
  }
})();
