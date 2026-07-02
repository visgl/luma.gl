// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import * as arrow from 'apache-arrow';
import {makeTimeColumnsSourceTable} from './arrow-time-columns-data';
import type {
  ArrowTimeColumnsRenderer,
  ArrowTimeColumnsRendererProps
} from './arrow-time-columns-renderer';
import {ArrowTimeColumnsControlPanel, type TimeColumnsRenderMode} from './control-panel';
import {supportsVertexStorageBuffers} from '../utils/device-limits';
import {ArrowExamplePanelManager} from '../arrow-example-panels';

const TIME_COLUMNS_VERTEX_STORAGE_BUFFER_COUNT = 5;

/** Owns the temporal source table and rendering-mode controls. */
export class ArrowTimeColumnsDataSource {
  readonly controlPanel: ArrowTimeColumnsControlPanel;
  readonly panels: ArrowExamplePanelManager;
  activeRenderMode: TimeColumnsRenderMode;

  constructor(
    private readonly device: Device,
    private readonly onDataSourceChange: (table: arrow.Table) => Promise<void>,
    private readonly onRendererPropsChange: (props: ArrowTimeColumnsRendererProps) => void
  ) {
    const supportsStorage = supportsVertexStorageBuffers(
      device,
      TIME_COLUMNS_VERTEX_STORAGE_BUFFER_COUNT
    );
    this.activeRenderMode = supportsStorage ? 'storage' : 'attributes';
    this.controlPanel = new ArrowTimeColumnsControlPanel({
      initialState: {renderMode: this.activeRenderMode, supportsStorage},
      handlers: {onRenderModeChange: this.handleRenderModeSelection},
      onRefresh: () => this.panels.refresh()
    });
    this.panels = new ArrowExamplePanelManager({
      descriptionPanel: () => this.controlPanel.makeDescriptionPanel(),
      settingsPanel: () => this.controlPanel.makeSettingsPanel()
    });
  }

  async initialize(): Promise<void> {
    this.panels.mount();
    this.controlPanel.initialize();
    const table = makeTimeColumnsSourceTable();
    this.panels.setTableEntries([
      {id: 'time-columns-source', label: 'Temporal schedule source', kind: 'source', table}
    ]);
    await this.onDataSourceChange(table);
  }

  updateLabels(renderer: ArrowTimeColumnsRenderer): void {
    this.controlPanel.setLabels(renderer.getLabels());
    this.controlPanel.setCurrentTimestampLabel(renderer.getCurrentTimestampLabel());
  }

  finalize(): void {
    this.controlPanel.destroy();
    this.panels.finalize();
  }

  private readonly handleRenderModeSelection = (
    requestedRenderMode: TimeColumnsRenderMode
  ): void => {
    const nextRenderMode =
      requestedRenderMode === 'storage' &&
      !supportsVertexStorageBuffers(this.device, TIME_COLUMNS_VERTEX_STORAGE_BUFFER_COUNT)
        ? 'attributes'
        : requestedRenderMode;
    this.controlPanel.syncControls({renderMode: nextRenderMode});
    if (nextRenderMode === this.activeRenderMode) return;
    this.activeRenderMode = nextRenderMode;
    this.onRendererPropsChange({renderMode: nextRenderMode});
  };
}
