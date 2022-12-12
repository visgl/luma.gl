/* eslint-disable no-unused-vars */
import type {Buffer} from '@luma.gl/api';
import {RenderLoop, AnimationProps, Model} from '@luma.gl/engine';
import {clear} from '@luma.gl/webgl-legacy';

const INFO_HTML = `
Have to start somewhere...
`;

export default class AppRenderLoop extends RenderLoop {
  static info = INFO_HTML;

  model: Model;
  positionBuffer: Buffer;
  colorBuffer: Buffer;

  constructor({device}: AnimationProps) {
    super();

    // 3 corner points [x,y,...]
    this.positionBuffer = device.createBuffer(new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.0, 0.5]));
     // 3 colors [R,G,B, ...]
    this.colorBuffer = device.createBuffer(new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]));

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

    this.model = new Model(device, {
      vs,
      fs,
      attributes: {
        position: this.positionBuffer,
        color: this.colorBuffer
      },
      vertexCount: 3
    });
  }

  onFinalize() {
    this.model.destroy();
    this.positionBuffer.destroy();
    this.colorBuffer.destroy();
  }

  onRender({device}: AnimationProps): void {
    clear(device, {color: [0, 0, 0, 1]});
    this.model.draw();
  }
}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  RenderLoop.run(AppRenderLoop).start();
}
