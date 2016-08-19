/* global window, document, LumaGL */
/* eslint-disable max-statements, no-var */
/* eslint-disable array-bracket-spacing, no-multi-spaces */
var getShadersFromHTML = LumaGL.addons.getShadersFromHTML;
var Program = LumaGL.Program;
var createGLContext = LumaGL.createGLContext;
var PerspectiveCamera = LumaGL.PerspectiveCamera;
var Fx = LumaGL.Fx;
var Mat4 = LumaGL.Mat4;
var Model = LumaGL.Model;
var Geometry = LumaGL.Geometry;
var Vec3 = LumaGL.Vec3;

window.webGLStart = function() {
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

  var canvas = document.getElementById('lesson03-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  var gl = createGLContext({canvas});

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  var program = new Program(gl, getShadersFromHTML({
    vs: 'shader-vs',
    fs: 'shader-fs'
  }));

  program.use();

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

  var rTri = 0.0;
  var rSquare = 0.0;

  function setupModel(model) {
    // get new view matrix out of element and camera matrices
    var view = new Mat4();
    view.mulMat42(camera.view, model.matrix);

    model.setUniforms({
      uMVMatrix: view,
      uPMatrix: camera.projection
    })
    .setProgramState();
  }

  function animate() {
    rTri += 0.01;
    rSquare += 0.1;
  }

  function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw triangle
    triangle
      .setPosition(new Vec3(-1.5, 0, -7))
      .setRotation(new Vec3(0, rTri, 0))
      .updateMatrix();
    setupModel(triangle);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Draw Square
    square
      .setPosition(new Vec3(1.5, 0, -7))
      .setRotation(new Vec3(rSquare, 0, 0))
      .updateMatrix();
    setupModel(square);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function tick() {
    drawScene();
    animate();
    Fx.requestAnimationFrame(tick);
  }

  tick();
};
