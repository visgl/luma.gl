// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {ArrowTemporalStarfieldRenderer} from './arrow-temporal-starfield-renderer';
import {ArrowTemporalStarfieldDataSource} from './arrow-temporal-starfield-data-source';
import {makeArrowExamplePanelHostHtml} from '../arrow-example-panels';

export const title = 'Time: Blinking Stars';
export const description =
  'Scalar Arrow Timestamp and Duration columns normalized to relative Float32 GPU rows for blinking star instances.';

export default class ArrowTemporalStarfieldAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();
  readonly layer: ArrowTemporalStarfieldRenderer;
  readonly dataSource: ArrowTemporalStarfieldDataSource;

  constructor({device}: AnimationProps) {
    super();
    this.layer = new ArrowTemporalStarfieldRenderer(device as Device);
    this.dataSource = new ArrowTemporalStarfieldDataSource({
      device: device as Device,
      onDataUpdated: props => this.layer.setProps(props),
      onRendererPropsUpdated: props => this.layer.setProps(props)
    });
  }

  override async onInitialize(): Promise<void> {
    this.dataSource.initialize();
  }

  override onRender({device, time}: AnimationProps): void {
    const renderPass = device.beginRenderPass({clearColor: [0.005, 0.008, 0.024, 1]});
    this.layer.draw(renderPass, {time});
    renderPass.end();
    this.dataSource.updateLabels(this.layer);
  }

  override onFinalize(): void {
    this.dataSource.finalize();
    this.layer.destroy();
  }
}
