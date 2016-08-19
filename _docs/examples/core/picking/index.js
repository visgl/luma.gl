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
    {name: 'Jupiter', textureUrl: 'jupiter.jpg'},
    {name: 'Mars', textureUrl: 'mars.jpg'},
    {name: 'Mercury', textureUrl: 'mercury.jpg'},
    {name: 'Neptune', textureUrl: 'neptune.jpg'},
    {name: 'Saturn', textureUrl: 'saturn.jpg'},
    {name: 'Uranus', textureUrl: 'uranus.jpg'},
    {name: 'Venus', textureUrl: 'venus.jpg'}
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

    const planets = PLANETS.map(function(planet, i) {
      return new Sphere({
        id: planet.name,
        nlat: 32,
        nlong: 32,
        radius: 1,
        uniforms: {
          sampler1: textures[i],
          hasTexture1: true,
          hasTextureCube1: false,
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
    });

    for (var i = 0; i < planets.length; i++) {
      var planet = planets[i];
      var theta = i / planets.length * Math.PI * 2;
      planet.update({
        position: new Vec3(Math.cos(theta) * 3, Math.sin(theta) * 3, 0)
      });
    }

    scene.add(planets);

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

  var picked = pickModels(gl, {
    group: scene,
    viewMatrix: camera.view,
    x: pick.x,
    y: pick.y
  });

  var pickedModel = picked.find(function(model) { return model.isPicked; });

  var div = document.getElementById('planet-name');
  if (pickedModel) {
    div.innerHTML = pickedModel.model.id;
    div.style.top = pick.y + 'px';
    div.style.left = pick.x + 'px';
    div.style.display = 'block';
  } else {
    div.style.display = 'none';
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  scene.render({camera});
}
