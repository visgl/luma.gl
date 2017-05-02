/* global LumaGL */
/* eslint-disable no-var, max-statements, indent, no-multi-spaces */
const {GL, AnimationLoop, createGLContext, loadTextures} = LumaGL;
const {Cube, Matrix4} = LumaGL;

const VERTEX_SHADER = `\
attribute vec3 positions;
attribute vec2 texCoords;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec2 vTextureCoord;
void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(positions, 1.0);
  vTextureCoord = texCoords;
}
`;

const FRAGMENT_SHADER = `\
#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;

uniform sampler2D uSampler;

void main(void) {
  gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
}
`;

new AnimationLoop()
.context(() => createGLContext({canvas: 'lesson05-canvas'}))
.init(({gl}) => {
  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);
  gl.enable(GL.DEPTH_TEST);
  gl.depthFunc(GL.LEQUAL);
  gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);

  return loadTextures(gl, {
    urls: ['nehe.gif']
  })
  .then(textures => ({
    cube: new Cube({
      gl,
      vs: VERTEX_SHADER,
      fs: FRAGMENT_SHADER,
      uniforms: {uSampler: textures[0]}
    })
  }));
})
.frame(({gl, tick, aspect, cube}) => {
  gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

  cube.render({
    uPMatrix: Matrix4.perspective({aspect}),
    uMVMatrix: Matrix4
      .lookAt({eye: [0, 0, 0]})
      .translate([0, 0, -5])
      .rotateXYZ([tick * 0.01, tick * 0.01, tick * 0.01])
  });
});
