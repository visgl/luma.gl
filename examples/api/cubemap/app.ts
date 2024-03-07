import {Device, glsl} from '@luma.gl/core';
import {
  AnimationLoopTemplate,
  AnimationProps,
  CubeGeometry,
  Model,
  ModelProps,
  loadImage
} from '@luma.gl/engine';
import {Matrix4, radians} from '@math.gl/core';

const INFO_HTML = `
<p>
Uses a luma.gl <code>TextureCube</code> to simulate a reflective
surface
</p>
`;

// ROOM CUBE

class RoomCube extends Model {
  constructor(device: Device, props: Omit<ModelProps, 'vs' | 'fs'>) {
    const vs = glsl`\
in vec3 positions;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

out vec3 vPosition;

void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(positions, 1.0);
  vPosition = positions;
}
`;
    const fs = glsl`\
precision highp float;

uniform samplerCube uTextureCube;
in vec3 vPosition;
out vec4 fragColor;

void main(void) {
  // The outer cube just samples the texture cube directly
  fragColor = textureCube(uTextureCube, normalize(vPosition));
}
`;

    super(device, {...props, geometry: new CubeGeometry(), fs, vs});
  }
}

class Prism extends Model {
  constructor(device: Device, props: Omit<ModelProps, 'vs' | 'fs'>) {
    const vs = glsl`\
in vec3 positions;
in vec3 normals;
in vec2 texCoords;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

out vec3 vPosition;
out vec3 vNormal;
out vec2 vUV;

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

in vec3 vPosition;
in vec3 vNormal;
in vec2 vUV;

void main(void) {
  vec4 color = texture(uTexture, vec2(vUV.x, 1.0 - vUV.y));
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
      // @ts-ignore
      data: {
        '+X': loadImage('sky-posx.png'),
        '-X': loadImage('sky-negx.png'),
        '+Y': loadImage('sky-posy.png'),
        '-Y': loadImage('sky-negy.png'),
        '+Z': loadImage('sky-posz.png'),
        '-Z': loadImage('sky-negz.png')
      }
    });

    const texture = device.createTexture({
      data: loadImage('vis-logo.png'),
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
        uTextureCube: cubemap
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }
    });
  }

  onFinalize(): void {
    this.prism.destroy();
    this.cube.destroy();
  }

  onRender({device, aspect, tick}: AnimationProps): void {
    const eyePosition = [5, -3, 5];
    const view = new Matrix4().lookAt({eye: eyePosition});
    const projection = new Matrix4().perspective({fovy: radians(75), aspect});

    const renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 1]
      // clearDepth: true
    });

    this.cube.setUniforms({
      uView: view,
      uProjection: projection
    });
    this.cube.draw(renderPass);

    this.prism.setUniforms({
      uEyePosition: eyePosition,
      uView: view,
      uProjection: projection,
      uModel: new Matrix4().rotateX(tick * 0.01).rotateY(tick * 0.013)
    });
    this.prism.draw(renderPass);

    renderPass.end();
  }
}
