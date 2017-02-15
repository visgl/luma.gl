// import 'babel-polyfill';
// import {GL, Program, Buffer, Framebuffer, Cube, Mat4, Vec3, Renderer}
//   from '../../../../src/index.js';

/* global LumaGL */
const {AnimationFrame, createGLContext} = LumaGL;
const {GL, Program, Buffer, Framebuffer, Cube, Mat4, Vec3} = LumaGL;


const SCENE_FRAGMENT = `\
#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D uShadowMap;
uniform float uShadow;

varying vec4 shadowCoord;
varying vec3 normal;

void main(void) {
  float d = clamp(dot(normalize(normal), vec3(0,1,0)), 0.25, 1.0);
  float s = 1.0;
  if (texture2D(uShadowMap, shadowCoord.xy).z < shadowCoord.z - 0.005) {
    s -= 0.5 * uShadow;
  }
  float c = d * s;
  gl_FragColor = vec4(c,c,c,1);
}
`;

const SCENE_VERTEX = `\
#define SHADER_NAME scene.vs

attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform mat4 uShadowView;
uniform mat4 uShadowProj;

varying vec4 shadowCoord;
varying vec3 normal;

void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
  normal = vec3(uModel * vec4(aNormal, 0.0));
  mat4 bias = mat4(
    0.5, 0.0, 0.0, 0.0,
    0.0, 0.5, 0.0, 0.0,
    0.0, 0.0, 0.5, 0.0,
    0.5, 0.5, 0.5, 1.0
  );
  shadowCoord = bias * uShadowProj * uShadowView * uModel * vec4(aPosition, 1.0);
}
`;

const SHADOWMAP_VERTEX = `\
#define SHADER_NAME shadowmap.vs

attribute vec3 aPosition;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
}
`;

const SHADOWMAP_FRAGMENT = `\
#ifdef GL_ES
precision highp float;
#endif

void main(void) {
  gl_FragColor = vec4(0,0,gl_FragCoord.z,1);
}
`;

let fbShadow;
let programScene;
let programShadow;
let cubeBuffers;

new AnimationFrame({gl: createGLContext()})
.init(({gl}) => {
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  fbShadow = new Framebuffer(gl, {
    width: 1024,
    height: 1024
    // type: gl.FLOAT
  });

  const q = 1;
  const y = -3;
  const plane = [
    -q, y, q, q, y, q, q, y, -q,
    -q, y, q, q, y, -q, -q, y, -q
  ];

  const planeBuffers = {
    aPosition: new Buffer(gl).setData({
      data: new Float32Array(plane),
      size: 3
    })
  };

  const cubeModel = new Cube({gl});

  cubeBuffers = {
    aPosition: new Buffer(gl).setData({
      data: new Float32Array(cubeModel.vertices),
      size: 3
    }),
    aNormal: new Buffer(gl).setData({
      data: new Float32Array(cubeModel.normals),
      size: 3
    }),
    indices: new Buffer(gl).setData({
      target: GL.ELEMENT_ARRAY_BUFFER,
      data: cubeModel.indices,
      size: 1
    })
  };

  programScene = new Program(gl, {
    vs: SCENE_VERTEX,
    fs: SCENE_FRAGMENT
  });
  programShadow = new Program(gl, {
    vs: SHADOWMAP_VERTEX,
    fs: SHADOWMAP_FRAGMENT
  });
})
.frame(({gl, tick, width, height}) => {

  const model = new Mat4()
    .$translate(0, 6, 0)
    .$rotateXYZ(tick * 0.01, 0, 0)
    .$rotateXYZ(0, tick * 0.013, 0);

  const m2 = new Mat4()
    .scale(2, 2, 2)
    .translate(0, 0, 0)
    .$rotateXYZ(0, 0, tick * 0.007);

  // Render the shadow buffer
  fbShadow.bind();

  gl.viewport(0, 0, 1024, 1024);
  gl.clearColor(1, 1, 1, 1);
  gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

  const lightPos = new Vec3(0, 8, 0);
  const sdwView = new Mat4()
    .lookAt(lightPos, new Vec3(0, 0, 0), new Vec3(0, 0, -1));
  const sdwProj = new Mat4()
    .ortho(-4, 4, 4, -4, 0, 64);
  programShadow
    .use()
    .setBuffers(cubeBuffers)
    .setUniforms({
      uModel: model,
      uView: sdwView,
      uProjection: sdwProj,
      uLightPosition: lightPos
    });
  gl.drawElements(gl.TRIANGLES, cubeModel.$indicesLength, gl.UNSIGNED_SHORT, 0);

  gl.bindFramebuffer(GL.FRAMEBUFFER, null);

  // Render the screen
  gl.viewport(0, 0, width, height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
  const camView =
    new Mat4().lookAt(new Vec3(0, 8, 8), new Vec3(0, 3, 0), new Vec3(0, 1, 0));
  const camProj =
    new Mat4().perspective(75, width / height, 0.1, 100);

  programScene
    .use()
    .setBuffers(cubeBuffers)
    .setUniforms({
      uModel: model,
      uView: camView,
      uProjection: camProj,
      uShadowView: sdwView,
      uShadowProj: sdwProj,
      uShadowMap: fbShadow.texture
    });
  programScene.render({uShadow: 0.0});
  // gl.drawElements(gl.TRIANGLES, cubeModel.$indicesLength, gl.UNSIGNED_SHORT, 0);

  programScene.render({
    uModel: m2,
    uShadow: 1.0
  });
  // gl.drawElements(gl.TRIANGLES, cubeModel.$indicesLength, gl.UNSIGNED_SHORT, 0);
});
