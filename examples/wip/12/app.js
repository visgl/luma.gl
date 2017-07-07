/* global window, document, LumaGL */
/* eslint-disable no-var, max-statements, array-bracket-spacing,
   no-multi-spaces */
var createGLContext = LumaGL.createGLContext;
var loadTextures = LumaGL.loadTextures;
var Program = LumaGL.Program;
var PerspectiveCamera = LumaGL.PerspectiveCamera;
var Scene = LumaGL.Scene;
var addEvents = LumaGL.addEvents;
var Fx = LumaGL.Fx;
var Vec3 = LumaGL.Vec3;
var Sphere = LumaGL.Sphere;
var Cube = LumaGL.Cube;

var $id = function(d) {
  return document.getElementById(d);
};

window.webGLStart = function() {

  var moon;
  var box;

  var canvas = document.getElementById('lesson12-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  var gl = createGLContext({canvas});

  // Basic gl setup
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.viewport(0, 0, canvas.width, canvas.height);

  var camera = new PerspectiveCamera({
    aspect: canvas.width / canvas.height,
    position: new Vec3(0, 0, 30)
  });

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
      [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
      [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_NEAREST,
      mipmap: true
    }, {
      [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
      [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_NEAREST,
      mipmap: true
    }]
  })
  .then(function(textures) {
    var tMoon = textures[0];
    var tCrate = textures[1];

    // Create moon
    moon = new Sphere(gl, {
      nlat: 30,
      nlong: 30,
      radius: 2,
      program: new Program(gl),
      uniforms: {
        hasTexture1: true,
        sampler1: tMoon
      }
    });
    // Create box
    box = new Cube({
      program: new Program(gl),
      uniforms: {
        hasTexture1: true,
        sampler1: tCrate
      }
    });
    box.scale.set(2, 2, 2);

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
    // objects position
    var rho = 6;
    var theta = 0;

    // Add objects to the scene
    scene.add(moon, box);

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
      // Update position
      theta += 0.01;

      moon
        .setPosition([
          rho * Math.cos(theta),
          0,
          rho * Math.sin(theta)
        ])
        .updateMatrix();

      box
        .setPosition([
          rho * Math.cos(Math.PI + theta),
          0,
          rho * Math.sin(Math.PI + theta)
        ])
        .updateMatrix();

      // render objects
      scene.render(camera.getUniforms());

      // request frame
      Fx.requestAnimationFrame(draw);
    }

    // Animate
    draw();
  });
};
