// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const TRACE_PANEL_STYLE = /* css */ `
  [data-trace-dashboard] {
    --trace-border: rgb(137 166 211 / 20%);
    --trace-border-soft: rgb(137 166 211 / 11%);
    --trace-surface: rgb(9 16 27 / 72%);
    --trace-surface-raised: rgb(18 29 46 / 72%);
    --trace-text: var(--luma-example-text, #eff4fd);
    --trace-text-muted: var(--luma-example-text-muted, #91a6c3);
    --trace-accent: var(--luma-example-accent, #7dd3fc);
    display: grid;
    gap: 9px;
    min-width: 0;
    color: var(--trace-text);
    font: 11px/1.4 system-ui, sans-serif;
  }
  [data-trace-dashboard] * { box-sizing: border-box; }
  [data-trace-dashboard] .trace-hero {
    position: relative;
    overflow: hidden;
    padding: 10px 11px;
    border: 1px solid var(--trace-border);
    border-radius: 8px;
    background:
      radial-gradient(circle at 100% 0%, rgb(56 189 248 / 13%), transparent 42%),
      linear-gradient(145deg, rgb(18 31 51 / 84%), rgb(8 14 24 / 78%));
  }
  [data-trace-dashboard] .trace-eyebrow,
  [data-trace-dashboard] .trace-section-title {
    color: #8fb4e7;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .075em;
    text-transform: uppercase;
  }
  [data-trace-dashboard] .trace-hero strong {
    display: block;
    margin-top: 2px;
    color: var(--trace-text);
    font-size: 13px;
    font-weight: 650;
  }
  [data-trace-dashboard] .trace-hero p {
    margin: 4px 0 0;
    color: #bcc9dc;
  }
  [data-trace-dashboard] .trace-section {
    min-width: 0;
    padding: 8px;
    border: 1px solid var(--trace-border-soft);
    border-radius: 7px;
    background: var(--trace-surface);
  }
  [data-trace-dashboard] .trace-section-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
  }
  [data-trace-dashboard] .trace-section-note,
  [data-trace-dashboard] .trace-context-line {
    color: var(--trace-text-muted);
    font: 9px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  [data-trace-dashboard] .trace-context-line {
    display: flex;
    flex-wrap: wrap;
    gap: 3px 9px;
    margin-top: 6px;
  }
  [data-trace-dashboard] .trace-preflight {
    display: grid;
    gap: 7px;
    margin-top: 7px;
    padding: 7px;
    border: 1px solid rgb(214 164 84 / 42%);
    border-radius: 6px;
    background: rgb(90 62 23 / 22%);
    color: #d8c6a5;
    font: 9px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  [data-trace-dashboard] .trace-preflight[hidden] { display: none; }
  [data-trace-dashboard] .trace-metric-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(104px, 1fr));
    gap: 5px;
  }
  [data-trace-dashboard] .trace-metric-card {
    position: relative;
    min-width: 0;
    min-height: 54px;
    padding: 7px 8px;
    overflow: hidden;
    border: 1px solid var(--trace-border-soft);
    border-radius: 6px;
    background: linear-gradient(145deg, rgb(22 35 55 / 74%), rgb(10 18 30 / 62%));
  }
  [data-trace-dashboard] .trace-metric-card::after {
    position: absolute;
    inset: auto 0 0;
    height: 2px;
    background: var(--trace-accent);
    content: '';
    opacity: .52;
  }
  [data-trace-dashboard] .trace-metric-label {
    display: block;
    overflow: hidden;
    color: var(--trace-text-muted);
    font-size: 8px;
    letter-spacing: .055em;
    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
  }
  [data-trace-dashboard] .trace-metric-value {
    display: block;
    margin-top: 3px;
    overflow: hidden;
    color: var(--trace-text);
    font: 650 13px/1.15 ui-monospace, SFMono-Regular, Menlo, monospace;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  [data-trace-dashboard] .trace-metric-detail {
    display: block;
    margin-top: 2px;
    overflow: hidden;
    color: #7188a7;
    font: 8px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  [data-trace-dashboard] .trace-selection {
    padding: 7px 8px;
    border-left: 2px solid var(--trace-accent);
    border-radius: 0 5px 5px 0;
    background: rgb(36 60 91 / 25%);
    color: #c8d6e8;
  }
  [data-trace-dashboard] .trace-control-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px 8px;
  }
  [data-trace-dashboard] .trace-control-grid > label,
  [data-trace-dashboard] .trace-control-stack > label {
    display: grid;
    gap: 3px;
    min-width: 0;
    color: #c0cee1;
  }
  [data-trace-dashboard] .trace-control-stack { display: grid; gap: 5px; }
  [data-trace-dashboard] .trace-check-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4px 7px;
  }
  [data-trace-dashboard] .trace-check-grid label,
  [data-trace-dashboard] .trace-check-row label {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    padding: 4px 6px;
    border: 1px solid var(--trace-border-soft);
    border-radius: 6px;
    background: rgb(11 20 34 / 54%);
    color: #c0cee1;
    cursor: pointer;
    transition: border-color 120ms ease, background-color 120ms ease, color 120ms ease;
  }
  [data-trace-dashboard] .trace-check-grid label:hover,
  [data-trace-dashboard] .trace-check-row label:hover {
    border-color: rgb(125 211 252 / 34%);
    background: rgb(24 42 64 / 66%);
  }
  [data-trace-dashboard] .trace-check-grid label:has(input:checked),
  [data-trace-dashboard] .trace-check-row label:has(input:checked) {
    border-color: rgb(125 211 252 / 28%);
    background: rgb(34 66 94 / 48%);
    color: #e3edf9;
  }
  [data-trace-dashboard] input[type='checkbox'] {
    appearance: none;
    flex: 0 0 auto;
    width: 25px;
    height: 14px;
    margin: 0;
    border: 1px solid rgb(139 159 187 / 42%);
    border-radius: 999px;
    background:
      radial-gradient(circle at 6px 50%, #8190a6 0 3.5px, transparent 4px),
      rgb(8 15 26 / 82%);
    cursor: pointer;
    transition: border-color 120ms ease, background 120ms ease, box-shadow 120ms ease;
  }
  [data-trace-dashboard] input[type='checkbox']:checked {
    border-color: rgb(125 211 252 / 72%);
    background:
      radial-gradient(circle at 18px 50%, #f1f7fd 0 3.5px, transparent 4px),
      #367fa4;
    box-shadow: 0 0 0 1px rgb(125 211 252 / 10%);
  }
  [data-trace-dashboard] input[type='checkbox']:focus-visible {
    outline: 2px solid rgb(125 211 252 / 72%);
    outline-offset: 2px;
  }
  [data-trace-dashboard] .trace-check-row {
    display: flex;
    flex-wrap: wrap;
    gap: 5px 10px;
  }
  [data-trace-dashboard] .trace-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  [data-trace-dashboard] input[type='range'] { width: 100%; accent-color: #7cc8ff; }
  [data-trace-dashboard] input[type='number'],
  [data-trace-dashboard] select {
    min-width: 0;
    width: 100%;
    padding: 4px 5px;
    border: 1px solid var(--trace-border);
    border-radius: 4px;
    background: rgb(13 23 38 / 82%);
    color: var(--trace-text);
  }
  [data-trace-dashboard] button {
    padding: 5px 8px;
    border: 1px solid var(--trace-border);
    border-radius: 5px;
    background: rgb(30 48 74 / 60%);
    color: #dbe8f8;
    cursor: pointer;
  }
  [data-trace-dashboard] button:hover { background: rgb(47 72 106 / 70%); }
  [data-trace-dashboard] .trace-detail-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 4px 10px;
    margin-top: 7px;
    color: #9fb0c7;
    font-size: 9px;
  }
  [data-trace-dashboard] .trace-detail-grid strong {
    color: #d8e5f5;
    font: 600 9px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace;
    text-align: right;
  }
  [data-trace-dashboard] .trace-hierarchy-row {
    display: grid;
    gap: 4px;
    padding: 6px 0;
    border-bottom: 1px solid var(--trace-border-soft);
  }
  [data-trace-dashboard] .trace-hierarchy-row:last-child { border-bottom: 0; }
  [data-trace-dashboard] .trace-hierarchy-threads {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 3px;
    padding-left: 15px;
    font-size: 9px;
  }
  [data-trace-dashboard] [data-gpu-command-graph-inspector] .graph-inspector-summary { gap: 5px; }
  [data-trace-dashboard] [data-gpu-command-graph-inspector] .graph-inspector-metric {
    min-height: 43px;
    padding: 6px 7px;
    border-radius: 6px;
    background: linear-gradient(145deg, rgb(22 35 55 / 72%), rgb(10 18 30 / 60%));
  }
  [data-trace-dashboard] [data-gpu-command-graph-inspector] .graph-inspector-metric strong {
    font-size: 10px;
  }
`;

export function getTracePanelStyleMarkup(): string {
  return `<style>${TRACE_PANEL_STYLE}</style>`;
}
