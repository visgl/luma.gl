// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {ArrowTimeColumnsRenderer} from './arrow-time-columns-renderer';
import {
  ArrowTimeColumnsControlPanel,
  makeArrowTimeColumnsControlPanelHtml,
  type TimeColumnsRenderMode
} from './control-panel';

export const title = 'Time: Date/Time/Timestamp/Duration';
export const description =
  'Scalar Arrow temporal columns normalized to relative Float32 GPU rows for attribute-backed and storage-backed schedule rendering.';

export default class ArrowTimeColumnsAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowTimeColumnsControlPanelHtml();

  readonly device: Device;
  readonly controlPanel: ArrowTimeColumnsControlPanel;
  activeRenderMode: TimeColumnsRenderMode;
  layer: ArrowTimeColumnsRenderer | null = null;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
    this.activeRenderMode = this.device.type === 'webgpu' ? 'storage' : 'attributes';
    this.controlPanel = new ArrowTimeColumnsControlPanel({
      initialState: {
        renderMode: this.activeRenderMode,
        supportsStorage: this.device.type === 'webgpu'
      },
      handlers: {onRenderModeChange: this.handleRenderModeSelection}
    });
  }

  override async onInitialize(): Promise<void> {
    this.layer = new ArrowTimeColumnsRenderer(this.device, {
      renderMode: this.activeRenderMode
    });
    await this.layer.initialize();
    this.controlPanel.initialize();
    this.controlPanel.setLabels(this.layer.getLabels());
  }

  override onRender({device, time}: AnimationProps): void {
    const renderPass = device.beginRenderPass({
      clearColor: [0.025, 0.04, 0.075, 1]
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

  handleRenderModeSelection = (requestedRenderMode: TimeColumnsRenderMode): void => {
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
