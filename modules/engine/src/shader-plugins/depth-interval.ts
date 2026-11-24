// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderPlugin} from '@luma.gl/shaders';

/**
 * WebGPU depth-bound filtering for a caller-owned texture matching the render target.
 * Bind `depthIntervalBound` and a `vec4<u32>` uniform named `depthIntervalCompare`.
 * A nonzero first component selects greater; zero selects less-equal.
 * Pass framebuffer pixel coordinates, stored depth, and the host coverage mask.
 * For MSAA, write the result to the fragment's `sample_mask` output.
 */
export function makeDepthIntervalPlugin(sampleCount: number, bindGroup = 1): ShaderPlugin {
  const multisampled = sampleCount > 1;
  const textureType = multisampled ? 'texture_depth_multisampled_2d' : 'texture_depth_2d';
  const sampleLimit = multisampled ? 'textureNumSamples(depthIntervalBound)' : '1u';
  const loadIndex = multisampled ? 'sampleIndex' : '0';

  return {
    name: 'depthInterval',
    module: {
      name: 'depthInterval',
      bindingLayout: [
        {name: 'depthIntervalBound', group: bindGroup, visibility: 2},
        {name: 'depthIntervalCompare', group: bindGroup, visibility: 2}
      ],
      source: /* wgsl */ `
@group(${bindGroup}) @binding(auto) var depthIntervalBound: ${textureType};
@group(${bindGroup}) @binding(auto) var<uniform> depthIntervalCompare: vec4<u32>;

fn filterDepthInterval(pixel: vec2<i32>, depth: f32, coverage: u32) -> u32 {
  let keepGreater = depthIntervalCompare.x != 0u;
  var mask = 0u;
  for (var sampleIndex = 0u; sampleIndex < ${sampleLimit}; sampleIndex++) {
    if ((depth > textureLoad(depthIntervalBound, pixel, ${loadIndex})) == keepGreater) {
      mask |= 1u << sampleIndex;
    }
  }
  return coverage & mask;
}
`
    }
  };
}
