// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {ARROW_MESH_GEOMETRY_CUBE_COUNT, ArrowMeshRenderer} from './arrow-mesh-geometry-renderer';
import {makeArrowMeshGeometryControlPanelHtml} from './control-panel';
import {ArrowExamplePanelManager, makeArrowExamplePanelHostHtml} from '../arrow-example-panels';

export const title = 'Matrices: FixedSizeList<Float32, 16>';
export const description =
  'CubeGeometry face ids routed through Mesh Arrow data and instanced through one Arrow matrix column.';

export default class ArrowMeshGeometryAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();

  readonly layer: ArrowMeshRenderer;
  readonly panels = new ArrowExamplePanelManager({
    descriptionHtml: makeArrowMeshGeometryControlPanelHtml(ARROW_MESH_GEOMETRY_CUBE_COUNT)
  });

  constructor({device}: AnimationProps) {
    super();
    this.layer = new ArrowMeshRenderer(device as Device);
    this.panels.mount();
    this.panels.setTableEntries([
      {
        id: 'mesh-face-metadata',
        label: 'Face metadata',
        kind: 'source',
        table: this.layer.faceMetadataTable
      },
      {
        id: 'mesh-vertex-attributes',
        label: 'Mesh vertex attributes',
        kind: 'source',
        table: this.layer.meshTable
      },
      {
        id: 'mesh-instance-matrices',
        label: 'Current instance matrices',
        kind: 'derived',
        table: this.layer.matrixArrowTable
      }
    ]);
  }

  onRender(animationProps: AnimationProps): void {
    this.layer.draw(animationProps);
  }

  onFinalize(): void {
    this.panels.finalize();
    this.layer.destroy();
  }
}
