import {Buffer} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Model} from '@luma.gl/engine';

const INFO_HTML = `
Have to start somewhere...
`;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  model: Model;
  interleavedBuffer: Buffer;
  // positionBuffer: Buffer;
  // colorBuffer: Buffer;

  constructor({device}: AnimationProps) {
    super();

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
        
    // 3 corner points [x,y,...]
    // this.positionBuffer = device.createBuffer(new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.0, 0.5]));
    // 3 colors [R,G,B, ...]
    // this.colorBuffer = device.createBuffer(new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]));

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

    this.model = new Model(device, {
      vs,
      fs,
      attributes: {
        vertexData: this.interleavedBuffer,
        // position: this.positionBuffer,
        // color: this.colorBuffer
      },
      bufferLayout: [
        {name: 'vertexData', byteOffset: 8, attributes: [
          {name: 'position', format: 'float32x2'},
          {name: 'color', format: 'float32x3'},
        ]}
      ],
      vertexCount: 3
    });
  }

  onFinalize() {
    this.model.destroy();
    this.interleavedBuffer.destroy();
    // this.positionBuffer.destroy();
    // this.colorBuffer.destroy();
  }

  onRender({device}: AnimationProps): void {
    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
    this.model.draw(renderPass);
    renderPass.end();
  }
}
