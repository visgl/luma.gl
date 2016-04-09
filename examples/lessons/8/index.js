// Lighting form elements variables
var $id = function(d) {
  return document.getElementById(d);
};

/* global window, document, Image, LumaGL */
/* eslint-disable max-statements, array-bracket-spacing, no-multi-spaces */
var webGLStart = function() {

  var createGLContext = LumaGL.createGLContext;
  var loadTextures = LumaGL.loadTextures;
  var Program = LumaGL.Program;
  var PerspectiveCamera = LumaGL.PerspectiveCamera;
  var Scene = LumaGL.Scene;
  var Events = LumaGL.Events;
  var Fx = LumaGL.Fx;
  var Model = LumaGL.Model;
  var Shaders = LumaGL.Shaders;
  var CubeGeometry = LumaGL.CubeGeometry;

  var canvas = document.getElementById('lesson08-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  var gl = createGLContext(canvas);

  loadTextures(gl, {
    src: ['glass.gif'],
    parameters: [{
      minFilter: gl.LINEAR_MIPMAP_NEAREST,
      magFilter: gl.LINEAR,
      generateMipmap: true
    }]
  }).then(function(textures) {

    var glass = textures[0];

    var xRot = 0, xSpeed = 0.01,
        yRot = 0, ySpeed = 0.013,
        z = -5.0;

    // Get lighting form elements
    var lighting = $id('lighting'),
        ambient = {
          r: $id('ambientR'),
          g: $id('ambientG'),
          b: $id('ambientB')
        },
        direction = {
          x: $id('lightDirectionX'),
          y: $id('lightDirectionY'),
          z: $id('lightDirectionZ'),

          r: $id('directionalR'),
          g: $id('directionalG'),
          b: $id('directionalB')
        },
        blending = $id('blending'),
        alpha = $id('alpha');

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

          "if (hasTexture1) {",

            "gl_FragColor = vec4(texture2D(sampler1, vec2(vTexCoord.s, vTexCoord.t)).rgb * lightWeighting, alpha);",

          "}",

        "}"

    ].join("\n");

    var program = new Program(gl, {
      vs: Shaders.Vertex.Default,
      fs: blendFS
    });
    program.use();

    //Create object
    var cube = new Model({
      program: program,
      geometry: new CubeGeometry(),
      textures: [glass]
    });

    Events.create(canvas, {
      onKeyDown: function(e) {
        switch(e.key) {
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
          //handle page up/down
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
      aspect: canvas.width/canvas.height,
    });

    var scene = new Scene(gl, {});

    scene.add(cube);

    function animate() {
      xRot += xSpeed;
      yRot += ySpeed;
    }

    function drawScene() {
      //Update Cube position
      cube.position.set(0, 0, z);
      cube.rotation.set(xRot, yRot, 0);
      cube.update();
      if (blending.checked) {
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        program.setUniform('alpha', +alpha.value);
      } else {
        gl.disable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
      }
      //Update scene config with light info
      var lightConfig = scene.config.lights;
      lightConfig.enable = lighting.checked;
      lightConfig.ambient = {
        r: +ambient.r.value,
        g: +ambient.g.value,
        b: +ambient.b.value
      };
      lightConfig.directional.direction = {
        x: +direction.x.value,
        y: +direction.y.value,
        z: +direction.z.value
      };
      lightConfig.directional.color = {
        r: +direction.r.value,
        g: +direction.g.value,
        b: +direction.b.value
      };
      //Render all elements in the Scene
      scene.render(gl, {
        camera: camera
      });
    }

    function tick() {
      drawScene();
      animate();
      Fx.requestAnimationFrame(tick);
    }

    tick();

  });

}
