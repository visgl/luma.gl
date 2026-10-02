// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GAUSSIAN_SPLAT_BATCH_COUNT} from './gaussian-splat-scene';

export function makeGaussianSplatInfoHtml(): string {
  return `
<section data-gaussian-splats-panel style="display:grid;gap:13px;min-width:248px;max-width:310px">
  <div data-gaussian-splats-description style="font-size:12px;line-height:1.55;opacity:.8">
    Four independent GPU batches reveal a chromatic observatory of rotated, anisotropic Gaussians.
    Drag to orbit; pinch to zoom and twist to roll.
  </div>
  <div style="display:flex;justify-content:space-between;font-size:12px">
    <span>Visible splats</span><strong data-gaussian-splats-count>0 / 0</strong>
  </div>
  <div style="display:flex;justify-content:space-between;font-size:12px">
    <span>Source batches</span><strong data-gaussian-splats-batches>0 / ${GAUSSIAN_SPLAT_BATCH_COUNT}</strong>
  </div>
  <div style="display:flex;justify-content:space-between;font-size:12px">
    <span>Backend</span><strong data-gaussian-splats-backend>Detecting…</strong>
  </div>
  <div style="display:flex;justify-content:space-between;font-size:12px">
    <span>Pipeline</span><strong data-gaussian-splats-pipeline>Preparing…</strong>
  </div>
  <div data-gaussian-splats-pipeline-error hidden role="status" style="font-size:11px;line-height:1.45;color:#ffd08a"></div>
  <div style="display:flex;justify-content:space-between;font-size:12px">
    <span>Source</span><strong data-gaussian-splats-source>Synthetic</strong>
  </div>
  <label data-gaussian-splats-execution-control hidden style="gap:5px;font-size:12px">
    <span>Execution pipeline</span>
    <div data-gaussian-splats-execution></div>
  </label>
  <label data-gaussian-splats-scene-control hidden style="gap:5px;font-size:12px">
    <span>Gaussian splat scene</span>
    <div data-gaussian-splats-scene></div>
  </label>
  <div data-gaussian-splats-progress hidden aria-live="polite" style="gap:5px;font-size:12px">
    <strong data-gaussian-splats-progress-status>Preparing scene…</strong>
    <div style="display:flex;align-items:center;gap:7px">
      <progress data-gaussian-splats-progress-bar max="1" style="flex:1;min-width:0;height:8px"></progress>
      <span data-gaussian-splats-progress-complete hidden aria-hidden="true" style="color:#82e5ad;font-size:12px;line-height:1">✓</span>
    </div>
    <span data-gaussian-splats-progress-detail style="opacity:.75"></span>
  </div>
  <div data-gaussian-splats-rad-diagnostics hidden aria-live="polite" style="font-size:11px;line-height:1.45;opacity:.75"></div>
  <div data-gaussian-splats-load-error hidden role="alert" style="font-size:12px;line-height:1.45;color:#ff9ba5"></div>
  <label style="display:grid;gap:5px;font-size:12px">
    <span>Transparency ordering</span>
    <div data-gaussian-splats-sort></div>
  </label>
  <label style="display:grid;gap:5px;font-size:12px">
    <span>Gaussian radius <strong data-gaussian-splats-radius-value>1.35×</strong></span>
    <input data-gaussian-splats-radius type="range" min="0.4" max="2.8" step="0.05" value="1.35" />
  </label>
  <label style="display:grid;gap:5px;font-size:12px">
    <span>Opacity <strong data-gaussian-splats-opacity-value>90%</strong></span>
    <input data-gaussian-splats-opacity type="range" min="0.15" max="1.5" step="0.05" value="0.9" />
  </label>
  <label style="display:flex;align-items:center;gap:8px;font-size:12px">
    <input data-gaussian-splats-orbit type="checkbox" checked /> Cinematic orbit
  </label>
  <details data-gaussian-splats-graph-details hidden style="font-size:12px">
    <summary style="cursor:pointer">GPU graph inspector</summary>
    <div data-gaussian-splats-graph-inspector style="margin-top:9px"></div>
  </details>
</section>`;
}
