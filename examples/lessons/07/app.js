/* eslint-disable max-statements, no-var */
/* eslint-disable array-bracket-spacing, no-multi-spaces */
/* global document */

import {GL, AnimationLoop, Cube, Matrix4, Texture2D,
  addEvents, loadTextures, Model, resetContext} from 'luma.gl';

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

var xRot = 0;
var xSpeed = 0.01;
var yRot = 0;
var ySpeed = 0.0;
var z = -5.0;

const animationLoop = new AnimationLoop({
  onInitialize: ({canvas, gl}) => {
    addControls();
    addKeyboardHandler(canvas);

    resetContext(gl);
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.enable(GL.DEPTH_TEST);
    gl.depthFunc(GL.LEQUAL);

    return loadTextures(gl, {
      urls: ['crate.gif']
    })
    .then(textures => ({
      cube: new Cube({
        gl,
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

    const uMVMatrix = Matrix4
      .lookAt({eye: [0, 0, 0]})
      .translate([0, 0, -5])
      .rotateXYZ([tick * 0.01, tick * 0.01, tick * 0.01])
      .multiplyRight(cube.matrix);

    cube.render({
      uMVMatrix,
      uPMatrix: Matrix4.perspective({aspect}),
      uAmbientColor: [0.2,0.2,0.2],
      uLightingDirection: [0,0,1],
      uDirectionalColor: [0.8,0.8,0.8],
      uUseLighting: true
    });
  }
});


function addControls({controlPanel} = {}) {
  /* global document */
  controlPanel = controlPanel || document.querySelector('.control-panel');
  if (controlPanel) {
    controlPanel.innerHTML = `
  <p>
    <a href="http://learningwebgl.com/blog/?p=684" target="_blank">
      Basic directional and ambient lighting
    </a>
  <p>
    The classic WebGL Lessons in luma.gl
    `;
  }
}

function addKeyboardHandler(canvas) {

  addEvents(canvas, {
    onKeyDown: function(e) {
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
        // handle page up/down
        if (e.code === 33) {
          z -= 0.05;
        } else if (e.code === 34) {
          z += 0.05;
        }
      }
    }
  });
}

// TODO: Use following addControls/getControls method and update lighting uniforms
// function addControls() {
//   return `
//     <div id="controls">
//       <input type="checkbox" id="lighting" checked /> Use lighting<br/>
//       (Use cursor keys to spin the box and
//       <code>Page Up</code>/<code>Page Down</code> to zoom out/in)
//
//       <br/>
//       <h2>Directional light:</h2>
//
//       <table style="border: 0; padding: 10px;">
//       <tr>
//       <td><b>Direction:</b>
//       <td>X: <input type="text" id="lightDirectionX" value="-0.25" />
//       <td>Y: <input type="text" id="lightDirectionY" value="-0.25" />
//       <td>Z: <input type="text" id="lightDirectionZ" value="-1.0" />
//       </tr>
//       <tr>
//       <td><b>Colour:</b>
//       <td>R: <input type="text" id="directionalR" value="0.8" />
//       <td>G: <input type="text" id="directionalG" value="0.8" />
//       <td>B: <input type="text" id="directionalB" value="0.8" />
//       </tr>
//       </table>
//
//       <h2>Ambient light:</h2>
//       <table style="border: 0; padding: 10px;">
//       <tr>
//       <td><b>Colour:</b>
//       <td>R: <input type="text" id="ambientR" value="0.2" />
//       <td>G: <input type="text" id="ambientG" value="0.2" />
//       <td>B: <input type="text" id="ambientB" value="0.2" />
//       </tr>
//       </table>
//
//       <a href="http://learningwebgl.com/blog/?p=684">&lt;&lt; Back to Lesson 7</a>
//     </div>
//   `;
// }
//
// function getControls() {
//   // Lighting form elements variables
//   var $id = function(d) {
//     return document.getElementById(d);
//   };
//
//   // Get lighting form elements
//   var lighting = $id('lighting');
//   var ambient = {
//     r: $id('ambientR'),
//     g: $id('ambientG'),
//     b: $id('ambientB')
//   };
//   var direction = {
//     x: $id('lightDirectionX'),
//     y: $id('lightDirectionY'),
//     z: $id('lightDirectionZ'),
//
//     r: $id('directionalR'),
//     g: $id('directionalG'),
//     b: $id('directionalB')
//   };
//
//   // Update scene config with light info
//   var lightConfig = scene.config.lights;
//   lightConfig.enable = lighting.checked;
//   lightConfig.ambient = {
//     r: Number(ambient.r.value),
//     g: Number(ambient.g.value),
//     b: Number(ambient.b.value)
//   };
//   lightConfig.directional.direction = {
//     x: Number(direction.x.value),
//     y: Number(direction.y.value),
//     z: Number(direction.z.value)
//   };
//   lightConfig.directional.color = {
//     r: Number(direction.r.value),
//     g: Number(direction.g.value),
//     b: Number(direction.b.value)
//   };
// }

export default animationLoop;

window.webGLStart = function() {
  animationLoop.start();

};
