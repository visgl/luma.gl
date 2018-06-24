import GL from 'luma.gl/constants';
import {AnimationLoop, loadTextures, setParameters, Sphere, Cube} from 'luma.gl';
import {Vector3, Matrix4, radians} from 'math.gl';

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

const animationLoop = new AnimationLoop({

  onInitialize({canvas, gl}) {

    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true
    });

    return loadTextures(gl, {
      urls: ['moon.gif', 'crate.gif']
    })
    .then(([moonTexture, crateTexture]) => {
      return {
        moon: new Sphere(gl, {
          fs: FRAGMENT_SHADER,
          vs: VERTEX_SHADER,
          uniforms: {
            uSampler: moonTexture
          },
          nlat: 30,
          nlong: 30,
          radius: 2
        }),
        cube: new Cube(gl, {
          vs: VERTEX_SHADER,
          fs: FRAGMENT_SHADER,
          uniforms: {
            uSampler: crateTexture
          }
        })
      };
    });
  },

  onRender({gl, tick, aspect, moon, cube}) { // eslint-disable-line complexity
    // set camera position
    const eyePos = [0, 0, 20];

    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    const uVMatrix = new Matrix4()
      .lookAt({eye: eyePos, center: [0, 0, 0], up:[0, 1, 0]});

    let element = null;
    /* global document */
    const lighting = (element = document.getElementById("lighting")) ? element.checked : true;

    moon.setUniforms({uUseLighting: lighting});
    cube.setUniforms({uUseLighting: lighting});

    if (lighting) {
      const ambientColor = new Vector3(
        parseFloat((element = document.getElementById("ambientR")) ? element.value : "0.2"),
        parseFloat((element = document.getElementById("ambientG")) ? element.value : "0.2"),
        parseFloat((element = document.getElementById("ambientB")) ? element.value : "0.2")
      );

      const pointLightingLocation = new Vector3(
        parseFloat((element = document.getElementById("lightPositionX")) ? element.value : "0"),
        parseFloat((element = document.getElementById("lightPositionY")) ? element.value : "0"),
        parseFloat((element = document.getElementById("lightPositionZ")) ? element.value : "0")
      );

      const pointLightColor = new Vector3(
        parseFloat((element = document.getElementById("pointR")) ? element.value : "0.8"),
        parseFloat((element = document.getElementById("pointG")) ? element.value : "0.8"),
        parseFloat((element = document.getElementById("pointB")) ? element.value : "0.8")
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

    moon.render({
      uMMatrix: appState.moonRotationMatrix,
      uVMatrix,
      uPMatrix: new Matrix4().perspective({fov: 45 * Math.PI / 180, aspect, near: 0.1, far: 100})
    });

    cube.render({
      uMMatrix: appState.cubeRotationMatrix,
      uVMatrix,
      uPMatrix: new Matrix4().perspective({fov: 45 * Math.PI / 180, aspect, near: 0.1, far: 100})
    });

    animateAppState();
  }
});

animationLoop.getInfo = () => {
  return `
  <p>
    <a href="http://learningwebgl.com/blog/?p=1359" target="_blank">
    Point lighting
    </a>
  <p>
    The classic WebGL Lessons in luma.gl
    `;
};

export default animationLoop;

/* global window */
if (!window.website) {
  animationLoop.start();
}
