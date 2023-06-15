import {AnimationLoop, AnimationProps, Model} from '@luma.gl/webgl-legacy';
import {Buffer} from '@luma.gl/webgl-legacy';
import {GLContextOptions, instrumentGLContext} from '@luma.gl/webgl-legacy';

const INFO_HTML = `
Using an externally created context with luma.gl
`;

export default class AppAnimationLoop extends AnimationLoop {
  static info = INFO_HTML;

  resources;

  // Supply our own context
  override onCreateContext(props: GLContextOptions): WebGLRenderingContext {
    const canvas = props.canvas as HTMLCanvasElement;
    const gl = canvas.getContext('webgl');
    return instrumentGLContext(gl);
  }

  //
  override onInitialize({gl}: AnimationProps) {
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

  override onRender({device}: AnimationProps) {
    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
    this.resources.model.draw(renderPass);
    renderPass.end();
  }

  onDestroy() {
    const {positionBuffer, colorBuffer, model} = this.resources;
    positionBuffer.destroy();
    colorBuffer.destroy();
    model.destroy();
  }
}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
