/* global window, document, LumaGL */
/* eslint-disable no-var, max-statements */
var createGLContext = LumaGL.createGLContext;
var loadTextures = LumaGL.loadTextures;
var Program = LumaGL.Program;
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
      nlat: 32,
      nlong: 32,
      radius: 1,
      textures: [tJupiter],
      pickable: true,
      program
    });
    jupiter.name = 'Jupiter';
    var mars = new Sphere({
      nlat: 32,
      nlong: 32,
      radius: 1,
      textures: tMars,
      pickable: true,
      program
    });
    mars.name = 'Mars';
    var mercury = new Sphere({
      nlat: 32,
      nlong: 32,
      radius: 1,
      textures: tMercury,
      pickable: true,
      program
    });
    mercury.name = 'Mercury';
    var neptune = new Sphere({
      nlat: 32,
      nlong: 32,
      radius: 1,
      textures: tNeptune,
      pickable: true,
      program
    });
    neptune.name = 'Neptune';
    var saturn = new Sphere({
      nlat: 32,
      nlong: 32,
      radius: 1,
      textures: tSaturn,
      pickable: true,
      program
    });
    saturn.name = 'Saturn';
    var uranus = new Sphere({
      nlat: 32,
      nlong: 32,
      radius: 1,
      textures: tUranus,
      pickable: true,
      program
    });
    uranus.name = 'Uranus';
    var venus = new Sphere({
      nlat: 32,
      nlong: 32,
      radius: 1,
      textures: tVenus,
      pickable: true,
      program
    });
    venus.name = 'Venus';

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
    div.innerHTML = p.name;
    div.style.top = pick.y + 'px';
    div.style.left = pick.x + 'px';
    div.style.display = 'block';
  } else {
    div.style.display = 'none';
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  scene.render({camera});
}
