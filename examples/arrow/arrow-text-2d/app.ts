// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {AnimationProps} from '@luma.gl/engine';
import {ArrowText2DDataSourceController} from './arrow-text-data-source';
export {title, description} from './arrow-text-data-source';

/** Rendering-only entrypoint; data generation and controls live in the data-source controller. */
export default class ArrowText2DAnimationLoopTemplate extends ArrowText2DDataSourceController {
  override onRender(animationProps: AnimationProps): void {
    super.onRender(animationProps);
  }
}
