/* global LumaGL */
/* eslint-disable no-var, max-statements */
var GL = LumaGL.GL;
var Cube = LumaGL.Cube;
var Matrix4 = LumaGL.Matrix4;
var radians = LumaGL.radians;
var Renderer = LumaGL.addons.Renderer;
var getHTMLTemplate = LumaGL.addons.getHTMLTemplate;

var SIDE = 256;

new Renderer()
.init(function init(context) {
  var gl = context.gl;

  gl.clearColor(1, 1, 1, 1);
  gl.clearDepth(1);
  gl.enable(GL.DEPTH_TEST);
  gl.depthFunc(GL.LEQUAL);

  var colors = new Float32Array(SIDE * SIDE * 3)
    .map(e => Math.random() * 0.75 + 0.25);

  var offsets = [];
  for (var i = 0; i < SIDE; i++) {
    var x = (-SIDE + 1) * 3 / 2 + i * 3;
    for (var j = 0; j < SIDE; j++) {
      var y = (-SIDE + 1) * 3 / 2 + j * 3;
      offsets.push(x, y);
    }
  }
  offsets = new Float32Array(offsets);

  return {
    cube: new Cube({
      gl,
      vs: getHTMLTemplate('cube-vs'),
      fs: getHTMLTemplate('cube-fs'),
      attributes: {
        instanceOffsets: {value: offsets, size: 2, instanced: 1},
        instanceColors: {value: colors, size: 3, instanced: 1}
      },
      isInstanced: 1,
      instanceCount: SIDE * SIDE
    })
  };
})
.frame(function frame(context) {
  var gl = context.gl;
  var tick = context.tick;
  var cube = context.cube;

  gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

  cube.render({
    uTime: tick * 0.1,
    uModel: new Matrix4()
      .rotateX(tick * 0.01)
      .rotateY(tick * 0.013),
    uView: new Matrix4()
      .lookAt({eye: [
        Math.cos(tick * 0.005) * SIDE / 2,
        Math.sin(tick * 0.006) * SIDE / 2,
        (Math.sin(tick * 0.0035) + 1) * SIDE / 4 + 32
      ]}),
    uProjection: new Matrix4()
      .perspective({
        fov: radians(60),
        aspect: context.width / context.height,
        near: 1,
        far: 2048.0
      })
  });
});
