// luma.gl, MIT license

import {Buffer} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Model} from '@luma.gl/engine';
import {ShaderAssembler} from '@luma.gl/shadertools';

const INFO_HTML = `
Modifying shader behavior with shader hooks
`;

// Base vertex and fragment shader code
const vs = `
  attribute vec2 position;

  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
    OFFSET_POSITION(gl_Position);
  }
`;

const fs = `
  uniform vec3 color;

  void main() {
    gl_FragColor = vec4(color, 1.0);
  }
`;

const offsetLeftModule = {
  name: 'offsetLeft',
  inject: {
    'vs:OFFSET_POSITION': 'position.x -= 0.5;'
  }
};

const offsetRightModule = {
  name: 'offsetRight',
  inject: {
    'vs:OFFSET_POSITION': 'position.x += 0.5;'
  }
};

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  positionBuffer: Buffer;
  model1: Model;
  model2: Model;

  constructor({device}: AnimationProps) {
    super();

    const shaderAssembler = ShaderAssembler.getDefaultShaderAssembler();
    shaderAssembler.addShaderHook('vs:OFFSET_POSITION(inout vec4 position)');

    this.positionBuffer = device.createBuffer(new Float32Array([-0.3, -0.5, 0.3, -0.5, 0.0, 0.5]));

    this.model1 = new Model(device, {
      vs,
      fs,
      shaderAssembler, // Not needed, if not specified uses the default ShaderAssembler
      modules: [offsetLeftModule],
      bufferLayout: [
        {name: 'position', format: 'float32x2'},
      ],
      vertexCount: 3,
      attributes: {
        position: this.positionBuffer
      },
      uniforms: {
        color: [1.0, 0.0, 0.0]
      }
    });

    this.model2 = new Model(device, {
      vs,
      fs,
      shaderAssembler, // Not needed, if not specified uses the default ShaderAssembler
      vertexCount: 3,
      modules: [offsetRightModule],
      bufferLayout: [
        {name: 'position', format: 'float32x2'},
      ],
      attributes: {
        position: this.positionBuffer
      },
      uniforms: {
        color: [0.0, 0.0, 1.0]
      }
    });
  }

  override onFinalize() {
    this.model1.destroy();
    this.model2.destroy();
    this.positionBuffer.destroy();
  }

  override onRender({device}: AnimationProps) {
    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
    this.model1.draw(renderPass);
    this.model2.draw(renderPass);
    renderPass.end();
  }
}
