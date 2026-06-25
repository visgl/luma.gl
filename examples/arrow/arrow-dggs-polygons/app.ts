// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {AnimationProps} from '@luma.gl/engine';
import {ArrowDggsPolygonSourceController} from './arrow-dggs-polygon-source';
export {title, description} from './arrow-dggs-polygon-source';

/** Rendering-only entrypoint; source generation and controls live in the source controller. */
export default class ArrowDggsPolygonsAnimationLoopTemplate extends ArrowDggsPolygonSourceController {
  override onRender(animationProps: AnimationProps): void {
    super.onRender(animationProps);
  }
}
