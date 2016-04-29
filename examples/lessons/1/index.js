/* global window, document, LumaGL */
/* eslint-disable no-var, max-statements */
window.webGLStart = function() {

  var createGLContext = LumaGL.createGLContext;
  var Program = LumaGL.Program;
  var Buffer = LumaGL.Buffer;
  var PerspectiveCamera = LumaGL.PerspectiveCamera;
  var getShadersFromHTML = LumaGL.addons.getShadersFromHTML;

  var canvas = document.getElementById('lesson01-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  var gl = createGLContext(canvas);

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

  var triangle = new Buffer(gl, {
    attribute: 'aVertexPosition',
    data: new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]),
    size: 3
  });

  var square = new Buffer(gl, {
    attribute: 'aVertexPosition',
    data: new Float32Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0]),
    size: 3
  });

  var camera = new PerspectiveCamera({aspect: canvas.width / canvas.height});

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Draw Triangle
  camera.view.$translate(-1.5, 0, -7);
  program
    .setBuffer(triangle)
    .setUniforms({
      uMVMatrix: camera.view,
      uPMatrix: camera.projection
    });
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  // Draw Square
  camera.view.$translate(3, 0, 0);
  program
    .setBuffer(square)
    .setUniforms({
      uMVMatrix: camera.view,
      uPMatrix: camera.projection
    });
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};
