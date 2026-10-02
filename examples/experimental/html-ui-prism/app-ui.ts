// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {luma} from '@luma.gl/core';
import {configurePanelHostElement} from '../../example-panels';
import type {PrismFaceId} from './app';

/** Presentation for the example shell. */
export const HtmlUiPrismInfoHtml = `\
<p>
Experimental HTML-in-Canvas demo. In supporting browsers, each prism face is a live DOM panel copied into a GPU texture while remaining clickable.
</p>
`;

export function makePrismFaceElements(faceId: PrismFaceId): {
  panelHostElement: HTMLElement;
  wrapperElement: HTMLElement;
} {
  const wrapperElement = document.createElement('article');
  wrapperElement.className = 'html-ui-prism-face';
  wrapperElement.dataset.htmlUiPrismFace = '';
  wrapperElement.dataset.faceId = faceId;

  const sourceElement = document.createElement('div');
  sourceElement.className = 'html-ui-prism-surface';
  sourceElement.innerHTML = `\
<header class="html-ui-prism-face-header">
  <span>${escapeHtml(getFaceLabel(faceId))}</span>
  <button type="button" data-prism-face-focus>Focus</button>
</header>
<div data-prism-face-panel-host></div>
`;
  wrapperElement.appendChild(sourceElement);

  const panelHostElement = sourceElement.querySelector<HTMLElement>('[data-prism-face-panel-host]');
  if (!panelHostElement) {
    throw new Error(`Missing panel host for ${faceId}`);
  }
  configurePanelHostElement(panelHostElement);

  return {panelHostElement, wrapperElement};
}

export function makeStatsHtml(): string {
  const animationStats = luma.stats.get('Animation Loop');
  const gpuStats = luma.stats.get('GPU Time and Memory');
  return `\
<dl class="html-ui-prism-debug-grid">
  <div><dt>Frame rate</dt><dd>${formatStat(animationStats.get('Frame Rate').count)}</dd></div>
  <div><dt>CPU time</dt><dd>${formatStat(animationStats.get('CPU Time').count)} ms</dd></div>
  <div><dt>GPU time</dt><dd>${formatStat(animationStats.get('GPU Time').count)} ms</dd></div>
  <div><dt>GPU memory</dt><dd>${formatBytes(gpuStats.get('GPU Memory').count)}</dd></div>
</dl>
`;
}

export function makeSupportNotice(deviceType: string): HTMLElement {
  const supportNoticeElement = document.createElement('div');
  supportNoticeElement.className = 'html-ui-prism-support';
  supportNoticeElement.innerHTML = `\
<strong>HTML-in-Canvas is not available.</strong>
<span>This ${escapeHtml(deviceType)} browser path does not expose the experimental DOM-to-texture upload APIs required by this demo. In Canary, enable <a href="chrome://flags/#canvas-draw-element">chrome://flags/#canvas-draw-element</a> or serve this origin with an <code>HTMLInCanvas</code> origin-trial token.</span>
`;
  return supportNoticeElement;
}

export function mountLivePanel(rootElement: HTMLElement, getHtml: () => string): () => void {
  const render = () => {
    rootElement.innerHTML = getHtml();
  };
  render();
  const intervalId = window.setInterval(render, 250);
  return () => window.clearInterval(intervalId);
}

export function getFaceLabel(faceId: PrismFaceId): string {
  return faceId[0].toUpperCase() + faceId.slice(1);
}

export function formatBytes(byteLength: number): string {
  if (byteLength < 1024) {
    return `${Math.round(byteLength)} B`;
  }
  if (byteLength < 1024 * 1024) {
    return `${(byteLength / 1024).toFixed(1)} KB`;
  }
  return `${(byteLength / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatStat(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : '-';
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export const HTML_UI_PRISM_CSS = `\
.html-ui-prism-face {
  --html-ui-prism-face-size: 324px;
  display: grid;
  height: var(--html-ui-prism-face-size);
  left: 0;
  place-items: center;
  pointer-events: auto;
  position: absolute;
  top: 0;
  transform-origin: 0 0;
  transform-style: preserve-3d;
  user-select: none;
  -webkit-user-select: none;
  width: var(--html-ui-prism-face-size);
}

.html-ui-prism-surface {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(236, 242, 255, 0.98)),
    radial-gradient(circle at top right, rgba(116, 149, 255, 0.24), rgba(255, 255, 255, 0));
  border: 1px solid rgba(108, 123, 157, 0.28);
  border-radius: 18px;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.32);
  box-sizing: border-box;
  color: #0f172a;
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  overflow: hidden;
  padding: 16px;
  user-select: none;
  -webkit-user-select: none;
  width: 100%;
}

.html-ui-prism-face-header {
  align-items: center;
  border-bottom: 1px solid rgba(148, 163, 184, 0.28);
  display: flex;
  font: 700 15px/1.2 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  justify-content: space-between;
  padding-bottom: 10px;
}

.html-ui-prism-face-header button {
  background: #0f172a;
  border: 0;
  border-radius: 999px;
  color: #f8fafc;
  cursor: pointer;
  font: 600 12px/1 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  padding: 8px 10px;
}

.html-ui-prism-face-header button:hover {
  background: #1e293b;
}

.html-ui-prism-surface [data-prism-face-panel-host] {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.html-ui-prism-surface p,
.html-ui-prism-surface dt,
.html-ui-prism-surface dd,
.html-ui-prism-surface span,
.html-ui-prism-surface button,
.html-ui-prism-surface label,
.html-ui-prism-surface input,
.html-ui-prism-surface select {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.html-ui-prism-surface p {
  color: #334155;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 12px;
}

.html-ui-prism-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.html-ui-prism-chip-row span {
  background: #dbeafe;
  border-radius: 999px;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 8px;
}

.html-ui-prism-debug-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
}

.html-ui-prism-debug-grid div {
  background: rgba(241, 245, 249, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.26);
  border-radius: 12px;
  padding: 10px;
}

.html-ui-prism-debug-grid dt {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.html-ui-prism-debug-grid dd {
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
  margin: 0;
}

.html-ui-prism-support {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 14px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
  color: #0f172a;
  display: grid;
  gap: 8px;
  inset: 50% auto auto 50%;
  max-width: 420px;
  padding: 18px;
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 2;
}

.html-ui-prism-support strong,
.html-ui-prism-support span {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.html-ui-prism-support span {
  color: #475569;
  font-size: 14px;
  line-height: 1.45;
}

.html-ui-prism-support a {
  color: #2563eb;
}
`;
