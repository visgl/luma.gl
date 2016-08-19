/* global LumaGL, window, document */
/* eslint-disable no-var, max-statements */
var createGLContext = LumaGL.createGLContext;
var Program = LumaGL.Program;
var getShadersFromHTML = LumaGL.addons.getShadersFromHTML;
var PerspectiveCamera = LumaGL.PerspectiveCamera;
var TextureCube = LumaGL.TextureCube;
var Cube = LumaGL.Cube;
var Mat4 = LumaGL.Mat4;
var Fx = LumaGL.Fx;

window.webGLStart = function webGLStart() {

  var canvas = document.getElementById('render-canvas');

  var gl = createGLContext({canvas});

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  var textures = genTextures(512);

  var cubemap = new TextureCube(gl, {
    minFilter: gl.LINEAR_MIPMAP_LINEAR,
    magFilter: gl.LINEAR,
    data: textures,
    flipY: true,
    generateMipmap: true
  });

  var cube = new Cube({
    program: new Program(gl, getShadersFromHTML({
      vs: 'cube-vs',
      fs: 'cube-fs'
    }))
  });

  var prism = new Cube({
    program: new Program(gl, getShadersFromHTML({
      vs: 'prism-vs',
      fs: 'prism-fs'
    }))
  });

  var tick = 0;

  function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    var camera = new PerspectiveCamera({
      fov: 75,
      aspect: canvas.width / canvas.height
    });
    camera.view.$translate(0, 0, -4);

    tick++;
    var modelMatrix = new Mat4();
    modelMatrix.$scale(5, 5, 5);
    cube
      .setUniforms({
        uTexture: cubemap.bind(0),
        uModel: modelMatrix,
        uView: camera.view,
        uProjection: camera.projection
      })
      .render();

    // gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

    var reflection = parseFloat(document.getElementById('reflection').value);
    var refraction = parseFloat(document.getElementById('refraction').value);

    modelMatrix = new Mat4();
    modelMatrix.$rotateXYZ(tick * 0.01, 0, 0);
    modelMatrix.$rotateXYZ(0, tick * 0.013, 0);
    prism
      .setUniforms({
        uTexture: cubemap.bind(0),
        uModel: modelMatrix,
        uView: camera.view,
        uProjection: camera.projection,
        uReflect: reflection,
        uRefract: refraction
      })
      .render();

    Fx.requestAnimationFrame(render);
  }

  render();
};

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
