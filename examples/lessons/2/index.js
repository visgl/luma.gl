window.webGLStart = function() {

  var createGLContext = LumaGL.createGLContext;
  var Program = LumaGL.Program;
  var PerspectiveCamera = LumaGL.PerspectiveCamera;
  var Buffer = LumaGL.Buffer;

  var canvas = document.getElementById('lesson02-canvas');

  var gl = createGLContext(canvas);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  var program = Program.fromHTMLTemplates(gl, 'shader-vs', 'shader-fs');

  program.use();

  var triangle = new Buffer(gl, {
    attribute: 'aVertexPosition',
    data: new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]),
    size: 3
  });

  var triangleColors = new Buffer(gl, {
    attribute: 'aVertexColor',
    data: new Float32Array([1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1]),
    size: 4
  });

  var square = new Buffer(gl, {
    attribute: 'aVertexPosition',
    data: new Float32Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0]),
    size: 3
  });

  var squareColors = new Buffer(gl, {
    attribute: 'aVertexColor',
    data: new Float32Array([0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1]),
    size: 4
  });

  var camera = new PerspectiveCamera({
    aspect: canvas.width/canvas.height,
  });

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //Draw Triangle
  camera.view.$translate(-1.5, 0, -7);
  program.setUniform('uMVMatrix', camera.view);
  program.setUniform('uPMatrix', camera.projection);
  program.setBuffers(triangle, triangleColors);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  //Draw Square
  camera.view.$translate(3, 0, 0);
  program.setUniform('uMVMatrix', camera.view);
  program.setUniform('uPMatrix', camera.projection);
  program.setBuffers(square, squareColors);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

};
