import type {Buffer} from '@luma.gl/api';
import {RenderLoop, AnimationProps, ClassicModel as Model} from '@luma.gl/engine';
import {clear} from '@luma.gl/gltools';

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

export default class AppRenderLoop extends RenderLoop {
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
        attribute vec3 color;
        attribute vec2 offset;

        void main() {
          color_setColor(color);
          gl_Position = vec4(position + offset, 0.0, 1.0);
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
        // @ts-expect-error
        color: [this.colorBuffer, {divisor: 1}],
        // @ts-expect-error
        offset: [this.offsetBuffer, {divisor: 1}]
      },
      vertexCount: 3,
      instanceCount: 4,
      isInstanced: true
    });
  }

  onFinalize() {
    this.model.destroy();
    this.positionBuffer.destroy();
    this.colorBuffer.destroy();
    this.offsetBuffer.destroy();
  }

  onRender({device}: AnimationProps) {
    clear(device, {color: [0, 0, 0, 1]});
    this.model.draw();
  }
}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  RenderLoop.run(AppRenderLoop);
}
