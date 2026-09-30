// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, type Device, type Texture} from '@luma.gl/core';
import {FlowParticleSimulation, isFlowParticleSimulationSupported} from '@luma.gl/experimental';
import {getTestDevice} from '@luma.gl/test-utils';

for (const backend of ['webgl', 'webgpu'] as const) {
  it(`FlowParticleSimulation integrates metres/second and reuses state on ${backend}`, async context => {
    const device = await getTestDevice(backend);
    if (!device || !isFlowParticleSimulationSupported(device)) return context.skip();
    const fieldTexture = makeField(device, [10, 20]);
    const simulation = new FlowParticleSimulation(device, {
      particleCount: 1,
      field: {texture: fieldTexture, bounds: [0, 0, 100, 100], coordinates: 'cartesian'}
    });
    try {
      const initial = simulation.step(0);
      initial.texture.writeData(new Float32Array([0.5, 0.5, 1, 3]));
      const result = simulation.step(0.1);
      const particle = await readParticle(result.texture);
      expect(particle[0]).toBeCloseTo(0.51, 5);
      expect(particle[1]).toBeCloseTo(0.52, 5);
      expect(particle[2]).toBeCloseTo(1.1, 5);
      expect(particle[3]).toBe(3);
      expect(result.previousTexture).toBe(initial.texture);
      expect(result.texture).not.toBe(initial.texture);
      expect(result.substeps).toBe(3);
      expect(simulation.step(0).texture).toBe(result.texture);
      expect(simulation.step(0).previousTexture).toBe(result.previousTexture);
      expect(simulation.step(0).stateDeltaTime).toBe(result.stateDeltaTime);
      expect(await readParticle(simulation.step(0).texture)).toEqual(particle);
      const next = simulation.step(1 / 60);
      expect(next.texture).toBe(initial.texture);
      const clamped = simulation.step(10);
      expect(clamped.substeps).toBe(8);
      expect(clamped.advancedTime).toBeCloseTo(8 / 30);
      expect(clamped.droppedTime).toBeCloseTo(10 - 8 / 30);
      expect(() => simulation.step(-1)).toThrow();
      expect(() => simulation.step(NaN)).toThrow();
      expect(simulation.byteLength).toBe(32);
    } finally {
      simulation.destroy();
      simulation.destroy();
      expect(fieldTexture.destroyed).toBe(false);
      fieldTexture.destroy();
    }
  });

  it(`FlowParticleSimulation converts geographic eastward speed at latitude on ${backend}`, async context => {
    const device = await getTestDevice(backend);
    if (!device || !isFlowParticleSimulationSupported(device)) return context.skip();
    const fieldTexture = makeField(device, [1111.9508, 0]);
    const simulation = new FlowParticleSimulation(device, {
      particleCount: 1,
      field: {texture: fieldTexture, bounds: [170, 59, 190, 61], coordinates: 'lnglat'}
    });
    try {
      simulation.step(0).texture.writeData(new Float32Array([0.5, 0.5, 1, 0]));
      const particle = await readParticle(simulation.step(0.1).texture);
      // 111.19508m east at 60 degrees equals 0.002 degrees, crossing the dateline continuously.
      expect(particle[0]).toBeCloseTo(0.5001, 6);
      expect(particle[1]).toBeCloseTo(0.5, 6);
    } finally {
      simulation.destroy();
      fieldTexture.destroy();
    }
  });

  it(`FlowParticleSimulation masks missing data and resets reproducibly on ${backend}`, async context => {
    const device = await getTestDevice(backend);
    if (!device || !isFlowParticleSimulationSupported(device)) return context.skip();
    const fieldTexture = makeField(device, [0, 0]);
    const missingTexture = makeField(device, [0, 0], 0);
    const field = {
      texture: fieldTexture,
      bounds: [0, 0, 100, 100] as const,
      coordinates: 'cartesian' as const
    };
    const simulation = new FlowParticleSimulation(device, {
      particleCount: 1,
      field,
      seed: 17,
      lifetime: 1
    });
    try {
      const firstSpawn = await readParticle(simulation.step(0.01).texture);
      expect(firstSpawn[2]).toBeGreaterThanOrEqual(0);
      expect(firstSpawn[2]).toBeLessThan(1);
      expect(firstSpawn[3]).toBe(1);
      simulation.reset();
      expect(await readParticle(simulation.step(0.01).texture)).toEqual(firstSpawn);
      const firstState = simulation.step(0);
      firstState.texture.writeData(new Float32Array([0.5, 0.5, 0.999, 4]));
      const respawn = await readParticle(simulation.step(0.01).texture);
      expect(respawn[2]).toBe(0);
      expect(respawn[3]).toBe(5);
      simulation.setField({...field, texture: missingTexture});
      const missing = await readParticle(simulation.step(0.01).texture);
      expect(missing[2]).toBe(-1);
      expect(missing.every(Number.isFinite)).toBe(true);
      simulation.setField(field);
      expect((await readParticle(simulation.step(0.01).texture))[2]).toBe(0);
      simulation.setField({...field, bounds: [0, 0, 200, 100]});
      expect((await readParticle(simulation.step(0).texture))[2]).toBe(-1);
    } finally {
      simulation.destroy();
      fieldTexture.destroy();
      missingTexture.destroy();
    }
  });
  it(`FlowParticleSimulation preserves row IDs and interpolates a varying field on ${backend}`, async context => {
    const device = await getTestDevice(backend);
    if (!device || !isFlowParticleSimulationSupported(device)) return context.skip();
    const fieldTexture = device.createTexture({
      width: 2,
      height: 2,
      format: 'rgba32float',
      data: new Float32Array([0, 0, 1, 0, 100, 0, 1, 0, 0, 0, 1, 0, 100, 0, 1, 0]),
      sampler: {minFilter: 'nearest', magFilter: 'nearest'}
    });
    const simulation = new FlowParticleSimulation(device, {
      particleCount: 16,
      field: {
        texture: fieldTexture,
        bounds: [1e9, 1e9, 1e9 + 100, 1e9 + 100],
        coordinates: 'cartesian'
      }
    });
    try {
      const initial = new Float32Array(64);
      for (let index = 0; index < 16; index++)
        initial.set([0.1 + index / 40, 0.1 + index / 30, 1, index], index * 4);
      simulation.step(0).texture.writeData(initial);
      const texture = simulation.step(0.1).texture;
      const layout = texture.computeMemoryLayout();
      const buffer = device.createBuffer({
        byteLength: layout.byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      try {
        texture.readBuffer({}, buffer);
        const bytes = await buffer.readAsync();
        for (let index = 0; index < 16; index++) {
          const offset = Math.floor(index / 4) * layout.bytesPerRow + (index % 4) * 16;
          const particle = new Float32Array(bytes.buffer, bytes.byteOffset + offset, 4);
          // Bilinearly interpolated eastward velocity gives dx/dt = x in normalized coordinates.
          expect(particle[0]).toBeCloseTo(initial[index * 4] * Math.exp(0.1), 4);
          expect(particle[1]).toBeCloseTo(initial[index * 4 + 1], 6);
          expect(particle[3]).toBe(index);
        }
      } finally {
        buffer.destroy();
      }
    } finally {
      simulation.destroy();
      fieldTexture.destroy();
    }
  });
}

function makeField(device: Device, velocity: [number, number], validity = 1): Texture {
  return device.createTexture({
    width: 2,
    height: 2,
    format: 'rgba32float',
    data: new Float32Array(Array.from({length: 4}, () => [...velocity, validity, 0]).flat()),
    sampler: {minFilter: 'nearest', magFilter: 'nearest'}
  });
}

async function readParticle(texture: Texture): Promise<number[]> {
  const layout = texture.computeMemoryLayout({width: 1, height: 1});
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({width: 1, height: 1}, buffer);
    const bytes = await buffer.readAsync();
    return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 4));
  } finally {
    buffer.destroy();
  }
}
