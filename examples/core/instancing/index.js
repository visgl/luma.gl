/* global window, document, LumaGL */
/* eslint-disable no-var, max-statements */
var getStringFromHTML = LumaGL.addons.getStringFromHTML;
var Program = LumaGL.Program;
var Cube = LumaGL.Cube;
var Mat4 = LumaGL.Mat4;
var Vec3 = LumaGL.Vec3;
var Renderer = LumaGL.Renderer;

var SIDE = 256;

new luma.Renderer()
.init(function(context) {
  var gl = context.gl;

  gl.clearColor(1, 1, 1, 1);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

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

  var instanceCount = SIDE * SIDE;

  var cube = new Cube({
    gl,
    vs: getStringFromHTML('cube-vs'),
    fs: getStringFromHTML('cube-fs'),
    attributes: {
      instanceOffsets: {
        value: new Float32Array(offsets),
        size: 2,
        instanced: 1
      },
      instanceColors: {
        value: colors,
        size: 3,
        instanced: 1
      }
    },
    isInstanced: 1,
    instanceCount
  });

  // Make availble in context for frame renderer
  return {cube};
})
.frame(function(context) {
  var gl = context.gl;

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var model = new Mat4()
    .$rotateXYZ(context.tick * 0.01, 0, 0)
    .$rotateXYZ(0, context.tick * 0.013, 0);

  var view = new Mat4().lookAt(
    new Vec3(
      Math.cos(context.tick * 0.005) * SIDE / 2,
      Math.sin(context.tick * 0.006) * SIDE / 2,
      (Math.sin(context.tick * 0.0035) + 1) * SIDE / 4 + 32),
    new Vec3(0, 0, 0),
    new Vec3(0, 1, 0)
  );
  var projection = new Mat4()
    .perspective(60, context.width / context.height, 1, 2048.0);

  context.cube.render({
    uModel: model,
    uView: view,
    uProjection: projection,
    uTime: context.tick * 0.1
  });

});

/*
import {Cube, Mat4, Vec3, Renderer} from '../..';

var SIDE = 256;

new Renderer()
.init(({gl}) => {
  gl.clearColor(1, 1, 1, 1);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  const colors = new Float32Array(SIDE * SIDE * 3)
    .map(e => Math.random() * 0.75 + 0.25);

  const offsets = [];
  for (let i = 0; i < SIDE; i++) {
    const x = (-SIDE + 1) * 3 / 2 + i * 3;
    for (let j = 0; j < SIDE; j++) {
      const y = (-SIDE + 1) * 3 / 2 + j * 3;
      offsets.push(x, y);
    }
  }

  var instanceCount = SIDE * SIDE;

  var cube = new Cube({
    gl,
    vs: `
      attribute vec3 positions;
      attribute vec3 normals;
      attribute vec2 instanceOffsets;
      attribute vec3 instanceColors;

      uniform mat4 uModel;
      uniform mat4 uView;
      uniform mat4 uProjection;
      uniform float uTime;

      varying vec3 color;
      varying vec3 normal;

      void main(void) {
        float d = length(instanceOffsets);
        vec4 offset = vec4(instanceOffsets, sin((uTime + d) * 0.1) * 16.0,0);
        gl_Position = uProjection * uView * (uModel * vec4(positions, 1.0) + offset);
        normal = vec3(uModel * vec4(normals, 1.0));
        color = instanceColors;
      }`,
    fs: `
      #ifdef GL_ES
      precision highp float;
      #endif

      varying vec3 color;
      varying vec3 normal;

      void main(void) {
        float d = abs(dot(normalize(normal), normalize(vec3(1,1,2))));
        gl_FragColor = vec4(d * color,1);
      }`,
    attributes: {
      instanceOffsets: {
        value: new Float32Array(offsets),
        size: 2,
        instanced: 1
      },
      instanceColors: {
        value: colors,
        size: 3,
        instanced: 1
      }
    },
    isInstanced: 1,
    instanceCount
  });

  // Make availble in context for frame renderer
  return {cube};
})
.frame(({gl, cube, tick, width, height}) => {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const view = new Mat4().lookAt(
    [
      Math.cos(tick * 0.005) * SIDE / 2,
      Math.sin(tick * 0.006) * SIDE / 2,
      (Math.sin(tick * 0.0035) + 1) * SIDE / 4 + 32
    ],
    [0, 0, 0],
    [0, 1, 0]
  );

  context.cube.render({
    uModel: new Mat4().rotateX(tick * 0.01).rotateY(tick * 0.013),
    uView: view,
    uProjection: new Mat4().perspective(60, width / height, 1, 2048.0),
    uTime: tick * 0.1
  });
});
*/