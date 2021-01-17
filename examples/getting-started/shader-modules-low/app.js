import 'core-js';
import {assembleShaders} from '@luma.gl/shadertools';
import {MiniAnimationLoop} from '../../utils';

const INFO_HTML = `
Shader Modules using luma.gl's low-level API
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

export default class AppAnimationLoop extends MiniAnimationLoop {
  static getInfo() {
    return INFO_HTML;
  }

  start(props) {
    const canvas = this._getCanvas(props);
    /** @type {WebGLRenderingContext} */
    // @ts-ignore
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    gl.clearColor(0, 0, 0, 1);

    // Program 1

    const assembled1 = assembleShaders(gl, {
      vs,
      fs,
      modules: [offsetLeftModule],
      hookFunctions: ['vs:OFFSET_POSITION(inout vec4 position)']
    });

    const vShader1 = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vShader1, assembled1.vs);
    gl.compileShader(vShader1);

    const fShader1 = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fShader1, assembled1.fs);
    gl.compileShader(fShader1);

    const program1 = gl.createProgram();
    gl.attachShader(program1, vShader1);
    gl.attachShader(program1, fShader1);
    gl.linkProgram(program1);
    gl.useProgram(program1);
    const colorLocation1 = gl.getUniformLocation(program1, 'color');
    gl.uniform3fv(colorLocation1, new Float32Array([1.0, 0.0, 0.0]));

    // Program 2

    const assembled2 = assembleShaders(gl, {
      vs,
      fs,
      modules: [offsetRightModule],
      hookFunctions: ['vs:OFFSET_POSITION(inout vec4 position)']
    });

    const vShader2 = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vShader2, assembled2.vs);
    gl.compileShader(vShader2);

    const fShader2 = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fShader2, assembled2.fs);
    gl.compileShader(fShader2);

    const program2 = gl.createProgram();
    gl.attachShader(program2, vShader2);
    gl.attachShader(program2, fShader2);
    gl.linkProgram(program2);
    gl.useProgram(program2);
    const colorLocation2 = gl.getUniformLocation(program2, 'color');
    gl.uniform3fv(colorLocation2, new Float32Array([0.0, 0.0, 1.0]));

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-0.3, -0.5, 0.3, -0.5, 0.0, 0.5]),
      gl.STATIC_DRAW
    );

    const positionLocation1 = gl.getAttribLocation(program1, 'position');
    gl.vertexAttribPointer(positionLocation1, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation1);

    const positionLocation2 = gl.getAttribLocation(program2, 'position');
    gl.vertexAttribPointer(positionLocation2, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation2);

    const resources = {
      gl,
      positionBuffer,
      program1,
      program2
    };

    resources.rafHandle = requestAnimationFrame(function draw() {
      resources.rafHandle = requestAnimationFrame(draw);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.useProgram(program2);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });

    gl.deleteShader(vShader1);
    gl.deleteShader(fShader1);
    gl.deleteShader(vShader2);
    gl.deleteShader(fShader2);

    this.resources = resources;
  }

  stop() {
    cancelAnimationFrame(this.resources.rafHandle);
  }

  delete() {
    const {gl, positionBuffer, program1, program2} = this.resources;
    gl.deleteBuffer(positionBuffer);
    gl.deleteProgram(program1);
    gl.deleteProgram(program2);
  }
}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
