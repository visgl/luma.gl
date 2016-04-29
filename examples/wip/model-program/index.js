var webGLStart = function() {

  var createGLContext = LumaGL.createGLContext;
  var loadTextures = LumaGL.loadTextures;
  var Program = LumaGL.Program;
  var PerspectiveCamera = LumaGL.PerspectiveCamera;
  var Scene = LumaGL.Scene;
  var Events = LumaGL.Events;
  var Fx = LumaGL.Fx;
  var IO = LumaGL.IO;
  var Model = LumaGL.Model;

  var canvas = document.getElementById('render-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  var gl = createGLContext(canvas);

  loadTextures(gl, {
    urls: ['crate.gif'],
    parameters: [{
      magFilter: gl.LINEAR,
      minFilter: gl.LINEAR_MIPMAP_NEAREST,
      generateMipmap: true
    }]
  }).then(function(textures) {

    var crate = textures[0];

    var xRot = 0, xSpeed = 0.01,
        yRot = 0, ySpeed = 0.013,
        z = -5.0;

    //Create object
    var cube = new Model({
      program: makeProgramFromDefaultShaders(gl),
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

      textures: crate,

      texCoords: [0.0, 0.0,
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
                  0.0, 1.0],

      normals: [
        // Front face
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,

        // Back face
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,

        // Top face
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,

        // Bottom face
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,

        // Right face
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,

        // Left face
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0
      ],

      indices: [0, 1, 2, 0, 2, 3,
                4, 5, 6, 4, 6, 7,
                8, 9, 10, 8, 10, 11,
                12, 13, 14, 12, 14, 15,
                16, 17, 18, 16, 18, 19,
                20, 21, 22, 20, 22, 23]
    });

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    var camera = new PerspectiveCamera({
      aspect: canvas.width/canvas.height,
    });

    var scene = new Scene(gl, undefined, camera);

    scene.add(cube);

    function animate() {
      xRot += xSpeed;
      yRot += ySpeed;
    }

    function drawScene() {
      cube.position.set(0, 0, z);
      cube.rotation.set(xRot, yRot, 0);
      cube.update();
      var lightConfig = scene.config.lights;
      lightConfig.enable = true;
      lightConfig.ambient = {
        r: +0.1,
        g: +0.1,
        b: +0.1
      };
      lightConfig.directional.direction = {
        x: +1,
        y: +1,
        z: -3
      };
      lightConfig.directional.color = {
        r: +1,
        g: +1,
        b: +1
      };
      scene.render();
    }

    function tick() {
      drawScene();
      animate();
      Fx.requestAnimationFrame(tick);
    }

    tick();

  });

}
