/* global window, document, LumaGL */
/* eslint-disable no-var, max-statements */
var GL = LumaGL.GL;
var createGLContext = LumaGL.createGLContext;
var Program = LumaGL.Program;
var PerspectiveCamera = LumaGL.PerspectiveCamera;
var Scene = LumaGL.Scene;
var addEvents = LumaGL.addEvents;
var Fx = LumaGL.Fx;
var Vec3 = LumaGL.Vec3;
var Sphere = LumaGL.Sphere;
var Cube = LumaGL.Cube;
var loadTextures = LumaGL.loadTextures;
var getShadersFromHTML = LumaGL.addons.getShadersFromHTML;

var $id = function(d) {
  return document.getElementById(d);
};

window.webGLStart = function() {
  var canvas = document.getElementById('lesson13-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  var gl = createGLContext({canvas});

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.viewport(0, 0, canvas.width, canvas.height);

  var defaultProgram = new Program(gl);
  var perpixelProgram = new Program(gl, getShadersFromHTML({
    vs: 'per-fragment-lighting-vs',
    fs: 'per-fragment-lighting-fs'
  }));

  var scene = new Scene(gl, {
    lights: {
      directional: {
        color: {r: 0, g: 0, b: 0},
        direction: {x: 0, y: 0, z: 0}
      }
    }
  });

  addEvents(canvas, {
    onMouseWheel: function(e, info) {
      info.stop();
      camera.position.z += info.wheel;
      camera.update();
    }
  });

  loadTextures(gl, {
    urls: ['moon.gif', 'crate.gif'],
    parameters: [{
      magFilter: gl.LINEAR,
      minFilter: gl.LINEAR_MIPMAP_NEAREST,
      generateMipmap: true
    }, {
      magFilter: gl.LINEAR,
      minFilter: gl.LINEAR_MIPMAP_NEAREST,
      generateMipmap: true
    }]
  })
  .then(function(textures) {
    var tMoon = textures[0];
    var tCrate = textures[1];

    // Create moon
    var moon = new Sphere({
      program: defaultProgram,
      nlat: 30,
      nlong: 30,
      radius: 2,
      uniforms: {
        hasTexture1: true,
        sampler1: tMoon,
        colors: [1, 1, 1, 1]
      }
    });

    // Create box
    var box = new Cube({
      program: defaultProgram,
      uniforms: {
        hasTexture1: true,
        sampler1: tCrate,
        colors: [1, 1, 1, 1]
      }
    });
    box.setScale(new Vec3(2, 2, 2));

    // Unpack app properties
    var lighting = $id('lighting');
    var ambient = {
      r: $id('ambientR'),
      g: $id('ambientG'),
      b: $id('ambientB')
    };
    var point = {
      x: $id('lightPositionX'),
      y: $id('lightPositionY'),
      z: $id('lightPositionZ'),

      r: $id('pointR'),
      g: $id('pointG'),
      b: $id('pointB')
    };
    var program = $id('per-fragment');
    var textures = $id('textures');
    // objects position
    var rho = 6;
    var theta = 0;

    // Add objects to the scene
    scene.add(box, moon);

    // Draw the scene
    function draw() {
      // Setup lighting
      var lights = scene.config.lights;
      lights.enable = lighting.checked;
      lights.ambient = {
        r: Number(ambient.r.value),
        g: Number(ambient.g.value),
        b: Number(ambient.b.value)
      };
      lights.points = {
        color: {
          r: Number(point.r.value),
          g: Number(point.g.value),
          b: Number(point.b.value)
        },
        position: {
          x: Number(point.x.value),
          y: Number(point.y.value),
          z: Number(point.z.value)
        }
      };

      // Set program
      if (program.checked) {
        moon.program = perpixelProgram;
        box.program = perpixelProgram;
      } else {
        moon.program = defaultProgram;
        box.program = defaultProgram;
      }

      // Set textures
      if (textures.checked) {
        moon.textures = tMoon;
        box.textures = tCrate;
      } else {
        delete moon.textures;
        delete box.textures;
      }

      // Update position
      theta += 0.01;

      moon.setPosition([rho * Math.cos(theta), 0, rho * Math.sin(theta)]);
      moon.updateMatrix();

      box.setPosition([
        rho * Math.cos(Math.PI + theta),
        0,
        rho * Math.sin(Math.PI + theta)
      ]);
      box.updateMatrix();

      var camera = new PerspectiveCamera({
        aspect: canvas.width / canvas.height,
        position: new Vec3(0, 0, -30)
      });

      // render objects
      gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
      scene.render(camera.getUniforms());

      // request new frame
      Fx.requestAnimationFrame(draw);
    }

    // Animate
    draw();

  });
};
