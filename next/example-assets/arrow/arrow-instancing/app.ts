// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {AnimationProps} from '@luma.gl/engine';
import {ArrowInstancingDataSourceController} from './arrow-instancing-data-source';

/** Rendering-only entrypoint; data generation and controls live in the data-source controller. */
export default class AppAnimationLoopTemplate extends ArrowInstancingDataSourceController {
  override onRender(animationProps: AnimationProps): void {
    super.onRender(animationProps);
  }
}
