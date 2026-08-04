// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Scoped presentation for the GPU-resident crossfilter intelligence surface. */
export const CROSSFILTER_STYLES = `
[data-crossfilter-dashboard] {
  --crossfilter-ink: #e7f5ff;
  --crossfilter-muted: #8295a9;
  --crossfilter-dim: #526477;
  --crossfilter-cyan: #54edff;
  --crossfilter-violet: #aa91ff;
  --crossfilter-amber: #ffc778;
  --crossfilter-coral: #ff7f8f;
  --crossfilter-line: rgba(132, 181, 207, .14);
  --crossfilter-panel: rgba(5, 12, 22, .85);
  position: absolute;
  z-index: 8;
  inset: 0;
  overflow: hidden;
  color: var(--crossfilter-ink);
  font: 12px/1.45 Inter, "SF Pro Display", ui-sans-serif, system-ui, sans-serif;
  letter-spacing: .012em;
  pointer-events: none;
  -webkit-font-smoothing: antialiased;
}

[data-crossfilter-dashboard] *,
[data-crossfilter-dashboard] *::before,
[data-crossfilter-dashboard] *::after { box-sizing: border-box; }

[data-crossfilter-dashboard] .crossfilter-shell {
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: clamp(13px, 1.55vw, 24px);
  gap: 12px;
  grid-template-rows: auto auto auto minmax(230px, 1fr) minmax(118px, .42fr) auto;
  background:
    radial-gradient(ellipse at 8% -13%, rgba(66, 118, 203, .14), transparent 45%),
    radial-gradient(ellipse at 96% 108%, rgba(89, 46, 149, .13), transparent 42%);
}

[data-crossfilter-dashboard] button {
  color: inherit;
  font: inherit;
}

[data-crossfilter-dashboard] button:focus-visible,
[data-crossfilter-dashboard] [tabindex]:focus-visible {
  outline: 1px solid var(--crossfilter-cyan);
  outline-offset: 3px;
}

[data-crossfilter-dashboard] .crossfilter-header {
  display: flex;
  min-height: 54px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  pointer-events: auto;
}

[data-crossfilter-dashboard] .crossfilter-brand {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 13px;
}

[data-crossfilter-dashboard] .crossfilter-brand-mark {
  display: grid;
  width: 41px;
  height: 41px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid rgba(91, 227, 247, .33);
  border-radius: 12px;
  background:
    radial-gradient(circle at 68% 27%, rgba(95, 125, 255, .38), transparent 57%),
    rgba(7, 21, 33, .87);
  box-shadow: 0 0 24px rgba(64, 208, 239, .1);
}

[data-crossfilter-dashboard] .crossfilter-brand-mark svg {
  width: 25px;
  height: 25px;
  color: var(--crossfilter-cyan);
}

[data-crossfilter-dashboard] .crossfilter-eyebrow,
[data-crossfilter-dashboard] .crossfilter-label {
  color: var(--crossfilter-muted);
  font: 650 9px/1.25 "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  letter-spacing: .105em;
  text-transform: uppercase;
}

[data-crossfilter-dashboard] .crossfilter-eyebrow { color: #88adbf; }

[data-crossfilter-dashboard] h1 {
  margin: 2px 0 0;
  font-size: clamp(17px, 2.15vw, 25px);
  font-weight: 670;
  letter-spacing: -.055em;
  line-height: 1.05;
}

[data-crossfilter-dashboard] .crossfilter-header-meta {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}

[data-crossfilter-dashboard] .crossfilter-badge {
  display: inline-flex;
  min-height: 25px;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  border: 1px solid rgba(93, 222, 245, .24);
  border-radius: 5px;
  background: rgba(6, 20, 30, .77);
  color: #95f3ff;
  font: 700 9px/1 ui-monospace, "SFMono-Regular", monospace;
  letter-spacing: .05em;
}

[data-crossfilter-dashboard] .crossfilter-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #64efbd;
  box-shadow: 0 0 12px #64efbd;
}

[data-crossfilter-dashboard] .crossfilter-command-row {
  display: flex;
  min-height: 38px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 8px;
  border: 1px solid var(--crossfilter-line);
  border-radius: 8px;
  background: rgba(5, 13, 23, .69);
  backdrop-filter: blur(14px);
  pointer-events: auto;
}

[data-crossfilter-dashboard] .crossfilter-presets {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
}

[data-crossfilter-dashboard] .crossfilter-preset,
[data-crossfilter-dashboard] .crossfilter-reset {
  min-height: 25px;
  padding: 0 9px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #a4b5c4;
  cursor: pointer;
  font-size: 10px;
  font-weight: 560;
  white-space: nowrap;
}

[data-crossfilter-dashboard] .crossfilter-preset:hover,
[data-crossfilter-dashboard] .crossfilter-preset[aria-pressed="true"] {
  border-color: rgba(87, 227, 246, .23);
  background: rgba(44, 140, 164, .14);
  color: #a9f9ff;
}

[data-crossfilter-dashboard] .crossfilter-preset[data-preset="anomaly"]:hover,
[data-crossfilter-dashboard] .crossfilter-preset[data-preset="anomaly"][aria-pressed="true"] {
  border-color: rgba(255, 131, 150, .32);
  background: rgba(161, 49, 68, .18);
  color: #ffabb7;
}

[data-crossfilter-dashboard] .crossfilter-reset {
  border-color: rgba(157, 184, 201, .18);
  color: #b8c9d6;
}

[data-crossfilter-dashboard] .crossfilter-reset:hover {
  border-color: rgba(255, 140, 156, .35);
  color: #ffabb7;
}

[data-crossfilter-dashboard] .crossfilter-metrics {
  display: grid;
  min-height: 61px;
  gap: 9px;
  grid-template-columns: 1.24fr 1.3fr 1fr .94fr .94fr;
  pointer-events: auto;
}

[data-crossfilter-dashboard] .crossfilter-metric {
  position: relative;
  min-width: 0;
  padding: 8px 10px;
  overflow: hidden;
  border: 1px solid var(--crossfilter-line);
  border-radius: 7px;
  background: var(--crossfilter-panel);
}

[data-crossfilter-dashboard] .crossfilter-metric::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(78, 224, 247, .48), transparent 75%);
  content: "";
}

[data-crossfilter-dashboard] .crossfilter-metric-value {
  display: block;
  margin-top: 4px;
  overflow: hidden;
  color: #e8f6ff;
  font-size: clamp(13px, 1.6vw, 18px);
  font-variant-numeric: tabular-nums;
  font-weight: 610;
  letter-spacing: -.045em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

[data-crossfilter-dashboard] [data-selected-count] { color: var(--crossfilter-cyan); }
[data-crossfilter-dashboard] [data-selected-percentage] { color: #8ba1af; font-size: .68em; }

[data-crossfilter-dashboard] .crossfilter-workspace {
  display: grid;
  min-height: 0;
  gap: 11px;
  grid-template-columns: minmax(0, 1.66fr) minmax(230px, .8fr);
}

[data-crossfilter-dashboard] .crossfilter-map-card,
[data-crossfilter-dashboard] .crossfilter-scatter-card,
[data-crossfilter-dashboard] .crossfilter-group-card,
[data-crossfilter-dashboard] .crossfilter-histogram-card {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--crossfilter-line);
  border-radius: 8px;
  pointer-events: auto;
}

[data-crossfilter-dashboard] .crossfilter-map-card {
  isolation: isolate;
  background: transparent;
}

[data-crossfilter-dashboard] .crossfilter-map-card::before,
[data-crossfilter-dashboard] .crossfilter-scatter-card::before {
  position: absolute;
  z-index: -1;
  background:
    linear-gradient(180deg, rgba(3, 10, 19, .78), transparent 18%, transparent 80%, rgba(3, 10, 19, .63)),
    radial-gradient(ellipse at 45% 45%, transparent 25%, rgba(3, 10, 18, .18));
  content: "";
  inset: 0;
  pointer-events: none;
}

[data-crossfilter-dashboard] .crossfilter-map-surface,
[data-crossfilter-dashboard] .crossfilter-scatter-surface {
  position: absolute;
  z-index: 1;
  overflow: hidden;
  touch-action: none;
  cursor: crosshair;
}

[data-crossfilter-dashboard] .crossfilter-map-surface { inset: 46px 13px 39px; }
[data-crossfilter-dashboard] .crossfilter-scatter-surface { inset: 39px 14px 31px 36px; }

[data-crossfilter-dashboard] .crossfilter-map-geography,
[data-crossfilter-dashboard] .crossfilter-scatter-grid {
  position: absolute;
  z-index: 0;
  width: 100%;
  height: 100%;
  inset: 0;
  pointer-events: none;
}

[data-crossfilter-dashboard] .crossfilter-map-geography {
  color: rgba(87, 151, 175, .21);
}

[data-crossfilter-dashboard] .crossfilter-view-title {
  position: absolute;
  z-index: 3;
  top: 11px;
  right: 12px;
  left: 12px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  pointer-events: none;
}

[data-crossfilter-dashboard] .crossfilter-view-title strong {
  font-size: 11px;
  font-weight: 620;
}

[data-crossfilter-dashboard] .crossfilter-view-title span,
[data-crossfilter-dashboard] .crossfilter-view-footer {
  color: #718b9d;
  font: 9px/1.3 ui-monospace, "SFMono-Regular", monospace;
}

[data-crossfilter-dashboard] .crossfilter-view-footer {
  position: absolute;
  z-index: 3;
  right: 12px;
  bottom: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  pointer-events: none;
}

[data-crossfilter-dashboard] .crossfilter-coordinate {
  color: #a1c0d0;
  white-space: nowrap;
}

[data-crossfilter-dashboard] .crossfilter-side-rail {
  display: grid;
  min-height: 0;
  gap: 10px;
  grid-template-rows: minmax(142px, 1.28fr) minmax(108px, .85fr);
}

[data-crossfilter-dashboard] .crossfilter-scatter-card {
  isolation: isolate;
  background: transparent;
}

[data-crossfilter-dashboard] .crossfilter-scatter-axis {
  position: absolute;
  z-index: 2;
  color: #647e91;
  font: 8px/1 ui-monospace, "SFMono-Regular", monospace;
  pointer-events: none;
}

[data-crossfilter-dashboard] .crossfilter-scatter-axis-x { right: 15px; bottom: 12px; }
[data-crossfilter-dashboard] .crossfilter-scatter-axis-y { top: 46px; left: 12px; writing-mode: vertical-rl; }

[data-crossfilter-dashboard] .crossfilter-group-card {
  display: grid;
  padding: 10px 12px;
  gap: 8px;
  grid-template-rows: auto minmax(0, 1fr);
  background: var(--crossfilter-panel);
}

[data-crossfilter-dashboard] .crossfilter-group-heading,
[data-crossfilter-dashboard] .crossfilter-histogram-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

[data-crossfilter-dashboard] .crossfilter-group-heading strong,
[data-crossfilter-dashboard] .crossfilter-histogram-heading strong {
  overflow: hidden;
  font-size: 10px;
  font-weight: 640;
  text-overflow: ellipsis;
  white-space: nowrap;
}

[data-crossfilter-dashboard] .crossfilter-group-list {
  display: grid;
  min-height: 0;
  align-content: center;
  gap: 5px;
}

[data-crossfilter-dashboard] .crossfilter-group {
  position: relative;
  display: grid;
  width: 100%;
  min-height: 15px;
  align-items: center;
  padding: 1px 0;
  gap: 7px;
  grid-template-columns: minmax(67px, .76fr) minmax(35px, 1fr) auto;
  border: 0;
  background: transparent;
  color: #b4c5d1;
  cursor: pointer;
  text-align: left;
}

[data-crossfilter-dashboard] .crossfilter-group:hover,
[data-crossfilter-dashboard] .crossfilter-group[aria-pressed="true"] { color: #effbff; }

[data-crossfilter-dashboard] .crossfilter-group-name {
  overflow: hidden;
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

[data-crossfilter-dashboard] .crossfilter-group-track {
  height: 5px;
  overflow: hidden;
  border-radius: 3px;
  background: rgba(131, 160, 181, .11);
}

[data-crossfilter-dashboard] .crossfilter-group-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--group-color, var(--crossfilter-cyan));
  box-shadow: 0 0 11px var(--group-color, var(--crossfilter-cyan));
}

[data-crossfilter-dashboard] .crossfilter-group-count {
  font: 9px/1 ui-monospace, "SFMono-Regular", monospace;
  font-variant-numeric: tabular-nums;
}

[data-crossfilter-dashboard] .crossfilter-histograms {
  display: grid;
  min-height: 0;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

[data-crossfilter-dashboard] .crossfilter-histogram-card {
  display: grid;
  min-height: 0;
  padding: 9px 10px 8px;
  gap: 7px;
  grid-template-rows: auto minmax(40px, 1fr) auto;
  background: var(--crossfilter-panel);
}

[data-crossfilter-dashboard] .crossfilter-histogram-heading span {
  color: var(--crossfilter-muted);
  font: 8px/1 ui-monospace, "SFMono-Regular", monospace;
}

[data-crossfilter-dashboard] .crossfilter-histogram-surface {
  position: relative;
  min-height: 0;
  overflow: hidden;
  border-bottom: 1px solid rgba(145, 176, 197, .19);
  background-image: linear-gradient(to bottom, rgba(117, 155, 178, .1) 1px, transparent 1px);
  background-size: 100% 33.333%;
  cursor: ew-resize;
  touch-action: none;
}

[data-crossfilter-dashboard] .crossfilter-histogram-bars {
  position: absolute;
  display: flex;
  align-items: flex-end;
  gap: max(1px, .42%);
  inset: 0;
  pointer-events: none;
}

[data-crossfilter-dashboard] .crossfilter-histogram-bin {
  position: relative;
  display: block;
  height: 100%;
  min-width: 0;
  flex: 1 1 0;
}

[data-crossfilter-dashboard] .crossfilter-histogram-bar {
  position: absolute;
  z-index: 1;
  right: 0;
  bottom: 0;
  left: 0;
  display: block;
  border-radius: 1px 1px 0 0;
  background: color-mix(in srgb, var(--histogram-color) 82%, white 5%);
  box-shadow: 0 0 8px color-mix(in srgb, var(--histogram-color) 25%, transparent);
}

[data-crossfilter-dashboard] .crossfilter-histogram-baseline {
  position: absolute;
  z-index: 0;
  bottom: 0;
  width: 100%;
  background: color-mix(in srgb, var(--histogram-color) 23%, transparent);
}

[data-crossfilter-dashboard] .crossfilter-histogram-axis {
  display: flex;
  justify-content: space-between;
  color: #73889a;
  font: 8px/1 ui-monospace, "SFMono-Regular", monospace;
}

[data-crossfilter-dashboard] .crossfilter-brush {
  position: absolute;
  z-index: 4;
  display: none;
  border: 1px solid rgba(104, 241, 255, .91);
  background: rgba(74, 226, 247, .11);
  box-shadow:
    inset 0 0 24px rgba(74, 226, 247, .11),
    0 0 15px rgba(66, 219, 243, .15);
  pointer-events: none;
}

[data-crossfilter-dashboard] .crossfilter-brush[data-active="true"] { display: block; }

[data-crossfilter-dashboard] .crossfilter-histogram-brush {
  position: absolute;
  z-index: 3;
  top: 0;
  bottom: 0;
  display: none;
  border-right: 1px solid var(--histogram-color);
  border-left: 1px solid var(--histogram-color);
  background: color-mix(in srgb, var(--histogram-color) 17%, transparent);
  pointer-events: none;
}

[data-crossfilter-dashboard] .crossfilter-histogram-brush[data-active="true"] { display: block; }

[data-crossfilter-dashboard] .crossfilter-footer {
  display: grid;
  min-height: 42px;
  align-items: center;
  padding: 7px 10px;
  gap: 7px;
  grid-template-columns: minmax(0, 1fr) auto;
  border: 1px solid var(--crossfilter-line);
  border-radius: 7px;
  background: rgba(5, 12, 21, .84);
  pointer-events: auto;
}

[data-crossfilter-dashboard] .crossfilter-filter-track {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
}

[data-crossfilter-dashboard] .crossfilter-filter-empty {
  color: var(--crossfilter-dim);
  font-size: 9px;
}

[data-crossfilter-dashboard] .crossfilter-filter-chip {
  display: inline-flex;
  max-width: 190px;
  align-items: center;
  padding: 4px 6px;
  gap: 4px;
  border: 1px solid color-mix(in srgb, var(--chip-color, var(--crossfilter-cyan)) 36%, transparent);
  border-radius: 4px;
  background: color-mix(in srgb, var(--chip-color, var(--crossfilter-cyan)) 10%, transparent);
  color: var(--chip-color, var(--crossfilter-cyan));
  font: 9px/1 ui-monospace, "SFMono-Regular", monospace;
}

[data-crossfilter-dashboard] .crossfilter-filter-chip span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

[data-crossfilter-dashboard] .crossfilter-pipeline {
  color: #8296a7;
  font: 9px/1.3 ui-monospace, "SFMono-Regular", monospace;
  white-space: nowrap;
}

[data-crossfilter-dashboard] .crossfilter-pipeline strong { color: #83eefd; }

@media (max-width: 940px) {
  [data-crossfilter-dashboard] .crossfilter-shell {
    gap: 9px;
    grid-template-rows: auto auto auto minmax(205px, 1fr) minmax(125px, .46fr) auto;
  }
  [data-crossfilter-dashboard] .crossfilter-metrics { grid-template-columns: 1.18fr 1.3fr .9fr .9fr; }
  [data-crossfilter-dashboard] .crossfilter-metric:last-child { display: none; }
  [data-crossfilter-dashboard] .crossfilter-workspace { grid-template-columns: minmax(0, 1.25fr) minmax(215px, .85fr); }
  [data-crossfilter-dashboard] .crossfilter-pipeline { font-size: 8px; }
}

@media (max-width: 690px) {
  [data-crossfilter-dashboard] { overflow-y: auto; pointer-events: auto; }
  [data-crossfilter-dashboard] .crossfilter-shell {
    min-height: 1020px;
    padding: 12px;
    grid-template-rows: auto auto auto minmax(460px, 1fr) 246px auto;
  }
  [data-crossfilter-dashboard] .crossfilter-header { align-items: flex-start; }
  [data-crossfilter-dashboard] .crossfilter-header-meta { flex-wrap: wrap; justify-content: flex-end; }
  [data-crossfilter-dashboard] .crossfilter-header-meta .crossfilter-badge:last-child { display: none; }
  [data-crossfilter-dashboard] .crossfilter-command-row { flex-wrap: wrap; }
  [data-crossfilter-dashboard] .crossfilter-metrics { grid-template-columns: 1fr 1fr; }
  [data-crossfilter-dashboard] .crossfilter-workspace { grid-template-columns: 1fr; grid-template-rows: minmax(260px, 1.25fr) minmax(190px, 1fr); }
  [data-crossfilter-dashboard] .crossfilter-side-rail { grid-template-columns: 1.15fr .85fr; grid-template-rows: minmax(0, 1fr); }
  [data-crossfilter-dashboard] .crossfilter-histograms { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
  [data-crossfilter-dashboard] .crossfilter-histogram-card:last-child { grid-column: 1 / -1; }
  [data-crossfilter-dashboard] .crossfilter-footer { align-items: start; grid-template-columns: 1fr; }
}

@media (max-width: 430px) {
  [data-crossfilter-dashboard] .crossfilter-shell { min-height: 1190px; grid-template-rows: auto auto auto minmax(625px, 1fr) 242px auto; }
  [data-crossfilter-dashboard] .crossfilter-side-rail { grid-template-columns: 1fr; grid-template-rows: 1fr .85fr; }
  [data-crossfilter-dashboard] .crossfilter-header-meta .crossfilter-badge:first-child { display: none; }
  [data-crossfilter-dashboard] .crossfilter-preset { padding: 0 6px; }
}

@media (prefers-reduced-motion: reduce) {
  [data-crossfilter-dashboard] *,
  [data-crossfilter-dashboard] *::before,
  [data-crossfilter-dashboard] *::after { animation: none !important; transition: none !important; }
}
`;
