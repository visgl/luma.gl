// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {AnimationLoopTemplate, type AnimationProps} from '@luma.gl/engine';
import {VOLUME_LAB_INFO_HTML, VolumeLabUserInterface} from './app-ui';
import {makeVolumeLabDataset, type VolumeLabDataset} from './volume-lab-data';
import {VolumeLabEngine} from './volume-lab-engine';
import {VolumeLabRenderer, type VolumeLabDisplaySettings} from './volume-lab-renderer';

export const title = 'LuCIM Volume Lab';
export const description =
  'GPU-resident thresholding, 3D morphology, connected components, and region measurements on a synthetic CT-like phantom.';

type VolumeLabAnimationProps = AnimationProps & {dataset?: VolumeLabDataset};

/** Interactive tri-planar inspection of one reusable LuCIM segmentation graph. */
export default class VolumeLabAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = VOLUME_LAB_INFO_HTML;
  static props = {debug: true};

  readonly device: Device;
  readonly dataset: VolumeLabDataset;
  readonly engine: VolumeLabEngine;
  readonly renderer: VolumeLabRenderer;
  readonly userInterface: VolumeLabUserInterface;

  settings: VolumeLabDisplaySettings;

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
    this.userInterface = new VolumeLabUserInterface({
      dataset: this.dataset,
      residentByteLength: this.engine.residentByteLength,
      nodeCount: this.engine.nodeCount,
      initialSettings: this.settings,
      onThresholdChange: threshold => this.engine.setThreshold(threshold),
      onSettingsChange: settings => {
        this.settings = settings;
      }
    });
    this.userInterface.mount();
  }

  override onRender({device}: AnimationProps): void {
    const encoding = this.engine.encodeIfNeeded(device.commandEncoder);
    if (encoding) {
      this.userInterface.updateEncoding(encoding.stats);
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
    this.userInterface.finalize();
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
    this.userInterface.updateAnalysisStatus(status);
  }
}
