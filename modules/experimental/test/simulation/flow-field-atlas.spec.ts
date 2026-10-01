// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, type Texture} from '@luma.gl/core';
import {
  FlowFieldAtlas,
  FlowParticleSimulation,
  isFlowParticleSimulationSupported
} from '@luma.gl/experimental';
import {getTestDevice} from '@luma.gl/test-utils';

const PROPS = {
  bounds: [0, 0, 3, 3],
  coordinates: 'cartesian',
  tileSize: [2, 2],
  tileCount: [2, 2]
} as const;

for (const backend of ['webgl', 'webgpu'] as const) {
  it(`FlowFieldAtlas preserves sample orientation and interpolation across seams on ${backend}`, async context => {
    const device = await getTestDevice(backend);
    if (!device || !isFlowParticleSimulationSupported(device)) return context.skip();
    const atlas = new FlowFieldAtlas(device, PROPS);
    const samples = new Float32Array(64);
    for (let row = 0; row < 4; row++)
      for (let column = 0; column < 4; column++) {
        samples.set([1 + row / 10, 0.5 + column / 10, 1, 0], (row * 4 + column) * 4);
      }
    const reference = device.createTexture({
      width: 4,
      height: 4,
      format: 'rgba32float',
      data: samples
    });
    const tiledSimulation = new FlowParticleSimulation(device, {
      particleCount: 1,
      field: atlas.field
    });
    const referenceSimulation = new FlowParticleSimulation(device, {
      particleCount: 1,
      field: {...atlas.field, texture: reference}
    });
    try {
      expect((await readSamples(atlas.texture)).every(value => value === 0)).toBe(true);
      for (let row = 0; row < 2; row++)
        for (let column = 0; column < 2; column++) {
          const tile = new Float32Array(16);
          for (let localRow = 0; localRow < 2; localRow++) {
            const offset = ((row * 2 + localRow) * 4 + column * 2) * 4;
            tile.set(samples.subarray(offset, offset + 8), localRow * 8);
          }
          atlas.writeTile(column, row, tile);
        }
      expect(await readSamples(atlas.texture)).toEqual(Array.from(samples));
      // Cross both tile seams while keeping the same generation and accumulating age.
      const initial = new Float32Array([1.45 / 3, 1.45 / 3, 1, 7]);
      tiledSimulation.step(0).texture.writeData(initial);
      referenceSimulation.step(0).texture.writeData(initial);
      for (let step = 0; step < 4; step++) {
        const tiled = await readSamples(tiledSimulation.step(0.1).texture);
        const expected = await readSamples(referenceSimulation.step(0.1).texture);
        expected.forEach((value, index) => expect(tiled[index]).toBeCloseTo(value, 6));
        expect(tiled[3]).toBe(7);
      }
      const final = await readSamples(tiledSimulation.step(0).texture);
      expect(final[0]).toBeGreaterThan(0.5);
      expect(final[1]).toBeGreaterThan(0.5);
      expect(final[2]).toBeCloseTo(1.4, 5);
      expect(atlas.byteLength).toBe(256);
    } finally {
      tiledSimulation.destroy();
      referenceSimulation.destroy();
      reference.destroy();
      expect(atlas.texture.destroyed).toBe(false);
      atlas.destroy();
      atlas.destroy();
    }
  });

  it(`FlowFieldAtlas updates currents without replacing particles and masks unloaded tiles on ${backend}`, async context => {
    const device = await getTestDevice(backend);
    if (!device || !isFlowParticleSimulationSupported(device)) return context.skip();
    const atlas = new FlowFieldAtlas(device, PROPS);
    const simulation = new FlowParticleSimulation(device, {
      particleCount: 1,
      field: atlas.field,
      seed: 29
    });
    const tile = new Float32Array([1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]);
    try {
      for (let row = 0; row < 2; row++)
        for (let column = 0; column < 2; column++) atlas.writeTile(column, row, tile);
      const first = simulation.step(0).texture;
      first.writeData(new Float32Array([0.5, 0.5, 1, 7]));
      const second = simulation.step(0.1).texture;
      expect((await readSamples(second))[0]).toBeCloseTo(0.5 + 0.1 / 3, 6);
      for (let index = 0; index < 4; index++) tile[index * 4] = -1;
      for (let row = 0; row < 2; row++)
        for (let column = 0; column < 2; column++) atlas.writeTile(column, row, tile);
      expect(simulation.step(0).texture).toBe(second);
      const reversed = simulation.step(0.1);
      expect(reversed.texture).toBe(first);
      const particle = await readSamples(reversed.texture);
      expect(particle[0]).toBeCloseTo(0.5, 6);
      expect(particle[2]).toBeCloseTo(1.2, 5);
      expect(particle[3]).toBe(7);
      atlas.clearTile(1, 1);
      const cleared = await readSamples(atlas.texture);
      for (let row = 0; row < 4; row++)
        for (let column = 0; column < 4; column++) {
          expect(cleared[(row * 4 + column) * 4 + 2]).toBe(row >= 2 && column >= 2 ? 0 : 1);
        }
      // This point is in the interpolation cell adjacent to the missing tile.
      // All four neighbors must be valid, so it must reseed instead of leaking across the seam.
      simulation.step(0).texture.writeData(new Float32Array([0.5, 0.5, 1, 7]));
      expect((await readSamples(simulation.step(0.01).texture))[3]).toBeGreaterThan(7);
      for (let row = 0; row < 2; row++)
        for (let column = 0; column < 2; column++) atlas.clearTile(column, row);
      expect((await readSamples(simulation.step(0.01).texture))[2]).toBe(-1);
      for (let row = 0; row < 2; row++)
        for (let column = 0; column < 2; column++) atlas.writeTile(column, row, tile);
      expect((await readSamples(simulation.step(0.01).texture))[2]).toBe(0);
      simulation.reset();
      const seeded = await readSamples(simulation.step(0.01).texture);
      simulation.reset();
      expect(await readSamples(simulation.step(0.01).texture)).toEqual(seeded);
    } finally {
      simulation.destroy();
      expect(atlas.texture.destroyed).toBe(false);
      atlas.destroy();
    }
  });

  it(`FlowFieldAtlas follows an analytic rotating field across a tile seam on ${backend}`, async context => {
    const device = await getTestDevice(backend);
    if (!device || !isFlowParticleSimulationSupported(device)) return context.skip();
    const atlas = new FlowFieldAtlas(device, {...PROPS, bounds: [-10, -10, 10, 10]});
    const simulation = new FlowParticleSimulation(device, {particleCount: 1, field: atlas.field});
    try {
      for (let row = 0; row < 2; row++)
        for (let column = 0; column < 2; column++) {
          const tile = new Float32Array(16);
          for (let localRow = 0; localRow < 2; localRow++)
            for (let localColumn = 0; localColumn < 2; localColumn++) {
              const east = -10 + ((column * 2 + localColumn) * 20) / 3;
              const north = -10 + ((row * 2 + localRow) * 20) / 3;
              tile.set([-north, east, 1, 0], (localRow * 2 + localColumn) * 4);
            }
          atlas.writeTile(column, row, tile);
        }
      simulation.step(0).texture.writeData(new Float32Array([0.75, 0.45, 1, 3]));
      for (let step = 0; step < 10; step++) simulation.step(0.1);
      const result = await readSamples(simulation.step(0).texture);
      // dx/dt = -y, dy/dt = x: rotate the initial (5, -1) metres by one radian.
      expect(result[0]).toBeCloseTo((10 + 5 * Math.cos(1) + Math.sin(1)) / 20, 4);
      expect(result[1]).toBeCloseTo((10 + 5 * Math.sin(1) - Math.cos(1)) / 20, 4);
      expect(result[2]).toBeCloseTo(2, 5);
      expect(result[3]).toBe(3);
    } finally {
      simulation.destroy();
      atlas.destroy();
    }
  });

  it(`FlowFieldAtlas rejects invalid capacity, domain and tile writes on ${backend}`, async context => {
    const device = await getTestDevice(backend);
    if (!device || !isFlowParticleSimulationSupported(device)) return context.skip();
    expect(() => new FlowFieldAtlas(device, {...PROPS, tileSize: [1, 2]})).toThrow();
    expect(() => new FlowFieldAtlas(device, {...PROPS, tileCount: [1.5, 2]})).toThrow();
    expect(() => new FlowFieldAtlas(device, {...PROPS, tileCount: [0, 2]})).toThrow();
    expect(() => new FlowFieldAtlas(device, {...PROPS, tileSize: [4096, 4096]})).toThrow();
    expect(() => new FlowFieldAtlas(device, {...PROPS, bounds: [0, 0, 0, 3]})).toThrow();
    expect(
      () => new FlowFieldAtlas(device, {...PROPS, coordinates: 'lnglat', bounds: [0, 0, 3, 90]})
    ).toThrow();
    const atlas = new FlowFieldAtlas(device, PROPS);
    try {
      expect(() => atlas.writeTile(0, 0, new Float32Array(15))).toThrow();
      expect(() => atlas.clearTile(2, 0)).toThrow();
      expect(() => atlas.clearTile(-1, 0)).toThrow();
      expect(() => atlas.clearTile(0, 0.5)).toThrow();
      atlas.destroy();
      expect(() => atlas.clearTile(0, 0)).toThrow();
    } finally {
      atlas.destroy();
    }
  });
}

async function readSamples(texture: Texture): Promise<number[]> {
  const layout = texture.computeMemoryLayout();
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({}, buffer);
    const bytes = await buffer.readAsync();
    const samples: number[] = [];
    for (let row = 0; row < texture.height; row++) {
      samples.push(
        ...new Float32Array(
          bytes.buffer,
          bytes.byteOffset + row * layout.bytesPerRow,
          texture.width * 4
        )
      );
    }
    return samples;
  } finally {
    buffer.destroy();
  }
}
