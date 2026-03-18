// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray, VariableShaderType} from '@luma.gl/core';
import {UniformStore} from '@luma.gl/core';
import {AnimationLoopTemplate, Model, CubeGeometry} from '@luma.gl/engine';
import type {AnimationProps} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';

const WGSL_SHADER = /* WGSL */ `\
struct Uniforms {
  modelViewProjectionMatrix : mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> app : Uniforms;

struct VertexInputs {
  @location(0) positions : vec4<f32>
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) vPosition : vec3<f32>,
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  outputs.Position = app.modelViewProjectionMatrix * inputs.positions;
  outputs.vPosition = inputs.positions.xyz;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  return vec4(0.5 * inputs.vPosition + vec3(0.5), 1.0);
}
`;

const VS_GLSL = /* glsl */ `\
#version 300 es
#define SHADER_NAME cube-vs

uniform appUniforms {
  mat4 modelViewProjectionMatrix;
} app;

layout(location=0) in vec3 positions;

out vec3 vPosition;

void main() {
  gl_Position = app.modelViewProjectionMatrix * vec4(positions, 1.0);
  vPosition = positions;
}
`;

const FS_GLSL = /* glsl */ `\
#version 300 es
#define SHADER_NAME cube-fs
precision highp float;

uniform appUniforms {
  mat4 modelViewProjectionMatrix;
} app;

in vec3 vPosition;

layout (location=0) out vec4 fragColor;

void main() {
  fragColor = vec4(0.5 * vPosition + vec3(0.5), 1.0);
}
`;

type AppUniforms = {
  mvpMatrix: NumberArray;
};

const app: {uniformTypes: Record<keyof AppUniforms, VariableShaderType>} = {
  uniformTypes: {
    mvpMatrix: 'mat4x4<f32>'
  }
};

const eyePosition = [0, 0, -4];

export class CubeAnimationLoopTemplate extends AnimationLoopTemplate {
  mvpMatrix = new Matrix4();
  viewMatrix = new Matrix4().lookAt({eye: eyePosition});
  model: Model;

  uniformStore = new UniformStore<{app: AppUniforms}>({app});

  constructor({device}: AnimationProps) {
    super();

    this.model = new Model(device, {
      id: 'rotating-cube',
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: FS_GLSL,
      geometry: new CubeGeometry({indices: false}),
      bindings: {
        app: this.uniformStore.getManagedUniformBuffer(device, 'app')
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }
    });
  }

  onFinalize() {
    this.model.destroy();
    this.uniformStore.destroy();
  }

  onRender({device, aspect, tick}: AnimationProps) {
    this.mvpMatrix
      .perspective({fovy: Math.PI / 3, aspect})
      .multiplyRight(this.viewMatrix)
      .rotateX(tick * 0.01)
      .rotateY(tick * 0.013);

    this.uniformStore.setUniforms({
      app: {mvpMatrix: this.mvpMatrix}
    });

    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1], clearDepth: 1});
    this.model.draw(renderPass);
    renderPass.end();
  }
}
