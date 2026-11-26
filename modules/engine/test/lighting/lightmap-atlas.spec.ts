// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {getTestDevices} from '@luma.gl/core/test-utils';
import {Geometry} from '@luma.gl/engine';
import {
  LightmapBaker,
  createLightmapAtlas,
  createPBRLightmapModel,
  createPBRMaterial
} from '@luma.gl/engine/lighting';

test('generated multi-mesh atlas bakes independent chart irradiance and gutter ownership', async context => {
  const devices = await getTestDevices(['webgpu-core', 'webgpu']);
  if (!devices.length) return context.skip('No WebGPU');
  const geometry = new Geometry({
    topology: 'triangle-list',
    attributes: {
      POSITION: {size: 3, value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])},
      NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])}
    }
  });
  const atlas = createLightmapAtlas(
    [
      {id: 'warm', geometry},
      {id: 'cool', geometry}
    ],
    {width: 64, height: 32, texelsPerUnit: 12}
  );
  for (const device of devices) {
    const baker = new LightmapBaker(device, atlas);
    const material = createPBRMaterial(device);
    const ownership = device.createTexture({
      width: atlas.width,
      height: atlas.height,
      format: 'r32float',
      data: atlas.chartOwners
    });
    const models = atlas.charts.map(chart => {
      const mesh = atlas.meshes.find(candidate => candidate.id === chart.meshId)!;
      const model = createPBRLightmapModel(device, {
        geometry: mesh.geometry,
        material,
        firstVertex: chart.firstVertex,
        vertexCount: chart.vertexCount
      });
      model.shaderInputs.setProps({
        lightmapBake: {chartId: chart.id},
        lighting: {
          lights: [
            {type: 'ambient', color: chart.id === 1 ? [255, 0, 0] : [0, 0, 255], intensity: 2}
          ]
        }
      });
      return model;
    });
    const buffer = device.createBuffer({
      byteLength: 256 * atlas.height * 2,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    try {
      baker.update({
        drawSample: ({renderPass}) => models.forEach(model => model.draw(renderPass)),
        chartTexture: ownership,
        dilationSteps: atlas.padding
      });
      device.submit();
      baker.textures.lightmapTexture.readBuffer({}, buffer);
      const bytes = await buffer.readAsync();
      const values = new Uint16Array(
        bytes.buffer,
        bytes.byteOffset,
        atlas.width * atlas.height * 4
      );
      const coverage = [0, 0];
      for (let pixel = 0; pixel < atlas.width * atlas.height; pixel++) {
        const identifier = values[pixel * 4 + 3];
        if (!identifier) continue;
        const chartId = identifier === 0x3c00 ? 1 : identifier === 0x4000 ? 2 : 0;
        expect(chartId).toBeGreaterThan(0);
        expect(atlas.chartOwners[pixel]).toBe(chartId);
        expect(values[pixel * 4 + (chartId === 1 ? 0 : 2)]).toBe(0x4000);
        expect(values[pixel * 4 + (chartId === 1 ? 2 : 0)]).toBe(0);
        coverage[chartId - 1]++;
      }
      expect(coverage[0]).toBeGreaterThan(40);
      expect(coverage[1]).toBeGreaterThan(40);
    } finally {
      buffer.destroy();
      models.forEach(model => model.destroy());
      material.destroy();
      ownership.destroy();
      baker.destroy();
    }
  }
});
