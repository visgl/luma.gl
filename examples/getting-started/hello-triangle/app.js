import {AnimationLoop, Model} from '@luma.gl/engine';
import {Buffer, clear} from '@luma.gl/webgl';

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

  onInitialize({gl}) {
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

    return {model};
  }

  onRender({gl, model}) {
    clear(gl, {color: [0, 0, 0, 1]});
    model.draw();
  }

  onFinalize({model}) {
    model.delete();
  }
}

if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
