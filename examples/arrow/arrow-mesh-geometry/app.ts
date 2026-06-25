// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {AnimationProps} from '@luma.gl/engine';
import {ArrowMeshGeometrySourceController} from './arrow-mesh-geometry-source';
export {title, description} from './arrow-mesh-geometry-source';

/** Rendering-only entrypoint; source generation and controls live in the source controller. */
export default class ArrowMeshGeometryAnimationLoopTemplate extends ArrowMeshGeometrySourceController {
  override onRender(animationProps: AnimationProps): void {
    super.onRender(animationProps);
  }
}
