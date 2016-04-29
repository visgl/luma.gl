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
    vertices: new Float32Array([
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
    vertices: new Float32Array([
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

  var gl = createGLContext(canvas);

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

  var camera = new PerspectiveCamera({
    aspect: canvas.width / canvas.height
  });

  var view = new Mat4();
  var rPyramid = 0;
  var rCube = 0;

  function setupElement(model) {
    // Set up buffers if we haven't already.
    if (!model.userData.buffers) {
      model.userData.buffers = [];
      if (model.geometry.vertices) {
        model.userData.buffers.push(new Buffer(gl, {
          attribute: 'aVertexPosition',
          data: model.geometry.getArray('vertices'),
          size: 3
        }));
      }
      if (model.geometry.colors) {
        model.userData.buffers.push(new Buffer(gl, {
          attribute: 'aVertexColor',
          data: model.geometry.getArray('colors'),
          size: 4
        }));
      }
      if (model.geometry.indices) {
        model.userData.buffers.push(new Buffer(gl, {
          attribute: 'indices',
          data: model.geometry.getArray('indices'),
          bufferType: gl.ELEMENT_ARRAY_BUFFER,
          size: 1
        }));
      }
    }

    // update element matrix
    model.updateMatrix();
    // get new view matrix out of element and camera matrices
    view.mulMat42(camera.view, model.matrix);
    // set buffers with element data
    program
      .setBuffers(model.userData.buffers)
      // set uniforms
      .setUniforms({
        uMVMatrix: view,
        uPMatrix: camera.projection
      });
  }

  function animate() {
    rPyramid += 0.01;
    rCube += 0.01;
  }

  function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw Pyramid
    pyramid
      .setPosition(new Vec3(-1.5, 0, -8))
      .setRotation(new Vec3(0, rPyramid, 0))
      .updateMatrix()
      .render();

    // Draw Cube
    cube
      .setPosition(new Vec3(1.5, 0, -8))
      .setRotation(new Vec3(rCube, rCube, rCube))
      .updateMatrix()
      .render();
  }

  function tick() {
    drawScene();
    animate();
    Fx.requestAnimationFrame(tick);
  }

  tick();
};
