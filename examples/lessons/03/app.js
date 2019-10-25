/* eslint-disable array-bracket-spacing, no-multi-spaces */
import GL from '@luma.gl/constants';
import {AnimationLoop} from '@luma.gl/core';
import {setParameters} from '@luma.gl/gltools';
import {Geometry} from '@luma.gl/engine';
import {ModelNode} from '@luma.gl/addons';
import {Matrix4} from 'math.gl';

const INFO_HTML = `
<p>
  <a href="http://learningwebgl.com/blog/?p=239" target="_blank">
    A Bit of Movement
  </a>
<p>
The classic WebGL Lessons in luma.gl
`;

const FRAGMENT_SHADER = `\
precision highp float;

varying vec4 vColor;

void main(void) {
  gl_FragColor = vColor;
}
`;

const VERTEX_SHADER = `\
attribute vec3 positions;
attribute vec4 colors;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec4 vColor;

void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(positions, 1.0);
  vColor = colors;
}
`;

const triangleGeometry = new Geometry({
  attributes: {
    positions: {size: 3, value: new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0])},
    colors: {size: 4, value: new Float32Array([1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1])}
  }
});

const squareGeometry = new Geometry({
  drawMode: GL.TRIANGLE_STRIP,
  attributes: {
    positions: new Float32Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0]),
    colors: {
      size: 4,
      value: new Float32Array([0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1])
    }
  }
});

export default class AppAnimationLoop extends AnimationLoop {
  static getInfo() {
    return INFO_HTML;
  }
  onInitialize({gl}) {
    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: [1],
      depthTest: true,
      depthFunc: gl.LEQUAL
    });

    return {
      triangle: new ModelNode(gl, {
        geometry: triangleGeometry,
        vs: VERTEX_SHADER,
        fs: FRAGMENT_SHADER
      }),
      square: new ModelNode(gl, {geometry: squareGeometry, vs: VERTEX_SHADER, fs: FRAGMENT_SHADER})
    };
  }

  onRender(context) {
    const {gl, tick, aspect, triangle, square} = context;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const projection = new Matrix4().perspective({aspect});

    // Draw triangle
    triangle
      .setPosition([-1.5, 0, -7])
      .setRotation([0, tick * 0.01, 0])
      .updateMatrix()
      .setUniforms({
        uMVMatrix: triangle.matrix,
        uPMatrix: projection
      })
      .draw();

    // Draw Square
    square
      .setPosition([1.5, 0, -7])
      .setRotation([tick * 0.1, 0, 0])
      .updateMatrix()
      .setUniforms({
        uMVMatrix: square.matrix,
        uPMatrix: projection
      })
      .draw();
  }
}

/* global window */
if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
