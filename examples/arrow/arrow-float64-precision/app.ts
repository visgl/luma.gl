// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {
  ArrowFloat64PrecisionControlPanel,
  makeArrowFloat64PrecisionControlPanelHtml
} from './control-panel';
import {
  makeArrowFloat64PrecisionSourceData,
  makeArrowFloat64PrecisionSourceTable,
  type CoordinateMagnitudeKind
} from './arrow-float64-precision-data';
import {
  ArrowFloat64PrecisionRenderer,
  type ArrowFloat64PrecisionViewState
} from './arrow-float64-precision-renderer';
import {ArrowExamplePanelManager, makeArrowExamplePanelHostHtml} from '../arrow-example-panels';

export const title = 'Float64 Origin Rebasing: Survey lines';
export const description =
  'Large-coordinate Arrow path rows compared as explicit Float32 casts and Float64 origin rebasing with per-row deltas plus view origins.';

const DEFAULT_COORDINATE_MAGNITUDE_KIND: CoordinateMagnitudeKind = '1e9';
const DEFAULT_VIEW_STATE: ArrowFloat64PrecisionViewState = {
  zoom: 1,
  pan: [0, 0]
};
const PANE_LABELS_ID = 'arrow-float64-precision-pane-labels';

export default class ArrowFloat64PrecisionAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();

  static props = {useDevicePixels: true};

  readonly device: Device;
  readonly controlPanel: ArrowFloat64PrecisionControlPanel;
  readonly panels = new ArrowExamplePanelManager({
    controlsHtml: makeArrowFloat64PrecisionControlPanelHtml()
  });
  coordinateMagnitudeKind: CoordinateMagnitudeKind = DEFAULT_COORDINATE_MAGNITUDE_KIND;
  viewState: ArrowFloat64PrecisionViewState = {...DEFAULT_VIEW_STATE, pan: [0, 0]};
  renderer: ArrowFloat64PrecisionRenderer | null = null;
  isFinalized = false;
  private rendererGeneration = 0;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
    this.controlPanel = new ArrowFloat64PrecisionControlPanel({
      initialState: this.getControlPanelState(),
      handlers: {
        onCoordinateMagnitudeKindChange: this.handleCoordinateMagnitudeKindChange,
        onZoomChange: this.handleZoomChange,
        onPanChange: this.handlePanChange,
        onResetView: this.handleResetView
      }
    });
  }

  override async onInitialize(): Promise<void> {
    addPaneLabels();
    this.panels.mount();
    this.controlPanel.initialize();
    await this.prepareRenderer(this.coordinateMagnitudeKind);
  }

  override onRender({aspect, device}: AnimationProps): void {
    this.renderer?.updateViewState({
      aspect,
      zoom: this.viewState.zoom,
      pan: this.viewState.pan
    });
    this.renderer?.predraw(device.commandEncoder);

    const renderPass = device.beginRenderPass({
      clearColor: [0.012, 0.026, 0.055, 1]
    });
    this.renderer?.draw(renderPass);
    renderPass.end();
  }

  override onFinalize(): void {
    this.isFinalized = true;
    this.rendererGeneration++;
    removePaneLabels();
    this.controlPanel.destroy();
    this.panels.finalize();
    scheduleRendererDestroy(this.device, this.renderer);
    this.renderer = null;
  }

  private getControlPanelState() {
    return {
      coordinateMagnitudeKind: this.coordinateMagnitudeKind,
      zoom: this.viewState.zoom,
      pan: this.viewState.pan
    };
  }

  private async prepareRenderer(coordinateMagnitudeKind: CoordinateMagnitudeKind): Promise<void> {
    const rendererGeneration = ++this.rendererGeneration;
    this.controlPanel.setLoading(true);
    const sourceData = makeArrowFloat64PrecisionSourceData(coordinateMagnitudeKind);
    this.panels.setTableEntries([
      {
        id: 'float64-source',
        label: 'Survey path source',
        kind: 'source',
        table: makeArrowFloat64PrecisionSourceTable(sourceData),
        status: `${sourceData.coordinateMagnitudeLabel} coordinate magnitude`
      }
    ]);
    const renderer = await ArrowFloat64PrecisionRenderer.create(this.device, sourceData);
    if (this.isFinalized || rendererGeneration !== this.rendererGeneration) {
      scheduleRendererDestroy(this.device, renderer);
      return;
    }
    const previousRenderer = this.renderer;
    this.renderer = renderer;
    scheduleRendererDestroy(this.device, previousRenderer);
    this.coordinateMagnitudeKind = coordinateMagnitudeKind;
    this.viewState = {...DEFAULT_VIEW_STATE, pan: [0, 0]};
    this.controlPanel.syncControls(this.getControlPanelState());
    this.controlPanel.setMetrics(renderer.getMetrics());
    this.controlPanel.setLoading(false);
  }

  private readonly handleCoordinateMagnitudeKindChange = (
    coordinateMagnitudeKind: CoordinateMagnitudeKind
  ): void => {
    if (coordinateMagnitudeKind === this.coordinateMagnitudeKind) {
      return;
    }
    void this.prepareRenderer(coordinateMagnitudeKind);
  };

  private readonly handleZoomChange = (zoom: number): void => {
    this.viewState = {
      ...this.viewState,
      zoom
    };
    this.controlPanel.syncControls(this.getControlPanelState());
  };

  private readonly handlePanChange = (delta: [number, number]): void => {
    this.viewState = {
      ...this.viewState,
      pan: [this.viewState.pan[0] + delta[0], this.viewState.pan[1] + delta[1]]
    };
    this.controlPanel.syncControls(this.getControlPanelState());
  };

  private readonly handleResetView = (): void => {
    this.viewState = {...DEFAULT_VIEW_STATE, pan: [0, 0]};
    this.controlPanel.syncControls(this.getControlPanelState());
  };
}

function scheduleRendererDestroy(
  device: Device,
  renderer: ArrowFloat64PrecisionRenderer | null
): void {
  if (!renderer) {
    return;
  }

  const queue = (
    device as Device & {handle?: {queue?: {onSubmittedWorkDone?: () => Promise<void>}}}
  ).handle?.queue;
  if (device.type === 'webgpu' && queue?.onSubmittedWorkDone) {
    void queue.onSubmittedWorkDone().finally(() => renderer.destroy());
    return;
  }

  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => renderer.destroy());
    return;
  }

  setTimeout(() => renderer.destroy(), 0);
}

function addPaneLabels(): void {
  removePaneLabels();
  const paneLabels = document.createElement('div');
  paneLabels.id = PANE_LABELS_ID;
  paneLabels.style.cssText = [
    'position: absolute',
    'left: 0',
    'right: 0',
    'bottom: 18px',
    'display: grid',
    'grid-template-columns: 1fr 1fr',
    'gap: 18px',
    'padding: 0 34px',
    'box-sizing: border-box',
    'pointer-events: none',
    'color: #d8fbff',
    'font: 600 13px/1.3 system-ui, sans-serif',
    'text-shadow: 0 1px 5px rgba(0, 0, 0, 0.8)'
  ].join('; ');
  paneLabels.innerHTML = `\
    <div style="text-align: center;">Float32 cast<br><span style="font-weight: 500; color: #9ed6e8;">expect snapped or collapsed detail</span></div>
    <div style="text-align: center;">Float64 origin rebasing<br><span style="font-weight: 500; color: #9ed6e8;">local detail preserved</span></div>
  `;
  document.body.appendChild(paneLabels);
}

function removePaneLabels(): void {
  document.getElementById(PANE_LABELS_ID)?.remove();
}
