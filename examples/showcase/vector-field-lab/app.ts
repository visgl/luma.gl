// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {AnimationLoopTemplate, type AnimationProps} from '@luma.gl/engine';
import {
  ExamplePanelManager,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';
import {VectorFieldEngine} from './vector-field-engine';
import {
  getVectorFieldPreset,
  VECTOR_FIELD_PRESETS,
  type VectorFieldPreset
} from './vector-field-presets';
import {VectorFieldRenderer} from './vector-field-renderer';

export const title = 'Vector Field Lab';
export const description =
  'Linked, GPU-computed views make gradient, divergence, curl, and Laplacian visible in one field.';

type VectorFieldLabProps = AnimationProps & {resolution?: number};

/** Interactive differential-operator showcase backed by one graph-native compute pipeline. */
export default class VectorFieldLabAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `${makeExamplePanelHostHtml()}${getFieldOverlayHtml()}`;
  static props = {debug: true};

  readonly device: Device;
  readonly engine: VectorFieldEngine;
  readonly renderer: VectorFieldRenderer;
  readonly panels: ExamplePanelManager;

  private preset: VectorFieldPreset = VECTOR_FIELD_PRESETS[0];
  private playing = true;
  private probe: [number, number] | null = [0.32, 0.18];
  private canvas: HTMLCanvasElement | null = null;
  private probeElement: HTMLElement | null = null;
  private formulaElement: HTMLElement | null = null;
  private animationSeconds = 0;
  private previousFrameTime: number | null = null;
  private finalized = false;

  constructor({device, resolution = 128}: VectorFieldLabProps) {
    super();
    if (device.type !== 'webgpu') throw new Error('Vector Field Lab requires WebGPU.');
    this.device = device;
    this.engine = new VectorFieldEngine(device, resolution);
    this.renderer = new VectorFieldRenderer(device, this.engine.buffers, resolution);
    this.panels = new ExamplePanelManager({
      panel: makeHtmlCustomPanel({
        id: 'vector-field-lab-controls',
        title: 'Vector Field Lab',
        html: this.getControlsHtml(),
        onRender: root => this.attachControls(root)
      })
    });
    this.panels.mount();
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement) {
      this.canvas = canvas;
      canvas.addEventListener('pointermove', this.handlePointerMove);
      canvas.addEventListener('pointerleave', this.handlePointerLeave);
      canvas.addEventListener('click', this.handlePointerMove);
    }
    this.probeElement = document.querySelector('[data-field-probe]');
    this.formulaElement = document.querySelector('[data-field-formula]');
    this.updateOverlay(0);
  }

  override onRender({time}: AnimationProps): void {
    if (this.previousFrameTime !== null && this.playing) {
      this.animationSeconds += Math.max(0, time - this.previousFrameTime) * 0.001;
    }
    this.previousFrameTime = time;
    const seconds = this.animationSeconds;
    this.engine.update(this.preset, seconds);
    this.renderer.render({
      time: seconds,
      scalarMode: this.preset.kind === 'scalar',
      probe: this.probe
    });
    this.updateOverlay(seconds);
  }

  override onFinalize(): void {
    if (this.finalized) return;
    this.finalized = true;
    this.canvas?.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas?.removeEventListener('pointerleave', this.handlePointerLeave);
    this.canvas?.removeEventListener('click', this.handlePointerMove);
    this.panels.finalize();
    this.renderer.destroy();
    this.engine.destroy();
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.canvas) return;
    const bounds = this.canvas.getBoundingClientRect();
    const screenX = (event.clientX - bounds.left) / bounds.width;
    const screenY = (event.clientY - bounds.top) / bounds.height;
    const panelX = (screenX * 2) % 1;
    const panelY = (screenY * 2) % 1;
    this.probe = [panelX * 2 - 1, (1 - panelY) * 2 - 1];
  };

  private readonly handlePointerLeave = (): void => {
    // Retain the last point: it makes cross-panel comparison possible after moving to the panel UI.
  };

  private attachControls(root: HTMLElement): void {
    root
      .querySelector<HTMLSelectElement>('[data-field-preset]')
      ?.addEventListener('change', event => {
        this.preset = getVectorFieldPreset((event.currentTarget as HTMLSelectElement).value);
        this.animationSeconds = 0;
        this.engine.update(this.preset, 0, true);
        this.updatePanelLabels();
      });
    root
      .querySelector<HTMLInputElement>('[data-field-playing]')
      ?.addEventListener('change', event => {
        this.playing = (event.currentTarget as HTMLInputElement).checked;
      });
    root.querySelector<HTMLButtonElement>('[data-field-center]')?.addEventListener('click', () => {
      this.probe = [0, 0];
    });
    this.updatePanelLabels();
  }

  private updatePanelLabels(): void {
    const labels =
      this.preset.kind === 'scalar'
        ? ['Scalar field φ', 'Gradient ∇φ', 'Laplacian ∇²φ', 'Level sets + ∇φ']
        : ['Vector field F', 'Divergence ∇·F', 'Curl (∇×F)z', 'Flow topology'];
    document.querySelectorAll<HTMLElement>('[data-field-panel-label]').forEach((element, index) => {
      element.textContent = labels[index] ?? '';
    });
  }

  private updateOverlay(time: number): void {
    if (this.formulaElement) this.formulaElement.textContent = this.preset.formula;
    if (!this.probeElement || !this.probe) return;
    const value = this.preset.probe(this.probe[0], this.probe[1], time);
    const vector = this.preset.kind === 'scalar' ? value.gradient : value.vector;
    this.probeElement.innerHTML =
      `<strong>p = (${format(this.probe[0])}, ${format(this.probe[1])})</strong>` +
      `<span>${this.preset.kind === 'scalar' ? 'φ' : 'F'} = ${this.preset.kind === 'scalar' ? format(value.scalar) : `(${format(value.vector[0])}, ${format(value.vector[1])})`}</span>` +
      `<span>${this.preset.kind === 'scalar' ? '∇φ' : 'velocity'} = (${format(vector[0])}, ${format(vector[1])})</span>` +
      `<span>∇·F ${format(value.divergence)} · curl ${format(value.curl)} · ∇²φ ${format(value.laplacian)}</span>`;
  }

  private getControlsHtml(): string {
    const graphStats = this.engine.graph.stats;
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
        <p>One sampled field feeds four second-order WGSL operators. Every panel reads the same GPU-resident buffers.</p>
        <label>Field preset<select data-field-preset>
          ${VECTOR_FIELD_PRESETS.map((preset, index) => `<option value="${preset.id}"${index === 0 ? ' selected' : ''}>${preset.name}</option>`).join('')}
        </select></label>
        <label class="toggle"><input type="checkbox" data-field-playing checked /> Animate time-varying fields</label>
        <button type="button" data-field-center>Probe the origin</button>
        <div class="card"><strong>${this.engine.resolution}² samples · ${graphStats.nodeOrder.length} compute nodes</strong><br />Centered O(h²) interior · O(h²) one-sided edges · f32 storage · no result readback</div>
        <div class="card">Move over any view to pin one world-space probe across all four panels.</div>
      </div>`;
  }
}

function getFieldOverlayHtml(): string {
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
    <div class="field-title"><h1>Differential Field Observatory</h1><p data-field-formula>F(x,y) = (x, y)</p></div>
    <div data-field-panel-label class="panel-label">Vector field F</div>
    <div data-field-panel-label class="panel-label">Divergence ∇·F</div>
    <div data-field-panel-label class="panel-label">Curl (∇×F)z</div>
    <div data-field-panel-label class="panel-label">Flow topology</div>
    <div data-field-probe class="field-probe"></div>
  </div>`;
}

function format(value: number): string {
  return Math.abs(value) < 0.0005 ? '0.000' : value.toFixed(3);
}
