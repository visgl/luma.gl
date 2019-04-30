/* eslint-disable max-statements, array-bracket-spacing, no-multi-spaces */
import GL from '@luma.gl/constants';
import {AnimationLoop, Texture2D, setParameters, ModelNode, CubeGeometry} from '@luma.gl/core';
import {addEvents} from '@luma.gl/addons';
import {Matrix4} from 'math.gl';

const INFO_HTML = `
<div>
  <p>
    <a href="http://learningwebgl.com/blog/?p=859" target="_blank">
      Depth buffer, transparency and blending
    </a>
  </p>

  Use arrow keys to spin the box and <code>+</code>/<code>-</code> to zoom in/out.
  <br/>

  <div>
    <div>
      <input type="checkbox" id="blending" checked/> <b>Blending</b>
      <br/>
      Alpha level
      <input id="directionalR" type="range" value="0.5" min="0.0" max="1.0" step="0.01"/>
      <br/>
    </div>

    <br/>

    <div>
      <input type="checkbox" id="lighting" checked/> <b>Directional Lighting</b>
      <br/>
      <div class="control-block">
        <div class="control-row">
          Direction:
          <div>X:
            <input id="lightDirectionX" type="range" value="0" min="-5" max="5" step="0.1"/>
          </div>
          <div>Y:
            <input id="lightDirectionY" type="range" value="0" min="-5" max="5" step="0.1"/>
          </div>
          <div>Z:
            <input id="lightDirectionZ" type="range" value="2" min="0" max="5" step="0.1"/>
          </div>
        </div>
        <div class="control-row">
          Colour:
          <div>R:
            <input id="directionalR" type="range" value="0.2" min="0.0" max="1.0" step="0.01"/>
          </div>
          <div>G:
            <input id="directionalG" type="range" value="0.2" min="0.0" max="1.0" step="0.01"/>
          </div>
          <div>B:
            <input id="directionalB" type="range" value="0.2" min="0.0" max="1.0" step="0.01"/>
          </div>
        </div>
      </div>
    </div>
  </div>

  <br/>

  <div>
    <div><b>Ambient Lighting</b></div>
    <div class="control-block">
      <div class="control-row">
        Colour:
        <div>R:
          <input id="ambientR" type="range" value="0.2" min="0.0" max="1.0" step="0.01"/>
        </div>
        <div>G:
          <input id="ambientG" type="range" value="0.2" min="0.0" max="1.0" step="0.01"/>
        </div>
        <div>B:
          <input id="ambientB" type="range" value="0.2" min="0.0" max="1.0" step="0.01"/>
        </div>
      </div>
    </div>
  </div>

  <br/>
  The classic WebGL Lessons in luma.gl
</div>
`;

// Read Lighting form elements variables
function getHTMLControls() {
  /* global document */
  const $id = id => document.getElementById(id);
  const $value = (id, defaultValue = 1) => ($id(id) ? Number($id(id).value) : defaultValue);
  const $checked = id => ($id(id) ? $id(id).checked : true);

  const blendingEnabled = $checked('blending');
  const alpha = $value('alpha', 0.5);

  // Get lighting form elements
  const lightingEnabled = $checked('lighting');
  const lightDirection = [
    $value('lightDirectionX', 0),
    $value('lightDirectionY', 0),
    $value('lightDirectionZ', 1)
  ];
  const lightColor = [$value('directionalR'), $value('directionalG'), $value('directionalB')];
  const ambientColor = [$value('ambientR'), $value('ambientG'), $value('ambientB')];

  return {
    blendingEnabled,
    alpha,
    lightingEnabled,
    lightDirection,
    lightColor,
    ambientColor
  };
}

// Vertex shader with lighting
const VERTEX_SHADER = `\
attribute vec3 positions;
attribute vec2 texCoords;
attribute vec3 normals;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform vec3 uAmbientColor;
uniform vec3 uLightingDirection;
uniform vec3 uDirectionalColor;
uniform bool uUseLighting;

varying vec2 vTextureCoord;
varying vec3 vLightWeighting;

void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(positions, 1.0);
  vTextureCoord = texCoords;

  if (!uUseLighting) {
    vLightWeighting = vec3(1.0, 1.0, 1.0);
  } else {
    // Perform lighting in world space
    // we should use 'transpose(inverse(mat3(uMVMatrix)))', but
    // 'inverse' matrix operation not supported in GLSL 1.0, for now use
    // upper-left 3X3 matrix of model view matrix, it works since we are not
    // doing any non-uniform scaling transormations in this example.
    mat3 normalMatrix = mat3(uMVMatrix);
    vec3 transformedNormal = normalMatrix * normals;
    float directionalLightWeighting = max(dot(transformedNormal, uLightingDirection), 0.0);
    vLightWeighting = uAmbientColor + uDirectionalColor * directionalLightWeighting;
  }
}
`;

// Fragment shader
const FRAGMENT_SHADER = `\
precision highp float;

varying vec2 vTextureCoord;
varying vec3 vLightWeighting;

uniform sampler2D uSampler;
uniform float uAlpha;

void main(void) {
  vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
  gl_FragColor = vec4(textureColor.rgb * vLightWeighting, textureColor.a * uAlpha);
}
`;

let xRot = 0;
let xSpeed = 0.01;
let yRot = 0;
let ySpeed = 0.0;
let cubePositionZ = -5.0;

export default class AppAnimationLoop extends AnimationLoop {
  static getInfo() {
    return INFO_HTML;
  }

  onInitialize({canvas, gl}) {
    addKeyboardHandler(canvas);

    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      blendFunc: [gl.SRC_ALPHA, gl.ONE],
      blend: true
    });

    const texture = new Texture2D(gl, {
      data: 'glass.gif',
      mipmap: true,
      parameters: {
        [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_NEAREST,
        [gl.TEXTURE_MAG_FILTER]: gl.LINEAR
      }
    });
    return {
      cube: new ModelNode(gl, {
        geometry: new CubeGeometry(),
        vs: VERTEX_SHADER,
        fs: FRAGMENT_SHADER,
        uniforms: {uSampler: texture}
      })
    };
  }
  onRender({gl, tick, aspect, cube}) {
    xRot += xSpeed;
    yRot += ySpeed;

    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    // update element matrix to rotate cube on its center
    cube.setRotation([xRot, yRot, 0]).updateMatrix();

    const uMVMatrix = new Matrix4()
      .lookAt({eye: [0, 0, 0]})
      .translate([0, 0, cubePositionZ])
      .rotateXYZ([tick * 0.01, tick * 0.01, tick * 0.01])
      .multiplyRight(cube.matrix);

    const {
      blendingEnabled,
      alpha,
      lightingEnabled,
      lightDirection,
      lightColor,
      ambientColor
    } = getHTMLControls();

    if (blendingEnabled) {
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      cube.setUniforms({
        alpha
      });
    } else {
      gl.enable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
    }

    // Update scene config with light info
    cube
      .setUniforms({
        uMVMatrix,
        uPMatrix: new Matrix4().perspective({aspect}),
        uAmbientColor: ambientColor,
        uUseLighting: lightingEnabled,
        uLightingDirection: lightDirection,
        uDirectionalColor: lightColor,
        uAlpha: Number(0.5)
      })
      .draw();
  }
}

function addKeyboardHandler(canvas) {
  addEvents(canvas, {
    onKeyDown(e) {
      switch (e.key) {
        case 'up':
          xSpeed -= 0.02;
          break;
        case 'down':
          xSpeed += 0.02;
          break;
        case 'left':
          ySpeed -= 0.02;
          break;
        case 'right':
          ySpeed += 0.02;
          break;
        default:
      }

      switch (e.code) {
        case 187: // '+'
          cubePositionZ += 0.05;
          break;
        case 189: // '-'
          cubePositionZ -= 0.05;
          break;
        default:
      }
    }
  });
}

/* global window */
if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
