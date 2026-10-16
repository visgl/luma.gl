// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {type Device, type Shader} from '@luma.gl/core';
import {getTestDevices} from '@luma.gl/test-utils';

const DEVICE_TYPES = ['webgl', 'webgpu'] as const;
const EMPTY_SHADER_LAYOUT = {attributes: [], bindings: []};

const GLSL_VERTEX_SOURCE = `#version 300 es
void main() {
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

const GLSL_FRAGMENT_SOURCE = `#version 300 es
precision highp float;
out vec4 fragmentColor;
void main() {
  fragmentColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`;

const WGSL_RENDER_SOURCE = `
@vertex fn vertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(0.0, 0.0, 0.0, 1.0);
}

@fragment fn fragmentMain() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0);
}
`;

function getActiveResourceCount(device: Device): number {
  return device.statsManager.getStats('Resource Counts').get('Resources Active').count;
}

/**
 * Creates a resource, then checks that destroying it marks it destroyed, returns the active
 * resource count to its value before creation (including attached sub-resources), and is idempotent.
 */
async function expectResourceDestroyConformance<
  ResourceType extends {destroyed: boolean; destroy(): void}
>(
  device: Device,
  resourceName: string,
  createResource: () => ResourceType | Promise<ResourceType>
): Promise<ResourceType> {
  const countBeforeCreate = getActiveResourceCount(device);
  const resource = await createResource();
  expect(resource.destroyed, `${device.type} ${resourceName} starts active`).toBe(false);
  expect(
    getActiveResourceCount(device),
    `${device.type} ${resourceName} creation increments active resource count`
  ).toBeGreaterThan(countBeforeCreate);

  resource.destroy();
  expect(resource.destroyed, `${device.type} ${resourceName} is marked destroyed`).toBe(true);
  expect(
    getActiveResourceCount(device),
    `${device.type} ${resourceName} destruction restores active resource count`
  ).toBe(countBeforeCreate);

  resource.destroy();
  expect(
    getActiveResourceCount(device),
    `${device.type} repeated ${resourceName} destruction is idempotent`
  ).toBe(countBeforeCreate);
  return resource;
}

async function createShader(device: Device): Promise<Shader> {
  const shader =
    device.info.shadingLanguage === 'wgsl'
      ? device.createShader({source: WGSL_RENDER_SOURCE})
      : device.createShader({stage: 'vertex', source: GLSL_VERTEX_SOURCE});
  await shader.asyncCompilationStatus;
  return shader;
}

async function createRenderShaders(
  device: Device
): Promise<{vertexShader: Shader; fragmentShader: Shader}> {
  if (device.info.shadingLanguage === 'wgsl') {
    const shader = device.createShader({source: WGSL_RENDER_SOURCE});
    await shader.asyncCompilationStatus;
    return {vertexShader: shader, fragmentShader: shader};
  }

  const vertexShader = device.createShader({stage: 'vertex', source: GLSL_VERTEX_SOURCE});
  const fragmentShader = device.createShader({stage: 'fragment', source: GLSL_FRAGMENT_SOURCE});
  await Promise.all([vertexShader.asyncCompilationStatus, fragmentShader.asyncCompilationStatus]);
  return {vertexShader, fragmentShader};
}

it('Device texture storage capabilities agree with storage texture limits', async () => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const capabilities = device.getTextureFormatCapabilities('rgba8unorm');
    const hasStorageTextureBindings =
      device.limits.maxStorageTexturesInVertexStage > 0 ||
      device.limits.maxStorageTexturesInFragmentStage > 0;

    if (!hasStorageTextureBindings) {
      expect(
        capabilities.store,
        `${device.type} does not advertise storage formats without storage bindings`
      ).toBe(false);
    }
  }
});

it('Device resource destruction is observable, idempotent, and restores resource counts', async () => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    // Warm any device-owned shared default resources before taking per-resource baselines.
    device.createTexture({width: 1, height: 1}).destroy();

    await expectResourceDestroyConformance(device, 'Sampler', () =>
      device.createSampler({id: `${device.type}-conformance-sampler`})
    );

    const texture = await expectResourceDestroyConformance(device, 'Texture', () =>
      device.createTexture({
        id: `${device.type}-conformance-texture`,
        width: 1,
        height: 1,
        sampler: {minFilter: 'nearest', magFilter: 'nearest'}
      })
    );
    expect(texture.view.destroyed, `${device.type} Texture destroys its default view`).toBe(true);
    expect(texture.sampler.destroyed, `${device.type} Texture destroys its owned sampler`).toBe(
      true
    );

    await expectResourceDestroyConformance(device, 'Framebuffer', () =>
      device.createFramebuffer({
        id: `${device.type}-conformance-framebuffer`,
        width: 1,
        height: 1,
        colorAttachments: ['rgba8unorm']
      })
    );

    await expectResourceDestroyConformance(device, 'VertexArray', () =>
      device.createVertexArray({
        id: `${device.type}-conformance-vertex-array`,
        shaderLayout: EMPTY_SHADER_LAYOUT,
        bufferLayout: []
      })
    );

    await expectResourceDestroyConformance(device, 'Shader', () => createShader(device));

    const {vertexShader, fragmentShader} = await createRenderShaders(device);
    await expectResourceDestroyConformance(device, 'RenderPipeline', () =>
      device.createRenderPipeline({
        id: `${device.type}-conformance-render-pipeline`,
        vs: vertexShader,
        fs: fragmentShader,
        shaderLayout: EMPTY_SHADER_LAYOUT
      })
    );
    for (const shader of new Set([vertexShader, fragmentShader])) {
      shader.destroy();
    }

    await expectResourceDestroyConformance(device, 'Fence', async () => {
      const fence = device.createFence();
      await fence.signaled;
      return fence;
    });
  }
});

it('Texture#setSampler releases samplers it created when they are replaced', async () => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const texture = device.createTexture({width: 1, height: 1, sampler: {minFilter: 'nearest'}});
    const firstSampler = texture.sampler;
    const countBeforeReplace = getActiveResourceCount(device);

    texture.setSampler({minFilter: 'linear'});
    expect(firstSampler.destroyed, `${device.type} replaced owned sampler is destroyed`).toBe(true);
    expect(getActiveResourceCount(device), `${device.type} sampler count is stable`).toBe(
      countBeforeReplace
    );

    const callerSampler = device.createSampler({});
    texture.setSampler(callerSampler);
    texture.setSampler({minFilter: 'nearest'});
    expect(callerSampler.destroyed, `${device.type} caller-provided sampler is kept`).toBe(false);

    callerSampler.destroy();
    texture.destroy();
  }
});
