import {RenderLoop} from '@luma.gl/engine';
import {Program, VertexArray, Buffer, clear} from '@luma.gl/webgl';
import {assembleShaders} from '@luma.gl/shadertools';

const INFO_HTML = `
Instanced triangles using luma.gl's mid-level API
`;

const colorShaderModule = {
  name: 'color',
  vs: `
    varying vec3 color_vColor;

    void color_setColor(vec3 color) {
      color_vColor = color;
    }
  `,
  fs: `
    varying vec3 color_vColor;

    vec3 color_getColor() {
      return color_vColor;
    }
  `
};

export default class AppRenderLoop extends RenderLoop {
  static info = INFO_HTML;

  program: Program;
  vertexArray: VertexArray;
  positionBuffer: Buffer;
  colorBuffer: Buffer;
  offsetBuffer: Buffer;

  constructor({gl}) {
    super();

    this.positionBuffer = new Buffer(gl, new Float32Array([-0.2, -0.2, 0.2, -0.2, 0.0, 0.2]));

    this.colorBuffer = new Buffer(
      gl,
      new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0])
    );

    this.offsetBuffer = new Buffer(
      gl,
      new Float32Array([0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5])
    );

    const vs = `
      attribute vec2 position;
      attribute vec3 color;
      attribute vec2 offset;

      void main() {
        color_setColor(color);
        gl_Position = vec4(position + offset, 0.0, 1.0);
      }
    `;
    const fs = `
      void main() {
        gl_FragColor = vec4(color_getColor(), 1.0);
      }
    `;

    const assembled = assembleShaders(gl, {
      vs,
      fs,
      modules: [colorShaderModule]
    });

    this.program = new Program(gl, assembled);

    this.vertexArray = new VertexArray(gl, {
      program: this.program,
      attributes: {
        position: positionBuffer,
        color: [colorBuffer, {divisor: 1}],
        offset: [offsetBuffer, {divisor: 1}]
      }
    });
  }

  onFinalize({gl}) {
    this.program.delete();
    this.vertexArray.delete();
    this.positionBuffer.delete();
    this.colorBuffer.delete();
    this.offsetBuffer.delete();
  }

  onRender({gl}) {
    clear(gl, {color: [0, 0, 0, 1]});
    this.program.draw({
      vertexArray: this.vertexArray,
      vertexCount: 3,
      instanceCount: 4
    });
  }

}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  RenderLoop.run(AppRenderLoop);
}
