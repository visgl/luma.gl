import {GL, AnimationLoop, Cube, addEvents, loadTextures, setParameters} from 'luma.gl';
import {Matrix4} from 'math.gl';

export const INFO_HTML = `
<p>
  <a href="http://learningwebgl.com/blog/?p=684" target="_blank">
    Basic directional and ambient lighting
  </a>

  <br/>

  <br/>

  Use arrow keys to spin the box and <code>+</code>/<code>-</code> to zoom in/out.

  <br/>

  <!--
    <h2>Directional light:</h2>

    <table style="border: 0; padding: 10px;">
    <tr>
    <td><b>Direction:</b>
    <td>X: <input type="text" id="lightDirectionX" value="-0.25" />
    <td>Y: <input type="text" id="lightDirectionY" value="-0.25" />
    <td>Z: <input type="text" id="lightDirectionZ" value="-1.0" />
    </tr>
    <tr>
    <td><b>Colour:</b>
    <td>R: <input type="text" id="directionalR" value="0.8" />
    <td>G: <input type="text" id="directionalG" value="0.8" />
    <td>B: <input type="text" id="directionalB" value="0.8" />
    </tr>
    </table>

    <h2>Ambient light:</h2>
    <table style="border: 0; padding: 10px;">
    <tr>
    <td><b>Colour:</b>
    <td>R: <input type="text" id="ambientR" value="0.2" />
    <td>G: <input type="text" id="ambientG" value="0.2" />
    <td>B: <input type="text" id="ambientB" value="0.2" />
    </tr>
    </table>
  -->

  <div>
    <input type="checkbox" id="lighting" checked/> <b>Directional Lighting</b>
    <br/>
    <div class="control-block">
      <div class="control-row">
        Direction:
        <div>X:
          <input id="lightDirectionX" type="range" value="-0.25" min="-5" max="5" step="0.1"/>
        </div>
        <div>Y:
          <input id="lightDirectionY" type="range" value="-0.25" min="-5" max="5" step="0.1"/>
        </div>
        <div>Z:
          <input id="lightDirectionZ" type="range" value="1.0" min="0" max="5" step="0.1"/>
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

<p>
The classic WebGL Lessons in luma.gl
`;

// Read Lighting form elements variables
function getHTMLControls() {
  /* global document */
  const $id = id => document.getElementById(id);
  const $value = (id, defaultValue = 1) => $id(id) ? Number($id(id).value) : defaultValue;
  const $checked = id => $id(id) ? $id(id).checked : true;

  // Get lighting form elements
  const lightingEnabled = $checked('lighting');
  const lightDirection = [
    $value('lightDirectionX', 0),
    $value('lightDirectionY', 0),
    $value('lightDirectionZ', 1)
  ];
  const lightColor = [
    $value('directionalR'),
    $value('directionalG'),
    $value('directionalB')
  ];
  const ambientColor = [
    $value('ambientR'),
    $value('ambientG'),
    $value('ambientB')
  ];

  return {
    lightingEnabled,
    lightDirection,
    lightColor,
    ambientColor
  };
}

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

const FRAGMENT_SHADER = `\
#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vLightWeighting;

uniform sampler2D uSampler;

void main(void) {
  vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
  gl_FragColor = vec4(textureColor.rgb * vLightWeighting, textureColor.a);
}
`;

let xRot = 0;
let xSpeed = 0.01;
let yRot = 0;
let ySpeed = 0.0;
let z = -5.0;

const animationLoop = new AnimationLoop({
  onInitialize: ({canvas, gl}) => {
    addKeyboardHandler(canvas);

    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true,
      depthFunc: GL.LEQUAL
    });

    return loadTextures(gl, {
      urls: ['crate.gif']
    })
    .then(textures => ({
      cube: new Cube(gl, {
        vs: VERTEX_SHADER,
        fs: FRAGMENT_SHADER,
        uniforms: {uSampler: textures[0]}
      })
    }));
  },

  onRender: ({
    gl, tick, aspect, cube
  }) => {
    xRot += xSpeed;
    yRot += ySpeed;

    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    // update element matrix to rotate cube on its center
    cube
      .setRotation([xRot, yRot, 0])
      .updateMatrix();

    const uMVMatrix = new Matrix4()
      .lookAt({eye: [0, 0, 0]})
      .translate([0, 0, z])
      .rotateXYZ([tick * 0.01, tick * 0.01, tick * 0.01])
      .multiplyRight(cube.matrix);

    const {
      lightingEnabled,
      lightDirection,
      lightColor,
      ambientColor
    } = getHTMLControls();

    cube.render({
      uMVMatrix,
      uPMatrix: new Matrix4().perspective({aspect}),
      uAmbientColor: ambientColor,
      uLightingDirection: lightDirection,
      uDirectionalColor: [0.8, 0.8, 0.8],
      uUseLighting: true
    });
  }
});

animationLoop.getInfo = () => INFO_HTML;

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
        z += 0.05;
        break;
      case 189: // '-'
        z -= 0.05;
        break;
      default:
      }
    }
  });
}

export default animationLoop;

/* global window */
if (!window.website) {
  animationLoop.start();
}
