// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  ColumnPanel,
  type Panel,
  type SettingsChangeDescriptor,
  type SettingsSchema
} from '@deck.gl-community/panels';
import {
  ExampleSettingsPanelManager,
  getChangedSetting,
  makeHtmlCustomPanel
} from '../../example-panels';
import {COORDINATE_MAGNITUDES, type CoordinateMagnitudeKind} from './arrow-float64-precision-data';
import type {
  ArrowFloat64PrecisionMetrics,
  ArrowFloat64PrecisionViewState
} from './arrow-float64-precision-renderer';

const ZOOM_LABEL_ID = 'arrow-float64-precision-zoom-label';
const PAN_LEFT_ID = 'arrow-float64-precision-pan-left';
const PAN_RIGHT_ID = 'arrow-float64-precision-pan-right';
const PAN_UP_ID = 'arrow-float64-precision-pan-up';
const PAN_DOWN_ID = 'arrow-float64-precision-pan-down';
const RESET_VIEW_ID = 'arrow-float64-precision-reset';
const PATH_COUNT_ID = 'arrow-float64-precision-path-count';
const SEGMENT_COUNT_ID = 'arrow-float64-precision-segment-count';
const FLOAT64_ARROW_BYTES_ID = 'arrow-float64-precision-float64-arrow-bytes';
const FLOAT32_ARROW_BYTES_ID = 'arrow-float64-precision-float32-arrow-bytes';
const STYLE_ARROW_BYTES_ID = 'arrow-float64-precision-style-arrow-bytes';
const FLOAT64_GPU_BYTES_ID = 'arrow-float64-precision-float64-gpu-bytes';
const FLOAT32_GPU_BYTES_ID = 'arrow-float64-precision-float32-gpu-bytes';
const FLOAT64_PREP_TIME_ID = 'arrow-float64-precision-float64-prep-time';
const FLOAT32_PREP_TIME_ID = 'arrow-float64-precision-float32-prep-time';
const FLOAT32_ERROR_ID = 'arrow-float64-precision-float32-error';
const PAN_LABEL_ID = 'arrow-float64-precision-pan-label';
const LOADING_ID = 'arrow-float64-precision-loading';

export type ArrowFloat64PrecisionControlPanelProps = {
  initialState: ArrowFloat64PrecisionControlPanelState;
  handlers: {
    onCoordinateMagnitudeKindChange: (kind: CoordinateMagnitudeKind) => void;
    onZoomChange: (zoom: number) => void;
    onPanChange: (delta: [number, number]) => void;
    onResetView: () => void;
  };
  onRefresh: () => void;
};

export type ArrowFloat64PrecisionControlPanelState = ArrowFloat64PrecisionViewState & {
  coordinateMagnitudeKind: CoordinateMagnitudeKind;
};

export class ArrowFloat64PrecisionControlPanel {
  private readonly handlers: ArrowFloat64PrecisionControlPanelProps['handlers'];
  private readonly onRefresh: () => void;
  private readonly settingsPanel: ExampleSettingsPanelManager;
  private state: ArrowFloat64PrecisionControlPanelState;
  private metrics: ArrowFloat64PrecisionMetrics | null = null;
  private isLoading = false;
  private rootElement: HTMLElement | null = null;

  constructor({initialState, handlers, onRefresh}: ArrowFloat64PrecisionControlPanelProps) {
    this.state = initialState;
    this.handlers = handlers;
    this.onRefresh = onRefresh;
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'arrow-float64-precision-settings',
      schema: makeArrowFloat64PrecisionSettingsSchema(),
      settings: getSettingsState(initialState),
      onSettingsChange: this.handleSettingsChange
    });
  }

  makePanel(): Panel {
    return new ColumnPanel({
      id: 'arrow-float64-precision-controls',
      title: 'Controls',
      panels: [
        this.settingsPanel.makePanel(),
        makeHtmlCustomPanel({
          id: 'arrow-float64-precision-status',
          title: 'Status',
          html: makeArrowFloat64PrecisionControlPanelHtml(),
          onRender: rootElement => {
            this.rootElement = rootElement;
            this.bindButtonHandlers(rootElement);
            this.render();
            return () => {
              this.unbindButtonHandlers(rootElement);
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

  syncControls(state: ArrowFloat64PrecisionControlPanelState): void {
    this.state = state;
    this.settingsPanel.setSettings(getSettingsState(state));
    this.render();
    this.onRefresh();
  }

  setLoading(isLoading: boolean): void {
    this.isLoading = isLoading;
    this.renderLoading();
  }

  setMetrics(metrics: ArrowFloat64PrecisionMetrics): void {
    this.metrics = metrics;
    this.renderMetrics();
  }

  private readonly handleSettingsChange = (
    settings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    const coordinateMagnitudeKind = getChangedSetting(
      changedSettings,
      'coordinateMagnitudeKind'
    )?.nextValue;
    if (isCoordinateMagnitudeKind(coordinateMagnitudeKind)) {
      this.handlers.onCoordinateMagnitudeKindChange(coordinateMagnitudeKind);
    }
    const zoom = getChangedSetting(changedSettings, 'zoom')?.nextValue;
    if (typeof zoom === 'number') {
      this.handlers.onZoomChange(zoom);
    }
    this.state = {...this.state, ...settings} as ArrowFloat64PrecisionControlPanelState;
  };

  private render(): void {
    setLabel(this.rootElement, ZOOM_LABEL_ID, `${this.state.zoom.toFixed(1)}x`);
    setLabel(
      this.rootElement,
      PAN_LABEL_ID,
      `${formatNumber(this.state.pan[0])}, ${formatNumber(this.state.pan[1])}`
    );
    this.renderLoading();
    this.renderMetrics();
  }

  private renderLoading(): void {
    setLabel(this.rootElement, LOADING_ID, this.isLoading ? 'Preparing Arrow paths...' : '');
  }

  private renderMetrics(): void {
    if (!this.metrics) {
      return;
    }
    const metricsById: Record<string, string> = {
      [PATH_COUNT_ID]: formatInteger(this.metrics.pathCount),
      [SEGMENT_COUNT_ID]: formatInteger(this.metrics.segmentCount),
      [FLOAT64_ARROW_BYTES_ID]: formatByteLength(this.metrics.float64SourceArrowByteLength),
      [FLOAT32_ARROW_BYTES_ID]: formatByteLength(this.metrics.float32SourceArrowByteLength),
      [STYLE_ARROW_BYTES_ID]: formatByteLength(this.metrics.styleArrowByteLength),
      [FLOAT64_GPU_BYTES_ID]: formatByteLength(this.metrics.float64PreparedGpuByteLength),
      [FLOAT32_GPU_BYTES_ID]: formatByteLength(this.metrics.float32PreparedGpuByteLength),
      [FLOAT64_PREP_TIME_ID]: `${this.metrics.float64PreparationTimeMs.toFixed(1)}ms`,
      [FLOAT32_PREP_TIME_ID]: `${this.metrics.float32PreparationTimeMs.toFixed(1)}ms`,
      [FLOAT32_ERROR_ID]: `${formatMetric(this.metrics.maxFloat32LocalError)} world units`
    };
    for (const [id, value] of Object.entries(metricsById)) {
      setLabel(this.rootElement, id, value);
    }
  }

  private bindButtonHandlers(rootElement: HTMLElement): void {
    setButtonHandler(rootElement, PAN_LEFT_ID, () => this.handlers.onPanChange([-42, 0]));
    setButtonHandler(rootElement, PAN_RIGHT_ID, () => this.handlers.onPanChange([42, 0]));
    setButtonHandler(rootElement, PAN_UP_ID, () => this.handlers.onPanChange([0, 42]));
    setButtonHandler(rootElement, PAN_DOWN_ID, () => this.handlers.onPanChange([0, -42]));
    setButtonHandler(rootElement, RESET_VIEW_ID, () => this.handlers.onResetView());
  }

  private unbindButtonHandlers(rootElement: HTMLElement): void {
    for (const id of [PAN_LEFT_ID, PAN_RIGHT_ID, PAN_UP_ID, PAN_DOWN_ID, RESET_VIEW_ID]) {
      const button = rootElement.querySelector<HTMLButtonElement>(`#${id}`);
      if (button) {
        button.onclick = null;
      }
    }
  }
}

export function makeArrowFloat64PrecisionSettingsSchema(): SettingsSchema {
  return {
    title: 'Settings',
    sections: [
      {
        id: 'view',
        name: 'View',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'coordinateMagnitudeKind',
            label: 'Magnitude',
            type: 'select',
            persist: 'none',
            options: Object.entries(COORDINATE_MAGNITUDES).map(([kind, option]) => ({
              label: option.label,
              value: kind
            }))
          },
          {
            name: 'zoom',
            label: 'Zoom',
            type: 'number',
            persist: 'none',
            min: 0.65,
            max: 3.5,
            step: 0.05
          }
        ]
      }
    ]
  };
}

export function makeArrowFloat64PrecisionControlPanelHtml(): string {
  return `\
  <div style="display: flex; gap: 4px; align-items: center; flex-wrap: wrap;">
    <span style="font-weight: 700;">Pan</span>
    ${makeButton(PAN_LEFT_ID, 'Left')}
    ${makeButton(PAN_RIGHT_ID, 'Right')}
    ${makeButton(PAN_UP_ID, 'Up')}
    ${makeButton(PAN_DOWN_ID, 'Down')}
    ${makeButton(RESET_VIEW_ID, 'Reset')}
  </div>
  <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 8px; color: #64748b; font-size: 11px;">
    <span>Zoom <span id="${ZOOM_LABEL_ID}">1.0x</span></span>
    <span>Pan <span id="${PAN_LABEL_ID}">0, 0</span></span>
    <span id="${LOADING_ID}" style="color: #1d4ed8; font-weight: 700;"></span>
  </div>
  <details style="margin-top: 8px; border-top: 1px solid #cbd5e1; padding-top: 8px;">
    <summary style="cursor: pointer; font-weight: 700;">Metrics: F32 error <strong id="${FLOAT32_ERROR_ID}">-</strong>, F64 prep <strong id="${FLOAT64_PREP_TIME_ID}">-</strong></summary>
    <div style="display: grid; grid-template-columns: 1fr auto; gap: 3px 10px; margin-top: 6px;">
      ${makeMetricRow('Paths', PATH_COUNT_ID)}
      ${makeMetricRow('Segments', SEGMENT_COUNT_ID)}
      ${makeMetricRow('F64 Arrow', FLOAT64_ARROW_BYTES_ID)}
      ${makeMetricRow('F32 Arrow', FLOAT32_ARROW_BYTES_ID)}
      ${makeMetricRow('Style', STYLE_ARROW_BYTES_ID)}
      ${makeMetricRow('F64 GPU', FLOAT64_GPU_BYTES_ID)}
      ${makeMetricRow('F32 GPU', FLOAT32_GPU_BYTES_ID)}
      ${makeMetricRow('F32 prep', FLOAT32_PREP_TIME_ID)}
    </div>
  </details>
  `;
}

function getSettingsState(
  state: ArrowFloat64PrecisionControlPanelState
): Pick<ArrowFloat64PrecisionControlPanelState, 'coordinateMagnitudeKind' | 'zoom'> {
  return {
    coordinateMagnitudeKind: state.coordinateMagnitudeKind,
    zoom: state.zoom
  };
}

function makeMetricRow(label: string, id: string): string {
  return `<span>${label}</span><strong id="${id}">-</strong>`;
}

function makeButton(id: string, label: string): string {
  return `<button id="${id}" type="button" style="border: 1px solid #cbd5e1; border-radius: 7px; background: #f8fafc; color: #0f172a; padding: 3px 6px; font: inherit; cursor: pointer;">${label}</button>`;
}

function setButtonHandler(rootElement: HTMLElement, id: string, handler: () => void): void {
  const button = rootElement.querySelector<HTMLButtonElement>(`#${id}`);
  if (button) {
    button.onclick = handler;
  }
}

function setLabel(rootElement: HTMLElement | null, id: string, value: string): void {
  const element = rootElement?.querySelector<HTMLElement>(`#${id}`);
  if (element) {
    element.textContent = value;
  }
}

function isCoordinateMagnitudeKind(value: unknown): value is CoordinateMagnitudeKind {
  return (
    value === '1e7' ||
    value === '1e8' ||
    value === '1e9' ||
    value === '1e10' ||
    value === '1e16' ||
    value === '1e17' ||
    value === '1e18'
  );
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {maximumFractionDigits: 0}).format(value);
}

function formatMetric(value: number): string {
  return new Intl.NumberFormat('en-US', {maximumSignificantDigits: 3}).format(value);
}

function formatByteLength(byteLength: number): string {
  if (byteLength < 1000) {
    return `${formatInteger(byteLength)} B`;
  }
  if (byteLength < 1000 ** 2) {
    return `${formatMetric(byteLength / 1000)} kB`;
  }
  return `${formatMetric(byteLength / 1000 ** 2)} MB`;
}
