import GL from '@luma.gl/constants';
import {addEvents} from 'luma.gl/addons';
import {AnimationLoop, setParameters, Sphere, Texture2D} from 'luma.gl';
import {Vector3, Matrix4} from 'math.gl';

const INFO_HTML = `
<p>
  <a href="http://learningwebgl.com/blog/?p=1253" target="_blank">
  Spheres, rotation matrices, and mouse events
  </a>
<br/>
<br/>
  (Rotate the moon with the mouse)
<p>
  The classic WebGL Lessons in luma.gl
`;

const VERTEX_SHADER = `\
attribute vec3 positions;
attribute vec3 normals;
attribute vec2 texCoords;

uniform mat4 uMMatrix;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;

uniform vec3 uAmbientColor;

uniform vec3 uLightingDirection;
uniform vec3 uDirectionalColor;

uniform bool uUseLighting;

varying vec2 vTextureCoord;
varying vec3 vLightWeighting;

void main(void) {
    gl_Position = uPMatrix * uVMatrix * uMMatrix * vec4(positions, 1.0);
    vTextureCoord = texCoords;

    if (!uUseLighting) {
        vLightWeighting = vec3(1.0, 1.0, 1.0);
    } else {
        vec4 transformedNormal = uMMatrix * vec4(normals, 1.0);
        vec3 newNormal = transformedNormal.xyz / transformedNormal.w;
        float directionalLightWeighting = max(dot(newNormal, uLightingDirection), 0.0);
        vLightWeighting = uAmbientColor + uDirectionalColor * directionalLightWeighting;
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
  mouseDown: false,
  lastMouseX: null,
  lastMouseY: null,
  moonRotationMatrix: new Matrix4()
};

const animationLoop = new AnimationLoop({
  onInitialize({canvas, gl}) {
    addMouseHandler(canvas);

    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true
    });

    return {
      moon: new Sphere(gl, {
        fs: FRAGMENT_SHADER,
        vs: VERTEX_SHADER,
        uniforms: {
          uSampler: new Texture2D(gl, 'moon.gif')
        },
        nlat: 30,
        nlong: 30,
        radius: 2,
      })
    };
  },

  // eslint-disable-next-line complexity
  onRender({gl, tick, aspect, moon}) {
    // Update Camera Position
    const eyePos = [0, 0, 6];

    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    const uMMatrix = new Matrix4().multiplyRight(appState.moonRotationMatrix);
    const uVMatrix = new Matrix4().lookAt({eye: eyePos, center: [0, 0, 0], up:[0, 1, 0]});

    // Read controls
    const {lighting, ambientColor, lightingDirection, directionalColor} = getControlValues();

    moon.setUniforms({uUseLighting: lighting});

    if (lighting) {
      lightingDirection.normalize();
      lightingDirection.scale(-1);

      moon.setUniforms({
        uAmbientColor: ambientColor,
        uLightingDirection: lightingDirection,
        uDirectionalColor: directionalColor
      });
    }

    moon.render({
      uMMatrix,
      uVMatrix,
      uPMatrix: new Matrix4().perspective({fov: 45 * Math.PI / 180, aspect, near: 0.1, far: 100})
    });
  }
});

animationLoop.getInfo = () => INFO_HTML;

function addMouseHandler(canvas) {
  addEvents(canvas, {
    onDragStart(event) {
      appState.mouseDown = true;
      appState.lastMouseX = event.clientX;
      appState.lastMouseY = event.clientY;
    },
    onDragMove(event) {
      if (!appState.mouseDown) {
        return;
      }

      if (appState.lastMouseX !== undefined) {
        const radiansX = (event.x - appState.lastMouseX) / 300;
        const radiansY = -(event.y - appState.lastMouseY) / 300;

        const newMatrix = new Matrix4()
          .rotateX(radiansY)
          .rotateY(radiansX);

        appState.moonRotationMatrix.multiplyLeft(newMatrix);
      }

      appState.lastMouseX = event.x;
      appState.lastMouseY = event.y;
    },

    onDragEnd(e) {
      appState.mouseDown = false;
    }
  });
}

function getControlValues() {
  /* global document */
  let element = null;

  const lighting = (element = document.getElementById("lighting")) ? element.checked : true;

  const ambientColor = lighting && new Vector3(
    parseFloat((element = document.getElementById("ambientR")) ? element.value : "0.2"),
    parseFloat((element = document.getElementById("ambientG")) ? element.value : "0.2"),
    parseFloat((element = document.getElementById("ambientB")) ? element.value : "0.2")
  );

  const lightingDirection = lighting && new Vector3(
    parseFloat((element = document.getElementById("lightDirectionX")) ? element.value : "-1"),
    parseFloat((element = document.getElementById("lightDirectionY")) ? element.value : "-1"),
    parseFloat((element = document.getElementById("lightDirectionZ")) ? element.value : "-1")
  );

  const directionalColor = lighting && new Vector3(
    parseFloat((element = document.getElementById("directionalR")) ? element.value : "0.8"),
    parseFloat((element = document.getElementById("directionalG")) ? element.value : "0.8"),
    parseFloat((element = document.getElementById("directionalB")) ? element.value : "0.8")
  );

  return {lighting, ambientColor, lightingDirection, directionalColor};
}

export default animationLoop;

/* global window */
if (!window.website) {
  animationLoop.start();
}
