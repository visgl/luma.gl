import GL from '@luma.gl/constants';
import {AnimationLoop, Model, setParameters} from '@luma.gl/core';
import {Geometry, CubeGeometry} from '@luma.gl/engine';
import {Matrix4} from 'math.gl';

const INFO_HTML = `
<p>
  <a href="http://learningwebgl.com/blog/?p=370" target="_blank">
    Some Real 3D Objects
  </a>
<p>
The classic WebGL Lessons in luma.gl
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

const FRAGMENT_SHADER = `\
precision highp float;

varying vec4 vColor;

void main(void) {
  gl_FragColor = vColor;
}
`;

// Makes a colored pyramid
class ColoredPyramidGeometry extends Geometry {
  constructor(props) {
    super({
      ...props,
      attributes: {
        /* eslint-disable indent, no-multi-spaces */

        // prettier-ignore
        positions: new Float32Array([
           0,  1,  0,
          -1, -1,  1,
           1, -1,  1,
           0,  1,  0,
           1, -1,  1,
           1, -1, -1,
           0,  1,  0,
           1, -1, -1,
          -1, -1, -1,
           0,  1,  0,
          -1, -1, -1,
          -1, -1,  1
        ]),
        colors: {
          size: 4,
          // prettier-ignore
          value: new Float32Array([
            1, 0, 0, 1,
            0, 1, 0, 1,
            0, 0, 1, 1,
            1, 0, 0, 1,
            0, 0, 1, 1,
            0, 1, 0, 1,
            1, 0, 0, 1,
            0, 1, 0, 1,
            0, 0, 1, 1,
            1, 0, 0, 1,
            0, 0, 1, 1,
            0, 1, 0, 1
          ])
        }
      }
    });
  }
}

// Make a colored cube
class ColoredCubeGeometry extends CubeGeometry {
  constructor(props) {
    super({
      ...props,
      // Add one attribute to the geometry
      attributes: {
        colors: {
          size: 4,
          // prettier-ignore
          value: new Float32Array([
            1, 0, 0, 1,
            1, 0, 0, 1,
            1, 0, 0, 1,
            1, 0, 0, 1,
            1, 1, 0, 1,
            1, 1, 0, 1,
            1, 1, 0, 1,
            1, 1, 0, 1,
            0, 1, 0, 1,
            0, 1, 0, 1,
            0, 1, 0, 1,
            0, 1, 0, 1,
            1, 0.5, 0.5, 1,
            1, 0.5, 0.5, 1,
            1, 0.5, 0.5, 1,
            1, 0.5, 0.5, 1,
            1, 0, 1, 1,
            1, 0, 1, 1,
            1, 0, 1, 1,
            1, 0, 1, 1,
            0, 0, 1, 1,
            0, 0, 1, 1,
            0, 0, 1, 1,
            0, 0, 1, 1
          ])
        }
      }
    });
  }
}

export default class AppAnimationLoop extends AnimationLoop {
  // .context(() => createGLContext({canvas: 'lesson04-canvas'}))
  static getInfo() {
    return INFO_HTML;
  }
  onInitialize({gl}) {
    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true,
      depthFunc: GL.LEQUAL
    });

    return {
      pyramid: new Model(gl, {
        vs: VERTEX_SHADER,
        fs: FRAGMENT_SHADER,
        geometry: new ColoredPyramidGeometry()
      }),
      cube: new Model(gl, {
        vs: VERTEX_SHADER,
        fs: FRAGMENT_SHADER,
        geometry: new ColoredCubeGeometry()
      })
    };
  }
  onRender({gl, tick, aspect, pyramid, cube}) {
    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    const projection = new Matrix4().perspective({aspect});
    const view = new Matrix4().lookAt({eye: [0, 0, 0]});

    pyramid
      .setUniforms({
        uPMatrix: projection,
        uMVMatrix: view
          .clone()
          .translate([-1.5, 0, -8])
          .rotateY(tick * 0.01)
      })
      .draw();

    const phi = tick * 0.01;
    cube
      .setUniforms({
        uPMatrix: projection,
        uMVMatrix: view
          .clone()
          .translate([1.5, 0, -8])
          .rotateXYZ([phi, phi, phi])
      })
      .draw();
  }
}

/* global window */
if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
