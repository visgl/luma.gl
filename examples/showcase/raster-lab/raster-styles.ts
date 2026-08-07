// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Scoped dashboard styles preserve the website host and leave the GPU map surface transparent. */
export const RASTER_LAB_STYLES = /* css */ `
[data-raster-lab] {
  --raster-text: #ebf2ed;
  --raster-muted: #91a39d;
  --raster-accent: #9ce9c4;
  --raster-panel: rgb(10 19 25 / 88%);
  --raster-border: rgb(192 220 202 / 13%);
  position: absolute;
  z-index: 2;
  inset: 0;
  overflow: hidden;
  color: var(--raster-text);
  font-family: 'Avenir Next', Avenir, Inter, ui-sans-serif, system-ui, sans-serif;
  font-size: 13px;
  pointer-events: none;
}

[data-raster-lab] *,
[data-raster-lab] *::before,
[data-raster-lab] *::after {
  box-sizing: border-box;
}

.raster-shell {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: clamp(10px, 1.55vh, 16px);
  padding: clamp(14px, 2.25vw, 27px);
}

.raster-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 52px;
}

.raster-wordmark {
  display: flex;
  align-items: center;
  gap: 12px;
}

.raster-orbit-mark {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid rgb(156 233 196 / 36%);
  border-radius: 50%;
  color: var(--raster-accent);
  font-size: 20px;
  line-height: 1;
}

.raster-eyebrow,
.raster-kicker {
  color: var(--raster-muted);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.raster-title {
  margin: 4px 0 0;
  font-size: clamp(17px, 2vw, 22px);
  font-weight: 590;
  letter-spacing: -0.045em;
}

.raster-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--raster-muted);
  font-size: 11px;
  text-align: right;
}

.raster-status-dot {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--raster-accent);
  box-shadow: 0 0 15px rgb(156 233 196 / 72%);
}

.raster-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 9px;
}

.raster-metric {
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--raster-border);
  border-radius: 11px;
  background: rgb(9 17 22 / 76%);
}

.raster-metric-value {
  display: block;
  margin-top: 5px;
  font-size: clamp(14px, 1.8vw, 19px);
  font-weight: 560;
  letter-spacing: -0.045em;
  white-space: nowrap;
}

.raster-metric-detail {
  color: var(--raster-muted);
  font-size: 10px;
  font-weight: 450;
  letter-spacing: 0;
}

.raster-workspace {
  display: grid;
  min-height: 0;
  grid-template-columns: minmax(0, 1fr) minmax(255px, 310px);
  gap: 12px;
}

.raster-map-card {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  border: 1px solid var(--raster-border);
  border-radius: 14px;
}

.raster-map-header,
.raster-map-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 48px;
  padding: 0 14px;
  background: rgb(9 17 22 / 94%);
}

.raster-map-title {
  color: var(--raster-text);
  font-size: 12px;
  font-weight: 580;
}

.raster-chip {
  padding: 5px 8px;
  border: 1px solid rgb(156 233 196 / 23%);
  border-radius: 999px;
  color: var(--raster-accent);
  font-size: 9px;
  letter-spacing: 0.07em;
  white-space: nowrap;
}

.raster-map-surface {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: transparent;
}

.raster-map-surface::after {
  position: absolute;
  inset: 0;
  border: 1px solid rgb(229 242 231 / 14%);
  content: '';
  pointer-events: none;
}

.raster-coordinate,
.raster-scale {
  position: absolute;
  z-index: 1;
  padding: 5px 7px;
  border-radius: 5px;
  background: rgb(9 15 17 / 62%);
  color: rgb(238 246 240 / 92%);
  font-size: 9px;
  letter-spacing: 0.035em;
}

.raster-coordinate {
  top: 12px;
  left: 12px;
}

.raster-scale {
  right: 12px;
  bottom: 12px;
}

.raster-scale::before {
  display: inline-block;
  width: 32px;
  height: 6px;
  margin-right: 7px;
  border-bottom: 1px solid currentColor;
  border-left: 1px solid currentColor;
  border-right: 1px solid currentColor;
  content: '';
}

.raster-map-footer {
  min-height: 50px;
}

.raster-legend {
  display: grid;
  width: min(220px, 50%);
  gap: 5px;
}

.raster-legend-ramp {
  width: 100%;
  height: 5px;
  border-radius: 999px;
  background: linear-gradient(90deg, #103550, #945b34, #d79145, #7db45a, #14784e, #62d396);
}

.raster-legend[data-mode='red'] .raster-legend-ramp {
  background: linear-gradient(90deg, #241019, #814236, #ffc294);
}

.raster-legend[data-mode='near-infrared'] .raster-legend-ramp {
  background: linear-gradient(90deg, #211831, #526275, #a4edcf);
}

.raster-legend[data-mode='edge-magnitude'] .raster-legend-ramp {
  background: linear-gradient(90deg, #071018, #128eb5, #2dd6dc, #ffbd57);
}

.raster-legend[data-mode='edge-signed'] .raster-legend-ramp {
  background: linear-gradient(90deg, #1ac1eb, #09121b, #ffa843);
}

.raster-legend-labels {
  display: flex;
  justify-content: space-between;
  color: var(--raster-muted);
  font-size: 9px;
}

.raster-map-note {
  color: var(--raster-muted);
  font-size: 10px;
  text-align: right;
}

.raster-sidebar {
  display: grid;
  min-height: 0;
  max-height: 100%;
  align-content: start;
  grid-template-rows: repeat(3, max-content);
  gap: 10px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-color: rgb(156 233 196 / 35%) transparent;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  pointer-events: auto;
}

.raster-panel {
  min-width: 0;
  overflow: hidden;
  padding: 11px;
  border: 1px solid var(--raster-border);
  border-radius: 13px;
  background: var(--raster-panel);
  pointer-events: auto;
}

.raster-panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.raster-panel-title {
  font-size: 12px;
  font-weight: 590;
}

.raster-source-control {
  display: grid;
  gap: 4px;
  margin-bottom: 9px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--raster-border);
}

.raster-source-buttons {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
}

.raster-source-overview-buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
}

.raster-overview-policy-buttons,
.raster-category-policy-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.raster-analysis-scope-buttons,
.raster-replay-order-buttons,
.raster-component-buttons,
.raster-component-connectivity-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.raster-global-statistics,
.raster-component-statistics {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 3px 6px;
  padding: 3px 0;
  color: var(--raster-muted);
  font-size: 8px;
  font-variant-numeric: tabular-nums;
}

.raster-global-statistics > :nth-child(even),
.raster-component-statistics > :nth-child(even) {
  overflow: hidden;
  color: var(--raster-accent);
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.raster-global-note,
.raster-component-note {
  color: var(--raster-muted);
  font-size: 8px;
  line-height: 1.4;
}

.raster-component-control {
  display: grid;
  gap: 6px;
}

.raster-component-setting {
  display: grid;
  gap: 4px;
}

.raster-overview-statistics {
  display: grid;
  gap: 2px;
  padding: 3px 0;
  color: var(--raster-muted);
  font-size: 8px;
  font-variant-numeric: tabular-nums;
}

.raster-overview-statistics > :first-child {
  color: var(--raster-accent);
}

.raster-overview-statistics > :last-child {
  color: var(--raster-muted);
  font-size: 7px;
}

.raster-halo-buttons {
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 4px;
}

.raster-halo-statistics {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 3px 6px;
  padding: 3px 0;
  color: var(--raster-muted);
  font-size: 8px;
  font-variant-numeric: tabular-nums;
}

.raster-halo-statistics > :nth-child(even) {
  overflow: hidden;
  color: var(--raster-accent);
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.raster-source-description,
.raster-source-origin {
  overflow: hidden;
  color: var(--raster-muted);
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.raster-source-description {
  color: var(--raster-accent);
}

.raster-cache-control {
  display: grid;
  gap: 3px;
  margin-top: 3px;
}

.raster-cache-statistics {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 3px 6px;
  color: var(--raster-muted);
  font-size: 8px;
  font-variant-numeric: tabular-nums;
}

.raster-cache-statistics > :nth-child(even) {
  overflow: hidden;
  color: var(--raster-accent);
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.raster-mode-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr 1.15fr;
  gap: 5px;
}

.raster-smoothing-buttons {
  display: grid;
  grid-template-columns: 0.75fr 1.2fr 0.75fr;
  gap: 5px;
}

.raster-edge-buttons {
  display: grid;
  grid-template-columns: 0.6fr 0.85fr 0.95fr 1.1fr;
  gap: 4px;
}

.raster-edge-direction-buttons {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr 0.8fr;
  gap: 4px;
}

.raster-morphology-buttons {
  display: grid;
  grid-template-columns: 0.7fr repeat(4, minmax(0, 1fr));
  gap: 3px;
}

.raster-morphology-paired-settings {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 5px;
}

.raster-morphology-toggle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 3px;
}

.raster-morphology-border-buttons {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 3px;
}

.raster-mode-button {
  min-height: 28px;
  padding: 0 5px;
  border: 1px solid rgb(179 202 187 / 15%);
  border-radius: 7px;
  background: rgb(17 29 34 / 85%);
  color: #b7c4bc;
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}

.raster-mode-button[aria-pressed='true'] {
  border-color: rgb(156 233 196 / 48%);
  background: rgb(91 162 123 / 17%);
  color: var(--raster-accent);
}

.raster-mode-button:disabled {
  cursor: default;
  opacity: 0.4;
}

.raster-edge-buttons .raster-mode-button,
.raster-edge-direction-buttons .raster-mode-button,
.raster-source-buttons .raster-mode-button,
.raster-source-overview-buttons .raster-mode-button,
.raster-morphology-buttons .raster-mode-button,
.raster-morphology-toggle .raster-mode-button,
.raster-morphology-border-buttons .raster-mode-button {
  min-height: 24px;
  padding: 0 3px;
  font-size: 9px;
}

.raster-morphology-buttons .raster-mode-button,
.raster-morphology-paired-settings .raster-mode-button,
.raster-morphology-border-buttons .raster-mode-button {
  min-height: 22px;
  padding: 0 2px;
  font-size: 8px;
}

.raster-control {
  display: grid;
  gap: 5px;
  margin-top: 9px;
}

.raster-control-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #bbc8c1;
  font-size: 10px;
}

.raster-control-value {
  color: var(--raster-accent);
  font-variant-numeric: tabular-nums;
}

.raster-smoothing-control {
  gap: 6px;
}

.raster-morphology-control {
  gap: 5px;
}

.raster-morphology-setting {
  display: grid;
  gap: 3px;
}

.raster-smoothing-setting {
  display: grid;
  gap: 4px;
}

.raster-slider {
  width: 100%;
  height: 4px;
  accent-color: var(--raster-accent);
  cursor: pointer;
}

.raster-slider:disabled {
  cursor: default;
  opacity: 0.36;
}

.raster-threshold-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.raster-threshold-toggle input {
  width: 12px;
  height: 12px;
  margin: 0;
  accent-color: var(--raster-accent);
}

.raster-otsu-button {
  min-height: 21px;
  padding: 3px 7px;
  border: 1px solid rgb(156 233 196 / 22%);
  border-radius: 6px;
  background: rgb(19 34 37 / 78%);
  color: var(--raster-muted);
  cursor: pointer;
  font: inherit;
  font-size: 8px;
  letter-spacing: 0.08em;
}

.raster-otsu-button[aria-pressed='true'] {
  border-color: rgb(156 233 196 / 58%);
  background: rgb(91 162 123 / 20%);
  color: var(--raster-accent);
}

.raster-histogram-panel {
  min-height: 0;
}

.raster-histogram {
  display: flex;
  height: clamp(58px, 9vh, 86px);
  align-items: flex-end;
  gap: 2px;
  border-bottom: 1px solid rgb(196 220 205 / 16%);
}

.raster-histogram-bar {
  height: var(--raster-height);
  min-height: 2px;
  flex: 1 1 0;
  border-radius: 2px 2px 0 0;
  background: var(--raster-color);
  opacity: 0.84;
  transition: height 180ms ease, opacity 140ms ease;
}

.raster-histogram-bar[data-muted='true'] {
  opacity: 0.2;
}

.raster-histogram-axis {
  display: flex;
  justify-content: space-between;
  margin-top: 7px;
  color: var(--raster-muted);
  font-size: 9px;
  font-variant-numeric: tabular-nums;
}

.raster-histogram-caption {
  margin-top: 7px;
  color: var(--raster-muted);
  font-size: 10px;
  line-height: 1.45;
}

.raster-pipeline {
  display: grid;
  align-content: start;
  gap: 9px;
  overflow: hidden;
}

.raster-pipeline-step {
  display: grid;
  grid-template-columns: 17px minmax(0, 1fr) auto;
  align-items: center;
  gap: 7px;
}

.raster-step-number {
  color: var(--raster-accent);
  font-size: 9px;
}

.raster-step-name {
  overflow: hidden;
  color: #cbd6cf;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.raster-step-state {
  color: var(--raster-muted);
  font-size: 8px;
}

.raster-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 31px;
}

.raster-roadmap {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  overflow: hidden;
}

.raster-roadmap-chip {
  padding: 5px 8px;
  border: 1px solid var(--raster-border);
  border-radius: 999px;
  color: var(--raster-muted);
  font-size: 9px;
  white-space: nowrap;
}

.raster-provenance {
  color: var(--raster-muted);
  font-size: 9px;
  text-align: right;
  white-space: nowrap;
}

@media (max-width: 860px) {
  .raster-workspace {
    grid-template-columns: minmax(0, 1fr) 244px;
  }

  .raster-roadmap-chip:nth-last-child(-n + 2) {
    display: none;
  }
}

@media (max-width: 650px) {
  .raster-shell {
    gap: 9px;
    padding: 11px;
  }

  .raster-status {
    max-width: 42%;
    font-size: 9px;
  }

  .raster-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }

  .raster-metric {
    padding: 7px 9px;
  }

  .raster-workspace {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(180px, 1fr) auto;
    gap: 8px;
  }

  .raster-sidebar {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto;
    gap: 7px;
  }

  .raster-pipeline,
  .raster-roadmap,
  .raster-histogram-caption {
    display: none;
  }

  .raster-panel {
    padding: 9px;
  }

  .raster-histogram {
    height: 59px;
  }

  .raster-footer {
    justify-content: flex-end;
  }
}

@media (max-height: 640px) and (min-width: 651px) {
  .raster-shell {
    gap: 8px;
    padding: 12px 16px;
  }

  .raster-header {
    min-height: 40px;
  }

  .raster-metric {
    padding: 7px 10px;
  }

  .raster-panel {
    padding: 9px;
  }

  .raster-panel-heading {
    margin-bottom: 7px;
  }

  .raster-control {
    gap: 4px;
    margin-top: 8px;
  }

  .raster-histogram {
    height: 57px;
  }

  .raster-histogram-caption,
  .raster-pipeline-step:nth-last-child(-n + 2) {
    display: none;
  }
}

@media (max-height: 780px) and (min-width: 651px) {
  .raster-sidebar {
    grid-template-rows: repeat(3, max-content);
  }

  .raster-panel {
    padding: 9px;
  }

  .raster-control {
    gap: 4px;
    margin-top: 7px;
  }

  .raster-histogram {
    height: 50px;
  }

}
`;
