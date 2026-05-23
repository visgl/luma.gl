// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {ArrowTemporalStarfieldLayer} from './arrow-temporal-starfield-layer';
import {
  ArrowTemporalStarfieldControlPanel,
  makeArrowTemporalStarfieldControlPanelHtml,
  type TemporalStarfieldRenderMode
} from './control-panel';

export const title = 'Time: Blinking Stars';
export const description =
  'Scalar Arrow Timestamp and Duration columns normalized to relative Float32 GPU rows for blinking star instances.';

export default class ArrowTemporalStarfieldAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowTemporalStarfieldControlPanelHtml();

  readonly device: Device;
  readonly controlPanel: ArrowTemporalStarfieldControlPanel;
  activeRenderMode: TemporalStarfieldRenderMode;
  layer: ArrowTemporalStarfieldLayer | null = null;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
    this.activeRenderMode = this.device.type === 'webgpu' ? 'storage' : 'attributes';
    this.controlPanel = new ArrowTemporalStarfieldControlPanel({
      initialState: {
        renderMode: this.activeRenderMode,
        supportsStorage: this.device.type === 'webgpu'
      },
      handlers: {onRenderModeChange: this.handleRenderModeSelection}
    });
  }

  override async onInitialize(): Promise<void> {
    this.layer = new ArrowTemporalStarfieldLayer(this.device, {
      renderMode: this.activeRenderMode
    });
    await this.layer.initialize();
    this.controlPanel.initialize();
    this.controlPanel.setLabels(this.layer.getLabels());
  }

  override onRender({device, time}: AnimationProps): void {
    const renderPass = device.beginRenderPass({
      clearColor: [0.005, 0.008, 0.024, 1]
    });
    this.layer?.draw(renderPass, {time});
    renderPass.end();
    if (this.layer) {
      this.controlPanel.setCurrentTimestampLabel(this.layer.getCurrentTimestampLabel());
    }
  }

  override onFinalize(): void {
    this.controlPanel.destroy();
    this.layer?.destroy();
  }

  handleRenderModeSelection = (requestedRenderMode: TemporalStarfieldRenderMode): void => {
    const nextRenderMode =
      requestedRenderMode === 'storage' && this.device.type !== 'webgpu'
        ? 'attributes'
        : requestedRenderMode;
    this.controlPanel.syncControls({renderMode: nextRenderMode});
    if (nextRenderMode === this.activeRenderMode) {
      return;
    }
    this.layer?.setProps({renderMode: nextRenderMode});
    this.activeRenderMode = nextRenderMode;
  };
}
