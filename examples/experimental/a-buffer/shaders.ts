// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const SCENE_WGSL = /* wgsl */ `\
struct SceneUniforms {
  viewProjectionMatrix: mat4x4<f32>,
  opacity: f32,
  sphereSize: f32,
  gridStart: u32,
  gridStride: u32,
};

@group(0) @binding(auto) var<uniform> scene: SceneUniforms;

struct VertexInputs {
  @builtin(instance_index) instanceIndex: u32,
  @location(0) positions: vec3<f32>,
  @location(1) normals: vec3<f32>,
};

struct FragmentInputs {
  @builtin(position) Position: vec4<f32>,
  @location(0) normal: vec3<f32>,
  @location(1) @interpolate(flat) gridIndex: u32,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let gridIndex = scene.gridStart + inputs.instanceIndex * scene.gridStride;
  let row = gridIndex / 3u;
  let column = gridIndex % 3u;
  let offset = vec3<f32>(
    (f32(column) - 1.0) * 9.0,
    (1.0 - f32(row)) * 8.0,
    0.0
  );

  var outputs: FragmentInputs;
  outputs.Position = scene.viewProjectionMatrix * vec4<f32>(inputs.positions * scene.sphereSize + offset, 1.0);
  outputs.normal = inputs.normals;
  outputs.gridIndex = gridIndex;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let colors = array<vec3<f32>, 6>(
    vec3<f32>(0.96, 0.18, 0.24),
    vec3<f32>(0.20, 0.78, 0.36),
    vec3<f32>(0.16, 0.48, 0.98),
    vec3<f32>(0.86, 0.22, 0.92),
    vec3<f32>(1.0, 0.72, 0.12),
    vec3<f32>(0.08, 0.78, 0.88)
  );
  let baseColor = colors[inputs.gridIndex % 6u];
  let lightDirection = normalize(vec3<f32>(0.7, 1.0, -0.4));
  let lighting = 0.36 + 0.64 * (0.5 + 0.5 * dot(normalize(inputs.normal), lightDirection));
  let color = vec4<f32>(baseColor * lighting, scene.opacity);

#if A_BUFFER_ENABLED
  return aBuffer_captureStraightColor(color, inputs.Position);
#else
#if WBOIT_ENABLED
  return wboit_captureStraightColor(color, inputs.Position);
#else
  return color;
#endif
#endif
}
`;

export const SCENE_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

uniform sceneUniforms {
  mat4 viewProjectionMatrix;
  float opacity;
  float sphereSize;
  uint gridStart;
  uint gridStride;
} scene;

in vec3 positions;
in vec3 normals;

out vec3 vNormal;
flat out uint vGridIndex;

void main(void) {
  uint gridIndex = scene.gridStart + uint(gl_InstanceID) * scene.gridStride;
  uint row = gridIndex / 3u;
  uint column = gridIndex % 3u;
  vec3 offset = vec3((float(column) - 1.0) * 9.0, (1.0 - float(row)) * 8.0, 0.0);

  gl_Position = scene.viewProjectionMatrix * vec4(positions * scene.sphereSize + offset, 1.0);
  vNormal = normals;
  vGridIndex = gridIndex;
}
`;

export const SCENE_FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

uniform sceneUniforms {
  mat4 viewProjectionMatrix;
  float opacity;
  float sphereSize;
  uint gridStart;
  uint gridStride;
} scene;

in vec3 vNormal;
flat in uint vGridIndex;

out vec4 fragColor;

void main(void) {
  vec3 colors[6] = vec3[6](
    vec3(0.96, 0.18, 0.24),
    vec3(0.20, 0.78, 0.36),
    vec3(0.16, 0.48, 0.98),
    vec3(0.86, 0.22, 0.92),
    vec3(1.0, 0.72, 0.12),
    vec3(0.08, 0.78, 0.88)
  );
  vec3 baseColor = colors[vGridIndex % 6u];
  vec3 lightDirection = normalize(vec3(0.7, 1.0, -0.4));
  float lighting = 0.36 + 0.64 * (0.5 + 0.5 * dot(normalize(vNormal), lightDirection));
  vec4 color = vec4(baseColor * lighting, scene.opacity);

#if WBOIT_ENABLED
  fragColor = wboit_captureStraightColor(color, gl_FragCoord);
#else
  fragColor = color;
#endif
}
`;
