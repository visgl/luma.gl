// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {AnimationProps} from './animation-props';

/**
 * Minimal class that represents a "componentized" rendering life cycle
 * (resource construction, repeated rendering, resource destruction)
 *
 * @note A motivation for this class compared to the raw animation loop is
 * that it simplifies TypeScript code by allowing resources to be typed unconditionally
 * since they are allocated in the constructor rather than in onInitialized
 *
 * @note Introduced in luma.gl v9
 *
 * @example AnimationLoopTemplate is intended to be subclassed,
 * but the subclass should not be instantiated directly. Instead the subclass
 * (i.e. the constructor of the subclass) should be used
 * as an argument to create an AnimationLoop.
 */
export abstract class AnimationLoopTemplate {
  constructor(animationProps?: AnimationProps) {}
  async onInitialize(animationProps: AnimationProps): Promise<unknown> {
    return null;
  }
  abstract onRender(animationProps: AnimationProps): unknown;
  abstract onFinalize(animationProps: AnimationProps): void;
}
