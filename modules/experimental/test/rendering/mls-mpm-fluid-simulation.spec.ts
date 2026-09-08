// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  getMLSMPMFluidSimulationSupport,
  MAX_MLS_MPM_FLUID_SUBSTEPS_PER_ENCODE,
  MLSMPMFluidSimulation
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {MLS_MPM_FLUID_PARTICLE_FLOAT_COUNT} from '../../src/rendering/mls-mpm-fluid-simulation-shaders';

it('MLSMPMFluidSimulation records four-stage APIC transport on WebGPU', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const particleCount = 256;
  const seed = 29;
  const support = getMLSMPMFluidSimulationSupport(device, {
    gridSize: [16, 16],
    particleCount
  });
  expect(support.supported, 'the core WebGPU device supports the bounded solver').toBe(true);
  const simulation = new MLSMPMFluidSimulation(device, {
    id: 'mls-mpm-fluid-browser-test',
    gridSize: [16, 16],
    particleCount,
    seed,
    stiffness: 0,
    velocityDamping: 0,
    maxVelocity: 8
  });
  const initialParticleBuffer = simulation.particleBuffer;

  try {
    const clampedInitialParticles = await readParticleBuffer(
      simulation.particleBuffer,
      particleCount
    );
    const initialSummary = summarizeParticles(clampedInitialParticles);
    expect(
      Boolean(
        initialSummary.minimumPositionX >= 2 / 15 - 1e-5 &&
          initialSummary.minimumPositionY >= 2 / 15 - 1e-5
      ),
      'generated seeds are clamped to the full-stencil interior'
    ).toBe(true);
    expect(simulation.particleCount, 'particle capacity is public').toBe(particleCount);
    expect(simulation.gridSize, 'grid dimensions are immutable').toEqual([16, 16]);
    expect(simulation.stats.gridCellCount, 'grid statistics expose cell count').toBe(256);
    expect(
      simulation.stats.gridBufferByteLength,
      'grid statistics describe the 12-byte atomic cell ABI'
    ).toBe(256 * 3 * Int32Array.BYTES_PER_ELEMENT);
    const tinyDeltaEncoder = device.createCommandEncoder({id: 'mls-mpm-fluid-tiny-delta'});
    expect(
      () => simulation.encode(tinyDeltaEncoder, {deltaTime: Number.MIN_VALUE}),
      'the public encoder rejects a delta that cannot produce practical f32 simulation work'
    ).toThrow(/deltaTime/);
    expect(simulation.stats.encodeCount, 'a rejected tiny delta records no encode').toBe(0);
    expect(simulation.stats.stepCount, 'a rejected tiny delta records no substeps').toBe(0);

    const fallingGravity = [
      [0, -4],
      [1, -3],
      [-1, -5],
      [0.5, -4]
    ] as const;
    const fallingEncoder = device.createCommandEncoder({id: 'mls-mpm-fluid-falling-steps'});
    for (const gravity of fallingGravity) {
      simulation.encode(fallingEncoder, {deltaTime: 1 / 120, gravity});
    }
    expect(
      simulation.particleBuffer,
      'four steps return to the first buffer in the double-buffer pair'
    ).toBe(initialParticleBuffer);
    expect(simulation.stats.encodeCount, 'public encode calls have a separate count').toBe(4);
    expect(simulation.stats.stepCount, 'CFL splitting records two substeps per encode').toBe(8);
    expect(simulation.stats.lastSubstepCount, 'the latest split count is observable').toBe(2);
    expect(
      Boolean(
        Math.abs(simulation.stats.stableDeltaTime - 1 / 240) < 1e-12 &&
          Math.abs(simulation.stats.lastSubstepDeltaTime - 1 / 240) < 1e-12
      ),
      'stable and actual substep deltas are observable'
    ).toBe(true);
    device.submit(fallingEncoder.finish());

    const fallingParticles = await readParticleBuffer(simulation.particleBuffer, particleCount);
    expect(Boolean(fallingParticles.every(Number.isFinite)), 'particle state remains finite').toBe(
      true
    );
    const separatelySubmittedSimulation = new MLSMPMFluidSimulation(device, {
      id: 'mls-mpm-fluid-separate-submission-reference',
      gridSize: [16, 16],
      particleCount,
      seed,
      stiffness: 0,
      velocityDamping: 0,
      maxVelocity: 8
    });
    try {
      for (let stepIndex = 0; stepIndex < fallingGravity.length; stepIndex++) {
        const stepEncoder = device.createCommandEncoder({
          id: `mls-mpm-fluid-separate-step-${stepIndex}`
        });
        separatelySubmittedSimulation.encode(stepEncoder, {
          deltaTime: 1 / 120,
          gravity: fallingGravity[stepIndex]
        });
        device.submit(stepEncoder.finish());
      }
      const separatelySubmittedParticles = await readParticleBuffer(
        separatelySubmittedSimulation.particleBuffer,
        particleCount
      );
      expect(
        fallingParticles,
        'four encodes on one command encoder match four separately submitted steps'
      ).toEqual(separatelySubmittedParticles);
    } finally {
      separatelySubmittedSimulation.destroy();
    }
    const fallingSummary = summarizeParticles(fallingParticles);
    expect(
      Boolean(fallingSummary.meanVelocityY < -0.02),
      'gravity accelerates particles downward'
    ).toBe(true);
    expect(
      Boolean(
        fallingSummary.minimumPositionX >= 2 / 15 - 1e-5 &&
          fallingSummary.maximumPositionX <= 1 - 2 / 15 + 1e-5 &&
          fallingSummary.minimumPositionY >= 2 / 15 - 1e-5 &&
          fallingSummary.maximumPositionY <= 1 - 2 / 15 + 1e-5
      ),
      'particle advection enforces the configured solid boundary'
    ).toBe(true);
    expect(
      Boolean(fallingSummary.minimumDeformation >= 0.6 && fallingSummary.maximumDeformation <= 1.4),
      'MLS deformation stays inside its stability interval'
    ).toBe(true);

    const gridBytes = await simulation.gridBuffer.readAsync();
    const gridValues = new Int32Array(
      gridBytes.buffer,
      gridBytes.byteOffset,
      gridBytes.byteLength / Int32Array.BYTES_PER_ELEMENT
    );
    let maximumGridMass = 0;
    let minimumGridVelocityY = 0;
    for (let valueOffset = 0; valueOffset < gridValues.length; valueOffset += 3) {
      maximumGridMass = Math.max(maximumGridMass, gridValues[valueOffset]);
      minimumGridVelocityY = Math.min(minimumGridVelocityY, gridValues[valueOffset + 2]);
    }
    expect(
      Boolean(maximumGridMass > 0),
      'particle-to-grid scatter leaves observable grid mass'
    ).toBe(true);
    expect(
      Boolean(minimumGridVelocityY < 0),
      'the submitted grid is in its documented post-update velocity phase'
    ).toBe(true);

    const resetEncoder = device.createCommandEncoder({id: 'mls-mpm-fluid-reset'});
    simulation.reset(resetEncoder);
    expect(simulation.stats.stepCount, 'reset restores the CPU-side step index').toBe(0);
    expect(
      simulation.particleBuffer,
      'reset deterministically selects the first particle buffer'
    ).toBe(initialParticleBuffer);
    device.submit(resetEncoder.finish());
    const resetParticles = await readParticleBuffer(simulation.particleBuffer, particleCount);
    expect(resetParticles, 'reset restores the constructor seed byte for byte').toEqual(
      clampedInitialParticles
    );

    const forceEncoder = device.createCommandEncoder({id: 'mls-mpm-fluid-local-force'});
    simulation.encode(forceEncoder, {
      deltaTime: 1 / 240,
      gravity: [0, 0],
      force: {position: [0.32, 0.48], radius: 0.55, vector: [40, 0]}
    });
    expect(
      simulation.particleBuffer,
      'one encoded step selects the other particle buffer'
    ).not.toBe(initialParticleBuffer);
    device.submit(forceEncoder.finish());
    const forcedParticles = await readParticleBuffer(simulation.particleBuffer, particleCount);
    const forcedSummary = summarizeParticles(forcedParticles);
    expect(
      Boolean(forcedSummary.meanVelocityX > 0.02),
      'the optional local force accelerates particles'
    ).toBe(true);
  } finally {
    const finalParticleBuffer = simulation.particleBuffer;
    simulation.destroy();
    simulation.destroy();
    expect(finalParticleBuffer.destroyed, 'particle buffers are released once').toBe(true);
    expect(simulation.gridBuffer.destroyed, 'the atomic grid is released once').toBe(true);
  }

  void 0;
});

it('MLSMPMFluidSimulation rejects an excessive per-encode work plan', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const simulation = new MLSMPMFluidSimulation(device, {
    id: 'mls-mpm-fluid-work-budget-test',
    gridSize: [512, 8],
    particleCount: 1,
    restDensity: 0.1,
    stiffness: 100,
    maxVelocity: 16
  });
  try {
    const requestedSubstepCount = Math.ceil(1 / 30 / simulation.stats.stableDeltaTime);
    expect(
      Boolean(requestedSubstepCount > MAX_MLS_MPM_FLUID_SUBSTEPS_PER_ENCODE),
      'a legal high-resolution material configuration can exceed the work budget'
    ).toBe(true);
    expect(
      simulation.stats.maximumSubstepCount,
      'the work budget is observable before encoding'
    ).toBe(MAX_MLS_MPM_FLUID_SUBSTEPS_PER_ENCODE);
    const commandEncoder = device.createCommandEncoder({id: 'mls-mpm-fluid-excessive-work'});
    expect(
      () => simulation.encode(commandEncoder, {deltaTime: 1 / 30}),
      'an excessive command stream is rejected with an actionable error'
    ).toThrow(/requires \d+ substeps; maximum is 128.*Reduce deltaTime or solver resolution/);
    expect(simulation.stats.encodeCount, 'rejected work records no encode').toBe(0);
    expect(simulation.stats.stepCount, 'rejected work records no substeps').toBe(0);
  } finally {
    simulation.destroy();
  }

  void 0;
});

it('MLSMPMFluidSimulation preserves APIC orientation and pressure sign', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const affineSimulation = new MLSMPMFluidSimulation(device, {
    id: 'mls-mpm-fluid-affine-test',
    gridSize: [16, 16],
    particleCount: 1,
    stiffness: 0,
    velocityDamping: 0,
    maxVelocity: 8
  });
  try {
    affineSimulation.particleBuffer.write(
      makeParticleState({affineColumn0: [0, -2], affineColumn1: [1, 0.5]})
    );
    const affineEncoder = device.createCommandEncoder({id: 'mls-mpm-fluid-affine-step'});
    affineSimulation.encode(affineEncoder, {deltaTime: 1 / 240, gravity: [0, 0]});
    device.submit(affineEncoder.finish());
    const affineParticle = await readParticleBuffer(affineSimulation.particleBuffer, 1);
    expect(
      Boolean(affineParticle[5] < -0.5),
      'the first-column y derivative remains negative'
    ).toBe(true);
    expect(
      Boolean(affineParticle[6] > 0.25),
      'the second-column x derivative remains positive'
    ).toBe(true);
    expect(Boolean(affineParticle[7] > 0.1), 'the positive diagonal derivative is retained').toBe(
      true
    );
  } finally {
    affineSimulation.destroy();
  }

  const pressureSimulation = new MLSMPMFluidSimulation(device, {
    id: 'mls-mpm-fluid-pressure-test',
    gridSize: [16, 16],
    particleCount: 1,
    stiffness: 20,
    velocityDamping: 0,
    maxVelocity: 8
  });
  try {
    pressureSimulation.particleBuffer.write(makeParticleState({deformation: 0.8}));
    const compressedEncoder = device.createCommandEncoder({
      id: 'mls-mpm-fluid-compressed-step'
    });
    pressureSimulation.encode(compressedEncoder, {deltaTime: 1 / 240, gravity: [0, 0]});
    device.submit(compressedEncoder.finish());
    const compressedParticle = await readParticleBuffer(pressureSimulation.particleBuffer, 1);
    expect(
      Boolean(compressedParticle[8] > 0.8),
      'compressed particle pressure expands its volume'
    ).toBe(true);

    pressureSimulation.particleBuffer.write(makeParticleState({deformation: 1.2}));
    const expandedEncoder = device.createCommandEncoder({id: 'mls-mpm-fluid-expanded-step'});
    pressureSimulation.encode(expandedEncoder, {deltaTime: 1 / 240, gravity: [0, 0]});
    device.submit(expandedEncoder.finish());
    const expandedParticle = await readParticleBuffer(pressureSimulation.particleBuffer, 1);
    expect(
      Boolean(expandedParticle[8] < 1.2),
      'expanded particle pressure contracts its volume'
    ).toBe(true);
  } finally {
    pressureSimulation.destroy();
  }

  const lowMassSimulation = new MLSMPMFluidSimulation(device, {
    id: 'mls-mpm-fluid-low-mass-test',
    gridSize: [16, 16],
    initialParticles: [{position: [0, 0]}, {position: [1, 1]}],
    particleMass: 0.001,
    stiffness: 0,
    velocityDamping: 0,
    maxVelocity: 8
  });
  try {
    const initialParticles = await readParticleBuffer(lowMassSimulation.particleBuffer, 2);
    expect(
      Boolean(
        Math.abs(initialParticles[0] - 2 / 15) < 1e-5 &&
          Math.abs(initialParticles[1] - 2 / 15) < 1e-5 &&
          Math.abs(initialParticles[12] - (1 - 2 / 15)) < 1e-5 &&
          Math.abs(initialParticles[13] - (1 - 2 / 15)) < 1e-5
      ),
      'explicit edge seeds are clamped to the complete transfer stencil'
    ).toBe(true);
    expect(
      Boolean(lowMassSimulation.particleMass * lowMassSimulation.stats.massFixedPointScale >= 1024),
      'dynamic scale retains useful fractional mass precision'
    ).toBe(true);
    const lowMassEncoder = device.createCommandEncoder({id: 'mls-mpm-fluid-low-mass-step'});
    lowMassSimulation.encode(lowMassEncoder, {deltaTime: 1 / 240, gravity: [0, 0]});
    device.submit(lowMassEncoder.finish());
    const gridBytes = await lowMassSimulation.gridBuffer.readAsync();
    const gridValues = new Int32Array(
      gridBytes.buffer,
      gridBytes.byteOffset,
      gridBytes.byteLength / Int32Array.BYTES_PER_ELEMENT
    );
    let maximumGridMass = 0;
    for (let valueOffset = 0; valueOffset < gridValues.length; valueOffset += 3) {
      maximumGridMass = Math.max(maximumGridMass, gridValues[valueOffset]);
    }
    expect(
      Boolean(maximumGridMass > 0),
      'minimum-mass particles survive atomic grid quantization'
    ).toBe(true);
  } finally {
    lowMassSimulation.destroy();
  }

  void 0;
});

async function readParticleBuffer(
  particleBuffer: MLSMPMFluidSimulation['particleBuffer'],
  particleCount: number
): Promise<Float32Array> {
  const bytes = await particleBuffer.readAsync();
  const values = new Float32Array(
    bytes.buffer,
    bytes.byteOffset,
    particleCount * MLS_MPM_FLUID_PARTICLE_FLOAT_COUNT
  );
  return new Float32Array(values);
}

function makeParticleState(options: {
  affineColumn0?: readonly [number, number];
  affineColumn1?: readonly [number, number];
  deformation?: number;
}): Float32Array {
  const values = new Float32Array(MLS_MPM_FLUID_PARTICLE_FLOAT_COUNT);
  values[0] = 0.5;
  values[1] = 0.5;
  values[4] = options.affineColumn0?.[0] ?? 0;
  values[5] = options.affineColumn0?.[1] ?? 0;
  values[6] = options.affineColumn1?.[0] ?? 0;
  values[7] = options.affineColumn1?.[1] ?? 0;
  values[8] = options.deformation ?? 1;
  return values;
}

function summarizeParticles(values: Float32Array): {
  meanVelocityX: number;
  meanVelocityY: number;
  minimumPositionX: number;
  maximumPositionX: number;
  minimumPositionY: number;
  maximumPositionY: number;
  minimumDeformation: number;
  maximumDeformation: number;
} {
  let velocityX = 0;
  let velocityY = 0;
  let minimumPositionX = Infinity;
  let maximumPositionX = -Infinity;
  let minimumPositionY = Infinity;
  let maximumPositionY = -Infinity;
  let minimumDeformation = Infinity;
  let maximumDeformation = -Infinity;
  const particleCount = values.length / MLS_MPM_FLUID_PARTICLE_FLOAT_COUNT;
  for (let particleIndex = 0; particleIndex < particleCount; particleIndex++) {
    const valueOffset = particleIndex * MLS_MPM_FLUID_PARTICLE_FLOAT_COUNT;
    minimumPositionX = Math.min(minimumPositionX, values[valueOffset]);
    maximumPositionX = Math.max(maximumPositionX, values[valueOffset]);
    minimumPositionY = Math.min(minimumPositionY, values[valueOffset + 1]);
    maximumPositionY = Math.max(maximumPositionY, values[valueOffset + 1]);
    velocityX += values[valueOffset + 2];
    velocityY += values[valueOffset + 3];
    minimumDeformation = Math.min(minimumDeformation, values[valueOffset + 8]);
    maximumDeformation = Math.max(maximumDeformation, values[valueOffset + 8]);
  }
  return {
    meanVelocityX: velocityX / particleCount,
    meanVelocityY: velocityY / particleCount,
    minimumPositionX,
    maximumPositionX,
    minimumPositionY,
    maximumPositionY,
    minimumDeformation,
    maximumDeformation
  };
}
