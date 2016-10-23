/* global LumaGL */
/* eslint-disable no-var, max-statements, indent, no-multi-spaces */
var GL = LumaGL.GL;
var loadTextures = LumaGL.loadTextures;
var Cube = LumaGL.Cube;
var Matrix4 = LumaGL.Matrix4;

var getHTMLTemplate = LumaGL.addons.getHTMLTemplate;
var Renderer = LumaGL.addons.Renderer;

var cube;

new Renderer()
.init(function init(context) {
  const gl = context.gl;

  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);
  gl.enable(GL.DEPTH_TEST);
  gl.depthFunc(GL.LEQUAL);
  gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);

  return loadTextures(gl, {
    urls: ['nehe.gif']
  })
  .then(function onTexturesLoaded(textures) {
    cube = new Cube({
      gl,
      vs: getHTMLTemplate('shader-vs'),
      fs: getHTMLTemplate('shader-fs'),
      uniforms: {uSampler: textures[0]}
    });
  });
})
.frame(function frame(context) {
  const gl = context.gl;
  const tick = context.tick;

  gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

  cube.render({
    uPMatrix: Matrix4.perspective({aspect: context.width / context.height}),
    uMVMatrix: Matrix4
      .lookAt({eye: [0, 0, 0]})
      .translate([0, 0, -5])
      .rotateXYZ([tick * 0.01, tick * 0.01, tick * 0.01])
  });
});
