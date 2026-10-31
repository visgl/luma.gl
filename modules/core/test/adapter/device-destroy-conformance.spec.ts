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

it('Device resource destruction is observable, idempotent, and restores resource counts', async () => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    await expectResourceDestroyConformance(device, 'VertexArray', () =>
      device.createVertexArray({
        id: `${device.type}-conformance-vertex-array`,
        shaderLayout: EMPTY_SHADER_LAYOUT,
        bufferLayout: []
      })
    );

    await expectResourceDestroyConformance(device, 'Shader', () => createShader(device));

    await expectResourceDestroyConformance(device, 'Fence', async () => {
      const fence = device.createFence();
      await fence.signaled;
      return fence;
    });
  }
});
