import GL from '@luma.gl/constants';
import {AnimationLoop, TextureCube, Cube, setParameters} from 'luma.gl';
import {Matrix4, radians} from 'math.gl';

const INFO_HTML = `
`;

class RoomCube extends Cube {
  constructor(gl, props) {
    const vs = `\
attribute vec3 positions;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

varying vec3 vPosition;

void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(positions, 1.0);
  vPosition = positions;
}
`;
    const fs = `\
precision highp float;

uniform samplerCube uTextureCube1;
uniform samplerCube uTextureCube2;
uniform float uMix;

varying vec3 vPosition;

void main(void) {
  // The outer cube just samples the texture cube directly
  vec4 a = textureCube(uTextureCube1, normalize(vPosition));
  vec4 b = textureCube(uTextureCube2, normalize(vPosition));
  gl_FragColor = mix(a, b, uMix);
}
`;

    super(gl, Object.assign({}, props, {fs, vs}));
  }
}

class AppAnimationLoop extends AnimationLoop {

  onInitialize({gl, canvas}) {
    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true,
      depthFunc: GL.LEQUAL
    });

    const cubemap1 = new TextureCube(gl, {data: getFaceTextures({size: 256, bgColor: 'rgb(230,0,230)'})});
    const cubemap2 = new TextureCube(gl, {data: getFaceTextures({size: 256, bgColor: 'rgb(0,230,230)', text: 'cube'})});

    return {
      cube: new RoomCube(gl, {
        _animationLoop: this,
        uniforms: {
          uTextureCube1: cubemap1,
          uTextureCube2: cubemap2,
          uModel: ({tick}) => new Matrix4().scale([5, 5, 5]).rotateX(tick * 0.007).rotateY(tick * 0.011)
        }
      })
    };
  }

  onRender(animationProps) {
    const {gl, aspect, cube, tick} = animationProps;

    const view = new Matrix4().lookAt({eye: [0, 0, -1]}).translate([0, 0, 4]);
    const projection = new Matrix4().perspective({fov: radians(75), aspect});

    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    cube.draw({
      uniforms: {
        uView: view,
        uProjection: projection,
        uMix: 0.5 + Math.sin(tick * 0.02) / 2.0
      }
    });
  }
}

const animationLoop = new AppAnimationLoop();

animationLoop.getInfo = () => INFO_HTML;

// Create six textures for the cube map sides
function getFaceTextures({size, text, bgColor}) {
  const signs = ['+', '-'];
  const axes = ['X', 'Y', 'Z'];
  const textures = {};

  let face = 0;
  const canvas = typeof document === 'undefined' ? new OffscreenCanvas(size, size) : document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  for (const sign of signs) {
    for (const axis of axes) {
      // reset canvas
      canvas.width = size;
      canvas.height = size;
      drawTexture({ctx, sign, axis: text || axis, size, bgColor});
      const data = ctx.getImageData(0, 0, size, size);
      textures[TextureCube.FACES[face++]] = Promise.resolve(data);
    }
  }
  return textures;
}

// Use canvas API to generate a texture for each side
function drawTexture({ctx, sign, axis, size, bgColor}) {
  const color = 'rgb(0,64,128)';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = bgColor;
  ctx.fillRect(8, 8, size - 16, size - 16);
  ctx.fillStyle = color;
  ctx.font = `${size / 4}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${sign} ${axis} ${sign}`, size / 2, size / 2);
  ctx.strokeStyle = color;
  ctx.strokeRect(0, 0, size, size);
}

export default animationLoop;

/* global window */
if (typeof window !== 'undefined' && !window.website) {
  animationLoop.start();
}
