// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
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

test('structured volume uniforms pack typed styles and transforms', testContext => {
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

  testContext.equal(
    uniforms.byteLength,
    STRUCTURED_VOLUME_UNIFORM_BYTE_LENGTH,
    'byte size matches WGSL'
  );
  testContext.deepEqual(
    Array.from(
      uniforms.slice(
        STRUCTURED_VOLUME_UNIFORM_OFFSETS.worldToVolumeMatrix + 12,
        STRUCTURED_VOLUME_UNIFORM_OFFSETS.worldToVolumeMatrix + 16
      )
    ),
    [-2, -3, -4, 1],
    'model transform is inverted before upload'
  );
  testContext.deepEqual(
    Array.from(
      uniforms.slice(
        STRUCTURED_VOLUME_UNIFORM_OFFSETS.dimensionsAndMode,
        STRUCTURED_VOLUME_UNIFORM_OFFSETS.dimensionsAndMode + 4
      )
    ),
    [8, 9, 10, 2],
    'dimensions and hybrid mode are packed'
  );
  testContext.deepEqual(
    Array.from(
      uniforms.slice(
        STRUCTURED_VOLUME_UNIFORM_OFFSETS.scalarScales,
        STRUCTURED_VOLUME_UNIFORM_OFFSETS.scalarScales + 4
      )
    ),
    [2, 3, 0.5, 1],
    'signed scalar style is packed'
  );
  testContext.deepEqual(
    Array.from(
      uniforms.slice(
        STRUCTURED_VOLUME_UNIFORM_OFFSETS.glyphGrid,
        STRUCTURED_VOLUME_UNIFORM_OFFSETS.glyphGrid + 4
      )
    ),
    [4, 5, 6, 1],
    'glyph grid and enable flag are packed'
  );
  testContext.end();
});

test('structured volume shaders specialize buffer and texture sources', testContext => {
  const bufferSource = {type: 'buffer' as const, format: 'float32' as const, buffer: null!};
  const textureSource = {type: 'texture' as const, format: 'float32x4' as const, texture: null!};
  const source = getStructuredVolumeShaderSource({scalar: bufferSource, vector: textureSource});

  testContext.ok(
    source.includes('scalarVolume: array<f32>'),
    'scalar buffer uses packed f32 storage'
  );
  testContext.ok(
    source.includes('vectorVolume: texture_3d<f32>'),
    'vector texture uses a 3D binding'
  );
  testContext.ok(source.includes('volumeRaymarch_composite'), 'shared module contract is consumed');
  testContext.ok(source.includes('step < 256u'), 'shader has a bounded maximum loop');
  testContext.end();
});

test('structured volume reports WebGPU support and validates resources', async testContext => {
  const nullDevice = await getTestDevice('null');
  testContext.deepEqual(
    getStructuredVolumeSupport(nullDevice),
    {supported: false, reason: 'StructuredVolumeRenderer requires WebGPU.'},
    'non-WebGPU support is explicit'
  );

  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
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
    testContext.throws(
      () =>
        renderer.setSources({
          scalar: {type: 'texture', format: 'float32', texture: scalarTexture}
        }),
      /backing type are immutable/,
      'rebinding cannot change the pipeline backing type'
    );
    testContext.throws(
      () =>
        new StructuredVolumeRenderer(device, {
          dimensions: [4, 4, 4],
          scalar: {type: 'buffer', format: 'float32', buffer: {buffer: scalarBuffer, size: 12}}
        }),
      /smaller than its dimensions/,
      'undersized buffer views are rejected'
    );
    testContext.throws(
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
      /sampleCount/,
      'invalid sample counts are rejected'
    );
  } finally {
    renderer.destroy();
    scalarBuffer.destroy();
    scalarTexture.destroy();
  }
  testContext.end();
});
