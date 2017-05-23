/* eslint-disable no-var, max-statements */

import {AnimationLoop, Program, Buffer, Matrix4} from 'luma.gl';

const VERTEX_SHADER = `\
attribute vec3 positions;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(positions, 1.0);
}
`;

const FRAGMENT_SHADER = `\
#ifdef GL_ES
precision highp float;
#endif

void main(void) {
  gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
}
`;

const animationLoop = new AnimationLoop({
  onInitialize({gl, canvas, aspect}) {
    addControls();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    var program = new Program(gl, {
      vs: VERTEX_SHADER,
      fs: FRAGMENT_SHADER
    });

    const TRIANGLE_VERTS = [0, 1, 0,  -1, -1, 0,  1, -1, 0]; // eslint-disable-line
    const SQUARE_VERTS = [1, 1, 0,  -1, 1, 0,  1, -1, 0,  -1, -1, 0]; // eslint-disable-line

    var trianglePositions = new Buffer(gl, {size: 3, data: new Float32Array(TRIANGLE_VERTS)});
    var squarePositions = new Buffer(gl, {size: 3, data: new Float32Array(SQUARE_VERTS)});

    const view = new Matrix4().translate([-1.5, 0, -7]);
    const projection = Matrix4.perspective({aspect});

    program.use();

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw Triangle
    program
      .setBuffers({
        positions: trianglePositions
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
        positions: squarePositions
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
    <a href="http://learningwebgl.com/blog/?p=28" target="_blank">
      A Triangle and a Square
    </a>
  <p>
    The classic WebGL Lessons in luma.gl
    `;
  }
}

export default animationLoop;
