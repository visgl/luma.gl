// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {AnimationProps} from '@luma.gl/engine';
import {ArrowText2DSourceController} from './arrow-text-source';
export {title, description} from './arrow-text-source';

/** Rendering-only entrypoint; source generation and controls live in the source controller. */
export default class ArrowText2DAnimationLoopTemplate extends ArrowText2DSourceController {
  override onRender(animationProps: AnimationProps): void {
    super.onRender(animationProps);
  }
}
