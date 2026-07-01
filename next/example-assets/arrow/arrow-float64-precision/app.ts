// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {ArrowFloat64PrecisionRenderer} from './arrow-float64-precision-renderer';
import {ArrowFloat64PrecisionSource} from './arrow-float64-precision-source';
import {makeArrowExamplePanelHostHtml} from '../arrow-example-panels';

export const title = 'Float64 Origin Rebasing: Survey lines';
export const description =
  'Large-coordinate Arrow path rows compared as explicit Float32 casts and Float64 origin rebasing with per-row deltas plus view origins.';

export default class ArrowFloat64PrecisionAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();
  static props = {useDevicePixels: true};
  readonly device: Device;
  readonly source: ArrowFloat64PrecisionSource;
  renderer: ArrowFloat64PrecisionRenderer | null = null;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
    this.source = new ArrowFloat64PrecisionSource(async sourceData => {
      const renderer = await ArrowFloat64PrecisionRenderer.create(this.device, sourceData);
      const previousRenderer = this.renderer;
      this.renderer = renderer;
      scheduleRendererDestroy(this.device, previousRenderer);
      return renderer;
    });
  }

  override async onInitialize(): Promise<void> {
    await this.source.initialize();
  }

  override onRender({aspect, device}: AnimationProps): void {
    this.renderer?.updateViewState({
      aspect,
      zoom: this.source.viewState.zoom,
      pan: this.source.viewState.pan
    });
    this.renderer?.predraw(device.commandEncoder);
    const renderPass = device.beginRenderPass({clearColor: [0.012, 0.026, 0.055, 1]});
    this.renderer?.draw(renderPass);
    renderPass.end();
  }

  override onFinalize(): void {
    this.source.finalize();
    scheduleRendererDestroy(this.device, this.renderer);
    this.renderer = null;
  }
}

function scheduleRendererDestroy(
  device: Device,
  renderer: ArrowFloat64PrecisionRenderer | null
): void {
  if (!renderer) return;
  const queue = (
    device as Device & {handle?: {queue?: {onSubmittedWorkDone?: () => Promise<void>}}}
  ).handle?.queue;
  if (device.type === 'webgpu' && queue?.onSubmittedWorkDone) {
    void queue.onSubmittedWorkDone().finally(() => renderer.destroy());
  } else if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => renderer.destroy());
  } else {
    setTimeout(() => renderer.destroy(), 0);
  }
}
