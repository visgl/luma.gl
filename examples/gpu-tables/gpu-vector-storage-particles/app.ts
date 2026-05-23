// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {ArrowParticleLayer, makeArrowParticleTable} from './arrow-particle-layer';
import {makeGPUVectorStorageParticlesControlPanelHtml} from './control-panel';

export const title = 'Particles: FixedSizeList<Float32, 2>';
export const description =
  'Arrow table columns uploaded to GPUVectors and updated through storage compute or transform feedback.';

export default class GPUVectorStorageParticlesAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeGPUVectorStorageParticlesControlPanelHtml();

  readonly layer: ArrowParticleLayer;

  constructor({device}: AnimationProps) {
    super();
    this.layer = new ArrowParticleLayer(device as Device, {
      data: makeArrowParticleTable()
    });
  }

  onRender({device, time}: AnimationProps): void {
    this.layer.update(time);

    const renderPass = device.beginRenderPass({
      clearColor: [0.01, 0.02, 0.05, 1]
    });
    this.layer.draw(renderPass);
    renderPass.end();
  }

  onFinalize(): void {
    this.layer.destroy();
  }
}
