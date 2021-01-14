import 'core-js';
import {AnimationLoop, Model} from '@luma.gl/engine';
import {Buffer, clear} from '@luma.gl/webgl';

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

export default class AppAnimationLoop extends AnimationLoop {
  constructor() {
    super({debug: true});
  }

  static getInfo() {
    return INFO_HTML;
  }

  onInitialize({gl}) {
    const positionBuffer = new Buffer(gl, new Float32Array([-0.2, -0.2, 0.2, -0.2, 0.0, 0.2]));

    const colorBuffer = new Buffer(
      gl,
      new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0])
    );

    const offsetBuffer = new Buffer(
      gl,
      new Float32Array([0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5])
    );

    const model = new Model(gl, {
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
        position: positionBuffer,
        color: [colorBuffer, {divisor: 1}],
        offset: [offsetBuffer, {divisor: 1}]
      },
      vertexCount: 3,
      instanceCount: 4,
      instanced: true
    });

    return {model, positionBuffer, colorBuffer, offsetBuffer};
  }

  onRender({gl, model}) {
    clear(gl, {color: [0, 0, 0, 1]});
    model.draw();
  }

  onFinalize({gl, model, positionBuffer, colorBuffer, offsetBuffer}) {
    model.delete();
    positionBuffer.delete();
    colorBuffer.delete();
    offsetBuffer.delete();
  }
}

if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
