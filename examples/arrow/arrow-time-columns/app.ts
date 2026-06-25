// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {ArrowTimeColumnsRenderer} from './arrow-time-columns-renderer';
import {ArrowTimeColumnsSource} from './arrow-time-columns-source';
import {makeArrowExamplePanelHostHtml} from '../arrow-example-panels';

export const title = 'Time: Date/Time/Timestamp/Duration';
export const description =
  'Scalar Arrow temporal columns normalized to relative Float32 GPU rows for attribute-backed and storage-backed schedule rendering.';

export default class ArrowTimeColumnsAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();
  readonly layer: ArrowTimeColumnsRenderer;
  readonly source: ArrowTimeColumnsSource;

  constructor({device}: AnimationProps) {
    super();
    this.layer = new ArrowTimeColumnsRenderer(device as Device);
    this.source = new ArrowTimeColumnsSource(
      device as Device,
      async table => this.layer.initialize(table),
      props => this.layer.setProps(props)
    );
  }

  override async onInitialize(): Promise<void> {
    await this.source.initialize();
  }

  override onRender({device, time}: AnimationProps): void {
    const renderPass = device.beginRenderPass({clearColor: [0.025, 0.04, 0.075, 1]});
    this.layer.draw(renderPass, {time});
    renderPass.end();
    this.source.updateLabels(this.layer);
  }

  override onFinalize(): void {
    this.source.finalize();
    this.layer.destroy();
  }
}
