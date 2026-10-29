// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '@luma.gl/shaders';

/** Borrowed rigid transforms, published by a GPU producer before rendering. */
export const publishedTransforms = {
  name: 'publishedTransforms',
  uniformTypes: {bodyIndex: 'i32', viewProjection: 'mat4x4<f32>'},
  defaultUniforms: {bodyIndex: -1},
  source: `
struct PublishedTransforms {bodyIndex:i32,viewProjection:mat4x4f}
@group(0) @binding(auto) var<uniform> publishedTransforms:PublishedTransforms;
@group(0) @binding(auto) var<storage,read> publishedBodyMatrices:array<mat4x4f>;
`,
  bindingLayout: [{name: 'publishedBodyMatrices', group: 0}]
} as const satisfies ShaderModule;
