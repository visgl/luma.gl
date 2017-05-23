/* global document */
import {AnimationLoop, GL, TextureCube, Cube, Matrix4, radians} from 'luma.gl';

const animationLoop = new AnimationLoop({
  onInitialize: ({gl, canvas}) => {
    addControls(canvas);

    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.enable(GL.DEPTH_TEST);
    gl.depthFunc(GL.LEQUAL);

    return {
      cube: getCube(gl),
      prism: getPrism(gl),
      cubemap: new TextureCube(gl, {data: getFaceTextures({size: 512})})
    };
  },
  onRender: ({gl, tick, aspect, cube, prism, cubemap}) => {
    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    const view = Matrix4.lookAt({eye: [0, 0, -1]}).translate([0, 0, 4]);
    const projection = Matrix4.perspective({fov: radians(75), aspect});

    // Red uniforms
    const reflectionElement = document.getElementById('reflection');
    const refractionElement = document.getElementById('refraction');

    const uReflect = reflectionElement ? parseFloat(reflectionElement.value) : 1;
    const uRefract = refractionElement ? parseFloat(refractionElement.value) : 1;

    cube.render({
      uTextureCube: cubemap,
      uModel: new Matrix4().scale([5, 5, 5]),
      uView: view,
      uProjection: projection
    });

    prism.render({
      uTextureCube: cubemap,
      uReflect,
      uRefract,
      uModel: new Matrix4().rotateX(tick * 0.01).rotateY(tick * 0.013),
      uView: view,
      uProjection: projection
    });
  }
});

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

function getCube(gl) {
  return new Cube({
    gl,
    vs: `\
#define SHADER_NAME cube_vertex

attribute vec3 positions;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

varying vec3 vPosition;

void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(positions, 1.0);
  vPosition = positions;
}
`,
    fs: `\
#define SHADER_NAME cube_fragment
#ifdef GL_ES
precision highp float;
#endif

uniform samplerCube uTextureCube;
varying vec3 vPosition;

void main(void) {
  // The outer cube just samples the texture cube directly
  gl_FragColor = textureCube(uTextureCube, normalize(vPosition));
}
`
  });
}

function getPrism(gl) {
  return new Cube({
    gl,
    vs: `\
#define SHADER_NAME prism_vertex

attribute vec3 positions;
attribute vec3 normals;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

varying vec3 vPosition;
varying vec3 vNormal;

void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(positions, 1.0);
  vPosition = vec3(uModel * vec4(positions,1));
  vNormal = vec3(uModel * vec4(normals, 1));
}
`,
    fs: `\
#define SHADER_NAME prism_fragment

#ifdef GL_ES
precision highp float;
#endif

uniform samplerCube uTextureCube;
uniform float uReflect;
uniform float uRefract;

varying vec3 vPosition;
varying vec3 vNormal;

void main(void) {
  vec4 color = vec4(1, 0, 0, 1); // Prism color is red

  // TODO - why is this needed?
  vec3 offsetPosition = vPosition - vec3(0, 0, 2.5);

  // The inner prism samples the texture cube in refract and reflect directions
  vec3 reflectedDir = normalize(reflect(offsetPosition, vNormal));
  vec3 refractedDir = normalize(refract(offsetPosition, vNormal, 0.75));
  vec4 reflectedColor = mix(color, textureCube(uTextureCube, reflectedDir), uReflect);
  vec4 refractedColor = mix(color, textureCube(uTextureCube, refractedDir), uRefract);

  // Mix and multiply to keep it red
  gl_FragColor = color * mix(reflectedColor, refractedColor, 0.5);
}
`
  });
}

// Create six textures for the cube map sides
function getFaceTextures({size}) {
  const signs = ['pos', 'neg'];
  const axes = ['x', 'y', 'z'];
  const textures = {
    pos: {},
    neg: {}
  };

  let face = 0;

  for (const sign of signs) {
    for (const axis of axes) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      drawTexture({ctx, sign, axis, size});
      textures[TextureCube.FACES[face++]] = canvas;
    }
  }
  return textures;
}

// Use canvas API to generate a texture for each side
function drawTexture({ctx, sign, axis, size}) {
  if (axis === 'x' || axis === 'z') {
    ctx.translate(size, size);
    ctx.rotate(Math.PI);
  }
  const color = 'rgb(0,64,128)';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = 'white';
  ctx.fillRect(8, 8, size - 16, size - 16);
  ctx.fillStyle = color;
  ctx.font = `${size / 4}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${sign}-${axis}`, size / 2, size / 2);
  ctx.strokeStyle = color;
  ctx.strokeRect(0, 0, size, size);
}

export default animationLoop;

/* expose on Window for standalone example */
/* global window */
if (typeof window !== 'undefined') {
  window.animationLoop = animationLoop;
}
