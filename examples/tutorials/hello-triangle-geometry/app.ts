// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Model} from '@luma.gl/engine';

export const source = /* wgsl */ `\
struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) fragColor : vec3<f32>
};

@vertex
fn vertexMain(@location(0) position : vec2<f32>, @location(1) color : vec3<f32>) -> VertexOutput {
  var output : VertexOutput;
  output.Position = vec4<f32>(position.x, position.y, 0.0, 1.0);
  output.fragColor = color;
  return output;
}

@fragment
fn fragmentMain(@location(0) fragColor: vec3<f32>) -> @location(0) vec4<f32> {
  return vec4<f32>(fragColor, 1.0);
}
`;

const vs = /* glsl */ `\
#version 300 es

in vec2 position;
in vec3 color;

out vec3 vColor;

void main() {
  vColor = color;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fs = /* glsl */ `\
#version 300 es

in vec3 vColor;
out vec4 fragColor;
void main() {
  fragColor = vec4(vColor, 1.0);
}
`;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `
Have to start somewhere...
`;

  model: Model;
  interleavedBuffer: Buffer;

  constructor({device}: AnimationProps) {
    super();

    // prettier-ignore
    const interleavedData = new Float32Array([
      // Offset
      0, 0,
      // vertex 1: 2D positions XY,  colors RGB
      -0.5, -0.5,  1, 0, 0,
      // vertex 2: 2D positions XY,  colors RGB
      0.5, -0.5,  0, 1, 0,
      // vertex 3: 2D positions XY,  colors RGB
      0.0, 0.5,  0, 0, 1
    ])
    this.interleavedBuffer = device.createBuffer(interleavedData);

    this.model = new Model(device, {
      id: 'triangle',
      source,
      vs,
      fs,
      bufferLayout: [
        {
          name: 'vertexData',
          byteStride: 20,
          attributes: [
            {attribute: 'position', format: 'float32x2', byteOffset: 8 + 0},
            {attribute: 'color', format: 'float32x3', byteOffset: 8 + 8}
          ]
        }
      ],
      attributes: {
        vertexData: this.interleavedBuffer
      },
      vertexCount: 3
    });
  }

  onFinalize() {
    this.model.destroy();
    this.interleavedBuffer.destroy();
  }

  onRender({device}: AnimationProps): void {
    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
    this.model.draw(renderPass);
    renderPass.end();
  }
}
