// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import test from 'test/utils/vitest-tape';
import {
  getMLSMPMFluidFixedPointBounds,
  getMLSMPMFluidSimulationSupport,
  getMLSMPMFluidStableDeltaTime,
  MAX_MLS_MPM_FLUID_PARTICLE_COUNT,
  MAX_MLS_MPM_FLUID_SUBSTEPS_PER_ENCODE,
  MLS_MPM_FLUID_STAGE_ORDER
} from '@luma.gl/experimental';
import {
  MLS_MPM_FLUID_GRID_TO_PARTICLE_SHADER,
  MLS_MPM_FLUID_MAXIMUM_DEFORMATION,
  MLS_MPM_FLUID_MINIMUM_DEFORMATION,
  MLS_MPM_FLUID_PARTICLE_FLOAT_COUNT,
  MLS_MPM_FLUID_PARTICLE_TO_GRID_SHADER,
  MLS_MPM_FLUID_UPDATE_GRID_SHADER
} from '../../src/rendering/mls-mpm-fluid-simulation-shaders';
import {
  makeMLSMPMFluidSubstepUniformData,
  makeMLSMPMParticleData
} from '../../src/rendering/mls-mpm-fluid-simulation';

test('MLS-MPM particle seeds are deterministic and preserve the packed ABI', testCase => {
  const options = {
    particleCount: 12,
    seed: 17,
    bounds: [0.2, 0.3, 0.6, 0.8] as const,
    velocity: [0.25, -0.5] as const
  };
  const first = makeMLSMPMParticleData(options);
  const second = makeMLSMPMParticleData(options);
  const differentSeed = makeMLSMPMParticleData({...options, seed: 18});

  testCase.deepEqual(first, second, 'the same seed produces byte-identical particle state');
  testCase.notDeepEqual(first, differentSeed, 'the unsigned seed controls deterministic jitter');
  testCase.equal(
    first.length,
    options.particleCount * MLS_MPM_FLUID_PARTICLE_FLOAT_COUNT,
    'every particle occupies the stable 48-byte ABI'
  );
  for (let particleIndex = 0; particleIndex < options.particleCount; particleIndex++) {
    const valueOffset = particleIndex * MLS_MPM_FLUID_PARTICLE_FLOAT_COUNT;
    testCase.ok(first[valueOffset] >= 0.2 && first[valueOffset] <= 0.6, 'x stays in seed bounds');
    testCase.ok(
      first[valueOffset + 1] >= 0.3 && first[valueOffset + 1] <= 0.8,
      'y stays in seed bounds'
    );
    testCase.equal(first[valueOffset + 2], 0.25, 'seed x velocity is packed');
    testCase.equal(first[valueOffset + 3], -0.5, 'seed y velocity is packed');
    testCase.equal(first[valueOffset + 8], 1, 'deformation starts at rest volume');
  }
  testCase.throws(
    () => makeMLSMPMParticleData({particleCount: 0}),
    /particleCount/,
    'empty seeds are rejected'
  );
  testCase.throws(
    () => makeMLSMPMParticleData({particleCount: 1, bounds: [0.6, 0.2, 0.4, 0.8]}),
    /positive width/,
    'inverted seed bounds are rejected'
  );
  testCase.throws(
    () => makeMLSMPMParticleData({particleCount: 1, velocity: [12, 12]}),
    /magnitude/,
    'seed velocity is bounded by vector magnitude rather than per component'
  );
  testCase.end();
});

test('MLS-MPM uniform ABI and stage sources describe the complete bounded solver', testCase => {
  const stableDeltaTime = getMLSMPMFluidStableDeltaTime({
    gridSize: [32, 24],
    restDensity: 3,
    stiffness: 12,
    maxVelocity: 10
  });
  const uniformData = makeMLSMPMFluidSubstepUniformData({
    gridSize: [32, 24],
    particleCount: 1024,
    boundaryCells: 2,
    particleMass: 0.75,
    restDensity: 3,
    stiffness: 12,
    velocityDamping: 0.2,
    maxVelocity: 10,
    step: {
      deltaTime: stableDeltaTime,
      gravity: [0, -4],
      force: {position: [0.4, 0.6], radius: 0.2, vector: [8, 3]}
    }
  });

  testCase.equal(uniformData.length, 20, 'the cross-stage uniform ABI occupies five vec4s');
  testCase.deepEqual(
    Array.from(uniformData.slice(0, 4)),
    [32, 24, uniformData[2], 1024],
    'grid dimensions, timestep, and particle count are packed first'
  );
  testCase.ok(Math.abs(uniformData[2] - stableDeltaTime) < 1e-7, 'the stable substep is retained');
  testCase.equal(uniformData[7], Math.fround(0.2), 'the velocity damping rate is packed');
  testCase.deepEqual(
    Array.from(uniformData.slice(12, 16)),
    [0.4, 0.6, 0.2, 1].map(Math.fround),
    'the optional force has explicit activation and falloff data'
  );
  testCase.ok(
    Number.isInteger(Math.log2(uniformData[18])) && Number.isInteger(Math.log2(uniformData[19])),
    'fixed-point scales are exact powers of two'
  );
  testCase.deepEqual(
    MLS_MPM_FLUID_STAGE_ORDER,
    [
      'clear-mls-mpm-grid',
      'scatter-mls-mpm-particles-to-grid',
      'update-mls-mpm-grid',
      'advect-mls-mpm-grid-to-particles'
    ],
    'the public stage order is stable'
  );
  testCase.match(
    MLS_MPM_FLUID_PARTICLE_TO_GRID_SHADER,
    /atomicAdd\([\s\S]*velocityOrMomentumX/,
    'particle-to-grid scatter uses signed fixed-point atomics'
  );
  testCase.match(
    MLS_MPM_FLUID_UPDATE_GRID_SHADER,
    /atomicStore\([\s\S]*velocity\.x \* velocityScale/,
    'grid update changes the signed fields from momentum to velocity'
  );
  testCase.match(
    MLS_MPM_FLUID_GRID_TO_PARTICLE_SHADER,
    /affine \+= 4\.0 \* weight/,
    'grid-to-particle reconstructs the APIC affine velocity field'
  );
  testCase.ok(
    MLS_MPM_FLUID_PARTICLE_TO_GRID_SHADER.includes(
      `${MLS_MPM_FLUID_MINIMUM_DEFORMATION},\n    ${MLS_MPM_FLUID_MAXIMUM_DEFORMATION}`
    ) &&
      MLS_MPM_FLUID_GRID_TO_PARTICLE_SHADER.includes(
        `${MLS_MPM_FLUID_MINIMUM_DEFORMATION},\n    ${MLS_MPM_FLUID_MAXIMUM_DEFORMATION}`
      ),
    'scatter and gather share the centralized deformation interval'
  );
  testCase.throws(
    () =>
      makeMLSMPMFluidSubstepUniformData({
        gridSize: [16, 16],
        particleCount: 1,
        boundaryCells: 2,
        particleMass: 1,
        restDensity: 4,
        stiffness: 8,
        velocityDamping: 0,
        maxVelocity: 16,
        step: {deltaTime: 0}
      }),
    /deltaTime/,
    'zero timesteps are rejected'
  );
  testCase.throws(
    () =>
      makeMLSMPMFluidSubstepUniformData({
        gridSize: [16, 16],
        particleCount: 1,
        boundaryCells: 2,
        particleMass: 1,
        restDensity: 4,
        stiffness: 8,
        velocityDamping: 0,
        maxVelocity: 16,
        step: {deltaTime: Number.MIN_VALUE}
      }),
    /deltaTime/,
    'timesteps that underflow practical f32 simulation work are rejected'
  );
  testCase.throws(
    () =>
      makeMLSMPMFluidSubstepUniformData({
        gridSize: [16, 16],
        particleCount: 1,
        boundaryCells: 2,
        particleMass: 1,
        restDensity: 4,
        stiffness: 8,
        velocityDamping: 0,
        maxVelocity: 16,
        step: {deltaTime: 1 / 120}
      }),
    /stable bound/,
    'configuration-specific unstable substeps are rejected below the public maximum delta'
  );
  testCase.end();
});

test('MLS-MPM fixed-point and GPU allocation plans remain bounded', testCase => {
  const fixedPointBounds = getMLSMPMFluidFixedPointBounds({
    particleCount: MAX_MLS_MPM_FLUID_PARTICLE_COUNT,
    particleMass: 1,
    maxVelocity: 16
  });
  testCase.ok(
    fixedPointBounds.maximumMassInteger < fixedPointBounds.maximumRepresentableInteger,
    'worst-case co-located particle mass cannot overflow i32 atomics'
  );
  testCase.ok(
    fixedPointBounds.maximumSignedMomentumInteger < fixedPointBounds.maximumRepresentableInteger,
    'worst-case clamped signed momentum cannot overflow i32 atomics'
  );
  testCase.ok(
    Number.isInteger(Math.log2(fixedPointBounds.massFixedPointScale)) &&
      Number.isInteger(Math.log2(fixedPointBounds.velocityFixedPointScale)),
    'maximum-capacity scales remain exact powers of two'
  );
  const lowMassBounds = getMLSMPMFluidFixedPointBounds({
    particleCount: MAX_MLS_MPM_FLUID_PARTICLE_COUNT,
    particleMass: 0.001,
    maxVelocity: 16
  });
  testCase.ok(
    0.001 * lowMassBounds.massFixedPointScale >= 1024,
    'the smallest supported mass retains at least ten fractional bits before stencil weighting'
  );

  const stableDeltaTime = getMLSMPMFluidStableDeltaTime({
    gridSize: [16, 16],
    restDensity: 4,
    stiffness: 0,
    maxVelocity: 8
  });
  testCase.ok(
    Math.abs(stableDeltaTime - 1 / 240) < 1e-12,
    'the stable step follows the conservative half-cell advection CFL bound'
  );
  testCase.ok(
    getMLSMPMFluidStableDeltaTime({
      gridSize: [32, 32],
      restDensity: 4,
      stiffness: 20,
      maxVelocity: 8
    }) < stableDeltaTime,
    'finer grids and material wave speed tighten the stable step'
  );
  const deformationLimitedDeltaTime = getMLSMPMFluidStableDeltaTime({
    gridSize: [32, 32],
    restDensity: 4,
    stiffness: 20,
    maxVelocity: 8
  });
  const expectedDeformationLimitedDeltaTime =
    0.5 / 31 / (8 + MLS_MPM_FLUID_MAXIMUM_DEFORMATION * Math.sqrt(20 / 4));
  testCase.ok(
    Math.abs(deformationLimitedDeltaTime - expectedDeformationLimitedDeltaTime) < 1e-12,
    'the material CFL bound covers the maximum supported deformation'
  );
  testCase.equal(
    MAX_MLS_MPM_FLUID_SUBSTEPS_PER_ENCODE,
    128,
    'the public per-encode work budget remains bounded'
  );

  const supportedDevice = makeSupportDevice({
    maxBufferSize: 4096,
    maxStorageBufferBindingSize: 4096
  });
  testCase.equal(
    getMLSMPMFluidSimulationSupport(supportedDevice, {
      gridSize: [8, 8],
      particleCount: 8
    }).supported,
    true,
    'a portable WebGPU resource plan is accepted'
  );
  const storageLimitedDevice = makeSupportDevice({
    maxBufferSize: 4096,
    maxStorageBufferBindingSize: 383
  });
  const storageLimitedSupport = getMLSMPMFluidSimulationSupport(storageLimitedDevice, {
    gridSize: [8, 8],
    particleCount: 8
  });
  testCase.equal(
    storageLimitedSupport.supported,
    false,
    'storage binding byte limits are enforced'
  );
  testCase.match(
    storageLimitedSupport.reason || '',
    /maxStorageBufferBindingSize/,
    'storage rejection identifies the relevant device limit'
  );
  const allocationLimitedDevice = makeSupportDevice({
    maxBufferSize: 767,
    maxStorageBufferBindingSize: 4096
  });
  const allocationLimitedSupport = getMLSMPMFluidSimulationSupport(allocationLimitedDevice, {
    gridSize: [8, 8],
    particleCount: 8
  });
  testCase.equal(allocationLimitedSupport.supported, false, 'allocation byte limits are enforced');
  testCase.match(
    allocationLimitedSupport.reason || '',
    /maxBufferSize/,
    'allocation rejection identifies the relevant device limit'
  );
  const nullSupport = getMLSMPMFluidSimulationSupport({type: 'null'} as Device, {
    gridSize: [8, 8],
    particleCount: 8
  });
  testCase.equal(nullSupport.supported, false, 'non-WebGPU devices are rejected');
  testCase.match(nullSupport.reason || '', /WebGPU/, 'backend rejection is actionable');
  const velocitySupport = getMLSMPMFluidSimulationSupport(supportedDevice, {
    gridSize: [8, 8],
    initialParticles: [{position: [0.5, 0.5], velocity: [16, 16]}],
    maxVelocity: 16
  });
  testCase.equal(velocitySupport.supported, false, 'diagonal overspeed seeds are rejected');
  testCase.match(velocitySupport.reason || '', /magnitude/, 'velocity rejection names magnitude');
  testCase.end();
});

function makeSupportDevice(limits: {
  maxBufferSize: number;
  maxStorageBufferBindingSize: number;
}): Device {
  return {
    type: 'webgpu',
    limits: {
      ...limits,
      maxStorageBuffersPerShaderStage: 8,
      maxComputeInvocationsPerWorkgroup: 256,
      maxComputeWorkgroupSizeX: 256,
      maxComputeWorkgroupsPerDimension: 65_535
    }
  } as Device;
}
