
window.webGLStart = function() {

  var createGLContext = LumaGL.createGLContext;
  var Program = LumaGL.Program;
  var PerspectiveCamera = LumaGL.PerspectiveCamera;
  var Fx = LumaGL.Fx;
  var Mat4 = LumaGL.Mat4;
  var Model = LumaGL.Model;
  var Buffer = LumaGL.Buffer;

  var canvas = document.getElementById('lesson03-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  var gl = createGLContext(canvas);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  var program = makeProgramFromHTMLTemplates(gl, 'shader-vs', 'shader-fs');

  program.use();

  var triangle = new Model({
    vertices: [ 0,  1, 0,
               -1, -1, 0,
                1, -1, 0],

    colors: [1, 0, 0, 1,
             0, 1, 0, 1,
             0, 0, 1, 1]
  });

  var square = new Model({
    vertices: [ 1,  1, 0,
               -1,  1, 0,
                1, -1, 0,
               -1, -1, 0],

    colors: [0.5, 0.5, 1, 1,
             0.5, 0.5, 1, 1,
             0.5, 0.5, 1, 1,
             0.5, 0.5, 1, 1]
  });

  var camera = new PerspectiveCamera({
    aspect: canvas.width/canvas.height,
  });

  var view = new Mat4();
  var rTri = 0.0;
  var rSquare = 0.0;

  function setupElement(elem) {
    // Set up buffers if we haven't already.
    if (elem.bufs === undefined) {
      elem.bufs = [
        new Buffer(gl, {
          attribute: 'aVertexPosition',
          data: elem.vertices,
          size: 3
        }),
        new Buffer(gl, {
          attribute: 'aVertexColor',
          data: elem.colors,
          size: 4
        })
      ]
    }
    //update element matrix
    elem.update();
    //get new view matrix out of element and camera matrices
    view.mulMat42(camera.view, elem.matrix);
    //set buffers with element data
    program.setBuffers(elem.bufs);
    //set uniforms
    program.setUniform('uMVMatrix', view);
    program.setUniform('uPMatrix', camera.projection);
  }

  function animate() {
    rTri += 0.01;
    rSquare += 0.1;
  }

  function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //Draw triangle
    triangle.position.set(-1.5, 0, -7);
    triangle.rotation.set(0, rTri, 0);
    setupElement(triangle);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    //Draw Square
    square.position.set(1.5, 0, -7);
    square.rotation.set(rSquare, 0, 0);
    setupElement(square);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function tick() {
    drawScene();
    animate();
    Fx.requestAnimationFrame(tick);
  }

  tick();

}
