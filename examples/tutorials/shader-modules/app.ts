// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NumberArray3} from '@math.gl/types';
import {Buffer} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Model, ShaderInputs} from '@luma.gl/engine';
import {ShaderModule} from '@luma.gl/shadertools';

// Base vertex and fragment shader code pairs

const source1 = /* wgsl */ `\
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) localPosition: vec2<f32>,
};

@vertex
fn vertexMain(@location(0) position: vec2<f32>) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4<f32>(position - vec2<f32>(0.5, 0.0), 0.0, 1.0);
  output.localPosition = position;
  return output;
}

struct ColorUniforms {
  hsv: vec3<f32>,
  phase: f32,
};

@group(0) @binding(auto) var<uniform> color: ColorUniforms;

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  return vec4<f32>(color_applyBands(color.hsv, input.localPosition, color.phase), 1.0);
}
`;

const source2 = /* wgsl */ `\
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) localPosition: vec2<f32>,
};

@vertex
fn vertexMain(@location(0) position: vec2<f32>) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4<f32>(position + vec2<f32>(0.5, 0.0), 0.0, 1.0);
  output.localPosition = position;
  return output;
}

struct ColorUniforms {
  hsv: vec3<f32>,
  phase: f32,
};

@group(0) @binding(auto) var<uniform> color: ColorUniforms;

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  return vec4<f32>(color_applyBands(color.hsv, input.localPosition, color.phase), 1.0);
}
`;

const vs1 = `\
#version 300 es
in vec2 position;
out vec2 localPosition;
void main() {
  gl_Position = vec4(position - vec2(0.5, 0.0), 0.0, 1.0);
  localPosition = position;
}
`;

const fs1 = `\
#version 300 es
precision highp float;

uniform colorUniforms {
  vec3 hsv;
  float phase;
} color;

in vec2 localPosition;
out vec4 fragColor;

void main() {
  fragColor = vec4(color_applyBands(color.hsv, localPosition, color.phase), 1.0);
}
`;

const vs2 = `\
#version 300 es
in vec2 position;
out vec2 localPosition;
void main() {
  gl_Position = vec4(position + vec2(0.5, 0.0), 0.0, 1.0);
  localPosition = position;
}
`;

const fs2 = `\
#version 300 es

precision highp float;

uniform colorUniforms {
  vec3 hsv;
  float phase;
} color;

in vec2 localPosition;
out vec4 fragColor;

void main() {
  fragColor = vec4(color_applyBands(color.hsv, localPosition, color.phase), 1.0);
}
`;

type ColorModuleProps = {
  hsv: NumberArray3;
  phase: number;
};

// We define a small custom shader module that converts HSV to RGB and applies moving bands.
// From http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl
const color: ShaderModule<ColorModuleProps> = {
  name: 'color',
  source: /* wgsl */ `\
fn color_hsv2rgb(hsv: vec3<f32>) -> vec3<f32> {
  let K = vec4<f32>(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  let p = abs(fract(hsv.xxx + K.xyz) * 6.0 - K.www);
  let rgb = hsv.z * mix(K.xxx, clamp(p - K.xxx, vec3<f32>(0.0), vec3<f32>(1.0)), hsv.y);
  return rgb;
}

fn color_applyBands(hsv: vec3<f32>, localPosition: vec2<f32>, phase: f32) -> vec3<f32> {
  let baseColor = color_hsv2rgb(hsv);
  let bandWave = 0.5 + 0.5 * sin(localPosition.x * 20.0 + localPosition.y * 12.0 + phase);
  let bandStrength = smoothstep(0.15, 0.85, bandWave);
  return baseColor * mix(0.35, 1.0, bandStrength) + vec3<f32>(0.08 * bandStrength);
}
`,
  fs: /* glsl */ `\
vec3 color_hsv2rgb(vec3 hsv) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(hsv.xxx + K.xyz) * 6.0 - K.www);
  vec3 rgb = hsv.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), hsv.y);
  return rgb;
}

vec3 color_applyBands(vec3 hsv, vec2 localPosition, float phase) {
  vec3 baseColor = color_hsv2rgb(hsv);
  float bandWave = 0.5 + 0.5 * sin(localPosition.x * 20.0 + localPosition.y * 12.0 + phase);
  float bandStrength = smoothstep(0.15, 0.85, bandWave);
  return baseColor * mix(0.35, 1.0, bandStrength) + vec3(0.08 * bandStrength);
}
  `,
  uniformTypes: {
    hsv: 'vec3<f32>',
    phase: 'f32'
  }
};

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `
Re-using shader code with shader modules
`;

  model1: Model;
  shaderInputs1 = new ShaderInputs<{color: ColorModuleProps}>({color});

  model2: Model;
  shaderInputs2 = new ShaderInputs<{color: ColorModuleProps}>({color});

  positionBuffer: Buffer;

  constructor({device}: AnimationProps) {
    super();

    this.positionBuffer = device.createBuffer(new Float32Array([-0.3, -0.5, 0.3, -0.5, 0.0, 0.5]));

    this.shaderInputs1.setProps({color: {hsv: [0.58, 0.9, 1.0], phase: 0}});
    this.shaderInputs2.setProps({color: {hsv: [0.04, 0.95, 1.0], phase: Math.PI}});

    this.model1 = new Model(device, {
      id: 'model1',
      source: source1,
      vs: vs1,
      fs: fs1,
      shaderInputs: this.shaderInputs1,
      bufferLayout: [{name: 'position', format: 'float32x2'}],
      attributes: {
        position: this.positionBuffer
      },
      vertexCount: 3,
      parameters: {
        // TODO(ibgreen): Remove, hack to ensure WebGPU depth target is used.
        depthWriteEnabled: true,
        depthCompare: 'less'
      }
    });

    this.model2 = new Model(device, {
      id: 'model2',
      source: source2,
      vs: vs2,
      fs: fs2,
      shaderInputs: this.shaderInputs2,
      bufferLayout: [{name: 'position', format: 'float32x2'}],
      attributes: {
        position: this.positionBuffer
      },
      vertexCount: 3,
      parameters: {
        // TODO(ibgreen): Remove, hack to ensure WebGPU depth target is used.
        depthWriteEnabled: true,
        depthCompare: 'less'
      }
    });
  }

  onFinalize() {
    this.model1.destroy();
    this.model2.destroy();
    this.positionBuffer.destroy();
  }

  onRender({device, time}: AnimationProps) {
    const phase = time / 450;
    this.shaderInputs1.setProps({color: {hsv: [0.58, 0.9, 1.0], phase}});
    this.shaderInputs2.setProps({color: {hsv: [0.04, 0.95, 1.0], phase: Math.PI - phase}});

    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
    this.model1.draw(renderPass);
    this.model2.draw(renderPass);
    renderPass.end();
  }
}
