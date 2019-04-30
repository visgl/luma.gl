import GL from '@luma.gl/constants';
import {
  AnimationLoop,
  Texture2D,
  setParameters,
  Model,
  SphereGeometry,
  CubeGeometry
} from '@luma.gl/core';
import {Vector3, Matrix4, radians} from 'math.gl';
/* eslint-disable complexity */

const VERTEX_SHADER = `\
attribute vec3 positions;
attribute vec3 normals;
attribute vec2 texCoords;

uniform mat4 uMMatrix;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;

uniform vec3 uAmbientColor;

uniform vec3 uPointLightingLocation;
uniform vec3 uPointLightingColor;

uniform bool uUseLighting;

varying vec2 vTextureCoord;
varying vec3 vLightWeighting;

void main(void) {
    vec4 mPosition = uMMatrix * vec4(positions, 1.0);
    gl_Position = uPMatrix * uVMatrix * mPosition;
    vTextureCoord = texCoords;

    if (!uUseLighting) {
        vLightWeighting = vec3(1.0, 1.0, 1.0);
    } else {
        vec3 lightDirection = normalize(uPointLightingLocation - mPosition.xyz);
        vec4 transformedNormal = uMMatrix * vec4(normals, 0.0);
        float pointLightWeighting = max(dot(transformedNormal.xyz, lightDirection), 0.0);
        vLightWeighting = uAmbientColor + uPointLightingColor * pointLightWeighting;
    }
}
`;

const FRAGMENT_SHADER = `\
precision highp float;

varying vec2 vTextureCoord;
varying vec3 vLightWeighting;

uniform sampler2D uSampler;

void main(void) {
  vec4 textureColor = texture2D(uSampler, vec2(1.0 - vTextureCoord.s, 1.0 - vTextureCoord.t));
  gl_FragColor = vec4(textureColor.rgb * vLightWeighting, textureColor.a);
}
`;

const INFO_HTML = `
<p>
  <a href="http://learningwebgl.com/blog/?p=1359" target="_blank">
  Point lighting
  </a>
<p>
  The classic WebGL Lessons in luma.gl
`;

const appState = {
  moonRotationMatrix: new Matrix4().rotateY(radians(180)).translate([5, 0, 0]),
  cubeRotationMatrix: new Matrix4().translate([5, 0, 0]),
  lastTime: 0
};

function animateAppState() {
  const timeNow = Date.now();
  if (appState.lastTime !== 0) {
    const elapsed = timeNow - appState.lastTime;
    const newMatrix = new Matrix4().rotateY(radians(elapsed / 20));
    appState.moonRotationMatrix.multiplyLeft(newMatrix);
    appState.cubeRotationMatrix.multiplyLeft(newMatrix);
  }
  appState.lastTime = timeNow;
}

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

    return {
      moon: new Model(gl, {
        geometry: new SphereGeometry({
          nlat: 30,
          nlong: 30,
          radius: 2
        }),
        fs: FRAGMENT_SHADER,
        vs: VERTEX_SHADER,
        uniforms: {
          uSampler: new Texture2D(gl, 'moon.gif')
        }
      }),
      cube: new Model(gl, {
        geometry: new CubeGeometry(),
        vs: VERTEX_SHADER,
        fs: FRAGMENT_SHADER,
        uniforms: {
          uSampler: new Texture2D(gl, 'crate.gif')
        }
      })
    };
  }

  onRender({gl, tick, aspect, moon, cube}) {
    // eslint-disable-line complexity
    // set camera position
    const eyePos = [0, 0, 20];

    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    const uVMatrix = new Matrix4().lookAt({eye: eyePos, center: [0, 0, 0], up: [0, 1, 0]});

    /* global document */
    function getElementValue(id, defaultValue) {
      const element = document.getElementById(id);
      return element ? element.value : defaultValue;
    }

    const element = document.getElementById('lighting');
    const lighting = element ? element.checked : true;

    moon.setUniforms({uUseLighting: lighting});
    cube.setUniforms({uUseLighting: lighting});

    if (lighting) {
      const ambientColor = new Vector3(
        parseFloat(getElementValue('ambientR', 0.2)),
        parseFloat(getElementValue('ambientG', 0.2)),
        parseFloat(getElementValue('ambientB', 0.2))
      );

      const pointLightingLocation = new Vector3(
        parseFloat(getElementValue('lightPositionX', 0)),
        parseFloat(getElementValue('lightPositionY', 0)),
        parseFloat(getElementValue('lightPositionZ', 0))
      );

      const pointLightColor = new Vector3(
        parseFloat(getElementValue('pointR', 0.8)),
        parseFloat(getElementValue('pointG', 0.8)),
        parseFloat(getElementValue('pointB', 0.8))
      );

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

    animateAppState();
  }
}

/* global window */
if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
