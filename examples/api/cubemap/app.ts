// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, NumberArray} from '@luma.gl/core';
import {
  AnimationLoopTemplate,
  AnimationProps,
  CubeGeometry,
  Model,
  ModelProps,
  loadImage,
  AsyncTexture,
  _ShaderInputs
} from '@luma.gl/engine';
import {ShaderModule} from '@luma.gl/shadertools';
import {Matrix4, radians} from '@math.gl/core';

const INFO_HTML = `
<p>
Uses a luma.gl <code>TextureCube</code> to simulate a reflective
surface
</p>
`;

// ROOM CUBE

type AppUniforms = {
  modelMatrix: NumberArray;
  viewMatrix: NumberArray;
  projectionMatrix: NumberArray;
  eyePosition: NumberArray;
};

const app: ShaderModule<AppUniforms, AppUniforms> = {
  name: 'app',
  uniformTypes: {
    modelMatrix: 'mat4x4<f32>',
    viewMatrix: 'mat4x4<f32>',
    projectionMatrix: 'vec3<f32>',
    eyePosition: 'vec3<f32>'
  }
};

class RoomCube extends Model {
  constructor(device: Device, props: Omit<ModelProps, 'vs' | 'fs'>) {
    super(device, {...props, id: 'room-cube', geometry: new CubeGeometry(), vs: RoomCube.vs, fs: RoomCube.fs});
  }

  static vs = /* glsl */ `\
#version 300 es
in vec3 positions;

uniform appUniforms {
  mat4 modelMatrix;
  mat4 viewMatrix;
  mat4 projectionMatrix;
} app;

out vec3 vPosition;

void main(void) {
  gl_Position = app.projectionMatrix * app.viewMatrix * app.modelMatrix * vec4(positions, 1.0);
  vPosition = positions;
}
  `;
  
  static fs = /* glsl */ `\
#version 300 es
precision highp float;

uniform appUniforms {
  mat4 modelMatrix;
  mat4 viewMatrix;
  mat4 projectionMatrix;
} app;

uniform samplerCube uTextureCube;

in vec3 vPosition;
out vec4 fragColor;

void main(void) {
  // The outer cube just samples the texture cube directly
  fragColor = texture(uTextureCube, normalize(vPosition));
}
  `;
}

class Prism extends Model {
  constructor(device: Device, props: Omit<ModelProps, 'vs' | 'fs'>) {
    super(device, {...props, id: 'prism', geometry: new CubeGeometry({indices: true}), vs: Prism.vs, fs: Prism.fs});
  }

  static vs = /* glsl */ `\
#version 300 es
in vec3 positions;
in vec3 normals;
in vec2 texCoords;

out vec3 vPosition;
out vec3 vNormal;
out vec2 vUV;

uniform appUniforms {
  mat4 modelMatrix;
  mat4 viewMatrix;
  mat4 projectionMatrix;
  vec3 eyePosition;
} app;

void main(void) {
  gl_Position = app.projectionMatrix * app.viewMatrix * app.modelMatrix * vec4(positions, 1.0);
  vPosition = vec3(app.modelMatrix * vec4(positions, 1.0));
  vNormal = normalize(vec3(app.modelMatrix * vec4(normals, 0.0)));
  vUV = texCoords;
}
  `;

  static fs = /* glsl */ `\
#version 300 es
precision highp float;

in vec3 vPosition;
in vec3 vNormal;
in vec2 vUV;

out vec4 fragColor;

uniform appUniforms {
  mat4 modelMatrix;
  mat4 viewMatrix;
  mat4 projectionMatrix;
  vec3 eyePosition;
} app;

uniform sampler2D uTexture;
uniform samplerCube uTextureCube;

void main(void) {
  vec4 color = texture(uTexture, vec2(vUV.x, 1.0 - vUV.y));
  vec3 reflectedDir = reflect(normalize(vPosition - app.eyePosition), vNormal);
  vec4 reflectedColor = texture(uTextureCube, reflectedDir);

  fragColor = mix(color, reflectedColor, 0.8);
}
  `;
}

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  cube: RoomCube;
  prism: Prism;

  roomShaderInputs = new _ShaderInputs<{
    app: typeof app.props;
  }>({app});

  prismShaderInputs = new _ShaderInputs<{
    app: typeof app.props;
  }>({app});

  constructor({device}: AnimationProps) {
    super();

    const cubemap = new AsyncTexture(device, {
      dimension: 'cube',
      mipmaps: true,
      // @ts-ignore
      data: (async () => ({
        '+X': await loadImage('sky-posx.png'),
        '-X': await loadImage('sky-negx.png'),
        '+Y': await loadImage('sky-posy.png'),
        '-Y': await loadImage('sky-negy.png'),
        '+Z': await loadImage('sky-posz.png'),
        '-Z': await loadImage('sky-negz.png')
      }))(),
      sampler: {
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'nearest'
      }
    });

    const texture = new AsyncTexture(device, {
      data: loadImage('vis-logo.png'),
      mipmaps: true,
      sampler: {
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'nearest'
      }
    });

    this.cube = new RoomCube(device, {
      shaderInputs: this.roomShaderInputs,
      bindings: {
        uTextureCube: cubemap
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }
    });

    this.prism = new Prism(device, {
      shaderInputs: this.prismShaderInputs,
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
    const eyePosition = [0, -5, 5]; // [5, -3, 5];
    const view = new Matrix4().lookAt({eye: eyePosition});
    const projection = new Matrix4().perspective({fovy: radians(45), aspect, near: 0.001, far: 1000});

    const renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 1],
      clearDepth: 1
    });

    this.roomShaderInputs.setProps({
      app: {
        viewMatrix: view,
        projectionMatrix: projection,
        modelMatrix: new Matrix4().scale([20, 20, 20])
      }
    });
    this.cube.draw(renderPass);

    this.prismShaderInputs.setProps({
      app: {
        eyePosition: eyePosition,
        viewMatrix: view,
        projectionMatrix: projection,
        modelMatrix: new Matrix4().rotateX(tick * 0.01).rotateY(tick * 0.013)
      }
    });
    this.prism.draw(renderPass);

    renderPass.end();
  }
}
