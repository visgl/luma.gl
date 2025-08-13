// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray, VariableShaderType} from '@luma.gl/core';
import {UniformStore, Framebuffer} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {
  AnimationLoopTemplate,
  Geometry,
  SphereGeometry,
  Model,
  makeRandomGenerator,
  loadImageBitmap,
  DynamicTexture,
  BackgroundTextureModel
} from '@luma.gl/engine';
import {Matrix4, Vector3, radians} from '@math.gl/core';

// SPHERE SHADER

type SphereUniforms = {
  color: NumberArray;
  lighting: boolean;
  modelViewMatrix: NumberArray;
  projectionMatrix: NumberArray;
};

const sphere: {uniformTypes: Record<keyof SphereUniforms, VariableShaderType>} = {
  uniformTypes: {
    // TODO make sure order doesn't matter
    color: 'vec3<f32>',
    lighting: 'f32',
    modelViewMatrix: 'mat4x4<f32>',
    projectionMatrix: 'mat4x3<f32>'
  }
};

const SPHERE_WGSL = /* WGSL */ `\
#version 300 es

struct VertexInputs {
  positions: vec3<f32>;
  normals: vec3<f32>;
}

struct FragmentInputs {
  @builtin(position) position: vec4<f32>;
  normal: vec3<f32>;
}

uniform sphereUniforms {
  // fragment shader
  color: vec3<f32>;
  lighting: bool;
  // vertex shader
  modelViewMatrix: mat4<f32>;
  projectionMatrix: mat4<f32>;
} sphere;

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  const outputs: VertexOutputs;
  gl_Position = sphere.projectionMatrix * sphere.modelViewMatrix * vec4(inputs.positions, 1.0);
  outputs.normal = vec3((sphere.modelViewMatrix * vec4(inputs.normals, 0.0)));
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let attenuation = 1.0;
  if (sphere.lighting) {
    light = normalize(vec3(1,1,2));
    attenuation = dot(normal, light);
  }
  return vec4(sphere.color * attenuation, 1);
}
`;

const SPHERE_VS = /* glsl */ `\
#version 300 es

in vec3 positions;
in vec3 normals;

uniform sphereUniforms {
  // fragment shader
  vec3 color;
  bool lighting;
  // vertex shader
  mat4 modelViewMatrix;
  mat4 projectionMatrix;
} sphere;

out vec3 normal;

void main(void) {
  gl_Position = sphere.projectionMatrix * sphere.modelViewMatrix * vec4(positions, 1.0);
  normal = vec3((sphere.modelViewMatrix * vec4(normals, 0.0)));
}
`;

const SPHERE_FS = /* glsl */ `\
#version 300 es

precision highp float;

uniform sphereUniforms {
  // fragment
  vec3 color;
  bool lighting;
  // vertex
  mat4 modelViewMatrix;
  mat4 projectionMatrix;
} sphere;

in vec3 normal;
out vec4 fragColor;

void main(void) {
  float attenuation = 1.0;
  if (sphere.lighting) {
    vec3 light = normalize(vec3(1,1,2));
    attenuation = dot(normal, light);
  }
  fragColor = vec4(sphere.color * attenuation, 1);
}
`;

// SCREEN QUAD SHADERS

type ScreenQuadUniforms = {
  resolution: NumberArray;
};

const screenQuad: {uniformTypes: Record<keyof ScreenQuadUniforms, VariableShaderType>} = {
  uniformTypes: {
    resolution: 'vec2<f32>'
  }
};

const SCREEN_QUAD_MODULE_WGSL = /* WGSL */ `\
fn getQuadVertex(vertexIndex : u32) -> vec2f {
  // SCREEN QUAD
  let positions = array(
    // 1st triangle
    vec2f( 0.0,  0.0),  // center
    vec2f( 1.0,  0.0),  // right, center
    vec2f( 0.0,  1.0),  // center, top
    // 2st triangle
    vec2f( 0.0,  1.0),  // center, top
    vec2f( 1.0,  0.0),  // right, center
    vec2f( 1.0,  1.0),  // right, top
  );
  return positions[vertexIndex];
}
`;

const SCREEN_QUAD_WGSL = /* WGSL */ `\

${SCREEN_QUAD_MODULE_WGSL}

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) texcoord: vec2f,
};

@vertex fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> FragmentInputs {
  var outputs: FragmentInputs;
  let xy = getQuadVertex(vertexIndex);
  outputs.position = vec4f(xy, 0.0, 1.0);
  outputs.texcoord = xy;
  return outputs;
}

@group(0) @binding(0) var texture : texture_2d<f32>;
@group(0) @binding(1) var sampler : sampler;

@fragment fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  return textureSample(texture, sampler, inputs.texcoord);
}
`;

const SCREEN_QUAD_VS = /* glsl */ `\
#version 300 es

in vec2 aPosition;

void main(void) {
  gl_Position = vec4(aPosition, 0, 1);
}
`;

const SCREEN_QUAD_FS = /* glsl */ `\
#version 300 es

precision highp float;

uniform sampler2D uTexture;

uniform screenQuadUniforms {
  vec2 resolution;
} screenQuad;

out vec4 fragColor;

void main(void) {
  vec2 p = gl_FragCoord.xy/screenQuad.resolution.xy;
  fragColor = texture(uTexture, p);
}
`;

// PERSISTENCE SHADERS

type PersistenceQuadUniforms = {
  resolution: NumberArray;
};

const persistenceQuad: {uniformTypes: Record<keyof ScreenQuadUniforms, VariableShaderType>} = {
  uniformTypes: {
    resolution: 'vec2<f32>'
  }
};

const PERSISTENCE_WGSL = /* WGSL */ `\

${SCREEN_QUAD_MODULE_WGSL}

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) texcoord: vec2f,
};

@vertex fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> FragmentInputs {
  var outputs: FragmentInputs;
  let xy = getQuadVertex(vertexIndex);
  outputs.position = vec4f(xy, 0.0, 1.0);
  outputs.texcoord = xy;
  return outputs;
}

@group(0) @binding(0) var sceneTexture : texture_2d<f32>;
@group(0) @binding(1) var persistenceTexture : texture_2d<f32>;
@group(0) @binding(2) var sampler : sampler;

@fragment 
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let sceneColor = textureSample(sceneTexture, sampler, inputs.texcoord);
  let persistenceColor = textureSample(persistenceTexture, sampler, inputs.texcoord);
  return mix(sceneColor * 4.0, persistenceColor, 0.9);
}
`;

const PERSISTENCE_FS = /* glsl */ `\
#version 300 es

precision highp float;

uniform sampler2D uScene;
uniform sampler2D uPersistence;

uniform persistenceQuadUniforms {
  vec2 resolution;
} persistence;

out vec4 fragColor;

void main(void) {
  vec2 p = gl_FragCoord.xy / persistence.resolution.xy;
  vec4 cS = texture(uScene, p);
  vec4 cP = texture(uPersistence, p);
  fragColor = mix(cS*4.0, cP, 0.9);
}
`;

const random = makeRandomGenerator();

const CORE_COUNT = 64;
const ELECTRON_COUNT = 64;
const electronPosition = [];
const electronRotation = [];
const nucleonPosition = [];

/* eslint-disable max-statements */
export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `
<p>
  Electron trails renderings persist across multiple frames.
<p>
  Uses multiple luma.gl <code>Framebuffer</code>s to hold previously rendered data between frames.
</p>
`;

  // A single uniform store that manages uniforms for all our shaders
  uniformStore = new UniformStore<{
    sphere: SphereUniforms;
    screenQuad: ScreenQuadUniforms;
    persistenceQuad: PersistenceQuadUniforms;
  }>({
    sphere,
    screenQuad,
    persistenceQuad
  });

  /** Model that renders a background texture into transparent areas of the screen */
  backgroundTextureModel: BackgroundTextureModel;
  /** Electron model, will be drawn multiple times */
  electron: Model;
  /** Nucleon model, will be drawn multiple times */
  nucleon: Model;

  /** Model that  */
  mainFramebuffer: Framebuffer;
  pingpongFramebuffers: Framebuffer[];
  screenQuad: Model;
  persistenceQuad: Model;

  constructor({device, width, height}: AnimationProps) {
    super();

    this.backgroundTextureModel = new BackgroundTextureModel(device, {
      backgroundTexture: new DynamicTexture(device, {data: loadImageBitmap('background.png')}),
      blend: true
    });

    this.electron = new Model(device, {
      id: 'electron',
      source: SPHERE_WGSL,
      vs: SPHERE_VS,
      fs: SPHERE_FS,
      geometry: new SphereGeometry({nlat: 20, nlong: 30}), // To test that sphere generation is working properly.
      bindings: {
        sphere: this.uniformStore.getManagedUniformBuffer(device, 'sphere')
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        cullMode: 'back'
      }
    });

    this.nucleon = new Model(device, {
      id: 'nucleon',
      source: SPHERE_WGSL,
      vs: SPHERE_VS,
      fs: SPHERE_FS,
      geometry: new SphereGeometry({nlat: 20, nlong: 30}),
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal',
        cullMode: 'back'
      },
      bindings: {
        sphere: this.uniformStore.getManagedUniformBuffer(device, 'sphere')
      }
    });

    this.mainFramebuffer = device.createFramebuffer({
      width,
      height,
      colorAttachments: ['rgba8unorm'],
      depthStencilAttachment: 'depth24plus'
    });

    this.pingpongFramebuffers = [
      device.createFramebuffer({
        width,
        height,
        colorAttachments: ['rgba8unorm'],
        depthStencilAttachment: 'depth24plus'
      }),
      device.createFramebuffer({
        width,
        height,
        colorAttachments: ['rgba8unorm'],
        depthStencilAttachment: 'depth24plus'
      })
    ];

    const QUAD_POSITIONS = [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1];

    const quadGeometry = new Geometry({
      topology: 'triangle-list',
      attributes: {
        aPosition: {
          value: new Float32Array(QUAD_POSITIONS),
          size: 2
        }
      },
      vertexCount: 6
    });

    this.screenQuad = new Model(device, {
      id: 'quad',
      source: SCREEN_QUAD_WGSL,
      vs: SCREEN_QUAD_VS,
      fs: SCREEN_QUAD_FS,
      geometry: quadGeometry,
      bindings: {
        screenQuad: this.uniformStore.getManagedUniformBuffer(device, 'screenQuad')
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal',
        cullMode: 'back'
      }
    });

    this.persistenceQuad = new Model(device, {
      id: 'persistence-quad',
      source: PERSISTENCE_WGSL,
      vs: SCREEN_QUAD_VS,
      fs: PERSISTENCE_FS,
      geometry: quadGeometry,
      bindings: {
        persistenceQuad: this.uniformStore.getManagedUniformBuffer(device, 'persistenceQuad')
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal',
        cullMode: 'back'
      }
    });

    const dt = 0.0125;

    for (let i = 0; i < ELECTRON_COUNT; i++) {
      // Place electron cloud at random positions
      const pos = new Vector3(random() - 0.5, random() - 0.5, random() - 0.5);

      // Push them out a bit
      const distanceFromCenter = random() + 1.0;
      pos.normalize().scale(distanceFromCenter);
      const s = 1.25;
      pos.scale(s);
      electronPosition.push(pos);

      // Get a random vector andcross
      const q = new Vector3(random() - 0.5, random() - 0.5, random() - 0.5);
      const axis = pos.clone().cross(q).normalize();

      const theta = (4 / distanceFromCenter) * dt;
      const rot = new Matrix4().rotateAxis(theta, axis);
      electronRotation.push(rot);
    }

    for (let i = 0; i < ELECTRON_COUNT; i++) {
      let pos = new Vector3(random() - 0.5, random() - 0.5, random() - 0.5);
      pos = pos.normalize().scale(0.5);
      nucleonPosition.push(pos);
    }
  }

  onFinalize(animationProps: AnimationProps): void {
    this.electron.destroy();
    this.nucleon.destroy();

    this.mainFramebuffer.destroy();
    this.pingpongFramebuffers[0].destroy();
    this.pingpongFramebuffers[1].destroy();
    this.screenQuad.destroy();
    this.persistenceQuad.destroy();
  }

  onRender({device, tick, width, height, aspect}: AnimationProps) {
    this.mainFramebuffer.resize({width, height});
    this.pingpongFramebuffers[0].resize({width, height});
    this.pingpongFramebuffers[1].resize({width, height});

    const projectionMatrix = new Matrix4().perspective({fovy: radians(75), aspect});
    const viewMatrix = new Matrix4().lookAt({eye: [0, 0, 4]});

    const mainRenderPass = device.beginRenderPass({
      framebuffer: this.mainFramebuffer,
      clearColor: [0, 0, 0, 0],
      clearDepth: true
    });

    // Render electrons to framebuffer

    this.uniformStore.setUniforms({sphere: {color: [0.0, 0.5, 1], lighting: false}});

    for (let i = 0; i < ELECTRON_COUNT; i++) {
      electronPosition[i] = electronRotation[i].transformVector(electronPosition[i]);
      const modelMatrix = new Matrix4()
        .translate(electronPosition[i])
        .scale([0.06125, 0.06125, 0.06125]);

      this.uniformStore.setUniforms({
        sphere: {
          modelViewMatrix: viewMatrix.clone().multiplyRight(modelMatrix),
          projectionMatrix
        }
      });
      this.uniformStore.updateUniformBuffers();
      this.electron.draw(mainRenderPass);
    }

    // Render core to framebuffer
    this.uniformStore.setUniforms({
      sphere: {
        color: [1, 0.25, 0.25],
        lighting: true
      }
    });

    for (let i = 0; i < CORE_COUNT; i++) {
      const modelMatrix = new Matrix4()
        .rotateXYZ([tick * 0.013, 0, 0])
        .rotateXYZ([0, tick * 0.021, 0])
        .translate(nucleonPosition[i]);

      const translation = [modelMatrix[12], modelMatrix[13], modelMatrix[14]];
      modelMatrix.identity().translate(translation).scale([0.25, 0.25, 0.25]);

      this.uniformStore.setUniforms({
        sphere: {
          modelViewMatrix: viewMatrix.clone().multiplyRight(modelMatrix),
          projectionMatrix
        }
      });
      this.uniformStore.updateUniformBuffers();
      this.nucleon.draw(mainRenderPass);
    }

    mainRenderPass.end();

    const ppi = tick % 2;
    const currentFramebuffer = this.pingpongFramebuffers[ppi];
    const nextFramebuffer = this.pingpongFramebuffers[1 - ppi];

    // Accumulate in persistence buffer
    const persistenceRenderPass = device.beginRenderPass({
      framebuffer: currentFramebuffer,
      clearColor: [0, 0, 0, 0]
    });
    this.persistenceQuad.setBindings({
      uScene: this.mainFramebuffer.colorAttachments[0],
      uPersistence: nextFramebuffer.colorAttachments[0]
    });
    this.uniformStore.setUniforms({persistenceQuad: {resolution: [width, height]}});
    this.uniformStore.updateUniformBuffers();

    this.persistenceQuad.draw(persistenceRenderPass);
    persistenceRenderPass.end();

    // Copy the current framebuffer to screen
    const screenRenderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
    this.screenQuad.setBindings({
      uTexture: currentFramebuffer.colorAttachments[0]
    });
    this.uniformStore.setUniforms({screenQuad: {resolution: [width, height]}});
    this.uniformStore.updateUniformBuffers();

    this.screenQuad.draw(screenRenderPass);
    this.backgroundTextureModel.draw(screenRenderPass);
    screenRenderPass.end();
  }
}
