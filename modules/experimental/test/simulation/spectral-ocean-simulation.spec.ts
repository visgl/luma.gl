// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {SpectralOceanSimulation} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

test('SpectralOceanSimulation produces finite evolving displacements and unit normals', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
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

    testCase.equal(firstOutputs, simulation.outputs, 'encode returns stable output references');
    testCase.ok(Object.isFrozen(firstOutputs), 'the output reference set is immutable');
    testCase.ok(
      firstOutputs.displacementBuffer.usage & Buffer.VERTEX,
      'displacements are vertex-readable'
    );
    testCase.ok(
      firstOutputs.normalFoamBuffer.usage & Buffer.STORAGE,
      'normal/foam is storage-readable'
    );

    const firstDisplacements = await readFloat32(
      firstOutputs.displacementBuffer,
      simulation.stats.elementCount * 4
    );
    const firstNormalFoam = await readFloat32(
      firstOutputs.normalFoamBuffer,
      simulation.stats.elementCount * 4
    );
    testCase.ok(
      firstDisplacements.every(Number.isFinite),
      'every displacement component is finite'
    );
    testCase.ok(firstNormalFoam.every(Number.isFinite), 'every normal/foam component is finite');

    const heights = getRecordComponent(firstDisplacements, 1);
    const horizontalDisplacements = [
      ...getRecordComponent(firstDisplacements, 0),
      ...getRecordComponent(firstDisplacements, 2)
    ];
    testCase.ok(getRange(heights) > 0.001, 'height output has non-flat spatial variation');
    testCase.ok(
      getRange(horizontalDisplacements) > 0.001,
      'horizontal displacement has non-flat spatial variation'
    );

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
    testCase.ok(minimumNormalLength > 0.995, 'all normals stay near unit length');
    testCase.ok(maximumNormalLength < 1.005, 'normal normalization remains bounded');
    testCase.ok(minimumFoam >= 0, 'foam never goes negative');
    testCase.ok(maximumFoam <= 1, 'foam never exceeds one');

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
    testCase.ok(
      getMaximumDifference(firstDisplacements, secondDisplacements) > 0.001,
      'absolute time evolves the field'
    );

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
    testCase.ok(
      getMaximumRecordComponentDifference(retainedNormalFoam, resetNormalFoam, 3) > 0.0001,
      'ordinary steps retain prior foam while reset discards history at the same wave time'
    );
  } finally {
    simulation.destroy();
    simulation.destroy();
  }
  testCase.end();
});

test('SpectralOceanSimulation preserves ordered time uniforms in one command encoder', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
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
    testCase.ok(
      getMaximumDifference(firstStep, secondStep) > 0.001,
      'encoder-ordered staging preserves each step time rather than the final CPU write'
    );
  } finally {
    firstStepCopy.destroy();
    simulation.destroy();
  }
  testCase.end();
});

test('SpectralOceanSimulation validates encodes and destroys outputs idempotently', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const simulation = new SpectralOceanSimulation(device, {resolution: 8});
  testCase.throws(
    () => simulation.encode(device.commandEncoder, {time: Number.NaN}),
    /time must be finite/,
    'non-finite time is rejected'
  );
  testCase.throws(
    () => simulation.encode(device.commandEncoder, {time: 0, deltaTime: -0.1}),
    /deltaTime must be non-negative and finite/,
    'negative history time is rejected'
  );
  simulation.destroy();
  simulation.destroy();
  testCase.ok(simulation.outputs.displacementBuffer.destroyed, 'displacement output is destroyed');
  testCase.ok(simulation.outputs.normalFoamBuffer.destroyed, 'normal/foam output is destroyed');
  testCase.throws(
    () => simulation.encode(device.commandEncoder, {time: 0}),
    /has been destroyed/,
    'destroyed simulations reject new work'
  );
  testCase.end();
});

test('SpectralOceanSimulation construction unwinds partial allocations', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
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
    testCase.throws(
      () => new SpectralOceanSimulation(device, {id, resolution: 8}),
      /injected SpectralOceanSimulation allocation failure/,
      'the original construction error is preserved'
    );
  } finally {
    device.createBuffer = originalCreateBuffer;
    Computation.prototype.destroy = originalComputationDestroy;
  }

  testCase.ok(allocatedBuffers.length > 10, 'simulation and FFT allocations were observed');
  testCase.ok(
    allocatedBuffers.every(buffer => buffer.destroyed),
    'every buffer allocated before the failure is destroyed'
  );
  testCase.equal(
    computationDestroyCount,
    3,
    'both simulation computations and the FFT are unwound'
  );
  testCase.equal(
    getResourceCount(device, 'Buffers'),
    activeBufferCount,
    'active buffer accounting returns to its baseline'
  );
  testCase.end();
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
