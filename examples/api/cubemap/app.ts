import {Device, loadImage, glsl} from '@luma.gl/api';
import {makeAnimationLoop, AnimationLoopTemplate, AnimationProps, CubeGeometry, Model, ModelProps} from '@luma.gl/engine';
import {GL, clear} from '@luma.gl/webgl-legacy';
import {Matrix4, radians} from '@math.gl/core';

const INFO_HTML = `
<p>
Uses a luma.gl <code>TextureCube</code> to simulate a reflective
surface
</p>
`;

class RoomCube extends Model {
  constructor(device: Device, props: Omit<ModelProps, 'vs' | 'fs'>) {
    const vs = glsl`\
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
    const fs = glsl`\
precision highp float;

uniform samplerCube uTextureCube;
varying vec3 vPosition;

void main(void) {
  // The outer cube just samples the texture cube directly
  gl_FragColor = textureCube(uTextureCube, normalize(vPosition));
}
`;

    super(device, {...props, geometry: new CubeGeometry(), fs, vs});
  }
}

class Prism extends Model {
  constructor(device: Device, props: Omit<ModelProps, 'vs' | 'fs'>) {
    const vs = glsl`\
attribute vec3 positions;
attribute vec3 normals;
attribute vec2 texCoords;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUV;

void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(positions, 1.0);
  vPosition = vec3(uModel * vec4(positions,1));
  vNormal = vec3(uModel * vec4(normals, 0));
  vUV = texCoords;
}
`;
    const fs = glsl`\
precision highp float;

uniform sampler2D uTexture;
uniform samplerCube uTextureCube;
uniform vec3 uEyePosition;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUV;

void main(void) {
  vec4 color = texture2D(uTexture, vec2(vUV.x, 1.0 - vUV.y));
  vec3 reflectedDir = reflect(normalize(vPosition - uEyePosition), vNormal);
  vec4 reflectedColor = textureCube(uTextureCube, reflectedDir);

  gl_FragColor = color * reflectedColor;
}
`;
    super(device, {...props, geometry: new CubeGeometry(), vs, fs});
  }
}

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  cube: RoomCube;
  prism: Prism;

  constructor({device}: AnimationProps) {
    super();

    const cubemap = device.createTexture({
      dimension: 'cube',
      mipmaps: true,
      data: {
        [GL.TEXTURE_CUBE_MAP_POSITIVE_X]: loadImage('sky-posx.png'),
        [GL.TEXTURE_CUBE_MAP_NEGATIVE_X]: loadImage('sky-negx.png'),
        [GL.TEXTURE_CUBE_MAP_POSITIVE_Y]: loadImage('sky-posy.png'),
        [GL.TEXTURE_CUBE_MAP_NEGATIVE_Y]: loadImage('sky-negy.png'),
        [GL.TEXTURE_CUBE_MAP_POSITIVE_Z]: loadImage('sky-posz.png'),
        [GL.TEXTURE_CUBE_MAP_NEGATIVE_Z]: loadImage('sky-negz.png')
      }
    });

    const texture = device.createTexture({
      data: 'vis-logo.png',
      mipmaps: true,
      sampler: {
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'nearest'
      }
    });

    this.cube = new RoomCube(device, {
      bindings: {
        uTextureCube: cubemap
      },
      uniforms: {
        uModel: new Matrix4().scale([20, 20, 20])
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'  
      }
    });

    this.prism = new Prism(device, {
      bindings: {
        uTexture: texture,
        uTextureCube: cubemap,
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }
    });
  }

  override onFinalize(): void {
    this.prism.destroy();
    this.cube.destroy();  
  }

  override onRender({device, aspect, tick}: AnimationProps): void {
    const eyePosition = [5, -3, 5];
    const view = new Matrix4().lookAt({eye: eyePosition});
    const projection = new Matrix4().perspective({fov: radians(75), aspect});

    clear(device, {color: [0, 0, 0, 1], depth: true});

    this.cube.setUniforms({
      uView: view,
      uProjection: projection
    });
    this.cube.draw();

    this.prism.setUniforms({
      uEyePosition: eyePosition,
      uView: view,
      uProjection: projection,
      uModel: new Matrix4().rotateX(tick * 0.01).rotateY(tick * 0.013)
    });
    this.prism.draw();
  }
}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  makeAnimationLoop(AppAnimationLoopTemplate).start();
}
