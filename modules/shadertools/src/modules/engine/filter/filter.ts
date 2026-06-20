// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderModule} from '../../../lib/shader-module/shader-module';
import type {ShaderPlugin} from '../../../lib/shader-plugin';

export type FilterShaderPluginProps = {
  /** Enables range filtering. Defaults to true. */
  enabled?: boolean;
  /** Inclusive minimum accepted value. Defaults to 0. */
  min?: number;
  /** Inclusive maximum accepted value. Defaults to 1. */
  max?: number;
};

type FilterUniforms = {
  enabled: number;
  min: number;
  max: number;
};

const filterShaderModule = {
  name: 'filter',
  props: {} as FilterShaderPluginProps,
  uniforms: {} as FilterUniforms,
  bindingLayout: [{name: 'filter', group: 2}],
  uniformTypes: {
    enabled: 'i32',
    min: 'f32',
    max: 'f32'
  },
  defaultUniforms: {
    enabled: 1,
    min: 0,
    max: 1
  },
  vs: /* glsl */ `\
layout(std140) uniform filterUniforms {
  int enabled;
  float min;
  float max;
} filterState;

bool filter_isVisible(float value) {
  return filterState.enabled == 0 || (value >= filterState.min && value <= filterState.max);
}
`,
  source: /* wgsl */ `\
struct FilterUniforms {
  enabled: i32,
  min: f32,
  max: f32,
};

@group(2) @binding(auto) var<uniform> filterUniforms: FilterUniforms;

fn filter_isVisible(value: f32) -> bool {
  return filterUniforms.enabled == 0 ||
    (value >= filterUniforms.min && value <= filterUniforms.max);
}
`,
  getUniforms(props: FilterShaderPluginProps = {}): Partial<FilterUniforms> {
    const uniforms: Partial<FilterUniforms> = {};
    if (props.enabled !== undefined) {
      uniforms.enabled = Number(props.enabled);
    }
    if (props.min !== undefined) {
      uniforms.min = props.min;
    }
    if (props.max !== undefined) {
      uniforms.max = props.max;
    }
    return uniforms;
  }
} as const satisfies ShaderModule<FilterShaderPluginProps, FilterUniforms>;

/** Scalar inclusive-range filtering for shaders that expose the `FILTER_POSITION` vertex hook. */
export const filterShaderPlugin: ShaderPlugin = {
  name: 'filter',
  modules: [filterShaderModule],
  vertexInputs: {
    filterValues: 'f32'
  },
  glsl: {
    injections: [
      {
        target: 'vs:FILTER_POSITION',
        injection: `\
if (!filter_isVisible(filterValues)) {
  position = vec4(2.0, 2.0, 2.0, 1.0);
}`
      }
    ]
  },
  wgsl: {
    injections: [
      {
        target: 'vs:FILTER_POSITION',
        injection: `\
if (!filter_isVisible(filterValues)) {
  *position = vec4<f32>(2.0, 2.0, 2.0, 1.0);
}`
      }
    ]
  }
};
