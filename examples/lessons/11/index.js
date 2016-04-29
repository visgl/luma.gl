/* global window, document, LumaGL */
/* eslint-disable no-var, max-statements */
window.webGLStart = function() {

  var $id = function(d) {
    return document.getElementById(d);
  };

  var createGLContext = LumaGL.createGLContext;
  var loadTextures = LumaGL.loadTextures;
  var PerspectiveCamera = LumaGL.PerspectiveCamera;
  var Program = LumaGL.Program;
  var Scene = LumaGL.Scene;
  var Events = LumaGL.Events;
  var Fx = LumaGL.Fx;
  var Vec3 = LumaGL.Vec3;
  var Sphere = LumaGL.Sphere;

  var moon;
  var pos;

  var canvas = document.getElementById('lesson11-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  var gl = createGLContext(canvas);

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.viewport(0, 0, canvas.width, canvas.height);

  var program = new Program(gl, getDefaultShaders());
  program.use();

  var camera = new PerspectiveCamera({
    aspect: canvas.width / canvas.height,
    position: new Vec3(0, 0, -7)
  });

  var scene = new Scene(gl);

  Events.create(canvas, {
    onDragStart: function(e) {
      pos = {
        x: e.x,
        y: e.y
      };
    },
    onDragMove: function(e) {
      var z = camera.position.z;
      var sign = Math.abs(z) / z;
      moon.rotation.y += -(pos.x - e.x) / 100;
      moon.rotation.x += sign * (pos.y - e.y) / 100;
      moon.update();
      pos.x = e.x;
      pos.y = e.y;
    },
    onMouseWheel: function(e) {
      e.stop();
      camera.position.z += e.wheel;
      camera.update();
    }
  });

  loadTextures(gl, {
    urls: ['moon.gif'],
    parameters: [{
      magFilter: gl.LINEAR,
      minFilter: gl.LINEAR_MIPMAP_NEAREST,
      generateMipmap: true
    }]
  })
  .then(function(textures) {

    var tMoon = textures[0];

    moon = new Sphere({
      nlat: 30,
      nlong: 30,
      radius: 2,
      textures: tMoon
    });

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

    // Add object to the scene
    scene.add(moon);

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
      lights.directional = {
        color: {
          r: Number(direction.r.value),
          g: Number(direction.g.value),
          b: Number(direction.b.value)
        },
        direction: {
          x: Number(direction.x.value),
          y: Number(direction.y.value),
          z: Number(direction.z.value)
        }
      };

      // render moon
      scene.render();
      // request new frame
      Fx.requestAnimationFrame(draw);
    }
    // Animate
    draw();
  });

};
