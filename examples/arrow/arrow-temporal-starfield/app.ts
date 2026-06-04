// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {
  createStreamingTemporalStarfieldRecordBatchIterator,
  makeTemporalStarfieldRecordBatches,
  STAR_COUNT,
  STREAMING_STARFIELD_BATCH_COUNT,
  STREAMING_STARFIELD_ROWS_PER_BATCH
} from './arrow-temporal-starfield-data';
import {
  ArrowTemporalStarfieldRenderer,
  type ArrowTemporalStarfieldRendererDataBatchUpdate
} from './arrow-temporal-starfield-renderer';
import {
  ArrowExamplePanelManager,
  makeArrowExamplePanelHostHtml,
  type ArrowExampleLoadedTableStream
} from '../arrow-example-panels';
import {
  ArrowTemporalStarfieldControlPanel,
  makeArrowTemporalStarfieldControlPanelHtml
} from './control-panel';

export const title = 'Time: Blinking Stars';
export const description =
  'Scalar Arrow Timestamp and Duration columns normalized to relative Float32 GPU rows for blinking star instances.';

export default class ArrowTemporalStarfieldAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();

  readonly device: Device;
  readonly controlPanel: ArrowTemporalStarfieldControlPanel;
  readonly panels = new ArrowExamplePanelManager({
    controlsHtml: makeArrowTemporalStarfieldControlPanelHtml()
  });
  activeRenderMode: 'attributes' | 'storage';
  activeTimeColumn: 'timestamp' | 'xyzm' = 'timestamp';
  layer: ArrowTemporalStarfieldRenderer | null = null;
  inputRequestVersion = 0;
  isFinalized = false;
  activeStarfieldTableStream: ArrowExampleLoadedTableStream | null = null;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
    this.activeRenderMode = this.device.type === 'webgpu' ? 'storage' : 'attributes';
    this.controlPanel = new ArrowTemporalStarfieldControlPanel({
      initialState: {
        renderMode: this.activeRenderMode,
        timeColumn: this.activeTimeColumn,
        supportsStorage: this.device.type === 'webgpu'
      },
      handlers: {
        onRenderModeChange: this.handleRenderModeSelection,
        onTimeColumnChange: this.handleTimeColumnSelection
      }
    });
  }

  override async onInitialize(): Promise<void> {
    this.layer = new ArrowTemporalStarfieldRenderer(this.device, {
      renderMode: this.activeRenderMode,
      timeColumn: this.activeTimeColumn
    });
    this.panels.mount();
    this.controlPanel.initialize();
    this.startStreamingStarfield();
  }

  override onRender({device, time}: AnimationProps): void {
    const renderPass = device.beginRenderPass({
      clearColor: [0.005, 0.008, 0.024, 1]
    });
    this.layer?.draw(renderPass, {time});
    renderPass.end();
    if (this.layer?.temporalStarfieldTableInput) {
      this.controlPanel.setCurrentTimestampLabel(this.layer.getCurrentTimestampLabel());
    }
  }

  override onFinalize(): void {
    this.isFinalized = true;
    this.controlPanel.destroy();
    this.panels.finalize();
    this.layer?.destroy();
  }

  handleRenderModeSelection = (requestedRenderMode: 'attributes' | 'storage'): void => {
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

  handleTimeColumnSelection = (timeColumn: 'timestamp' | 'xyzm'): void => {
    if (timeColumn === this.activeTimeColumn) {
      return;
    }

    this.activeTimeColumn = timeColumn;
    this.controlPanel.syncControls({timeColumn});
    this.layer?.setProps({timeColumn});
    this.startStreamingStarfield();
  };

  private startStreamingStarfield(): void {
    const layer = this.layer;
    if (!layer) {
      return;
    }

    this.inputRequestVersion++;
    this.controlPanel.setStreamingBatchStatus(0, STREAMING_STARFIELD_BATCH_COUNT);
    const recordBatches = makeTemporalStarfieldRecordBatches(
      STAR_COUNT,
      STREAMING_STARFIELD_ROWS_PER_BATCH,
      this.activeTimeColumn
    );
    this.activeStarfieldTableStream = this.panels.beginLoadedTableStream({
      id: 'temporal-starfield-source',
      label: 'Loaded starfield source',
      kind: 'source',
      recordBatches
    });

    layer.setProps({
      data: createStreamingTemporalStarfieldRecordBatchIterator(recordBatches),
      onDataBatch: this.handleStreamingStarfieldBatch
    });
  }

  private readonly handleStreamingStarfieldBatch = (
    update: ArrowTemporalStarfieldRendererDataBatchUpdate
  ): void => {
    if (this.isFinalized || !this.layer) {
      return;
    }
    if (update.isFirstBatch) {
      this.controlPanel.setLabels(this.layer.getLabels());
    }
    this.activeStarfieldTableStream?.setLoadedBatchCount(update.loadedBatchCount);
    this.controlPanel.setStreamingBatchStatus(
      update.loadedBatchCount,
      STREAMING_STARFIELD_BATCH_COUNT
    );
  };
}
