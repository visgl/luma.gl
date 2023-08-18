import {DeviceProps} from '@luma.gl/core';
import {polyfillContext} from '@luma.gl/webgl';
import {ClassicAnimationLoop, ClassicAnimationProps} from '@luma.gl/core';

const INFO_HTML = `
Instanced triangles using luma.gl's low-level API
`;

const ALT_TEXT = 'THIS DEMO REQUIRES WEBGL (NON-EXPERIMENTAL) BUT YOUR BROWSER DOESN\'T SUPPORT IT';

export default class AppAnimationLoop extends ClassicAnimationLoop {
  static info = INFO_HTML;

  override onCreateContext(props: DeviceProps): WebGLRenderingContext {
    const canvas = props.canvas as HTMLCanvasElement;
    const gl = canvas.getContext('webgl');
    if (!gl) {
      throw new Error(ALT_TEXT);
    }
    return polyfillContext(gl);
  }

  override onInitialize({gl}: ClassicAnimationProps): void {
    gl.clearColor(0, 0, 0, 1);

    const vs = `
      attribute vec2 position;
      attribute vec3 color;
      attribute vec2 offset;

      varying vec3 vColor;

      void main() {
        vColor = color;
        gl_Position = vec4(position + offset, 0.0, 1.0);
      }
    `;
    const fs = `
      precision highp float;

      varying vec3 vColor;

      void main() {
        gl_FragColor = vec4(vColor, 1.0);
      }
    `;

    const vShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vShader, vs);
    gl.compileShader(vShader);

    const fShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fShader, fs);
    gl.compileShader(fShader);

    const program = gl.createProgram();
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);

    // @ts-expect-error WebGL2
    const vertexArray = gl.createVertexArray();
    // @ts-expect-error WebGL2
    gl.bindVertexArray(vertexArray);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-0.2, -0.2, 0.2, -0.2, 0.0, 0.2]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0]),
      gl.STATIC_DRAW
    );

    const colorLocation = gl.getAttribLocation(program, 'color');
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
    // @ts-expect-error WebGL2
    gl.vertexAttribDivisor(colorLocation, 1);
    gl.enableVertexAttribArray(colorLocation);

    const offsetBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5]),
      gl.STATIC_DRAW
    );

    const offsetLocation = gl.getAttribLocation(program, 'offset');
    gl.vertexAttribPointer(offsetLocation, 2, gl.FLOAT, false, 0, 0);
    // @ts-expect-error WebGL2
    gl.vertexAttribDivisor(offsetLocation, 1);
    gl.enableVertexAttribArray(offsetLocation);

    // @ts-expect-error WebGL2
    gl.bindVertexArray(null);

    // @ts-expect-error
    this.resources = {
      positionBuffer,
      colorBuffer,
      offsetBuffer,
      program,
      vertexArray
    };
  }

  override onRender({gl}: ClassicAnimationProps): void {
    gl.clear(gl.COLOR_BUFFER_BIT);
    // @ts-expect-error WebGL2
    gl.bindVertexArray(this.resources.vertexArray);
    // @ts-expect-error WebGL2
    gl.useProgram(this.resources.program);
    // @ts-expect-error WebGL2
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, 4);
  }

  override onFinalize({gl}: ClassicAnimationProps) {
    // @ts-expect-error
    const {positionBuffer, colorBuffer, offsetBuffer, program, vertexArray} = this.resources;
    gl.deleteBuffer(positionBuffer);
    gl.deleteBuffer(colorBuffer);
    gl.deleteBuffer(offsetBuffer);
    gl.deleteProgram(program);
    // @ts-expect-error WebGL2
    gl.deleteVertexArray(vertexArray);
  }
}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
