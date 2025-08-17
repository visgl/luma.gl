// luma.gl
// SPDX-License-Identifier: MIT
// Copyright...

import {
  Model,
  type ModelProps,
  AsyncTexture,
  CubeGeometry,
  ShaderInputs,
} from '@luma.gl/engine';
import type {Device, Texture} from '@luma.gl/core';
import {ShaderModule} from '@luma.gl/shadertools';
import {NumberArray16} from '@math.gl/types';

type AppUniforms = {
  modelMatrix: NumberArray16;     // mat4x4<f32>
  viewMatrix: NumberArray16;      // mat4x4<f32>
  projectionMatrix: NumberArray16;// mat4x4<f32>
};

// Small helper module so you can set MVP once via ShaderInputs
const app: ShaderModule<AppUniforms, AppUniforms> = {
  name: 'app',
  uniformTypes: {
    modelMatrix: 'mat4x4<f32>',
    viewMatrix: 'mat4x4<f32>',
    projectionMatrix: 'mat4x4<f32>'
  }
};

export type CubemapCubeProps = Omit<ModelProps, 'vs' | 'fs' | 'source' | 'geometry' | 'bindings'> & {
  /** A cube-map texture (dimension: 'cube'). Provide either a Texture or Dynamic/AsyncTexture. */
  cubeTexture: Texture | AsyncTexture;
  /** Optional: pass your own ShaderInputs; otherwise one is created. */
  shaderInputs?: ShaderInputs<{app: typeof app.props}>;
};

/**
 * Renders a cube where each face is textured from the corresponding face
 * of the provided cube map (+X, -X, +Y, -Y, +Z, -Z).
 */
export class CubemapCube extends Model {
  static wgsl = /* wgsl */ `
struct appUniforms {
  modelMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  projectionMatrix: mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> app : appUniforms;
@group(0) @binding(1) var cubeTexture : texture_cube<f32>;
@group(0) @binding(2) var cubeTextureSampler : sampler;

struct VSIn {
  @location(0) positions : vec3<f32>,
};

struct VSOut {
  @builtin(position) position : vec4<f32>,
  @location(0) objPos : vec3<f32>,
};

@vertex
fn vertexMain(in: VSIn) -> VSOut {
  var out : VSOut;
  out.position = app.projectionMatrix * app.viewMatrix * app.modelMatrix * vec4<f32>(in.positions, 1.0);
  // Keep object-space position so the mapping stays glued to the cube faces.
  out.objPos = in.positions;
  return out;
}

@fragment
fn fragmentMain(in: VSOut) -> @location(0) vec4<f32> {
  let dir = normalize(in.objPos);
  return textureSample(cubeTexture, cubeTextureSampler, dir);
}
`;

  // Optional GLSL ES 3.00 path (WebGL2) for dual-backend projects
  static vsGLSL = /* glsl */ `#version 300 es
in vec3 positions;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

out vec3 vObjPos;

void main() {
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(positions, 1.0);
  vObjPos = positions;
}
`;

  static fsGLSL = /* glsl */ `#version 300 es
precision highp float;
in vec3 vObjPos;
out vec4 fragColor;
uniform samplerCube cubeTexture;

void main() {
  fragColor = texture(cubeTexture, normalize(vObjPos));
}
`;

  constructor(device: Device, props: CubemapCubeProps) {
    const {cubeTexture, shaderInputs, ...rest} = props;

    const inputs = shaderInputs; //  ?? new ShaderInputs<{app: typeof app.props}>({app});

    super(device, {
      id: 'cubemap-cube',
      geometry: new CubeGeometry({indices: true}),
      // WGSL (WebGPU)
      source: CubemapCube.wgsl,
      // GLSL (WebGL2) — keep if you target both backends; otherwise you can drop vs/fs
      vs: CubemapCube.vsGLSL,
      fs: CubemapCube.fsGLSL,
      shaderInputs: inputs,
      // Auto-wires `cubeTexture` to WGSL `cubeTexture` & `cubeTextureSampler`
      bindings: {cubeTexture},
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      },
      ...rest
    });
  }
}
