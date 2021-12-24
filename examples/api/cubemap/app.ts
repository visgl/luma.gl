import {Device} from '@luma.gl/api';
import {RenderLoop, Model, ModelProps, CubeGeometry, AnimationProps} from '@luma.gl/engine';
import GL from '@luma.gl/constants';
import {Texture2D, TextureCube, loadImage, setParameters} from '@luma.gl/webgl';
import {Matrix4, radians} from '@math.gl/core';

const INFO_HTML = `
<p>
Uses a luma.gl <code>TextureCube</code> to simulate a reflective
surface
</p>
`;

class RoomCube extends Model {
  constructor(device: Device, props: ModelProps) {
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

uniform samplerCube uTextureCube;
varying vec3 vPosition;

void main(void) {
  // The outer cube just samples the texture cube directly
  gl_FragColor = textureCube(uTextureCube, normalize(vPosition));
}
`;

    super(device, {geometry: new CubeGeometry(), ...props, fs, vs});
  }
}

class Prism extends Model {
  constructor(device: Device, props: ModelProps) {
    const vs = `\
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
    const fs = `\
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
    super(device, {geometry: new CubeGeometry(), ...props, vs, fs});
  }
}

export default class AppRenderLoop extends RenderLoop {
  static info = INFO_HTML;

  cube: RoomCube;
  prism: Prism;

  constructor({device, gl}: AnimationProps) {
    super();

    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1
    });

    const cubemap = new TextureCube(gl, {
      data: {
        [gl.TEXTURE_CUBE_MAP_POSITIVE_X]: loadImage('sky-posx.png'),
        [gl.TEXTURE_CUBE_MAP_NEGATIVE_X]: loadImage('sky-negx.png'),
        [gl.TEXTURE_CUBE_MAP_POSITIVE_Y]: loadImage('sky-posy.png'),
        [gl.TEXTURE_CUBE_MAP_NEGATIVE_Y]: loadImage('sky-negy.png'),
        [gl.TEXTURE_CUBE_MAP_POSITIVE_Z]: loadImage('sky-posz.png'),
        [gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]: loadImage('sky-negz.png')
      }
    });

    const texture = device.createTexture({
      data: 'vis-logo.png',
      mipmaps: true,
      parameters: {
        [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
        [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_NEAREST
      }
    });

    this.cube = new RoomCube(device, {
      uniforms: {
        uTextureCube: cubemap,
        uModel: new Matrix4().scale([20, 20, 20])
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'  
      }
    });
    this.prism = new Prism(device, {
      uniforms: {
        uTextureCube: cubemap,
        uTexture: texture
      }
    });
  }

  onFinalize(): void {
    this.prism.destroy();
    this.cube.destroy();  
  }

  onRender({gl, aspect, tick}: AnimationProps): void {
    const eyePosition = [5, -3, 5];
    const view = new Matrix4().lookAt({eye: eyePosition});
    const projection = new Matrix4().perspective({fov: radians(75), aspect});

    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    this.cube.draw({
      uniforms: {
        uView: view,
        uProjection: projection
      }
    });

    this.prism.draw({
      uniforms: {
        uEyePosition: eyePosition,
        uView: view,
        uProjection: projection,
        uModel: new Matrix4().rotateX(tick * 0.01).rotateY(tick * 0.013)
      }
    });
  }
}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  RenderLoop.run(AppRenderLoop);
}
