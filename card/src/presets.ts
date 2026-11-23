import { COLOR_KEYS, type ColorKey, type Colors } from "./types";

interface Preset {
  colors: Colors;
  /** Extra CSS custom properties (text colour, glow...). */
  vars?: Record<string, string>;
  /** Card background, skipped when the card is told to keep the theme's. */
  background?: Record<string, string>;
  /** Draw each row and section as a tinted, glowing box. */
  tiles?: boolean;
}

export const DEFAULT_PRESET = "synthwave";

/**
 * "theme" sets almost nothing: the stylesheet's fallbacks apply, so the card
 * follows the Home Assistant theme (light or dark), and a theme can override
 * colours with --vital-rings-<name>-color.
 */
export const PRESETS: Record<string, Preset> = {
  theme: {
    // Base colours come from the stylesheet (and the HA theme); only the
    // second colour of each ring's gradient is set here.
    colors: {
      resting_end: "#a78bfa",
      recovery_end: "#38bdf8",
      breathing_end: "#f97316",
      sleeping_end: "#8b5cf6",
      oxygen_end: "#f43f5e",
      vo2_end: "#14b8a6",
    },
    tiles: true,
  },
  synthwave: {
    colors: {
      resting: "#ff2fd6",
      recovery: "#5df0a8",
      breathing: "#ffb224",
      sleeping: "#4df3ff",
      oxygen: "#ff5c8a",
      vo2: "#c8f55a",
      resting_end: "#a46bff",
      recovery_end: "#4df3ff",
      breathing_end: "#ff7a3d",
      sleeping_end: "#3d7bff",
      oxygen_end: "#ff2fd6",
      vo2_end: "#5df0a8",
      heart: "#ff2fd6",
      heart_low: "#a46bff",
      awake: "#ffb224",
      workout: "#ffb224",
      weight: "#a46bff",
      bmi: "#5df0a8",
      height: "#6d8bff",
      fresh: "#5df0a8",
      recent: "#ffb224",
      stale: "#ff2fd6",
    },
    vars: {
      "--vr-text": "#f1e8ff",
      "--vr-secondary-text": "#b9a6d6",
      "--vr-divider": "#3b1c66",
      "--vr-track": "rgba(185,166,214,0.10)",
      "--vr-track-opacity": "1",
      "--vr-accent-text": "currentColor",
      "--vr-glow": "6px",
      "--vr-tile-fill": "12%",
      "--vr-tile-border": "45%",
      "--vr-tile-glow": "18%",
      "--vr-tile-inset": "7%",
      "--vr-title-tint": "100%",
      "--vr-halo": "13%",
      "--vr-score-glow": "45%",
      "--vr-heart-tint": "#ff2fd6",
      "--vr-vitals-tint": "#5df0a8",
      "--vr-body-tint": "#a46bff",
    },
    tiles: true,
    // A neon palette needs a dark card, whatever the dashboard theme is.
    background: { "--ha-card-background": "#16082b", "--ha-card-border-color": "#3b1c66" },
  },
  health: {
    colors: {
      resting: "#ff375f",
      recovery: "#30d158",
      breathing: "#ff9f0a",
      sleeping: "#32ade6",
      oxygen: "#ff6482",
      vo2: "#a4e03a",
      resting_end: "#bf5af2",
      recovery_end: "#64d2ff",
      breathing_end: "#ff6b5e",
      sleeping_end: "#5e5ce6",
      oxygen_end: "#ff375f",
      vo2_end: "#30d158",
      heart: "#ff375f",
      heart_low: "#bf5af2",
      awake: "#ff9f0a",
      workout: "#ff9f0a",
      weight: "#bf5af2",
      bmi: "#30d158",
      height: "#5e5ce6",
      fresh: "#30d158",
      recent: "#ff9f0a",
      stale: "#ff453a",
    },
    tiles: true,
  },
};

const SAFE_COLOR =
  /^(#[0-9a-f]{3,8}|[a-z]+|(rgb|rgba|hsl|hsla)\([0-9.,%\s/deg-]+\)|var\(--[a-z0-9-]+\))$/i;

/** Only let plain colour values into the style attribute. */
export function safeColor(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return SAFE_COLOR.test(trimmed) ? trimmed : undefined;
}

/** Look a preset up by name; anything unknown (including "constructor") gets the default. */
function getPreset(name: string | undefined): Preset {
  const key = typeof name === "string" ? name : DEFAULT_PRESET;
  return Object.prototype.hasOwnProperty.call(PRESETS, key) ? PRESETS[key] : PRESETS[DEFAULT_PRESET];
}

/** Whether a preset draws tinted boxes unless the card says otherwise. */
export function presetTiles(preset: string | undefined): boolean {
  return getPreset(preset).tiles ?? false;
}

/** CSS custom properties for a preset plus per-card colour overrides. */
export function styleVars(
  preset: string | undefined,
  colors: Colors | undefined,
  themeBackground = false,
): Record<string, string> {
  const chosen = getPreset(preset);
  const vars: Record<string, string> = {
    ...(chosen.vars ?? {}),
    ...(themeBackground ? {} : (chosen.background ?? {})),
  };
  for (const key of COLOR_KEYS) {
    const value = safeColor(colors?.[key]) ?? chosen.colors[key as ColorKey];
    if (value) vars[`--vr-${key.replace("_", "-")}`] = value;
  }
  return vars;
}
