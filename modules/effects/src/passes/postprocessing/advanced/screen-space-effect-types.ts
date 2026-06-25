// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';

export type ScreenSpaceNormalSource = 'reconstruct-from-depth' | 'normal-texture';

export type ScreenSpaceEffectOptions = {
  normalSource?: ScreenSpaceNormalSource;
  resolutionScale?: number;
};

export type SceneDepthBindings = {depthTexture?: Texture};
export type SceneNormalBindings = SceneDepthBindings & {normalTexture?: Texture};
export type SceneVelocityBindings = SceneDepthBindings & {velocityTexture?: Texture};
