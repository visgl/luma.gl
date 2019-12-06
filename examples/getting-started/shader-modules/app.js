import {AnimationLoop, Model} from '@luma.gl/engine';
import {Buffer, clear} from '@luma.gl/webgl';

const INFO_HTML = `
<p>
Shader Modules
<p>
Re-using shader code with shader modules
`;

// Base vertex and fragment shader code pairs
const vs1 = `
  attribute vec2 position;

  void main() {
    gl_Position = vec4(position - vec2(0.5, 0.0), 0.0, 1.0);
  }
`;

const fs1 = `
  void main() {
    gl_FragColor = color_getColor();
  }
`;

const vs2 = `
  attribute vec2 position;

  void main() {
    gl_Position = vec4(position + vec2(0.5, 0.0), 0.0, 1.0);
  }
`;

const fs2 = `
  void main() {
    gl_FragColor = color_getColor() - 0.3;
  }
`;

// A module that injects a function into
// the vertex shader
const colorModule = {
  name: 'color',
  fs: `
    vec4 color_getColor() {
      return vec4(1.0, 0.0, 0.0, 1.0);
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
    const positionBuffer = new Buffer(gl, new Float32Array([-0.3, -0.5, 0.3, -0.5, 0.0, 0.5]));

    const model1 = new Model(gl, {
      vs: vs1,
      fs: fs1,
      modules: [colorModule],
      attributes: {
        position: positionBuffer
      },
      vertexCount: 3
    });

    const model2 = new Model(gl, {
      vs: vs2,
      fs: fs2,
      modules: [colorModule],
      attributes: {
        position: positionBuffer
      },
      vertexCount: 3
    });

    return {model1, model2, positionBuffer};
  }

  onRender({gl, model1, model2}) {
    clear(gl, {color: [0, 0, 0, 1]});
    model1.draw();
    model2.draw();
  }

  onFinalize({model1, model2, positionBuffer}) {
    model1.delete();
    model2.delete();
    positionBuffer.delete();
  }
}

/* global window */
if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
