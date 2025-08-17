// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray, VariableShaderType} from '@luma.gl/core';
import {UniformStore, Framebuffer} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {
  AnimationLoopTemplate,
  SphereGeometry,
  Model,
  makeRandomGenerator,
  loadImageBitmap,
  AsyncTexture,
  BackgroundTextureModel,
  ClipSpace,
  getFragmentShaderForRenderPass
} from '@luma.gl/engine';
import {persistenceEffect} from './persistence-effect';
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

  // A single uniform store that manages uniforms for our sphere shader
  uniformStore = new UniformStore<{
    sphere: SphereUniforms;
  }>({
    sphere
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
  screenPass: ClipSpace;
  persistencePass: ClipSpace;

  constructor({device, width, height}: AnimationProps) {
    super();

    this.backgroundTextureModel = new BackgroundTextureModel(device, {
      backgroundTexture: new AsyncTexture(device, {data: loadImageBitmap('background.png')}),
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

    const persistenceFS = getFragmentShaderForRenderPass({
      shaderPass: persistenceEffect,
      action: 'filter',
      shadingLanguage: device.info.shadingLanguage
    });

    this.screenPass = new ClipSpace(device, {});
    this.persistencePass = new ClipSpace(device, {fs: persistenceFS, modules: [persistenceEffect]});

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
    this.screenPass.destroy();
    this.persistencePass.destroy();
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
    this.persistencePass.setBindings({
      sourceTexture: this.mainFramebuffer.colorAttachments[0],
      persistenceTexture: nextFramebuffer.colorAttachments[0]
    });
    this.persistencePass.draw(persistenceRenderPass);
    persistenceRenderPass.end();

    // Copy the current framebuffer to screen
    const screenRenderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
    this.screenPass.setBindings({
      sourceTexture: currentFramebuffer.colorAttachments[0]
    });
    this.screenPass.draw(screenRenderPass);
    this.backgroundTextureModel.draw(screenRenderPass);
    screenRenderPass.end();
  }
}
