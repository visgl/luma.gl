// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('reads tightly packed HDR history before tone mapping', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, readPixel, readRadiance, destroy} = await createMaterialFixture();
  try {
    expect(await readRadiance()).toBeNull();
    options.lights = [];
    options.toneMapMode = 1;
    options.surfaces = [
      {
        ...surface,
        material: {id: 'bright', uniforms: {emissiveFactor: [4, 0, 0]}}
      }
    ];
    expect((await readPixel())[0]).toBeLessThan(255);
    const radiance = await readRadiance();
    expect([radiance?.width, radiance?.height, radiance?.data.length]).toEqual([8, 8, 512]);
    const bytes = new DataView(radiance!.data.buffer);
    expect(bytes.getUint16((4 * 8 + 4) * 8, true)).toBe(0x4400);
  } finally {
    destroy();
  }
}, 120_000);
