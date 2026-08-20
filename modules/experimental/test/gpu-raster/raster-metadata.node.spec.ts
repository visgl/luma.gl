// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  GraphBufferHandle,
  GraphDataView,
  GraphTextureHandle,
  GraphTextureView
} from '@luma.gl/gpgpu/gpu-core';
import {
  GPURaster,
  GPURasterBufferToTexture,
  GPURasterTextureToBuffer,
  type GPURasterBufferBand,
  type GPURasterMetadata,
  type GPURasterScalarFormat,
  type GPURasterTextureBand,
  type GPURasterTextureFormat
} from '@luma.gl/experimental/gpu-raster';

type GraphOwner = GraphBufferHandle['graph'];

describe('GPURaster spatial metadata and borrowed bands', () => {
  test('preserves affine precision, pixel centers, rotation, and coordinate-unit area', () => {
    const owner = {id: 'metadata'};
    const metadata = makeMetadata({
      affine: [2, 1, 500000.25, -1, -3, 4300000.5],
      coordinateReferenceSystem: {authority: 'EPSG:32618'}
    });
    const band = makeBufferBand(owner, 'elevation', 'float32', 6);
    const raster = new GPURaster({id: 'elevation', metadata, bands: [band]});

    expect(raster.pixelCount).toBe(6);
    expect(raster.getBand('elevation')).toBe(band);
    expect(raster.getPixelWorldPosition(0, 0)).toEqual([500001.75, 4299998.5]);
    expect(raster.getPixelWorldPosition(2, 1)).toEqual([500006.75, 4299993.5]);
    expect(raster.getPixelArea()).toBe(5);
    expect(raster.graph).toBe(owner);

    const pointRaster = new GPURaster({
      metadata: {...metadata, pixelInterpretation: 'point'},
      bands: [band]
    });
    expect(pointRaster.getPixelWorldPosition(0, 0)).toEqual([500000.25, 4300000.5]);
  });

  test('rejects invalid dimensions, singular transforms, overview levels, and origins', () => {
    const owner = {id: 'invalid-metadata'};
    const band = makeBufferBand(owner, 'values', 'float32', 6);
    expect(() => new GPURaster({metadata: makeMetadata({width: 0}), bands: [band]})).toThrow(
      /positive integers/
    );
    expect(
      () => new GPURaster({metadata: makeMetadata({affine: [1, 2, 0, 2, 4, 0]}), bands: [band]})
    ).toThrow(/invertible/);
    expect(
      () =>
        new GPURaster({
          metadata: makeMetadata({affine: [1, 0, Number.NaN, 0, -1, 0]}),
          bands: [band]
        })
    ).toThrow(/finite coefficients/);
    expect(() => new GPURaster({metadata: makeMetadata({level: -1}), bands: [band]})).toThrow(
      /overview level/
    );
    expect(
      () =>
        new GPURaster({
          metadata: makeMetadata({levelZeroOrigin: [0, Number.POSITIVE_INFINITY]}),
          bands: [band]
        })
    ).toThrow(/levelZeroOrigin/);
  });

  test('requires unique graph-aligned packed bands and validity masks', () => {
    const owner = {id: 'owner'};
    const foreignOwner = {id: 'foreign'};
    const first = makeBufferBand(owner, 'red', 'uint32', 6);
    const duplicate = makeBufferBand(owner, 'red', 'uint32', 6);
    const foreign = makeBufferBand(foreignOwner, 'near-infrared', 'uint32', 6);
    const short = makeBufferBand(owner, 'short', 'uint32', 5);

    expect(() => new GPURaster({metadata: makeMetadata(), bands: []})).toThrow(/at least one band/);
    expect(() => new GPURaster({metadata: makeMetadata(), bands: [first, duplicate]})).toThrow(
      /unique/
    );
    expect(() => new GPURaster({metadata: makeMetadata(), bands: [first, foreign]})).toThrow(
      /same graph/
    );
    expect(() => new GPURaster({metadata: makeMetadata(), bands: [short]})).toThrow(
      /one sample per pixel/
    );
    expect(
      () =>
        new GPURaster({
          metadata: makeMetadata(),
          bands: [{...first, validity: makeView(foreignOwner, 'foreign-mask', 'uint32', 6)}]
        })
    ).toThrow(/validity must belong to the same graph/);
  });

  test('validates texture dimensions, single layers, channels, and scalar format', () => {
    const owner = {id: 'textures'};
    const valid = makeTextureBand(owner, 'red', 'uint32', 'rgba32uint', 3, 2, 2);
    expect(new GPURaster({metadata: makeMetadata(), bands: [valid]}).getBand('red')).toBe(valid);

    const missingChannel = makeTextureBand(owner, 'single', 'uint32', 'r32uint', 3, 2, 1);
    expect(() => new GPURaster({metadata: makeMetadata(), bands: [missingChannel]})).toThrow(
      /channel count/
    );
    const wrongExtent = makeTextureBand(owner, 'extent', 'uint32', 'r32uint', 2, 2);
    expect(() => new GPURaster({metadata: makeMetadata(), bands: [wrongExtent]})).toThrow(
      /extent must match/
    );
    const invalidFormat = makeTextureBand(owner, 'format', 'uint32', 'r32uint', 3, 2);
    const mislabeled = {...invalidFormat, format: 'float32'} as unknown as GPURasterTextureBand;
    expect(() => new GPURaster({metadata: makeMetadata(), bands: [mislabeled]})).toThrow(
      /must preserve float32/
    );
  });

  test('preserves exact integer nodata sentinels and rejects out-of-domain values', () => {
    const owner = {id: 'nodata'};
    const maximum = makeBufferBand(owner, 'maximum', 'uint32', 6);
    expect(
      new GPURaster({
        metadata: makeMetadata(),
        bands: [{...maximum, noDataValue: 4294967295}]
      }).getBand('maximum').noDataValue
    ).toBe(4294967295);
    expect(
      () =>
        new GPURaster({metadata: makeMetadata(), bands: [{...maximum, noDataValue: 4294967296}]})
    ).toThrow(/fit in uint32/);
    expect(
      () => new GPURaster({metadata: makeMetadata(), bands: [{...maximum, noDataValue: -1}]})
    ).toThrow(/fit in uint32/);
    const floating = makeBufferBand(owner, 'floating', 'float32', 6);
    expect(
      Number.isNaN(
        new GPURaster({
          metadata: makeMetadata(),
          bands: [{...floating, noDataValue: Number.NaN}]
        }).getBand('floating').noDataValue
      )
    ).toBe(true);
    expect(
      () => new GPURaster({metadata: makeMetadata(), bands: [{...floating, scale: Number.NaN}]})
    ).toThrow(/scale must be finite/);
  });

  test('rejects mismatched affine, CRS, level, and pixel-origin conventions', () => {
    const owner = {id: 'compatibility'};
    const band = makeBufferBand(owner, 'band', 'float32', 6);
    const metadata = makeMetadata({
      coordinateReferenceSystem: {authority: 'EPSG:4326'},
      level: 2,
      levelZeroOrigin: [16, 8]
    });
    const first = new GPURaster({metadata, bands: [band]});
    const matching = new GPURaster({metadata: {...metadata}, bands: [band]});
    expect(first.isCompatibleWith(matching)).toBe(true);

    const mismatches: GPURasterMetadata[] = [
      {...metadata, coordinateReferenceSystem: {authority: 'EPSG:3857'}},
      {...metadata, affine: [1, 0, 1, 0, -1, 0]},
      {...metadata, pixelInterpretation: 'point'},
      {...metadata, level: 1},
      {...metadata, levelZeroOrigin: [0, 0]}
    ];
    for (const mismatch of mismatches) {
      const other = new GPURaster({metadata: mismatch, bands: [band]});
      expect(first.isCompatibleWith(other)).toBe(false);
      expect(() => first.assertCompatibleWith(other)).toThrow(/coordinate systems must match/);
    }
  });
});

describe('GPURaster texture/buffer contributor validation', () => {
  test('requires source-aligned output masks and explicit calibrated float promotion', () => {
    const owner = {id: 'gather-validation'};
    const input = {
      ...makeTextureBand(owner, 'raw', 'uint32', 'r32uint', 3, 2),
      scale: 0.5,
      offset: 4
    };
    const unsignedOutput = makeView(owner, 'unsigned-output', 'uint32', 6);
    const floatingOutput = makeView(owner, 'floating-output', 'float32', 6);
    const outputValidity = makeView(owner, 'output-validity', 'uint32', 6);

    expect(
      new GPURasterTextureToBuffer({input, output: unsignedOutput, outputValidity}).applyCalibration
    ).toBe(false);
    expect(
      new GPURasterTextureToBuffer({
        input,
        output: floatingOutput,
        outputValidity,
        applyCalibration: true
      }).applyCalibration
    ).toBe(true);
    expect(
      () =>
        new GPURasterTextureToBuffer({
          input,
          output: unsignedOutput,
          outputValidity,
          applyCalibration: true
        })
    ).toThrow(/float32/);
    expect(
      () =>
        new GPURasterTextureToBuffer({
          input,
          output: unsignedOutput,
          outputValidity: makeView(owner, 'short', 'uint32', 5)
        })
    ).toThrow(/one flag per pixel/);
  });

  test('rejects aliased gather outputs and invalid destination texture channels', () => {
    const owner = {id: 'scatter-validation'};
    const textureInput = makeTextureBand(owner, 'source', 'float32', 'r32float', 3, 2);
    const aliases = makeView(owner, 'aliases', 'float32', 6);
    const aliasMask = new GraphDataView(aliases.buffer, {
      format: 'uint32',
      length: 6,
      byteOffset: 0,
      byteStride: 4,
      rowByteLength: 4
    });
    expect(
      () =>
        new GPURasterTextureToBuffer({
          input: textureInput,
          output: aliases,
          outputValidity: aliasMask
        })
    ).toThrow(/separate buffers/);

    const input = makeBufferBand(owner, 'input', 'float32', 6);
    const output = makeTextureBand(owner, 'destination', 'float32', 'r32float', 3, 2);
    expect(
      () => new GPURasterBufferToTexture({input, output: output.storage.view, channel: 1})
    ).toThrow(/channel count/);
  });

  test('rejects multisampled raster textures before metadata construction or graph contribution', () => {
    const owner = {id: 'multisampled-validation'};
    const multisampled = makeTextureBand(
      owner,
      'multisampled',
      'float32',
      'r32float',
      3,
      2,
      undefined,
      4
    );
    const values = makeView(owner, 'values', 'float32', 6);
    const validity = makeView(owner, 'validity', 'uint32', 6);
    const source = makeBufferBand(owner, 'source', 'float32', 6);

    expect(() => new GPURaster({metadata: makeMetadata(), bands: [multisampled]})).toThrow(
      /single-sampled/
    );
    expect(
      () =>
        new GPURasterTextureToBuffer({
          input: multisampled,
          output: values,
          outputValidity: validity
        })
    ).toThrow(/single-sampled/);
    expect(
      () => new GPURasterBufferToTexture({input: source, output: multisampled.storage.view})
    ).toThrow(/single-sampled/);
  });

  test('preserves integer nodata and source masks with an explicit destination validity mask', () => {
    const owner = {id: 'integer-validity'};
    const input = makeBufferBand(owner, 'classifications', 'uint32', 6);
    const output = makeTextureBand(owner, 'destination', 'uint32', 'r32uint', 3, 2);
    const sourceValidity = makeView(owner, 'source-validity', 'uint32', 6);
    const outputValidity = makeView(owner, 'output-validity', 'uint32', 6);

    expect(
      () =>
        new GPURasterBufferToTexture({
          input: {...input, noDataValue: 99},
          output: output.storage.view
        })
    ).toThrow(/explicit output validity mask/);
    expect(
      () =>
        new GPURasterBufferToTexture({
          input: {...input, validity: sourceValidity},
          output: output.storage.view
        })
    ).toThrow(/explicit output validity mask/);
    expect(
      new GPURasterBufferToTexture({
        input: {...input, noDataValue: 99, validity: sourceValidity},
        output: output.storage.view,
        outputValidity
      }).outputValidity
    ).toBe(outputValidity);
    expect(
      new GPURasterBufferToTexture({input, output: output.storage.view}).outputValidity
    ).toBeUndefined();
  });
});

function makeMetadata(overrides: Partial<GPURasterMetadata> = {}): GPURasterMetadata {
  return {
    width: 3,
    height: 2,
    affine: [1, 0, 0, 0, -1, 0],
    pixelInterpretation: 'area',
    ...overrides
  };
}

function makeView<Format extends GPURasterScalarFormat>(
  owner: GraphOwner,
  id: string,
  format: Format,
  length: number
): GraphDataView<Format> {
  const handle = new GraphBufferHandle(
    owner,
    {id, byteLength: Math.max(length, 1) * 4, usage: 0},
    false
  );
  return new GraphDataView(handle, {
    format,
    length,
    byteOffset: 0,
    byteStride: 4,
    rowByteLength: 4
  });
}

function makeBufferBand<Format extends GPURasterScalarFormat>(
  owner: GraphOwner,
  id: string,
  format: Format,
  length: number
): GPURasterBufferBand<Format> {
  return {
    id,
    format,
    storage: {kind: 'buffer', values: makeView(owner, id, format, length)}
  } as GPURasterBufferBand<Format>;
}

function makeTextureBand<Format extends GPURasterScalarFormat>(
  owner: GraphOwner,
  id: string,
  format: Format,
  textureFormat: GPURasterTextureFormat<Format>,
  width: number,
  height: number,
  channel?: 0 | 1 | 2 | 3,
  samples: number = 1
): GPURasterTextureBand<Format> {
  const texture = new GraphTextureHandle(
    owner,
    {
      id,
      format: textureFormat,
      width,
      height,
      usage: 1,
      dimension: '2d',
      depth: 1,
      mipLevels: 1,
      samples
    },
    false
  );
  const view = new GraphTextureView(texture, {
    dimension: '2d',
    aspect: 'all',
    baseMipLevel: 0,
    mipLevelCount: 1,
    baseArrayLayer: 0,
    arrayLayerCount: 1,
    width,
    height,
    depth: 1
  });
  return {id, format, storage: {kind: 'texture', view, channel}} as GPURasterTextureBand<Format>;
}
