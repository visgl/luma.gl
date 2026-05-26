// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DggsCellEncoding} from '@luma.gl/arrow';

const ENCODING_SELECTOR_ID = 'arrow-dggs-polygons-encoding';
const SOURCE_SELECTOR_ID = 'arrow-dggs-polygons-source';
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
};

export class ArrowDggsPolygonsControlPanel {
  private readonly handlers: ArrowDggsPolygonsControlPanelHandlers;
  private state: ArrowDggsPolygonsControlPanelState;
  private encodingSelector: HTMLSelectElement | null = null;
  private sourceSelector: HTMLSelectElement | null = null;
  private rowCountLabel: HTMLElement | null = null;
  private keyBytesLabel: HTMLElement | null = null;
  private pathBytesLabel: HTMLElement | null = null;
  private transientBytesLabel: HTMLElement | null = null;
  private activeColumnLabel: HTMLElement | null = null;

  constructor({initialState, handlers}: ArrowDggsPolygonsControlPanelOptions) {
    this.state = initialState;
    this.handlers = handlers;
  }

  initialize(): void {
    if (!this.encodingSelector) {
      this.encodingSelector = document.getElementById(
        ENCODING_SELECTOR_ID
      ) as HTMLSelectElement | null;
      this.encodingSelector?.addEventListener('change', this.handleEncodingSelection);
    }
    if (!this.sourceSelector) {
      this.sourceSelector = document.getElementById(SOURCE_SELECTOR_ID) as HTMLSelectElement | null;
      this.sourceSelector?.addEventListener('change', this.handleSourceSelection);
    }

    this.rowCountLabel ??= document.getElementById(ROW_COUNT_ID);
    this.keyBytesLabel ??= document.getElementById(KEY_BYTES_ID);
    this.pathBytesLabel ??= document.getElementById(PATH_BYTES_ID);
    this.transientBytesLabel ??= document.getElementById(TRANSIENT_BYTES_ID);
    this.activeColumnLabel ??= document.getElementById(ACTIVE_COLUMN_ID);
    this.syncControls(this.state);
  }

  destroy(): void {
    this.encodingSelector?.removeEventListener('change', this.handleEncodingSelection);
    this.sourceSelector?.removeEventListener('change', this.handleSourceSelection);
    this.encodingSelector = null;
    this.sourceSelector = null;
    this.rowCountLabel = null;
    this.keyBytesLabel = null;
    this.pathBytesLabel = null;
    this.transientBytesLabel = null;
    this.activeColumnLabel = null;
  }

  syncControls(state: Partial<ArrowDggsPolygonsControlPanelState>): void {
    this.state = {...this.state, ...state};
    if (this.encodingSelector) {
      this.encodingSelector.value = this.state.encoding;
    }
    if (this.sourceSelector) {
      this.sourceSelector.value = this.state.sourceKind;
    }
  }

  setMetricValues(metrics: ArrowDggsPolygonsControlPanelMetrics): void {
    setMetricText(this.activeColumnLabel, metrics.activeColumn);
    setMetricText(this.rowCountLabel, metrics.rowCount);
    setMetricText(this.keyBytesLabel, metrics.keyBytes);
    setMetricText(this.pathBytesLabel, metrics.pathBytes);
    setMetricText(this.transientBytesLabel, metrics.transientBytes);
  }

  private readonly handleEncodingSelection = (): void => {
    const encoding = parseDggsCellEncoding(this.encodingSelector?.value);
    if (encoding) {
      this.handlers.onEncodingChange(encoding);
    }
  };

  private readonly handleSourceSelection = (): void => {
    const sourceKind = parseDggsSourceKind(this.sourceSelector?.value);
    if (sourceKind) {
      this.handlers.onSourceChange(sourceKind);
    }
  };
}

export function makeArrowDggsPolygonsControlPanelHtml(): string {
  return `\
  <div style="min-width: 280px; max-width: 420px; padding: 14px 16px; border: 1px solid rgba(208, 215, 222, 0.9); border-radius: 10px; background: rgba(255, 255, 255, 0.96); color: #0f172a; font: 14px/1.4 system-ui, sans-serif;">
    <div style="display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 10px 12px; align-items: center;">
      <label for="${ENCODING_SELECTOR_ID}" style="font-weight: 700;">Column</label>
      <select id="${ENCODING_SELECTOR_ID}" style="min-height: 32px; border: 1px solid #94a3b8; border-radius: 6px; background: white;">
        <option value="geohash">geohash</option>
        <option value="quadkey">quadkey</option>
        <option value="s2">s2</option>
        <option value="a5">a5</option>
        <option value="h3">h3</option>
      </select>
      <label for="${SOURCE_SELECTOR_ID}" style="font-weight: 700;">Source</label>
      <select id="${SOURCE_SELECTOR_ID}" style="min-height: 32px; border: 1px solid #94a3b8; border-radius: 6px; background: white;">
        <option value="uint64">Vector&lt;Uint64&gt;</option>
        <option value="utf8">Vector&lt;Utf8&gt; parsed on GPU</option>
      </select>
    </div>
    ${makeMetricRow('Active Arrow column', ACTIVE_COLUMN_ID)}
    ${makeMetricRow('Rows', ROW_COUNT_ID)}
    ${makeMetricRow('Uint64 key bytes', KEY_BYTES_ID)}
    ${makeMetricRow('Generated path bytes', PATH_BYTES_ID)}
    ${makeMetricRow('Transient compute bytes', TRANSIENT_BYTES_ID)}
  </div>
  `;
}

function makeMetricRow(label: string, id: string): string {
  return `<div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0;"><span>${label}</span><strong id="${id}" style="font-variant-numeric: tabular-nums;">-</strong></div>`;
}

function parseDggsCellEncoding(value: string | undefined): DggsCellEncoding | null {
  if (
    value === 'geohash' ||
    value === 'quadkey' ||
    value === 's2' ||
    value === 'a5' ||
    value === 'h3'
  ) {
    return value;
  }
  return null;
}

function parseDggsSourceKind(value: string | undefined): DggsSourceKind | null {
  return value === 'utf8' || value === 'uint64' ? value : null;
}

function setMetricText(element: HTMLElement | null, value: string): void {
  if (element) {
    element.textContent = value;
  }
}
