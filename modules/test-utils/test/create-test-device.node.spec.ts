// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';

test('null test devices remain compatible with pipeline factories after a module reset', async () => {
  const original = await import('../src/create-test-device');
  await original.getNullTestDevice();
  // Mocking specs reset modules in a reused Node worker. A global device from the previous
  // module graph creates pipelines whose base class differs from the reloaded factory's class.
  vi.resetModules();
  const reloaded = await import('../src/create-test-device');
  const {PipelineFactory} = await import('@luma.gl/core');
  const device = await reloaded.getNullTestDevice();
  expect(await reloaded.getNullTestDevice()).toBe(device);
  const factory = new PipelineFactory(device);
  const shader = device.createShader({stage: 'vertex', source: 'void main() {}'});
  const pipeline = factory.createRenderPipeline({vs: shader, topology: 'triangle-list'});
  try {
    expect(() => factory.release(pipeline)).not.toThrow();
  } finally {
    pipeline.destroy();
    shader.destroy();
  }
});
