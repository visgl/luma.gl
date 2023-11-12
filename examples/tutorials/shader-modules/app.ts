// luma.gl, MIT license
import {Buffer, NumberArray, UniformStore} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Model} from '@luma.gl/engine';
import {ShaderModule} from '@luma.gl/shadertools';

const INFO_HTML = `
Re-using shader code with shader modules
`;

// Base vertex and fragment shader code pairs
const vs1 = `\
#version 300 es
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position - vec2(0.5, 0.0), 0.0, 1.0);
  }
`;

const fs1 = `\
#version 300 es
  precision highp float;

  uniform colorUniforms {
    vec3 hsv;
  } color;

  void main() {
    gl_FragColor = vec4(color_hsv2rgb(color.hsv), 1.0);
  }
`;

const vs2 = `\
#version 300 es
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position + vec2(0.5, 0.0), 0.0, 1.0);
  }
`;

const fs2 = `\
#version 300 es

  precision highp float;
  
  uniform colorUniforms {
    vec3 hsv;
  } color;

  void main() {
    gl_FragColor = vec4(color_hsv2rgb(color.hsv) - 0.3, 1.0);
  }
`;

type ColorModuleProps = {
  hsv: NumberArray;
};

// We define a small customer shader module that injects a function into the fragment shader
//  to convert from HSV to RGB colorspace
// From http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl
const colorModule: ShaderModule<ColorModuleProps> = {
  name: 'color',
  fs: `
    vec3 color_hsv2rgb(vec3 hsv) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(hsv.xxx + K.xyz) * 6.0 - K.www);
      vec3 rgb = hsv.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), hsv.y);
      return rgb;
    }
  `,
  uniformTypes: {
    hsv: 'vec3<f32>'
  }
};

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  model1: Model;
  model2: Model;
  positionBuffer: Buffer;

  uniformStore = new UniformStore<{color: ColorModuleProps}>({
    color: colorModule
  });

  uniformBuffer1: Buffer;
  uniformBuffer2: Buffer;

  constructor({device}: AnimationProps) {
    super();

    this.positionBuffer = device.createBuffer(new Float32Array([-0.3, -0.5, 0.3, -0.5, 0.0, 0.5]));

    this.uniformBuffer1 = this.uniformStore.createUniformBuffer(device, 'color', {color: {hsv: [0.7, 1.0, 1.0]}});
    this.uniformBuffer2 = this.uniformStore.createUniformBuffer(device, 'color', {color: {hsv: [1.0, 1.0, 1.0]}});

    this.model1 = new Model(device, {
      vs: vs1,
      fs: fs1,
      modules: [colorModule],
      bufferLayout: [{name: 'position', format: 'float32x2'}],
      attributes: {
        position: this.positionBuffer
      },
      bindings: {
        color: this.uniformBuffer1
      },
      vertexCount: 3
    });

    this.model2 = new Model(device, {
      vs: vs2,
      fs: fs2,
      modules: [colorModule],
      bufferLayout: [{name: 'position', format: 'float32x2'}],
      attributes: {
        position: this.positionBuffer
      },
      bindings: {
        color: this.uniformBuffer2
      },
      vertexCount: 3
    });
  }

  onFinalize() {
    this.model1.destroy();
    this.model2.destroy();
    this.positionBuffer.delete();
    this.uniformStore.destroy();
    this.uniformBuffer1.destroy();
    this.uniformBuffer2.destroy();
  }

  onRender({device}) {
    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
    this.model1.draw(renderPass);
    this.model2.draw(renderPass);
    renderPass.end();
  }
}
