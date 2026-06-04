// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {
  ArrowColumnRenderer,
  formatActiveTimeBucket,
  getDefaultColumnRendererMetricDefaults
} from './arrow-column-renderer';
import {formatArrowColumnRendererMetrics} from './arrow-column-metrics';
import {
  ArrowColumnRendererControlPanel,
  makeArrowColumnRendererControlPanelHtml
} from './control-panel';
import {ArrowExamplePanelManager, makeArrowExamplePanelHostHtml} from '../arrow-example-panels';

export const title = 'DGGS + time';
export const description =
  'Fetches the deck.gl HexagonLayer accident dataset, converts it to Arrow H3/time/count columns, and renders animated GPU-decoded H3 columns.';

export default class ArrowColumnRendererAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();

  static props = {useDevicePixels: true, createFramebuffer: true};

  readonly device: Device;
  readonly controlPanel = new ArrowColumnRendererControlPanel();
  readonly panels = new ArrowExamplePanelManager({
    controlsHtml: makeArrowColumnRendererControlPanelHtml()
  });
  layer: ArrowColumnRenderer | null = null;
  isFinalized = false;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
  }

  override async onInitialize(): Promise<void> {
    this.panels.mount();
    this.controlPanel.initialize();
    this.controlPanel.setStatus('Loading deck.gl CSV');
    this.controlPanel.setMetrics(
      formatArrowColumnRendererMetrics(getDefaultColumnRendererMetricDefaults())
    );

    const layer = new ArrowColumnRenderer(this.device);
    this.layer = layer;
    try {
      await layer.initialize();
    } catch (error) {
      this.controlPanel.setStatus(getErrorMessage(error));
      throw error;
    }

    if (this.isFinalized) {
      layer.destroy();
      return;
    }
    this.controlPanel.setStatus('Rendering WebGPU columns');
    this.controlPanel.setMetrics(formatArrowColumnRendererMetrics(layer.getMetrics()));
    const sourceData = layer.getSourceData();
    this.panels.setTableEntries([
      {
        id: 'columns-aggregate',
        label: 'Aggregated columns',
        kind: 'source',
        table: sourceData.table
      },
      {
        id: 'columns-geometry',
        label: 'Decoded H3 geometry keys',
        kind: 'derived',
        table: sourceData.geometryTable
      }
    ]);
  }

  override onRender({aspect, device, time}: AnimationProps): void {
    const renderPass = device.beginRenderPass({
      clearColor: [0.012, 0.024, 0.045, 1],
      clearDepth: 1
    });
    this.layer?.draw(renderPass, {time, aspect});
    renderPass.end();

    if (this.layer) {
      this.controlPanel.setActiveTimeBucket(
        formatActiveTimeBucket(this.layer.getActiveTimeBucket())
      );
    }
  }

  override onFinalize(): void {
    this.isFinalized = true;
    this.controlPanel.destroy();
    this.panels.finalize();
    this.layer?.destroy();
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
