import 'core-js';
import {AnimationLoop, Model} from '@luma.gl/engine';
import {Buffer, clear} from '@luma.gl/webgl';
import {GLContextOptions, instrumentGLContext} from '@luma.gl/gltools';

const INFO_HTML = `
Using an externally created context with luma.gl
`;

export default class AppAnimationLoop extends AnimationLoop {
  static getInfo() {
    return INFO_HTML;
  }

  // Supply our own context
  onCreateContext(props: GLContextOptions): WebGLRenderingContext {
    return instrumentGLContext(
      // @ts-ignore
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    );   
  }

  start(props) {
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

    this.resources = resources;
  }

  onRenderFrame() {
    clear(gl, {color: [0, 0, 0, 1]});
    model.draw();  
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
