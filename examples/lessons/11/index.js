var webGLStart = function() {

  var $id = function(d) { return document.getElementById(d); };

  var createGLContext = PhiloGL.createGLContext;
  var loadTextures = PhiloGL.loadTextures;
  var Program = PhiloGL.Program;
  var PerspectiveCamera = PhiloGL.PerspectiveCamera;
  var Scene = PhiloGL.Scene;
  var Events = PhiloGL.Events;
  var Fx = PhiloGL.Fx;
  var Vec3 = PhiloGL.Vec3;
  var Sphere = PhiloGL.Sphere;

  var moon, pos;

  var canvas = document.getElementById('lesson11-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  var gl = createGLContext(canvas);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.viewport(0, 0, +canvas.width, +canvas.height);

  var program = Program.fromDefaultShaders(gl);
  program.use();

  var camera = new PerspectiveCamera({
    aspect: canvas.width/canvas.height,
    position: new Vec3(0, 0, -7),
  });

  var scene = new Scene(gl, program, camera);

  Events.create(canvas, {
    onDragStart: function(e) {
      pos = {
        x: e.x,
        y: e.y
      };
    },
    onDragMove: function(e) {
      var z = camera.position.z,
          sign = Math.abs(z) / z;
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
    src: ['moon.gif'],
    parameters: [{
      magFilter: gl.LINEAR,
      minFilter: gl.LINEAR_MIPMAP_NEAREST,
      generateMipmap: true
    }]
  }).then(function(textures) {

    var tMoon = textures[0];

    moon = new Sphere({
      nlat: 30,
      nlong: 30,
      radius: 2,
      textures: tMoon
    });

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
        };

    //Add object to the scene
    scene.add(moon);

    //Draw the scene
    function draw() {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      //Setup lighting
      var lights = scene.config.lights;
      lights.enable = lighting.checked;
      lights.ambient = {
        r: +ambient.r.value,
        g: +ambient.g.value,
        b: +ambient.b.value
      };
      lights.directional = {
        color: {
          r: +direction.r.value,
          g: +direction.g.value,
          b: +direction.b.value
        },
        direction: {
          x: +direction.x.value,
          y: +direction.y.value,
          z: +direction.z.value
        }
      };
      //render moon
      scene.render();
      //request new frame
      Fx.requestAnimationFrame(draw);
    }
    //Animate
    draw();
  });

}
