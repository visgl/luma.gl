// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
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

test('SpectralOceanSimulation publishes an immutable bounded dispatch plan', testCase => {
  const stats = makeSpectralOceanSimulationStats({resolution: 16, patchSize: 128});

  testCase.deepEqual(
    stats,
    {
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
    },
    'stats account for three inverse transforms and both assembly passes'
  );
  testCase.ok(Object.isFrozen(stats), 'stats are immutable');
  testCase.ok(Object.isFrozen(stats.workgroupSize), 'workgroup size is immutable');
  testCase.ok(Object.isFrozen(stats.workgroupCount), 'workgroup count is immutable');
  testCase.equal(SPECTRAL_OCEAN_MIN_RESOLUTION, 8, 'minimum resolution is explicit');
  testCase.equal(SPECTRAL_OCEAN_MAX_RESOLUTION, 1024, 'allocation bound is explicit');
  testCase.end();
});

test('SpectralOceanSimulation initial spectrum is deterministic and non-flat', testCase => {
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

  testCase.deepEqual(first, second, 'the same unsigned seed produces identical h0 values');
  testCase.notDeepEqual(first, differentSeed, 'changing the seed changes h0 values');
  testCase.equal(first[0], 0, 'the zero-frequency real component is suppressed');
  testCase.equal(first[1], 0, 'the zero-frequency imaginary component is suppressed');
  testCase.ok(Array.from(first).every(Number.isFinite), 'every spectral component is finite');
  testCase.ok(
    Array.from(first).some(value => Math.abs(value) > 0.001),
    'the field has energy'
  );
  testCase.end();
});

test('SpectralOceanSimulation validates physical inputs before allocation', testCase => {
  testCase.throws(
    () => makeSpectralOceanSimulationStats({resolution: 12}),
    /resolution must be a power of two/
  );
  testCase.throws(
    () => makeSpectralOceanSimulationStats({resolution: 4}),
    /resolution must be from 8 through 1024/
  );
  testCase.throws(
    () => makeSpectralOceanSimulationStats({resolution: 16, patchSize: 0}),
    /patchSize must be positive and finite/
  );
  testCase.throws(
    () => makeSpectralOceanSimulationStats({resolution: 16, windDirection: [0, 0]}),
    /windDirection must be non-zero/
  );
  testCase.throws(
    () => makeSpectralOceanSimulationStats({resolution: 16, seed: -1}),
    /seed must be an unsigned 32-bit integer/
  );
  testCase.throws(
    () => makeSpectralOceanSimulationStats({resolution: 16, foamThreshold: 1.1}),
    /foamThreshold must be from 0 through 1/
  );
  testCase.end();
});

test('getSpectralOceanSimulationSupport reports backend and resource-limit failures', testCase => {
  const supportedDevice = makeSupportDevice();
  const supported = getSpectralOceanSimulationSupport(supportedDevice, {resolution: 256});
  testCase.equal(supported.supported, true, 'representative WebGPU limits are supported');
  testCase.equal(supported.stats?.dispatchCountPerEncode, 56, 'support includes the full plan');

  const webglSupport = getSpectralOceanSimulationSupport(makeSupportDevice({type: 'webgl'}), {
    resolution: 16
  });
  testCase.equal(webglSupport.supported, false, 'WebGL is rejected');
  testCase.match(webglSupport.reason || '', /requires WebGPU/);

  const smallBindingSetSupport = getSpectralOceanSimulationSupport(
    makeSupportDevice({maxStorageBuffersPerShaderStage: 4}),
    {resolution: 16}
  );
  testCase.equal(smallBindingSetSupport.supported, false, 'assembly binding capacity is checked');
  testCase.match(smallBindingSetSupport.reason || '', /five compute storage buffers/);

  const smallBufferSupport = getSpectralOceanSimulationSupport(
    makeSupportDevice({maxStorageBufferBindingSize: 3000}),
    {resolution: 16}
  );
  testCase.equal(smallBufferSupport.supported, false, 'output storage size is checked');
  testCase.match(smallBufferSupport.reason || '', /output exceeds maxStorageBufferBindingSize/);
  testCase.end();
});

test('SpectralOceanSimulation shaders expose evolution and render-output stages', testCase => {
  const evolution = new WgslReflect(SPECTRAL_OCEAN_EVOLUTION_SHADER);
  const assembly = new WgslReflect(SPECTRAL_OCEAN_ASSEMBLY_SHADER);

  testCase.deepEqual(
    evolution.entry.compute.map(entry => entry.name),
    ['main'],
    'evolution has one compute entry point'
  );
  testCase.ok(
    evolution.storage.some(storage => storage.name === 'initialSpectrum'),
    'evolution reads deterministic h0 storage'
  );
  testCase.ok(
    evolution.storage.some(storage => storage.name === 'displacementZSpectrum'),
    'evolution emits horizontal-displacement spectra'
  );
  testCase.ok(
    assembly.storage.some(storage => storage.name === 'displacements'),
    'assembly writes renderable displacement records'
  );
  testCase.ok(
    assembly.storage.some(storage => storage.name === 'normalFoam'),
    'assembly writes normal and foam records'
  );
  testCase.match(SPECTRAL_OCEAN_ASSEMBLY_SHADER, /jacobian/, 'foam derives from compression');
  testCase.match(
    SPECTRAL_OCEAN_ASSEMBLY_SHADER,
    /cross\(tangentZ, tangentX\)/,
    'normals derive from the displaced field'
  );
  testCase.equal(SPECTRAL_OCEAN_WORKGROUP_DIMENSION, 8, 'workgroup dimension is stable');
  testCase.equal(SPECTRAL_OCEAN_UNIFORM_BYTE_LENGTH, 48, 'uniform layout stays explicit');
  testCase.end();
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
