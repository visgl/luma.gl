var webGLStart = function() {

  var createGLContext = LumaGL.createGLContext;
  var Program = LumaGL.Program;
  var PerspectiveCamera = LumaGL.PerspectiveCamera;
  var Fx = LumaGL.Fx;
  var Mat4 = LumaGL.Mat4;
  var IO = LumaGL.IO;
  var Model = LumaGL.Model;
  var Buffer = LumaGL.Buffer;

  var pyramid = new Model({
    vertices: [ 0,  1,  0,
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
               -1, -1,  1],

    colors: [1, 0, 0, 1,
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
             0, 1, 0, 1]
  });

  var cube = new Model({
    vertices: [-1, -1,  1,
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
               -1,  1, -1],

    colors: [1, 0, 0, 1,
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
             0, 0, 1, 1],

    indices: [0, 1, 2, 0, 2, 3,
              4, 5, 6, 4, 6, 7,
              8, 9, 10, 8, 10, 11,
              12, 13, 14, 12, 14, 15,
              16, 17, 18, 16, 18, 19,
              20, 21, 22, 20, 22, 23]
  });

  var canvas = document.getElementById('lesson04-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  var gl = createGLContext(canvas);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  var program = Program.fromHTMLTemplates(gl, 'shader-vs', 'shader-fs');

  program.use();

  var camera = new PerspectiveCamera({
    aspect: canvas.width/canvas.height,
  });

  var view = new Mat4;
  var rPyramid = 0;
  var rCube = 0;

  function setupElement(elem) {
    // Set up buffers if we haven't already.
    if (elem.bufs === undefined) {
      elem.bufs = [];
      if (elem.vertices) {
        elem.bufs.push(new Buffer(gl, {
          attribute: 'aVertexPosition',
          data: elem.vertices,
          size: 3
        }));
      }
      if (elem.colors) {
        elem.bufs.push(new Buffer(gl, {
          attribute: 'aVertexColor',
          data: elem.colors,
          size: 4
        }));
      }
      if (elem.indices) {
        elem.bufs.push(new Buffer(gl, {
          data: elem.indices,
          bufferType: gl.ELEMENT_ARRAY_BUFFER,
          size: 1
        }));
      }
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
    rPyramid += 0.01;
    rCube += 0.01;
  }

  function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //Draw Pyramid
    pyramid.position.set(-1.5, 0, -8);
    pyramid.rotation.set(0, rPyramid, 0);
    setupElement(pyramid);
    gl.drawArrays(gl.TRIANGLES, 0, pyramid.vertices.length / 3);

    //Draw Cube
    cube.position.set(1.5, 0, -8);
    cube.rotation.set(rCube, rCube, rCube);
    setupElement(cube);
    gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_SHORT, 0);
  }

  function tick() {
    drawScene();
    animate();
    Fx.requestAnimationFrame(tick);
  }

  tick();

}
