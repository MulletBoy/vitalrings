export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
}

/** The small part of the Home Assistant frontend object this card uses. */
export interface HomeAssistant {
  states: Record<string, HassEntity>;
  entities?: Record<string, { platform?: string }>;
  locale?: { language?: string; time_format?: string };
  config?: { time_zone?: string; unit_system?: { mass?: string } };
  callWS?: <T>(message: Record<string, unknown>) => Promise<T>;
}

export const COLOR_KEYS = [
  // The six rings, each with an optional second colour it fades to.
  "resting",
  "recovery",
  "breathing",
  "sleeping",
  "oxygen",
  "vo2",
  "resting_end",
  "recovery_end",
  "breathing_end",
  "sleeping_end",
  "oxygen_end",
  "vo2_end",
  // Heart rate chart
  "heart",
  "heart_low",
  // Tiles and their charts
  "awake",
  "workout",
  "weight",
  "bmi",
  "height",
  // "Synced ... ago" marker
  "fresh",
  "recent",
  "stale",
] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];
export type Colors = Partial<Record<ColorKey, string>>;

export const HEART_HOURS = [24, 48, 168] as const;
export const TREND_RANGES = ["3m", "6m", "1y", "all"] as const;
export type TrendRange = (typeof TREND_RANGES)[number];

export interface VitalRingsCardConfig {
  type: string;
  /** Any entity of a VitalRings device. */
  entity?: string;
  name?: string;
  preset?: string;
  /** Keep the dashboard theme's card background even if the preset has its own. */
  theme_background?: boolean;
  /** Tinted, glowing boxes around each part. Defaults to the preset's choice. */
  tiles?: boolean;
  show_rows?: boolean;
  show_heart?: boolean;
  show_vitals?: boolean;
  show_body?: boolean;
  /** Hours on the heart rate chart when the card opens: 24, 48 or 168. */
  heart_hours?: number;
  /** Period of the VO2 max and weight charts when the card opens. */
  trend_range?: TrendRange;
  weight_unit?: "kg" | "lb";
  colors?: Colors;
}

/** One figure as the integration reports it. Which fields exist depends on the metric. */
export interface Metric {
  value?: number | null;
  measured_at?: string;
  // Usual values
  average?: number | null;
  average_7d?: number | null;
  low?: number | null;
  high?: number | null;
  first?: number | null;
  days?: number;
  window_days?: number;
  // Heart rate windows
  lowest?: number | null;
  highest?: number | null;
  hours?: number;
  night?: string;
  start?: string | null;
  end?: string | null;
  since?: string;
  // Workout
  max?: number | null;
  min?: number | null;
  workout?: string;
  duration_minutes?: number | null;
  // Body mass index
  category?: string;
  // Rings: the score out of 100 and what earns full marks
  score?: number | null;
  full?: { direction?: string; low?: number | null; high?: number | null };
  percentile?: number | null;
  rings?: number;
  /** The value that was scored: the last day's average, or the latest reading. */
  scored?: number | null;
  basis?: string;
  average_24h?: number | null;
  readings_24h?: number;
}

export interface Summary {
  updated: string | null;
  synced: string | null;
  metrics: Record<string, Metric>;
}

export interface SeriesPoint {
  start: number;
  end: number;
  mean: number;
  min: number;
  max: number;
}

export interface Series {
  metric: string;
  period: string;
  points: SeriesPoint[];
}
