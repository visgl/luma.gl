// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import type {Device} from '@luma.gl/core';
import {
  getSpectralOceanSimulationSupport,
  makeSpectralOceanSimulationStats,
  SPECTRAL_OCEAN_MAX_RESOLUTION,
  SPECTRAL_OCEAN_MIN_RESOLUTION
} from '@luma.gl/experimental';
import {WgslReflect} from 'wgsl_reflect';
import {makeSpectralOceanInitialSpectrum} from '../../src/simulation/spectral-ocean-initial-spectrum';
import {
  SPECTRAL_OCEAN_ASSEMBLY_SHADER,
  SPECTRAL_OCEAN_EVOLUTION_SHADER,
  SPECTRAL_OCEAN_UNIFORM_BYTE_LENGTH,
  SPECTRAL_OCEAN_WORKGROUP_DIMENSION
} from '../../src/simulation/spectral-ocean-simulation-shaders';

it('SpectralOceanSimulation publishes an immutable bounded dispatch plan', () => {
  const stats = makeSpectralOceanSimulationStats({resolution: 16, patchSize: 128});

  expect(stats, 'stats account for three inverse transforms and both assembly passes').toEqual({
    resolution: 16,
    elementCount: 256,
    patchSize: 128,
    cellSize: 8,
    complexBufferByteLength: 2048,
    outputBufferByteLength: 4096,
    simulationStorageBufferCount: 9,
    simulationUniformBufferCount: 1,
    simulationBufferByteLength: 22576,
    workgroupSize: [8, 8, 1],
    workgroupCount: [2, 2, 1],
    evolutionDispatchCount: 1,
    inverseFFTDispatchCount: 30,
    assemblyDispatchCount: 1,
    dispatchCountPerEncode: 32,
    fft: {
      width: 16,
      height: 16,
      elementCount: 256,
      complexBufferByteLength: 2048,
      horizontalStageCount: 4,
      verticalStageCount: 4,
      passCount: 10,
      dispatchCountPerEncode: 10,
      workgroupSize: [8, 8, 1],
      workgroupCount: [2, 2, 1],
      scratchBufferByteLength: 2048,
      parameterBufferCount: 20,
      parameterBufferByteLength: 640
    }
  });
  expect(Boolean(Object.isFrozen(stats)), 'stats are immutable').toBe(true);
  expect(Boolean(Object.isFrozen(stats.workgroupSize)), 'workgroup size is immutable').toBe(true);
  expect(Boolean(Object.isFrozen(stats.workgroupCount)), 'workgroup count is immutable').toBe(true);
  expect(SPECTRAL_OCEAN_MIN_RESOLUTION, 'minimum resolution is explicit').toBe(8);
  expect(SPECTRAL_OCEAN_MAX_RESOLUTION, 'allocation bound is explicit').toBe(1024);
  void 0;
});

it('SpectralOceanSimulation initial spectrum is deterministic and non-flat', () => {
  const props = {
    resolution: 16,
    patchSize: 96,
    windDirection: [0.8, 0.6] as const,
    windSpeed: 15,
    amplitude: 0.0005,
    gravity: 9.81,
    seed: 0x12345678
  };
  const first = makeSpectralOceanInitialSpectrum(props);
  const second = makeSpectralOceanInitialSpectrum(props);
  const differentSeed = makeSpectralOceanInitialSpectrum({...props, seed: props.seed + 1});

  expect(first, 'the same unsigned seed produces identical h0 values').toEqual(second);
  expect(first, 'changing the seed changes h0 values').not.toEqual(differentSeed);
  expect(first[0], 'the zero-frequency real component is suppressed').toBe(0);
  expect(first[1], 'the zero-frequency imaginary component is suppressed').toBe(0);
  expect(
    Boolean(Array.from(first).every(Number.isFinite)),
    'every spectral component is finite'
  ).toBe(true);
  expect(
    Boolean(Array.from(first).some(value => Math.abs(value) > 0.001)),
    'the field has energy'
  ).toBe(true);
  void 0;
});

it('SpectralOceanSimulation validates physical inputs before allocation', () => {
  expect(() => makeSpectralOceanSimulationStats({resolution: 12}), '').toThrow(
    /resolution must be a power of two/
  );
  expect(() => makeSpectralOceanSimulationStats({resolution: 4}), '').toThrow(
    /resolution must be from 8 through 1024/
  );
  expect(() => makeSpectralOceanSimulationStats({resolution: 16, patchSize: 0}), '').toThrow(
    /patchSize must be positive and finite/
  );
  expect(
    () => makeSpectralOceanSimulationStats({resolution: 16, windDirection: [0, 0]}),
    ''
  ).toThrow(/windDirection must be non-zero/);
  expect(() => makeSpectralOceanSimulationStats({resolution: 16, seed: -1}), '').toThrow(
    /seed must be an unsigned 32-bit integer/
  );
  expect(() => makeSpectralOceanSimulationStats({resolution: 16, foamThreshold: 1.1}), '').toThrow(
    /foamThreshold must be from 0 through 1/
  );
  void 0;
});

it('getSpectralOceanSimulationSupport reports backend and resource-limit failures', () => {
  const supportedDevice = makeSupportDevice();
  const supported = getSpectralOceanSimulationSupport(supportedDevice, {resolution: 256});
  expect(supported.supported, 'representative WebGPU limits are supported').toBe(true);
  expect(supported.stats?.dispatchCountPerEncode, 'support includes the full plan').toBe(56);

  const webglSupport = getSpectralOceanSimulationSupport(makeSupportDevice({type: 'webgl'}), {
    resolution: 16
  });
  expect(webglSupport.supported, 'WebGL is rejected').toBe(false);
  expect(webglSupport.reason || '', '').toMatch(/requires WebGPU/);

  const smallBindingSetSupport = getSpectralOceanSimulationSupport(
    makeSupportDevice({maxStorageBuffersPerShaderStage: 4}),
    {resolution: 16}
  );
  expect(smallBindingSetSupport.supported, 'assembly binding capacity is checked').toBe(false);
  expect(smallBindingSetSupport.reason || '', '').toMatch(/five compute storage buffers/);

  const smallBufferSupport = getSpectralOceanSimulationSupport(
    makeSupportDevice({maxStorageBufferBindingSize: 3000}),
    {resolution: 16}
  );
  expect(smallBufferSupport.supported, 'output storage size is checked').toBe(false);
  expect(smallBufferSupport.reason || '', '').toMatch(/output exceeds maxStorageBufferBindingSize/);
  void 0;
});

it('SpectralOceanSimulation shaders expose evolution and render-output stages', () => {
  const evolution = new WgslReflect(SPECTRAL_OCEAN_EVOLUTION_SHADER);
  const assembly = new WgslReflect(SPECTRAL_OCEAN_ASSEMBLY_SHADER);

  expect(
    evolution.entry.compute.map(entry => entry.name),
    'evolution has one compute entry point'
  ).toEqual(['main']);
  expect(
    Boolean(evolution.storage.some(storage => storage.name === 'initialSpectrum')),
    'evolution reads deterministic h0 storage'
  ).toBe(true);
  expect(
    Boolean(evolution.storage.some(storage => storage.name === 'displacementZSpectrum')),
    'evolution emits horizontal-displacement spectra'
  ).toBe(true);
  expect(
    Boolean(assembly.storage.some(storage => storage.name === 'displacements')),
    'assembly writes renderable displacement records'
  ).toBe(true);
  expect(
    Boolean(assembly.storage.some(storage => storage.name === 'normalFoam')),
    'assembly writes normal and foam records'
  ).toBe(true);
  expect(SPECTRAL_OCEAN_ASSEMBLY_SHADER, 'foam derives from compression').toMatch(/jacobian/);
  expect(SPECTRAL_OCEAN_ASSEMBLY_SHADER, 'normals derive from the displaced field').toMatch(
    /cross\(tangentZ, tangentX\)/
  );
  expect(SPECTRAL_OCEAN_WORKGROUP_DIMENSION, 'workgroup dimension is stable').toBe(8);
  expect(SPECTRAL_OCEAN_UNIFORM_BYTE_LENGTH, 'uniform layout stays explicit').toBe(48);
  void 0;
});

function makeSupportDevice(overrides: Record<string, unknown> = {}): Device {
  const {type = 'webgpu', ...limitOverrides} = overrides;
  return {
    type,
    limits: {
      maxStorageBuffersPerShaderStage: 8,
      maxUniformBuffersPerShaderStage: 12,
      maxComputeInvocationsPerWorkgroup: 256,
      maxComputeWorkgroupSizeX: 256,
      maxComputeWorkgroupSizeY: 256,
      maxComputeWorkgroupsPerDimension: 65_535,
      maxStorageBufferBindingSize: 128 * 1024 * 1024,
      maxBufferSize: 256 * 1024 * 1024,
      ...limitOverrides
    }
  } as Device;
}
