// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DggsCellEncoding} from '@luma.gl/arrow';
import {ColumnPanel, type Panel, type SettingsChangeDescriptor, type SettingsSchema} from '@deck.gl-community/panels';
import {ExampleSettingsPanelManager, getChangedSetting, makeHtmlCustomPanel} from '../../example-panels';

const ROW_COUNT_ID = 'arrow-dggs-polygons-row-count';
const KEY_BYTES_ID = 'arrow-dggs-polygons-key-bytes';
const PATH_BYTES_ID = 'arrow-dggs-polygons-path-bytes';
const TRANSIENT_BYTES_ID = 'arrow-dggs-polygons-transient-bytes';
const ACTIVE_COLUMN_ID = 'arrow-dggs-polygons-active-column';

export type DggsSourceKind = 'uint64' | 'utf8';

export type ArrowDggsPolygonsControlPanelState = {
  encoding: DggsCellEncoding;
  sourceKind: DggsSourceKind;
};

export type ArrowDggsPolygonsControlPanelMetrics = {
  activeColumn: string;
  rowCount: string;
  keyBytes: string;
  pathBytes: string;
  transientBytes: string;
};

export type ArrowDggsPolygonsControlPanelHandlers = {
  onEncodingChange: (encoding: DggsCellEncoding) => void;
  onSourceChange: (sourceKind: DggsSourceKind) => void;
};

export type ArrowDggsPolygonsControlPanelOptions = {
  initialState: ArrowDggsPolygonsControlPanelState;
  handlers: ArrowDggsPolygonsControlPanelHandlers;
  onRefresh: () => void;
};

export class ArrowDggsPolygonsControlPanel {
  private readonly handlers: ArrowDggsPolygonsControlPanelHandlers;
  private readonly onRefresh: () => void;
  private readonly settingsPanel: ExampleSettingsPanelManager;
  private state: ArrowDggsPolygonsControlPanelState;
  private metrics: ArrowDggsPolygonsControlPanelMetrics = {
    activeColumn: '-',
    rowCount: '-',
    keyBytes: '-',
    pathBytes: '-',
    transientBytes: '-'
  };
  private rootElement: HTMLElement | null = null;

  constructor({initialState, handlers, onRefresh}: ArrowDggsPolygonsControlPanelOptions) {
    this.state = initialState;
    this.handlers = handlers;
    this.onRefresh = onRefresh;
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'arrow-dggs-polygons-settings',
      schema: makeArrowDggsPolygonsSettingsSchema(),
      settings: initialState,
      onSettingsChange: this.handleSettingsChange
    });
  }

  makePanel(): Panel {
    return new ColumnPanel({
      id: 'arrow-dggs-polygons-controls',
      title: 'Controls',
      panels: [
        this.settingsPanel.makePanel(),
        makeHtmlCustomPanel({
          id: 'arrow-dggs-polygons-metrics',
          title: 'Metrics',
          html: makeArrowDggsPolygonsControlPanelHtml(),
          onRender: rootElement => {
            this.rootElement = rootElement;
            this.renderMetrics();
            return () => {
              if (this.rootElement === rootElement) {
                this.rootElement = null;
              }
            };
          }
        })
      ]
    });
  }

  initialize(): void {}

  destroy(): void {
    this.settingsPanel.finalize();
    this.rootElement = null;
  }

  syncControls(state: Partial<ArrowDggsPolygonsControlPanelState>): void {
    this.state = {...this.state, ...state};
    this.settingsPanel.setSettings(this.state);
    this.onRefresh();
  }

  setMetricValues(metrics: ArrowDggsPolygonsControlPanelMetrics): void {
    this.metrics = metrics;
    this.renderMetrics();
  }

  private readonly handleSettingsChange = (
    settings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    this.state = settings as ArrowDggsPolygonsControlPanelState;
    const encoding = getChangedSetting(changedSettings, 'encoding')?.nextValue;
    if (isDggsCellEncoding(encoding)) {
      this.handlers.onEncodingChange(encoding);
    }
    const sourceKind = getChangedSetting(changedSettings, 'sourceKind')?.nextValue;
    if (isDggsSourceKind(sourceKind)) {
      this.handlers.onSourceChange(sourceKind);
    }
  };

  private renderMetrics(): void {
    setMetricText(this.rootElement, ACTIVE_COLUMN_ID, this.metrics.activeColumn);
    setMetricText(this.rootElement, ROW_COUNT_ID, this.metrics.rowCount);
    setMetricText(this.rootElement, KEY_BYTES_ID, this.metrics.keyBytes);
    setMetricText(this.rootElement, PATH_BYTES_ID, this.metrics.pathBytes);
    setMetricText(this.rootElement, TRANSIENT_BYTES_ID, this.metrics.transientBytes);
  }
}

export function makeArrowDggsPolygonsSettingsSchema(): SettingsSchema {
  return {
    title: 'Settings',
    sections: [
      {
        id: 'source',
        name: 'Source',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'encoding',
            label: 'Column',
            type: 'select',
            persist: 'none',
            options: ['geohash', 'quadkey', 's2', 'a5', 'h3']
          },
          {
            name: 'sourceKind',
            label: 'Source',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Vector<Uint64>', value: 'uint64'},
              {label: 'Vector<Utf8> parsed on GPU', value: 'utf8'}
            ]
          }
        ]
      }
    ]
  };
}

export function makeArrowDggsPolygonsControlPanelHtml(): string {
  return `\
  ${makeMetricRow('Active Arrow column', ACTIVE_COLUMN_ID)}
  ${makeMetricRow('Rows', ROW_COUNT_ID)}
  ${makeMetricRow('Uint64 key bytes', KEY_BYTES_ID)}
  ${makeMetricRow('Generated path bytes', PATH_BYTES_ID)}
  ${makeMetricRow('Transient compute bytes', TRANSIENT_BYTES_ID)}
  `;
}

function makeMetricRow(label: string, id: string): string {
  return `<div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0;"><span>${label}</span><strong id="${id}" style="font-variant-numeric: tabular-nums;">-</strong></div>`;
}

function isDggsCellEncoding(value: unknown): value is DggsCellEncoding {
  return (
    value === 'geohash' || value === 'quadkey' || value === 's2' || value === 'a5' || value === 'h3'
  );
}

function isDggsSourceKind(value: unknown): value is DggsSourceKind {
  return value === 'utf8' || value === 'uint64';
}

function setMetricText(rootElement: HTMLElement | null, id: string, value: string): void {
  const element = rootElement?.querySelector<HTMLElement>(`#${id}`);
  if (element) {
    element.textContent = value;
  }
}
