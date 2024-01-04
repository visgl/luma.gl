import {glsl, Buffer} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Model} from '@luma.gl/engine';
import {BufferTransform} from '@luma.gl/engine';

const INFO_HTML = `
Animation via transform feedback.
`;

const ALT_TEXT = 'THIS DEMO REQUIRES WEBGL 2, BUT YOUR BROWSER DOESN\'T SUPPORT IT';

const transformVs = glsl`\
#version 300 es
#define SIN2 0.03489949
#define COS2 0.99939082

in vec2 position;

out vec2 vPosition;
void main() {
    mat2 rotation = mat2(
        COS2, SIN2,
        -SIN2, COS2
    );
    vPosition = rotation * position;
}
`;

const renderVs = glsl`\
#version 300 es

in vec2 position;
in vec3 color;

out vec3 vColor;
void main() {
    vColor = color;
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const renderFs = glsl`\
#version 300 es
precision highp float;

in vec3 vColor;

out vec4 fragColor;
void main() {
    fragColor = vec4(vColor, 1.0);
}
`;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  transform: BufferTransform;
  model: Model;

  prevPositionBuffer: Buffer;
  nextPositionBuffer: Buffer;
  colorBuffer: Buffer;

  constructor({device}: AnimationProps) {
    super();

    if (!device.features.has('transform-feedback-webgl2')) {
      throw new Error(ALT_TEXT);
    }

    this.prevPositionBuffer = device.createBuffer(new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.0, 0.5]));
    this.nextPositionBuffer = device.createBuffer(new Float32Array(6));
    this.colorBuffer = device.createBuffer(new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]));

    this.transform = new BufferTransform(device, {
      vs: transformVs,
      attributes: {position: this.prevPositionBuffer},
      bufferLayout: [{name: 'position', format: 'float32x2'}],
      feedbackBuffers: {vPosition: this.nextPositionBuffer},
      varyings: ['vPosition'],
      vertexCount: 3
    });

    this.model = new Model(device, {
      vs: renderVs,
      fs: renderFs,
      attributes: {position: this.nextPositionBuffer, color: this.colorBuffer},
      bufferLayout: [
        {name: 'position', format: 'float32x2'},
        {name: 'color', format: 'float32x3'}
      ],
      vertexCount: 3
    });
  }

  onFinalize() {
    this.transform.destroy();
    this.model.destroy();
  }

  onRender({device}) {
    this.transform.run();

    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
    this.model.draw(renderPass);
    renderPass.end();

    this._swap();
  }

  protected _swap() {
    const prevPositionBuffer = this.nextPositionBuffer;
    const nextPositionBuffer = this.prevPositionBuffer;

    this.transform.model.setAttributes({position: prevPositionBuffer});
    this.transform.transformFeedback.setBuffers({vPosition: nextPositionBuffer});
    this.model.setAttributes({position: nextPositionBuffer, color: this.colorBuffer});

    this.nextPositionBuffer = nextPositionBuffer;
    this.prevPositionBuffer = prevPositionBuffer;
  }
}
