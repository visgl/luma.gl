// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import {Buffer, NumberArray, UniformStore} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Model} from '@luma.gl/engine';
import {ShaderAssembler} from '@luma.gl/shadertools';

const INFO_HTML = `
Modifying shader behavior with shader hooks
`;

// Base vertex and fragment shader code
const vs = `\
#version 300 es

  attribute vec2 position;

  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
    OFFSET_POSITION(gl_Position);
  }
`;

const fs = `\
#version 300 es

  uniform AppUniforms {  
    vec3 color;
  } app;

  void main() {
    gl_FragColor = vec4(app.color, 1.0);
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

  model1: Model;
  model2: Model;
  positionBuffer: Buffer;
  uniformBuffer1: Buffer;
  uniformBuffer2: Buffer;

  uniformStore = new UniformStore<{
    app: {
      color: NumberArray;
    };
  }>({
    app: {
      uniformTypes: {
        color: 'vec3<f32>'
      }
    }
  });

  constructor({device}: AnimationProps) {
    super();

    const shaderAssembler = ShaderAssembler.getDefaultShaderAssembler();
    shaderAssembler.addShaderHook('vs:OFFSET_POSITION(inout vec4 position)');

    this.positionBuffer = device.createBuffer(new Float32Array([-0.3, -0.5, 0.3, -0.5, 0.0, 0.5]));

    const byteLength = this.uniformStore.getUniformBufferByteLength('app');
    this.uniformBuffer1 = device.createBuffer({usage: Buffer.UNIFORM, byteLength});
    this.uniformBuffer2 = device.createBuffer({usage: Buffer.UNIFORM, byteLength});

    // Now we can fill the uniform buffers after they are registered with the model
    this.uniformStore.setUniforms({
      app: {
        color: [1, 0, 0]
      }
    });

    let uniformBufferData = this.uniformStore.getUniformBufferData('app');
    this.uniformBuffer1.write(uniformBufferData);

    this.uniformStore.setUniforms({
      app: {
        color: [0, 0, 1]
      }
    });
    uniformBufferData = this.uniformStore.getUniformBufferData('app');
    this.uniformBuffer2.write(uniformBufferData);

    this.model1 = new Model(device, {
      vs,
      fs,
      shaderAssembler, // Not needed, if not specified uses the default ShaderAssembler
      modules: [offsetLeftModule],
      bufferLayout: [
        {name: 'position', format: 'float32x2'},
      ],
      attributes: {
        position: this.positionBuffer
      },
      vertexCount: 3,
      bindings: {
        AppUniforms: this.uniformBuffer1
      }
    });

    this.model2 = new Model(device, {
      vs,
      fs,
      shaderAssembler, // Not needed, if not specified uses the default ShaderAssembler
      modules: [offsetRightModule],
      bufferLayout: [
        {name: 'position', format: 'float32x2'},
      ],
      vertexCount: 3,
      attributes: {
        position: this.positionBuffer
      },
      bindings: {
        AppUniforms: this.uniformBuffer2
      }
    });
  }

  onFinalize() {
    this.model1.destroy();
    this.model2.destroy();
    this.positionBuffer.destroy();
    this.uniformStore.destroy();
    this.uniformBuffer1.destroy();
    this.uniformBuffer2.destroy();
  }

  onRender({device}: AnimationProps) {
    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
    this.model1.draw(renderPass);
    this.model2.draw(renderPass);
    renderPass.end();
  }
}
