// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DynamicTexture} from '@luma.gl/core/dynamic';
import type {AnimationProps, ModelNode} from '@luma.gl/engine';
import {AnimationLoopTemplate, CubeGeometry, GroupNode, loadImageBitmap} from '@luma.gl/engine';
import type {LightingProps, PBRProjectionProps} from '@luma.gl/shaders';
import {Matrix4} from '@math.gl/core';
import {createPBRMesh, drawPBRScene} from '../../pbr-scene';
import {LIGHTING_INFO_HTML} from './app-ui';

const camera: PBRProjectionProps['camera'] = [0, 0, 5];
const lighting: LightingProps = {
  useByteColors: false,
  lights: [
    {type: 'ambient', color: [1, 1, 1], intensity: 0.15},
    {
      type: 'spot',
      color: [1, 0.47, 0.04],
      position: [2, 4, 3],
      direction: [-2, -4, -3],
      innerConeAngle: 0.2,
      outerConeAngle: 0.55
    },
    {
      type: 'spot',
      color: [0, 1, 0.04],
      position: [-2, 1, 3],
      direction: [2, -1, -3],
      innerConeAngle: 0.2,
      outerConeAngle: 0.5
    },
    {
      type: 'spot',
      color: [0.31, 0.63, 1],
      position: [-3, -2, 2],
      direction: [3, 2, -2],
      innerConeAngle: 0.2,
      outerConeAngle: 0.6
    },
    {
      type: 'spot',
      color: [1, 0.31, 0.71],
      position: [3, -3, 2],
      direction: [-3, 3, -2],
      innerConeAngle: 0.25,
      outerConeAngle: 0.7
    },
    {type: 'directional', color: [1, 1, 0.86], direction: [1, 0.5, 1]}
  ]
};

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = LIGHTING_INFO_HTML;

  readonly cube: ModelNode;
  readonly scene: GroupNode;
  readonly texture: DynamicTexture;
  readonly viewMatrix = new Matrix4().lookAt({eye: camera});
  readonly viewProjectionMatrix = new Matrix4();

  constructor({device}: AnimationProps) {
    super();
    this.texture = new DynamicTexture(device, {data: loadImageBitmap('vis-logo.png')});
    this.cube = createPBRMesh(
      device,
      new CubeGeometry(),
      {metallicRoughnessValues: [0, 0.35]},
      {baseColorTexture: this.texture}
    );
    this.scene = new GroupNode({children: [this.cube]});
  }

  override onFinalize(): void {
    this.scene.destroy();
    this.texture.destroy();
  }

  override onRender({device, aspect, tick}: AnimationProps): void {
    this.cube.setMatrixComponents({rotation: [tick * 0.01, tick * 0.013, 0]});
    this.viewProjectionMatrix
      .perspective({fovy: Math.PI / 3, aspect})
      .multiplyRight(this.viewMatrix);

    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1], clearDepth: 1});
    drawPBRScene(this.scene, renderPass, this.viewProjectionMatrix, camera, lighting);
    renderPass.end();
  }
}
