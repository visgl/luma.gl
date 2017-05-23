import {GL, AnimationLoop, Model, Geometry, Program, Matrix4} from 'luma.gl';

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
#ifdef GL_ES
precision highp float;
#endif

varying vec4 vColor;

void main(void) {
  gl_FragColor = vColor;
}
`;

const animationLoop = new AnimationLoop({
  // .context(() => createGLContext({canvas: 'lesson04-canvas'}))
  onInitialize({gl}) {
    addControls();

    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.enable(GL.DEPTH_TEST);
    gl.depthFunc(GL.LEQUAL);

    const program = new Program(gl, {vs: VERTEX_SHADER, fs: FRAGMENT_SHADER});

    return {
      pyramid: new Model({program, geometry: getPyramidGeometry()}),
      cube: new Model({program, geometry: getCubeGeometry()})
    };
  },
  onRender({gl, tick, aspect, pyramid, cube}) {
    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    const projection = Matrix4.perspective({aspect});
    const view = Matrix4.lookAt({eye: [0, 0, 0]});

    pyramid.render({
      uPMatrix: projection,
      uMVMatrix: view.clone().translate([-1.5, 0, -8]).rotateY(tick * 0.01)
    });

    const phi = tick * 0.01;
    cube.render({
      uPMatrix: projection,
      uMVMatrix:
        view.clone().translate([1.5, 0, -8]).rotateXYZ([phi, phi, phi])
    });
  }
});

export default animationLoop;

/* eslint-disable indent, no-multi-spaces */
// Makes a colored pyramid
function getPyramidGeometry() {
  return new Geometry({
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
  });
}

// Make a colored cube
function getCubeGeometry() {
  return new Geometry({
    positions: new Float32Array([
      -1, -1,  1,
       1, -1,  1,
       1,  1,  1,
      -1,  1,  1,

      -1, -1, -1,
      -1,  1, -1,
       1,  1, -1,
       1, -1, -1,

      -1,  1, -1,
      -1,  1,  1,
       1,  1,  1,
       1,  1, -1,

      -1, -1, -1,
       1, -1, -1,
       1, -1,  1,
      -1, -1,  1,

       1, -1, -1,
       1,  1, -1,
       1,  1,  1,
       1, -1,  1,

      -1, -1, -1,
      -1, -1,  1,
      -1,  1,  1,
      -1,  1, -1]),

    colors: {
      size: 4,
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
    },

    indices: new Uint16Array([
      0, 1, 2, 0, 2, 3,
      4, 5, 6, 4, 6, 7,
      8, 9, 10, 8, 10, 11,
      12, 13, 14, 12, 14, 15,
      16, 17, 18, 16, 18, 19,
      20, 21, 22, 20, 22, 23
    ])
  });
}

function addControls({controlPanel} = {}) {
  /* global document */
  controlPanel = controlPanel || document.querySelector('.control-panel');
  if (controlPanel) {
    controlPanel.innerHTML = `
  <p>
    <a href="http://learningwebgl.com/blog/?p=370" target="_blank">
      Some Real 3D Objects
    </a>
  <p>
    The classic WebGL Lessons in luma.gl
    `;
  }
}
