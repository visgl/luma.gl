// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeGPUTableFromArrowTable} from '@luma.gl/arrow';
import type {Device, RenderPass, ShaderLayout} from '@luma.gl/core';
import type {FilterShaderPluginProps, ShaderModule} from '@luma.gl/shadertools';
import {filterShaderPlugin, ShaderAssembler} from '@luma.gl/shadertools';
import {GPUTableModel, type GPUTable} from '@luma.gl/tables';
import type {ArrowFilteringTable} from './arrow-filtering-data';

const FILTERING_SHADER_LAYOUT = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec2<f32>', stepMode: 'instance'},
    {name: 'colors', location: 1, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'pointSizes', location: 2, type: 'f32', stepMode: 'instance'},
    {name: 'filterValues', location: 3, type: 'f32', stepMode: 'instance'}
  ],
  bindings: []
} as const satisfies ShaderLayout;

const filteringViewport: ShaderModule<{aspect: number}> = {
  name: 'filteringViewport',
  uniformTypes: {aspect: 'f32'},
  defaultUniforms: {aspect: 1},
  bindingLayout: [{name: 'filteringViewport', group: 0}],
  vs: /* glsl */ `\
layout(std140) uniform filteringViewportUniforms {
  float aspect;
} filteringViewport;
`,
  source: /* wgsl */ `\
struct FilteringViewportUniforms {
  aspect: f32,
};
@group(0) @binding(auto) var<uniform> filteringViewport: FilteringViewportUniforms;
`
};

const WGSL_SHADER = /* wgsl */ `\
struct VertexInputs {
  @builtin(vertex_index) vertexIndex: u32,
  @location(0) positions: vec2<f32>,
  @location(1) colors: vec4<f32>,
  @location(2) pointSizes: f32,
};

struct FragmentInputs {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) localPosition: vec2<f32>,
};

fn getQuadCorner(vertexIndex: u32) -> vec2<f32> {
  if (vertexIndex == 0u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 1u) { return vec2<f32>(1.0, -1.0); }
  if (vertexIndex == 2u) { return vec2<f32>(1.0, 1.0); }
  if (vertexIndex == 3u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 4u) { return vec2<f32>(1.0, 1.0); }
  return vec2<f32>(-1.0, 1.0);
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let corner = getQuadCorner(inputs.vertexIndex % 6u);
  let aspect = max(filteringViewport.aspect, 0.2);
  var outputs: FragmentInputs;
  outputs.position = vec4<f32>(
    inputs.positions.x + corner.x * inputs.pointSizes / aspect,
    inputs.positions.y + corner.y * inputs.pointSizes,
    0.0,
    1.0
  );
  FILTER_POSITION(&outputs.position);
  outputs.color = inputs.colors;
  outputs.localPosition = corner;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let radius = length(inputs.localPosition);
  if (radius > 1.0) { discard; }
  return vec4<f32>(inputs.color.rgb, inputs.color.a * (1.0 - smoothstep(0.8, 1.0, radius)));
}
`;

const VS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

in vec2 positions;
in vec4 colors;
in float pointSizes;

out vec4 vColor;
out vec2 vLocalPosition;

vec2 getQuadCorner(int vertexIndex) {
  if (vertexIndex == 0) { return vec2(-1.0, -1.0); }
  if (vertexIndex == 1) { return vec2(1.0, -1.0); }
  if (vertexIndex == 2) { return vec2(1.0, 1.0); }
  if (vertexIndex == 3) { return vec2(-1.0, -1.0); }
  if (vertexIndex == 4) { return vec2(1.0, 1.0); }
  return vec2(-1.0, 1.0);
}

void main() {
  vec2 corner = getQuadCorner(gl_VertexID % 6);
  float aspect = max(filteringViewport.aspect, 0.2);
  gl_Position = vec4(
    positions.x + corner.x * pointSizes / aspect,
    positions.y + corner.y * pointSizes,
    0.0,
    1.0
  );
  FILTER_POSITION(gl_Position);
  vColor = colors;
  vLocalPosition = corner;
}
`;

const FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

in vec4 vColor;
in vec2 vLocalPosition;
out vec4 fragmentColor;

void main() {
  float radius = length(vLocalPosition);
  if (radius > 1.0) { discard; }
  fragmentColor = vec4(vColor.rgb, vColor.a * (1.0 - smoothstep(0.8, 1.0, radius)));
}
`;

export class ArrowFilteringRenderer {
  readonly model: GPUTableModel;
  readonly gpuTable: GPUTable;

  constructor(device: Device, arrowTable: ArrowFilteringTable) {
    const shaderAssembler = new ShaderAssembler();
    shaderAssembler.addShaderHook(
      device.info.shadingLanguage === 'wgsl'
        ? 'vs:FILTER_POSITION(position: ptr<function, vec4<f32>>)'
        : 'vs:FILTER_POSITION(inout vec4 position)'
    );
    this.gpuTable = makeGPUTableFromArrowTable(device, arrowTable, {
      shaderLayout: FILTERING_SHADER_LAYOUT
    });
    this.model = new GPUTableModel(device, {
      id: 'arrow-filtering',
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: FS_GLSL,
      shaderAssembler,
      shaderLayout: FILTERING_SHADER_LAYOUT,
      modules: [filteringViewport] as never,
      plugins: [filterShaderPlugin],
      table: this.gpuTable,
      tableCount: 'instance',
      topology: 'triangle-list',
      vertexCount: 6,
      parameters: {
        depthWriteEnabled: false,
        blend: true,
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha'
      }
    });
  }

  setFilterProps(props: FilterShaderPluginProps): void {
    this.model.shaderInputs.setProps({filter: props});
  }

  draw(renderPass: RenderPass, aspect: number): boolean {
    this.model.shaderInputs.setProps({filteringViewport: {aspect}});
    return this.model.draw(renderPass);
  }

  destroy(): void {
    this.model.destroy();
    this.gpuTable.destroy();
  }
}
