// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '@luma.gl/shaders';

/** Common transform path for all retained-scene raster passes. */
export const sceneInstances = {
  name: 'sceneInstances',
  source: `
#ifdef HAS_GPU_TRANSFORMS
@group(0) @binding(auto) var<storage,read> sceneWorldMatrices:array<mat4x4f>;
#endif
`,
  bindingLayout: [{name: 'sceneWorldMatrices', group: 0}]
} as const satisfies ShaderModule;
