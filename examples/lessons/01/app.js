/* eslint-disable no-var, max-statements */

import {createGLContext, AnimationLoop, Program, Buffer, Matrix4} from 'luma.gl';

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
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

const animationLoop = new AnimationLoop({
  onInitialize({gl, canvas, aspect}) {
    // var canvas = document.getElementById('lesson01-canvas');
    // canvas.width = canvas.clientWidth;
    // canvas.height = canvas.clientHeight;
    // const aspect = canvas.width / canvas.height;

    // const gl = createGLContext({canvas});

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    var program = new Program(gl, {
      vs: VERTEX_SHADER,
      fs: FRAGMENT_SHADER
    });

    var trianglePositions = new Buffer(gl, {
      data: new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]),
      size: 3
    });

    var squarePositions = new Buffer(gl, {
      data: new Float32Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0]),
      size: 3
    });

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw Triangle
    const view = new Matrix4().translate([-1.5, 0, -7]);
    const projection = Matrix4.perspective({aspect});

    program.use();
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
  },
  onRender({gl}) {
  }
});

export default animationLoop;
