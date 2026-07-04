// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  makeArrowFloat64PrecisionSourceData,
  makeArrowFloat64PrecisionSourceTable,
  type CoordinateMagnitudeKind,
  type ArrowFloat64PrecisionSourceData
} from './arrow-float64-precision-data';
import type {
  ArrowFloat64PrecisionRenderer,
  ArrowFloat64PrecisionViewState
} from './arrow-float64-precision-renderer';
import {ArrowFloat64PrecisionControlPanel} from './control-panel';
import {ArrowExamplePanelManager} from '../arrow-example-panels';

const DEFAULT_VIEW_STATE: ArrowFloat64PrecisionViewState = {zoom: 1, pan: [0, 0]};
const PANE_LABELS_ID = 'arrow-float64-precision-pane-labels';

/** Owns float64 source replacement, view controls, and panels. */
export class ArrowFloat64PrecisionDataSource {
  private readonly onDataUpdated: (
    sourceData: ArrowFloat64PrecisionSourceData
  ) => Promise<ArrowFloat64PrecisionRenderer | null>;
  readonly controlPanel: ArrowFloat64PrecisionControlPanel;
  readonly panels: ArrowExamplePanelManager;
  coordinateMagnitudeKind: CoordinateMagnitudeKind = '1e9';
  viewState: ArrowFloat64PrecisionViewState = {...DEFAULT_VIEW_STATE, pan: [0, 0]};
  private requestGeneration = 0;
  private isFinalized = false;

  constructor({
    onDataUpdated
  }: {
    onDataUpdated: (
      sourceData: ArrowFloat64PrecisionSourceData
    ) => Promise<ArrowFloat64PrecisionRenderer | null>;
  }) {
    this.onDataUpdated = onDataUpdated;
    this.controlPanel = new ArrowFloat64PrecisionControlPanel({
      initialState: this.getControlState(),
      handlers: {
        onCoordinateMagnitudeKindChange: kind => void this.prepareSource(kind),
        onZoomChange: zoom => {
          this.viewState = {...this.viewState, zoom};
          this.syncControls();
        },
        onPanChange: delta => {
          this.viewState = {
            ...this.viewState,
            pan: [this.viewState.pan[0] + delta[0], this.viewState.pan[1] + delta[1]]
          };
          this.syncControls();
        },
        onResetView: () => {
          this.viewState = {...DEFAULT_VIEW_STATE, pan: [0, 0]};
          this.syncControls();
        }
      },
      onRefresh: () => this.panels.refresh()
    });
    this.panels = new ArrowExamplePanelManager({
      descriptionPanel: () => this.controlPanel.makeDescriptionPanel(),
      settingsPanel: () => this.controlPanel.makeSettingsPanel()
    });
  }

  async initialize(): Promise<void> {
    addPaneLabels();
    this.panels.mount();
    this.controlPanel.initialize();
    await this.prepareSource(this.coordinateMagnitudeKind);
  }

  finalize(): void {
    this.isFinalized = true;
    this.requestGeneration++;
    removePaneLabels();
    this.controlPanel.destroy();
    this.panels.finalize();
  }

  private getControlState() {
    return {
      coordinateMagnitudeKind: this.coordinateMagnitudeKind,
      zoom: this.viewState.zoom,
      pan: this.viewState.pan
    };
  }

  private syncControls(): void {
    this.controlPanel.syncControls(this.getControlState());
  }

  private async prepareSource(coordinateMagnitudeKind: CoordinateMagnitudeKind): Promise<void> {
    if (coordinateMagnitudeKind === this.coordinateMagnitudeKind && this.requestGeneration > 0)
      return;
    const generation = ++this.requestGeneration;
    this.controlPanel.setLoading(true);
    const sourceData = makeArrowFloat64PrecisionSourceData(coordinateMagnitudeKind);
    this.panels.setTableEntries([
      {
        id: 'float64-source',
        label: 'Survey path source',
        kind: 'source',
        table: makeArrowFloat64PrecisionSourceTable(sourceData)
      }
    ]);
    const renderer = await this.onDataUpdated(sourceData);
    if (this.isFinalized || generation !== this.requestGeneration || !renderer) return;
    this.coordinateMagnitudeKind = coordinateMagnitudeKind;
    this.viewState = {...DEFAULT_VIEW_STATE, pan: [0, 0]};
    this.syncControls();
    this.controlPanel.setMetrics(renderer.getMetrics());
    this.controlPanel.setLoading(false);
  }
}

function addPaneLabels(): void {
  removePaneLabels();
  const labels = document.createElement('div');
  labels.id = PANE_LABELS_ID;
  labels.style.cssText =
    'position: absolute;left: 0;right: 0;bottom: 18px;display: grid;grid-template-columns: 1fr 1fr;gap: 18px;padding: 0 34px;box-sizing: border-box;pointer-events: none;color: #d8fbff;font: 600 13px/1.3 system-ui, sans-serif;text-shadow: 0 1px 5px rgba(0, 0, 0, 0.8)';
  labels.innerHTML =
    '<div style="text-align: center;">Float32 cast<br><span style="font-weight: 500; color: #9ed6e8;">expect snapped or collapsed detail</span></div><div style="text-align: center;">Float64 origin rebasing<br><span style="font-weight: 500; color: #9ed6e8;">local detail preserved</span></div>';
  document.body.appendChild(labels);
}

function removePaneLabels(): void {
  document.getElementById(PANE_LABELS_ID)?.remove();
}
