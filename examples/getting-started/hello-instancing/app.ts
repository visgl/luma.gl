import type {Buffer} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Model} from '@luma.gl/engine';

const INFO_HTML = `
Instanced triangles using luma.gl's high-level API
`;

const colorShaderModule = {
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
      vs: `
        attribute vec2 position;
        attribute vec3 instanceColor;
        attribute vec2 instanceOffset;

        void main() {
          color_setColor(instanceColor);
          gl_Position = vec4(position + instanceOffset, 0.0, 1.0);
        }
      `,
      fs: `
        void main() {
          gl_FragColor = vec4(color_getColor(), 1.0);
        }
      `,
      modules: [colorShaderModule],
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
