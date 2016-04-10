/* global window, document, Image, LumaGL */
/* eslint-disable max-statements, array-bracket-spacing, no-multi-spaces */
window.webGLStart = function() {

  var createGLContext = LumaGL.createGLContext;
  var makeProgramFromHTMLTemplates = LumaGL.addons.makeProgramFromHTMLTemplates;
  var PerspectiveCamera = LumaGL.PerspectiveCamera;
  var Fx = LumaGL.Fx;
  var Mat4 = LumaGL.Mat4;
  var Vec3 = LumaGL.Vec3;
  var Model = LumaGL.Model;
  var Geometry = LumaGL.Geometry;
  var Buffer = LumaGL.Buffer;
  var Texture2D = LumaGL.Texture2D;
  var Events = LumaGL.Events;

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
      -1,  1, -1
    ]),

    texCoords: new Float32Array([
      // Front face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      // Back face
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      0.0, 0.0,

      // Top face
      0.0, 1.0,
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,

      // Bottom face
      1.0, 1.0,
      0.0, 1.0,
      0.0, 0.0,
      1.0, 0.0,

      // Right face
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      0.0, 0.0,

      // Left face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0
    ]),

    indices: new Uint16Array([
      0, 1, 2, 0, 2, 3,
      4, 5, 6, 4, 6, 7,
      8, 9, 10, 8, 10, 11,
      12, 13, 14, 12, 14, 15,
      16, 17, 18, 16, 18, 19,
      20, 21, 22, 20, 22, 23
    ])
  });

  var canvas = document.getElementById('lesson06-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  var gl = createGLContext(canvas);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  var xRot = 0;
  var xSpeed = 0.01;
  var yRot = 0;
  var ySpeed = 0.013;
  var z = -5.0;
  var filter = 0;
  var filters = ['nearest', 'linear', 'mipmap'];
  var view = new Mat4();

  var camera = new PerspectiveCamera({
    aspect: canvas.width / canvas.height
  });

  var program = makeProgramFromHTMLTemplates(gl, 'shader-vs', 'shader-fs');

  program.use();

  // Create object
  var cube = new Model({
    geometry: cubeGeometry,
    program: program
  });

  var buffers = [
    new Buffer(gl, {
      attribute: 'aVertexPosition',
      data: cube.geometry.vertices.value,
      size: 3
    }),
    new Buffer(gl, {
      attribute: 'aTextureCoord',
      data: cube.geometry.texCoords.value,
      size: 2
    }),
    new Buffer(gl, {
      data: cube.geometry.indices.value,
      bufferType: gl.ELEMENT_ARRAY_BUFFER,
      size: 1
    })
  ];

  Events.create(canvas, {
    onKeyDown: function(e) {
      switch (e.key) {
      case 'f':
        filter = (filter + 1) % 3;
        break;
      case 'up':
        xSpeed -= 0.02;
        break;
      case 'down':
        xSpeed += 0.02;
        break;
      case 'left':
        ySpeed -= 0.02;
        break;
      case 'right':
        ySpeed += 0.02;
        break;
      // andle page up/down
      default:
        if (e.code === 33) {
          z -= 0.05;
        } else if (e.code === 34) {
          z += 0.05;
        }
      }
    }
  });

  var img = new Image();
  var textures = {};
  img.onload = function() {
    textures.nearest = new Texture2D(gl, {
      data: img
    });
    textures.linear = new Texture2D(gl, {
      data: img,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR
    });
    textures.mipmap = new Texture2D(gl, {
      data: img,
      minFilter: gl.LINEAR_MIPMAP_LINEAR,
      magFilter: gl.LINEAR,
      generateMipmap: true
    });

    function animate() {
      xRot += xSpeed;
      yRot += ySpeed;
    }

    function tick() {
      drawScene();
      animate();
      Fx.requestAnimationFrame(tick);
    }

    function drawScene() {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // draw Cube
      cube
        .setPosition(new Vec3(0, 0, z))
        .setRotation(new Vec3(xRot, yRot, 0))
        // update element matrix
        .update();
      // get new view matrix out of element and camera matrices
      view.mulMat42(camera.view, cube.matrix);
      // set attributes, indices and textures
      program
        .setBuffers(buffers)
        .setTexture(textures[filters[filter]])
        // set uniforms
        .setUniform('uMVMatrix', view)
        .setUniform('uPMatrix', camera.projection)
        .setUniform('uSampler', 0);

      // draw triangles
      gl.drawElements(
        gl.TRIANGLES, cube.getVertexCount(), gl.UNSIGNED_SHORT, 0
      );
    }
    tick();
  };
  // load image
  img.src = 'crate.gif';

};
