// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {
  CURRENT_TIME_RATE_MILLISECONDS_PER_SECOND,
  POINT_SWEEP_MILLISECONDS,
  POINT_TRAIL_LENGTH_MILLISECONDS
} from './arrow-point-generator';
import {ArrowPointRenderer} from './arrow-point-renderer';
import {ArrowPointSource} from './arrow-point-source';
import {makeArrowExamplePanelHostHtml} from '../arrow-example-panels';

export const title = 'Points: XY/XYM/XYZM';
export const description =
  'Arrow FixedSizeList<Float32, 2 | 3 | 4> and DenseUnion point rows rendered as ScatterplotLayer-style circle impostors with temporal M or timestamp animation and picking.';

export default class ArrowPointAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();
  static props = {useDevicePixels: true};
  readonly layer: ArrowPointRenderer;
  readonly source: ArrowPointSource;
  currentTimeMilliseconds = 0;
  lastRenderSeconds: number | null = null;

  constructor({device}: AnimationProps) {
    super();
    this.layer = new ArrowPointRenderer(device as Device, {modelMode: 'attributes'});
    this.source = new ArrowPointSource(
      device as Device,
      update => {
        this.currentTimeMilliseconds = 0;
        this.lastRenderSeconds = null;
        this.layer.setProps(update);
      },
      props => {
        this.layer.setProps(props);
        this.source.setMetrics(this.layer.getMetrics());
      }
    );
  }

  override async onInitialize(): Promise<void> {
    this.source.initialize();
  }

  override onRender({aspect, device, time, _mousePosition}: AnimationProps): void {
    const seconds = time / 1000;
    if (this.lastRenderSeconds === null) this.lastRenderSeconds = seconds;
    const elapsedSeconds = Math.max(seconds - this.lastRenderSeconds, 0);
    this.lastRenderSeconds = seconds;
    if (this.source.animate && this.source.timeKind !== 'none') {
      this.currentTimeMilliseconds =
        (this.currentTimeMilliseconds +
          elapsedSeconds * CURRENT_TIME_RATE_MILLISECONDS_PER_SECOND) %
        POINT_SWEEP_MILLISECONDS;
    }
    this.layer.setProps({
      currentTime: this.currentTimeMilliseconds,
      trailLength: POINT_TRAIL_LENGTH_MILLISECONDS
    });
    const renderPass = device.beginRenderPass({clearColor: [0.012, 0.026, 0.055, 1]});
    this.layer.draw(renderPass, {aspect});
    renderPass.end();
    this.layer.pick(_mousePosition, {
      force: this.source.animate && this.source.timeKind !== 'none'
    });
    this.source.setCurrentTime(this.currentTimeMilliseconds);
  }

  override onFinalize(): void {
    this.source.finalize();
    this.layer.destroy();
  }
}
