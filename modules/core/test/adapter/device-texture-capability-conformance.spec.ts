// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getTestDevices} from '@luma.gl/core/test-utils';

const DEVICE_TYPES = ['webgl', 'webgpu'] as const;

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
