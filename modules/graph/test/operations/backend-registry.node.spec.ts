// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {backendRegistry} from '../../src/gpu-simple-graph/operation/backend-registry';
import * as webgpuBackend from '../../src/gpu-simple-graph/operations/webgpu/index';
import * as webglBackend from '../../src/gpu-simple-graph/operations/webgl/index';

afterEach(() => backendRegistry.clear());

for (const [deviceType, defaultBackend] of [
  ['webgpu', webgpuBackend],
  ['webgl', webglBackend]
] as const) {
  test(`${deviceType} partial registrations preserve built-in handlers and custom overrides`, async () => {
    const customInterleave = vi.fn();
    await backendRegistry.add(deviceType, {interleave: customInterleave});

    expect(await backendRegistry.get(deviceType, 'interleave')).toBe(customInterleave);
    expect(await backendRegistry.get(deviceType, 'convertColors')).toBe(
      defaultBackend.convertColors
    );
    expect(await backendRegistry.get(deviceType, 'interleave')).toBe(customInterleave);
    await expect(backendRegistry.get(deviceType, 'unknownOperation')).rejects.toThrow(
      `${deviceType} backend does not implement unknownOperation`
    );
  });
}

test('custom backends do not fall back to built-in handlers', async () => {
  await backendRegistry.add('custom', {});
  await expect(backendRegistry.get('custom', 'convertColors')).rejects.toThrow(
    'custom backend does not implement convertColors'
  );
});
