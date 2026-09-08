// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Model, ShaderInputs} from '@luma.gl/engine';

import {color, fs1, fs2, source1, source2, vs1, vs2, type ColorModuleProps} from './shaders';

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
