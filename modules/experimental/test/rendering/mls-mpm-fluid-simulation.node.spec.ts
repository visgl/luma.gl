// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {expect, it} from 'vitest';
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

it('MLS-MPM particle seeds are deterministic and preserve the packed ABI', () => {
  const options = {
    particleCount: 12,
    seed: 17,
    bounds: [0.2, 0.3, 0.6, 0.8] as const,
    velocity: [0.25, -0.5] as const
  };
  const first = makeMLSMPMParticleData(options);
  const second = makeMLSMPMParticleData(options);
  const differentSeed = makeMLSMPMParticleData({...options, seed: 18});

  expect(first, 'the same seed produces byte-identical particle state').toEqual(second);
  expect(first, 'the unsigned seed controls deterministic jitter').not.toEqual(differentSeed);
  expect(first.length, 'every particle occupies the stable 48-byte ABI').toBe(
    options.particleCount * MLS_MPM_FLUID_PARTICLE_FLOAT_COUNT
  );
  for (let particleIndex = 0; particleIndex < options.particleCount; particleIndex++) {
    const valueOffset = particleIndex * MLS_MPM_FLUID_PARTICLE_FLOAT_COUNT;
    expect(
      Boolean(first[valueOffset] >= 0.2 && first[valueOffset] <= 0.6),
      'x stays in seed bounds'
    ).toBe(true);
    expect(
      Boolean(first[valueOffset + 1] >= 0.3 && first[valueOffset + 1] <= 0.8),
      'y stays in seed bounds'
    ).toBe(true);
    expect(first[valueOffset + 2], 'seed x velocity is packed').toBe(0.25);
    expect(first[valueOffset + 3], 'seed y velocity is packed').toBe(-0.5);
    expect(first[valueOffset + 8], 'deformation starts at rest volume').toBe(1);
  }
  expect(() => makeMLSMPMParticleData({particleCount: 0}), 'empty seeds are rejected').toThrow(
    /particleCount/
  );
  expect(
    () => makeMLSMPMParticleData({particleCount: 1, bounds: [0.6, 0.2, 0.4, 0.8]}),
    'inverted seed bounds are rejected'
  ).toThrow(/positive width/);
  expect(
    () => makeMLSMPMParticleData({particleCount: 1, velocity: [12, 12]}),
    'seed velocity is bounded by vector magnitude rather than per component'
  ).toThrow(/magnitude/);
  void 0;
});

it('MLS-MPM uniform ABI and stage sources describe the complete bounded solver', () => {
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

  expect(uniformData.length, 'the cross-stage uniform ABI occupies five vec4s').toBe(20);
  expect(
    Array.from(uniformData.slice(0, 4)),
    'grid dimensions, timestep, and particle count are packed first'
  ).toEqual([32, 24, uniformData[2], 1024]);
  expect(
    Boolean(Math.abs(uniformData[2] - stableDeltaTime) < 1e-7),
    'the stable substep is retained'
  ).toBe(true);
  expect(uniformData[7], 'the velocity damping rate is packed').toBe(Math.fround(0.2));
  expect(
    Array.from(uniformData.slice(12, 16)),
    'the optional force has explicit activation and falloff data'
  ).toEqual([0.4, 0.6, 0.2, 1].map(Math.fround));
  expect(
    Boolean(
      Number.isInteger(Math.log2(uniformData[18])) && Number.isInteger(Math.log2(uniformData[19]))
    ),
    'fixed-point scales are exact powers of two'
  ).toBe(true);
  expect(MLS_MPM_FLUID_STAGE_ORDER, 'the public stage order is stable').toEqual([
    'clear-mls-mpm-grid',
    'scatter-mls-mpm-particles-to-grid',
    'update-mls-mpm-grid',
    'advect-mls-mpm-grid-to-particles'
  ]);
  expect(
    MLS_MPM_FLUID_PARTICLE_TO_GRID_SHADER,
    'particle-to-grid scatter uses signed fixed-point atomics'
  ).toMatch(/atomicAdd\([\s\S]*velocityOrMomentumX/);
  expect(
    MLS_MPM_FLUID_UPDATE_GRID_SHADER,
    'grid update changes the signed fields from momentum to velocity'
  ).toMatch(/atomicStore\([\s\S]*velocity\.x \* velocityScale/);
  expect(
    MLS_MPM_FLUID_GRID_TO_PARTICLE_SHADER,
    'grid-to-particle reconstructs the APIC affine velocity field'
  ).toMatch(/affine \+= 4\.0 \* weight/);
  expect(
    Boolean(
      MLS_MPM_FLUID_PARTICLE_TO_GRID_SHADER.includes(
        `${MLS_MPM_FLUID_MINIMUM_DEFORMATION},\n    ${MLS_MPM_FLUID_MAXIMUM_DEFORMATION}`
      ) &&
        MLS_MPM_FLUID_GRID_TO_PARTICLE_SHADER.includes(
          `${MLS_MPM_FLUID_MINIMUM_DEFORMATION},\n    ${MLS_MPM_FLUID_MAXIMUM_DEFORMATION}`
        )
    ),
    'scatter and gather share the centralized deformation interval'
  ).toBe(true);
  expect(
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
    'zero timesteps are rejected'
  ).toThrow(/deltaTime/);
  expect(
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
    'timesteps that underflow practical f32 simulation work are rejected'
  ).toThrow(/deltaTime/);
  expect(
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
    'configuration-specific unstable substeps are rejected below the public maximum delta'
  ).toThrow(/stable bound/);
  void 0;
});

it('MLS-MPM fixed-point and GPU allocation plans remain bounded', () => {
  const fixedPointBounds = getMLSMPMFluidFixedPointBounds({
    particleCount: MAX_MLS_MPM_FLUID_PARTICLE_COUNT,
    particleMass: 1,
    maxVelocity: 16
  });
  expect(
    Boolean(fixedPointBounds.maximumMassInteger < fixedPointBounds.maximumRepresentableInteger),
    'worst-case co-located particle mass cannot overflow i32 atomics'
  ).toBe(true);
  expect(
    Boolean(
      fixedPointBounds.maximumSignedMomentumInteger < fixedPointBounds.maximumRepresentableInteger
    ),
    'worst-case clamped signed momentum cannot overflow i32 atomics'
  ).toBe(true);
  expect(
    Boolean(
      Number.isInteger(Math.log2(fixedPointBounds.massFixedPointScale)) &&
        Number.isInteger(Math.log2(fixedPointBounds.velocityFixedPointScale))
    ),
    'maximum-capacity scales remain exact powers of two'
  ).toBe(true);
  const lowMassBounds = getMLSMPMFluidFixedPointBounds({
    particleCount: MAX_MLS_MPM_FLUID_PARTICLE_COUNT,
    particleMass: 0.001,
    maxVelocity: 16
  });
  expect(
    Boolean(0.001 * lowMassBounds.massFixedPointScale >= 1024),
    'the smallest supported mass retains at least ten fractional bits before stencil weighting'
  ).toBe(true);

  const stableDeltaTime = getMLSMPMFluidStableDeltaTime({
    gridSize: [16, 16],
    restDensity: 4,
    stiffness: 0,
    maxVelocity: 8
  });
  expect(
    Boolean(Math.abs(stableDeltaTime - 1 / 240) < 1e-12),
    'the stable step follows the conservative half-cell advection CFL bound'
  ).toBe(true);
  expect(
    Boolean(
      getMLSMPMFluidStableDeltaTime({
        gridSize: [32, 32],
        restDensity: 4,
        stiffness: 20,
        maxVelocity: 8
      }) < stableDeltaTime
    ),
    'finer grids and material wave speed tighten the stable step'
  ).toBe(true);
  const deformationLimitedDeltaTime = getMLSMPMFluidStableDeltaTime({
    gridSize: [32, 32],
    restDensity: 4,
    stiffness: 20,
    maxVelocity: 8
  });
  const expectedDeformationLimitedDeltaTime =
    0.5 / 31 / (8 + MLS_MPM_FLUID_MAXIMUM_DEFORMATION * Math.sqrt(20 / 4));
  expect(
    Boolean(Math.abs(deformationLimitedDeltaTime - expectedDeformationLimitedDeltaTime) < 1e-12),
    'the material CFL bound covers the maximum supported deformation'
  ).toBe(true);
  expect(
    MAX_MLS_MPM_FLUID_SUBSTEPS_PER_ENCODE,
    'the public per-encode work budget remains bounded'
  ).toBe(128);

  const supportedDevice = makeSupportDevice({
    maxBufferSize: 4096,
    maxStorageBufferBindingSize: 4096
  });
  expect(
    getMLSMPMFluidSimulationSupport(supportedDevice, {
      gridSize: [8, 8],
      particleCount: 8
    }).supported,
    'a portable WebGPU resource plan is accepted'
  ).toBe(true);
  const storageLimitedDevice = makeSupportDevice({
    maxBufferSize: 4096,
    maxStorageBufferBindingSize: 383
  });
  const storageLimitedSupport = getMLSMPMFluidSimulationSupport(storageLimitedDevice, {
    gridSize: [8, 8],
    particleCount: 8
  });
  expect(storageLimitedSupport.supported, 'storage binding byte limits are enforced').toBe(false);
  expect(
    storageLimitedSupport.reason || '',
    'storage rejection identifies the relevant device limit'
  ).toMatch(/maxStorageBufferBindingSize/);
  const allocationLimitedDevice = makeSupportDevice({
    maxBufferSize: 767,
    maxStorageBufferBindingSize: 4096
  });
  const allocationLimitedSupport = getMLSMPMFluidSimulationSupport(allocationLimitedDevice, {
    gridSize: [8, 8],
    particleCount: 8
  });
  expect(allocationLimitedSupport.supported, 'allocation byte limits are enforced').toBe(false);
  expect(
    allocationLimitedSupport.reason || '',
    'allocation rejection identifies the relevant device limit'
  ).toMatch(/maxBufferSize/);
  const nullSupport = getMLSMPMFluidSimulationSupport({type: 'null'} as Device, {
    gridSize: [8, 8],
    particleCount: 8
  });
  expect(nullSupport.supported, 'non-WebGPU devices are rejected').toBe(false);
  expect(nullSupport.reason || '', 'backend rejection is actionable').toMatch(/WebGPU/);
  const velocitySupport = getMLSMPMFluidSimulationSupport(supportedDevice, {
    gridSize: [8, 8],
    initialParticles: [{position: [0.5, 0.5], velocity: [16, 16]}],
    maxVelocity: 16
  });
  expect(velocitySupport.supported, 'diagonal overspeed seeds are rejected').toBe(false);
  expect(velocitySupport.reason || '', 'velocity rejection names magnitude').toMatch(/magnitude/);
  void 0;
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
