// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {AmbientOcclusionPass, CORTAOPass} from '@luma.gl/engine/lighting';
import {createOcclusionFixture} from './ambient-occlusion-fixture';

test('measure CORTAO and GTAO GPU pass time at full resolution', async context => {
  const canvas = document.createElement('canvas');
  const device = await webgpuAdapter.create({
    createCanvasContext: {canvas},
    featureLevel: 'max',
    debugGPUTime: true
  });
  try {
    const timestamps = device._enableDebugGPUTime();
    if (!timestamps) return context.skip('WebGPU timestamp queries unavailable');
    for (const [width, height] of [
      [640, 360],
      [1280, 720],
      [1920, 1080]
    ]) {
      const fixture = createOcclusionFixture(device, width, height);
      const cortao = new CORTAOPass(device);
      const gtao = new AmbientOcclusionPass(device, {mode: 'gtao', resolutionScale: 1});
      const methods = {
        cortao: {
          record: () => cortao.render({...fixture, radius: 2.2, maxScreenSpaceRadius: 72 / height}),
          samples: [] as number[]
        },
        gtao: {record: () => gtao.render({...fixture, radius: 2.2}), samples: [] as number[]}
      };
      try {
        for (let iteration = 0; iteration < 40; iteration++) {
          const order =
            iteration % 2 ? (['gtao', 'cortao'] as const) : (['cortao', 'gtao'] as const);
          for (const name of order) {
            const method = methods[name];
            const encoder = device.commandEncoder;
            method.record();
            device.submit();
            await encoder.resolveTimeProfilingQuerySet();
            const milliseconds = encoder._gpuTimeMs ?? 0;
            expect(milliseconds).toBeGreaterThan(0);
            if (iteration >= 10) method.samples.push(milliseconds);
          }
        }
        const results = Object.fromEntries(
          Object.entries(methods).map(([name, {samples}]) => {
            samples.sort((left, right) => left - right);
            return [name, {medianMs: (samples[14] + samples[15]) / 2, p90Ms: samples[26]}];
          })
        );
        console.log(JSON.stringify({width, height, adapter: device.info, samples: 30, results}));
      } finally {
        cortao.destroy();
        gtao.destroy();
        fixture.destroy();
      }
    }
  } finally {
    device._disableDebugGPUTime();
    device.destroy();
  }
}, 120_000);
