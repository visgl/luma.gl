// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  createStreamingTemporalStarfieldRecordBatchIterator,
  makeTemporalStarfieldRecordBatches,
  STAR_COUNT,
  STREAMING_STARFIELD_BATCH_COUNT,
  STREAMING_STARFIELD_ROWS_PER_BATCH
} from './arrow-temporal-starfield-data';
import type {
  ArrowTemporalStarfieldRendererDataBatchUpdate,
  ArrowTemporalStarfieldRendererProps,
  ArrowTemporalStarfieldRenderer
} from './arrow-temporal-starfield-renderer';
import {ArrowTemporalStarfieldControlPanel} from './control-panel';
import {supportsVertexStorageBuffers} from '../utils/device-limits';
import {ArrowExamplePanelManager} from '../arrow-example-panels';

const TEMPORAL_STARFIELD_VERTEX_STORAGE_BUFFER_COUNT = 6;

/** Owns starfield source streams and controls. */
export class ArrowTemporalStarfieldSource {
  readonly controlPanel: ArrowTemporalStarfieldControlPanel;
  readonly panels: ArrowExamplePanelManager;
  activeRenderMode: 'attributes' | 'storage';
  activeTimeColumn: 'timestamp' | 'xyzm' = 'timestamp';
  private isFinalized = false;

  constructor(
    private readonly device: Device,
    private readonly onSourceChange: (props: ArrowTemporalStarfieldRendererProps) => void,
    private readonly onRendererPropsChange: (props: ArrowTemporalStarfieldRendererProps) => void
  ) {
    const supportsStorage = supportsVertexStorageBuffers(
      device,
      TEMPORAL_STARFIELD_VERTEX_STORAGE_BUFFER_COUNT
    );
    this.activeRenderMode = supportsStorage ? 'storage' : 'attributes';
    this.controlPanel = new ArrowTemporalStarfieldControlPanel({
      initialState: {
        renderMode: this.activeRenderMode,
        timeColumn: this.activeTimeColumn,
        supportsStorage
      },
      handlers: {
        onRenderModeChange: this.handleRenderModeSelection,
        onTimeColumnChange: this.handleTimeColumnSelection
      },
      onRefresh: () => this.panels.refresh()
    });
    this.panels = new ArrowExamplePanelManager({
      descriptionPanel: () => this.controlPanel.makeDescriptionPanel(),
      settingsPanel: () => this.controlPanel.makeSettingsPanel()
    });
  }

  initialize(): void {
    this.panels.mount();
    this.controlPanel.initialize();
    this.startStreaming();
  }

  updateLabels(renderer: ArrowTemporalStarfieldRenderer): void {
    if (renderer.temporalStarfieldTableInput) {
      this.controlPanel.setCurrentTimestampLabel(renderer.getCurrentTimestampLabel());
    }
  }

  finalize(): void {
    this.isFinalized = true;
    this.controlPanel.destroy();
    this.panels.finalize();
  }

  private startStreaming(): void {
    const recordBatches = makeTemporalStarfieldRecordBatches(
      STAR_COUNT,
      STREAMING_STARFIELD_ROWS_PER_BATCH,
      this.activeTimeColumn
    );
    this.controlPanel.setStreamingBatchStatus(0, STREAMING_STARFIELD_BATCH_COUNT);
    const tableStream = this.panels.beginLoadedTableStream({
      id: 'temporal-starfield-source',
      label: 'Loaded starfield source',
      kind: 'source',
      recordBatches
    });
    this.onSourceChange({
      data: createStreamingTemporalStarfieldRecordBatchIterator(recordBatches),
      onDataBatch: (update: ArrowTemporalStarfieldRendererDataBatchUpdate) => {
        if (this.isFinalized) return;
        tableStream.setLoadedBatchCount(update.loadedBatchCount);
        this.controlPanel.setStreamingBatchStatus(
          update.loadedBatchCount,
          STREAMING_STARFIELD_BATCH_COUNT
        );
      }
    });
  }

  private readonly handleRenderModeSelection = (
    requestedRenderMode: 'attributes' | 'storage'
  ): void => {
    const nextRenderMode =
      requestedRenderMode === 'storage' &&
      !supportsVertexStorageBuffers(this.device, TEMPORAL_STARFIELD_VERTEX_STORAGE_BUFFER_COUNT)
        ? 'attributes'
        : requestedRenderMode;
    this.controlPanel.syncControls({renderMode: nextRenderMode});
    if (nextRenderMode === this.activeRenderMode) return;
    this.activeRenderMode = nextRenderMode;
    this.onRendererPropsChange({renderMode: nextRenderMode});
  };

  private readonly handleTimeColumnSelection = (timeColumn: 'timestamp' | 'xyzm'): void => {
    if (timeColumn === this.activeTimeColumn) return;
    this.activeTimeColumn = timeColumn;
    this.controlPanel.syncControls({timeColumn});
    this.onRendererPropsChange({timeColumn});
    this.startStreaming();
  };
}
