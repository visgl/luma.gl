/* global LumaGL, document */
/* eslint-disable no-var, max-statements, prefer-template */
var GL = LumaGL.GL;
var TextureCube = LumaGL.TextureCube;
var Cube = LumaGL.Cube;
var Matrix4 = LumaGL.Matrix4;
var radians = LumaGL.radians;

var getHTMLTemplate = LumaGL.addons.getHTMLTemplate;
var Renderer = LumaGL.addons.Renderer;

var cubemap;
var cube;
var prism;

new Renderer()
.init(function init(context) {
  const gl = context.gl;

  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);
  gl.enable(GL.DEPTH_TEST);
  gl.depthFunc(GL.LEQUAL);
  gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);

  cubemap = new TextureCube(gl, {
    minFilter: gl.LINEAR_MIPMAP_LINEAR,
    magFilter: gl.LINEAR,
    data: genTextures(512),
    flipY: true,
    generateMipmap: true
  });

  cube = new Cube({
    gl,
    vs: getHTMLTemplate('cube-vs'),
    fs: getHTMLTemplate('cube-fs')
  });

  prism = new Cube({
    gl,
    vs: getHTMLTemplate('prism-vs'),
    fs: getHTMLTemplate('prism-fs')
  });
})
.frame(function frame(context) {
  const gl = context.gl;
  const tick = context.tick;
  const width = context.width;
  const height = context.height;

  gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

  const view = Matrix4.lookAt({eye: [0, 0, -1]}).translate([0, 0, 4]);
  const projection =
    new Matrix4().perspective({fov: radians(75), aspect: width / height});

  cube.render({
    uTexture: cubemap,
    uModel: new Matrix4().scale([5, 5, 5]),
    uView: view,
    uProjection: projection
  });

  var reflection = parseFloat(document.getElementById('reflection').value);
  var refraction = parseFloat(document.getElementById('refraction').value);

  prism.render({
    uTexture: cubemap,
    uModel: new Matrix4().rotateX(tick * 0.01).rotateY(tick * 0.013),
    uView: view,
    uProjection: projection,
    uReflect: reflection,
    uRefract: refraction
  });
});

function genTextures(size) {
  var signs = ['pos', 'neg'];
  var axes = ['x', 'y', 'z'];
  var textures = {
    pos: {},
    neg: {}
  };
  for (var i = 0; i < signs.length; i++) {
    var sign = signs[i];
    for (var j = 0; j < axes.length; j++) {
      var axis = axes[j];
      var canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      var ctx = canvas.getContext('2d');
      if (axis === 'x' || axis === 'z') {
        ctx.translate(size, size);
        ctx.rotate(Math.PI);
      }
      var color = 'rgb(0,64,128)';
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = 'white';
      ctx.fillRect(8, 8, size - 16, size - 16);
      ctx.fillStyle = color;
      ctx.font = size / 4 + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sign + '-' + axis, size / 2, size / 2);
      ctx.strokeStyle = color;
      ctx.strokeRect(0, 0, size, size);
      textures[sign][axis] = canvas;
    }
  }
  return textures;
}
