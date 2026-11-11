// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {getWebGPUTestDevices, getWebGLTestDevice} from '@luma.gl/core/test-utils';
import {
  createLightmapFromData,
  readLightmapData,
  encodeLightmapData,
  decodeLightmapData,
  type LightmapData
} from '@luma.gl/engine/lighting';
test('odd-width HDR atlas readback, export and reupload preserve rows and ownership', async context => {
  const webgl = await getWebGLTestDevice();
  const devices = [...(await getWebGPUTestDevices()), ...(webgl ? [webgl] : [])];
  if (!devices.length) return context.skip();
  for (const device of devices) {
    const input: LightmapData = {
      version: 1,
      width: 3,
      height: 5,
      uvSet: 1,
      encoding: 'linear-irradiance',
      data: Float32Array.from({length: 60}, (_, index) => index / 4)
    };
    expect(() =>
      createLightmapFromData(device, {...input, data: new Float32Array(60).fill(65505)})
    ).toThrow();
    expect(() =>
      createLightmapFromData(device, {...input, data: new Float32Array(60).fill(NaN)})
    ).toThrow();
    const first = createLightmapFromData(device, input);
    try {
      const exported = await readLightmapData(first.textures.lightmapTexture);
      expect(exported).toEqual(input);
      const second = createLightmapFromData(
        device,
        decodeLightmapData(encodeLightmapData(exported))
      );
      try {
        first.destroy();
        expect(await readLightmapData(second.textures.lightmapTexture)).toEqual(input);
      } finally {
        second.destroy();
      }
    } finally {
      first.destroy();
    }
  }
});
