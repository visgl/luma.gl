// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {SpectralOceanSimulation} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

it('SpectralOceanSimulation produces finite evolving displacements and unit normals', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const simulation = new SpectralOceanSimulation(device, {
    id: 'spectral-ocean-numerical-test',
    resolution: 16,
    patchSize: 64,
    windDirection: [0.8, 0.6],
    windSpeed: 14,
    amplitude: 0.00035,
    foamDecay: 0.2,
    foamThreshold: 1,
    foamGain: 4,
    seed: 29
  });

  try {
    const firstEncoder = device.createCommandEncoder({id: 'spectral-ocean-first-step'});
    const firstOutputs = simulation.encode(firstEncoder, {
      time: 0,
      deltaTime: 1 / 60
    });
    device.submit(firstEncoder.finish());

    expect(firstOutputs, 'encode returns stable output references').toBe(simulation.outputs);
    expect(Boolean(Object.isFrozen(firstOutputs)), 'the output reference set is immutable').toBe(
      true
    );
    expect(
      Boolean(firstOutputs.displacementBuffer.usage & Buffer.VERTEX),
      'displacements are vertex-readable'
    ).toBe(true);
    expect(
      Boolean(firstOutputs.normalFoamBuffer.usage & Buffer.STORAGE),
      'normal/foam is storage-readable'
    ).toBe(true);

    const firstDisplacements = await readFloat32(
      firstOutputs.displacementBuffer,
      simulation.stats.elementCount * 4
    );
    const firstNormalFoam = await readFloat32(
      firstOutputs.normalFoamBuffer,
      simulation.stats.elementCount * 4
    );
    expect(
      Boolean(firstDisplacements.every(Number.isFinite)),
      'every displacement component is finite'
    ).toBe(true);
    expect(
      Boolean(firstNormalFoam.every(Number.isFinite)),
      'every normal/foam component is finite'
    ).toBe(true);

    const heights = getRecordComponent(firstDisplacements, 1);
    const horizontalDisplacements = [
      ...getRecordComponent(firstDisplacements, 0),
      ...getRecordComponent(firstDisplacements, 2)
    ];
    expect(Boolean(getRange(heights) > 0.001), 'height output has non-flat spatial variation').toBe(
      true
    );
    expect(
      Boolean(getRange(horizontalDisplacements) > 0.001),
      'horizontal displacement has non-flat spatial variation'
    ).toBe(true);

    let minimumNormalLength = Infinity;
    let maximumNormalLength = -Infinity;
    let minimumFoam = Infinity;
    let maximumFoam = -Infinity;
    for (let index = 0; index < simulation.stats.elementCount; index++) {
      const offset = index * 4;
      const normalLength = Math.hypot(
        firstNormalFoam[offset],
        firstNormalFoam[offset + 1],
        firstNormalFoam[offset + 2]
      );
      minimumNormalLength = Math.min(minimumNormalLength, normalLength);
      maximumNormalLength = Math.max(maximumNormalLength, normalLength);
      minimumFoam = Math.min(minimumFoam, firstNormalFoam[offset + 3]);
      maximumFoam = Math.max(maximumFoam, firstNormalFoam[offset + 3]);
    }
    expect(Boolean(minimumNormalLength > 0.995), 'all normals stay near unit length').toBe(true);
    expect(Boolean(maximumNormalLength < 1.005), 'normal normalization remains bounded').toBe(true);
    expect(Boolean(minimumFoam >= 0), 'foam never goes negative').toBe(true);
    expect(Boolean(maximumFoam <= 1), 'foam never exceeds one').toBe(true);

    const secondEncoder = device.createCommandEncoder({id: 'spectral-ocean-second-step'});
    simulation.encode(secondEncoder, {time: 1.25, deltaTime: 0.1});
    device.submit(secondEncoder.finish());
    const secondDisplacements = await readFloat32(
      simulation.outputs.displacementBuffer,
      simulation.stats.elementCount * 4
    );
    const retainedNormalFoam = await readFloat32(
      simulation.outputs.normalFoamBuffer,
      simulation.stats.elementCount * 4
    );
    expect(
      Boolean(getMaximumDifference(firstDisplacements, secondDisplacements) > 0.001),
      'absolute time evolves the field'
    ).toBe(true);

    const resetEncoder = device.createCommandEncoder({id: 'spectral-ocean-reset-foam'});
    simulation.encode(resetEncoder, {
      time: 1.25,
      deltaTime: 0.1,
      resetFoamHistory: true
    });
    device.submit(resetEncoder.finish());
    const resetNormalFoam = await readFloat32(
      simulation.outputs.normalFoamBuffer,
      simulation.stats.elementCount * 4
    );
    expect(
      Boolean(getMaximumRecordComponentDifference(retainedNormalFoam, resetNormalFoam, 3) > 0.0001),
      'ordinary steps retain prior foam while reset discards history at the same wave time'
    ).toBe(true);
  } finally {
    simulation.destroy();
    simulation.destroy();
  }
  void 0;
});

it('SpectralOceanSimulation preserves ordered time uniforms in one command encoder', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const simulation = new SpectralOceanSimulation(device, {
    id: 'spectral-ocean-same-encoder-test',
    resolution: 8,
    patchSize: 48,
    windSpeed: 12,
    seed: 7
  });
  const firstStepCopy = device.createBuffer({
    id: 'spectral-ocean-first-step-copy',
    byteLength: simulation.stats.outputBufferByteLength,
    usage: Buffer.COPY_DST | Buffer.COPY_SRC
  });

  try {
    const commandEncoder = device.createCommandEncoder({id: 'spectral-ocean-two-steps'});
    simulation.encode(commandEncoder, {time: 0, resetFoamHistory: true});
    commandEncoder.copyBufferToBuffer({
      sourceBuffer: simulation.outputs.displacementBuffer,
      destinationBuffer: firstStepCopy,
      size: simulation.stats.outputBufferByteLength
    });
    simulation.encode(commandEncoder, {time: 0.9, deltaTime: 0.1});
    device.submit(commandEncoder.finish());

    const firstStep = await readFloat32(firstStepCopy, simulation.stats.elementCount * 4);
    const secondStep = await readFloat32(
      simulation.outputs.displacementBuffer,
      simulation.stats.elementCount * 4
    );
    expect(
      Boolean(getMaximumDifference(firstStep, secondStep) > 0.001),
      'encoder-ordered staging preserves each step time rather than the final CPU write'
    ).toBe(true);
  } finally {
    firstStepCopy.destroy();
    simulation.destroy();
  }
  void 0;
});

it('SpectralOceanSimulation validates encodes and destroys outputs idempotently', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const simulation = new SpectralOceanSimulation(device, {resolution: 8});
  expect(
    () => simulation.encode(device.commandEncoder, {time: Number.NaN}),
    'non-finite time is rejected'
  ).toThrow(/time must be finite/);
  expect(
    () => simulation.encode(device.commandEncoder, {time: 0, deltaTime: -0.1}),
    'negative history time is rejected'
  ).toThrow(/deltaTime must be non-negative and finite/);
  simulation.destroy();
  simulation.destroy();
  expect(
    Boolean(simulation.outputs.displacementBuffer.destroyed),
    'displacement output is destroyed'
  ).toBe(true);
  expect(
    Boolean(simulation.outputs.normalFoamBuffer.destroyed),
    'normal/foam output is destroyed'
  ).toBe(true);
  expect(
    () => simulation.encode(device.commandEncoder, {time: 0}),
    'destroyed simulations reject new work'
  ).toThrow(/has been destroyed/);
  void 0;
});

it('SpectralOceanSimulation construction unwinds partial allocations', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const id = 'spectral-ocean-allocation-failure';
  const activeBufferCount = getResourceCount(device, 'Buffers');
  const allocatedBuffers: Buffer[] = [];
  const originalCreateBuffer = device.createBuffer;
  const originalComputationDestroy = Computation.prototype.destroy;
  let computationDestroyCount = 0;

  device.createBuffer = ((props: Parameters<Device['createBuffer']>[0]) => {
    const bufferId = (props as {id?: string}).id;
    if (bufferId === `${id}-fft-inverse-1-parameters`) {
      throw new Error('injected SpectralOceanSimulation allocation failure');
    }
    const buffer = originalCreateBuffer.call(device, props);
    if (bufferId?.startsWith(id)) {
      allocatedBuffers.push(buffer);
    }
    return buffer;
  }) as Device['createBuffer'];
  Computation.prototype.destroy = function (): void {
    computationDestroyCount++;
    originalComputationDestroy.call(this);
  };

  try {
    expect(
      () => new SpectralOceanSimulation(device, {id, resolution: 8}),
      'the original construction error is preserved'
    ).toThrow(/injected SpectralOceanSimulation allocation failure/);
  } finally {
    device.createBuffer = originalCreateBuffer;
    Computation.prototype.destroy = originalComputationDestroy;
  }

  expect(
    Boolean(allocatedBuffers.length > 10),
    'simulation and FFT allocations were observed'
  ).toBe(true);
  expect(
    Boolean(allocatedBuffers.every(buffer => buffer.destroyed)),
    'every buffer allocated before the failure is destroyed'
  ).toBe(true);
  expect(computationDestroyCount, 'both simulation computations and the FFT are unwound').toBe(3);
  expect(
    getResourceCount(device, 'Buffers'),
    'active buffer accounting returns to its baseline'
  ).toBe(activeBufferCount);
  void 0;
});

async function readFloat32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync(0, length * Float32Array.BYTES_PER_ELEMENT);
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, length));
}

function getRecordComponent(values: number[], component: number): number[] {
  const result: number[] = [];
  for (let index = component; index < values.length; index += 4) {
    result.push(values[index]);
  }
  return result;
}

function getRange(values: number[]): number {
  return Math.max(...values) - Math.min(...values);
}

function getMaximumDifference(first: number[], second: number[]): number {
  let maximumDifference = 0;
  for (let index = 0; index < first.length; index++) {
    maximumDifference = Math.max(maximumDifference, Math.abs(first[index] - second[index]));
  }
  return maximumDifference;
}

function getMaximumRecordComponentDifference(
  first: number[],
  second: number[],
  component: number
): number {
  let maximumDifference = 0;
  for (let index = component; index < first.length; index += 4) {
    maximumDifference = Math.max(maximumDifference, Math.abs(first[index] - second[index]));
  }
  return maximumDifference;
}

function getResourceCount(device: Device, resourceType: string): number {
  return device.statsManager.getStats('Resource Counts').get(resourceType).count;
}
