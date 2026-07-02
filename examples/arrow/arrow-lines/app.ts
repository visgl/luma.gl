// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {AnimationProps} from '@luma.gl/engine';
import {ArrowLineDataSourceController} from './arrow-line-data-source';
export {title, description} from './arrow-line-data-source';

/** Rendering-only entrypoint; data generation and controls live in the data-source controller. */
export default class ArrowLineAnimationLoopTemplate extends ArrowLineDataSourceController {
  override onRender(animationProps: AnimationProps): void {
    super.onRender(animationProps);
  }
}
