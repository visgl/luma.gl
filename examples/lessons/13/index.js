var webGLStart = function() {
  var $id = function(d) { return document.getElementById(d); };

  var createGLContext = LumaGL.createGLContext;
  var loadTextures = LumaGL.loadTextures;
  var makeProgramFromHTMLTemplates = LumaGL.addons.makeProgramFromHTMLTemplates;
  var Program = LumaGL.Program;
  var PerspectiveCamera = LumaGL.PerspectiveCamera;
  var Scene = LumaGL.Scene;
  var Events = LumaGL.Events;
  var Fx = LumaGL.Fx;
  var Vec3 = LumaGL.Vec3;
  var Sphere = LumaGL.Sphere;
  var Cube = LumaGL.Cube;

  var canvas = document.getElementById('lesson13-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  var gl = createGLContext(canvas);

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.viewport(0, 0, +canvas.width, +canvas.height);

  var defaultProgram = makeProgramFromDefaultShaders(gl);
  var perpixelProgram = makeProgramFromHTMLTemplates(
    gl,
    'per-fragment-lighting-vs',
    'per-fragment-lighting-fs'
  );

  var camera = new PerspectiveCamera({
    aspect: canvas.width/canvas.height,
    position: new Vec3(0, 0, -30),
  });

  var scene = new Scene(
    gl,
    {
      'vertex': defaultProgram,
      'fragment': perpixelProgram
    },
    camera,
    {
    lights: {
      directional: {
        color: {
          r: 0, g: 0, b: 0
        },
        direction: {
          x: 0, y: 0, z: 0
        }
      }
    }
  });

  Events.create(canvas, {
    onMouseWheel: function(e, info) {
      info.stop();
      var camera = this.camera;

      camera.position.z += info.wheel;
      camera.update();
    }
  });

  loadTextures(gl, {
    src: ['moon.gif', 'crate.gif'],
    parameters: [{
      magFilter: gl.LINEAR,
      minFilter: gl.LINEAR_MIPMAP_NEAREST,
      generateMipmap: true
    },{
      magFilter: gl.LINEAR,
      minFilter: gl.LINEAR_MIPMAP_NEAREST,
      generateMipmap: true
    }]
  }).then(function(textures) {
    var tMoon = textures[0];
    var tCrate = textures[1];

    // Create moon
    var moon = new Sphere({
      nlat: 30,
      nlong: 30,
      radius: 2,
      textures: tMoon,
      program: 'vertex',
      colors: [1, 1, 1, 1]
    });

    // Create box
    var box = new Cube({
      textures: tCrate,
      program: 'vertex',
      colors: [1, 1, 1, 1]
    });
    box.scale.set(2, 2, 2);

    //Unpack app properties
    var lighting = $id('lighting'),
        ambient = {
          r: $id('ambientR'),
          g: $id('ambientG'),
          b: $id('ambientB')
        },
        point = {
          x: $id('lightPositionX'),
          y: $id('lightPositionY'),
          z: $id('lightPositionZ'),

          r: $id('pointR'),
          g: $id('pointG'),
          b: $id('pointB')
        },
        program = $id('per-fragment'),
        textures = $id('textures'),
        //objects position
        rho = 6,
        theta = 0;

    //Add objects to the scene
    scene.add(box, moon);

    //Draw the scene
    function draw() {
      //Setup lighting
      var lights = scene.config.lights;
      lights.enable = lighting.checked;
      lights.ambient = {
        r: +ambient.r.value,
        g: +ambient.g.value,
        b: +ambient.b.value
      };
      lights.points = {
        color: {
          r: +point.r.value,
          g: +point.g.value,
          b: +point.b.value
        },
        position: {
          x: +point.x.value,
          y: +point.y.value,
          z: +point.z.value
        }
      };

      //Set program
      if (program.checked) {
        moon.program = perpixelProgram;
        box.program = perpixelProgram;
      } else {
        moon.program = defaultProgram;
        box.program = defaultProgram;
      }

      //Set textures
      if (textures.checked) {
        moon.textures = tMoon;
        box.textures = tCrate;
      } else {
        delete moon.textures;
        delete box.textures;
      }

      //Update position
      theta += 0.01;

      moon.position = {
        x: rho * Math.cos(theta),
        y: 0,
        z: rho * Math.sin(theta)
      };
      moon.update();

      box.position = {
        x: rho * Math.cos(Math.PI + theta),
        y: 0,
        z: rho * Math.sin(Math.PI + theta)
      };
      box.update();

      //render objects
      scene.render();

      //request new frame
      Fx.requestAnimationFrame(draw);
    }

    //Animate
    draw();

  });
}
