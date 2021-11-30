/* eslint-disable no-unused-vars */
import {AnimationLoop, AnimationProps, Model} from '@luma.gl/engine';
import {clear} from '@luma.gl/webgl';

const INFO_HTML = `
Have to start somewhere...
`;

export default class AppAnimationLoop extends AnimationLoop {
  constructor() {
    super({debug: true});
  }

  static getInfo() {
    return INFO_HTML;
  }

  onInitialize({device}: AnimationProps) {
    const positionBuffer = device.createBuffer(new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.0, 0.5]));
    const colorBuffer = device.createBuffer(new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])); // R,G,B

    const vs = `
      attribute vec2 position;
      attribute vec3 color;

      varying vec3 vColor;

      void main() {
        vColor = color;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fs = `
      varying vec3 vColor;

      void main() {
        gl_FragColor = vec4(vColor, 1.0);
      }
    `;

    const model = new Model(device, {
      vs,
      fs,
      attributes: {
        position: positionBuffer,
        color: colorBuffer
      },
      vertexCount: 3
    });

    return {model};
  }

  onRender({device, model}: AnimationProps & {model: Model}): void {
    clear(device, {color: [0, 0, 0, 1]});
    model.draw();
  }

  onFinalize({model}: AnimationProps & {model: Model}) {
    model.destroy();
  }
}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
