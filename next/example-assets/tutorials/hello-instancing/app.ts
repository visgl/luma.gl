// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Model} from '@luma.gl/engine';

const colorShaderModule = {
  name: 'color',
  source: /* wgsl */ `\
// struct ColorVaryings {
//   color: vec3<f32>,
// };

// @vertex
// fn color_setColor(color: vec3f, input: ColorVaryings) -> ColorVaryings {
//   var output = input;
//   output.color = color;
//   return output;
// }

// @fragment
// fn color_getColor(input: ColorVaryings) -> vec4<f32> {
//   return vec4<f32>(input.color, 1.0);
// }
  `,
  vs: /* glsl */ `\
out vec3 color_vColor;

void color_setColor(vec3 color) {
  color_vColor = color;
}
  `,
  fs: /* glsl */ `\
in vec3 color_vColor;

vec3 color_getColor() {
  return color_vColor;
}
  `
};

const source = /* wgsl */ `\
struct VertexInputs {
  @location(0) position: vec2<f32>,
  @location(1) instanceColor: vec3<f32>,
  @location(2) instanceOffset: vec2<f32>,
};  

struct FragmentInputs {
  @builtin(position) Position: vec4<f32>,
  @location(0) color: vec3<f32>,
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs: FragmentInputs;
  outputs.color = inputs.instanceColor;
  outputs.Position = vec4<f32>(inputs.position + inputs.instanceOffset, 0.0, 1.0);
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  return vec4<f32>(inputs.color, 1.0);
}
`;

const vs = /* glsl */ `\
#version 300 es
in vec2 position;
in vec3 instanceColor;
in vec2 instanceOffset;

void main() {
  color_setColor(instanceColor);
  gl_Position = vec4(position + instanceOffset, 0.0, 1.0);
}
`;

const fs = /* glsl */ `\
#version 300 es
out vec4 fragColor;
void main() {
  fragColor = vec4(color_getColor(), 1.0);
}
`;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  model: Model;
  positionBuffer: Buffer;
  colorBuffer: Buffer;
  offsetBuffer: Buffer;

  constructor({device}: AnimationProps) {
    super();

    this.positionBuffer = device.createBuffer(new Float32Array([-0.2, -0.2, 0.2, -0.2, 0.0, 0.2]));
    this.colorBuffer = device.createBuffer(
      new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0])
    );
    this.offsetBuffer = device.createBuffer(
      new Float32Array([0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5])
    );

    this.model = new Model(device, {
      source,
      vs,
      fs,
      modules: [colorShaderModule],
      bufferLayout: [
        {name: 'position', format: 'float32x2'},
        {name: 'instanceColor', format: 'float32x3', stepMode: 'instance'},
        {name: 'instanceOffset', format: 'float32x2', stepMode: 'instance'}
      ],
      attributes: {
        position: this.positionBuffer,
        instanceColor: this.colorBuffer,
        instanceOffset: this.offsetBuffer
      },
      vertexCount: 3,
      instanceCount: 4,
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }
    });
  }

  onFinalize() {
    this.model.destroy();
    this.positionBuffer.destroy();
    this.colorBuffer.destroy();
    this.offsetBuffer.destroy();
  }

  onRender({device}: AnimationProps) {
    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
    this.model.draw(renderPass);
    renderPass.end();
  }
}
