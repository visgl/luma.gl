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
import {ArrowExamplePanelManager, makeArrowExamplePanelHostHtml} from '../arrow-example-panels';
import {supportsVertexStorageBuffers} from '../utils/device-limits';

export const title = 'Time: Date/Time/Timestamp/Duration';
export const description =
  'Scalar Arrow temporal columns normalized to relative Float32 GPU rows for attribute-backed and storage-backed schedule rendering.';
const TIME_COLUMNS_VERTEX_STORAGE_BUFFER_COUNT = 5;

export default class ArrowTimeColumnsAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();

  readonly device: Device;
  readonly controlPanel: ArrowTimeColumnsControlPanel;
  readonly panels = new ArrowExamplePanelManager({
    controlsHtml: makeArrowTimeColumnsControlPanelHtml()
  });
  activeRenderMode: TimeColumnsRenderMode;
  layer: ArrowTimeColumnsRenderer | null = null;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
    const supportsStorage = supportsVertexStorageBuffers(
      this.device,
      TIME_COLUMNS_VERTEX_STORAGE_BUFFER_COUNT
    );
    this.activeRenderMode = supportsStorage ? 'storage' : 'attributes';
    this.controlPanel = new ArrowTimeColumnsControlPanel({
      initialState: {
        renderMode: this.activeRenderMode,
        supportsStorage
      },
      handlers: {onRenderModeChange: this.handleRenderModeSelection}
    });
  }

  override async onInitialize(): Promise<void> {
    this.layer = new ArrowTimeColumnsRenderer(this.device, {
      renderMode: this.activeRenderMode
    });
    await this.layer.initialize();
    this.panels.mount();
    this.controlPanel.initialize();
    this.panels.setTableEntries([
      {
        id: 'time-columns-source',
        label: 'Temporal schedule source',
        kind: 'source',
        table: this.layer.getSourceTable()
      }
    ]);
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
    this.panels.finalize();
    this.layer?.destroy();
  }

  handleRenderModeSelection = (requestedRenderMode: TimeColumnsRenderMode): void => {
    const nextRenderMode =
      requestedRenderMode === 'storage' &&
      !supportsVertexStorageBuffers(this.device, TIME_COLUMNS_VERTEX_STORAGE_BUFFER_COUNT)
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
