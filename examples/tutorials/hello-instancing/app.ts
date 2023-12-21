import {Buffer, NumberArray} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Model} from '@luma.gl/engine';
import {ShaderModule} from '@luma.gl/shadertools/index';

const INFO_HTML = `
Instanced triangles using luma.gl's high-level API
`;

type ColorModuleProps = {};

const color: ShaderModule<ColorModuleProps> = {
  name: 'color',
  vs: `
    varying vec3 color_vColor;

    void color_setColor(vec3 color) {
      color_vColor = color;
    }
  `,
  fs: `
    varying vec3 color_vColor;

    vec3 color_getColor() {
      return color_vColor;
    }
  `
};

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  model: Model;
  positionBuffer: Buffer;
  colorBuffer: Buffer;
  offsetBuffer: Buffer;

  constructor({device}: AnimationProps) {
    super();

    this.positionBuffer = device.createBuffer(new Float32Array([-0.2, -0.2, 0.2, -0.2, 0.0, 0.2]));
    this.colorBuffer = device.createBuffer(new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0]));
    this.offsetBuffer = device.createBuffer(new Float32Array([0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5]));

    this.model = new Model(device, {
      vs: `\
#version 300 es
      in vec2 position;
        in vec3 instanceColor;
        in vec2 instanceOffset;

        void main() {
          color_setColor(instanceColor);
          gl_Position = vec4(position + instanceOffset, 0.0, 1.0);
        }
      `,
      fs: `\
#version 300 es
      precision highp float;

      out vec4 fragColor;
      void main() {
          fragColor = vec4(color_getColor(), 1.0);
        }
      `,
      modules: [color],
      bufferLayout: [
        {name: 'position', format: 'float32x2'},
        {name: 'instanceColor', format: 'float32x3', stepMode: 'instance'},
        {name: 'instanceOffset', format: 'float32x2', stepMode: 'instance'},
      ],
      attributes: {
        position: this.positionBuffer,
        instanceColor: this.colorBuffer,
        instanceOffset:this.offsetBuffer
      },
      vertexCount: 3,
      instanceCount: 4
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
