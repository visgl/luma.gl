// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {AnimationProps} from '@luma.gl/engine';
import {ArrowLineSourceController} from './arrow-line-source';
export {title, description} from './arrow-line-source';

/** Rendering-only entrypoint; source generation and controls live in the source controller. */
export default class ArrowLineAnimationLoopTemplate extends ArrowLineSourceController {
  override onRender(animationProps: AnimationProps): void {
    super.onRender(animationProps);
  }
}
