// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {AnimationProps} from '@luma.gl/engine';
import {ArrowText3DDataSourceController} from './arrow-text-3d-data-source';
export {title, description} from './arrow-text-3d-data-source';

/** Rendering-only entrypoint; data generation and controls live in the data-source controller. */
export default class ArrowText3DAnimationLoopTemplate extends ArrowText3DDataSourceController {
  override onRender(animationProps: AnimationProps): void {
    super.onRender(animationProps);
  }
}
