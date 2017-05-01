/* global document */
import {createGLContext, AnimationFrame, GL, TextureCube, Cube, Matrix4, radians} from 'luma.gl';

let animationFrame;

const initExample = (contextName='lumagl-canvas') => {
  if (!animationFrame) {
    animationFrame = new AnimationFrame();

    animationFrame
      .context(() => createGLContext({canvas: contextName}))
      .init(({gl}) => {
        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1);
        gl.enable(GL.DEPTH_TEST);
        gl.depthFunc(GL.LEQUAL);
        gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);

        return {
          cube: getCube(gl),
          prism: getPrism(gl),
          cubemap: new TextureCube(gl, {
            minFilter: gl.LINEAR_MIPMAP_LINEAR,
            magFilter: gl.LINEAR,
            data: genTextures(512),
            flipY: true,
            generateMipmap: true
          })
        };
      })
      .frame(({gl, tick, aspect, cube, prism, cubemap}) => {
        gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

        const view = Matrix4.lookAt({eye: [0, 0, -1]}).translate([0, 0, 4]);
        const projection = Matrix4.perspective({fov: radians(75), aspect});

        cube.render({
          uTexture: cubemap,
          uModel: new Matrix4().scale([5, 5, 5]),
          uView: view,
          uProjection: projection
        });

        const reflection = parseFloat(document.getElementById('reflection').value);
        const refraction = parseFloat(document.getElementById('refraction').value);

        prism.render({
          uTexture: cubemap,
          uModel: new Matrix4().rotateX(tick * 0.01).rotateY(tick * 0.013),
          uView: view,
          uProjection: projection,
          uReflect: reflection,
          uRefract: refraction
        });
      });
  }
  renderControls(contextName);

  return animationFrame;
};

function getCube(gl) {
  return new Cube({
    gl,
    vs: `\
attribute vec3 positions;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

varying vec3 position;

void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(positions, 1.0);
  position = positions;
}
`,
    fs: `\
#ifdef GL_ES
precision highp float;
#endif

uniform samplerCube uTexture;

varying vec3 position;

void main(void) {
  vec4 c = textureCube(uTexture, normalize(position));
  gl_FragColor = vec4(c);
}
`
  });
}

function getPrism(gl) {
  return new Cube({
    gl,
    vs: `\
attribute vec3 positions;
attribute vec3 normals;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

varying vec3 position;
varying vec3 normal;
varying vec3 color;

void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(positions, 1.0);
  position = vec3(uModel * vec4(positions,1));
  normal = vec3(uModel * vec4(normals, 1));
}
`,
    fs: `\
#ifdef GL_ES
precision highp float;
#endif

uniform samplerCube uTexture;
uniform float uReflect;
uniform float uRefract;

varying vec3 position;
varying vec3 normal;

void main(void) {
  vec4 color = vec4(1,0,0,1);
  vec3 n = normalize(normal);
  vec3 f0 = reflect(position - vec3(0,0,2.5), n);
  vec3 f1 = refract(position - vec3(0,0,2.5), n, 0.75);
  vec4 c0 = uReflect * textureCube(uTexture, normalize(f0)) + (1.0 - uReflect) * color;
  vec4 c1 = uRefract * textureCube(uTexture, normalize(f1)) + (1.0 - uRefract) * color;
  vec4 c = 0.5 * c0 + 0.5 * c1;
  gl_FragColor = vec4(c * color);
}
`
  });
}

function genTextures(size) {
  const signs = ['pos', 'neg'];
  const axes = ['x', 'y', 'z'];
  const textures = {
    pos: {},
    neg: {}
  };
  for (const sign of signs) {
    for (const axis of axes) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      drawTexture({ctx, sign, axis, size});
      textures[sign][axis] = canvas;
    }
  }
  return textures;
}

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

function renderControls(canvasId) {
  if (document.querySelector('#controls')) return;

  const canvas = document.querySelector(`#${ canvasId }`);
  const controls = document.createElement('div');
  controls.id = 'controls';
  controls.innerHTML = `
reflection
<input class="valign" id="reflection"
  type="range" min="0.0" max="1.0" value="1.0" step="0.01">
<br>
refraction
<input class="valign" id="refraction"
  type="range" min="0.0" max="1.0" value="1.0" step="0.01">
<br>
  `;
  controls.style.position = 'fixed';
  controls.style.bottom = '40px';
  controls.style.right = '8px';
  controls.style.background = 'rgba(255,255,255,0.9)';
  controls.style.padding = '8px';
  controls.style.fontFamily = 'sans';
  controls.style.textAlign = 'center';

  canvas.parentElement.appendChild(controls);
}

export default initExample;

/* expose on Window for standalone example */
if (typeof window !== 'undefined') {
  window.initExample = initExample;
}
