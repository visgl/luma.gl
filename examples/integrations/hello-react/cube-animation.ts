// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {AnimationLoopTemplate, CubeGeometry, GroupNode} from '@luma.gl/engine';
import type {AnimationProps} from '@luma.gl/engine';
import type {LightingProps, PBRProjectionProps} from '@luma.gl/shaders';
import {Matrix4} from '@math.gl/core';
import {createPBRMesh, drawPBRScene} from '../../pbr-scene';

const camera: PBRProjectionProps['camera'] = [0, 0, -4];
const lighting: LightingProps = {
  useByteColors: false,
  lights: [
    {type: 'ambient', color: [1, 1, 1], intensity: 0.25},
    {type: 'directional', color: [1, 0.9, 0.8], direction: [-1, -1, 2], intensity: 2}
  ]
};

export class CubeAnimationLoopTemplate extends AnimationLoopTemplate {
  readonly scene: GroupNode;
  readonly viewMatrix = new Matrix4().lookAt({eye: camera});
  readonly viewProjectionMatrix = new Matrix4();

  constructor({device}: AnimationProps) {
    super();
    const cube = createPBRMesh(device, new CubeGeometry(), {
      baseColorFactor: [0.12, 0.42, 0.85, 1],
      metallicRoughnessValues: [0.15, 0.35]
    });
    this.scene = new GroupNode({children: [cube]});
  }

  override onFinalize(): void {
    this.scene.destroy();
  }

  override onRender({device, aspect, tick}: AnimationProps): void {
    this.scene.setMatrixComponents({rotation: [tick * 0.01, tick * 0.013, 0]});
    this.viewProjectionMatrix
      .perspective({fovy: Math.PI / 3, aspect})
      .multiplyRight(this.viewMatrix);

    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1], clearDepth: 1});
    drawPBRScene(this.scene, renderPass, this.viewProjectionMatrix, camera, lighting);
    renderPass.end();
  }
}
