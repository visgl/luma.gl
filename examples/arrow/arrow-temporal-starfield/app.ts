// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {ArrowTemporalStarfieldRenderer} from './arrow-temporal-starfield-renderer';
import {ArrowTemporalStarfieldSource} from './arrow-temporal-starfield-source';
import {makeArrowExamplePanelHostHtml} from '../arrow-example-panels';

export const title = 'Time: Blinking Stars';
export const description =
  'Scalar Arrow Timestamp and Duration columns normalized to relative Float32 GPU rows for blinking star instances.';

export default class ArrowTemporalStarfieldAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();
  readonly layer: ArrowTemporalStarfieldRenderer;
  readonly source: ArrowTemporalStarfieldSource;

  constructor({device}: AnimationProps) {
    super();
    this.layer = new ArrowTemporalStarfieldRenderer(device as Device);
    this.source = new ArrowTemporalStarfieldSource(
      device as Device,
      props => this.layer.setProps(props),
      props => this.layer.setProps(props)
    );
  }

  override async onInitialize(): Promise<void> {
    this.source.initialize();
  }

  override onRender({device, time}: AnimationProps): void {
    const renderPass = device.beginRenderPass({clearColor: [0.005, 0.008, 0.024, 1]});
    this.layer.draw(renderPass, {time});
    renderPass.end();
    this.source.updateLabels(this.layer);
  }

  override onFinalize(): void {
    this.source.finalize();
    this.layer.destroy();
  }
}
