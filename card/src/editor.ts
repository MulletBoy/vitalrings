import { LitElement, html, nothing, type TemplateResult } from "lit";

import { DEFAULT_PRESET, presetTiles } from "./presets";
import { COLOR_KEYS, type HomeAssistant, type VitalRingsCardConfig } from "./types";

const EDITOR_TAG = "vital-rings-card-editor";

const LABELS: Record<string, string> = {
  entity: "VitalRings entity",
  name: "Title",
  preset: "Colour preset",
  show_rows: "A row for each ring",
  show_heart: "Heart rate chart, awake averages and workout",
  show_vitals: "VO₂ max chart",
  show_body: "Body and weight",
  tiles: "Tinted boxes",
  theme_background: "Use the theme's card background",
  heart_hours: "Heart rate chart opens on",
  trend_range: "VO₂ max and weight charts open on",
  weight_unit: "Weight unit",
  colors: "Colours",
  resting: "Ring: Heart",
  resting_end: "Ring: Heart (gradient end)",
  recovery: "Ring: Recovery",
  recovery_end: "Ring: Recovery (gradient end)",
  breathing: "Ring: Breathing",
  breathing_end: "Ring: Breathing (gradient end)",
  sleeping: "Ring: Sleeping",
  sleeping_end: "Ring: Sleeping (gradient end)",
  oxygen: "Ring: Blood oxygen",
  oxygen_end: "Ring: Blood oxygen (gradient end)",
  vo2: "Ring and chart: VO₂ max",
  vo2_end: "Ring: VO₂ max (gradient end)",
  heart: "Heart rate (average and high)",
  heart_low: "Heart rate (low)",
  awake: "Awake heart rate",
  workout: "Workout",
  weight: "Weight",
  bmi: "Body mass index",
  height: "Height",
  fresh: "Good: synced recently, high score",
  recent: "Fair: synced hours ago, middling score",
  stale: "Poor: synced long ago, low score",
};

const HELPERS: Record<string, string> = {
  entity: "Any entity of the VitalRings device. The card reads all its figures from the integration.",
  colors: "Any CSS colour, for example #ff2fd6. Leave a field empty to use the preset.",
  theme_background: "Off: the Synthwave preset paints its own dark card.",
  weight_unit: "Empty: follows Home Assistant's unit system.",
};

const toggle = (name: string) => ({ name, selector: { boolean: {} } });
const dropdown = (name: string, options: { value: string; label: string }[]) => ({
  name,
  selector: { select: { mode: "dropdown", options } },
});

const SCHEMA = [
  {
    name: "entity",
    required: true,
    selector: { entity: { filter: { integration: "vital_rings", domain: "sensor" } } },
  },
  { name: "name", selector: { text: {} } },
  dropdown("preset", [
    { value: "synthwave", label: "Synthwave" },
    { value: "theme", label: "Follow the theme (light or dark)" },
    { value: "health", label: "Health" },
  ]),
  {
    type: "grid",
    name: "",
    schema: [
      toggle("show_rows"),
      toggle("show_heart"),
      toggle("show_vitals"),
      toggle("show_body"),
      toggle("tiles"),
      toggle("theme_background"),
    ],
  },
  {
    type: "grid",
    name: "",
    schema: [
      dropdown("heart_hours", [
        { value: "24", label: "24 hours" },
        { value: "48", label: "48 hours" },
        { value: "168", label: "7 days" },
      ]),
      dropdown("trend_range", [
        { value: "3m", label: "3 months" },
        { value: "6m", label: "6 months" },
        { value: "1y", label: "1 year" },
        { value: "all", label: "Everything" },
      ]),
    ],
  },
  dropdown("weight_unit", [
    { value: "kg", label: "Kilograms" },
    { value: "lb", label: "Pounds" },
  ]),
  {
    type: "expandable",
    name: "colors",
    title: LABELS.colors,
    schema: COLOR_KEYS.map((key) => ({ name: key, selector: { text: {} } })),
  },
];

export class VitalRingsCardEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  declare hass?: HomeAssistant;
  declare _config?: VitalRingsCardConfig;

  setConfig(config: VitalRingsCardConfig): void {
    this._config = config;
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this._config) return nothing;
    // Show what the card does when an option is left out.
    const data = {
      preset: DEFAULT_PRESET,
      show_rows: true,
      show_heart: true,
      show_vitals: true,
      show_body: true,
      trend_range: "6m",
      theme_background: false,
      tiles: presetTiles(this._config.preset),
      ...this._config,
      // The dropdown works with text; the card wants a number.
      heart_hours: String(this._config.heart_hours ?? 48),
    };
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${SCHEMA}
        .computeLabel=${(field: { name: string }) => LABELS[field.name] ?? field.name}
        .computeHelper=${(field: { name: string }) => HELPERS[field.name]}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  private _valueChanged(event: CustomEvent<{ value: Record<string, unknown> }>): void {
    event.stopPropagation();
    const config = { ...event.detail.value } as unknown as VitalRingsCardConfig;
    const hours = Number(config.heart_hours);
    if (Number.isFinite(hours) && hours > 0) config.heart_hours = hours;
    else delete config.heart_hours;
    if (!config.weight_unit) delete config.weight_unit;
    // Drop empty colour fields so the preset's colour applies again.
    if (config.colors) {
      const colors = Object.fromEntries(
        Object.entries(config.colors).filter(
          ([, value]) => typeof value === "string" && value.trim(),
        ),
      );
      if (Object.keys(colors).length) config.colors = colors;
      else delete config.colors;
    }
    this.dispatchEvent(
      new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }),
    );
  }
}

if (!customElements.get(EDITOR_TAG)) {
  customElements.define(EDITOR_TAG, VitalRingsCardEditor);
}
