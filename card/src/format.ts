import type { Metric } from "./types";

export const KG_TO_LB = 2.2046226218;

/** A finite number, or null. */
export function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** A metric's value (or another of its numeric fields), or null. */
export function field(metric: Metric | undefined, name: keyof Metric = "value"): number | null {
  return metric ? num(metric[name]) : null;
}

/** "47", "44.2": a number with a fixed count of decimals, or "--". */
export function show(value: number | null, digits = 0): string {
  return value === null ? "--" : value.toFixed(digits);
}

/** How long ago, in a few characters: "now", "12m", "3h", "2d". */
export function ago(iso: string | null | undefined, now: number): string | null {
  const then = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(then)) return null;
  const minutes = Math.max(0, Math.round((now - then) / 60_000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 48 * 60) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)}d`;
}

/** Minutes since a time, or null. */
export function minutesSince(iso: string | null | undefined, now: number): number | null {
  const then = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(then) ? Math.max(0, (now - then) / 60_000) : null;
}

function safely(
  date: Date,
  language: string | undefined,
  options: Intl.DateTimeFormatOptions,
  timeZone?: string,
): string {
  try {
    return date.toLocaleString(language, { ...options, timeZone });
  } catch {
    // Unknown time zone: fall back to the browser's.
    return date.toLocaleString(language, options);
  }
}

export function formatTime(ms: number, language?: string, timeZone?: string): string {
  return safely(new Date(ms), language, { hour: "numeric", minute: "2-digit" }, timeZone);
}

export function formatHour(ms: number, language?: string, timeZone?: string): string {
  return safely(new Date(ms), language, { hour: "numeric" }, timeZone);
}

export function formatWeekday(ms: number, language?: string, timeZone?: string): string {
  return safely(new Date(ms), language, { weekday: "short" }, timeZone);
}

/** "Sat 9 Mar" */
export function formatDay(ms: number, language?: string, timeZone?: string): string {
  return safely(new Date(ms), language, { weekday: "short", day: "numeric", month: "short" }, timeZone);
}

/** "9 Mar 2030" */
export function formatDate(ms: number, language?: string, timeZone?: string): string {
  return safely(new Date(ms), language, { day: "numeric", month: "short", year: "numeric" }, timeZone);
}

/** "Sat 9 Mar, 17:00" */
export function formatDayTime(ms: number, language?: string, timeZone?: string): string {
  return safely(
    new Date(ms),
    language,
    { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" },
    timeZone,
  );
}

/** The date (YYYY-MM-DD) of a moment in a time zone, or in the browser's if it is unknown. */
export function dateIn(ms: number, timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(ms));
  } catch {
    const d = new Date(ms);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${String(d.getDate()).padStart(2, "0")}`;
  }
}

/** The hour of the day (0-23) of a moment in a time zone. */
export function hourIn(ms: number, timeZone?: string): number {
  try {
    const text = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone }).format(
      new Date(ms),
    );
    return Number(text) % 24;
  } catch {
    return new Date(ms).getHours();
  }
}

/** "traditional_strength_training" -> "Traditional strength training" */
export function workoutName(kind: unknown): string {
  const text = (typeof kind === "string" ? kind : "").replace(/[_-]+/g, " ").trim().slice(0, 40);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "Workout";
}

/** 42 -> "42 min", 95 -> "1h 35m" */
export function formatDuration(minutes: number): string {
  const total = Math.round(Math.abs(minutes));
  if (total < 60) return `${total} min`;
  return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, "0")}m`;
}

/** 1.8 m -> "180 cm", or 5 ft 11 in for people who weigh themselves in pounds. */
export function formatHeight(metres: number, imperial: boolean): string {
  if (!imperial) return `${Math.round(metres * 100)} cm`;
  const inches = Math.round(metres / 0.0254);
  return `${Math.floor(inches / 12)} ft ${inches % 12} in`;
}

const STEPS = [1, 2, 2.5, 5];

/**
 * A scale whose bottom, middle and top are round numbers and which holds every
 * value: the smallest round step that covers the span in at most eight steps.
 */
export function niceScale(min: number, max: number, minSpan = 1): { bottom: number; top: number } {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return { bottom: 0, top: 1 };
  if (max - min < minSpan) {
    const middle = (min + max) / 2;
    min = middle - minSpan / 2;
    max = middle + minSpan / 2;
  }
  const span = max - min;
  const magnitude = 10 ** Math.floor(Math.log10(span / 8));
  for (const factor of [magnitude, magnitude * 10]) {
    for (const base of STEPS) {
      const step = base * factor;
      const bottom = Math.floor(min / step + 1e-9) * step;
      let count = Math.ceil((max - bottom) / step - 1e-9);
      // An even number of steps puts the middle mark on a round number too.
      if (count % 2) count += 1;
      if (count <= 8) return { bottom, top: bottom + count * step };
    }
  }
  return { bottom: Math.floor(min), top: Math.ceil(max) };
}

/** Axis label: whole numbers as they are, others with one decimal. */
export function tickLabel(value: number): string {
  return Math.abs(value - Math.round(value)) < 1e-6 ? String(Math.round(value)) : value.toFixed(1);
}
