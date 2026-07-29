// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {AnimationProps} from '@luma.gl/engine';
import {ArrowDggsPolygonDataSourceController} from './arrow-dggs-polygon-data-source';
export {title, description} from './arrow-dggs-polygon-data-source';

/** Rendering-only entrypoint; data generation and controls live in the data-source controller. */
export default class ArrowDggsPolygonsAnimationLoopTemplate extends ArrowDggsPolygonDataSourceController {
  override onRender(animationProps: AnimationProps): void {
    super.onRender(animationProps);
  }
}
