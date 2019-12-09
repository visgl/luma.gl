/* global window, requestAnimationFrame, cancelAnimationFrame */
import {assembleShaders} from '@luma.gl/shadertools';
import {polyfillContext} from '@luma.gl/gltools';
import {MiniAnimationLoop} from '../../utils';

const INFO_HTML = `
<p>
Hello Instancing - Low-level
<p>
Instanced triangles using luma.gl's low-level API
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

export default class AppAnimationLoop extends MiniAnimationLoop {
  static getInfo() {
    return INFO_HTML;
  }

  start(props) {
    const canvas = this._getCanvas(props);

    const gl = polyfillContext(canvas.getContext('webgl'));
    gl.clearColor(0, 0, 0, 1);

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

    const vShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vShader, assembled.vs);
    gl.compileShader(vShader);

    const fShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fShader, assembled.fs);
    gl.compileShader(fShader);

    const program = gl.createProgram();
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);

    const vertexArray = gl.createVertexArray();
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
    gl.vertexAttribDivisor(offsetLocation, 1);
    gl.enableVertexAttribArray(offsetLocation);

    gl.bindVertexArray(null);

    const resources = {
      gl,
      positionBuffer,
      colorBuffer,
      offsetBuffer,
      program,
      vertexArray
    };

    resources.rafHandle = requestAnimationFrame(function draw() {
      resources.rafHandle = requestAnimationFrame(draw);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindVertexArray(vertexArray);
      gl.useProgram(program);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, 4);
    });

    gl.deleteShader(vShader);
    gl.deleteShader(fShader);

    this.resources = resources;
  }

  stop() {
    cancelAnimationFrame(this.resources.rafHandle);
  }

  delete() {
    const {gl, positionBuffer, colorBuffer, offsetBuffer, program, vertexArray} = this.resources;
    gl.deleteBuffer(positionBuffer);
    gl.deleteBuffer(colorBuffer);
    gl.deleteBuffer(offsetBuffer);
    gl.deleteProgram(program);
    gl.deleteVertexArray(vertexArray);
  }
}

if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
