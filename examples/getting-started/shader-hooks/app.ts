import {Buffer} from '@luma.gl/api';
import {RenderLoop, AnimationProps} from '@luma.gl/engine';
import {clear, ClassicModel as Model, ProgramManager} from '@luma.gl/webgl-legacy';

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

export default class AppRenderLoop extends RenderLoop {
  static info = INFO_HTML;

  positionBuffer: Buffer;
  model1: Model;
  model2: Model;

  constructor({device}: AnimationProps) {
    super();

    const programManager = new ProgramManager(device);
    programManager.addShaderHook('vs:OFFSET_POSITION(inout vec4 position)');

    this.positionBuffer = device.createBuffer(new Float32Array([-0.3, -0.5, 0.3, -0.5, 0.0, 0.5]));

    this.model1 = new Model(device, {
      vs,
      fs,
      programManager,
      modules: [offsetLeftModule],
      attributes: {
        position: this.positionBuffer
      },
      uniforms: {
        color: [1.0, 0.0, 0.0]
      },
      vertexCount: 3
    });

    this.model2 = new Model(device, {
      vs,
      fs,
      programManager,
      modules: [offsetRightModule],
      attributes: {
        position: this.positionBuffer
      },
      uniforms: {
        color: [0.0, 0.0, 1.0]
      },
      vertexCount: 3
    });
  }

  onFinalize() {
    this.model1.destroy();
    this.model2.destroy();
    this.positionBuffer.destroy();
  }

  onRender({device}: AnimationProps) {
    clear(device, {color: [0, 0, 0, 1]});
    this.model1.draw();
    this.model2.draw();
  }
}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  RenderLoop.run(AppRenderLoop).start();
}
