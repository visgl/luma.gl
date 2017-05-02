/* global LumaGL */
/* eslint-disable array-bracket-spacing, no-multi-spaces */
const {AnimationLoop, createGLContext,
  PerspectiveCamera, Program, Model, Geometry, Vec3} = LumaGL;

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
  positions: new Float32Array([
    0,   1, 0,
    -1, -1, 0,
    1,  -1, 0
  ]),
  colors: {
    value: new Float32Array([
      1, 0, 0, 1,
      0, 1, 0, 1,
      0, 0, 1, 1
    ]),
    size: 4
  }
});

const squareGeometry = new Geometry({
  positions: new Float32Array([
    1,   1, 0,
    -1,  1, 0,
    1,  -1, 0,
    -1, -1, 0]),
  colors: {
    value: new Float32Array([
      0.5, 0.5, 1, 1,
      0.5, 0.5, 1, 1,
      0.5, 0.5, 1, 1,
      0.5, 0.5, 1, 1
    ]),
    size: 4
  }
});

new AnimationLoop()
.context(() => createGLContext({canvas: 'lesson03-canvas'}))
.init(({gl}) => {
  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  const program = new Program(gl, {
    vs: VERTEX_SHADER,
    fs: FRAGMENT_SHADER
  });

  const triangle = new Model({geometry: triangleGeometry, program});

  const square = new Model({geometry: squareGeometry, program});

  return {triangle, square};
})
.frame(({gl, tick, aspect, triangle, square}) => {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const camera = new PerspectiveCamera({aspect});

  const rTri = tick * 0.01;
  const rSquare = tick * 0.1;

  // Draw triangle
  triangle
    .setPosition(new Vec3(-1.5, 0, -7))
    .setRotation(new Vec3(0, rTri, 0))
    .updateMatrix()
    .render({
      uMVMatrix: triangle.matrix,
      uPMatrix: camera.projection
    });

  // Draw Square
  square
    .setPosition(new Vec3(1.5, 0, -7))
    .setRotation(new Vec3(rSquare, 0, 0))
    .updateMatrix()
    .render({
      uMVMatrix: square.matrix,
      uPMatrix: camera.projection
    });
});
