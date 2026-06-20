// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderModule} from '../../../lib/shader-module/shader-module';
import type {ShaderPlugin} from '../../../lib/shader-plugin';

export type ClipShaderPluginProps = {
  /** Enables clipping. Defaults to true. */
  enabled?: boolean;
  /** Inclusive lower and exclusive upper bounds. Defaults to [0, 0, 1, 1]. */
  bounds?: readonly [number, number, number, number];
  /** Clips whole instances by their anchor or individual fragments. Defaults to geometry. */
  mode?: 'instance' | 'geometry';
};

type ClipUniforms = {
  enabled: number;
  mode: number;
  bounds: readonly [number, number, number, number];
};

const CLIP_MODE_GEOMETRY = 0;
const CLIP_MODE_INSTANCE = 1;

const clipShaderModule = {
  name: 'clip',
  props: {} as ClipShaderPluginProps,
  uniforms: {} as ClipUniforms,
  bindingLayout: [{name: 'clip', group: 2}],
  uniformTypes: {
    enabled: 'i32',
    mode: 'i32',
    bounds: 'vec4<f32>'
  },
  defaultUniforms: {
    enabled: 1,
    mode: CLIP_MODE_GEOMETRY,
    bounds: [0, 0, 1, 1]
  },
  vs: /* glsl */ `\
layout(std140) uniform clipUniforms {
  highp int enabled;
  highp int mode;
  highp vec4 bounds;
} clipState;

bool clip_isInBounds(vec2 coordinates) {
  return coordinates.x >= clipState.bounds.x &&
    coordinates.y >= clipState.bounds.y &&
    coordinates.x < clipState.bounds.z &&
    coordinates.y < clipState.bounds.w;
}
`,
  fs: /* glsl */ `\
layout(std140) uniform clipUniforms {
  highp int enabled;
  highp int mode;
  highp vec4 bounds;
} clipState;

bool clip_isInBounds(vec2 coordinates) {
  return coordinates.x >= clipState.bounds.x &&
    coordinates.y >= clipState.bounds.y &&
    coordinates.x < clipState.bounds.z &&
    coordinates.y < clipState.bounds.w;
}
`,
  source: /* wgsl */ `\
struct ClipUniforms {
  enabled: i32,
  mode: i32,
  bounds: vec4<f32>,
};

@group(2) @binding(auto) var<uniform> clipUniforms: ClipUniforms;

fn clip_isInBounds(coordinates: vec2<f32>) -> bool {
  return coordinates.x >= clipUniforms.bounds.x &&
    coordinates.y >= clipUniforms.bounds.y &&
    coordinates.x < clipUniforms.bounds.z &&
    coordinates.y < clipUniforms.bounds.w;
}
`,
  getUniforms(props: ClipShaderPluginProps = {}): Partial<ClipUniforms> {
    const uniforms: Partial<ClipUniforms> = {};
    if (props.enabled !== undefined) {
      uniforms.enabled = Number(props.enabled);
    }
    if (props.mode !== undefined) {
      uniforms.mode = props.mode === 'instance' ? CLIP_MODE_INSTANCE : CLIP_MODE_GEOMETRY;
    }
    if (props.bounds !== undefined) {
      uniforms.bounds = props.bounds;
    }
    return uniforms;
  }
} as const satisfies ShaderModule<ClipShaderPluginProps, ClipUniforms, {}>;

/** Coordinate-system-neutral instance and geometry clipping. */
export const clipShaderPlugin: ShaderPlugin = {
  name: 'clip',
  modules: [clipShaderModule],
  varyings: {
    clipCoordinates: {type: 'vec2<f32>', interpolation: 'smooth'}
  },
  glsl: {
    injections: [
      {
        target: 'vs:CLIP_POSITION',
        injection: `\
clipCoordinates = geometryCoordinates;
if (clipState.enabled != 0 && clipState.mode == ${CLIP_MODE_INSTANCE} &&
    !clip_isInBounds(instanceCoordinates)) {
  position = vec4(2.0, 2.0, 2.0, 1.0);
}`
      },
      {
        target: 'fs:CLIP_COLOR',
        injection: `\
if (clipState.enabled != 0 && clipState.mode == ${CLIP_MODE_GEOMETRY} &&
    !clip_isInBounds(clipCoordinates)) {
  discard;
}`
      }
    ]
  },
  wgsl: {
    injections: [
      {
        target: 'vs:CLIP_POSITION',
        injection: `\
clipCoordinates = geometryCoordinates;
if (clipUniforms.enabled != 0 && clipUniforms.mode == ${CLIP_MODE_INSTANCE} &&
    !clip_isInBounds(instanceCoordinates)) {
  *position = vec4<f32>(2.0, 2.0, 2.0, 1.0);
}`
      },
      {
        target: 'fs:CLIP_COLOR',
        injection: `\
if (clipUniforms.enabled != 0 && clipUniforms.mode == ${CLIP_MODE_GEOMETRY} &&
    !clip_isInBounds(clipCoordinates)) {
  discard;
}`
      }
    ]
  }
};
