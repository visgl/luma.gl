// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {WgslReflect} from 'wgsl_reflect';
import {
  makeSpectralCausticsUniformData,
  SpectralCausticsRenderer
} from '../../src/rendering/spectral-caustics-renderer';
import {
  SPECTRAL_CAUSTICS_SPLAT_SHADER,
  SPECTRAL_CAUSTICS_TRACE_SHADER,
  SPECTRAL_CAUSTICS_UNIFORM_BYTE_LENGTH,
  SPECTRAL_CAUSTICS_UNIFORM_OFFSETS
} from '../../src/rendering/spectral-caustics-renderer-shaders';

const IDENTITY_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] as const;

test('spectral caustics renderer packs trace uniforms at WGSL offsets', testCase => {
  const uniformData = makeSpectralCausticsUniformData(
    {
      lightViewProjectionMatrix: IDENTITY_MATRIX,
      inverseLightViewProjectionMatrix: IDENTITY_MATRIX,
      receiverOrigin: [1, 2, 3],
      receiverTangent: [1, 0, 0],
      receiverBitangent: [0, 0, 1],
      receiverNormal: [0, 1, 0],
      receiverWidth: 10,
      receiverHeight: 20,
      refractiveIndex: 1.52,
      dispersion: 0.031,
      absorption: [0.1, 0.2, 0.3],
      intensity: 12
    },
    {captureSize: 64, mapSize: 256, splatRadius: 2.5}
  );
  const values = new Float32Array(uniformData);

  testCase.equal(
    uniformData.byteLength,
    SPECTRAL_CAUSTICS_UNIFORM_BYTE_LENGTH,
    'uniform byte length matches the WGSL struct'
  );
  testCase.deepEqual(
    Array.from(
      values.slice(
        SPECTRAL_CAUSTICS_UNIFORM_OFFSETS.receiverOriginWidth,
        SPECTRAL_CAUSTICS_UNIFORM_OFFSETS.receiverOriginWidth + 4
      )
    ),
    [1, 2, 3, 10],
    'receiver origin and width share one aligned vec4'
  );
  testCase.deepEqual(
    Array.from(
      values.slice(
        SPECTRAL_CAUSTICS_UNIFORM_OFFSETS.receiverBitangentIntensity,
        SPECTRAL_CAUSTICS_UNIFORM_OFFSETS.receiverBitangentIntensity + 4
      )
    ),
    [0, 0, 1, 12],
    'receiver bitangent and HDR intensity share one aligned vec4'
  );
  testCase.deepEqual(
    Array.from(
      values.slice(
        SPECTRAL_CAUSTICS_UNIFORM_OFFSETS.targetSizes,
        SPECTRAL_CAUSTICS_UNIFORM_OFFSETS.targetSizes + 4
      )
    ),
    [64, 256, 2.5, 0],
    'capture, output, and splat dimensions occupy the final vec4'
  );
  testCase.end();
});

test('spectral caustics renderer shaders expose trace and additive splat entry points', testCase => {
  const traceReflection = new WgslReflect(SPECTRAL_CAUSTICS_TRACE_SHADER);
  const splatReflection = new WgslReflect(SPECTRAL_CAUSTICS_SPLAT_SHADER);

  testCase.deepEqual(
    traceReflection.entry.compute.map(entry => entry.name),
    ['main'],
    'trace shader has one compute entry point'
  );
  testCase.deepEqual(
    splatReflection.entry.vertex.map(entry => entry.name),
    ['vertexMain'],
    'splat shader has one vertex entry point'
  );
  testCase.deepEqual(
    splatReflection.entry.fragment.map(entry => entry.name),
    ['fragmentMain'],
    'splat shader has one fragment entry point'
  );
  testCase.ok(
    traceReflection.storage.some(storage => storage.name === 'photonSplats'),
    'trace shader writes the photon-splat storage buffer'
  );
  testCase.ok(
    splatReflection.storage.some(storage => storage.name === 'photonSplats'),
    'splat shader reads the same photon-splat storage buffer'
  );
  testCase.end();
});

test('spectral caustics renderer rejects invalid optical and receiver inputs', testCase => {
  const validOptions = {
    lightViewProjectionMatrix: IDENTITY_MATRIX,
    inverseLightViewProjectionMatrix: IDENTITY_MATRIX,
    receiverOrigin: [0, 0, 0] as const,
    receiverTangent: [1, 0, 0] as const,
    receiverBitangent: [0, 0, 1] as const,
    receiverNormal: [0, 1, 0] as const,
    receiverWidth: 1,
    receiverHeight: 1
  };
  const dimensions = {captureSize: 64, mapSize: 256, splatRadius: 2};

  testCase.throws(
    () =>
      makeSpectralCausticsUniformData({...validOptions, receiverTangent: [2, 0, 0]}, dimensions),
    /unit length/,
    'non-unit receiver axes are rejected'
  );
  testCase.throws(
    () => makeSpectralCausticsUniformData({...validOptions, absorption: [0, -0.1, 0]}, dimensions),
    /non-negative/,
    'negative absorption is rejected'
  );
  testCase.throws(
    () => makeSpectralCausticsUniformData({...validOptions, refractiveIndex: 1}, dimensions),
    /greater than one/,
    'a non-refractive material is rejected'
  );
  testCase.throws(
    () => makeSpectralCausticsUniformData({...validOptions, receiverWidth: Infinity}, dimensions),
    /positive and finite/,
    'non-finite receiver dimensions are rejected'
  );
  testCase.throws(
    () => makeSpectralCausticsUniformData(validOptions, {...dimensions, mapSize: 0}),
    /positive integer/,
    'invalid uniform target dimensions are rejected'
  );
  testCase.end();
});

test('spectral caustics renderer records and owns its WebGPU pipeline resources', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const renderer = new SpectralCausticsRenderer(device, {
    id: 'spectral-caustics-renderer-test',
    captureSize: 2,
    mapSize: 4,
    splatRadius: 1
  });
  const causticMap = renderer.causticMap;
  const receiverProps = renderer.encode(device.commandEncoder, {
    lightViewProjectionMatrix: IDENTITY_MATRIX,
    inverseLightViewProjectionMatrix: IDENTITY_MATRIX,
    receiverOrigin: [0, 0, 0],
    receiverTangent: [1, 0, 0],
    receiverBitangent: [0, 0, 1],
    receiverNormal: [0, 1, 0],
    receiverWidth: 2,
    receiverHeight: 2,
    intensity: 8,
    drawRefractor: () => {}
  });
  device.submit();

  testCase.equal(receiverProps.causticMap, causticMap, 'encode returns the owned HDR XYZ map');
  testCase.equal(causticMap.format, 'rgba16float', 'caustic radiance remains floating point');
  renderer.destroy();
  renderer.destroy();
  testCase.ok(causticMap.destroyed, 'destroy releases the owned caustic map');
  testCase.throws(() => renderer.causticMap, /destroyed/, 'destroyed renderer rejects reuse');
  testCase.end();
});
