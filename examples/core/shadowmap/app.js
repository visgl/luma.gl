import GL from '@luma.gl/constants';
import {AnimationLoop, Framebuffer, Cube, setParameters, clear} from 'luma.gl';
import {Matrix4, radians} from 'math.gl';

const INFO_HTML = `
<p>
  Simple <b>shadow mapping</b>.
<p>
A luma.gl <code>Cube</code>, rendering into a shadowmap framebuffer
and then rendering onto the screen.
`;

const SCENE_FRAGMENT = `\
precision highp float;

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

attribute vec3 positions;
attribute vec3 normals;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform mat4 uShadowView;
uniform mat4 uShadowProj;

varying vec4 shadowCoord;
varying vec3 normal;

void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(positions, 1.0);
  normal = vec3(uModel * vec4(normals, 0.0));
  mat4 bias = mat4(
    0.5, 0.0, 0.0, 0.0,
    0.0, 0.5, 0.0, 0.0,
    0.0, 0.0, 0.5, 0.0,
    0.5, 0.5, 0.5, 1.0
  );
  shadowCoord = bias * uShadowProj * uShadowView * uModel * vec4(positions, 1.0);
}
`;

const SHADOWMAP_VERTEX = `\
#define SHADER_NAME shadowmap.vs

attribute vec3 positions;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(positions, 1.0);
}
`;

const SHADOWMAP_FRAGMENT = `\
precision highp float;

void main(void) {
  gl_FragColor = vec4(0,0,gl_FragCoord.z,1);
}
`;

// const q = 1;
// const y = -3;
// const plane = [
//   -q, y, q, q, y, q, q, y, -q,
//   -q, y, q, q, y, -q, -q, y, -q
// ];

// const planeBuffers = {
//   positions: new Buffer(gl).setData({
//     data: new Float32Array(plane),
//     size: 3
//   })
// };

export const animationLoopOptions = {
  // gl: createGLContext()})
  onInitialize: ({gl}) => {

    setParameters(gl, {
      depthTest: true,
      depthFunc: GL.LEQUAL
    });

    return {
      fbShadow: new Framebuffer(gl, {id: 'shadowmap', width: 1024, height: 1024}),
      cube: new Cube(gl, {vs: SCENE_VERTEX, fs: SCENE_FRAGMENT}),
      shadow: new Cube(gl, {vs: SHADOWMAP_VERTEX, fs: SHADOWMAP_FRAGMENT})
    };
  },

  onRender: ({gl, tick, width, height, aspect, cube, shadow, fbShadow}) => {
    const model = new Matrix4()
      .translate([0, 6, 0])
      .rotateXYZ([tick * 0.01, 0, 0])
      .rotateXYZ([0, tick * 0.013, 0]);

    const model2 = new Matrix4()
      .scale([2, -2, 2])
      .translate([0, 0, 0])
      .rotateXYZ([0, 0, tick * 0.007]);

    // Render the shadow buffer
    gl.viewport(0, 0, 1024, 1024);
    clear(gl, {framebuffer: fbShadow, color: [1, 1, 1, 1], depth: true});

    const lightPos = [0, 8, 0];
    const shadowView = new Matrix4().lookAt({eye: lightPos, center: [0, 0, 0], up: [0, 0, -1]});
    const shadowProj =
      new Matrix4().ortho({left: -4, right: 4, bottom: -4, top: 4, near: 0, far: 64});

    shadow.draw({
      framebuffer: fbShadow,
      uniforms: {
        uModel: model,
        uView: shadowView,
        uProjection: shadowProj,
        uLightPosition: lightPos
      }
    });

    // Render the screen
    gl.viewport(0, 0, width, height);
    clear(gl, {color: [0, 0.2, 0, 1], depth: true});

    const camView = new Matrix4().lookAt({eye: [0, 8, 8], center: [0, 3, 0], up: [0, 1, 0]});
    const camProj = new Matrix4().perspective({fov: radians(75), aspect, near: 0.1, far: 100});

    cube.setUniforms({
      uView: camView,
      uProjection: camProj,
      uShadowView: shadowView,
      uShadowProj: shadowProj,
      uShadowMap: fbShadow
    });

    cube.draw({
      framebuffer: null,
      uniforms: {
        uModel: model,
        uShadow: 0.0
      }
    });

    cube.draw({
      framebuffer: null,
      uniforms: {
        uModel: model2,
        uShadow: 1.0
      }
    });
  }
};

const animationLoop = new AnimationLoop(animationLoopOptions);

animationLoop.getInfo = () => INFO_HTML;

export default animationLoop;

/* global window */
if (typeof window !== 'undefined' && !window.website) {
  animationLoop.start();
}
