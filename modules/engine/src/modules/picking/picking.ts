// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderModule} from '@luma.gl/shadertools';

import type {PickingBindings, PickingProps, PickingUniforms} from './picking-uniforms';
import {pickingUniforms} from './picking-uniforms';
import {picking as colorPicking} from './color-picking';
import {picking as indexPicking} from './index-picking';

/**
 * Unified object-picking shader module.
 * Uses color picking on GLSL/WebGL paths and index picking on WGSL/WebGPU paths.
 */
export const picking = {
  ...pickingUniforms,
  name: 'picking',
  source: indexPicking.source,
  vs: colorPicking.vs,
  fs: colorPicking.fs
} as const satisfies ShaderModule<PickingProps, PickingUniforms, PickingBindings>;
