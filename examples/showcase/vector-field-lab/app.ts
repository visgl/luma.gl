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
  static info = makeExamplePanelHostHtml();
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
    const seconds = this.playing ? time * 0.001 : 0;
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

function format(value: number): string {
  return Math.abs(value) < 0.0005 ? '0.000' : value.toFixed(3);
}
