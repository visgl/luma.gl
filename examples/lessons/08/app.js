/* eslint-disable no-var */
/* eslint-disable max-statements, array-bracket-spacing, no-multi-spaces */
/* global window, document */
import {createGLContext, loadTextures, Cube, Program, addEvents, Fx} from 'luma.gl';

// Blend Fragment Shader
const blendFS = `\
#ifdef GL_ES
precision highp float;
#endif

varying vec4 vColor;
varying vec2 vTexCoord;
varying vec3 lightWeighting;

uniform bool hasTexture1;
uniform sampler2D sampler1;
uniform float alpha;

void main() {
  if (hasTexture1) {
    gl_FragColor = vec4(texture2D(sampler1,
      vec2(vTexCoord.s, vTexCoord.t)).rgb * lightWeighting, alpha);
  }
}
`;

const animationLoop = new AnimationLoop({
  onInitialize({gl}) {
    loadTextures(gl, {
      urls: ['glass.gif'],
      mipmap: true,
      parameters: [{
        [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_NEAREST,
        [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
      }]
    })
    .then(textures => {

      var glass = textures[0];

      var xRot = 0;
      var xSpeed = 0.01;
      var yRot = 0;
      var ySpeed = 0.013;
      var z = -5.0;

      // Create object


    var program = new Program(gl, {fs: blendFS});

    /* eslint-disable indent */
    var cube = new Model({
      program,
      geometry: makeCubeGeometry(),
      uniforms: {
        hasTexture1: true,
        sampler1: glass
      }
    });
    /* eslint-disable indent */

    addEvents(canvas, {
      onKeyDown(e) {
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
        // handle page up/down
        default:
          if (e.code === 33) {
            z -= 0.05;
          } else if (e.code === 34) {
            z += 0.05;
          }
        }
      }
    });

    var scene = new Scene(gl, program, camera);
    scene.add(cube);
    return {scene};
  },
  onRender: ({gl, canvas, scene}) => {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    var camera = new PerspectiveCamera({
      aspect: canvas.width / canvas.height
    });

    function animate() {
      xRot += xSpeed;
      yRot += ySpeed;
    }

    function drawScene() {
      // Update Cube position
      cube
        .setPosition(new Vec3(0, 0, z))
        .setRotation(new Vec3(xRot, yRot, 0))
        .updateMatrix();
      if (blending.checked) {
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        cube.setUniforms({
          'alpha': Number(alpha.value)
        });
      } else {
        gl.disable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
      }
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
      // Render all elements in the Scene
      scene.render({camera});
      animate();
    }

  });
};

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
  var blending = $id('blending');
  var alpha = $id('alpha');
}


export default animationLoop;
