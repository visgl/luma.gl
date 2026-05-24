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
  ArrowTemporalStarfieldLayer,
  type ArrowTemporalStarfieldLayerRecordBatchStreamUpdate
} from './arrow-temporal-starfield-layer';
import {
  ArrowTemporalStarfieldControlPanel,
  makeArrowTemporalStarfieldControlPanelHtml
} from './control-panel';

export const title = 'Time: Blinking Stars';
export const description =
  'Scalar Arrow Timestamp and Duration columns normalized to relative Float32 GPU rows for blinking star instances.';

export default class ArrowTemporalStarfieldAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowTemporalStarfieldControlPanelHtml();

  readonly device: Device;
  readonly controlPanel: ArrowTemporalStarfieldControlPanel;
  activeInputKind: 'eager' | 'streaming' = 'eager';
  activeRenderMode: 'attributes' | 'storage';
  activeTimeColumn: 'timestamp' | 'xyzm' = 'timestamp';
  layer: ArrowTemporalStarfieldLayer | null = null;
  inputRequestVersion = 0;
  isFinalized = false;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
    this.activeRenderMode = this.device.type === 'webgpu' ? 'storage' : 'attributes';
    this.controlPanel = new ArrowTemporalStarfieldControlPanel({
      initialState: {
        inputKind: this.activeInputKind,
        renderMode: this.activeRenderMode,
        timeColumn: this.activeTimeColumn,
        supportsStorage: this.device.type === 'webgpu'
      },
      handlers: {
        onInputKindChange: this.handleInputKindSelection,
        onRenderModeChange: this.handleRenderModeSelection,
        onTimeColumnChange: this.handleTimeColumnSelection
      }
    });
  }

  override async onInitialize(): Promise<void> {
    this.layer = new ArrowTemporalStarfieldLayer(this.device, {
      renderMode: this.activeRenderMode,
      timeColumn: this.activeTimeColumn
    });
    await this.layer.initialize();
    this.controlPanel.initialize();
    this.controlPanel.setLabels(this.layer.getLabels());
    this.controlPanel.setStreamingBatchStatus(null, STREAMING_STARFIELD_BATCH_COUNT);
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
    this.inputRequestVersion++;
    this.controlPanel.destroy();
    this.layer?.destroy();
  }

  handleInputKindSelection = (inputKind: 'eager' | 'streaming'): void => {
    if (inputKind === this.activeInputKind) {
      return;
    }

    this.activeInputKind = inputKind;
    this.controlPanel.syncControls({inputKind});
    if (inputKind === 'streaming') {
      this.startStreamingStarfield();
      return;
    }
    void this.showEagerStarfield();
  };

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
    if (this.activeInputKind === 'streaming') {
      this.startStreamingStarfield();
      return;
    }
    void this.showEagerStarfield();
  };

  private async showEagerStarfield(): Promise<void> {
    const requestVersion = ++this.inputRequestVersion;
    this.layer?.cancelRecordBatchStream();
    await this.layer?.initialize();
    if (this.isFinalized || requestVersion !== this.inputRequestVersion || !this.layer) {
      return;
    }
    this.controlPanel.setLabels(this.layer.getLabels());
    this.controlPanel.setStreamingBatchStatus(null, STREAMING_STARFIELD_BATCH_COUNT);
  }

  private startStreamingStarfield(): void {
    const layer = this.layer;
    if (!layer) {
      return;
    }

    this.inputRequestVersion++;
    this.controlPanel.setStreamingBatchStatus(0, STREAMING_STARFIELD_BATCH_COUNT);
    const streamingSession = layer.beginRecordBatchStream();
    const recordBatches = makeTemporalStarfieldRecordBatches(
      STAR_COUNT,
      STREAMING_STARFIELD_ROWS_PER_BATCH,
      this.activeTimeColumn
    );

    void layer.streamRecordBatches({
      streamingSession,
      recordBatchIterator: createStreamingTemporalStarfieldRecordBatchIterator(recordBatches),
      onBatch: this.handleStreamingStarfieldBatch
    });
  }

  private readonly handleStreamingStarfieldBatch = (
    update: ArrowTemporalStarfieldLayerRecordBatchStreamUpdate
  ): void => {
    if (this.isFinalized || this.activeInputKind !== 'streaming' || !this.layer) {
      return;
    }
    if (update.isFirstBatch) {
      this.controlPanel.setLabels(this.layer.getLabels());
    }
    this.controlPanel.setStreamingBatchStatus(
      update.loadedBatchCount,
      STREAMING_STARFIELD_BATCH_COUNT
    );
  };
}
