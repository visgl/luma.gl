
var webGLStart = function() {

  var createGLContext = LumaGL.createGLContext;
  var loadTextures = LumaGL.loadTextures;
  var Program = LumaGL.Program;
  var PerspectiveCamera = LumaGL.PerspectiveCamera;
  var Fx = LumaGL.Fx;
  var Mat4 = LumaGL.Mat4;
  var Model = LumaGL.Model;
  var Buffer = LumaGL.Buffer;

  var canvas = document.getElementById('lesson05-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  var gl = createGLContext(canvas);

  loadTextures(gl, {

    src: ['nehe.gif']

  }).then(function(textures) {

      var nehe = textures[0];

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clearDepth(1);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);

      var program = Program.fromHTMLTemplates(gl, 'shader-vs', 'shader-fs');

      program.use();

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

        texCoords: [
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
        ],

        indices: [0, 1, 2, 0, 2, 3,
                  4, 5, 6, 4, 6, 7,
                  8, 9, 10, 8, 10, 11,
                  12, 13, 14, 12, 14, 15,
                  16, 17, 18, 16, 18, 19,
                  20, 21, 22, 20, 22, 23]
      });

      var buffers = [
        new Buffer(gl, {
            attribute: 'aVertexPosition',
            data: cube.vertices,
            size: 3
        }),
        new Buffer(gl, {
            attribute: 'aTextureCoord',
            data: cube.texCoords,
            size: 2
        }),
        new Buffer(gl, {
            data: cube.indices,
            bufferType: gl.ELEMENT_ARRAY_BUFFER,
            size: 1
        })
      ];

      var camera = new PerspectiveCamera({
        aspect: canvas.width/canvas.height,
      });

      var view = new Mat4();
      var rCube = 0;


    function drawScene() {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      //draw Cube
      rCube += 0.01;
      cube.position.set(0, 0, -5);
      cube.rotation.set(rCube, rCube, rCube);
      //update element matrix
      cube.update();
      //get new view matrix out of element and camera matrices
      view.mulMat42(camera.view, cube.matrix);
      //set attributes, indices and textures
      program.setBuffers(buffers)
             .setTexture(nehe);
      //set uniforms
      program.setUniform('uMVMatrix', view);
      program.setUniform('uPMatrix', camera.projection);
      program.setUniform('uSampler', 0);
      //draw triangles
      gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_SHORT, 0);
      //request new frame
      Fx.requestAnimationFrame(drawScene);
    }

    drawScene();

  });

}
