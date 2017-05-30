/* eslint-disable max-statements, no-var */
/* eslint-disable array-bracket-spacing, no-multi-spaces */
/* global document */

import {GL, AnimationLoop, Cube, Matrix4, Texture2D,
  addEvents, loadTextures} from 'luma.gl';

const animationLoop = new AnimationLoop({
  onInitialize: ({gl}) => {
    loadTextures(gl, {
      urls: ['crate.gif'],
      mipmap: true,
      parameters: [{
        [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
        [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_NEAREST,
      }]
    })
    .then(textures => {
      var crate = textures[0];

      var xRot = 0;
      var xSpeed = 0.01;
      var yRot = 0;
      var ySpeed = 0.013;
      var z = -5.0;

      // Create object
      var program = new Program(gl);
      program.use();

      var cube = new Model({
        geometry: createCubeGeometry(),
        program,
        uniforms: {
          hasTexture1: true,
          sampler1: crate
        }
      });

      let filter = 0;
      addEvents(canvas, {
        onKeyDown: function(e) {
          switch (e.key) {
          case 'f':
            filter = (filter + 1) % 3;
            break;
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

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);

      var camera = new PerspectiveCamera({
        aspect: canvas.width / canvas.height
      });

      var scene = new Scene(gl, program);

      scene.add(cube);

    });
  },

  onDrawScene: ({
    gl, scene, cube, camera, lighting, ambient, direction, z, xRot, yRot
  }) => {
    xRot += xSpeed;
    yRot += ySpeed;

    // Update Cube position
    cube.position.set(0, 0, z);
    cube.rotation.set(xRot, yRot, 0);
    cube.updateMatrix();

    const lightConfig = getControls();

    // Render all elements in the Scene
    scene.render({camera});
  }
});

function addControls() {
  return `
    <div id="controls">
      <input type="checkbox" id="lighting" checked /> Use lighting<br/>
      (Use cursor keys to spin the box and
      <code>Page Up</code>/<code>Page Down</code> to zoom out/in)

      <br/>
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

      <a href="http://learningwebgl.com/blog/?p=684">&lt;&lt; Back to Lesson 7</a>
    </div>
  `;
}

function getControls() {
  // Lighting form elements variables
  var $id = function(d) {
    return document.getElementById(d);
  };

  // Get lighting form elements
  var lighting = $id('lighting');
  var ambient = {
    r: $id('ambientR'),
    g: $id('ambientG'),
    b: $id('ambientB')
  };
  var direction = {
    x: $id('lightDirectionX'),
    y: $id('lightDirectionY'),
    z: $id('lightDirectionZ'),

    r: $id('directionalR'),
    g: $id('directionalG'),
    b: $id('directionalB')
  };

  // Update scene config with light info
  var lightConfig = scene.config.lights;
  lightConfig.enable = lighting.checked;
  lightConfig.ambient = {
    r: Number(ambient.r.value),
    g: Number(ambient.g.value),
    b: Number(ambient.b.value)
  };
  lightConfig.directional.direction = {
    x: Number(direction.x.value),
    y: Number(direction.y.value),
    z: Number(direction.z.value)
  };
  lightConfig.directional.color = {
    r: Number(direction.r.value),
    g: Number(direction.g.value),
    b: Number(direction.b.value)
  };
}

function addControls() {
  const controlPanel = document.querySelector('.control-panel');
  if (controlPanel) {
    controlPanel.innerHTML = `
  <p>
  A <code>cubemapped</code> prism within a larger cubemapped cube
  <p>
  Uses a luma.gl <code>TextureCube</code> and
  the GLSL <code>reflect</code> and <code>refract</code> builtin functions
  to calculate reflection and refraction directions from the prism normals
  </p>
  reflection
  <input class="valign" id="reflection"
    type="range" min="0.0" max="1.0" value="1.0" step="0.01">
  <br>
  refraction
  <input class="valign" id="refraction"
    type="range" min="0.0" max="1.0" value="1.0" step="0.01">
  <br>
    `;
  }
}
