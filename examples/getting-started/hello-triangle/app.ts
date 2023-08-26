import {Buffer} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Model} from '@luma.gl/engine';

const INFO_HTML = `
Have to start somewhere...
`;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  model: Model;
  interleavedBuffer: Buffer;

  constructor({device}: AnimationProps) {
    super();

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

    // prettier-ignore
    const interleavedData = new Float32Array([
      // Offset
      0, 0,
      // vertex 1: 2D positions XY,  colors RGB
      -0.5, -0.5,  1, 0, 0,
      // vertex 2: 2D positions XY,  colors RGB
      0.5, -0.5,  0, 1, 0,
      // vertex 3: 2D positions XY,  colors RGB
      0.0, 0.5,  0, 0, 1
    ])
    this.interleavedBuffer = device.createBuffer(interleavedData);
        
    this.model = new Model(device, {
      vs,
      fs,
      bufferLayout: [
        {name: 'vertexData', byteStride: 20, attributes: [
          {attribute: 'position', format: 'float32x2', byteOffset: 0},
          {attribute: 'color', format: 'float32x3', byteOffset: 8},
        ]}
      ],
      attributes: {
        vertexData: this.interleavedBuffer,
      },
      vertexCount: 3
    });
  }

  onFinalize() {
    this.model.destroy();
    this.interleavedBuffer.destroy();
  }

  onRender({device}: AnimationProps): void {
    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
    this.model.draw(renderPass);
    renderPass.end();
  }
}
