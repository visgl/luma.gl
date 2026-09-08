// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {getTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  getStructuredVolumeSupport,
  makeStructuredVolumeUniformData,
  StructuredVolumeRenderer
} from '../../src/rendering/structured-volume-renderer';
import {
  getStructuredVolumeShaderSource,
  STRUCTURED_VOLUME_UNIFORM_BYTE_LENGTH,
  STRUCTURED_VOLUME_UNIFORM_OFFSETS
} from '../../src/rendering/structured-volume-renderer-shaders';

const IDENTITY_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] as const;

it('structured volume uniforms pack typed styles and transforms', () => {
  const uniforms = makeStructuredVolumeUniformData(
    {
      inverseViewProjectionMatrix: IDENTITY_MATRIX,
      modelMatrix: [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 4, 6, 8, 1],
      cameraPosition: [1, 2, 3],
      viewport: [10, 20, 320, 180],
      mode: 'hybrid',
      sampleCount: 96,
      jitter: false,
      showBounds: false,
      scalarStyle: {transferFunction: 'signed', valueScale: 2, densityScale: 3, opacity: 0.5},
      vectorStyle: {colorMode: 'constant', magnitudeScale: 4, densityScale: 5, opacity: 0.75},
      glyphs: {enabled: true, gridDimensions: [4, 5, 6], opacity: 12}
    },
    [8, 9, 10]
  );

  expect(uniforms.byteLength, 'byte size matches WGSL').toBe(STRUCTURED_VOLUME_UNIFORM_BYTE_LENGTH);
  expect(
    Array.from(
      uniforms.slice(
        STRUCTURED_VOLUME_UNIFORM_OFFSETS.worldToVolumeMatrix + 12,
        STRUCTURED_VOLUME_UNIFORM_OFFSETS.worldToVolumeMatrix + 16
      )
    ),
    'model transform is inverted before upload'
  ).toEqual([-2, -3, -4, 1]);
  expect(
    Array.from(
      uniforms.slice(
        STRUCTURED_VOLUME_UNIFORM_OFFSETS.dimensionsAndMode,
        STRUCTURED_VOLUME_UNIFORM_OFFSETS.dimensionsAndMode + 4
      )
    ),
    'dimensions and hybrid mode are packed'
  ).toEqual([8, 9, 10, 2]);
  expect(
    Array.from(
      uniforms.slice(
        STRUCTURED_VOLUME_UNIFORM_OFFSETS.scalarScales,
        STRUCTURED_VOLUME_UNIFORM_OFFSETS.scalarScales + 4
      )
    ),
    'signed scalar style is packed'
  ).toEqual([2, 3, 0.5, 1]);
  expect(
    Array.from(
      uniforms.slice(
        STRUCTURED_VOLUME_UNIFORM_OFFSETS.glyphGrid,
        STRUCTURED_VOLUME_UNIFORM_OFFSETS.glyphGrid + 4
      )
    ),
    'glyph grid and enable flag are packed'
  ).toEqual([4, 5, 6, 1]);
  void 0;
});

it('structured volume shaders specialize buffer and texture sources', () => {
  const bufferSource = {type: 'buffer' as const, format: 'float32' as const, buffer: null!};
  const textureSource = {type: 'texture' as const, format: 'float32x4' as const, texture: null!};
  const source = getStructuredVolumeShaderSource({scalar: bufferSource, vector: textureSource});

  expect(
    Boolean(source.includes('scalarVolume: array<f32>')),
    'scalar buffer uses packed f32 storage'
  ).toBe(true);
  expect(
    Boolean(source.includes('vectorVolume: texture_3d<f32>')),
    'vector texture uses a 3D binding'
  ).toBe(true);
  expect(
    Boolean(source.includes('volumeRaymarch_composite')),
    'shared module contract is consumed'
  ).toBe(true);
  expect(Boolean(source.includes('step < 256u')), 'shader has a bounded maximum loop').toBe(true);
  void 0;
});

it('structured volume reports WebGPU support and validates resources', async () => {
  const nullDevice = await getTestDevice('null');
  expect(getStructuredVolumeSupport(nullDevice), 'non-WebGPU support is explicit').toEqual({
    supported: false,
    reason: 'StructuredVolumeRenderer requires WebGPU.'
  });

  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }
  const scalarBuffer = device.createBuffer({byteLength: 4 * 4 * 4 * 4, usage: Buffer.STORAGE});
  const scalarTexture = device.createTexture({
    dimension: '3d',
    width: 4,
    height: 4,
    depth: 4,
    format: 'r32float',
    usage: Texture.SAMPLE
  });
  const renderer = new StructuredVolumeRenderer(device, {
    dimensions: [4, 4, 4],
    scalar: {type: 'buffer', format: 'float32', buffer: scalarBuffer}
  });
  try {
    expect(
      () =>
        renderer.setSources({
          scalar: {type: 'texture', format: 'float32', texture: scalarTexture}
        }),
      'rebinding cannot change the pipeline backing type'
    ).toThrow(/backing type are immutable/);
    expect(
      () =>
        new StructuredVolumeRenderer(device, {
          dimensions: [4, 4, 4],
          scalar: {type: 'buffer', format: 'float32', buffer: {buffer: scalarBuffer, size: 12}}
        }),
      'undersized buffer views are rejected'
    ).toThrow(/smaller than its dimensions/);
    expect(
      () =>
        makeStructuredVolumeUniformData(
          {
            inverseViewProjectionMatrix: IDENTITY_MATRIX,
            cameraPosition: [0, 0, 2],
            viewport: [0, 0, 16, 16],
            mode: 'scalar',
            sampleCount: 0
          },
          [4, 4, 4]
        ),
      'invalid sample counts are rejected'
    ).toThrow(/sampleCount/);
  } finally {
    renderer.destroy();
    scalarBuffer.destroy();
    scalarTexture.destroy();
  }
  void 0;
});
