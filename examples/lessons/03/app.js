/* eslint-disable array-bracket-spacing, no-multi-spaces */
import {AnimationLoop, Program, Model, Geometry, Matrix4} from 'luma.gl';

const FRAGMENT_SHADER = `\
#ifdef GL_ES
precision highp float;
#endif

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
  positions: new Float32Array([0, 1, 0,  -1, -1, 0,  1, -1, 0]),
  colors: {size: 4, value: new Float32Array([1, 0, 0, 1,  0, 1, 0, 1,  0, 0, 1, 1])}
});

const squareGeometry = new Geometry({
  positions: new Float32Array([1, 1, 0,  -1, 1, 0,  1, -1, 0,  -1, -1, 0]),
  colors: {
    size: 4,
    value: new Float32Array([
      0.5, 0.5, 1, 1,  0.5, 0.5, 1, 1,  0.5, 0.5, 1, 1,  0.5, 0.5, 1, 1
    ])
  }
});

const animationLoop = new AnimationLoop({
  onInitialize({gl}) {
    addControls();

    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    const program = new Program(gl, {vs: VERTEX_SHADER, fs: FRAGMENT_SHADER});
    const triangle = new Model({geometry: triangleGeometry, program});
    const square = new Model({geometry: squareGeometry, program});

    return {triangle, square};
  },
  onRender({gl, tick, aspect, triangle, square}) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const projection = Matrix4.perspective({aspect});

    // Draw triangle
    triangle
      .setPosition([-1.5, 0, -7])
      .setRotation([0, tick * 0.01, 0])
      .updateMatrix()
      .render({
        uMVMatrix: triangle.matrix,
        uPMatrix: projection
      });

    // Draw Square
    square
      .setPosition([1.5, 0, -7])
      .setRotation([tick * 0.1, 0, 0])
      .updateMatrix()
      .render({
        uMVMatrix: square.matrix,
        uPMatrix: projection
      });
  }
});

function addControls({controlPanel} = {}) {
  /* global document */
  controlPanel = controlPanel || document.querySelector('.control-panel');
  if (controlPanel) {
    controlPanel.innerHTML = `
  <p>
    <a href="http://learningwebgl.com/blog/?p=239" target="_blank">
      A Bit of Movement
    </a>
  <p>
    The classic WebGL Lessons in luma.gl
    `;
  }
}

export default animationLoop;
