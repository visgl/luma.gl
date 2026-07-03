// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {
  ArrowPointRendererProps,
  ArrowPointRendererDataBatchUpdate,
  ArrowPointRendererMetrics
} from './arrow-point-renderer';
import type {PointModelMode} from './point-model';
import {
  createStreamingPointRecordBatchIterator,
  formatPointCurrentTimeLabel,
  getEffectivePointTimeKind,
  getPointTimeColumn,
  makeArrowPointExampleData,
  type ArrowPointColorKind,
  type ArrowPointRadiusKind,
  type ArrowPointRowCountKind,
  type ArrowPointSourceKind,
  type ArrowPointTimeKind
} from './arrow-point-generator';
import {ArrowPointControlPanel} from './control-panel';
import {ArrowExamplePanelManager} from '../arrow-example-panels';

export type ArrowPointDataSourceUpdate = Pick<
  ArrowPointRendererProps,
  'data' | 'onDataBatch' | 'timeColumn' | 'timeOrigin' | 'colors' | 'radii' | 'center' | 'scale'
>;

/** Owns point source generation, controls, and Arrow table inspection. */
export class ArrowPointDataSource {
  private readonly device: Device;
  private readonly onDataUpdated: (update: ArrowPointDataSourceUpdate) => void;
  private readonly onRendererPropsUpdated: (
    props: Pick<ArrowPointRendererProps, 'modelMode'>
  ) => void;
  readonly panels: ArrowExamplePanelManager;
  readonly controlPanel: ArrowPointControlPanel;
  rowCountKind: ArrowPointRowCountKind = '10k-stream';
  sourceKind: ArrowPointSourceKind = 'xym';
  timeKind: ArrowPointTimeKind = 'm';
  colorKind: ArrowPointColorKind = 'row-colors';
  radiusKind: ArrowPointRadiusKind = 'row-radii';
  modelMode: PointModelMode = 'attributes';
  animate = true;
  private isFinalized = false;

  constructor({
    device,
    onDataUpdated,
    onRendererPropsUpdated
  }: {
    device: Device;
    onDataUpdated: (update: ArrowPointDataSourceUpdate) => void;
    onRendererPropsUpdated: (props: Pick<ArrowPointRendererProps, 'modelMode'>) => void;
  }) {
    this.device = device;
    this.onDataUpdated = onDataUpdated;
    this.onRendererPropsUpdated = onRendererPropsUpdated;
    this.panels = new ArrowExamplePanelManager({
      descriptionPanel: () => this.controlPanel.makeDescriptionPanel(),
      settingsPanel: () => this.controlPanel.makeSettingsPanel()
    });
    this.controlPanel = new ArrowPointControlPanel({
      initialState: this.getControlPanelState(),
      handlers: {
        onRowCountKindChange: rowCountKind =>
          this.streamPointInput(
            rowCountKind,
            this.sourceKind,
            this.timeKind,
            this.colorKind,
            this.radiusKind
          ),
        onSourceKindChange: sourceKind =>
          this.streamPointInput(
            this.rowCountKind,
            sourceKind,
            this.timeKind,
            this.colorKind,
            this.radiusKind
          ),
        onTimeKindChange: timeKind =>
          this.streamPointInput(
            this.rowCountKind,
            this.sourceKind,
            timeKind,
            this.colorKind,
            this.radiusKind
          ),
        onColorKindChange: colorKind =>
          this.streamPointInput(
            this.rowCountKind,
            this.sourceKind,
            this.timeKind,
            colorKind,
            this.radiusKind
          ),
        onRadiusKindChange: radiusKind =>
          this.streamPointInput(
            this.rowCountKind,
            this.sourceKind,
            this.timeKind,
            this.colorKind,
            radiusKind
          ),
        onModelModeChange: this.handleModelModeChange,
        onAnimateChange: enabled => {
          this.animate = enabled;
        }
      },
      onRefresh: () => this.panels.refresh(),
      supportsStorage: device.type === 'webgpu'
    });
  }

  initialize(): void {
    this.panels.mount();
    this.controlPanel.initialize();
    this.streamPointInput(
      this.rowCountKind,
      this.sourceKind,
      this.timeKind,
      this.colorKind,
      this.radiusKind
    );
  }

  finalize(): void {
    this.isFinalized = true;
    this.controlPanel.destroy();
    this.panels.finalize();
  }

  setCurrentTime(milliseconds: number): void {
    this.controlPanel.setCurrentTimeLabel(
      this.timeKind === 'none' ? '-' : formatPointCurrentTimeLabel(milliseconds)
    );
  }

  setMetrics(metrics: ArrowPointRendererMetrics): void {
    this.controlPanel.setMetrics(metrics);
  }

  private getControlPanelState() {
    return {
      rowCountKind: this.rowCountKind,
      sourceKind: this.sourceKind,
      timeKind: this.timeKind,
      colorKind: this.colorKind,
      radiusKind: this.radiusKind,
      modelMode: this.modelMode,
      animate: this.animate
    };
  }

  private streamPointInput(
    rowCountKind: ArrowPointRowCountKind,
    sourceKind: ArrowPointSourceKind,
    timeKind: ArrowPointTimeKind,
    colorKind: ArrowPointColorKind,
    radiusKind: ArrowPointRadiusKind
  ): void {
    const effectiveTimeKind = getEffectivePointTimeKind(sourceKind, timeKind);
    this.rowCountKind = rowCountKind;
    this.sourceKind = sourceKind;
    this.timeKind = effectiveTimeKind;
    this.colorKind = colorKind;
    this.radiusKind = radiusKind;
    const sourceData = makeArrowPointExampleData(
      rowCountKind,
      sourceKind,
      effectiveTimeKind,
      colorKind,
      radiusKind
    );
    this.controlPanel.syncControls({
      rowCountKind,
      sourceKind,
      timeKind: effectiveTimeKind,
      colorKind,
      radiusKind
    });
    this.controlPanel.setStreamingBatchStatus(0, sourceData.batchCount);
    const tableStream = this.panels.beginLoadedTableStream({
      id: 'points-source',
      label: 'Loaded point source',
      kind: 'source',
      recordBatches: sourceData.recordBatches
    });
    this.onDataUpdated({
      data: createStreamingPointRecordBatchIterator(sourceData.recordBatches)[
        Symbol.asyncIterator
      ](),
      timeColumn: getPointTimeColumn(effectiveTimeKind),
      timeOrigin: sourceData.timeOriginMilliseconds,
      colors: colorKind === 'constant' ? null : undefined,
      radii: radiusKind === 'constant' ? null : undefined,
      center: [0, 0],
      scale: 1,
      onDataBatch: ({loadedBatchCount, metrics}: ArrowPointRendererDataBatchUpdate) => {
        if (this.isFinalized) return;
        tableStream.setLoadedBatchCount(loadedBatchCount);
        this.controlPanel.setStreamingBatchStatus(loadedBatchCount, sourceData.batchCount);
        this.controlPanel.setMetrics(metrics);
      }
    });
  }

  private readonly handleModelModeChange = (modelMode: PointModelMode): void => {
    const effectiveMode = this.device.type === 'webgpu' ? modelMode : 'attributes';
    if (effectiveMode === this.modelMode) return;
    this.modelMode = effectiveMode;
    this.controlPanel.syncControls({modelMode: effectiveMode});
    this.onRendererPropsUpdated({modelMode: effectiveMode});
  };
}
