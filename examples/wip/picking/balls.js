/* global window, requestAnimationFrame */
import {PhiloGL, O3D, hasWebGL} from '../../src';

const fragmentShader = `
#ifdef GL_ES
precision highp float;
#endif

varying vec4 vColor;
varying vec2 vTexCoord;
varying vec3 lightWeighting;

uniform bool hasTexture1;
uniform sampler2D sampler1;

uniform bool enablePicking;
uniform vec3 pickColor;

uniform bool hasFog;
uniform vec3 fogColor;

uniform float fogNear;
uniform float fogFar;

uniform vec4 colorUfm;

void main() {

  if (!hasTexture1) {
    gl_FragColor = vec4(colorUfm.rgb * lightWeighting, colorUfm.a);
  } else {
    gl_FragColor =
      vec4(texture2D(sampler1, vec2(vTexCoord.s, vTexCoord.t)).rgb *
      lightWeighting, 1.0);
  }

  /* handle fog */
  if (hasFog && colorUfm.r != 1.0) {
    float depth = gl_FragCoord.z / gl_FragCoord.w;
    float fogFactor = smoothstep(fogNear, fogFar, depth);
    gl_FragColor =
      mix(gl_FragColor, vec4(fogColor, gl_FragColor.w), fogFactor);
  }

  if(enablePicking) {
    gl_FragColor = vec4(pickColor, 1.0);
  }

}
`;

const models = [];
let i = 50;
while (i--) {
  const Primitive = O3D[['Cylinder', 'Cone', 'Cube', 'Sphere'][i % 4]];
  var model = new Primitive({
    pickable: Boolean(i % 2),
    shininess: 2,
    radius: Math.random() * 2 + 1,
    nvertical: 10,
    nradial: 10,
    height: 10,
    topCap: true,
    bottomCap: true,
    cap: true,
    colors: [0.5, 0.5, 0.5, 1],
    uniforms: {
      'colorUfm': [0.5, 0.5, 0.5, 1]
    }
  });

  let n = 20;
  model.position = {
    x: -n + Math.random() * 2 * n,
    y: -n + Math.random() * 2 * n,
    z: -n + Math.random() * 2 * n
  };
  model.update();
  models.push(model);
  if (i % 2) {
    model.texCoords = false;
  }
}

window.initializeApp = () => {
  if (!hasWebGL) {
    return false;
  }
  // Create App
  PhiloGL('surface-explorer-canvas', {

    program: {
      fs: fragmentShader
    },

    camera: {
      position: {x: 0, y: 0, z: -50}
    },

    scene: {
      lights: {
        enable: true,
        ambient: {r: 0.6, g: 0.6, b: 0.6},
        directional: {
          color: {r: 0.8, g: 0.5, b: 0.2},
          direction: {x: -1, y: 1, z: 1}
        }
      },
      effects: {
        fog: {
          color: {r: 0.1, g: 0.1, b: 0.1},
          near: 0,
          far: 70
        }
      }
    },

    events: {
      picking: true,
      // lazyPicking: true,
      centerOrigin: false,
      cachePosition: false,
      onMouseEnter: (e, model) => {
        model.uniforms.colorUfm = [1, 1, 1, 1];
      },
      onMouseLeave: (e, model) => {
        model.uniforms.colorUfm = [0.5, 0.5, 0.5, 1];
      },
      onMouseWheel: (e) => {
        e.stop();
        const camera = this.camera;
        camera.position.z += e.wheel;
        camera.update();
      }
    },

    onLoad: app => {
      const gl = app.gl;
      const canvas = gl.canvas;
      const scene = app.scene;

      // Basic gl setup
      gl.clearDepth(1.0);
      gl.clearColor(0, 0, 0, 1.0);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);

      // Add balls
      scene.add.apply(scene, models);

      // Render the scene and perform a new loop
      function render() {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        scene.render();
        requestAnimationFrame(render);
      }

      // run loop
      render();
    }
  });

  return true;
};
