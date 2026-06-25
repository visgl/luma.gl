// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {AnimationProps} from '@luma.gl/engine';
import {ArrowInstancingSourceController} from './arrow-instancing-source';

/** Rendering-only entrypoint; source generation and controls live in the source controller. */
export default class AppAnimationLoopTemplate extends ArrowInstancingSourceController {
  override onRender(animationProps: AnimationProps): void {
    super.onRender(animationProps);
  }
}
