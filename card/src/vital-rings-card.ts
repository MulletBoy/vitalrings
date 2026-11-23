import { LitElement, html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { styleMap } from "lit/directives/style-map.js";

import { renderChart, type ChartPoint, type ChartTick } from "./chart";
import "./editor";
import {
  KG_TO_LB,
  ago,
  field,
  formatDate,
  formatDayTime,
  formatDuration,
  formatHeight,
  formatTime,
  formatWeekday,
  hourIn,
  minutesSince,
  num,
  show,
  tickLabel,
  workoutName,
} from "./format";
import { presetTiles, styleVars } from "./presets";
import { styles } from "./styles";
import {
  HEART_HOURS,
  TREND_RANGES,
  type HassEntity,
  type HomeAssistant,
  type Metric,
  type Series,
  type SeriesPoint,
  type Summary,
  type TrendRange,
  type VitalRingsCardConfig,
} from "./types";

export const CARD_VERSION = "1.0.1";
const CARD_TAG = "vital-rings-card";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** The two sets of rings; in each, the outermost ring first. */
const SETS = [
  {
    key: "vitals",
    label: "Vitals",
    score: "vitals_score",
    rings: [
      { key: "resting", label: "Heart", metric: "resting_heart_rate" },
      { key: "recovery", label: "Recovery", metric: "heart_rate_variability" },
      { key: "breathing", label: "Breathing", metric: "respiratory_rate" },
    ],
  },
  {
    key: "fitness",
    label: "Fitness",
    score: "fitness_score",
    rings: [
      { key: "sleeping", label: "Sleeping", metric: "sleeping_heart_rate" },
      { key: "oxygen", label: "Blood oxygen", metric: "oxygen_saturation" },
      { key: "vo2", label: "VO₂ max", metric: "vo2_max" },
    ],
  },
] as const;
type RingSet = (typeof SETS)[number];
type RingKey = RingSet["rings"][number]["key"];

/** What each ring measures and how it is scored, shown when a row is hovered or tapped. */
const RING_INFO: Record<RingKey, { title: string; about: string; scoring: string }> = {
  resting: {
    title: "Resting heart rate",
    about:
      "How fast your heart beats when you are awake and at rest. A lower rate usually means a fitter heart; a rise over a few days can point to stress, poor sleep or illness.",
    scoring: "100 at 50 bpm or lower, falling to 0 at 100 bpm. The normal adult range is 60–100 bpm; well-trained people rest at 40–60.",
  },
  recovery: {
    title: "Heart rate variability",
    about:
      "How much the time between heartbeats varies (SDNN). Higher usually means you are well recovered; it drops with stress, illness, alcohol and hard training.",
    scoring:
      "0 at 15 ms, rising to 100 at 100 ms or higher. It differs a lot between people and falls with age, so your own trend says more than the number.",
  },
  breathing: {
    title: "Respiratory rate",
    about: "Breaths per minute, usually measured while you sleep. It is steady from night to night; a rise can be an early sign of illness.",
    scoring: "100 from 12 to 18 breaths a minute, falling to 0 at 28 and at 6. The normal adult range at rest is 12–20.",
  },
  sleeping: {
    title: "Sleeping heart rate",
    about:
      "Your average heart rate over the whole hours you were asleep last night. It runs below your resting rate; a higher night can follow a late meal, alcohol, strain or illness.",
    scoring: "100 at 45 bpm or lower, falling to 0 at 85 bpm.",
  },
  oxygen: {
    title: "Blood oxygen",
    about: "How much oxygen your red blood cells carry (oxygen saturation). Wrist readings vary a little; look for a lasting drop rather than one low reading.",
    scoring: "100 at 97 % or higher, 85 at 95 %, falling to 0 at 90 %. 95–100 % is normal; below 90 % is low.",
  },
  vo2: {
    title: "VO₂ max",
    about:
      "The most oxygen your body can use during hard exercise, estimated by your watch from outdoor walks, runs and hikes. It is the standard measure of cardio fitness.",
    scoring:
      "Your percentile among adults of your age and sex (FRIEND registry). The median scores 50; the 95th percentile or higher scores 100.",
  },
};

/** Rings scored on the last day's average where the integration has one. */
const DAY_AVERAGED = new Set([
  "resting_heart_rate",
  "heart_rate_variability",
  "respiratory_rate",
  "oxygen_saturation",
]);

/** 1 -> "1st", 72 -> "72nd" */
function ordinal(value: number): string {
  const n = Math.round(value);
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${suffix}`;
}

const TREND: Record<TrendRange, { label: string; days: number; period: string }> = {
  "3m": { label: "3M", days: 92, period: "day" },
  "6m": { label: "6M", days: 183, period: "week" },
  "1y": { label: "1Y", days: 366, period: "week" },
  all: { label: "All", days: 365 * 19, period: "month" },
};

type ChartId = "heart" | "vo2" | "weight";
const CHARTS: ChartId[] = ["heart", "vo2", "weight"];

// How often an open card asks again, in minutes.
const SUMMARY_EVERY = 2;
const SERIES_EVERY = 10;
// Upper bounds on what the card accepts, whatever it is sent.
const MAX_POINTS = 2000;
const BMI_SCALE = [15, 40] as const;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export class VitalRingsCard extends LitElement {
  static styles = styles;

  static properties = {
    hass: { attribute: false },
    _config: { state: true },
    _summary: { state: true },
    _series: { state: true },
    _heartHours: { state: true },
    _vo2Range: { state: true },
    _weightRange: { state: true },
    _hover: { state: true },
    _tip: { state: true },
    _tipAbove: { state: true },
    _error: { state: true },
    _now: { state: true },
    _ready: { state: true },
  };

  declare hass?: HomeAssistant;
  declare _config?: VitalRingsCardConfig;
  declare _summary: Summary | null;
  declare _series: Partial<Record<ChartId, SeriesPoint[]>>;
  declare _heartHours: number;
  declare _vo2Range: TrendRange;
  declare _weightRange: TrendRange;
  declare _hover: { chart: ChartId; index: number } | null;
  /** The ring whose information box is open. */
  declare _tip: RingKey | null;
  declare _tipAbove: boolean;
  declare _error: string | null;
  declare _now: number;
  declare _ready: boolean;

  private _timer?: number;
  private _ticks = 0;
  private _token = 0;
  private _seriesTokens: Partial<Record<ChartId, number>> = {};
  private _seen?: HassEntity;
  private _loadedFor?: string;

  constructor() {
    super();
    this._summary = null;
    this._series = {};
    this._heartHours = 48;
    this._vo2Range = "6m";
    this._weightRange = "6m";
    this._hover = null;
    this._tip = null;
    this._tipAbove = false;
    this._error = null;
    this._now = Date.now();
    this._ready = false;
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("vital-rings-card-editor");
  }

  static getStubConfig(hass?: HomeAssistant): Partial<VitalRingsCardConfig> {
    const entity = Object.keys(hass?.entities ?? {}).find(
      (id) => id.startsWith("sensor.") && hass?.entities?.[id]?.platform === "vital_rings",
    );
    return { entity: entity ?? "" };
  }

  setConfig(config: VitalRingsCardConfig): void {
    if (!config || typeof config !== "object") {
      throw new Error("Vital Rings: the card configuration is missing");
    }
    this._config = {
      show_rows: true,
      show_heart: true,
      show_vitals: true,
      show_body: true,
      ...config,
    };
    const hours = Number(this._config.heart_hours);
    this._heartHours = (HEART_HOURS as readonly number[]).includes(hours) ? hours : 48;
    const range = this._config.trend_range;
    const chosen = range && (TREND_RANGES as readonly string[]).includes(range) ? range : "6m";
    this._vo2Range = chosen;
    this._weightRange = chosen;
    this._loadedFor = undefined;
  }

  getCardSize(): number {
    const config = this._config;
    return 4 + (config?.show_heart ? 4 : 0) + (config?.show_vitals ? 4 : 0) + (config?.show_body ? 4 : 0);
  }

  getGridOptions(): Record<string, number | string> {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  connectedCallback(): void {
    super.connectedCallback();
    // Once a minute: keep "12m ago" current, and ask for fresh figures now and then.
    this._timer = window.setInterval(() => this._tick(), 60_000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearInterval(this._timer);
    this._timer = undefined;
  }

  private _tick(): void {
    this._now = Date.now();
    this._ticks += 1;
    if (this._ticks % SUMMARY_EVERY === 0) void this._load(this._ticks % SERIES_EVERY === 0);
  }

  protected shouldUpdate(changed: PropertyValues): boolean {
    if (changed.size > 1 || !changed.has("hass")) return true;
    const entity = this._config?.entity;
    if (!entity || !this._summary) return true;
    const previous = changed.get("hass") as HomeAssistant | undefined;
    return previous?.states[entity] !== this.hass?.states[entity];
  }

  protected firstUpdated(): void {
    // Draw empty first, then fill, so the rings and bars animate in.
    requestAnimationFrame(() => (this._ready = true));
  }

  protected updated(): void {
    const entity = this._config?.entity;
    if (!this.hass || !entity) return;
    const state = this.hass.states[entity];
    // The integration's sensors change when new health data has been worked in.
    if (this._loadedFor !== entity || state !== this._seen) {
      const first = this._loadedFor !== entity;
      this._loadedFor = entity;
      this._seen = state;
      if (first) {
        this._summary = null;
        this._series = {};
      }
      void this._load(true);
    }
  }

  /** Ask the integration for the figures and, if wanted, the charts' points. */
  private async _load(series: boolean): Promise<void> {
    const entity = this._config?.entity;
    const callWS = this.hass?.callWS;
    if (!entity || !callWS) return;
    const token = ++this._token;
    try {
      const summary = await callWS<Summary>({ type: "vital_rings/summary", entity_id: entity });
      if (token !== this._token) return;
      const metrics = summary && typeof summary.metrics === "object" && summary.metrics ? summary.metrics : {};
      this._summary = { updated: summary?.updated ?? null, synced: summary?.synced ?? null, metrics };
      this._error = null;
      this._now = Date.now();
    } catch {
      if (token === this._token) {
        this._error = "VitalRings did not answer. Check that the integration is set up and loaded.";
      }
      return;
    }
    if (series) for (const chart of CHARTS) void this._loadSeries(chart);
  }

  private _request(chart: ChartId): { metric: string; period: string; start: number } {
    if (chart === "heart") {
      return { metric: "heart_rate", period: "hour", start: Date.now() - this._heartHours * HOUR };
    }
    const range = TREND[chart === "vo2" ? this._vo2Range : this._weightRange];
    return {
      metric: chart === "vo2" ? "vo2_max" : "weight",
      period: range.period,
      start: Date.now() - range.days * DAY,
    };
  }

  private _wanted(chart: ChartId): boolean {
    const config = this._config;
    if (chart === "heart") return config?.show_heart !== false;
    return chart === "vo2" ? config?.show_vitals !== false : config?.show_body !== false;
  }

  private async _loadSeries(chart: ChartId): Promise<void> {
    const entity = this._config?.entity;
    const callWS = this.hass?.callWS;
    if (!entity || !callWS || !this._wanted(chart)) return;
    const token = (this._seriesTokens[chart] ?? 0) + 1;
    this._seriesTokens[chart] = token;
    const request = this._request(chart);
    let points: SeriesPoint[] = [];
    try {
      const reply = await callWS<Series>({
        type: "vital_rings/series",
        entity_id: entity,
        metric: request.metric,
        period: request.period,
        start: new Date(request.start).toISOString(),
      });
      if (Array.isArray(reply?.points)) {
        points = reply.points
          .filter((p) => Number.isFinite(p?.start) && Number.isFinite(p?.end) && Number.isFinite(p?.mean))
          .map((p) => ({
            start: p.start,
            end: p.end,
            mean: p.mean,
            min: Number.isFinite(p.min) ? p.min : p.mean,
            max: Number.isFinite(p.max) ? p.max : p.mean,
          }))
          .slice(-MAX_POINTS);
      }
    } catch {
      // No history for this metric: the chart says so.
    }
    // Ignore the answer if the viewer has switched period meanwhile.
    if (this._seriesTokens[chart] === token) this._series = { ...this._series, [chart]: points };
  }

  private _metric(name: string): Metric | undefined {
    return this._summary?.metrics[name];
  }

  private get _language(): string | undefined {
    return this.hass?.locale?.language;
  }

  private get _timeZone(): string | undefined {
    return this.hass?.config?.time_zone;
  }

  private get _pounds(): boolean {
    const unit = this._config?.weight_unit;
    if (unit === "kg" || unit === "lb") return unit === "lb";
    return this.hass?.config?.unit_system?.mass === "lb";
  }

  protected render(): TemplateResult | typeof nothing {
    const config = this._config;
    if (!config) return nothing;
    const vars = styleVars(config.preset, config.colors, config.theme_background);
    const entity = config.entity ? this.hass?.states[config.entity] : undefined;
    const summary = this._summary;

    let message = "";
    if (!config.entity) message = "Choose a VitalRings entity in the card settings.";
    else if (this.hass && !entity) message = `Entity not found: ${config.entity}`;
    else if (this._error) message = this._error;
    else if (summary && !Object.keys(summary.metrics).length) {
      message = "No health data yet. The figures appear after the next sync.";
    }

    const panels = [
      config.show_heart ? this._renderHeart() : nothing,
      config.show_vitals ? this._renderVitals() : nothing,
      config.show_body ? this._renderBody() : nothing,
    ].filter((part) => part !== nothing);

    return html`
      <ha-card class=${(config.tiles ?? presetTiles(config.preset)) ? "tiles" : ""} style=${styleMap(vars)}>
        <div class="header">
          <span class="title">${config.name ?? "Heart & vitals"}</span>
          ${this._renderSynced()}
        </div>
        ${message ? html`<div class="message">${message}</div>` : nothing}
        <div class="body">
          <div class="sets">${SETS.map((set) => this._renderSet(set, config.show_rows !== false))}</div>
          ${panels.length ? html`<div class="panels n${panels.length}">${panels}</div>` : nothing}
        </div>
      </ha-card>
    `;
  }

  /** "Synced 12m ago": green while fresh, amber and red as the data ages. */
  private _renderSynced(): TemplateResult | typeof nothing {
    const synced = this._summary?.synced;
    const minutes = minutesSince(synced, this._now);
    const text = ago(synced, this._now);
    if (minutes === null || text === null) return nothing;
    const tone = minutes <= 120 ? "fresh" : minutes <= 360 ? "recent" : "stale";
    const title = `Health data last arrived ${formatDayTime(Date.parse(synced as string), this._language, this._timeZone)}`;
    return html`<span class="age ${tone}" title=${title}>${text === "now" ? "Synced just now" : `Synced ${text} ago`}</span>`;
  }

  private _fraction(score: number | null): number {
    if (!this._ready || score === null) return 0;
    return clamp01(score / 100);
  }

  /** A ring's measured value in a few words: "Resting 48 bpm". */
  private _reading(name: string, metric: Metric | undefined): string {
    // The scored value: the last day's average where there is one, else the latest reading.
    const value = field(metric, "scored") ?? field(metric);
    if (value === null) return "No reading yet";
    // When the average is shown, the latest reading follows if it reads differently.
    const digits = name === "respiratory_rate" ? 1 : 0;
    const latest = field(metric);
    const other =
      metric?.basis === "day" && latest !== null && show(latest, digits) !== show(value, digits)
        ? ` · latest ${show(latest, digits)}`
        : "";
    if (name === "resting_heart_rate") return `Resting ${show(value)} bpm${other}`;
    if (name === "heart_rate_variability") return `HRV ${show(value)} ms${other}`;
    if (name === "respiratory_rate") return `${show(value, 1)} br/min${other}`;
    if (name === "oxygen_saturation") return `${show(value)} %${other}`;
    if (name === "sleeping_heart_rate") {
      const lowest = field(metric, "lowest");
      return `${show(value)} bpm${lowest !== null ? ` · low ${show(lowest)}` : ""}`;
    }
    const percentile = field(metric, "percentile");
    return `${show(value, 1)}${percentile !== null ? ` · ${ordinal(percentile)} percentile` : ""}`;
  }

  /** What earns a ring full marks: "Best 50 or lower". */
  private _best(metric: Metric | undefined): string {
    const full = metric?.full;
    if (!full || typeof full !== "object") return "";
    const low = num(full.low);
    const high = num(full.high);
    if (full.direction === "low" && low !== null) return `Best ≤ ${tickLabel(low)}`;
    if (full.direction === "high" && high !== null) return `Best ≥ ${tickLabel(high)}`;
    if (low !== null && high !== null) return `Best ${tickLabel(low)}–${tickLabel(high)}`;
    return "";
  }

  /** Open a ring's information box on the side of its row where the card has more room. */
  private _openTip(key: RingKey, event: Event): void {
    const row = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const card = this.getBoundingClientRect();
    this._tipAbove = card.bottom - row.bottom < 200 && row.top - card.top > card.bottom - row.bottom;
    this._tip = key;
  }

  /** The information box of a ring: what it measures, how it is scored, and your numbers. */
  private _renderInfo(key: RingKey, name: string, metric: Metric | undefined): TemplateResult {
    const info = RING_INFO[key];
    const score = field(metric, "score");
    const usual = this._usual(metric, name === "vo2_max" || name === "respiratory_rate" ? 1 : 0);
    const hours = metric?.readings_24h;
    const basis =
      metric?.basis === "day"
        ? `Scored on your average over the last 24 hours${hours ? ` (${hours} ${hours === 1 ? "hour" : "hours"} with readings)` : ""}, so one odd reading does not empty the ring.`
        : metric?.basis === "latest" && DAY_AVERAGED.has(name)
          ? "No readings in the last 24 hours, so this is scored on your latest reading."
          : "";
    return html`
      <div class="info ${this._tipAbove ? "above" : ""}" id="vr-tip-${key}" role="tooltip">
        <b>${info.title}</b>
        <p>${info.about}</p>
        <p><i>Score</i>${info.scoring}${basis ? ` ${basis}` : ""}</p>
        <p>
          <i>Yours</i>${this._reading(name, metric)}${score !== null ? `, ${Math.round(score)} of 100` : ""}${usual
            ? `. ${usual}`
            : ""}
        </p>
      </div>
    `;
  }

  /** One set: three rings, each filled to its score out of 100, and a row per ring. */
  private _renderSet(set: RingSet, rows: boolean): TemplateResult {
    const total = field(this._metric(set.score));
    const band =
      total === null ? "" : total >= 85 ? "excellent" : total >= 70 ? "good" : total >= 50 ? "fair" : "low";
    const radii = [70, 56, 42];
    const rings = set.rings.map((ring) => {
      const metric = this._metric(ring.metric);
      return { ...ring, data: metric, score: field(metric, "score") };
    });
    const label =
      `${set.label} score ${total === null ? "not available" : `${Math.round(total)} of 100`}. ` +
      rings.map((ring) => `${ring.label} ${show(ring.score)} of 100`).join(", ");
    return html`
      <div class="set">
        <div class="rings ${band ? `b-${band}` : ""}" role="img" aria-label=${label}>
          <svg viewBox="0 0 160 160" aria-hidden="true">
            <defs>
              ${rings.map(
                (ring) => svg`
                  <linearGradient id="vr-grad-${ring.key}" class="c-${ring.key}" gradientUnits="userSpaceOnUse"
                    x1="0" y1="0" x2="0" y2="160">
                    <stop offset="0" style="stop-color:currentColor"></stop>
                    <stop offset="1" style="stop-color:var(--end, currentColor)"></stop>
                  </linearGradient>`,
              )}
            </defs>
            ${rings.map((ring, index) => {
              const r = radii[index];
              const length = 2 * Math.PI * r;
              const f = this._fraction(ring.score);
              return svg`
                <circle class="track c-${ring.key}" cx="80" cy="80" r=${r} stroke-width="10"></circle>
                <circle style="stroke:url(#vr-grad-${ring.key})" class="fill c-${ring.key} ${f <= 0 ? "empty" : ""}"
                  cx="80" cy="80" r=${r} stroke-width="10"
                  stroke-dasharray=${length} stroke-dashoffset=${length * (1 - f)}></circle>`;
            })}
          </svg>
          <div class="center">
            <span class="score">${total === null ? "--" : Math.round(total)}</span>
            <span class="band"><span class="band-dot"></span><span>${set.label}</span></span>
          </div>
        </div>
        ${rows
          ? html`<div class="rows">
              ${rings.map(
                (ring) => html`
                  <div
                    class="row c-${ring.key}"
                    tabindex="0"
                    aria-describedby=${this._tip === ring.key ? `vr-tip-${ring.key}` : nothing}
                    @pointerenter=${(event: Event) => this._openTip(ring.key, event)}
                    @pointerleave=${() => (this._tip = null)}
                    @focus=${(event: Event) => this._openTip(ring.key, event)}
                    @blur=${() => (this._tip = null)}
                  >
                    <div class="row-head">
                      <span class="dot"></span>
                      <span class="row-name">${ring.label}</span>
                      <span class="row-value"><b>${show(ring.score)}</b>/100</span>
                    </div>
                    <div class="bar"><div class="bar-fill" style="width:${this._fraction(ring.score) * 100}%"></div></div>
                    <div class="row-detail">
                      <span>${this._reading(ring.metric, ring.data)}</span><span>${this._best(ring.data)}</span>
                    </div>
                    ${this._tip === ring.key ? this._renderInfo(ring.key, ring.metric, ring.data) : nothing}
                  </div>
                `,
              )}
            </div>`
          : nothing}
      </div>
    `;
  }

  private _seg<T extends string | number>(
    name: string,
    options: readonly { value: T; label: string }[],
    current: T,
    pick: (value: T) => void,
  ): TemplateResult {
    return html`
      <span class="seg" role="group" aria-label=${name}>
        ${options.map(
          (option) => html`<button
            type="button"
            aria-pressed=${option.value === current ? "true" : "false"}
            @click=${() => pick(option.value)}
          >
            ${option.label}
          </button>`,
        )}
      </span>
    `;
  }

  private _hoverOf(chart: ChartId): number | null {
    return this._hover?.chart === chart ? this._hover.index : null;
  }

  private _setHover(chart: ChartId, index: number | null): void {
    this._hover = index === null ? null : { chart, index };
  }

  /** Where the value sits against what is usual: a band from low to high, and a dot. */
  private _range(metric: Metric | undefined, minSpan: number): TemplateResult | typeof nothing {
    const value = field(metric);
    const low = field(metric, "low");
    const high = field(metric, "high");
    const average = field(metric, "average");
    if (value === null || low === null || high === null || high < low) return nothing;
    const pad = Math.max(high - low, minSpan) * 0.6;
    const from = Math.min(low, value) - pad;
    const to = Math.max(high, value) + pad;
    const at = (v: number) => clamp01((v - from) / (to - from)) * 100;
    const where = value > high ? "above" : value < low ? "below" : "inside";
    return html`
      <div class="range" title="Your usual range, with today's value (${where} it)">
        <span class="range-band" style="left:${at(low)}%;width:${Math.max(3, at(high) - at(low))}%"></span>
        ${average !== null ? html`<span class="range-avg" style="left:${at(average)}%"></span>` : nothing}
        <span class="range-dot" style="left:${this._ready ? at(value) : 50}%"></span>
      </div>
    `;
  }

  private _usual(metric: Metric | undefined, digits: number): string {
    const low = field(metric, "low");
    const high = field(metric, "high");
    if (low === null || high === null) return "";
    const days = metric?.window_days ? ` · ${metric.window_days} days` : "";
    return `Usual ${show(low, digits)}–${show(high, digits)}${days}`;
  }

  private _stat(
    kind: string,
    name: string,
    value: TemplateResult | string,
    extra: TemplateResult | typeof nothing = nothing,
    note = "",
    wide = false,
  ): TemplateResult {
    return html`
      <div class="stat k-${kind} ${wide ? "wide" : ""}">
        <div class="stat-head"><span class="dot"></span><span class="stat-name">${name}</span></div>
        <div class="stat-value">${value}</div>
        ${extra}
        ${note ? html`<div class="stat-note">${note}</div>` : nothing}
      </div>
    `;
  }

  private _hourTicks(from: number, to: number): ChartTick[] {
    const hours = (to - from) / HOUR;
    const step = hours <= 24 ? 6 : hours <= 48 ? 12 : 24;
    const ticks: ChartTick[] = [];
    for (let at = Math.ceil(from / HOUR) * HOUR; at <= to; at += HOUR) {
      const hour = hourIn(at, this._timeZone);
      if (hour % step) continue;
      ticks.push({
        at,
        label:
          hour === 0
            ? formatWeekday(at, this._language, this._timeZone)
            : formatTime(at, this._language, this._timeZone),
      });
    }
    return ticks;
  }

  /** Month marks, or year marks on a long chart; at most about six of them. */
  private _dateTicks(from: number, to: number): ChartTick[] {
    const ticks: ChartTick[] = [];
    const first = new Date(from);
    if (to - from > 900 * DAY) {
      const years = new Date(to).getFullYear() - first.getFullYear();
      const every = Math.max(1, Math.ceil(years / 6));
      for (let year = first.getFullYear() + 1; year <= new Date(to).getFullYear(); year++) {
        if ((new Date(to).getFullYear() - year) % every) continue;
        ticks.push({ at: new Date(year, 0, 1).getTime(), label: String(year) });
      }
      return ticks;
    }
    const months: Date[] = [];
    for (let m = new Date(first.getFullYear(), first.getMonth() + 1, 1); m.getTime() <= to; ) {
      months.push(m);
      m = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    }
    const every = Math.max(1, Math.ceil(months.length / 6));
    months.forEach((month, index) => {
      if ((months.length - 1 - index) % every) return;
      ticks.push({
        at: month.getTime(),
        label:
          month.getMonth() === 0
            ? String(month.getFullYear())
            : month.toLocaleDateString(this._language, { month: "short" }),
      });
    });
    return ticks;
  }

  private _pointTitle(point: SeriesPoint, period: string): string {
    const language = this._language;
    const timeZone = this._timeZone;
    if (period === "hour") {
      return `${formatWeekday(point.start, language, timeZone)} ${formatTime(point.start, language, timeZone)} – ${formatTime(point.end, language, timeZone)}`;
    }
    // Days, weeks and months are named by a moment safely inside them.
    const inside = point.start + Math.min(DAY / 2, (point.end - point.start) / 2);
    if (period === "day") return formatDate(inside, language, timeZone);
    if (period === "week") return `Week of ${formatDate(inside, language, timeZone)}`;
    return new Date(inside).toLocaleDateString(language, { month: "long", year: "numeric" });
  }

  private _points(chart: ChartId, period: string, factor = 1): ChartPoint[] | null {
    const series = this._series[chart];
    if (!series) return null;
    return series.map((point) => ({
      at: (point.start + point.end) / 2,
      value: point.mean * factor,
      low: point.min * factor,
      high: point.max * factor,
      title: this._pointTitle(point, period),
    }));
  }

  private _renderHeart(): TemplateResult | typeof nothing {
    const latest = this._metric("heart_rate");
    const awake = this._metric("awake_heart_rate");
    const previous = this._metric("awake_heart_rate_previous");
    const workout = this._metric("workout_heart_rate");
    const points = this._points("heart", "hour");
    if (!this._summary) return nothing;
    const tiles = field(latest) !== null || field(awake) !== null || field(previous) !== null || workout;
    if (!points?.length && !tiles) return nothing;
    const measured = ago(latest?.measured_at, this._now);
    const since = awake?.since ? Date.parse(awake.since) : NaN;

    const to = this._now;
    const from = to - this._heartHours * HOUR;
    const chart =
      points === null
        ? html`<div class="chart-empty">${"Loading…"}</div>`
        : renderChart({
            kind: "k-heart",
            points,
            domain: [from, to],
            ticks: this._hourTicks(from, to),
            unit: "bpm",
            digits: 0,
            label: "Average",
            band: true,
            gapMs: 2.5 * HOUR,
            minSpan: 20,
            hover: this._hoverOf("heart"),
            onHover: (index) => this._setHover("heart", index),
            description: `Heart rate over the last ${this._heartHours} hours: hourly average, high and low`,
          });

    const workoutStart = workout?.start ? Date.parse(workout.start) : NaN;
    const duration = field(workout, "duration_minutes");
    const workoutMax = field(workout, "max");
    return html`
      <div class="section heart">
        <div class="section-head">
          <span>Heart rate</span>
          ${this._seg(
            "Period of the heart rate chart",
            [
              { value: 24, label: "24h" },
              { value: 48, label: "48h" },
              { value: 168, label: "7d" },
            ],
            this._heartHours,
            (hours) => {
              this._heartHours = hours;
              this._hover = null;
              void this._loadSeries("heart");
            },
          )}
        </div>
        ${chart}
        ${points?.length
          ? html`<div class="legend k-heart">
              <span class="high"><i></i>Hourly high</span>
              <span class="avg"><i></i>Average</span>
              <span class="low"><i></i>Hourly low</span>
            </div>`
          : nothing}
        ${tiles
          ? html`<div class="stats" style="margin-top:12px">
              ${field(latest) !== null
                ? this._stat(
                    "heart",
                    "Latest reading",
                    html`<b>${show(field(latest))}</b> bpm`,
                    nothing,
                    measured === null ? "" : measured === "now" ? "Just now" : `${measured} ago`,
                  )
                : nothing}
              ${field(awake) !== null
                ? this._stat(
                    "awake",
                    "Awake today",
                    html`<b>${show(field(awake))}</b> bpm`,
                    nothing,
                    Number.isFinite(since) ? `Since ${formatTime(since, this._language, this._timeZone)}` : "",
                  )
                : nothing}
              ${field(previous) !== null
                ? this._stat("awake", "Awake, day before", html`<b>${show(field(previous))}</b> bpm`, nothing, "Wake-up to bedtime")
                : nothing}
              ${workout
                ? this._stat(
                    "workout",
                    `${workoutName(workout.workout)}${duration !== null ? ` · ${formatDuration(duration)}` : ""}`,
                    field(workout) !== null
                      ? html`<b>${show(field(workout))}</b> bpm
                          avg${workoutMax !== null ? ` · max ${show(workoutMax)}` : ""}`
                      : html`<b>--</b> no heart rate yet`,
                    nothing,
                    Number.isFinite(workoutStart)
                      ? formatDayTime(workoutStart, this._language, this._timeZone)
                      : "",
                  )
                : nothing}
            </div>`
          : nothing}
      </div>
    `;
  }

  private _trendChart(
    chart: ChartId,
    range: TrendRange,
    options: { kind: string; label: string; unit: string; digits: number; minSpan: number; factor?: number; markers?: boolean; smooth?: boolean },
  ): TemplateResult {
    const trend = TREND[range];
    const points = this._points(chart, trend.period, options.factor ?? 1);
    if (points === null) return html`<div class="chart-empty">${"Loading…"}</div>`;
    const to = this._now;
    // "All" starts at the first reading rather than nineteen years ago.
    const from = range === "all" && points.length ? points[0].at - 15 * DAY : to - trend.days * DAY;
    return renderChart({
      kind: options.kind,
      points,
      domain: [from, to],
      ticks: this._dateTicks(from, to),
      unit: options.unit,
      digits: options.digits,
      label: options.label,
      markers: options.markers,
      smooth: options.smooth,
      minSpan: options.minSpan,
      hover: this._hoverOf(chart),
      onHover: (index) => this._setHover(chart, index),
      description: `${options.label} over time`,
    });
  }

  private _trendSeg(chart: "vo2" | "weight", name: string): TemplateResult {
    return this._seg(
      name,
      TREND_RANGES.map((value) => ({ value, label: TREND[value].label })),
      chart === "vo2" ? this._vo2Range : this._weightRange,
      (range) => {
        if (chart === "vo2") this._vo2Range = range;
        else this._weightRange = range;
        this._hover = null;
        // Empty the chart first: the old points belong to another period.
        this._series = { ...this._series, [chart]: undefined };
        void this._loadSeries(chart);
      },
    );
  }

  private _renderVitals(): TemplateResult | typeof nothing {
    const vo2 = this._metric("vo2_max");
    const value = field(vo2);
    if (!this._summary || (value === null && !this._series.vo2?.length)) return nothing;
    const percentile = field(vo2, "percentile");
    return html`
      <div class="section vitals">
        <div class="section-head">
          <span>${"VO₂ max"}</span>${this._trendSeg("vo2", "Period of the VO2 max chart")}
        </div>
        ${this._trendChart("vo2", this._vo2Range, {
          kind: "k-vo2",
          label: "VO₂ max",
          unit: "",
          digits: 1,
          minSpan: 2,
        })}
        ${value !== null
          ? html`<div class="stats" style="margin-top:12px">
              ${this._stat(
                "vo2",
                "Latest estimate",
                html`<b>${show(value, 1)}</b> ${"mL/kg·min"}`,
                this._range(vo2, 1),
                this._usual(vo2, 1),
              )}
              ${percentile !== null
                ? this._stat(
                    "vo2",
                    "Benchmark",
                    html`<b>${ordinal(percentile)}</b> percentile`,
                    nothing,
                    "Same age and sex",
                  )
                : nothing}
            </div>`
          : nothing}
      </div>
    `;
  }

  private _renderBody(): TemplateResult | typeof nothing {
    const weight = this._metric("weight");
    const height = this._metric("height");
    const bmi = this._metric("bmi");
    const kilograms = field(weight);
    if (!this._summary || (kilograms === null && field(height) === null && !this._series.weight?.length)) {
      return nothing;
    }
    const pounds = this._pounds;
    const factor = pounds ? KG_TO_LB : 1;
    const unit = pounds ? "lb" : "kg";

    // Change against the oldest weigh-in inside the window.
    const first = field(weight, "first");
    let trend = "";
    if (kilograms !== null && first !== null && (weight?.days ?? 0) > 1) {
      const change = (kilograms - first) * factor;
      const window = weight?.window_days ?? 30;
      trend =
        Math.abs(change) < 0.05
          ? `Steady over ${window} days`
          : `${change < 0 ? "Down" : "Up"} ${Math.abs(change).toFixed(1)} ${unit} in ${window} days`;
    }

    const index = field(bmi);
    const category = (bmi?.category ?? "").slice(0, 20);
    const [from, to] = BMI_SCALE;
    const zones = html`
      <div class="range zones" title="Underweight, healthy, overweight and obese (WHO adult classes)">
        <span class="z-low" style="flex:${18.5 - from}"></span>
        <span class="z-healthy" style="flex:${25 - 18.5}"></span>
        <span class="z-over" style="flex:${30 - 25}"></span>
        <span class="z-obese" style="flex:${to - 30}"></span>
        ${index !== null
          ? html`<span
              class="range-dot"
              style="flex:none;left:${this._ready ? clamp01((index - from) / (to - from)) * 100 : 50}%"
            ></span>`
          : nothing}
      </div>
    `;

    return html`
      <div class="section body">
        <div class="section-head">
          <span>Weight</span>${this._trendSeg("weight", "Period of the weight chart")}
        </div>
        ${this._trendChart("weight", this._weightRange, {
          kind: "k-weight",
          label: "Weight",
          unit,
          digits: 1,
          minSpan: 2,
          factor,
          markers: this._weightRange !== "3m",
          smooth: false,
        })}
        <div class="stats" style="margin-top:12px">
          ${kilograms !== null
            ? this._stat("weight", "Weight", html`<b>${show(kilograms * factor, 1)}</b> ${unit}`, nothing, trend)
            : nothing}
          ${index !== null
            ? this._stat(
                "bmi",
                "Body mass index",
                html`<b>${show(index, 1)}</b> ${category ? category.charAt(0).toUpperCase() + category.slice(1) : ""}`,
                zones,
                "Healthy 18.5–25",
              )
            : nothing}
          ${field(height) !== null
            ? this._stat("height", "Height", html`<b>${formatHeight(field(height) as number, pounds)}</b>`)
            : nothing}
        </div>
      </div>
    `;
  }
}

if (!customElements.get(CARD_TAG)) {
  customElements.define(CARD_TAG, VitalRingsCard);
}

declare global {
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
}

window.customCards = window.customCards ?? [];
if (!window.customCards.some((card) => card.type === CARD_TAG)) {
  window.customCards.push({
    type: CARD_TAG,
    name: "Vital Rings",
    description: "Two sets of rings scored against health benchmarks, a heart rate chart, VO2 max and weight.",
    preview: true,
  });
}

console.info(`%c VITAL-RINGS-CARD %c ${CARD_VERSION} `, "background:#d61fb6;color:#fff", "");
