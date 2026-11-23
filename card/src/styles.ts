import { css } from "lit";

/**
 * Colour resolution, most specific first:
 *   --vr-*                     set inline from the card's preset / colors
 *   --vital-rings-*-color      optional, from a Home Assistant theme
 *   built-in fallback          mid-tones that read on light and dark cards
 */
export const styles = css`
  :host {
    display: block;
    container-type: inline-size;
  }

  /* Colour tokens live on ha-card, where the preset's --vr-* values are set inline. */
  ha-card {
    --_resting: var(--vr-resting, var(--vital-rings-resting-color, #e5484d));
    --_recovery: var(--vr-recovery, var(--vital-rings-recovery-color, #14b8a6));
    --_breathing: var(--vr-breathing, var(--vital-rings-breathing-color, #f59e0b));
    --_sleeping: var(--vr-sleeping, var(--vital-rings-sleeping-color, #6366f1));
    --_oxygen: var(--vr-oxygen, var(--vital-rings-oxygen-color, #ec4899));
    --_vo2: var(--vr-vo2, var(--vital-rings-vo2-color, #22c55e));
    --_heart: var(--vr-heart, var(--vital-rings-heart-color, #e5484d));
    --_heart-low: var(--vr-heart-low, var(--vital-rings-heart-low-color, #8b5cf6));
    --_awake: var(--vr-awake, var(--vital-rings-awake-color, #f59e0b));
    --_workout: var(--vr-workout, var(--vital-rings-workout-color, #f59e0b));
    --_weight: var(--vr-weight, var(--vital-rings-weight-color, #8b5cf6));
    --_bmi: var(--vr-bmi, var(--vital-rings-bmi-color, #14b8a6));
    --_height: var(--vr-height, var(--vital-rings-height-color, #6366f1));
    --_fresh: var(--vr-fresh, var(--vital-rings-fresh-color, #22c55e));
    --_recent: var(--vr-recent, var(--vital-rings-recent-color, #f59e0b));
    --_stale: var(--vr-stale, var(--vital-rings-stale-color, #ef4444));
    --_text: var(--vr-text, var(--primary-text-color, #1c1c1e));
    --_text2: var(--vr-secondary-text, var(--secondary-text-color, #6b6b70));
    --_divider: var(--vr-divider, var(--divider-color, rgba(127, 127, 127, 0.25)));
    --_accent-text: var(--vr-accent-text, var(--_text));
    --_glow: var(--vr-glow, 0px);
    --_surface: var(--ha-card-background, var(--card-background-color, #fff));
  }

  ha-card {
    display: block;
    padding: 16px;
    color: var(--_text);
    overflow: hidden;
  }

  .header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 12px;
  }
  .title {
    font-size: 16px;
    font-weight: 600;
  }

  /* Marker beside the title: how long ago the health data last arrived */
  .age {
    display: inline-block;
    padding: 1px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    border: 1px solid color-mix(in srgb, currentColor 45%, transparent);
    background: color-mix(in srgb, currentColor 12%, transparent);
  }
  .age.fresh {
    color: var(--_fresh);
  }
  .age.recent {
    color: var(--_recent);
  }
  .age.stale {
    color: var(--_stale);
  }

  /* Two sets of rings; in each, the rings sit beside a row per ring */
  .sets {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .set {
    display: flex;
    align-items: center;
    gap: 20px;
    min-width: 0;
  }
  .rings {
    position: relative;
    flex: 0 0 164px;
    width: 164px;
    height: 164px;
  }
  .rings svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
    overflow: visible;
  }
  .track,
  .fill {
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
  }
  .track {
    stroke: var(--vr-track, currentColor);
    opacity: var(--vr-track-opacity, 0.16);
  }
  .fill {
    transition:
      stroke-dashoffset 0.7s ease,
      stroke-dasharray 0.7s ease;
    filter: drop-shadow(0 0 calc(var(--_glow) * 0.5) color-mix(in srgb, currentColor 55%, transparent));
  }
  .fill.empty {
    opacity: 0;
  }
  .c-resting {
    color: var(--_resting);
    --end: var(--vr-resting-end, var(--_resting));
  }
  .c-recovery {
    color: var(--_recovery);
    --end: var(--vr-recovery-end, var(--_recovery));
  }
  .c-breathing {
    color: var(--_breathing);
    --end: var(--vr-breathing-end, var(--_breathing));
  }
  .c-sleeping {
    color: var(--_sleeping);
    --end: var(--vr-sleeping-end, var(--_sleeping));
  }
  .c-oxygen {
    color: var(--_oxygen);
    --end: var(--vr-oxygen-end, var(--_oxygen));
  }
  .c-vo2 {
    color: var(--_vo2);
    --end: var(--vr-vo2-end, var(--_vo2));
  }

  .center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    pointer-events: none;
    color: var(--_text);
  }
  .score {
    font-size: 30px;
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }
  .band {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
    color: var(--_text2);
  }
  .band-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--band, var(--_text2));
    box-shadow: 0 0 var(--_glow) var(--band, transparent);
  }
  /* How the set scores overall: the colour of the dot and of the glow */
  .b-excellent,
  .b-good {
    --band: var(--_fresh);
  }
  .b-fair {
    --band: var(--_recent);
  }
  .b-low {
    --band: var(--_stale);
  }

  .rows {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .row-head {
    display: flex;
    align-items: baseline;
    gap: 6px;
    font-size: 13px;
  }
  .dot {
    align-self: center;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    flex: none;
  }
  .row-name {
    flex: 1;
    font-weight: 600;
    color: var(--_accent-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .row-value {
    color: var(--_text2);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .row-value b {
    color: var(--_text);
    font-size: 15px;
    font-weight: 700;
  }
  .bar {
    height: 5px;
    margin: 5px 0 4px;
    border-radius: 3px;
    background: var(--vr-track, color-mix(in srgb, currentColor 16%, transparent));
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, currentColor, var(--end, currentColor));
    box-shadow: 0 0 var(--_glow) color-mix(in srgb, currentColor 60%, transparent);
    transition: width 0.7s ease;
  }
  .row-detail {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 12px;
    color: var(--_text2);
  }
  .row-detail span:last-child {
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  /* Information box of a ring: floats under its row, or above it near the card's bottom edge */
  .row {
    position: relative;
    cursor: help;
  }
  .row:focus-visible {
    outline: 2px solid var(--_text2);
    outline-offset: 2px;
    border-radius: 14px;
  }
  .info {
    position: absolute;
    z-index: 5;
    top: calc(100% + 6px);
    right: 0;
    width: max(100%, 250px);
    max-width: 340px;
    box-sizing: border-box;
    padding: 9px 11px;
    border-radius: 10px;
    font-size: 12px;
    line-height: 1.4;
    color: #f4f1fa;
    background: #120e1c;
    border: 1px solid color-mix(in srgb, currentColor 55%, rgba(255, 255, 255, 0.14));
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.45);
    pointer-events: none;
  }
  .info.above {
    top: auto;
    bottom: calc(100% + 6px);
  }
  .info b {
    display: block;
    font-size: 13px;
    font-weight: 600;
  }
  .info p {
    margin: 5px 0 0;
    color: #d9d2ea;
  }
  .info i {
    font-style: normal;
    font-weight: 600;
    color: #f4f1fa;
    margin-right: 6px;
  }

  /* Sections under the hero */
  .section {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--_divider);
  }
  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 24px;
    font-size: 12px;
    color: var(--_text2);
    margin-bottom: 8px;
  }
  .section-head > span:first-child {
    font-weight: 600;
    color: var(--_text);
  }
  .section.heart {
    --tint: var(--vr-heart-tint, var(--_heart));
  }
  .section.vitals {
    --tint: var(--vr-vitals-tint, var(--_vo2));
  }
  .section.body {
    --tint: var(--vr-body-tint, var(--_weight));
  }
  .sub-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin: 14px 0 8px;
    font-size: 12px;
    color: var(--_text2);
  }
  .sub-head > span:first-child {
    font-weight: 600;
    color: var(--_text);
  }

  /* Small switch for a chart's period */
  .seg {
    display: inline-flex;
    border: 1px solid var(--_divider);
    border-radius: 8px;
    overflow: hidden;
  }
  .seg button {
    font: inherit;
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
    padding: 5px 8px;
    border: 0;
    background: none;
    color: var(--_text2);
    cursor: pointer;
  }
  .seg button + button {
    border-left: 1px solid var(--_divider);
  }
  .seg button:hover {
    color: var(--_text);
  }
  .seg button[aria-pressed="true"] {
    color: var(--_text);
    background: color-mix(in srgb, var(--tint, var(--_text)) 22%, transparent);
  }
  .seg button:focus-visible {
    outline: 2px solid var(--_text2);
    outline-offset: -2px;
  }

  /* Colour of a tile or chart */
  .k-heart {
    --k: var(--_heart);
    --k2: var(--_heart-low);
  }
  .k-awake {
    --k: var(--_awake);
  }
  .k-workout {
    --k: var(--_workout);
  }
  .k-vo2 {
    --k: var(--_vo2);
  }
  .k-weight {
    --k: var(--_weight);
  }
  .k-bmi {
    --k: var(--_bmi);
  }
  .k-height {
    --k: var(--_height);
  }

  /* Figures: name, value, and where the value sits in the usual range */
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
    gap: 12px 16px;
  }
  .stat {
    min-width: 0;
    color: var(--k, currentColor);
  }
  .stat.wide {
    grid-column: 1 / -1;
  }
  .stat-head {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }
  .stat-name {
    color: var(--_text2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .stat-value {
    margin-top: 2px;
    font-size: 12px;
    color: var(--_text2);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .stat-value b {
    color: var(--_text);
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .stat-note {
    margin-top: 3px;
    font-size: 11px;
    color: var(--_text2);
    font-variant-numeric: tabular-nums;
  }
  .range {
    position: relative;
    height: 6px;
    margin: 7px 5px 0;
    border-radius: 3px;
    background: var(--vr-track, color-mix(in srgb, currentColor 16%, transparent));
  }
  .range-band {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 3px;
    background: color-mix(in srgb, currentColor 45%, transparent);
  }
  .range-avg {
    position: absolute;
    top: -2px;
    bottom: -2px;
    width: 2px;
    margin-left: -1px;
    border-radius: 1px;
    background: var(--_text2);
    opacity: 0.7;
  }
  .range-dot {
    position: absolute;
    top: 50%;
    width: 10px;
    height: 10px;
    margin: -5px 0 0 -5px;
    border-radius: 50%;
    background: currentColor;
    box-shadow:
      0 0 0 2px var(--_surface),
      0 0 calc(var(--_glow) + 2px) currentColor;
    transition: left 0.7s ease;
  }
  /* Body mass index: the four classes side by side */
  .zones {
    display: flex;
    gap: 2px;
    background: none;
  }
  .zones > span:not(.range-dot) {
    height: 100%;
    border-radius: 3px;
    opacity: 0.55;
  }
  .zones .z-low,
  .zones .z-over {
    background: var(--_recent);
  }
  .zones .z-healthy {
    background: var(--_fresh);
  }
  .zones .z-obese {
    background: var(--_stale);
  }

  /* Charts */
  .chart {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    column-gap: 6px;
  }
  .yaxis {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 112px;
    margin: -5px 0;
    font-size: 10px;
    line-height: 10px;
    text-align: right;
    color: var(--_text2);
    font-variant-numeric: tabular-nums;
  }
  .plot {
    position: relative;
    height: 102px;
  }
  .plot svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .grid {
    position: absolute;
    left: 0;
    right: 0;
    border-top: 1px dashed var(--_divider);
  }
  .line {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }
  .line.avg {
    stroke: var(--k);
    stroke-width: 2.5;
    filter: drop-shadow(0 0 var(--_glow) color-mix(in srgb, var(--k) 55%, transparent));
  }
  .line.high {
    stroke: var(--k);
    stroke-width: 1;
    stroke-dasharray: 4 4;
    opacity: 0.55;
  }
  .line.low {
    stroke: var(--k2, var(--k));
    stroke-width: 1;
    stroke-dasharray: 4 4;
    opacity: 0.8;
  }
  .area {
    fill: color-mix(in srgb, var(--k) 18%, transparent);
    stroke: none;
  }
  .mark {
    position: absolute;
    width: 6px;
    height: 6px;
    margin: -3px 0 0 -3px;
    border-radius: 50%;
    background: var(--k2, var(--k));
    box-shadow: 0 0 var(--_glow) var(--k2, var(--k));
    pointer-events: none;
  }
  /* Hover: one invisible column per point, a guide line, dots and a floating box */
  .hit {
    position: absolute;
    top: 0;
    bottom: 0;
    background: none;
    border: 0;
    padding: 0;
    cursor: crosshair;
  }
  .hit:focus-visible {
    outline: 1px solid var(--_text2);
    outline-offset: -1px;
  }
  .guide,
  .plot .dot,
  .tip {
    position: absolute;
    pointer-events: none;
  }
  .guide {
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--_text2);
    opacity: 0.45;
  }
  .plot .dot {
    width: 8px;
    height: 8px;
    margin: -4px 0 0 -4px;
    border-radius: 50%;
    background: var(--k);
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.35);
  }
  .plot .dot.low {
    background: var(--k2, var(--k));
  }
  /* The box floats over the chart, so showing it never moves the layout. */
  .tip {
    top: 4px;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-left: 10px;
    padding: 6px 9px;
    border-radius: 8px;
    font-size: 11px;
    white-space: nowrap;
    color: #f4f1fa;
    background: rgba(18, 14, 28, 0.94);
    border: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  }
  .tip.left {
    margin-left: -10px;
    transform: translateX(-100%);
  }
  .tip b {
    font-weight: 600;
  }
  .tip span {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .tip u {
    margin-left: auto;
    padding-left: 12px;
    text-decoration: none;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .tip i,
  .legend i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--k);
  }
  .tip .high i,
  .legend .high i {
    opacity: 0.55;
  }
  .tip .low i,
  .legend .low i {
    background: var(--k2, var(--k));
  }
  .xaxis {
    position: relative;
    grid-column: 2;
    height: 14px;
    margin-top: 3px;
    font-size: 10px;
    color: var(--_text2);
  }
  .xaxis span {
    position: absolute;
    white-space: nowrap;
  }
  .xaxis span.centered {
    transform: translateX(-50%);
  }
  .xaxis span.end {
    transform: translateX(-100%);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px 14px;
    margin-top: 6px;
    font-size: 11px;
    color: var(--_text2);
  }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .chart-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 119px;
    font-size: 12px;
    color: var(--_text2);
    text-align: center;
  }

  /* Tiles: every part in its own tinted, softly glowing box */
  ha-card.tiles {
    --_glow: var(--vr-glow, 3px);
  }
  .tiles .rows {
    gap: 8px;
  }
  .tiles .row,
  .tiles .section {
    padding: 10px 12px;
    border-radius: 14px;
    border: 1px solid color-mix(in srgb, var(--tint, currentColor) var(--vr-tile-border, 24%), transparent);
    background: color-mix(in srgb, var(--tint, currentColor) var(--vr-tile-fill, 7%), transparent);
    box-shadow:
      0 0 16px color-mix(in srgb, var(--tint, currentColor) var(--vr-tile-glow, 9%), transparent),
      inset 0 0 20px color-mix(in srgb, var(--tint, currentColor) var(--vr-tile-inset, 0%), transparent);
  }
  .tiles .section {
    margin-top: 12px;
  }
  .tiles .section-head > span:first-child {
    color: color-mix(in srgb, var(--tint) var(--vr-title-tint, 0%), var(--_text));
  }
  .tiles .bar {
    margin-bottom: 5px;
  }
  .tiles .rings {
    isolation: isolate;
  }
  .tiles .rings::before {
    content: "";
    position: absolute;
    inset: -14px;
    z-index: -1;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      color-mix(in srgb, var(--band, transparent) var(--vr-halo, 7%), transparent) 0%,
      transparent 68%
    );
    pointer-events: none;
  }
  .tiles .score {
    text-shadow: 0 0 12px color-mix(in srgb, var(--band, transparent) var(--vr-score-glow, 0%), transparent);
  }

  .message {
    font-size: 13px;
    color: var(--_text2);
    padding: 8px 0;
  }

  /* A slim card: rings above their rows */
  @container (max-width: 419px) {
    .set {
      flex-direction: column;
      align-items: stretch;
      gap: 14px;
    }
    .rings {
      align-self: center;
    }
  }

  /* Two dashboard columns and wider: the two sets side by side, the heart
     rate chart across the card, then VO2 max and body side by side. */
  @container (min-width: 640px) {
    .sets {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 12px 28px;
      align-items: start;
    }
    .panels {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      column-gap: 28px;
      align-items: stretch;
    }
    .tiles .panels {
      column-gap: 12px;
    }
    .panels > .section.heart,
    .panels.n1 > .section {
      grid-column: 1 / -1;
    }
  }

  /* Between two and three columns each set is slim: rings above the rows */
  @container (min-width: 640px) and (max-width: 959px) {
    .set {
      flex-direction: column;
      align-items: stretch;
      gap: 14px;
    }
    .rings {
      align-self: center;
    }
  }

  /* Three columns: heart rate, VO2 max and body side by side */
  @container (min-width: 960px) {
    .panels.n3 {
      grid-template-columns: minmax(0, 6fr) minmax(0, 5fr) minmax(0, 5fr);
    }
    .panels.n3 > .section.heart {
      grid-column: auto;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .fill,
    .bar-fill,
    .range-dot {
      transition: none;
    }
  }
`;
