import 'core-js';
import {Model} from '@luma.gl/engine';
import {Buffer, clear} from '@luma.gl/webgl';
import {instrumentGLContext} from '@luma.gl/gltools';
import {MiniAnimationLoop} from '../../utils';

const INFO_HTML = `
Using an externally created context with luma.gl
`;

export default class AppAnimationLoop extends MiniAnimationLoop {
  static getInfo() {
    return INFO_HTML;
  }

  start(props) {
    const canvas = this._getCanvas(props);
    const gl = instrumentGLContext(
      // @ts-ignore
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    );
    gl.clearColor(0, 0, 0, 1);

    const positionBuffer = new Buffer(gl, new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.0, 0.5]));

    const colorBuffer = new Buffer(
      gl,
      new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0])
    );

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

    const model = new Model(gl, {
      vs,
      fs,
      attributes: {
        position: positionBuffer,
        color: colorBuffer
      },
      vertexCount: 3
    });

    const resources = {
      positionBuffer,
      colorBuffer,
      model
    };

    resources.rafHandle = requestAnimationFrame(function draw() {
      resources.rafHandle = requestAnimationFrame(draw);

      clear(gl, {color: [0, 0, 0, 1]});
      model.draw();
    });

    this.resources = resources;
  }

  stop() {
    cancelAnimationFrame(this.resources.rafHandle);
  }

  delete() {
    const {positionBuffer, colorBuffer, model} = this.resources;
    positionBuffer.delete();
    colorBuffer.delete();
    model.delete();
  }
}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
