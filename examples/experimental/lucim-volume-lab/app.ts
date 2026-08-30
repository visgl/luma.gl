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
import {
  VOLUME_LAB_DEFAULT_THRESHOLD,
  makeVolumeLabDataset,
  type VolumeLabDataset
} from './volume-lab-data';
import {VolumeLabEngine, type VolumeLabAnalysisStatus} from './volume-lab-engine';
import {
  VolumeLabRenderer,
  type VolumeLabDisplayMode,
  type VolumeLabDisplaySettings
} from './volume-lab-renderer';

export const title = 'LuCIM Volume Lab';
export const description =
  'GPU-resident thresholding, 3D morphology, connected components, and region measurements on a synthetic CT-like phantom.';

type VolumeLabAnimationProps = AnimationProps & {dataset?: VolumeLabDataset};

/** Interactive tri-planar inspection of one reusable LuCIM segmentation graph. */
export default class VolumeLabAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();
  static props = {debug: true};

  readonly device: Device;
  readonly dataset: VolumeLabDataset;
  readonly engine: VolumeLabEngine;
  readonly renderer: VolumeLabRenderer;
  readonly panels: ExamplePanelManager;

  settings: VolumeLabDisplaySettings;

  private statusElement: HTMLElement | null = null;
  private encodeElement: HTMLElement | null = null;
  private thresholdDebounce: ReturnType<typeof setTimeout> | null = null;
  private statusReadToken = 0;
  private finalized = false;

  constructor({device, dataset}: VolumeLabAnimationProps) {
    super();
    if (device.type !== 'webgpu') {
      throw new Error('LuCIM Volume Lab requires WebGPU');
    }
    this.device = device;
    this.dataset = dataset ?? makeVolumeLabDataset();
    this.engine = new VolumeLabEngine(device, this.dataset);
    this.renderer = new VolumeLabRenderer(device, this.engine);
    const {width, height, depth} = this.dataset.metadata;
    this.settings = {
      mode: 'components',
      slices: [Math.floor(width / 2), Math.floor(height / 2), Math.floor(depth / 2)],
      windowCenter: -120,
      windowWidth: 1450,
      overlayOpacity: 0.78
    };
    this.panels = new ExamplePanelManager({
      panel: makeHtmlCustomPanel({
        id: 'lucim-volume-lab-controls',
        title: 'LuCIM Volume Lab',
        html: this.getControlsHtml(),
        onRender: root => this.attachControls(root)
      })
    });
    this.panels.mount();
  }

  override onRender({device}: AnimationProps): void {
    const encoding = this.engine.encodeIfNeeded(device.commandEncoder);
    if (encoding) {
      if (this.encodeElement) {
        this.encodeElement.textContent =
          `${encoding.stats.nodeCount} nodes · ${encoding.stats.computePassCount} compute passes · ` +
          `${encoding.stats.cpuEncodeTimeMilliseconds.toFixed(2)} ms CPU encode`;
      }
      const version = this.engine.version;
      const token = ++this.statusReadToken;
      setTimeout(() => void this.readAnalysisStatus(version, token), 0);
    }
    const framebuffer = device.getDefaultCanvasContext().getCurrentFramebuffer();
    this.renderer.render(device.commandEncoder, framebuffer, this.engine, this.settings);
  }

  override onFinalize(): void {
    if (this.finalized) return;
    this.finalized = true;
    if (this.thresholdDebounce) clearTimeout(this.thresholdDebounce);
    this.panels.finalize();
    this.renderer.destroy();
    this.engine.destroy();
  }

  private async readAnalysisStatus(version: number, token: number): Promise<void> {
    const status = await this.engine.readStatus(version);
    if (
      this.finalized ||
      token !== this.statusReadToken ||
      status.version !== this.engine.version
    ) {
      return;
    }
    this.updateAnalysisStatus(status);
  }

  private updateAnalysisStatus(status: VolumeLabAnalysisStatus): void {
    if (!this.statusElement) return;
    const convergence = status.converged ? 'converged' : 'failed closed';
    const overflow = status.regionOverflow ? 'capacity overflow' : 'capacity safe';
    this.statusElement.innerHTML =
      `<strong>${convergence}</strong> in ${status.iterationCount} rounds · ${overflow}<br />` +
      'Only convergence, iteration, and overflow scalars were read back.';
  }

  private attachControls(root: HTMLElement): void {
    this.statusElement = root.querySelector('[data-volume-status]');
    this.encodeElement = root.querySelector('[data-volume-encode]');
    const threshold = getInput(root, '[data-volume-threshold]');
    const thresholdValue = getElement(root, '[data-volume-threshold-value]');
    threshold.addEventListener('input', () => {
      thresholdValue.textContent = `${Number(threshold.value).toFixed(0)} HU`;
      if (this.thresholdDebounce) clearTimeout(this.thresholdDebounce);
      this.thresholdDebounce = setTimeout(() => {
        this.thresholdDebounce = null;
        this.engine.setThreshold(Number(threshold.value));
      }, 90);
    });

    const mode = root.querySelector<HTMLSelectElement>('[data-volume-mode]');
    mode?.addEventListener('change', () => {
      this.settings = {...this.settings, mode: mode.value as VolumeLabDisplayMode};
    });
    this.attachNumberControl(root, 'window-center', value => {
      this.settings = {...this.settings, windowCenter: value};
    });
    this.attachNumberControl(root, 'window-width', value => {
      this.settings = {...this.settings, windowWidth: value};
    });
    this.attachNumberControl(root, 'overlay-opacity', value => {
      this.settings = {...this.settings, overlayOpacity: value};
    });
    this.attachSliceControl(root, 'slice-x', 0);
    this.attachSliceControl(root, 'slice-y', 1);
    this.attachSliceControl(root, 'slice-z', 2);
    root.querySelector('[data-volume-reset-slices]')?.addEventListener('click', () => {
      const {width, height, depth} = this.dataset.metadata;
      const slices: [number, number, number] = [
        Math.floor(width / 2),
        Math.floor(height / 2),
        Math.floor(depth / 2)
      ];
      this.settings = {...this.settings, slices};
      for (const [index, axis] of (['x', 'y', 'z'] as const).entries()) {
        const value = slices[index]!;
        const input = getInput(root, `[data-volume-slice-${axis}]`);
        input.value = String(value);
        getElement(root, `[data-volume-slice-${axis}-value]`).textContent = String(value);
      }
    });
  }

  private attachNumberControl(
    root: HTMLElement,
    name: string,
    update: (value: number) => void
  ): void {
    const input = getInput(root, `[data-volume-${name}]`);
    const output = getElement(root, `[data-volume-${name}-value]`);
    input.addEventListener('input', () => {
      const value = Number(input.value);
      output.textContent = name === 'overlay-opacity' ? value.toFixed(2) : value.toFixed(0);
      update(value);
    });
  }

  private attachSliceControl(root: HTMLElement, name: string, axis: 0 | 1 | 2): void {
    const input = getInput(root, `[data-volume-${name}]`);
    const output = getElement(root, `[data-volume-${name}-value]`);
    input.addEventListener('input', () => {
      const slices: [number, number, number] = [...this.settings.slices];
      slices[axis] = Number(input.value);
      output.textContent = input.value;
      this.settings = {...this.settings, slices};
    });
  }

  private getControlsHtml(): string {
    const {width, height, depth, spacing} = this.dataset.metadata;
    const [sliceX, sliceY, sliceZ] = this.settings.slices;
    return `
      <style>
        [data-lucim-volume-lab] { color: #d9eff5; font: 12px/1.4 system-ui, sans-serif; }
        [data-lucim-volume-lab] .volume-intro { color: #9fc4ce; margin: 0 0 12px; }
        [data-lucim-volume-lab] .volume-views { color: #71d8e8; font-size: 11px; letter-spacing: .04em; margin-bottom: 12px; text-transform: uppercase; }
        [data-lucim-volume-lab] label { display: grid; gap: 4px; margin: 9px 0; }
        [data-lucim-volume-lab] label span { display: flex; justify-content: space-between; }
        [data-lucim-volume-lab] input, [data-lucim-volume-lab] select, [data-lucim-volume-lab] button { width: 100%; }
        [data-lucim-volume-lab] select, [data-lucim-volume-lab] button { background: #102633; border: 1px solid #2c5662; border-radius: 4px; color: #d9eff5; padding: 6px; }
        [data-lucim-volume-lab] .volume-card { background: rgba(7, 24, 34, .78); border: 1px solid #214652; border-radius: 6px; margin-top: 10px; padding: 8px; }
        [data-lucim-volume-lab] .volume-card strong { color: #7fe7f2; }
      </style>
      <div data-lucim-volume-lab>
        <p class="volume-intro">Synthetic, non-diagnostic CT-like density. Persistent values, masks, labels, and region rows remain GPU-resident.</p>
        <div class="volume-views">Axial · Coronal · Sagittal</div>
        <label><span>Display</span><select data-volume-mode>
          <option value="anatomy">Anatomy</option>
          <option value="threshold">Threshold</option>
          <option value="components" selected>Components</option>
        </select></label>
        ${makeRangeControl('threshold', 'Density threshold', -900, 1200, 10, VOLUME_LAB_DEFAULT_THRESHOLD, `${VOLUME_LAB_DEFAULT_THRESHOLD} HU`)}
        ${makeRangeControl('window-center', 'Window center', -700, 600, 10, this.settings.windowCenter, String(this.settings.windowCenter))}
        ${makeRangeControl('window-width', 'Window width', 100, 2200, 25, this.settings.windowWidth, String(this.settings.windowWidth))}
        ${makeRangeControl('overlay-opacity', 'Overlay opacity', 0, 1, 0.02, this.settings.overlayOpacity, this.settings.overlayOpacity.toFixed(2))}
        ${makeRangeControl('slice-x', 'Sagittal X', 0, width - 1, 1, sliceX, String(sliceX))}
        ${makeRangeControl('slice-y', 'Coronal Y', 0, height - 1, 1, sliceY, String(sliceY))}
        ${makeRangeControl('slice-z', 'Axial Z', 0, depth - 1, 1, sliceZ, String(sliceZ))}
        <button type="button" data-volume-reset-slices>Center all slices</button>
        <div class="volume-card"><strong>${width} × ${height} × ${depth}</strong> voxels · ${spacing.join(' × ')} mm<br />${formatBytes(this.engine.residentByteLength)} resident including graph scratch · ${this.engine.nodeCount} reusable nodes</div>
        <div class="volume-card" data-volume-encode>Analysis queued</div>
        <div class="volume-card" data-volume-status>Waiting for compact GPU status</div>
      </div>`;
  }
}

function makeRangeControl(
  name: string,
  label: string,
  minimum: number,
  maximum: number,
  step: number,
  value: number,
  displayValue: string
): string {
  return `<label><span>${label}<output data-volume-${name}-value>${displayValue}</output></span><input data-volume-${name} type="range" min="${minimum}" max="${maximum}" step="${step}" value="${value}" /></label>`;
}

function getInput(root: HTMLElement, selector: string): HTMLInputElement {
  const element = root.querySelector<HTMLInputElement>(selector);
  if (!element) throw new Error(`Missing LuCIM Volume Lab input ${selector}`);
  return element;
}

function getElement(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Missing LuCIM Volume Lab element ${selector}`);
  return element;
}

function formatBytes(byteLength: number): string {
  return `${(byteLength / 1024 ** 2).toFixed(1)} MiB`;
}
