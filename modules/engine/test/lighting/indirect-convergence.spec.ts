// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {createLightmapAtlas, LightmapBaker, readLightmapData} from '@luma.gl/engine/lighting';
import {IndirectLightmap} from '../../../../examples/api/lightmap-baking/indirect-lightmap';
import {makeBakingScene} from '../../../../examples/api/lightmap-baking/scenes';
import type {Light} from '@luma.gl/shaders';
import {test} from 'vitest';

test('measure indirect lightmap convergence', async () => {
  const device = await webgpuAdapter.create({
    createCanvasContext: {canvas: new OffscreenCanvas(1, 1)}
  });
  const lights: Light[] = [
    {type: 'point', position: [-1.5, 2.4, -0.6], attenuation: [0.25, 0, 1], color: [5, 2, 0.5]},
    {type: 'point', position: [1.5, 2.4, -0.6], attenuation: [0.25, 0, 1], color: [0.5, 2, 5]}
  ];
  try {
    for (const scene of ['courtyard', 'gallery', 'workshop'] as const) {
      const atlas = createLightmapAtlas([{id: scene, geometry: makeBakingScene(scene)}], {
        width: 512,
        height: 512,
        texelsPerUnit: 12
      });

      const baker = new LightmapBaker(device, {width: atlas.width, height: atlas.height});
      const indirect = new IndirectLightmap(device, atlas.meshes[0].geometry, atlas);
      const snapshots = [];
      try {
        const start = performance.now();
        for (let index = 0; index < 384; index++) {
          baker.update({
            prepareSample: () => indirect.update(lights, index),
            drawSample: ({renderPass}) => indirect.draw(renderPass)
          });
          device.submit();
          if ([24, 48, 96, 192, 384].includes(index + 1)) {
            const data = await readLightmapData(baker.textures.lightmapTexture);
            snapshots.push({
              samples: index + 1,
              milliseconds: performance.now() - start,
              data: data.data
            });
          }
        }
      } finally {
        indirect.destroy();
        baker.destroy();
      }
      const reference = snapshots.at(-1)!.data;
      console.log(
        JSON.stringify({
          scene,
          checkpoints: snapshots.map(({samples, milliseconds, data}) => {
            let error = 0;
            let energy = 0;
            const mean = [0, 0, 0];
            const referenceMean = [0, 0, 0];
            for (let offset = 0; offset < reference.length; offset += 4) {
              for (let channel = 0; channel < 3; channel++) {
                error += (data[offset + channel] - reference[offset + channel]) ** 2;
                energy += reference[offset + channel] ** 2;
                mean[channel] += data[offset + channel];
                referenceMean[channel] += reference[offset + channel];
              }
            }
            return {
              samples,
              milliseconds,
              relativeRms: Math.sqrt(error / energy),
              rgbRatio: mean.map((value, channel) => value / referenceMean[channel])
            };
          })
        })
      );
    }
  } finally {
    device.destroy();
  }
}, 240000);
