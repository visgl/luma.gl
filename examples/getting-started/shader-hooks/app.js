import {AnimationLoop, Model, ProgramManager} from '@luma.gl/engine';
import {Buffer, clear} from '@luma.gl/webgl';

const INFO_HTML = `
Modifying shader behavior with shader hooks
`;

// Base vertex and fragment shader code
const vs = `
  attribute vec2 position;

  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
    OFFSET_POSITION(gl_Position);
  }
`;

const fs = `
  uniform vec3 color;

  void main() {
    gl_FragColor = vec4(color, 1.0);
  }
`;

const offsetLeftModule = {
  name: 'offsetLeft',
  inject: {
    'vs:OFFSET_POSITION': 'position.x -= 0.5;'
  }
};

const offsetRightModule = {
  name: 'offsetRight',
  inject: {
    'vs:OFFSET_POSITION': 'position.x += 0.5;'
  }
};

export default class AppAnimationLoop extends AnimationLoop {
  constructor() {
    super({debug: true});
  }

  static getInfo() {
    return INFO_HTML;
  }

  onInitialize({gl}) {
    const programManager = new ProgramManager(gl);
    programManager.addShaderHook('vs:OFFSET_POSITION(inout vec4 position)');

    const positionBuffer = new Buffer(gl, new Float32Array([-0.3, -0.5, 0.3, -0.5, 0.0, 0.5]));

    const model1 = new Model(gl, {
      vs,
      fs,
      programManager,
      modules: [offsetLeftModule],
      attributes: {
        position: positionBuffer
      },
      uniforms: {
        color: [1.0, 0.0, 0.0]
      },
      vertexCount: 3
    });

    const model2 = new Model(gl, {
      vs,
      fs,
      programManager,
      modules: [offsetRightModule],
      attributes: {
        position: positionBuffer
      },
      uniforms: {
        color: [0.0, 0.0, 1.0]
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

if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
