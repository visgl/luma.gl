// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {ArrowParticleRenderer} from './arrow-particle-renderer';
import {ArrowParticleDataSource} from './arrow-particle-data-source';
import {makeArrowExamplePanelHostHtml} from '../arrow-example-panels';

export const title = 'Particles: FixedSizeList<Float32, 2>';
export const description =
  'Arrow table columns uploaded to GPUVectors and updated through storage compute or transform feedback.';

export default class ArrowParticlesAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();
  readonly layer: ArrowParticleRenderer;
  readonly dataSource: ArrowParticleDataSource;

  constructor({device}: AnimationProps) {
    super();
    this.layer = new ArrowParticleRenderer(device as Device);
    this.dataSource = new ArrowParticleDataSource({
      onDataUpdated: props => this.layer.setProps(props)
    });
  }

  override async onInitialize(): Promise<void> {
    this.dataSource.initialize();
  }

  override onRender({device, time}: AnimationProps): void {
    if (this.layer.update(time)) this.dataSource.restart();
    const renderPass = device.beginRenderPass({clearColor: [0.01, 0.02, 0.05, 1]});
    this.layer.draw(renderPass);
    renderPass.end();
  }

  override onFinalize(): void {
    this.dataSource.finalize();
    this.layer.destroy();
  }
}
