// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Texture} from '@luma.gl/core';
import {expect, test} from 'vitest';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {AmbientOcclusionPass, CORTAOPass} from '@luma.gl/engine/lighting';
import {createOcclusionFixture} from './ambient-occlusion-fixture';

test('measure CORTAO and GTAO GPU pass time and scaled CORTAO reconstruction', async context => {
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
      const gtao = new AmbientOcclusionPass(device, {mode: 'gtao', resolutionScale: 1});
      const scales = width === 1920 ? ([1, 0.5, 0.25] as const) : ([1] as const);
      const passes = scales.map(resolutionScale => new CORTAOPass(device, {resolutionScale}));
      const methods = [
        ...passes.map(pass => ({
          name: `cortao-${pass.resolutionScale}`,
          record: () => pass.render({...fixture, radius: 2.2, maxScreenSpaceRadius: 72 / height}),
          samples: [] as number[],
          upsample: pass.resolutionScale < 1 ? ([] as number[]) : null
        })),
        {
          name: 'gtao',
          record: () => gtao.render({...fixture, radius: 2.2}),
          samples: [] as number[],
          upsample: null
        }
      ];
      try {
        for (let iteration = 0; iteration < 50; iteration++) {
          // Rotate the order to distribute warm-up and GPU clock changes across the methods.
          for (let offset = 0; offset < methods.length; offset++) {
            const method = methods[(iteration + offset) % methods.length];
            const encoder = device.commandEncoder;
            method.record();
            const slotCount = encoder.getTimeProfilingSlotCount();
            const snapshot = encoder.captureTimestampQuerySet(timestamps);
            device.submit();
            const values = await snapshot.readResults({firstQuery: 0, queryCount: slotCount});
            let total = 0n;
            for (let slot = 0; slot < slotCount; slot += 2) {
              total += values[slot + 1] - values[slot];
            }
            expect(total).toBeGreaterThan(0n);
            if (iteration >= 20) {
              method.samples.push(Number(total) / 1e6);
              method.upsample?.push(Number(values[slotCount - 1] - values[slotCount - 2]) / 1e6);
            }
          }
        }
        const results = Object.fromEntries(
          methods.map(({name, samples, upsample}) => [
            name,
            {...summarizeTimings(samples), ...(upsample && {upsample: summarizeTimings(upsample)})}
          ])
        );
        console.log(JSON.stringify({width, height, adapter: device.info, samples: 30, results}));
        if (width === 1920) {
          const detail = createOcclusionFixture(device, width, height, 'depth32float', true);
          try {
            device._disableDebugGPUTime();
            const masks = [];
            for (const pass of passes) {
              const output = pass.render({
                ...detail,
                radius: 2.2,
                maxScreenSpaceRadius: 72 / height
              });
              device.submit();
              masks.push(await readVisibility(output));
            }
            const [full, half, quarter] = masks;
            console.log(
              JSON.stringify({
                quality: {
                  half: compareVisibility(full, half),
                  quarter: compareVisibility(full, quarter)
                }
              })
            );
          } finally {
            detail.destroy();
          }
        }
      } finally {
        passes.forEach(pass => pass.destroy());
        gtao.destroy();
        fixture.destroy();
      }
    }
  } finally {
    device._disableDebugGPUTime();
    device.destroy();
  }
}, 120_000);

function summarizeTimings(samples: number[]) {
  samples.sort((left, right) => left - right);
  return {medianMs: (samples[14] + samples[15]) / 2, p90Ms: samples[26]};
}

async function readVisibility(texture: Texture): Promise<Uint8Array> {
  const {width, height, device} = texture;
  const {byteLength, bytesPerRow} = texture.computeMemoryLayout();
  const readback = device.createBuffer({byteLength, usage: Buffer.COPY_DST | Buffer.MAP_READ});
  try {
    texture.readBuffer({}, readback);
    const bytes = await readback.readAsync();
    const visibility = new Uint8Array(width * height);
    for (let row = 0; row < height; row++) {
      for (let column = 0; column < width; column++) {
        visibility[row * width + column] = bytes[row * bytesPerRow + column * 4];
      }
    }
    return visibility;
  } finally {
    readback.destroy();
  }
}

function compareVisibility(reference: Uint8Array, result: Uint8Array) {
  let absoluteError = 0;
  let affectedError = 0;
  let affectedPixels = 0;
  let differencesOverTen = 0;
  for (let index = 0; index < reference.length; index++) {
    const difference = Math.abs(reference[index] - result[index]);
    absoluteError += difference;
    if (reference[index] < 250 || result[index] < 250) {
      affectedPixels++;
      affectedError += difference;
    }
    if (difference > 10) differencesOverTen++;
  }
  return {
    meanAbsoluteError: absoluteError / reference.length,
    affectedMeanAbsoluteError: affectedError / affectedPixels,
    affectedPixels,
    differencesOverTen
  };
}
