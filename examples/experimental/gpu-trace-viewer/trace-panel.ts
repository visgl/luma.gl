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
  [data-trace-dashboard] .trace-capability-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;
  }
  [data-trace-dashboard] .trace-capability-list span {
    padding: 2px 5px;
    border: 1px solid rgb(125 211 252 / 16%);
    border-radius: 999px;
    background: rgb(24 54 78 / 38%);
    color: #a9c7de;
    font: 650 8px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  [data-trace-dashboard] .trace-load-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 31px;
    padding: 7px 9px;
    border: 1px solid rgb(125 211 252 / 25%);
    border-radius: 7px;
    background: rgb(17 39 59 / 68%);
    color: #c1d7e9;
    font: 9px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  [data-trace-dashboard] .trace-load-banner[data-phase='error'] {
    border-color: rgb(227 151 99 / 42%);
    background: rgb(91 45 28 / 32%);
    color: #f1c7aa;
  }
  [data-trace-dashboard] .trace-load-banner[hidden] { display: none; }
  [data-trace-dashboard] .trace-load-spinner {
    width: 13px;
    height: 13px;
    flex: 0 0 13px;
    border: 2px solid rgb(125 211 252 / 18%);
    border-top-color: #7dc7eb;
    border-radius: 50%;
    animation: trace-load-spin .8s linear infinite;
  }
  [data-trace-dashboard] .trace-load-banner[data-phase='error'] .trace-load-spinner {
    border-color: rgb(227 151 99 / 18%);
    border-top-color: #e39763;
    animation: none;
  }
  @keyframes trace-load-spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) {
    [data-trace-dashboard] .trace-load-spinner { animation-duration: 1.8s; }
  }
  [data-trace-dashboard] .trace-showcase-card,
  [data-trace-dashboard] .trace-analysis-hero {
    position: relative;
    overflow: hidden;
    padding: 10px;
    border: 1px solid rgb(125 211 252 / 22%);
    border-radius: 8px;
    background:
      linear-gradient(135deg, rgb(27 66 91 / 40%), transparent 60%),
      rgb(9 18 31 / 82%);
  }
  [data-trace-dashboard] .trace-showcase-card strong,
  [data-trace-dashboard] .trace-analysis-hero > strong {
    display: block;
    margin-top: 3px;
    color: #e6f0fb;
    font-size: 12px;
    font-weight: 650;
  }
  [data-trace-dashboard] .trace-showcase-card p,
  [data-trace-dashboard] .trace-analysis-hero p {
    margin: 4px 0 8px;
    color: #9fb2c9;
    font-size: 9px;
  }
  [data-trace-dashboard] .trace-showcase-card button {
    border-color: rgb(125 211 252 / 28%);
    background: rgb(41 90 120 / 50%);
    color: #dcefff;
  }
  [data-trace-dashboard] .trace-live-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    margin-right: 6px;
    border-radius: 50%;
    background: #6dc59a;
    box-shadow: 0 0 0 3px rgb(109 197 154 / 10%);
  }
  [data-trace-dashboard] .trace-analysis-pipeline {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    overflow-x: auto;
  }
  [data-trace-dashboard] .trace-analysis-pipeline span {
    flex: 0 0 auto;
    padding: 4px 5px;
    border: 1px solid var(--trace-border-soft);
    border-radius: 5px;
    background: rgb(10 23 39 / 72%);
    color: #adc1d7;
    font: 8px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  [data-trace-dashboard] .trace-analysis-pipeline b {
    color: #78bfe6;
    font-weight: 750;
  }
  [data-trace-dashboard] .trace-analysis-pipeline i {
    color: #58738f;
    font-style: normal;
  }
  [data-trace-dashboard] .trace-visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
    white-space: nowrap;
  }
  [data-trace-dashboard] .trace-scope-options {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 4px;
  }
  [data-trace-dashboard] .trace-scope-options button {
    display: grid;
    gap: 1px;
    min-width: 0;
    padding: 6px 5px;
    background: rgb(10 20 34 / 64%);
    text-align: left;
  }
  [data-trace-dashboard] .trace-scope-options button strong {
    overflow: hidden;
    font-size: 9px;
    text-overflow: ellipsis;
  }
  [data-trace-dashboard] .trace-scope-options button span {
    overflow: hidden;
    color: #7287a1;
    font-size: 7px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  [data-trace-dashboard] .trace-scope-options button[aria-pressed='true'] {
    border-color: rgb(125 211 252 / 45%);
    background: rgb(45 84 113 / 58%);
    box-shadow: inset 0 0 0 1px rgb(125 211 252 / 8%);
  }
  [data-trace-dashboard] .trace-scope-options button[aria-pressed='true'] span {
    color: #a8c3da;
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
  [data-trace-dashboard] .trace-frame-metric-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 4px;
  }
  [data-trace-dashboard] .trace-frame-metric-grid .trace-metric-card {
    min-height: 47px;
    padding: 6px;
  }
  [data-trace-dashboard] .trace-frame-metric-grid .trace-metric-value { font-size: 12px; }
  [data-trace-dashboard] .trace-graph-diagnostic {
    padding: 7px 8px;
    border: 1px solid rgb(227 151 99 / 42%);
    border-left-width: 3px;
    border-radius: 6px;
    background: rgb(91 45 28 / 32%);
    color: #f1c7aa;
    font: 9px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  [data-trace-dashboard] .trace-graph-diagnostic[hidden] { display: none; }
  [data-trace-dashboard] .trace-tabs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 3px;
    padding: 3px;
    border: 1px solid var(--trace-border-soft);
    border-radius: 7px;
    background: rgb(6 12 22 / 72%);
  }
  [data-trace-dashboard] .trace-tabs button {
    min-width: 0;
    padding: 5px 3px;
    border: 0;
    border-radius: 5px;
    background: transparent;
    color: var(--trace-text-muted);
    font: 650 9px/1.2 system-ui, sans-serif;
    cursor: pointer;
  }
  [data-trace-dashboard] .trace-tabs button:hover { color: var(--trace-text); }
  [data-trace-dashboard] .trace-tabs button[aria-selected='true'] {
    background: rgb(54 91 132 / 48%);
    box-shadow: inset 0 0 0 1px rgb(125 211 252 / 22%);
    color: #dcecff;
  }
  [data-trace-dashboard] .trace-tab-panel {
    display: grid;
    gap: 7px;
    min-width: 0;
  }
  [data-trace-dashboard] .trace-tab-panel[hidden] { display: none; }
  [data-trace-dashboard] .trace-feature-hero { border-color: rgb(124 153 194 / 28%); }
  [data-trace-dashboard] .trace-feature-list {
    display: grid;
    gap: 5px;
  }
  [data-trace-dashboard] .trace-feature-card {
    display: grid;
    gap: 4px;
    padding: 7px 8px;
    border: 1px solid var(--trace-border-soft);
    border-radius: 6px;
    background: linear-gradient(145deg, rgb(20 31 48 / 72%), rgb(9 16 27 / 60%));
  }
  [data-trace-dashboard] .trace-feature-card > div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }
  [data-trace-dashboard] .trace-feature-card strong {
    color: var(--trace-text);
    font: 650 10px/1.3 system-ui, sans-serif;
  }
  [data-trace-dashboard] .trace-feature-card span {
    max-width: 48%;
    color: #8eb8d8;
    font: 8px/1.25 ui-monospace, SFMono-Regular, Menlo, monospace;
    text-align: right;
  }
  [data-trace-dashboard] .trace-feature-card p {
    margin: 0;
    color: var(--trace-text-muted);
    font: 9px/1.4 system-ui, sans-serif;
  }
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
    overflow: visible;
    border: 1px solid var(--trace-border-soft);
    border-radius: 6px;
    background: linear-gradient(145deg, rgb(22 35 55 / 74%), rgb(10 18 30 / 62%));
  }
  [data-trace-dashboard] .trace-metric-card:hover,
  [data-trace-dashboard] .trace-metric-card:focus-visible { z-index: 20; outline: none; }
  [data-trace-dashboard] .trace-metric-card::before {
    position: absolute;
    z-index: 30;
    top: calc(100% + 6px);
    left: 50%;
    width: min(230px, calc(100vw - 42px));
    padding: 7px 8px;
    border: 1px solid rgb(125 211 252 / 30%);
    border-radius: 6px;
    background: rgb(6 12 22 / 97%);
    box-shadow: 0 8px 24px rgb(0 0 0 / 42%);
    color: #c9d8ea;
    content: attr(data-tooltip);
    font: 9px/1.4 system-ui, sans-serif;
    letter-spacing: normal;
    opacity: 0;
    pointer-events: none;
    text-align: left;
    text-transform: none;
    transform: translate(-50%, -3px);
    transition: opacity 100ms ease, transform 100ms ease;
    white-space: normal;
  }
  [data-trace-dashboard] .trace-metric-card:hover::before,
  [data-trace-dashboard] .trace-metric-card:focus-visible::before {
    opacity: 1;
    transform: translate(-50%, 0);
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
  [data-trace-dashboard] .trace-analysis-histogram {
    display: grid;
    gap: 3px;
  }
  [data-trace-dashboard] .trace-analysis-summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 5px;
    margin-bottom: 8px;
  }
  [data-trace-dashboard] .trace-group-profile {
    display: grid;
    gap: 7px;
  }
  [data-trace-dashboard] .trace-analysis-subheader { margin-top: 10px; }
  [data-trace-dashboard] .trace-status-profile {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 4px;
  }
  [data-trace-dashboard] .trace-status-card {
    display: grid;
    gap: 2px;
    min-width: 0;
    padding: 5px;
    border: 1px solid color-mix(in srgb, var(--trace-status-color), transparent 72%);
    border-radius: 5px;
    background: color-mix(in srgb, var(--trace-status-color), transparent 92%);
  }
  [data-trace-dashboard] .trace-status-card span {
    overflow: hidden;
    color: #aabbd0;
    font-size: 7px;
    text-overflow: ellipsis;
    text-transform: uppercase;
  }
  [data-trace-dashboard] .trace-status-card i {
    display: inline-block;
    width: 5px;
    height: 5px;
    margin-right: 4px;
    border-radius: 50%;
    background: var(--trace-status-color);
  }
  [data-trace-dashboard] .trace-status-card strong {
    color: #e1ebf7;
    font: 650 10px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  [data-trace-dashboard] .trace-status-card small {
    color: #7489a2;
    font: 7px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  [data-trace-dashboard] .trace-group-row {
    display: grid;
    gap: 4px;
    padding: 6px;
    border: 1px solid var(--trace-border-soft);
    border-radius: 6px;
    background: rgb(9 18 31 / 56%);
  }
  [data-trace-dashboard] .trace-group-heading,
  [data-trace-dashboard] .trace-group-details {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }
  [data-trace-dashboard] .trace-group-heading span {
    color: #c5d4e6;
    font-size: 9px;
    font-weight: 700;
    text-transform: capitalize;
  }
  [data-trace-dashboard] .trace-group-heading i {
    display: inline-block;
    width: 6px;
    height: 6px;
    margin-right: 5px;
    border-radius: 2px;
    background: var(--trace-group-color);
    box-shadow: 0 0 8px color-mix(in srgb, var(--trace-group-color), transparent 55%);
  }
  [data-trace-dashboard] .trace-group-heading strong {
    color: #e4eef9;
    font: 650 10px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  [data-trace-dashboard] .trace-group-track {
    height: 4px;
    overflow: hidden;
    border-radius: 999px;
    background: rgb(83 107 134 / 18%);
  }
  [data-trace-dashboard] .trace-group-track span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--trace-group-color);
    opacity: .78;
  }
  [data-trace-dashboard] .trace-group-details {
    color: #7489a2;
    font: 7px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  [data-trace-dashboard] .trace-analysis-row {
    display: grid;
    grid-template-columns: 62px minmax(30px, 1fr) 58px;
    align-items: center;
    gap: 6px;
    min-width: 0;
    padding: 2px 3px;
    border-color: transparent;
    background: transparent;
    color: var(--trace-text-muted);
    font: 8px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
    text-align: left;
  }
  [data-trace-dashboard] .trace-analysis-row:hover,
  [data-trace-dashboard] .trace-analysis-row[aria-pressed='true'] {
    border-color: rgb(125 211 252 / 24%);
    background: rgb(32 57 84 / 42%);
  }
  [data-trace-dashboard] .trace-analysis-row strong {
    overflow: hidden;
    color: #cbd8e9;
    font-weight: 550;
    text-align: right;
    text-overflow: ellipsis;
  }
  [data-trace-dashboard] .trace-analysis-label { white-space: nowrap; }
  [data-trace-dashboard] .trace-analysis-track {
    height: 5px;
    overflow: hidden;
    border-radius: 999px;
    background: rgb(81 107 139 / 18%);
  }
  [data-trace-dashboard] .trace-analysis-track span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: #629abe;
  }
  [data-trace-dashboard] .trace-utilization-chart {
    display: grid;
    grid-template-columns: repeat(32, minmax(2px, 1fr));
    align-items: end;
    gap: 2px;
    height: 70px;
    padding: 6px 5px 4px;
    border: 1px solid var(--trace-border-soft);
    border-radius: 6px;
    background:
      linear-gradient(to top, rgb(125 211 252 / 7%) 1px, transparent 1px) 0 50% / 100% 50%,
      rgb(7 14 24 / 48%);
  }
  [data-trace-dashboard] .trace-utilization-chart button {
    display: flex;
    align-items: end;
    height: 100%;
    min-width: 0;
    padding: 0;
    overflow: hidden;
    border: 0;
    border-radius: 2px 2px 0 0;
    background: transparent;
  }
  [data-trace-dashboard] .trace-utilization-chart button:hover {
    background: rgb(125 211 252 / 10%);
  }
  [data-trace-dashboard] .trace-utilization-chart button span {
    width: 100%;
    border-radius: 2px 2px 0 0;
    background: linear-gradient(to top, #315f78, #72aac7);
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
