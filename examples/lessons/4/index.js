/* global LumaGL */
/* eslint-disable no-var, max-statements, indent, no-multi-spaces */
/* eslint-disable object-shorthand */
const GL = LumaGL.GL;
const getHTMLTemplate = LumaGL.addons.getHTMLTemplate;
const Model = LumaGL.Model;
const Geometry = LumaGL.Geometry;
const Program = LumaGL.Program;
const Matrix4 = LumaGL.Matrix4;

const Renderer = LumaGL.addons.Renderer;

const pyramidGeometry = new Geometry({
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

const cubeGeometry = new Geometry({
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

let pyramid;
let cube;

new Renderer()
.init(function init(context) {
  const gl = context.gl;

  const program = new Program(gl, {
    vs: getHTMLTemplate('shader-vs'),
    fs: getHTMLTemplate('shader-fs')
  });

  pyramid = new Model({
    geometry: pyramidGeometry,
    program: program
  });

  cube = new Model({
    geometry: cubeGeometry,
    program: program
  });

  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);
  gl.enable(GL.DEPTH_TEST);
  gl.depthFunc(GL.LEQUAL);
})
.frame(function drawScene(context) {
  const gl = context.gl;
  const tick = context.tick;
  const width = context.width;
  const height = context.height;

  gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

  var projection = Matrix4.perspective({aspect: width / height});
  var view = Matrix4.lookAt({eye: [0, 0, 0]});

  pyramid.render({
    uPMatrix: projection,
    uMVMatrix: view.clone().translate([-1.5, 0, -8]).rotateY(tick * 0.01)
  });

  const phi = tick * 0.01;
  cube.render({
    uPMatrix: projection,
    uMVMatrix: view.clone().translate([1.5, 0, -8]).rotateXYZ([phi, phi, phi])
  });
});
