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
  type CoordinateMagnitudeKind
} from './arrow-float64-precision-data';
import {
  ArrowFloat64PrecisionRenderer,
  type ArrowFloat64PrecisionViewState
} from './arrow-float64-precision-renderer';

export const title = 'Float64 Precision: Survey lines';
export const description =
  'Large-coordinate Arrow path rows compared as explicit Float32 casts and Float64-prepared per-row deltas plus view origins.';

const DEFAULT_COORDINATE_MAGNITUDE_KIND: CoordinateMagnitudeKind = '1b';
const DEFAULT_VIEW_STATE: ArrowFloat64PrecisionViewState = {
  zoom: 1,
  pan: [0, 0]
};

export default class ArrowFloat64PrecisionAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowFloat64PrecisionControlPanelHtml();

  static props = {useDevicePixels: true};

  readonly device: Device;
  readonly controlPanel: ArrowFloat64PrecisionControlPanel;
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
    this.controlPanel.destroy();
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
