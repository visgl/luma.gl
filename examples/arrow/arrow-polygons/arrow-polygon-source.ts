// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  type ArrowPolygonRendererDataBatchUpdate,
  type ArrowPolygonRendererModel,
  type ArrowPolygonRendererProps
} from '@luma.gl/arrow';
import {
  createStreamingPolygonRecordBatchIterator,
  type ArrowPolygonColorKind,
  type ArrowPolygonRowCountKind,
  type ArrowPolygonSourceKind,
  type ArrowPolygonViewState,
  makeArrowPolygonExampleData
} from './arrow-polygon-data';
import {ArrowPolygonControlPanel} from './control-panel';
import {ArrowExamplePanelManager} from '../arrow-example-panels';

export type ArrowPolygonSourceUpdate = Pick<
  ArrowPolygonRendererProps,
  'data' | 'onDataBatch' | 'tessellated' | 'colors' | 'model' | 'center' | 'scale'
> & {viewState: ArrowPolygonViewState};

/** Owns polygon source generation, controls, and Arrow table inspection. */
export class ArrowPolygonSource {
  readonly panels: ArrowExamplePanelManager;
  readonly controlPanel: ArrowPolygonControlPanel;
  rowCountKind: ArrowPolygonRowCountKind = '10k-stream';
  sourceKind: ArrowPolygonSourceKind = 'polygon';
  colorKind: ArrowPolygonColorKind = 'row-colors';
  modelKind: ArrowPolygonRendererModel = 'attribute';
  private isFinalized = false;

  constructor(
    device: Device,
    private readonly onSourceChange: (update: ArrowPolygonSourceUpdate) => void,
    private readonly onRendererPropsChange: (
      props: Pick<ArrowPolygonRendererProps, 'model'>
    ) => void
  ) {
    this.panels = new ArrowExamplePanelManager({
      descriptionPanel: () => this.controlPanel.makeDescriptionPanel(),
      settingsPanel: () => this.controlPanel.makeSettingsPanel()
    });
    this.controlPanel = new ArrowPolygonControlPanel({
      device,
      initialState: this.getControlState(),
      handlers: {
        onRowCountKindChange: rowCountKind =>
          this.streamPolygonInput(rowCountKind, this.sourceKind, this.colorKind),
        onSourceKindChange: sourceKind =>
          this.streamPolygonInput(this.rowCountKind, sourceKind, this.colorKind),
        onColorKindChange: colorKind =>
          this.streamPolygonInput(this.rowCountKind, this.sourceKind, colorKind),
        onModelKindChange: this.handleModelKindChange
      },
      onRefresh: () => this.panels.refresh()
    });
  }

  initialize(): void {
    this.panels.mount();
    this.controlPanel.initialize();
    this.streamPolygonInput(this.rowCountKind, this.sourceKind, this.colorKind);
  }

  finalize(): void {
    this.isFinalized = true;
    this.controlPanel.destroy();
    this.panels.finalize();
  }

  setPickedRow(batchIndex: number | null, rowIndex: number | null): void {
    this.controlPanel.setPickedLabel(
      batchIndex === null || rowIndex === null
        ? 'Hover polygon'
        : `row ${rowIndex.toLocaleString()} / batch ${(batchIndex + 1).toLocaleString()}`
    );
  }

  private getControlState() {
    return {
      rowCountKind: this.rowCountKind,
      sourceKind: this.sourceKind,
      colorKind: this.colorKind,
      modelKind: this.modelKind
    };
  }

  private streamPolygonInput(
    rowCountKind: ArrowPolygonRowCountKind,
    sourceKind: ArrowPolygonSourceKind,
    colorKind: ArrowPolygonColorKind
  ): void {
    const effectiveColorKind =
      sourceKind === 'dense-union' && colorKind === 'vertex-colors' ? 'row-colors' : colorKind;
    this.rowCountKind = rowCountKind;
    this.sourceKind = sourceKind;
    this.colorKind = effectiveColorKind;
    const sourceData = makeArrowPolygonExampleData(rowCountKind, sourceKind, effectiveColorKind);
    this.controlPanel.syncControls({rowCountKind, sourceKind, colorKind: effectiveColorKind});
    this.controlPanel.setPickedLabel('Hover polygon');
    this.controlPanel.setStreamingBatchStatus(0, sourceData.batchCount);
    const tableStream = this.panels.beginLoadedTableStream({
      id: 'polygons-source',
      label: 'Loaded polygon source',
      kind: 'source',
      recordBatches: sourceData.recordBatches
    });
    this.onSourceChange({
      viewState: sourceData.viewState,
      tessellated: sourceData.tessellated,
      colors: effectiveColorKind === 'constant' ? null : undefined,
      model: this.modelKind,
      center: sourceData.viewState.startCenter,
      scale: sourceData.viewState.scale,
      data: createStreamingPolygonRecordBatchIterator(sourceData.recordBatches)[
        Symbol.asyncIterator
      ](),
      onDataBatch: ({loadedBatchCount, metrics}: ArrowPolygonRendererDataBatchUpdate) => {
        if (this.isFinalized) return;
        tableStream.setLoadedBatchCount(loadedBatchCount);
        this.controlPanel.setStreamingBatchStatus(loadedBatchCount, sourceData.batchCount);
        this.controlPanel.setMetrics(metrics);
      }
    });
  }

  private readonly handleModelKindChange = (modelKind: ArrowPolygonRendererModel): void => {
    if (modelKind === this.modelKind) return;
    this.modelKind = modelKind;
    this.controlPanel.syncControls({modelKind});
    this.onRendererPropsChange({model: modelKind});
  };
}
