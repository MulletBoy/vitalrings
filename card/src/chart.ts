import { html, nothing, svg, type TemplateResult } from "lit";

import { niceScale, show, tickLabel } from "./format";

export interface ChartPoint {
  /** Where the point sits on the time axis (milliseconds). */
  at: number;
  value: number;
  low?: number;
  high?: number;
  /** First line of the hover box, e.g. "Sat 14:00 - 15:00". */
  title: string;
}

export interface ChartTick {
  at: number;
  label: string;
}

export interface ChartOptions {
  /** Colour class: k-heart, k-vo2, k-weight... */
  kind: string;
  points: ChartPoint[];
  domain: [number, number];
  ticks: ChartTick[];
  unit: string;
  digits: number;
  /** Name of the value in the hover box. */
  label: string;
  /** Also draw each point's high and low as dashed lines. */
  band?: boolean;
  markers?: boolean;
  smooth?: boolean;
  /** Break the line where two points are further apart than this. */
  gapMs?: number;
  /** Smallest span of the value axis, so a flat line is not blown up. */
  minSpan?: number;
  hover: number | null;
  onHover: (index: number | null) => void;
  description: string;
}

// Upper bound on what one chart draws, whatever the integration sends.
export const MAX_CHART_POINTS = 400;

const clamp = (value: number, low = 0, high = 100) => Math.min(high, Math.max(low, value));
const fixed = (value: number) => value.toFixed(2);

type XY = [number, number];

/** A path through the points: straight, or smooth (Catmull-Rom as Bezier segments). */
function path(p: XY[], smooth: boolean): string {
  if (p.length === 1) return `M${fixed(p[0][0])},${fixed(p[0][1])} l0.01,0`;
  let d = `M${fixed(p[0][0])},${fixed(p[0][1])}`;
  for (let i = 0; i < p.length - 1; i++) {
    if (!smooth) {
      d += ` L${fixed(p[i + 1][0])},${fixed(p[i + 1][1])}`;
      continue;
    }
    const before = p[Math.max(0, i - 1)];
    const after = p[Math.min(p.length - 1, i + 2)];
    const c1: XY = [p[i][0] + (p[i + 1][0] - before[0]) / 6, clamp(p[i][1] + (p[i + 1][1] - before[1]) / 6)];
    const c2: XY = [p[i + 1][0] - (after[0] - p[i][0]) / 6, clamp(p[i + 1][1] - (after[1] - p[i][1]) / 6)];
    d += ` C${fixed(c1[0])},${fixed(c1[1])} ${fixed(c2[0])},${fixed(c2[1])} ${fixed(p[i + 1][0])},${fixed(p[i + 1][1])}`;
  }
  return d;
}

/** A line chart with a soft area, hover detail and a time axis. */
export function renderChart(o: ChartOptions): TemplateResult {
  const [t0, t1] = o.domain;
  const points = o.points
    .filter((p) => Number.isFinite(p.at) && Number.isFinite(p.value) && p.at >= t0 && p.at <= t1)
    .slice(-MAX_CHART_POINTS);
  if (points.length < 2 || !(t1 > t0)) {
    return html`<div class="chart-empty">Not enough readings in this period yet.</div>`;
  }
  const low = (p: ChartPoint) => (o.band ? (p.low ?? p.value) : p.value);
  const high = (p: ChartPoint) => (o.band ? (p.high ?? p.value) : p.value);
  const { bottom, top } = niceScale(
    Math.min(...points.map(low)),
    Math.max(...points.map(high)),
    o.minSpan ?? 2,
  );
  const range = top - bottom;
  const x = (at: number) => clamp(((at - t0) / (t1 - t0)) * 100);
  const y = (value: number) => clamp((1 - (value - bottom) / range) * 100);

  // Runs of points with no long gap between them: each run is one stretch of line.
  const runs: ChartPoint[][] = [];
  for (const point of points) {
    const run = runs[runs.length - 1];
    if (run && (!o.gapMs || point.at - run[run.length - 1].at <= o.gapMs)) run.push(point);
    else runs.push([point]);
  }
  const smooth = o.smooth !== false;
  const line = (pick: (p: ChartPoint) => number) =>
    runs.map((run) => path(run.map((p) => [x(p.at), y(pick(p))] as XY), smooth)).join(" ");
  const area = runs
    .filter((run) => run.length > 1)
    .map(
      (run) =>
        `${path(run.map((p) => [x(p.at), y(p.value)] as XY), smooth)} L${fixed(x(run[run.length - 1].at))},100 L${fixed(x(run[0].at))},100 Z`,
    )
    .join(" ");

  const xs = points.map((p) => x(p.at));
  const edge = (i: number) => (i <= 0 ? 0 : i >= points.length ? 100 : (xs[i - 1] + xs[i]) / 2);
  const picked = o.hover !== null ? points[o.hover] : undefined;
  const pickedX = picked ? x(picked.at) : 0;
  const value = (v: number) => `${show(v, o.digits)}${o.unit ? ` ${o.unit}` : ""}`;
  const axis = [top, bottom + range / 2, bottom];

  return html`
    <div class="chart ${o.kind}">
      <div class="yaxis">${axis.map((tick) => html`<span>${tickLabel(tick)}</span>`)}</div>
      <div class="plot" role="img" aria-label=${o.description} @pointerleave=${() => o.onHover(null)}>
        ${axis.map((_, i) => html`<div class="grid" style="top:${i * 50}%"></div>`)}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          ${area ? svg`<path class="area" d=${area}></path>` : nothing}
          ${o.band
            ? svg`<path class="line high" d=${line(high)}></path><path class="line low" d=${line(low)}></path>`
            : nothing}
          <path class="line avg" d=${line((p) => p.value)}></path>
        </svg>
        ${o.markers
          ? points.map((p) => html`<i class="mark" style="left:${x(p.at)}%;top:${y(p.value)}%"></i>`)
          : nothing}
        ${picked
          ? html`
              <div class="guide" style="left:${pickedX}%"></div>
              ${o.band
                ? html`<i class="dot high" style="left:${pickedX}%;top:${y(high(picked))}%"></i
                    ><i class="dot low" style="left:${pickedX}%;top:${y(low(picked))}%"></i>`
                : nothing}
              <i class="dot avg" style="left:${pickedX}%;top:${y(picked.value)}%"></i>
              <div class="tip ${pickedX > 55 ? "left" : ""}" style="left:${pickedX}%">
                <b>${picked.title}</b>
                ${o.band
                  ? html`<span class="high"><i></i>High<u>${value(high(picked))}</u></span>
                      <span class="avg"><i></i>${o.label}<u>${value(picked.value)}</u></span>
                      <span class="low"><i></i>Low<u>${value(low(picked))}</u></span>`
                  : html`<span class="avg"><i></i>${o.label}<u>${value(picked.value)}</u></span>`}
              </div>
            `
          : nothing}
        ${points.map(
          (p, i) => html`<button
            class="hit"
            style="left:${edge(i)}%;width:${edge(i + 1) - edge(i)}%"
            aria-label="${p.title}: ${o.label} ${value(p.value)}"
            @pointerenter=${() => o.onHover(i)}
            @focus=${() => o.onHover(i)}
            @blur=${() => o.onHover(null)}
            @click=${() => o.onHover(i)}
          ></button>`,
        )}
      </div>
      <div class="xaxis">
        ${o.ticks
          .filter((tick) => tick.at >= t0 && tick.at <= t1)
          .map((tick) => {
            const at = x(tick.at);
            const align = at < 6 ? "" : at > 94 ? "end" : "centered";
            return html`<span class=${align} style="left:${at}%">${tick.label}</span>`;
          })}
      </div>
    </div>
  `;
}
