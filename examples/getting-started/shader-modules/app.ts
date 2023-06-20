import {Buffer} from '@luma.gl/api';
import {AnimationLoopTemplate, AnimationProps, Model} from '@luma.gl/engine';

const INFO_HTML = `
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
  uniform vec3 hsvColor;
  void main() {
    gl_FragColor = vec4(color_hsv2rgb(hsvColor), 1.0);
  }
`;

const vs2 = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position + vec2(0.5, 0.0), 0.0, 1.0);
  }
`;

const fs2 = `
  uniform vec3 hsvColor;
  void main() {
    gl_FragColor = vec4(color_hsv2rgb(hsvColor) - 0.3, 1.0);
  }
`;

// A module that injects a function into the fragment shader
//  to convert from HSV to RGB colorspace
// From http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl
const colorModule = {
  name: 'color',
  fs: `
    vec3 color_hsv2rgb(vec3 hsv) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(hsv.xxx + K.xyz) * 6.0 - K.www);
      vec3 rgb = hsv.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), hsv.y);
      return rgb;
    }
  `
};

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  model1: Model;
  model2: Model;
  positionBuffer: Buffer;

  constructor({device}: AnimationProps) {
    super();

    this.positionBuffer = device.createBuffer(new Float32Array([-0.3, -0.5, 0.3, -0.5, 0.0, 0.5]));

    this.model1 = new Model(device, {
      vs: vs1,
      fs: fs1,
      modules: [colorModule],
      attributes: {
        position: this.positionBuffer
      },
      uniforms: {
        hsvColor: [0.7, 1.0, 1.0]
      },
      vertexCount: 3
    });

    this.model2 = new Model(device, {
      vs: vs2,
      fs: fs2,
      modules: [colorModule],
      attributes: {
        position: this.positionBuffer
      },
      uniforms: {
        hsvColor: [1.0, 1.0, 1.0]
      },
      vertexCount: 3
    });
  }

  override onFinalize() {
    this.model1.destroy();
    this.model2.destroy();
    this.positionBuffer.destroy();
  }

  override onRender({device}) {
    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
    this.model1.draw(renderPass);
    this.model2.draw(renderPass);
    renderPass.end();
  }
}
