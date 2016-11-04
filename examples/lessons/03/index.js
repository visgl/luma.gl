/* global window, document, LumaGL */
/* eslint-disable max-statements, no-var */
/* eslint-disable array-bracket-spacing, no-multi-spaces */
const {AnimationFrame, createGLContext,
  PerspectiveCamera, Program, Fx, Mat4, Model, Geometry, Vec3} = LumaGL;

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

var triangleGeometry = new Geometry({
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

var squareGeometry = new Geometry({
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

new AnimationFrame()
.context(() => gl = createGLContext({canvas: 'lesson03-canvas'}))
.init(({gl}) => {
  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  var program = new Program(gl, getShadersFromHTML({
    vs: VERTEX_SHADER,
    fs: FRAGMENT_SHADER
  }));

  var triangle = new Model({
    geometry: triangleGeometry,
    program: program
  });

  var square = new Model({
    geometry: squareGeometry,
    program: program
  });

  var camera = new PerspectiveCamera({
    aspect: canvas.width / canvas.height
  });
})
.frame(({gl, tick}) => {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const rTri = tick * 0.01;
  const rSquare = tick * 0.1;

  // get new view matrix out of element and camera matrices
  var view = new Mat4();
  view.mulMat42(camera.view, model.matrix);

  // Draw triangle
  triangle
    .setPosition(new Vec3(-1.5, 0, -7))
    .setRotation(new Vec3(0, rTri, 0))
    .updateMatrix()
    .render({
      uMVMatrix: view,
      uPMatrix: camera.projection
    });

  // Draw Square
  square
    .setPosition(new Vec3(1.5, 0, -7))
    .setRotation(new Vec3(rSquare, 0, 0))
    .updateMatrix()
    .render({
      uMVMatrix: view,
      uPMatrix: camera.projection
    });
});
