// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Panel, SettingsChangeDescriptor, SettingsSchema} from '@deck.gl-community/panels';
import {
  ExampleSettingsPanelManager,
  getChangedSetting,
  makeHtmlCustomPanel
} from '../../example-panels';
import type {ArrowColumnRendererFormattedMetrics} from './arrow-column-metrics';

const STATUS_ID = 'arrow-columns-status';
const SOURCE_ROWS_ID = 'arrow-columns-source-rows';
const AGGREGATE_ROWS_ID = 'arrow-columns-aggregate-rows';
const DECODED_CELLS_ID = 'arrow-columns-decoded-cells';
const H3_RESOLUTION_ID = 'arrow-columns-h3-resolution';
const TIME_BUCKETS_ID = 'arrow-columns-time-buckets';
const ACTIVE_BUCKET_ID = 'arrow-columns-active-bucket';
const MAX_COUNT_ID = 'arrow-columns-max-count';
const GPU_BYTES_ID = 'arrow-columns-gpu-bytes';
const ARROW_BUILD_TIME_ID = 'arrow-columns-arrow-build-time';
const GEOMETRY_DECODE_TIME_ID = 'arrow-columns-geometry-decode-time';

export type ArrowColumnTransparencyMode = 'a-buffer' | 'weighted-blended' | 'alpha-blending';

export type ArrowColumnRendererControlPanelOptions = {
  onTransparencyModeChange?: (mode: ArrowColumnTransparencyMode) => void;
};

export class ArrowColumnRendererControlPanel {
  private readonly options: ArrowColumnRendererControlPanelOptions;
  private readonly settingsPanel: ExampleSettingsPanelManager;
  private rootElement: HTMLElement | null = null;
  private statusLabel: HTMLElement | null = null;
  private sourceRowsLabel: HTMLElement | null = null;
  private aggregateRowsLabel: HTMLElement | null = null;
  private decodedCellsLabel: HTMLElement | null = null;
  private h3ResolutionLabel: HTMLElement | null = null;
  private timeBucketsLabel: HTMLElement | null = null;
  private activeBucketLabel: HTMLElement | null = null;
  private maxCountLabel: HTMLElement | null = null;
  private gpuBytesLabel: HTMLElement | null = null;
  private arrowBuildTimeLabel: HTMLElement | null = null;
  private geometryDecodeTimeLabel: HTMLElement | null = null;

  constructor(options: ArrowColumnRendererControlPanelOptions = {}) {
    this.options = options;
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'arrow-columns-settings',
      schema: makeArrowColumnRendererSettingsSchema(),
      settings: {transparencyMode: 'a-buffer'},
      onSettingsChange: this.handleSettingsChange
    });
  }

  makeDescriptionPanel(): Panel {
    return makeHtmlCustomPanel({
      id: 'arrow-columns-description',
      title: 'Description',
      html: makeArrowColumnRendererControlPanelHtml(),
      onRender: rootElement => {
        this.rootElement = rootElement;
        this.statusLabel = getElement(rootElement, STATUS_ID);
        this.sourceRowsLabel = getElement(rootElement, SOURCE_ROWS_ID);
        this.aggregateRowsLabel = getElement(rootElement, AGGREGATE_ROWS_ID);
        this.decodedCellsLabel = getElement(rootElement, DECODED_CELLS_ID);
        this.h3ResolutionLabel = getElement(rootElement, H3_RESOLUTION_ID);
        this.timeBucketsLabel = getElement(rootElement, TIME_BUCKETS_ID);
        this.activeBucketLabel = getElement(rootElement, ACTIVE_BUCKET_ID);
        this.maxCountLabel = getElement(rootElement, MAX_COUNT_ID);
        this.gpuBytesLabel = getElement(rootElement, GPU_BYTES_ID);
        this.arrowBuildTimeLabel = getElement(rootElement, ARROW_BUILD_TIME_ID);
        this.geometryDecodeTimeLabel = getElement(rootElement, GEOMETRY_DECODE_TIME_ID);
        return () => {
          this.rootElement = null;
          this.clearLabels();
        };
      }
    });
  }

  makeSettingsPanel(): Panel {
    return this.settingsPanel.makePanel();
  }

  destroy(): void {
    this.settingsPanel.finalize();
    this.rootElement = null;
    this.clearLabels();
  }

  private clearLabels(): void {
    this.statusLabel = null;
    this.sourceRowsLabel = null;
    this.aggregateRowsLabel = null;
    this.decodedCellsLabel = null;
    this.h3ResolutionLabel = null;
    this.timeBucketsLabel = null;
    this.activeBucketLabel = null;
    this.maxCountLabel = null;
    this.gpuBytesLabel = null;
    this.arrowBuildTimeLabel = null;
    this.geometryDecodeTimeLabel = null;
  }

  setStatus(status: string): void {
    setText(this.statusLabel, status);
  }

  setActiveTimeBucket(activeTimeBucket: string): void {
    setText(this.activeBucketLabel, activeTimeBucket);
  }

  setMetrics(metrics: ArrowColumnRendererFormattedMetrics): void {
    setText(this.sourceRowsLabel, metrics.sourceRows);
    setText(this.aggregateRowsLabel, metrics.aggregateRows);
    setText(this.decodedCellsLabel, metrics.decodedCells);
    setText(this.h3ResolutionLabel, metrics.h3Resolution);
    setText(this.timeBucketsLabel, metrics.timeBuckets);
    setText(this.maxCountLabel, metrics.maxCount);
    setText(this.gpuBytesLabel, metrics.gpuColumnBytes);
    setText(this.arrowBuildTimeLabel, metrics.arrowBuildTime);
    setText(this.geometryDecodeTimeLabel, metrics.geometryDecodeTime);
  }

  private readonly handleSettingsChange = (
    _settings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    const transparencyMode = getChangedSetting(changedSettings, 'transparencyMode')?.nextValue;
    if (isTransparencyMode(transparencyMode)) {
      this.options.onTransparencyModeChange?.(transparencyMode);
    }
  };
}

export function makeArrowColumnRendererSettingsSchema(): SettingsSchema {
  return {
    title: 'Settings',
    sections: [
      {
        id: 'renderer',
        name: 'Renderer',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'transparencyMode',
            label: 'Transparency',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'A-buffer OIT', value: 'a-buffer'},
              {label: 'Weighted blended OIT', value: 'weighted-blended'},
              {label: 'Standard alpha blending', value: 'alpha-blending'}
            ]
          }
        ]
      }
    ]
  };
}

export function makeArrowColumnRendererControlPanelHtml(): string {
  return `\
  <div style="box-sizing: border-box; width: 100%; padding: 14px 16px; border: 1px solid #d0d7de; border-radius: 8px; background: #fff; color: #0f172a; font: 14px/1.4 system-ui, sans-serif;">
    <h3 style="margin: 0 0 10px; color: #0f172a; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;">Arrow H3 Columns</h3>
    ${makeMetricRow('Status', STATUS_ID)}
    ${makeMetricRow('Source CSV rows', SOURCE_ROWS_ID)}
    ${makeMetricRow('Arrow aggregate rows', AGGREGATE_ROWS_ID)}
    ${makeMetricRow('Decoded H3 cells', DECODED_CELLS_ID)}
    ${makeMetricRow('H3 resolution', H3_RESOLUTION_ID)}
    ${makeMetricRow('Temporal buckets', TIME_BUCKETS_ID)}
    ${makeMetricRow('Active bucket', ACTIVE_BUCKET_ID)}
    ${makeMetricRow('Max bucket count', MAX_COUNT_ID)}
    ${makeMetricRow('GPU column bytes', GPU_BYTES_ID)}
    ${makeMetricRow('Fetch + Arrow build', ARROW_BUILD_TIME_ID)}
    ${makeMetricRow('GPU H3 decode', GEOMETRY_DECODE_TIME_ID)}
  </div>
  `;
}

function makeMetricRow(label: string, id: string): string {
  return `<div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;"><span>${label}</span><strong id="${id}" style="font-variant-numeric: tabular-nums; text-align: right;">-</strong></div>`;
}

function setText(element: HTMLElement | null, value: string): void {
  if (element) {
    element.textContent = value;
  }
}

function getElement(rootElement: HTMLElement, id: string): HTMLElement | null {
  return rootElement.querySelector<HTMLElement>(`#${id}`);
}

function isTransparencyMode(value: unknown): value is ArrowColumnTransparencyMode {
  return value === 'a-buffer' || value === 'weighted-blended' || value === 'alpha-blending';
}
