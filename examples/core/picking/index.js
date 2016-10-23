/* global document, LumaGL */
/* eslint-disable no-var, max-statements, prefer-template, object-shorthand */
var GL = LumaGL.GL;
var loadTextures = LumaGL.loadTextures;
var Program = LumaGL.Program;
var Buffer = LumaGL.Buffer;
var Scene = LumaGL.Scene;
var Sphere = LumaGL.Sphere;
var Vec3 = LumaGL.Vec3;
var Matrix4 = LumaGL.Matrix4;
var radians = LumaGL.radians;
var pickModels = LumaGL.pickModels;
var Renderer = LumaGL.addons.Renderer;

var pick = {x: 0, y: 0};

var scene;

new Renderer()
.init(function init(context) {
  const gl = context.gl;
  const canvas = context.canvas;

  gl.enable(GL.DEPTH_TEST);
  gl.depthFunc(GL.LEQUAL);

  scene = new Scene(gl, {
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

  canvas.addEventListener('mousemove', function mousemove(e) {
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
  .then(function onTexturesLoaded(textures) {
    var program = new Program(gl);

    const planets = PLANETS.map(function map(planet, i) {
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
  });
})
.frame(function frame(context) {
  const gl = context.gl;
  const width = context.width;
  const height = context.height;

  const projection =
     new Matrix4().perspective({fov: radians(15), aspect: width / height});
  const view = new Matrix4().lookAt({eye: [0, 0, 32]});

  for (var i = 0; i < scene.children.length; i++) {
    var item = scene.children[i];
    item.rotation.y += 0.01;
    item.updateMatrix();
  }

  const uniforms = {
    projectionMatrix: projection,
    viewMatrix: view
  };

  scene.render(uniforms);

  var picked = pickModels(gl, {
    group: scene,
    uniforms,
    x: pick.x,
    y: pick.y
  });

  var pickedModel = picked.find(function find(model) {
    return model.isPicked;
  });

  var div = document.getElementById('planet-name');
  if (pickedModel) {
    div.innerHTML = pickedModel.model.id;
    div.style.top = pick.y + 'px';
    div.style.left = pick.x + 'px';
    div.style.display = 'block';
  } else {
    div.style.display = 'none';
  }
});
