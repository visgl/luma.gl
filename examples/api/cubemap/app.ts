// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, NumberArray3, NumberArray16} from '@luma.gl/core';
import {
  AnimationLoopTemplate,
  AnimationProps,
  CubeGeometry,
  Model,
  ModelProps,
  loadImageBitmap,
  AsyncTexture,
  ShaderInputs
} from '@luma.gl/engine';
import {ShaderModule} from '@luma.gl/shadertools';
import {Matrix4, radians} from '@math.gl/core';

// ROOM CUBE

type AppUniforms = {
  modelMatrix: NumberArray16;
  viewMatrix: NumberArray16;
  projectionMatrix: NumberArray16;
  eyePosition: NumberArray3;
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
    super(device, {
      ...props,
      id: 'room-cube',
      geometry: new CubeGeometry(),
      source: RoomCube.source,
      vs: RoomCube.vs,
      fs: RoomCube.fs
    });
  }

  static source = /* wgsl */ `\
struct appUniforms {
  modelMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  projectionMatrix: mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> app : appUniforms;
@group(0) @binding(1) var cubeTexture : texture_cube<f32>;
@group(0) @binding(2) var cubeTextureSampler : sampler;

struct VertexInputs {
  @location(0) positions : vec3<f32>,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) position : vec3<f32>,
};

@vertex 
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  outputs.Position = app.projectionMatrix * app.viewMatrix * app.modelMatrix * vec4<f32>(inputs.positions, 1.0);
  outputs.position = inputs.positions;
  return outputs;
}

@fragment 
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  // The outer cube just samples the texture cube directly
  return textureSample(cubeTexture, cubeTextureSampler, normalize(inputs.position));
}
  `;

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

uniform samplerCube cubeTexture;

in vec3 vPosition;
out vec4 fragColor;

void main(void) {
  // The outer cube just samples the texture cube directly
  fragColor = texture(cubeTexture, normalize(vPosition));
}
  `;
}

class Prism extends Model {
  constructor(device: Device, props: Omit<ModelProps, 'vs' | 'fs'>) {
    super(device, {
      ...props,
      id: 'prism',
      geometry: new CubeGeometry({indices: true}),
      source: Prism.source,
      vs: Prism.vs,
      fs: Prism.fs
    });
  }

  static source = /* wgsl */ `\
struct appUniforms {
  modelMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  projectionMatrix: mat4x4<f32>,
  eyePosition: vec3<f32>,
};

@group(0) @binding(0) var<uniform> app : appUniforms;
@group(0) @binding(1) var cubeTexture : texture_cube<f32>;
@group(0) @binding(2) var cubeTextureSampler : sampler;
@group(0) @binding(3) var prismTexture : texture_2d<f32>;
@group(0) @binding(4) var prismTextureSampler : sampler;

struct VertexInputs {
  @location(0) positions : vec3<f32>,
  @location(1) normals : vec3<f32>,
  @location(2) texCoords : vec2<f32>,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) position : vec3<f32>,
  @location(1) normal : vec3<f32>,
  @location(2) uv : vec2<f32>,
};

@vertex 
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  outputs.Position = app.projectionMatrix * app.viewMatrix * app.modelMatrix * vec4(inputs.positions, 1.0);
  outputs.position = (app.modelMatrix * vec4(inputs.positions, 1.0)).xyz;
  outputs.normal = normalize((app.modelMatrix * vec4(inputs.normals, 0.0)).xyz);
  outputs.uv = inputs.texCoords;
  return outputs;
}

@fragment 
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let color = textureSample(prismTexture, prismTextureSampler, vec2(inputs.uv.x, 1.0 - inputs.uv.y));
  let reflectedDir = reflect(normalize(inputs.position - app.eyePosition), inputs.normal);
  let reflectedColor = textureSample(cubeTexture, cubeTextureSampler, reflectedDir);

  return mix(color, reflectedColor, 0.8);
}
    `;

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

uniform sampler2D prismTexture;
uniform samplerCube cubeTexture;

void main(void) {
  vec4 color = texture(prismTexture, vec2(vUV.x, 1.0 - vUV.y));
  vec3 reflectedDir = reflect(normalize(vPosition - app.eyePosition), vNormal);
  vec4 reflectedColor = texture(cubeTexture, reflectedDir);

  fragColor = mix(color, reflectedColor, 0.8);
}
  `;
}

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `\
Uses a luma.gl <code>TextureCube</code> to simulate a reflective surface
`;

  cube: RoomCube;
  prism: Prism;

  roomShaderInputs = new ShaderInputs<{
    app: typeof app.props;
  }>({app});

  prismShaderInputs = new ShaderInputs<{
    app: typeof app.props;
  }>({app});

  constructor({device}: AnimationProps) {
    super();

    const cubeTexture = new AsyncTexture(device, {
      dimension: 'cube',
      mipmaps: true,
      // @ts-ignore
      data: (async () => ({
        '+X': await loadImageBitmap('sky-posx.png'),
        '-X': await loadImageBitmap('sky-negx.png'),
        '+Y': await loadImageBitmap('sky-posy.png'),
        '-Y': await loadImageBitmap('sky-negy.png'),
        '+Z': await loadImageBitmap('sky-posz.png'),
        '-Z': await loadImageBitmap('sky-negz.png')
      }))(),
      sampler: {
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'nearest'
      }
    });

    const prismTexture = new AsyncTexture(device, {
      data: loadImageBitmap('vis-logo.png'),
      mipmaps: true,
      sampler: {
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'nearest'
      }
    });

    this.cube = new RoomCube(device, {
      shaderInputs: this.roomShaderInputs,
      instanceCount: 1,
      bindings: {
        cubeTexture
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }
    });

    this.prism = new Prism(device, {
      shaderInputs: this.prismShaderInputs,
      instanceCount: 1,
      bindings: {
        prismTexture,
        cubeTexture
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
    const projection = new Matrix4().perspective({
      fovy: radians(45),
      aspect,
      near: 0.001,
      far: 1000
    });

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
        eyePosition,
        viewMatrix: view,
        projectionMatrix: projection,
        modelMatrix: new Matrix4().rotateX(tick * 0.01).rotateY(tick * 0.013)
      }
    });
    this.prism.draw(renderPass);

    renderPass.end();
  }
}
