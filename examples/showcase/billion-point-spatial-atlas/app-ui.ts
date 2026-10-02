// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const ATLAS_PANEL_CSS = /* css */ `
  [data-spatial-atlas-panel] {
    display: grid;
    gap: 8px;
    box-sizing: border-box;
    padding: 10px 11px;
    border: 1px solid rgb(126 157 205 / 28%);
    border-radius: 8px;
    background: rgb(8 12 20 / 94%);
    box-shadow: 0 14px 36px rgb(0 0 0 / 30%);
    color: #edf3fc;
    color-scheme: dark;
    font: 11px/1.35 system-ui, sans-serif;
    backdrop-filter: blur(12px);
  }
  [data-spatial-atlas-panel] * { box-sizing: border-box; }
  [data-spatial-atlas-panel] a { color: #81c9ff; }
  [data-spatial-atlas-panel] [data-atlas-tier] {
    color: #c7d5e9;
    font-size: 10px;
  }
  [data-spatial-atlas-panel] [data-atlas-tier] strong { color: #f4f8ff; }
  [data-spatial-atlas-panel] details {
    border-top: 1px solid rgb(137 166 211 / 17%);
  }
  [data-spatial-atlas-panel] summary {
    padding: 7px 0 0;
    color: #8faed9;
    cursor: pointer;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  [data-spatial-atlas-panel] summary::marker { color: #7295c4; }
  [data-spatial-atlas-panel] .spatial-atlas-section { padding-top: 7px; }
  [data-spatial-atlas-panel] .spatial-atlas-controls,
  [data-spatial-atlas-panel] details > .spatial-atlas-section > div {
    display: grid;
    gap: 5px;
  }
  [data-spatial-atlas-panel] .spatial-atlas-control,
  [data-spatial-atlas-panel] details label:not(:has(input[type='checkbox'])) {
    display: grid;
    grid-template-columns: minmax(82px, .62fr) minmax(120px, 1fr);
    align-items: center;
    gap: 8px;
    min-height: 22px;
    margin: 0;
    color: #aebdd2;
  }
  [data-spatial-atlas-panel] details label:has(input[type='checkbox']) {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 24px;
    color: #d6e1f0;
    font-size: 10px;
  }
  [data-spatial-atlas-panel] .spatial-atlas-control-name {
    overflow: hidden;
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  [data-spatial-atlas-panel] select,
  [data-spatial-atlas-panel] button {
    min-width: 0;
    border: 1px solid rgb(140 169 211 / 28%);
    border-radius: 5px;
    background: rgb(30 41 58 / 72%);
    color: #e5eefb;
    font: 600 10px/1.2 system-ui, sans-serif;
  }
  [data-spatial-atlas-panel] select {
    width: 100%;
    height: 20px;
    min-height: 20px;
    padding: 1px 20px 1px 8px;
    appearance: none;
    border-color: rgb(127 164 203 / 18%);
    border-bottom-color: rgb(95 180 220 / 30%);
    border-left-color: rgb(54 213 255 / 64%);
    border-radius: 1px;
    background-color: rgb(7 15 25 / 92%);
    background-image:
      linear-gradient(45deg, transparent 48%, #62dfff 50%),
      linear-gradient(135deg, #62dfff 50%, transparent 52%),
      linear-gradient(rgb(84 188 226 / 24%), rgb(84 188 226 / 24%));
    background-position:
      calc(100% - 8px) 8px,
      calc(100% - 5px) 8px,
      calc(100% - 15px) 50%;
    background-repeat: no-repeat;
    background-size: 3px 3px, 3px 3px, 1px 10px;
    box-shadow: inset 2px 0 rgb(54 213 255 / 10%), inset 0 -1px rgb(54 213 255 / 5%);
    clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%);
    color: #cde3f4;
    cursor: pointer;
    font: 650 8px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
    letter-spacing: .045em;
    text-transform: uppercase;
    transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
  }
  [data-spatial-atlas-panel] button {
    min-height: 26px;
    padding: 4px 8px;
    cursor: pointer;
  }
  [data-spatial-atlas-panel] button:hover {
    border-color: rgb(133 194 255 / 55%);
    background-color: rgb(39 57 82 / 82%);
  }
  [data-spatial-atlas-panel] select:hover {
    border-color: rgb(82 209 247 / 52%);
    border-left-color: #45ddff;
    background-color: rgb(10 28 41 / 96%);
    color: #effcff;
  }
  [data-spatial-atlas-panel] select option { background: #0d1521; color: #e5eefb; }
  [data-spatial-atlas-panel] button:focus-visible,
  [data-spatial-atlas-panel] select:focus-visible,
  [data-spatial-atlas-panel] input:focus-visible {
    outline: 2px solid rgb(91 189 255 / 72%);
    outline-offset: 1px;
  }
  [data-spatial-atlas-panel] input[type='range'] {
    width: 100%;
    min-width: 0;
    margin: 0;
    accent-color: #69c8ff;
  }
  [data-spatial-atlas-panel] .spatial-atlas-toggle {
    grid-template-columns: 82px minmax(0, 1fr);
  }
  [data-spatial-atlas-panel] .spatial-atlas-toggle span:last-child {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #d6e1f0;
  }
  [data-spatial-atlas-panel] .spatial-atlas-action-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
    margin-top: 2px;
  }
  [data-spatial-atlas-panel] .spatial-atlas-action-row > :only-child {
    grid-column: 1 / -1;
  }
  [data-spatial-atlas-panel] .spatial-atlas-note {
    margin: 2px 0 0;
    color: #91a2ba;
    font-size: 9px;
    line-height: 1.42;
  }
  [data-spatial-atlas-panel] details small {
    color: #91a2ba;
    font-size: 9px;
    line-height: 1.42;
  }
  [data-spatial-atlas-panel] [data-atlas-status]:empty { display: none; }
  [data-spatial-atlas-panel] [data-atlas-status] {
    padding: 6px 7px;
    border: 1px solid rgb(255 194 104 / 20%);
    border-radius: 5px;
    background: rgb(137 84 24 / 13%);
    color: #ffd18a;
    font-size: 9px;
    line-height: 1.35;
  }
  [data-spatial-atlas-panel] .spatial-atlas-footer {
    color: #71839e;
    font-size: 8px;
    letter-spacing: .02em;
  }
  @media (max-width: 390px) {
    [data-spatial-atlas-panel] .spatial-atlas-control {
      grid-template-columns: 72px minmax(0, 1fr);
    }
  }
`;

export function makeStatGrid(rows: readonly (readonly [string, string])[]): string {
  return `<div style="display:grid;grid-template-columns:1fr auto;gap:3px 12px;font:11px/1.45 ui-monospace,monospace">${rows
    .map(([label, value]) => `<span style="opacity:.72">${label}</span><strong>${value}</strong>`)
    .join('')}</div>`;
}

export function formatByteCount(byteCount: number): string {
  if (byteCount < 1024) return `${byteCount.toLocaleString()} B`;
  if (byteCount < 1024 * 1024) return `${(byteCount / 1024).toFixed(1)} KiB`;
  return `${(byteCount / (1024 * 1024)).toFixed(1)} MiB`;
}

export function formatMilliseconds(milliseconds: number): string {
  return milliseconds < 10 ? `${milliseconds.toFixed(1)} ms` : `${milliseconds.toFixed(0)} ms`;
}

export function getTaxiSourceLabel(source: string): string {
  if (!source) return 'Packed row-group source';
  try {
    const url = new URL(source);
    return `${url.hostname || url.protocol.slice(0, -1)} · packed rows`;
  } catch {
    return 'Packed row-group source';
  }
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
