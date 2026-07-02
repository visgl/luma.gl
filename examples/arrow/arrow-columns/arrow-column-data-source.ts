// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {loadArrowColumnSourceData, type ArrowColumnSourceData} from './arrow-column-data';
import {formatArrowColumnRendererMetrics} from './arrow-column-metrics';
import {
  getDefaultColumnRendererMetricDefaults,
  type ArrowColumnRendererMetrics
} from './arrow-column-renderer';
import {ArrowColumnRendererControlPanel, type ArrowColumnTransparencyMode} from './control-panel';
import {ArrowExamplePanelManager} from '../arrow-example-panels';

/** Owns asynchronous column source loading and the example controls. */
export class ArrowColumnDataSource {
  readonly controlPanel: ArrowColumnRendererControlPanel;
  readonly panels: ArrowExamplePanelManager;
  transparencyMode: ArrowColumnTransparencyMode = 'a-buffer';
  private isFinalized = false;

  constructor(
    private readonly onDataSourceChange: (sourceData: ArrowColumnSourceData) => void,
    private readonly onTransparencyModeChange: (mode: ArrowColumnTransparencyMode) => void
  ) {
    this.controlPanel = new ArrowColumnRendererControlPanel({
      onTransparencyModeChange: mode => {
        this.transparencyMode = mode;
        this.onTransparencyModeChange(mode);
      }
    });
    this.panels = new ArrowExamplePanelManager({
      descriptionPanel: () => this.controlPanel.makeDescriptionPanel(),
      settingsPanel: () => this.controlPanel.makeSettingsPanel()
    });
  }

  async initialize(): Promise<void> {
    this.panels.mount();
    this.controlPanel.setStatus('Loading deck.gl CSV');
    this.controlPanel.setMetrics(
      formatArrowColumnRendererMetrics(getDefaultColumnRendererMetricDefaults())
    );
    try {
      const sourceData = await loadArrowColumnSourceData();
      if (this.isFinalized) return;
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
      this.onDataSourceChange(sourceData);
    } catch (error) {
      this.controlPanel.setStatus(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  setRendererMetrics(metrics: ArrowColumnRendererMetrics): void {
    this.controlPanel.setMetrics(formatArrowColumnRendererMetrics(metrics));
  }

  setActiveTimeBucket(label: string): void {
    this.controlPanel.setActiveTimeBucket(label);
  }

  setRenderingStatus(): void {
    this.controlPanel.setStatus(
      this.transparencyMode === 'a-buffer'
        ? 'Rendering with A-buffer OIT'
        : this.transparencyMode === 'weighted-blended'
          ? 'Rendering with weighted blended OIT'
          : 'Rendering with standard alpha blending'
    );
  }

  finalize(): void {
    this.isFinalized = true;
    this.controlPanel.destroy();
    this.panels.finalize();
  }
}
