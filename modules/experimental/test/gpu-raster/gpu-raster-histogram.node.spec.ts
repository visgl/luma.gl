// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {GraphBufferHandle, GraphDataView} from '@luma.gl/experimental';
import {
  GPURasterHistogram,
  type GPURasterBufferBand,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/gpu-raster';

type GraphOwner = GraphBufferHandle['graph'];

describe('GPURasterHistogram raster-domain contracts', () => {
  test('defaults to a valid-only domain and preserves exact integer nodata', () => {
    const owner = {id: 'histogram-valid-auto'} as GraphOwner;
    const values = makeView(owner, 'samples', 'uint32', 4);
    const validity = makeView(owner, 'validity', 'uint32', 4);
    const output = makeView(owner, 'bins', 'uint32', 8);
    const domainOutput = makeView(owner, 'extent', 'uint32', 2);
    const input: GPURasterBufferBand<'uint32'> = {
      id: 'reflectance',
      format: 'uint32',
      validity,
      noDataValue: 4294967295,
      storage: {kind: 'buffer', values}
    };

    const histogram = new GPURasterHistogram({input, output, domainOutput});

    expect(histogram.domain).toBe('valid-auto');
    expect(histogram.input).toBe(input);
    expect(histogram.output).toBe(output);
    expect(histogram.domainOutput).toBe(domainOutput);
    expect(histogram.input.noDataValue).toBe(4294967295);
  });

  test('accepts literal and caller-owned GPU domains without changing scalar precision', () => {
    const owner = {id: 'histogram-fixed-domain'} as GraphOwner;
    const input = makeBand(owner, 'elevation', 'sint32', 4);
    const output = makeView(owner, 'bins', 'uint32', 3);
    const gpuDomain = makeView(owner, 'domain', 'sint32', 2);

    const literalHistogram = new GPURasterHistogram({input, output, domain: [-100, 100]});
    const gpuHistogram = new GPURasterHistogram({input, output, domain: gpuDomain});

    expect(literalHistogram.domain).toEqual([-100, 100]);
    expect(gpuHistogram.domain).toBe(gpuDomain);
  });

  test('rejects published domains for fixed ranges and malformed automatic domains', () => {
    const owner = {id: 'histogram-domain-validation'} as GraphOwner;
    const input = makeBand(owner, 'samples', 'float32', 4);
    const output = makeView(owner, 'bins', 'uint32', 3);
    const domainOutput = makeView(owner, 'extent', 'float32', 2);

    expect(() => new GPURasterHistogram({input, output, domain: [0, 1], domainOutput})).toThrow(
      /domainOutput requires/
    );
    expect(
      () =>
        new GPURasterHistogram({
          input,
          output,
          domainOutput: makeView(owner, 'short-domain', 'float32', 1)
        })
    ).toThrow(/two float32 rows/);
    expect(() => new GPURasterHistogram({input, output, domain: [2, 1]})).toThrow(
      /finite \[min, max\] pair/
    );
  });

  test('requires one owner and separate borrowed input, bins, and published domains', () => {
    const owner = {id: 'histogram-owner'} as GraphOwner;
    const foreignOwner = {id: 'histogram-foreign-owner'} as GraphOwner;
    const input = makeBand(owner, 'samples', 'uint32', 4);
    const output = makeView(owner, 'bins', 'uint32', 4);

    expect(
      () =>
        new GPURasterHistogram({
          input,
          output: makeView(foreignOwner, 'foreign-bins', 'uint32', 4)
        })
    ).toThrow(/same graph/);
    expect(
      () =>
        new GPURasterHistogram({
          input,
          output,
          domainOutput: makeView(foreignOwner, 'foreign-extent', 'uint32', 2)
        })
    ).toThrow(/same graph/);
    expect(() => new GPURasterHistogram({input, output: input.storage.values})).toThrow(
      /separate buffers/
    );

    const aliasedDomain = new GraphDataView(input.storage.values.buffer, {
      format: 'uint32',
      length: 2,
      byteOffset: 0,
      byteStride: 4,
      rowByteLength: 4
    });
    expect(() => new GPURasterHistogram({input, output, domainOutput: aliasedDomain})).toThrow(
      /must not alias/
    );
  });

  test('rejects empty outputs and invalid raw integer nodata sentinels', () => {
    const owner = {id: 'histogram-edge-cases'} as GraphOwner;
    const input = makeBand(owner, 'samples', 'sint32', 4);

    expect(
      () => new GPURasterHistogram({input, output: makeView(owner, 'empty-output', 'uint32', 0)})
    ).toThrow(/at least one bin/);
    expect(
      () =>
        new GPURasterHistogram({
          input: {...input, noDataValue: 2147483648},
          output: makeView(owner, 'bins', 'uint32', 4)
        })
    ).toThrow(/fit in sint32/);
  });
});

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

function makeBand<Format extends GPURasterScalarFormat>(
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
