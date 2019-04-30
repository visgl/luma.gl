import GL from '@luma.gl/constants';
import {
  AnimationLoop,
  Texture2D,
  setParameters,
  Model,
  SphereGeometry,
  CubeGeometry
} from '@luma.gl/core';
import {Matrix4, radians} from 'math.gl';

const INFO_HTML = `
<p>
  <a href="http://learningwebgl.com/blog/?p=1523" target="_blank">
  Per-fragment lighting and multiple programs
  </a>
<p>
  The classic WebGL Lessons in luma.gl
`;

const FRAGMENT_LIGHTING_VERTEX_SHADER = `\
precision highp float;
attribute vec3 positions;
attribute vec3 normals;
attribute vec2 texCoords;

uniform mat4 uMMatrix;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;

varying vec2 vTextureCoord;
varying vec4 vTransformedNormal;
varying vec4 vPosition;

void main(void) {
  vPosition = uMMatrix * vec4(positions, 1.0);
  gl_Position = uPMatrix * uVMatrix * vPosition;
  vTextureCoord = texCoords;
  vTransformedNormal = uMMatrix * vec4(normals, 0.0);
}
`;

const FRAGMENT_LIGHTING_FRAGMENT_SHADER = `\
precision highp float;

uniform vec3 uAmbientColor;

uniform vec3 uPointLightingLocation;
uniform vec3 uPointLightingColor;

uniform bool uUseLighting;
uniform bool uUseTextures;

varying vec2 vTextureCoord;
varying vec4 vTransformedNormal;
varying vec4 vPosition;

uniform sampler2D uSampler;

void main(void) {
  vec3 lightWeighting;

  if (!uUseLighting) {
    lightWeighting = vec3(1.0, 1.0, 1.0);
  } else {
    vec3 lightDirection = normalize(uPointLightingLocation - vPosition.xyz);
    float pointLightWeighting = max(dot(vTransformedNormal.xyz, lightDirection), 0.0);
    lightWeighting = uAmbientColor + uPointLightingColor * pointLightWeighting;
  }

  vec4 fragmentColor;
  if (uUseTextures) {
    fragmentColor = texture2D(uSampler, vec2(1.0 - vTextureCoord.s, 1.0 - vTextureCoord.t));
  } else {
    fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
  gl_FragColor = vec4(fragmentColor.rgb * lightWeighting, fragmentColor.a);
}
`;

const appState = {
  moonRotationMatrix: new Matrix4().rotateY(radians(180)).translate([2, 0, 0]),
  cubeRotationMatrix: new Matrix4().translate([1.25, 0, 0]),
  lastTime: 0
};

export default class AppAnimationLoop extends AnimationLoop {
  static getInfo() {
    return INFO_HTML;
  }

  onInitialize({canvas, gl}) {
    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true
    });

    const moonTexture = new Texture2D(gl, 'moon.gif');
    const crateTexture = new Texture2D(gl, 'crate.gif');

    const moon = new Model(gl, {
      fs: FRAGMENT_LIGHTING_FRAGMENT_SHADER,
      vs: FRAGMENT_LIGHTING_VERTEX_SHADER,
      geometry: new SphereGeometry({
        nlat: 30,
        nlong: 30,
        radius: 2
      }),
      uniforms: {
        uSampler: moonTexture
      }
    });

    const cube = new Model(gl, {
      fs: FRAGMENT_LIGHTING_FRAGMENT_SHADER,
      vs: FRAGMENT_LIGHTING_VERTEX_SHADER,
      geometry: new CubeGeometry(),
      uniforms: {
        uSampler: crateTexture
      }
    });

    return {moon, cube};
  }

  // eslint-disable-next-line complexity
  onRender({gl, tick, aspect, moon, cube}) {
    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    // set camera position
    const eyePos = new Matrix4().rotateX(radians(-30)).transformVector3([0, 0, 10]);

    const uVMatrix = new Matrix4().lookAt({eye: eyePos, center: [0, 0, 0], up: [0, 1, 0]});

    const useLighting = true;
    const useTextures = true;
    const ambientColor = [0.1, 0.1, 0.1];
    const pointLightingLocation = [4, 4, 4];
    const pointLightColor = [1.0, 0.8, 0.8];

    moon.setUniforms({
      uUseLighting: useLighting,
      uUseTextures: useTextures
    });

    cube.setUniforms({
      uUseLighting: useLighting,
      uUseTextures: useTextures
    });

    if (useLighting) {
      moon.setUniforms({
        uAmbientColor: ambientColor,
        uPointLightingLocation: pointLightingLocation,
        uPointLightingColor: pointLightColor
      });

      cube.setUniforms({
        uAmbientColor: ambientColor,
        uPointLightingLocation: pointLightingLocation,
        uPointLightingColor: pointLightColor
      });
    }

    moon
      .setUniforms({
        uMMatrix: appState.moonRotationMatrix,
        uVMatrix,
        uPMatrix: new Matrix4().perspective({
          fov: (45 * Math.PI) / 180,
          aspect,
          near: 0.1,
          far: 100
        })
      })
      .draw();

    cube
      .setUniforms({
        uMMatrix: appState.cubeRotationMatrix,
        uVMatrix,
        uPMatrix: new Matrix4().perspective({
          fov: (45 * Math.PI) / 180,
          aspect,
          near: 0.1,
          far: 100
        })
      })
      .draw();

    animate(appState);
  }
}

function animate(state) {
  const timeNow = new Date().getTime();
  if (state.lastTime !== 0) {
    const elapsed = timeNow - state.lastTime;
    const newMatrix = new Matrix4().rotateY(radians(elapsed / 20));
    state.moonRotationMatrix.multiplyLeft(newMatrix);
    state.cubeRotationMatrix.multiplyLeft(newMatrix);
  }
  state.lastTime = timeNow;
}

/* global window */
if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
