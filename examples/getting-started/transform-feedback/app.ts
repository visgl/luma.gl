import {RenderLoop, Transform, Model, AnimationProps} from '@luma.gl/engine';
import {Buffer, clear, isWebGL2} from '@luma.gl/webgl';

const INFO_HTML = `
Animation via transform feedback.
`;

const ALT_TEXT = "THIS DEMO REQUIRES WEBGL 2, BUT YOUR BROWSER DOESN'T SUPPORT IT";

const transformVs = `\
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

const renderVs = `\
#version 300 es

in vec2 position;
in vec3 color;

out vec3 vColor;
void main() {
    vColor = color;
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const renderFs = `\
#version 300 es
precision highp float;

in vec3 vColor;

out vec4 fragColor;
void main() {
    fragColor = vec4(vColor, 1.0);
}
`;

export default class AppRenderLoop extends RenderLoop {
  static info = INFO_HTML;

  transform: Transform;
  model: Model;

  constructor({device}: AnimationProps) {
    super();

    if (!Transform.isSupported(device)) {
      throw new Error(ALT_TEXT);
    }

    const positionBuffer = device.createBuffer(new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.0, 0.5]));

    this.transform = new Transform(device, {
      vs: transformVs,
      sourceBuffers: {
        position: positionBuffer
      },
      feedbackMap: {
        position: 'vPosition'
      },
      elementCount: 3
    });

    const colorBuffer = device.createBuffer(new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]));

    this.model = new Model(device, {
      vs: renderVs,
      fs: renderFs,
      attributes: {
        position: this.transform.getBuffer('vPosition'),
        color: colorBuffer
      },
      vertexCount: 3
    });
  }

  onFinalize() {
    this.transform.destroy();
    this.model.destroy();
  }

  onRender({device}) {
    this.transform.run();
    this.model.setAttributes({
      position: this.transform.getBuffer('vPosition')
    });

    clear(device, {color: [0, 0, 0, 1]});
    this.model.draw();

    this.transform.swap();
  }
}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  RenderLoop.run(AppRenderLoop);
}
