/* global window, document, LumaGL */
/* eslint-disable no-var, max-statements */
var createGLContext = LumaGL.createGLContext;
var loadTextures = LumaGL.loadTextures;
var Program = LumaGL.Program;
var Buffer = LumaGL.Buffer;
var PerspectiveCamera = LumaGL.PerspectiveCamera;
var Scene = LumaGL.Scene;
var Fx = LumaGL.Fx;
var Vec3 = LumaGL.Vec3;
var Sphere = LumaGL.Sphere;
var pickModels = LumaGL.pickModels;

var pick = {x: 0, y: 0};

window.webGLStart = function() {

  var canvas = document.getElementById('render-canvas');

  var gl = createGLContext({canvas});

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.viewport(0, 0, canvas.width, canvas.height);

  // rye TODO: there's a bug in merge that makes it require an object.
  var camera = new PerspectiveCamera({});

  var scene = new Scene(gl, {
    lights: {
      points: {
        color: {r: 1, g: 1, b: 1},
        position: {x: 0, y: 0, z: 32}
      },
      ambient: {r: 0.25, g: 0.25, b: 0.25},
      enable: true
    },
    backgroundColor: {r: 0, g: 0, b: 0, a: 0}
  });

  canvas.addEventListener('mousemove', function(e) {
    pick.x = e.offsetX;
    pick.y = e.offsetY;
  });

  const PLANETS = [
    {name: 'JUPITER', textureUrl: 'jupiter.jpg'},
    {name: 'MARS', textureUrl: 'mars.jpg'},
    {name: 'MERCURY', textureUrl: 'mercury.jpg'},
    {name: 'NEPTUNE', textureUrl: 'neptune.jpg'},
    {name: 'SATURN', textureUrl: 'saturn.jpg'},
    {name: 'URANUS', textureUrl: 'uranus.jpg'},
    {name: 'VENUS', textureUrl: 'venus.jpg'}
  ];

  loadTextures(gl, {
    urls: PLANETS.map(planet => planet.textureUrl),
    parameters: {
      magFilter: gl.LINEAR,
      minFilter: gl.LINEAR_MIPMAP_NEAREST,
      generateMipmap: true
    }
  })
  .then(function(textures) {
    var tJupiter = textures[0];
    var tMars = textures[1];
    var tMercury = textures[2];
    var tNeptune = textures[3];
    var tSaturn = textures[4];
    var tUranus = textures[5];
    var tVenus = textures[6];

    var program = new Program(gl);

    var jupiter = new Sphere({
      id: 'Jupiter',
      nlat: 32,
      nlong: 32,
      radius: 1,
      uniforms: {
        sampler1: tJupiter,
        hasTexture1: true,
        colors: [1, 1, 1, 1]
      },
      attributes: {
        colors: new Buffer(gl).setData({
          data: new Float32Array(10000),
          size: 4
        }),
        pickingColors: new Buffer(gl).setData({
          data: new Float32Array(10000),
          size: 3
        })
      },
      pickable: true,
      program
    });
    var mars = new Sphere({
      id: 'Mars',
      nlat: 32,
      nlong: 32,
      radius: 1,
      uniforms: {
        sampler1: tMars,
        hasTexture1: false
      },
      pickable: true,
      program
    });
    var mercury = new Sphere({
      id: 'Mercury',
      nlat: 32,
      nlong: 32,
      radius: 1,
      uniforms: {
        sampler1: tMercury,
        hasTexture1: false
      },
      pickable: true,
      program
    });
    var neptune = new Sphere({
      id: 'Neptune',
      nlat: 32,
      nlong: 32,
      radius: 1,
      uniforms: {
        sampler1: tNeptune,
        hasTexture1: false
      },
      pickable: true,
      program
    });
    var saturn = new Sphere({
      id: 'Saturn',
      nlat: 32,
      nlong: 32,
      radius: 1,
      uniforms: {
        sampler1: tSaturn,
        hasTexture1: false
      },
      pickable: true,
      program
    });
    var uranus = new Sphere({
      id: 'Uranus',
      nlat: 32,
      nlong: 32,
      radius: 1,
      uniforms: {
        sampler1: tUranus,
        hasTexture1: false
      },
      pickable: true,
      program
    });
    var venus = new Sphere({
      id: 'Venus',
      nlat: 32,
      nlong: 32,
      radius: 1,
      uniforms: {
        sampler1: tVenus,
        hasTexture1: false
      },
      pickable: true,
      program
    });

    // scene.add(jupiter, mars, mercury, neptune, saturn, uranus, venus);
    // var items = [jupiter, uranus, mars, neptune, mercury, saturn, venus];
    scene.add(jupiter);
    var items = [jupiter];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var theta = i / items.length * Math.PI * 2;
      item.position = new Vec3(Math.cos(theta) * 3, Math.sin(theta) * 3, 0);
      item.updateMatrix();
    }

    function drawFrame() {
      draw(gl, canvas, camera, scene);
      Fx.requestAnimationFrame(drawFrame);
    }
    drawFrame();
  });
};

function draw(gl, canvas, camera, scene) {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  camera.view.lookAt(
    new Vec3(0, 0, 32), new Vec3(0, 0, 0), new Vec3(0, 1, 0)
  );
  camera.projection.perspective(
    15, canvas.width / canvas.height, 0.1, 100.0
  );

  for (var i = 0; i < scene.children.length; i++) {
    var item = scene.children[i];
    item.rotation.y += 0.01;
    item.updateMatrix();
  }

  var p = null;
  // var p = pickModels(gl, {
  //   group: scene,
  //   viewMatrix: camera.view,
  //   x: pick.x,
  //   y: pick.y
  // });

  var div = document.getElementById('planet-name');
  if (p) {
    div.innerHTML = p.id;
    div.style.top = pick.y + 'px';
    div.style.left = pick.x + 'px';
    div.style.display = 'block';
  } else {
    div.style.display = 'none';
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  scene.render({camera});
}
