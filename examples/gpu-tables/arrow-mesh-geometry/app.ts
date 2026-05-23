// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {ARROW_MESH_GEOMETRY_CUBE_COUNT, ArrowMeshGeometryLayer} from './arrow-mesh-geometry-layer';
import {makeArrowMeshGeometryControlPanelHtml} from './control-panel';

export const title = 'Matrices: FixedSizeList<Float32, 16>';
export const description =
  'CubeGeometry face ids routed through Mesh Arrow data and instanced through one Arrow matrix column.';

export default class ArrowMeshGeometryAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowMeshGeometryControlPanelHtml(ARROW_MESH_GEOMETRY_CUBE_COUNT);

  readonly layer: ArrowMeshGeometryLayer;

  constructor({device}: AnimationProps) {
    super();
    this.layer = new ArrowMeshGeometryLayer(device as Device);
  }

  onRender(animationProps: AnimationProps): void {
    this.layer.draw(animationProps);
  }

  onFinalize(): void {
    this.layer.destroy();
  }
}
