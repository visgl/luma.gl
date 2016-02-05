var webGLStart = function() {

  var $id = function(d) { return document.getElementById(d); };

  var createGLContext = LumaGL.createGLContext;
  var loadTextures = LumaGL.loadTextures;
  var Program = LumaGL.Program;
  var PerspectiveCamera = LumaGL.PerspectiveCamera;
  var Scene = LumaGL.Scene;
  var Events = LumaGL.Events;
  var Fx = LumaGL.Fx;
  var Vec3 = LumaGL.Vec3;
  var Sphere = LumaGL.Sphere;
  var Cube = LumaGL.Cube;

  var canvas = document.getElementById('render-canvas');

  var gl = createGLContext(canvas);

  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.viewport(0, 0, +canvas.width, +canvas.height);

  var program = Program.fromDefaultShaders(gl);
  program.use();


  // rye TODO: there's a bug in merge that makes it require an object.
  var camera = new PerspectiveCamera({});

  var scene = new Scene(gl, program, camera, {
    lights: {
      points: {
        color: {
          r: 1, g: 1, b: 1
        },
        position: {
          x: 0, y: 0, z: 32
        }
      },
      ambient: {
        r: 0.25, g: 0.25, b: 0.25
      },
      enable: true
    }
  });

  var pick = {x: 0, y: 0};
  canvas.addEventListener('mousemove', function(e) {
    pick.x = e.offsetX;
    pick.y = e.offsetY;
  });

  loadTextures(gl, {
    src: ['jupiter.jpg', 'mars.jpg', 'mercury.jpg', 'neptune.jpg', 'saturn.jpg', 'uranus.jpg', 'venus.jpg'],
    parameters: [{
      magFilter: gl.LINEAR,
      minFilter: gl.LINEAR_MIPMAP_NEAREST,
      generateMipmap: true
    },{
      magFilter: gl.LINEAR,
      minFilter: gl.LINEAR_MIPMAP_NEAREST,
      generateMipmap: true
    },{
      magFilter: gl.LINEAR,
      minFilter: gl.LINEAR_MIPMAP_NEAREST,
      generateMipmap: true
    },{
      magFilter: gl.LINEAR,
      minFilter: gl.LINEAR_MIPMAP_NEAREST,
      generateMipmap: true
    },{
      magFilter: gl.LINEAR,
      minFilter: gl.LINEAR_MIPMAP_NEAREST,
      generateMipmap: true
    },{
      magFilter: gl.LINEAR,
      minFilter: gl.LINEAR_MIPMAP_NEAREST,
      generateMipmap: true
    },{
      magFilter: gl.LINEAR,
      minFilter: gl.LINEAR_MIPMAP_NEAREST,
      generateMipmap: true
    }]
  }).then(function(textures) {
    var tJupiter = textures[0];
    var tMars = textures[1];
    var tMercury = textures[2];
    var tNeptune = textures[3];
    var tSaturn = textures[4];
    var tUranus = textures[5];
    var tVenus = textures[6];

    jupiter = new Sphere({
      nlat: 32,
      nlong: 32,
      radius: 1,
      textures: tJupiter,
      pickable: true
    });
    jupiter.name = 'Jupiter';
    mars = new Sphere({
      nlat: 32,
      nlong: 32,
      radius: 1,
      textures: tMars,
      pickable: true
    });
    mars.name = 'Mars';
    mercury = new Sphere({
      nlat: 32,
      nlong: 32,
      radius: 1,
      textures: tMercury,
      pickable: true
    });
    mercury.name = 'Mercury';
    neptune = new Sphere({
      nlat: 32,
      nlong: 32,
      radius: 1,
      textures: tNeptune,
      pickable: true
    });
    neptune.name = 'Neptune';
    saturn = new Sphere({
      nlat: 32,
      nlong: 32,
      radius: 1,
      textures: tSaturn,
      pickable: true
    });
    saturn.name = 'Saturn';
    uranus = new Sphere({
      nlat: 32,
      nlong: 32,
      radius: 1,
      textures: tUranus,
      pickable: true
    });
    uranus.name = 'Uranus';
    venus = new Sphere({
      nlat: 32,
      nlong: 32,
      radius: 1,
      textures: tVenus,
      pickable: true
    });
    venus.name = 'Venus';

    scene.add(jupiter, mars, mercury, neptune, saturn, uranus, venus);

    var items = [jupiter, uranus, mars, neptune, mercury, saturn, venus];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var theta = i/items.length * Math.PI*2;
      item.position = new Vec3(Math.cos(theta) * 3, Math.sin(theta) * 3, 0);
      item.update();
    }

    function draw() {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      camera.view.lookAt(new Vec3(0,0,32), new Vec3(0,0,0), new Vec3(0,1,0));
      camera.projection.perspective(15, canvas.width/canvas.height, 0.1, 100.0);

      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        item.rotation.y += 0.01;
        item.update();
      }

      var p = scene.pick(pick.x, pick.y);
      div = document.getElementById('planet-name');
      if (p) {
        div.innerHTML = p.name;
        div.style.top = pick.y + 'px';
        div.style.left = pick.x + 'px';
        div.style.display = 'block';
      } else {
        div.style.display = 'none';
      }

      gl.viewport(0,0,canvas.width,canvas.height);
      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      program.use();
      scene.render();

      Fx.requestAnimationFrame(draw);
    }

    draw();
  });
}
