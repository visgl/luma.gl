/* global window, document, LumaGL */
/* eslint-disable no-var, max-statements, indent, no-multi-spaces */
window.webGLStart = function() {

  var createGLContext = LumaGL.createGLContext;
  var getShadersFromHTML = LumaGL.addons.getShadersFromHTML;
  var PerspectiveCamera = LumaGL.PerspectiveCamera;
  var Fx = LumaGL.Fx;
  var Vec3 = LumaGL.Vec3;
  var Mat4 = LumaGL.Mat4;
  var Model = LumaGL.Model;
  var Geometry = LumaGL.Geometry;
  var Buffer = LumaGL.Buffer;
  var Program = LumaGL.Program;

  var pyramidGeometry = new Geometry({
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

    colors: new Float32Array([
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
  });

  var cubeGeometry = new Geometry({
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

    colors: new Float32Array([
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
    ]),

    indices: new Float32Array([
      0, 1, 2, 0, 2, 3,
      4, 5, 6, 4, 6, 7,
      8, 9, 10, 8, 10, 11,
      12, 13, 14, 12, 14, 15,
      16, 17, 18, 16, 18, 19,
      20, 21, 22, 20, 22, 23
    ])
  });

  var canvas = document.getElementById('lesson04-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  var gl = createGLContext({canvas});

  var program =
    new Program(gl, getShadersFromHTML({vs: 'shader-vs', fs: 'shader-fs'}));

  var pyramid = new Model({
    geometry: pyramidGeometry,
    program: program
  });

  var cube = new Model({
    geometry: cubeGeometry,
    program: program
  });

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  program.use();

  var camera = new PerspectiveCamera({aspect: canvas.width / canvas.height});

  var view = new Mat4();
  var rPyramid = 0;
  var rCube = 0;

  function animate() {
    rPyramid += 0.01;
    rCube += 0.01;
  }

  function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // get new view matrix out of element and camera matrices
    view.mulMat42(camera.view, pyramid.matrix);

    // Draw Pyramid
    pyramid
      .setPosition(new Vec3(-1.5, 0, -8))
      .setRotation(new Vec3(0, rPyramid, 0))
      .updateMatrix()
      .setUniforms({
        uMVMatrix: view,
        uPMatrix: camera.projection
      })
      .render();

    // get new view matrix out of element and camera matrices
    view.mulMat42(camera.view, cube.matrix);

    // Draw Cube
    cube
      .setPosition(new Vec3(1.5, 0, -8))
      .setRotation(new Vec3(rCube, rCube, rCube))
      .updateMatrix()
      .setUniforms({
        uMVMatrix: view,
        uPMatrix: camera.projection
      })
      .render();
  }

  function tick() {
    drawScene();
    animate();
    Fx.requestAnimationFrame(tick);
  }

  tick();
};
