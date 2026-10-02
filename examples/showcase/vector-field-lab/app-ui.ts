// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {VectorFieldPreset} from './vector-field-presets';

export type VectorFieldOverlayElements = {
  formula: HTMLElement | null;
  probe: HTMLElement | null;
};

export function getVectorFieldOverlayHtml(): string {
  return `
  <style>
    #field-overlay { position:fixed; inset:0; pointer-events:none; color:#e7f7ff; z-index:2; }
    .field-title { position:absolute; left:22px; top:18px; padding:12px 15px; border:1px solid rgb(99 199 224 / 25%); border-radius:10px; background:rgb(3 12 25 / 74%); backdrop-filter:blur(12px); }
    .field-title h1 { margin:0; font:600 17px/1.2 inherit; letter-spacing:.01em; }
    .field-title p { margin:5px 0 0; color:#8ec5d6; font:12px/1.3 ui-monospace,monospace; }
    .panel-label { position:absolute; padding:6px 9px; border-radius:5px; background:rgb(1 9 19 / 72%); color:#d9f6ff; font:600 11px/1 ui-sans-serif,sans-serif; letter-spacing:.08em; text-transform:uppercase; }
    .panel-label:nth-child(2) { left:14px; top:112px; }
    .panel-label:nth-child(3) { left:calc(50% + 14px); top:14px; }
    .panel-label:nth-child(4) { left:14px; top:calc(50% + 14px); }
    .panel-label:nth-child(5) { left:calc(50% + 14px); top:calc(50% + 14px); }
    .field-probe { position:absolute; right:18px; bottom:18px; display:grid; gap:3px; min-width:290px; padding:10px 12px; border:1px solid rgb(255 219 99 / 28%); border-radius:8px; background:rgb(4 12 25 / 82%); color:#a9c9d7; font:11px/1.35 ui-monospace,monospace; backdrop-filter:blur(10px); }
    .field-probe strong { color:#ffe28a; }
    @media (max-width:760px) { .field-title { display:none; } .field-probe { min-width:0; max-width:70vw; } }
  </style>
  <div id="field-overlay">
    <div class="field-title"><h1>Differential Field Observatory</h1><p data-field-formula>F(x,y,z) = (x, y, z)</p></div>
    <div data-field-panel-label class="panel-label">Vector volume F</div>
    <div data-field-panel-label class="panel-label">Divergence volume ∇·F</div>
    <div data-field-panel-label class="panel-label">Curl / vorticity ∇×F</div>
    <div data-field-panel-label class="panel-label">Flow topology</div>
    <div data-field-probe class="field-probe"></div>
  </div>`;
}

export function makeVectorFieldControlsHtml(props: {
  defaultPresetIndex: number;
  graphNodeCount: number;
  presets: readonly VectorFieldPreset[];
  resolution: number;
}): string {
  return `
    <style>
      [data-vector-field-lab] { color:#d8edff; font:12px/1.45 system-ui,sans-serif; }
      [data-vector-field-lab] p { color:#9fb8cc; margin:0 0 12px; }
      [data-vector-field-lab] label { display:grid; gap:5px; margin:10px 0; }
      [data-vector-field-lab] select, [data-vector-field-lab] button { width:100%; color:#e7f7ff; background:#0d2132; border:1px solid #28506a; border-radius:6px; padding:7px; }
      [data-vector-field-lab] .toggle { display:flex; align-items:center; gap:8px; }
      [data-vector-field-lab] .toggle input { accent-color:#4ed6d1; }
      [data-vector-field-lab] .card { margin-top:10px; padding:9px; border:1px solid #1d4057; border-radius:7px; background:rgb(4 19 31 / 72%); color:#9ec8d9; }
      [data-vector-field-lab] .card strong { color:#68e0d2; }
    </style>
    <div data-vector-field-lab>
      <p>Orbit four synchronized ray-marched volumes. One sampled 3D field feeds four second-order WGSL operators.</p>
      <label>Field preset<select data-field-preset>
        ${props.presets.map((preset, index) => `<option value="${preset.id}"${index === props.defaultPresetIndex ? ' selected' : ''}>${preset.name}</option>`).join('')}
      </select></label>
      <label class="toggle"><input type="checkbox" data-field-playing checked /> Animate field evolution</label>
      <button type="button" data-field-center>Reset orbit camera</button>
      <div class="card"><strong>${props.resolution}³ voxels · ${props.graphNodeCount} compute nodes</strong><br />Centered O(h²) interior · O(h²) one-sided edges · f32 storage · no volume readback</div>
      <div class="card">Drag to orbit every volume together. Use the wheel to fly closer or farther.</div>
    </div>`;
}

export function bindVectorFieldControls(
  root: HTMLElement,
  callbacks: {
    onCenter: () => void;
    onPlayingChange: (playing: boolean) => void;
    onPresetChange: (presetId: string) => void;
  }
): void {
  root
    .querySelector<HTMLSelectElement>('[data-field-preset]')
    ?.addEventListener('change', event => {
      callbacks.onPresetChange((event.currentTarget as HTMLSelectElement).value);
    });
  root
    .querySelector<HTMLInputElement>('[data-field-playing]')
    ?.addEventListener('change', event => {
      callbacks.onPlayingChange((event.currentTarget as HTMLInputElement).checked);
    });
  root
    .querySelector<HTMLButtonElement>('[data-field-center]')
    ?.addEventListener('click', callbacks.onCenter);
}

export function getVectorFieldOverlayElements(): VectorFieldOverlayElements {
  return {
    formula: document.querySelector('[data-field-formula]'),
    probe: document.querySelector('[data-field-probe]')
  };
}

export function updateVectorFieldPanelLabels(preset: VectorFieldPreset): void {
  const labels =
    preset.kind === 'scalar'
      ? ['Scalar volume φ', 'Gradient volume ∇φ', 'Laplacian volume ∇²φ', 'Curvature topology']
      : ['Vector volume F', 'Divergence volume ∇·F', 'Curl / vorticity ∇×F', 'Flow topology'];
  document.querySelectorAll<HTMLElement>('[data-field-panel-label]').forEach((element, index) => {
    element.textContent = labels[index] ?? '';
  });
}

export function updateVectorFieldOverlay(
  elements: VectorFieldOverlayElements,
  preset: VectorFieldPreset,
  time: number
): void {
  if (elements.formula) elements.formula.textContent = preset.formula;
  if (!elements.probe) return;
  const value = preset.probe(0, 0, 0, time);
  const vector = preset.kind === 'scalar' ? value.gradient : value.vector;
  elements.probe.innerHTML =
    `<strong>center probe · p = (0, 0, 0)</strong>` +
    `<span>${preset.kind === 'scalar' ? 'φ' : 'F'} = ${preset.kind === 'scalar' ? formatValue(value.scalar) : formatVector(value.vector)}</span>` +
    `<span>${preset.kind === 'scalar' ? '∇φ' : 'velocity'} = ${formatVector(vector)}</span>` +
    `<span>∇·F ${formatValue(value.divergence)} · curl ${formatVector(value.curl)} · ∇²φ ${formatValue(value.laplacian)}</span>`;
}

function formatValue(value: number): string {
  return Math.abs(value) < 0.0005 ? '0.000' : value.toFixed(3);
}

function formatVector(vector: readonly [number, number, number]): string {
  return `(${formatValue(vector[0])}, ${formatValue(vector[1])}, ${formatValue(vector[2])})`;
}
