/* eslint-disable no-var */
/* eslint-disable max-statements, array-bracket-spacing, no-multi-spaces */
/* global window, document, LumaGL */

// Lighting form elements variables
var $id = function(d) {
  return document.getElementById(d);
};

window.webGLStart = function() {

  var createGLContext = LumaGL.createGLContext;
  var loadTextures = LumaGL.loadTextures;
  var Program = LumaGL.Program;
  var PerspectiveCamera = LumaGL.PerspectiveCamera;
  var Scene = LumaGL.Scene;
  var Events = LumaGL.Events;
  var Fx = LumaGL.Fx;
  var Model = LumaGL.Model;
  var Shaders = LumaGL.Shaders;

  var canvas = document.getElementById('lesson08-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  var gl = createGLContext(canvas);

  loadTextures(gl, {
    urls: ['glass.gif'],
    parameters: [{
      minFilter: gl.LINEAR_MIPMAP_NEAREST,
      magFilter: gl.LINEAR,
      generateMipmap: true
    }]
  })
  .then(function(textures) {

    var glass = textures[0];

    var xRot = 0;
    var xSpeed = 0.01;
    var yRot = 0;
    var ySpeed = 0.013;
    var z = -5.0;

    // Get lighting form elements
    var lighting = $id('lighting');
    var ambient = {
      r: $id('ambientR'),
      g: $id('ambientG'),
      b: $id('ambientB')
    };
    var direction = {
      x: $id('lightDirectionX'),
      y: $id('lightDirectionY'),
      z: $id('lightDirectionZ'),

      r: $id('directionalR'),
      g: $id('directionalG'),
      b: $id('directionalB')
    };
    var blending = $id('blending');
    var alpha = $id('alpha');

    // Create object
    var cube = new Model({
      vertices: new Float32Array[
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
        ],

      texCoords: new Float32Array[
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

      indices: [
        0, 1, 2, 0, 2, 3,
        4, 5, 6, 4, 6, 7,
        8, 9, 10, 8, 10, 11,
        12, 13, 14, 12, 14, 15,
        16, 17, 18, 16, 18, 19,
        20, 21, 22, 20, 22, 23
      ]
    });


   textures: glass,

    // Blend Fragment Shader
    var blendFS = [

        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",

        "varying vec4 vColor;",
        "varying vec2 vTexCoord;",
        "varying vec3 lightWeighting;",

        "uniform bool hasTexture1;",
        "uniform sampler2D sampler1;",
        "uniform float alpha;",

        "void main(){",
        "  if (hasTexture1) {",
        "    gl_FragColor = vec4(texture2D(sampler1,",
        "      vec2(vTexCoord.s, vTexCoord.t)).rgb * lightWeighting, alpha);",
        "  }",
        "}"

    ].join("\n");

    var program = new Program(gl, {vs: Shaders.Vertex.Default, fs: blendFS});
    program.use();

    Events.create(canvas, {
      onKeyDown: function(e) {
        switch(e.key) {
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
          // handle page up/down
          default:
            if (e.code == 33) {
              z -= 0.05;
            } else if (e.code == 34) {
              z += 0.05;
            }
        }
      }
    });

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    var camera = new PerspectiveCamera({
      aspect: canvas.width / canvas.height
    });

    var scene = new Scene(gl, program, camera);

    scene.add(cube);

    function animate() {
      xRot += xSpeed;
      yRot += ySpeed;
    }

    function drawScene() {
      // Update Cube position
      cube.position.set(0, 0, z);
      cube.rotation.set(xRot, yRot, 0);
      cube.update();
      if (blending.checked) {
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        program.setUniforms({
          'alpha', Number(alpha.value)
        });
      } else {
        gl.disable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
      }
      // Update scene config with light info
      var lightConfig = scene.config.lights;
      lightConfig.enable = lighting.checked;
      lightConfig.ambient = {
        r: Number(ambient.r.value),
        g: Number(ambient.g.value),
        b: Number(ambient.b.value)
      };
      lightConfig.directional.direction = {
        x: Number(direction.x.value),
        y: Number(direction.y.value),
        z: Number(direction.z.value)
      };
      lightConfig.directional.color = {
        r: Number(direction.r.value),
        g: Number(direction.g.value),
        b: Number(direction.b.value)
      };
      // Render all elements in the Scene
      scene.render();
    }

    function tick() {
      drawScene();
      animate();
      Fx.requestAnimationFrame(tick);
    }

    tick();

  });

};
