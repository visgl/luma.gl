/* global window, document, LumaGL */
/* eslint-disable no-var, max-statements */
import {AnimationLoop, Program, Buffer, Matrix4} from 'luma.gl';

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
  onInitialize({gl, aspect, canvas}) {
    addControls();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    const program = new Program(gl, {vs: VERTEX_SHADER, fs: FRAGMENT_SHADER});
    program.use();

    const projection = new Matrix4().perspective({aspect});
    const view = new Matrix4().translate(-1.5, 0, -7);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw Triangle
    program
      .setBuffers({
        positions: new Buffer(gl, {
          size: 3,
          data: new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0])
        }),
        colors: new Buffer(gl, {
          size: 4,
          data: new Float32Array([1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1])
        })
      })
      .setUniforms({
        uMVMatrix: view,
        uPMatrix: projection
      });
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Draw Square
    view.translate([3, 0, 0]);
    program
      .setBuffers({
        positions: new Buffer(gl, {
          size: 3,
          data: new Float32Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0])
        }),
        colors: new Buffer(gl).setData({
          size: 4,
          data: new Float32Array([0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1])
        })
      })
      .setUniforms({
        uMVMatrix: view,
        uPMatrix: projection
      });
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
});

function addControls({controlPanel} = {}) {
  /* global document */
  controlPanel = controlPanel || document.querySelector('.control-panel');
  if (controlPanel) {
    controlPanel.innerHTML = `
  <p>
    <a href="http://learningwebgl.com/blog/?p=134" target="_blank">
      Adding Color
    </a>
  <p>
    The classic WebGL Lessons in luma.gl
    `;
  }
}

export default animationLoop;
