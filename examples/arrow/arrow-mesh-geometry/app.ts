// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {AnimationProps} from '@luma.gl/engine';
import {ArrowMeshGeometryDataSourceController} from './arrow-mesh-geometry-data-source';
export {title, description} from './arrow-mesh-geometry-data-source';

/** Rendering-only entrypoint; data generation and controls live in the data-source controller. */
export default class ArrowMeshGeometryAnimationLoopTemplate extends ArrowMeshGeometryDataSourceController {
  override onRender(animationProps: AnimationProps): void {
    super.onRender(animationProps);
  }
}
