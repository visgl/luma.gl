import {
  GL, AnimationLoop, loadTextures, addEvents, Vector3, setParameters, Sphere, Cube, Program
} from 'luma.gl';

import { Matrix4, radians } from 'math.gl';

const VERTEX_LIGHTING_VERTEX_SHADER = `\
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

const VERTEX_LIGHTING_FRAGMENT_SHADER = `\
#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vLightWeighting;

uniform bool uUseTextures;
uniform sampler2D uSampler;

void main(void) {
  vec4 fragmentColor;
  if (uUseTextures) {
    fragmentColor = texture2D(uSampler, vec2(1.0 - vTextureCoord.s, 1.0 - vTextureCoord.t));
  } else {
    fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
  gl_FragColor = vec4(fragmentColor.rgb * vLightWeighting, fragmentColor.a);
}
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
#ifdef GL_ES
precision highp float;
#endif

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

const moonRotation = {
  matrix: new Matrix4().rotateY(radians(180)).translate([2, 0, 0])
};

const cubeRotation = {
  matrix: new Matrix4().translate([1.25, 0, 0])
};

const animationLoop = new AnimationLoop({
  onInitialize: ({canvas, gl}) => {

    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true
    });

    let vertexLightingProgram = new Program(gl, {
      fs: VERTEX_LIGHTING_FRAGMENT_SHADER,
      vs: VERTEX_LIGHTING_VERTEX_SHADER,
    });

    let fragmentLightingProgram = new Program(gl, {
      fs: FRAGMENT_LIGHTING_FRAGMENT_SHADER,
      vs: FRAGMENT_LIGHTING_VERTEX_SHADER,
    });

    return loadTextures(gl, {
      urls: ['moon.gif']
    })
    .then(textures => {
      let moon = new Sphere(gl, {
        program: fragmentLightingProgram,
        uniforms: {
          uSampler: textures[0]
        },
        nlat: 30,
        nlong: 30,
        radius: 1,
      });
      return loadTextures(gl, {
        urls: ['crate.gif']
      })
      .then(textures => {
        let cube = new Cube(gl, {
          program: fragmentLightingProgram,
          uniforms: {
            uSampler: textures[0]
          }
        });
        return {moon, cube, vertexLightingProgram, fragmentLightingProgram};
      });
    });
  },
  onRender: ({
    gl, tick, aspect, moon, cube, vertexLightingProgram, fragmentLightingProgram
  }) => {
    // set camera position
    const eyePos = new Matrix4()
    .rotateX(radians(-30))
    .transformVector3([0, 0, 5]);

    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    let uVMatrix = new Matrix4()
      .lookAt({eye: eyePos, center: [0, 0, 0], up:[0, 1, 0]});

    let element = null;
    let useLighting = (element = document.getElementById("lighting")) ? element.checked : true;
    let useTextures = (element = document.getElementById("textures")) ? element.checked : true;
    let useFragmentLighting = (element = document.getElementById("per-fragment")) ? element.checked : true;

    if (useFragmentLighting) {
      moon.program = fragmentLightingProgram;
      cube.program = fragmentLightingProgram;
    } else {
      moon.program = vertexLightingProgram;
      cube.program = vertexLightingProgram;
    }

    moon.setUniforms({
      uUseLighting: useLighting,
      uUseTextures: useTextures
    });

    cube.setUniforms({
      uUseLighting: useLighting,
      uUseTextures: useTextures
    });

    if (useLighting) {
      let ambientColor = new Vector3(
        parseFloat((element = document.getElementById("ambientR")) ? element.value : "0.2"),
        parseFloat((element = document.getElementById("ambientG")) ? element.value : "0.2"),
        parseFloat((element = document.getElementById("ambientB")) ? element.value : "0.2")
      );

      let pointLightingLocation = new Vector3(
        parseFloat((element = document.getElementById("lightPositionX")) ? element.value : "0"),
        parseFloat((element = document.getElementById("lightPositionY")) ? element.value : "0"),
        parseFloat((element = document.getElementById("lightPositionZ")) ? element.value : "0")
      );

      let pointLightColor = new Vector3(
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
      uMMatrix: moonRotation.matrix,
      uVMatrix,
      uPMatrix: new Matrix4().perspective({fov: 45 * Math.PI / 180, aspect, near: 0.1, far: 100})
    });

    cube.render({
      uMMatrix: cubeRotation.matrix,
      uVMatrix,
      uPMatrix: new Matrix4().perspective({fov: 45 * Math.PI / 180, aspect, near: 0.1, far: 100})
    });

    animate(timeline, moonRotation, cubeRotation);
  }
});

animationLoop.getInfo = () => {
  return `
  <p>
    <a href="http://learningwebgl.com/blog/?p=1523" target="_blank">
    Per-fragment lighting and multiple programs
    </a>
  <p>
    The classic WebGL Lessons in luma.gl
    `;
};

const timeline = {
  lastTime: 0
};

function animate(timeline, moonRotation, cubeRotation) {
  var timeNow = new Date().getTime();
  if (timeline.lastTime != 0) {
    let elapsed = timeNow - timeline.lastTime;
    let newMatrix = new Matrix4()
    .rotateY(radians(elapsed / 20));
    moonRotation.matrix.multiplyLeft(newMatrix);
    cubeRotation.matrix.multiplyLeft(newMatrix);
  }
  timeline.lastTime = timeNow;
}

export default animationLoop;

// expose on Window for standalone example
window.animationLoop = animationLoop;
