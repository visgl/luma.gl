// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Model, Swap, BufferTransform} from '@luma.gl/engine';

const transformVs = /* glsl */ `\
#version 300 es
#define SIN2 0.03489949
#define COS2 0.99939082

mat2 rotation = mat2(
  COS2, SIN2,
  -SIN2, COS2
);

in vec2 oldPositions;
out vec2 newPositions;

void main() {
  newPositions = rotation * oldPositions;
}
`;

const renderVs = /* glsl */ `\
#version 300 es

in vec2 position;
in vec3 color;
out vec3 vColor;

void main() {
    vColor = color;
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const renderFs = /* glsl */ `\
#version 300 es
precision highp float;

in vec3 vColor;
out vec4 fragColor;

void main() {
    fragColor = vec4(vColor, 1.0);
}
`;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `
Animation via transform feedback.
`;

  transform: BufferTransform;
  model: Model;

  positionBuffers: Swap<Buffer>;
  colorBuffer: Buffer;

  constructor({device, animationLoop}: AnimationProps) {
    super();

    if (device.type !== 'webgl') {
      animationLoop.setError(new Error('This demo is only implemented for WebGL2'));
      return;
    }

    this.positionBuffers = new Swap({
      current: device.createBuffer(new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.0, 0.5])),
      next: device.createBuffer(new Float32Array(6))
    });

    this.colorBuffer = device.createBuffer(
      new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0])
    );

    this.transform = new BufferTransform(device, {
      vs: transformVs,
      bufferLayout: [{name: 'oldPositions', format: 'float32x2'}],
      outputs: ['newPositions'],
      vertexCount: 3
    });

    this.model = new Model(device, {
      vs: renderVs,
      fs: renderFs,
      attributes: {color: this.colorBuffer},
      bufferLayout: [
        {name: 'position', format: 'float32x2'},
        {name: 'color', format: 'float32x3'}
      ],
      vertexCount: 3
    });
  }

  onFinalize() {
    this.transform.destroy();
    this.model.destroy();
    this.positionBuffers.destroy();
    this.colorBuffer.destroy();
  }

  onRender({device}) {
    // Run a rotation step
    this.transform.run({
      inputBuffers: {oldPositions: this.positionBuffers.current},
      outputBuffers: {newPositions: this.positionBuffers.next}
    });
    this.positionBuffers.swap();

    // Render with the latest positions
    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
    this.model.setAttributes({position: this.positionBuffers.current});
    this.model.draw(renderPass);
    renderPass.end();
  }
}
