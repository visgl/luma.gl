/* eslint-disable no-var, max-statements */
import {GL, AnimationLoop, Matrix4, radians, setParameters, pickModels,
  Cube, picking, dirlight} from 'luma.gl';

const SIDE = 256;

let pickPosition = [0, 0];
function mousemove(e) {
  pickPosition = [e.offsetX, e.offsetY];
}
function mouseleave(e) {
  pickPosition = null;
}

const animationLoop = new AnimationLoop({
  createFramebuffer: true,
  onInitialize({gl}) {
    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true,
      depthFunc: GL.LEQUAL
    });

    gl.canvas.addEventListener('mousemove', mousemove);
    gl.canvas.addEventListener('mouseleave', mouseleave);

    return {
      cube: makeInstancedCube(gl)
    };
  },
  onFinalize({gl, cube}) {
    gl.canvas.removeEventListener('mousemove', mousemove);
    cube.delete();
  },
  onRender({gl, tick, aspect, cube, framebuffer}) {
    cube.setUniforms({
      uTime: tick * 0.1,
      // Basic projection matrix
      uProjection: new Matrix4().perspective({fov: radians(60), aspect, near: 1, far: 2048.0}),
      // Move the eye around the plane
      uView: new Matrix4().lookAt({
        center: [0, 0, 0],
        eye: [
          Math.cos(tick * 0.005) * SIDE / 2,
          Math.sin(tick * 0.006) * SIDE / 2,
          (Math.sin(tick * 0.0035) + 1) * SIDE / 4 + 32
        ]
      }),
      // Rotate all the individual cubes
      uModel: new Matrix4().rotateX(tick * 0.01).rotateY(tick * 0.013)
    });

    const pickInfo = pickPosition && pickModels(gl, {
      models: [cube],
      position: pickPosition,
      framebuffer
    });

    cube.updateModuleSettings({
      pickingSelectedColor: pickInfo && pickInfo.color,
      pickingValid: pickInfo !== null
    });

    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
    cube.render();
  }
});

// Make a cube with 65K instances and attributes to control offset and color of each instance
function makeInstancedCube(gl) {
  let offsets = [];
  for (let i = 0; i < SIDE; i++) {
    const x = (-SIDE + 1) * 3 / 2 + i * 3;
    for (let j = 0; j < SIDE; j++) {
      const y = (-SIDE + 1) * 3 / 2 + j * 3;
      offsets.push(x, y);
    }
  }
  offsets = new Float32Array(offsets);

  const pickingColors = new Uint8ClampedArray(SIDE * SIDE * 2);
  for (let i = 0; i < SIDE; i++) {
    for (let j = 0; j < SIDE; j++) {
      pickingColors[(i * SIDE + j) * 2 + 0] = i;
      pickingColors[(i * SIDE + j) * 2 + 1] = j;
    }
  }

  const colors = new Float32Array(SIDE * SIDE * 3).map(
    () => Math.random() * 0.75 + 0.25
  );

  const {vs, fs} = {
    vs: `\
attribute vec3 positions;
attribute vec3 normals;
attribute vec2 instanceOffsets;
attribute vec3 instanceColors;
attribute vec2 instancePickingColors;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform float uTime;

varying vec3 color;

void main(void) {
  vec3 normal = vec3(uModel * vec4(normals, 1.0));

  // Set up data for modules
  color = instanceColors;
  project_setNormal(normal);
  picking_setPickingColor(vec3(0., instancePickingColors));

  // Vertex position (z coordinate undulates with time), and model rotates around center
  float delta = length(instanceOffsets);
  vec4 offset = vec4(instanceOffsets, sin((uTime + delta) * 0.1) * 16.0, 0);
  gl_Position = uProjection * uView * (uModel * vec4(positions, 1.0) + offset);
}
`,
    fs: `\
#ifdef GL_ES
precision highp float;
#endif

varying vec3 color;

void main(void) {
  gl_FragColor = vec4(color, 1.);
  gl_FragColor = dirlight_filterColor(gl_FragColor);
  gl_FragColor = picking_filterHighlightColor(gl_FragColor);
  gl_FragColor = picking_filterPickingColor(gl_FragColor);
}
`
  };

  return new Cube(gl, {
    vs,
    fs,
    modules: [picking, dirlight],
    isInstanced: 1,
    instanceCount: SIDE * SIDE,
    attributes: {
      instanceOffsets: {value: offsets, size: 2, instanced: 1},
      instanceColors: {value: colors, size: 3, instanced: 1},
      instancePickingColors: {value: pickingColors, size: 2, instanced: 1}
    }
  });
}

animationLoop.getInfo = () => {
  return `
    <p>
    Cube drawn with <b>instanced rendering</b>.
    <p>
    A luma.gl <code>Cube</code>, rendering 65,536 instances in a
    single GPU draw call using instanced vertex attributes.
  `;
};

export default animationLoop;

/* expose on Window for standalone example */
/* global window */
if (typeof window !== 'undefined') {
  window.animationLoop = animationLoop;
}
