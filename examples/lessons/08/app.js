/* eslint-disable max-statements, array-bracket-spacing, no-multi-spaces */
import {GL, AnimationLoop, Cube, Matrix4, addEvents, loadTextures, setParameters} from 'luma.gl';

const INFO_HTML = `
<div>
  <p>
    <a href="http://learningwebgl.com/blog/?p=1778" target="_blank">
      The depth buffer, transparency and blending
    </a>
  </p>
  The classic WebGL Lessons in luma.gl

  <div id="control-elements">
    <input type="checkbox" id="blending" checked/> Use blending<br/>
    Alpha level <input type="text" id="alpha" value="0.5"/><br/>
    <input type="checkbox" id="lighting" checked/> Use lighting<br/>
    (Use cursor keys to spin the box and <code>Page Up</code>/<code>Page Down</code> to zoom out/in)

    <br/>
    <div><b>Directional light:</b></div>
    <div class="control-block">
      <div class="control-row">
        Direction:
        <div>X: <input type="text" id="lightDirectionX" value="0"/></div>
        <div>Y: <input type="text" id="lightDirectionY" value="0"/></div>
        <div>Z: <input type="text" id="lightDirectionZ" value="1"/></div>
      </div>
      <div class="control-row">
        Colour:
        <div>R: <input type="text" id="directionalR" value="0.8"/></div>
        <div>G: <input type="text" id="directionalG" value="0.8"/></div>
        <div>B: <input type="text" id="directionalB" value="0.8"/></div>
      </div>
    </div>
  </div>

  <div>
    <div><b>Ambient light:</b></div>
    <div class="control-block">
      <div class="control-row">
        Colour:
        <div>R: <input type="text" id="ambientR" value="0.2"/></div>
        <div>G: <input type="text" id="ambientG" value="0.2"/></div>
        <div>B: <input type="text" id="ambientB" value="0.2"/></div>
      </div>
    </div>
  </div>
</div>
`;

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
#ifdef GL_ES
precision highp float;
#endif

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

const animationLoop = new AnimationLoop({
  onInitialize({canvas, gl}) {
    addKeyboardHandler(canvas);

    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      blendFunc: [gl.SRC_ALPHA, gl.ONE],
      blend: true
    });

    return loadTextures(gl, {
      urls: ['glass.gif'],
      mipmap: true,
      parameters: [{
        [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_NEAREST,
        [gl.TEXTURE_MAG_FILTER]: gl.LINEAR
      }]
    })
    .then(textures => ({
      cube: new Cube(gl, {
        vs: VERTEX_SHADER,
        fs: FRAGMENT_SHADER,
        uniforms: {uSampler: textures[0]}
      })
    }));
  },
  onRender({gl, tick, aspect, cube}) {
    xRot += xSpeed;
    yRot += ySpeed;

    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    // update element matrix to rotate cube on its center
    cube
      .setRotation([xRot, yRot, 0])
      .updateMatrix();

    const uMVMatrix = new Matrix4()
      .lookAt({eye: [0, 0, 0]})
      .translate([0, 0, cubePositionZ])
      .rotateXYZ([tick * 0.01, tick * 0.01, tick * 0.01])
      .multiplyRight(cube.matrix);

    const {
      blending,
      lighting,
      ambient,
      direction
    } = getControls();

    if (blending.checked) {
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.enable(gl.BLEND);
      gl.disable(gl.DEPTH_TEST);
      cube.setUniforms({
        alpha: Number(0.5)
      });
    } else {
      gl.disable(gl.BLEND);
      gl.enable(gl.DEPTH_TEST);
    }

    // Update scene config with light info
    const useLight = lighting.checked;
    const ambientColor = [
      parseValue(ambient.r.value),
      parseValue(ambient.g.value),
      parseValue(ambient.b.value)
    ];
    const lightingDirection = [
      parseValue(direction.x.value),
      parseValue(direction.y.value),
      parseValue(direction.z.value)
    ];
    const directionalColor = [
      parseValue(direction.r.value),
      parseValue(direction.g.value),
      parseValue(direction.b.value)
    ];

    cube.render({
      uMVMatrix,
      uPMatrix: new Matrix4().perspective({aspect}),
      uAmbientColor: ambientColor, // [0.2, 0.2, 0.2],
      uLightingDirection: lightingDirection, // [0, 0, 1],
      uDirectionalColor: directionalColor, // [0.8, 0.8, 0.8],
      uUseLighting: useLight,
      uAlpha: Number(0.5)
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
        // handle page up/down
        default:
          if (e.code === 33) {
            cubePositionZ -= 0.05;
          } else if (e.code === 34) {
            cubePositionZ += 0.05;
          }
      }
    }
  });
}

function parseValue(value) {
  let parsed = Number(value);
  return isNaN(parsed) ? 0 : parsed;
}

function getControls() {
  // Lighting form elements variables
  const $id = function (d) {
    return document.getElementById(d);
  };

  // Get lighting form elements
  const lighting = document.getElementById('lighting');
  const ambient = {
    r: $id('ambientR'),
    g: $id('ambientG'),
    b: $id('ambientB')
  };
  const direction = {
    x: $id('lightDirectionX'),
    y: $id('lightDirectionY'),
    z: $id('lightDirectionZ'),

    r: $id('directionalR'),
    g: $id('directionalG'),
    b: $id('directionalB')
  };
  const blending = $id('blending');
  const alpha = $id('alpha');

  return {
    lighting,
    ambient,
    direction,
    blending,
    alpha
  };
}

export default animationLoop;

/* global window */
if (!window.website) {
  animationLoop.start();
}
