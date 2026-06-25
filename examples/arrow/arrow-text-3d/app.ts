// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {AnimationProps} from '@luma.gl/engine';
import {ArrowText3DSourceController} from './arrow-text-3d-source';
export {title, description} from './arrow-text-3d-source';

/** Rendering-only entrypoint; source generation and controls live in the source controller. */
export default class ArrowText3DAnimationLoopTemplate extends ArrowText3DSourceController {
  override onRender(animationProps: AnimationProps): void {
    super.onRender(animationProps);
  }
}
