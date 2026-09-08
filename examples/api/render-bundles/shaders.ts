// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const WGSL_SHADER = /* wgsl */ `\
struct FrameUniforms {
  viewMatrix: mat4x4<f32>,
  projectionMatrix: mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> frameUniforms : FrameUniforms;

struct ObjectUniforms {
  modelMatrix: mat4x4<f32>,
  color: vec4<f32>,
};

@group(1) @binding(0) var<uniform> objectUniforms : ObjectUniforms;

struct VertexInputs {
  @location(0) positions : vec4<f32>,
  @location(1) normals : vec3<f32>,
};

struct FragmentInputs {
  @builtin(position) position : vec4<f32>,
  @location(0) normal : vec3<f32>,
  @location(1) color : vec4<f32>,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs: FragmentInputs;
  let worldPosition = objectUniforms.modelMatrix * inputs.positions;
  outputs.position = frameUniforms.projectionMatrix * frameUniforms.viewMatrix * worldPosition;
  outputs.normal = normalize((objectUniforms.modelMatrix * vec4<f32>(inputs.normals, 0.0)).xyz);
  outputs.color = objectUniforms.color;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let lightDirection = normalize(vec3<f32>(0.4, 0.8, 0.3));
  let diffuse = max(dot(normalize(inputs.normal), lightDirection), 0.18);
  return vec4<f32>(inputs.color.rgb * diffuse, inputs.color.a);
}
`;
