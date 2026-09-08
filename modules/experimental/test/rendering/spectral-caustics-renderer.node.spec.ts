// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
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

it('spectral caustics renderer packs trace uniforms at WGSL offsets', () => {
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

  expect(uniformData.byteLength, 'uniform byte length matches the WGSL struct').toBe(
    SPECTRAL_CAUSTICS_UNIFORM_BYTE_LENGTH
  );
  expect(
    Array.from(
      values.slice(
        SPECTRAL_CAUSTICS_UNIFORM_OFFSETS.receiverOriginWidth,
        SPECTRAL_CAUSTICS_UNIFORM_OFFSETS.receiverOriginWidth + 4
      )
    ),
    'receiver origin and width share one aligned vec4'
  ).toEqual([1, 2, 3, 10]);
  expect(
    Array.from(
      values.slice(
        SPECTRAL_CAUSTICS_UNIFORM_OFFSETS.receiverBitangentIntensity,
        SPECTRAL_CAUSTICS_UNIFORM_OFFSETS.receiverBitangentIntensity + 4
      )
    ),
    'receiver bitangent and HDR intensity share one aligned vec4'
  ).toEqual([0, 0, 1, 12]);
  expect(
    Array.from(
      values.slice(
        SPECTRAL_CAUSTICS_UNIFORM_OFFSETS.targetSizes,
        SPECTRAL_CAUSTICS_UNIFORM_OFFSETS.targetSizes + 4
      )
    ),
    'capture, output, and splat dimensions occupy the final vec4'
  ).toEqual([64, 256, 2.5, 0]);
  void 0;
});

it('spectral caustics renderer shaders expose trace and additive splat entry points', () => {
  const traceReflection = new WgslReflect(SPECTRAL_CAUSTICS_TRACE_SHADER);
  const splatReflection = new WgslReflect(SPECTRAL_CAUSTICS_SPLAT_SHADER);

  expect(
    traceReflection.entry.compute.map(entry => entry.name),
    'trace shader has one compute entry point'
  ).toEqual(['main']);
  expect(
    splatReflection.entry.vertex.map(entry => entry.name),
    'splat shader has one vertex entry point'
  ).toEqual(['vertexMain']);
  expect(
    splatReflection.entry.fragment.map(entry => entry.name),
    'splat shader has one fragment entry point'
  ).toEqual(['fragmentMain']);
  expect(
    Boolean(traceReflection.storage.some(storage => storage.name === 'photonSplats')),
    'trace shader writes the photon-splat storage buffer'
  ).toBe(true);
  expect(
    Boolean(splatReflection.storage.some(storage => storage.name === 'photonSplats')),
    'splat shader reads the same photon-splat storage buffer'
  ).toBe(true);
  void 0;
});

it('spectral caustics renderer rejects invalid optical and receiver inputs', () => {
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

  expect(
    () =>
      makeSpectralCausticsUniformData({...validOptions, receiverTangent: [2, 0, 0]}, dimensions),
    'non-unit receiver axes are rejected'
  ).toThrow(/unit length/);
  expect(
    () => makeSpectralCausticsUniformData({...validOptions, absorption: [0, -0.1, 0]}, dimensions),
    'negative absorption is rejected'
  ).toThrow(/non-negative/);
  expect(
    () => makeSpectralCausticsUniformData({...validOptions, refractiveIndex: 1}, dimensions),
    'a non-refractive material is rejected'
  ).toThrow(/greater than one/);
  expect(
    () => makeSpectralCausticsUniformData({...validOptions, receiverWidth: Infinity}, dimensions),
    'non-finite receiver dimensions are rejected'
  ).toThrow(/positive and finite/);
  expect(
    () => makeSpectralCausticsUniformData(validOptions, {...dimensions, mapSize: 0}),
    'invalid uniform target dimensions are rejected'
  ).toThrow(/positive integer/);
  void 0;
});

it('spectral caustics renderer records and owns its WebGPU pipeline resources', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
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

  expect(receiverProps.causticMap, 'encode returns the owned HDR XYZ map').toBe(causticMap);
  expect(causticMap.format, 'caustic radiance remains floating point').toBe('rgba16float');
  renderer.destroy();
  renderer.destroy();
  expect(Boolean(causticMap.destroyed), 'destroy releases the owned caustic map').toBe(true);
  expect(() => renderer.causticMap, 'destroyed renderer rejects reuse').toThrow(/destroyed/);
  void 0;
});
