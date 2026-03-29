// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray, VariableShaderType} from '@luma.gl/core';
import type {NumericArray} from '@math.gl/types';
import {Buffer, UniformStore, Framebuffer, Texture} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {
  AnimationLoopTemplate,
  SphereGeometry,
  Model,
  makeRandomGenerator,
  loadImageBitmap,
  DynamicTexture,
  BackgroundTextureModel,
  ClipSpace
} from '@luma.gl/engine';
import {Matrix4, Vector3, radians} from '@math.gl/core';

// SPHERE SHADER

type SphereUniforms = {
  colorAndLighting: NumberArray;
  modelViewMatrix: NumberArray;
  projectionMatrix: NumberArray;
};

const sphere: {uniformTypes: Record<keyof SphereUniforms, VariableShaderType>} = {
  uniformTypes: {
    // TODO make sure order doesn't matter
    colorAndLighting: 'vec4<f32>',
    modelViewMatrix: 'mat4x4<f32>',
    projectionMatrix: 'mat4x4<f32>'
  }
};

const SPHERE_WGSL = /* WGSL */ `\
struct SphereUniforms {
  colorAndLighting: vec4<f32>,
  modelViewMatrix: mat4x4<f32>,
  projectionMatrix: mat4x4<f32>,
};

@group(0) @binding(auto) var<uniform> sphere : SphereUniforms;

struct VertexInputs {
  @location(0) positions: vec3<f32>,
  @location(1) normals: vec3<f32>,
};

struct VertexOutputs {
  @builtin(position) position: vec4<f32>,
  @location(0) normal: vec3<f32>,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> VertexOutputs {
  var outputs: VertexOutputs;
  outputs.position = sphere.projectionMatrix * sphere.modelViewMatrix * vec4(inputs.positions, 1.0);
  outputs.normal = vec3((sphere.modelViewMatrix * vec4(inputs.normals, 0.0)).xyz);
  return outputs;
}

@fragment
fn fragmentMain(inputs: VertexOutputs) -> @location(0) vec4<f32> {
  var attenuation = 1.0;
  if (sphere.colorAndLighting.a > 0.5) {
    let light = normalize(vec3(1.0, 1.0, 2.0));
    attenuation = max(dot(inputs.normal, light), 0.0);
  }
  return vec4(sphere.colorAndLighting.rgb * attenuation, 1.0);
}
`;

const SPHERE_VS = /* glsl */ `\
#version 300 es

in vec3 positions;
in vec3 normals;

uniform sphereUniforms {
  // fragment shader
  vec4 colorAndLighting;
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
  vec4 colorAndLighting;
  // vertex
  mat4 modelViewMatrix;
  mat4 projectionMatrix;
} sphere;

in vec3 normal;
out vec4 fragColor;

void main(void) {
  float attenuation = 1.0;
  if (sphere.colorAndLighting.a > 0.5) {
    vec3 light = normalize(vec3(1,1,2));
    attenuation = max(dot(normal, light), 0.0);
  }
  fragColor = vec4(sphere.colorAndLighting.rgb * attenuation, 1);
}
`;

const PERSISTENCE_WGSL = /* WGSL */ `\
@group(0) @binding(auto) var sourceTexture : texture_2d<f32>;
@group(0) @binding(auto) var sourceTextureSampler : sampler;
@group(0) @binding(auto) var persistenceTexture : texture_2d<f32>;
@group(0) @binding(auto) var persistenceTextureSampler : sampler;

fn getCoverage(color: vec4f) -> f32 {
  return max(color.a, max(color.r, max(color.g, color.b)));
}

@fragment
fn fragmentMain(
  @location(2) uv: vec2<f32>
) -> @location(0) vec4f {
  let sceneColor = textureSample(sourceTexture, sourceTextureSampler, uv);
  let persistenceColor = textureSample(persistenceTexture, persistenceTextureSampler, uv);
  let accumulatedColor = min(
    mix(sceneColor.rgb * 4.0, persistenceColor.rgb, vec3f(0.9, 0.9, 0.9)),
    vec3f(1.0, 1.0, 1.0)
  );
  let accumulatedAlpha = max(getCoverage(sceneColor), persistenceColor.a * 0.9);
  return vec4f(accumulatedColor, accumulatedAlpha);
}
`;

const PERSISTENCE_FS = /* glsl */ `\
#version 300 es

precision highp float;

uniform sampler2D sourceTexture;
uniform sampler2D persistenceTexture;

in vec2 uv;
out vec4 fragColor;

float getCoverage(vec4 color) {
  return max(color.a, max(color.r, max(color.g, color.b)));
}

void main(void) {
  vec2 p = uv;
  vec4 sceneColor = texture(sourceTexture, p);
  vec4 persistenceColor = texture(persistenceTexture, p);
  vec3 accumulatedColor = min(mix(sceneColor.rgb * 4.0, persistenceColor.rgb, vec3(0.9)), vec3(1.0));
  float accumulatedAlpha = max(getCoverage(sceneColor), persistenceColor.a * 0.9);
  fragColor = vec4(accumulatedColor, accumulatedAlpha);
}
`;

const SCREEN_WGSL = /* WGSL */ `\
@group(0) @binding(auto) var sourceTexture: texture_2d<f32>;
@group(0) @binding(auto) var sourceTextureSampler: sampler;

@fragment
fn fragmentMain(
  @location(2) uv: vec2<f32>
) -> @location(0) vec4f {
  return textureSample(sourceTexture, sourceTextureSampler, uv);
}
`;

const SCREEN_FS = /* glsl */ `\
#version 300 es

precision highp float;

uniform sampler2D sourceTexture;

in vec2 uv;
out vec4 fragColor;

void main(void) {
  fragColor = texture(sourceTexture, uv);
}
`;

const random = makeRandomGenerator();
const OFFSCREEN_COLOR_FORMAT = 'rgba8unorm';

const CORE_COUNT = 64;
const ELECTRON_COUNT = 64;
const electronPosition: NumericArray[] = [];
const electronRotation: Matrix4[] = [];
const nucleonPosition: NumericArray[] = [];

/* eslint-disable max-statements */
export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `
<p>
  Electron trails renderings persist across multiple frames.
</p>
<p>
  Uses multiple luma.gl <code>Framebuffer</code>s to hold previously rendered data between frames.
</p>
`;

  // A single uniform store that manages uniforms for our sphere shader
  uniformStore: UniformStore<{
    sphere: SphereUniforms;
  }>;

  /** Background texture used for final screen compositing */
  backgroundTexture: DynamicTexture;
  backgroundTextureModel: BackgroundTextureModel;
  /** Electron model, will be drawn multiple times */
  electron: Model;
  /** Nucleon model, will be drawn multiple times */
  nucleon: Model;
  electronUniformBuffers: Buffer[];
  nucleonUniformBuffers: Buffer[];

  /** Model that  */
  mainFramebuffer: Framebuffer;
  pingpongFramebuffers: Framebuffer[];
  screenPass: ClipSpace;
  persistencePass: ClipSpace;
  persistenceFramebufferSize: [number, number] | null = null;

  constructor({device, width, height}: AnimationProps) {
    super();

    this.uniformStore = new UniformStore(device, {
      sphere
    });
    this.electronUniformBuffers = this.createSphereUniformBuffers(device, ELECTRON_COUNT);
    this.nucleonUniformBuffers = this.createSphereUniformBuffers(device, CORE_COUNT);

    this.backgroundTexture = new DynamicTexture(device, {data: loadImageBitmap('background.png')});
    this.backgroundTextureModel = new BackgroundTextureModel(device, {
      backgroundTexture: this.backgroundTexture
    });

    this.electron = new Model(device, {
      id: 'electron',
      source: SPHERE_WGSL,
      vs: SPHERE_VS,
      fs: SPHERE_FS,
      colorAttachmentFormats: [OFFSCREEN_COLOR_FORMAT],
      geometry: new SphereGeometry({nlat: 20, nlong: 30}), // To test that sphere generation is working properly.
      bindings: {
        sphere: this.electronUniformBuffers[0]
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
      colorAttachmentFormats: [OFFSCREEN_COLOR_FORMAT],
      geometry: new SphereGeometry({nlat: 20, nlong: 30}),
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal',
        cullMode: 'back'
      },
      bindings: {
        sphere: this.nucleonUniformBuffers[0]
      }
    });

    this.mainFramebuffer = device.createFramebuffer({
      width,
      height,
      colorAttachments: [
        createOffscreenColorAttachment(device, 'main-framebuffer-color', width, height)
      ],
      depthStencilAttachment: 'depth24plus'
    });

    this.pingpongFramebuffers = [
      device.createFramebuffer({
        width,
        height,
        colorAttachments: [
          createOffscreenColorAttachment(device, 'persistence-framebuffer-0-color', width, height)
        ]
      }),
      device.createFramebuffer({
        width,
        height,
        colorAttachments: [
          createOffscreenColorAttachment(device, 'persistence-framebuffer-1-color', width, height)
        ]
      })
    ];

    this.screenPass = new ClipSpace(
      device,
      device.info.shadingLanguage === 'wgsl'
        ? {
            source: SCREEN_WGSL,
            colorAttachmentFormats: [device.preferredColorFormat],
            parameters: {
              blend: true,
              blendColorOperation: 'add',
              blendAlphaOperation: 'add',
              blendColorSrcFactor: 'src-alpha',
              blendColorDstFactor: 'one-minus-src-alpha',
              blendAlphaSrcFactor: 'one',
              blendAlphaDstFactor: 'one-minus-src-alpha'
            }
          }
        : {
            fs: SCREEN_FS,
            parameters: {
              blend: true,
              blendColorOperation: 'add',
              blendAlphaOperation: 'add',
              blendColorSrcFactor: 'src-alpha',
              blendColorDstFactor: 'one-minus-src-alpha',
              blendAlphaSrcFactor: 'one',
              blendAlphaDstFactor: 'one-minus-src-alpha'
            }
          }
    );
    this.persistencePass = new ClipSpace(
      device,
      device.info.shadingLanguage === 'wgsl'
        ? {source: PERSISTENCE_WGSL, colorAttachmentFormats: [OFFSCREEN_COLOR_FORMAT]}
        : {fs: PERSISTENCE_FS}
    );

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
    this.uniformStore.destroy();
    this.backgroundTexture.destroy();
    this.backgroundTextureModel.destroy();
    this.electron.destroy();
    this.nucleon.destroy();
    for (const uniformBuffer of this.electronUniformBuffers) {
      uniformBuffer.destroy();
    }
    for (const uniformBuffer of this.nucleonUniformBuffers) {
      uniformBuffer.destroy();
    }

    this.mainFramebuffer.destroy();
    this.pingpongFramebuffers[0].destroy();
    this.pingpongFramebuffers[1].destroy();
    this.screenPass.destroy();
    this.persistencePass.destroy();
  }

  onRender({device, tick, width, height, aspect}: AnimationProps) {
    if (!this.backgroundTexture.isReady) {
      return;
    }

    const needsPersistenceReset =
      !this.persistenceFramebufferSize ||
      this.persistenceFramebufferSize[0] !== width ||
      this.persistenceFramebufferSize[1] !== height;

    this.mainFramebuffer.resize({width, height});
    this.pingpongFramebuffers[0].resize({width, height});
    this.pingpongFramebuffers[1].resize({width, height});

    if (needsPersistenceReset) {
      this.clearPersistenceFramebuffers(device);
      this.persistenceFramebufferSize = [width, height];
    }

    const projectionMatrix = new Matrix4().perspective({fovy: radians(75), aspect});
    const viewMatrix = new Matrix4().lookAt({eye: [0, 0, 4]});

    const mainRenderPass = device.beginRenderPass({
      framebuffer: this.mainFramebuffer,
      clearColor: [0, 0, 0, 0],
      clearDepth: 1,
      clearStencil: false
    });

    // Render electrons to framebuffer

    this.uniformStore.setUniforms({sphere: {colorAndLighting: [0.0, 0.5, 1.0, 0.0]}});

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
      this.electronUniformBuffers[i].write(this.uniformStore.getUniformBufferData('sphere'));
      this.electron.setBindings({sphere: this.electronUniformBuffers[i]});
      this.electron.draw(mainRenderPass);
    }

    // Render core to framebuffer
    this.uniformStore.setUniforms({
      sphere: {
        colorAndLighting: [1.0, 0.25, 0.25, 1.0]
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
      this.nucleonUniformBuffers[i].write(this.uniformStore.getUniformBufferData('sphere'));
      this.nucleon.setBindings({sphere: this.nucleonUniformBuffers[i]});
      this.nucleon.draw(mainRenderPass);
    }

    mainRenderPass.end();

    const ppi = tick % 2;
    const currentFramebuffer = this.pingpongFramebuffers[ppi];
    const nextFramebuffer = this.pingpongFramebuffers[1 - ppi];

    // Accumulate in persistence buffer
    const persistenceRenderPass = device.beginRenderPass({
      framebuffer: currentFramebuffer,
      clearColor: [0, 0, 0, 0],
      clearDepth: false,
      clearStencil: false
    });
    this.persistencePass.setBindings({
      sourceTexture: this.mainFramebuffer.colorAttachments[0].texture,
      persistenceTexture: nextFramebuffer.colorAttachments[0].texture
    });
    this.persistencePass.draw(persistenceRenderPass);
    persistenceRenderPass.end();

    // Copy the current framebuffer to screen
    const screenRenderPass = device.beginRenderPass({
      framebuffer: device
        .getDefaultCanvasContext()
        .getCurrentFramebuffer({depthStencilFormat: false}),
      clearColor: [0, 0, 0, 0]
    });
    if (this.backgroundTexture.isReady) {
      this.backgroundTextureModel.draw(screenRenderPass);
    }
    this.screenPass.setBindings({
      sourceTexture: currentFramebuffer.colorAttachments[0].texture
    });
    this.screenPass.draw(screenRenderPass);
    this.screenPass.setBindings({
      sourceTexture: this.mainFramebuffer.colorAttachments[0].texture
    });
    this.screenPass.draw(screenRenderPass);
    screenRenderPass.end();
  }

  clearPersistenceFramebuffers(device: AnimationProps['device']) {
    for (const framebuffer of this.pingpongFramebuffers) {
      const renderPass = device.beginRenderPass({
        framebuffer,
        clearColor: [0, 0, 0, 0],
        clearDepth: false,
        clearStencil: false
      });
      renderPass.end();
    }
  }

  createSphereUniformBuffers(device: AnimationProps['device'], count: number): Buffer[] {
    const byteLength = this.uniformStore.getUniformBufferByteLength('sphere');
    return Array.from({length: count}, () =>
      device.createBuffer({
        usage: Buffer.UNIFORM | Buffer.COPY_DST,
        byteLength
      })
    );
  }
}

function createOffscreenColorAttachment(
  device: AnimationProps['device'],
  id: string,
  width: number,
  height: number
) {
  if (device.type !== 'webgpu') {
    return OFFSCREEN_COLOR_FORMAT;
  }

  return device.createTexture({
    id,
    format: OFFSCREEN_COLOR_FORMAT,
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER,
    sampler: {
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'none'
    }
  });
}
