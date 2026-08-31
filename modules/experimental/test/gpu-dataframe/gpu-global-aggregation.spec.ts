// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUDataFrame,
  column,
  literal,
  parameter,
  type GPUDataFrameQueryParameters
} from '@luma.gl/experimental/gpu-dataframe';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {GPURecordBatch, GPUTable} from '@luma.gl/experimental/gpu-tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';
import {vi} from 'vitest';

type GPUAnalyticsSourceSchema = {
  category: 'uint32';
  fare: 'float32';
  distance: 'sint32';
};

type GPUAnalyticsFixture = {
  frame: GPUDataFrame<GPUAnalyticsSourceSchema>;
  sourceBuffers: Buffer[];
};

it('GPUDataFrame reduces nullable scalar GPU vectors without flattening source batches', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const fixture = createGPUAnalyticsFixture(device);
  const createBufferSpy = vi.spyOn(device, 'createBuffer');
  const submitSpy = vi.spyOn(device, 'submit');
  const query = fixture.frame.aggregate({
    rowCount: 'count',
    totalFare: {sum: 'fare'},
    minimumFare: {min: 'fare'},
    maximumFare: {max: 'fare'},
    averageFare: {mean: 'fare'},
    totalDistance: {sum: 'distance'},
    minimumDistance: {min: 'distance'},
    averageDistance: {mean: 'distance'},
    maximumCategory: {max: 'category'},
    totalCategory: {sum: 'category'},
    averageCategory: {mean: 'category'}
  });

  expect(
    createBufferSpy.mock.calls.length,
    'immutable global-aggregation planning allocates no GPU storage'
  ).toBe(0);
  expect(
    submitSpy.mock.calls.length,
    'immutable global-aggregation planning submits no GPU commands'
  ).toBe(0);

  const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-global-nullable-aggregation'
  });
  const compiled = query.compile(graph);

  try {
    expect(
      compiled.table.batches.map(batch => batch.numRows),
      'global GPU reductions publish exactly one owned result row'
    ).toEqual([1]);
    expect(
      compiled.table.schema.fields.map(field => ({name: field.name, format: field.format})),
      'sum/min/max preserve scalar formats while means and counts use float32 and uint32'
    ).toEqual([
      {name: 'rowCount', format: 'uint32'},
      {name: 'totalFare', format: 'float32'},
      {name: 'minimumFare', format: 'float32'},
      {name: 'maximumFare', format: 'float32'},
      {name: 'averageFare', format: 'float32'},
      {name: 'totalDistance', format: 'sint32'},
      {name: 'minimumDistance', format: 'sint32'},
      {name: 'averageDistance', format: 'float32'},
      {name: 'maximumCategory', format: 'uint32'},
      {name: 'totalCategory', format: 'uint32'},
      {name: 'averageCategory', format: 'float32'}
    ]);
    expect(
      compiled.selectionMask.data.map(chunk => chunk.length),
      'global reductions retain independent source selection batches'
    ).toEqual([2, 0, 3]);

    fixture.frame.destroy();
    expect(
      Boolean(fixture.sourceBuffers.every(buffer => !buffer.destroyed)),
      'global reductions retain their original owned source lease'
    ).toBe(true);

    const commandEncoder = device.createCommandEncoder({
      id: 'gpu-dataframe-global-reduction-encode'
    });
    compiled.encode(commandEncoder);
    expect(
      submitSpy.mock.calls.length,
      'global aggregation only records work into a caller-owned command encoder'
    ).toBe(0);
    device.submit(commandEncoder.finish());

    expect(
      await readUint32Scalar(compiled.table.gpuVectors.rowCount),
      'global count includes every selected source row, independent of column nulls'
    ).toBe(5);
    expect(
      await readFloat32Scalar(compiled.table.gpuVectors.totalFare),
      'floating-point sums exclude explicit nullable rows across preserved batches'
    ).toBe(159);
    expect(
      await readFloat32Scalar(compiled.table.gpuVectors.minimumFare),
      'floating-point minimums exclude explicit null rows'
    ).toBe(10);
    expect(
      await readFloat32Scalar(compiled.table.gpuVectors.maximumFare),
      'global maximums include valid rows regardless of other columns nullability'
    ).toBe(99);
    expect(
      await readFloat32Scalar(compiled.table.gpuVectors.averageFare),
      'floating-point means divide only accepted non-null contributions'
    ).toBe(39.75);
    expect(
      await readSignedScalar(compiled.table.gpuVectors.totalDistance),
      'signed integer sums preserve native 32-bit output formats'
    ).toBe(12);
    expect(
      await readSignedScalar(compiled.table.gpuVectors.minimumDistance),
      'signed minimums preserve negative input values'
    ).toBe(-2);
    expect(
      Boolean(
        Math.abs((await readFloat32Scalar(compiled.table.gpuVectors.averageDistance)) - 2.4) <
          0.000001
      ),
      'signed scalar means convert contributions to float32 before averaging'
    ).toBe(true);
    expect(
      await readUint32Scalar(compiled.table.gpuVectors.maximumCategory),
      'unsigned maximums reject null category values'
    ).toBe(1);
    expect(
      await readUint32Scalar(compiled.table.gpuVectors.totalCategory),
      'unsigned sums exclude the nullable category sidecar'
    ).toBe(2);
    expect(
      await readFloat32Scalar(compiled.table.gpuVectors.averageCategory),
      'unsigned nullable scalar means divide only accepted categorical values'
    ).toBe(0.5);
    for (const metric of [
      'totalFare',
      'minimumFare',
      'maximumFare',
      'averageFare',
      'totalDistance',
      'minimumDistance',
      'averageDistance',
      'maximumCategory',
      'totalCategory',
      'averageCategory'
    ] as const) {
      const validity = compiled.validity[metric];
      if (!validity) {
        throw new Error(`Expected explicit global validity for ${metric}`);
      }
      expect(await readUint32Scalar(validity), `${metric} has valid contributions`).toBe(1);
    }
    expect(compiled.validity.rowCount, 'global row counts are nonnullable').toBe(undefined);

    const outputBuffers = Object.values(compiled.table.gpuVectors).flatMap(vector =>
      vector.data.map(getGPUAnalyticsBuffer)
    );
    compiled.destroy();
    expect(
      Boolean(outputBuffers.every(buffer => buffer.destroyed)),
      'compiled global reductions release their owned scalar result buffers'
    ).toBe(true);
    expect(
      Boolean(fixture.sourceBuffers.every(buffer => buffer.destroyed)),
      'owned source resources release only after their final aggregation lease'
    ).toBe(true);
  } finally {
    compiled.destroy();
    fixture.frame.destroy();
    createBufferSpy.mockRestore();
    submitSpy.mockRestore();
  }

  void 0;
});

it('GPUDataFrame updates filtered and derived global statistics within one command encoder', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const fixture = createGPUAnalyticsFixture(device);
  const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-filtered-derived-reduction'
  });
  const compiled = fixture.frame
    .withColumn('adjustedFare', column('fare').add(literal(5)), {format: 'float32'})
    .filter(column('adjustedFare').greaterThan(parameter('minimumFare', 0)))
    .aggregate({
      rowCount: 'count',
      totalFare: {sum: 'adjustedFare'},
      averageFare: {mean: 'adjustedFare'}
    })
    .compile(graph);

  const firstCount = device.createBuffer({
    id: 'gpu-dataframe-global-first-count',
    byteLength: Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.COPY_SRC | Buffer.COPY_DST
  });
  const firstSum = device.createBuffer({
    id: 'gpu-dataframe-global-first-sum',
    byteLength: Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.COPY_SRC | Buffer.COPY_DST
  });

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-global-two-encodes'});
    compiled.encode(commandEncoder, {minimumFare: 20});
    commandEncoder.copyBufferToBuffer({
      sourceBuffer: getGPUAnalyticsBuffer(compiled.table.gpuVectors.rowCount.data[0]),
      destinationBuffer: firstCount,
      size: Uint32Array.BYTES_PER_ELEMENT
    });
    commandEncoder.copyBufferToBuffer({
      sourceBuffer: getGPUAnalyticsBuffer(compiled.table.gpuVectors.totalFare.data[0]),
      destinationBuffer: firstSum,
      size: Float32Array.BYTES_PER_ELEMENT
    });
    compiled.encode(commandEncoder, {minimumFare: 40});
    device.submit(commandEncoder.finish());

    expect((await readGPUUint32Buffer(firstCount, 1))[0], 'first filter accepts three rows').toBe(
      3
    );
    expect((await readGPUFloat32Buffer(firstSum, 1))[0], 'first derived sum is 25 + 35 + 104').toBe(
      164
    );
    expect(
      await readUint32Scalar(compiled.table.gpuVectors.rowCount),
      'the second encoder state accepts only the valid fare above forty'
    ).toBe(1);
    expect(
      await readFloat32Scalar(compiled.table.gpuVectors.totalFare),
      'global reductions observe encoder-ordered derived parameter updates'
    ).toBe(104);
    expect(
      await readFloat32Scalar(compiled.table.gpuVectors.averageFare),
      'global mean follows the second filtered contribution count'
    ).toBe(104);
  } finally {
    firstCount.destroy();
    firstSum.destroy();
    compiled.destroy();
    fixture.frame.destroy();
  }

  void 0;
});

it('GPUDataFrame drops NaN and infinity from scalar statistics without dropping row counts', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const fixture = createGPUAnalyticsFixture(device);
  const fare = fixture.frame.table.gpuVectors.fare;
  getGPUAnalyticsBuffer(fare.data[0]).write(Float32Array.from([10, Number.NaN]));
  getGPUAnalyticsBuffer(fare.data[2]).write(Float32Array.from([Number.POSITIVE_INFINITY, 99, 50]));

  const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-nonfinite-reduction'
  });
  const compiled = fixture.frame
    .aggregate({rowCount: 'count', totalFare: {sum: 'fare'}, averageFare: {mean: 'fare'}})
    .compile(graph);

  try {
    const commandEncoder = device.createCommandEncoder({
      id: 'gpu-dataframe-nonfinite-reduction-encode'
    });
    compiled.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    expect(
      await readUint32Scalar(compiled.table.gpuVectors.rowCount),
      'NaN rows remain counted'
    ).toBe(5);
    expect(
      await readFloat32Scalar(compiled.table.gpuVectors.totalFare),
      'NaN and infinity do not poison floating sums'
    ).toBe(109);
    expect(
      await readFloat32Scalar(compiled.table.gpuVectors.averageFare),
      'means count finite 10 and 99 only'
    ).toBe(54.5);
  } finally {
    compiled.destroy();
    fixture.frame.destroy();
  }

  void 0;
});

it('GPUDataFrame builds nullable, filtered numeric histograms with literal domains and edges', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const fixture = createGPUAnalyticsFixture(device);
  const createBufferSpy = vi.spyOn(device, 'createBuffer');
  const domainQuery = fixture.frame.histogram('fare', {bins: 4, domain: [0, 80]});
  expect(createBufferSpy.mock.calls.length, 'histogram planning does not allocate buffers').toBe(0);
  createBufferSpy.mockRestore();

  const domainGraph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-domain-histogram'
  });
  const domainHistogram = domainQuery.compile(domainGraph);
  const edgeGraph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-irregular-histogram'
  });
  const edgeHistogram = fixture.frame
    .histogram('fare', {edges: [0, 15, 25, 40, 100]})
    .compile(edgeGraph);
  const filteredGraph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-filtered-histogram'
  });
  const filteredHistogram = fixture.frame
    .filter(column('category').isValid())
    .histogram('fare', {bins: 4, domain: [0, 80]})
    .compile(filteredGraph);

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-histograms-encode'});
    domainHistogram.encode(commandEncoder);
    edgeHistogram.encode(commandEncoder);
    filteredHistogram.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    expect(domainHistogram.binCount, 'equal-width histogram exposes its bin count').toBe(4);
    expect(domainHistogram.domain, 'equal-width domain remains explicit').toEqual([0, 80]);
    expect(edgeHistogram.edges, 'irregular boundaries remain explicit').toEqual([
      0, 15, 25, 40, 100
    ]);
    expect(
      await readUint32Vector(domainHistogram.table.gpuVectors.bin),
      'histogram output publishes dense GPU-written bin identities'
    ).toEqual([0, 1, 2, 3]);
    expect(
      await readUint32Vector(domainHistogram.table.gpuVectors.count),
      'equal-width histogram excludes null and out-of-domain values'
    ).toEqual([1, 2, 0, 0]);
    expect(
      await readUint32Vector(edgeHistogram.table.gpuVectors.count),
      'irregular histogram bins retain explicit nullable semantics'
    ).toEqual([1, 1, 1, 1]);
    expect(
      await readUint32Vector(filteredHistogram.table.gpuVectors.count),
      'histogram selection masks combine filters with independent value validity'
    ).toEqual([1, 2, 0, 0]);
    expect(
      filteredHistogram.selectionMask.data.map(chunk => chunk.length),
      'histogram source masks retain every original batch boundary'
    ).toEqual([2, 0, 3]);
  } finally {
    domainHistogram.destroy();
    edgeHistogram.destroy();
    filteredHistogram.destroy();
    fixture.frame.destroy();
  }

  void 0;
});

it('GPUDataFrame retains explicit invalid scalar outputs and zero histograms for empty inputs', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const frame = new GPUDataFrame<GPUAnalyticsSourceSchema>({
    table: new GPUTable<GPUAnalyticsSourceSchema>({
      schema: {
        fields: [
          {name: 'category', format: 'uint32', nullable: false},
          {name: 'fare', format: 'float32', nullable: true},
          {name: 'distance', format: 'sint32', nullable: false}
        ],
        metadata: new Map([['dataset', 'empty-analytics']])
      },
      bufferLayout: [
        {name: 'category', format: 'uint32', byteStride: 4},
        {name: 'fare', format: 'float32', byteStride: 4},
        {name: 'distance', format: 'sint32', byteStride: 4}
      ]
    }),
    ownership: 'owned'
  });

  const reductionGraph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-empty-reductions'
  });
  const reductions = frame
    .aggregate({
      rowCount: 'count',
      totalFare: {sum: 'fare'},
      minimumFare: {min: 'fare'},
      averageFare: {mean: 'fare'},
      minimumDistance: {min: 'distance'}
    })
    .compile(reductionGraph);
  const histogramGraph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-empty-histogram'
  });
  const histogram = frame.histogram('fare', {bins: 3, domain: [0, 60]}).compile(histogramGraph);

  try {
    const commandEncoder = device.createCommandEncoder({
      id: 'gpu-dataframe-empty-analytics-encode'
    });
    reductions.encode(commandEncoder);
    histogram.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    expect(
      await readUint32Scalar(reductions.table.gpuVectors.rowCount),
      'empty count remains nonnullable zero'
    ).toBe(0);
    expect(
      await readFloat32Scalar(reductions.table.gpuVectors.totalFare),
      'empty floating sums retain zero payloads'
    ).toBe(0);
    expect(
      Boolean(Number.isNaN(await readFloat32Scalar(reductions.table.gpuVectors.minimumFare))),
      'empty floating minimum uses a NaN payload'
    ).toBe(true);
    expect(
      Boolean(Number.isNaN(await readFloat32Scalar(reductions.table.gpuVectors.averageFare))),
      'empty floating mean uses a NaN payload'
    ).toBe(true);
    expect(
      await readSignedScalar(reductions.table.gpuVectors.minimumDistance),
      'empty signed minimum uses zero payload'
    ).toBe(0);
    for (const name of ['totalFare', 'minimumFare', 'averageFare', 'minimumDistance'] as const) {
      const validity = reductions.validity[name];
      if (!validity) {
        throw new Error(`Expected empty reduction validity for ${name}`);
      }
      expect(await readUint32Scalar(validity), `${name} is explicitly invalid`).toBe(0);
    }
    expect(
      await readUint32Vector(histogram.table.gpuVectors.count),
      'empty source tables still publish deterministic zero-valued histogram bins'
    ).toEqual([0, 0, 0]);
    expect(
      histogram.selectedCounts.data,
      'empty sources retain no synthetic source batches'
    ).toEqual([]);
    expect(
      reductions.table.schema.metadata.get('dataset'),
      'scalar output schemas preserve original source metadata'
    ).toBe('empty-analytics');
  } finally {
    reductions.destroy();
    histogram.destroy();
    frame.destroy();
  }

  void 0;
});

it('GPUDataFrame bins signed, unsigned, and derived scalar values using typed GPU domains', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const fixture = createGPUAnalyticsFixture(device);
  const signedGraph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-signed-histogram'
  });
  const signed = fixture.frame
    .histogram('distance', {bins: 5, domain: [-2, 8]})
    .compile(signedGraph);
  const unsignedGraph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-unsigned-histogram'
  });
  const unsigned = fixture.frame.histogram('category', {edges: [0, 1, 2]}).compile(unsignedGraph);
  const derivedGraph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-derived-histogram'
  });
  const derived = fixture.frame
    .withColumn('adjustedFare', column('fare').add(literal(5)), {format: 'float32'})
    .histogram('adjustedFare', {bins: 4, domain: [0, 120]})
    .compile(derivedGraph);

  try {
    const commandEncoder = device.createCommandEncoder({
      id: 'gpu-dataframe-typed-histograms-encode'
    });
    signed.encode(commandEncoder);
    unsigned.encode(commandEncoder);
    derived.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    expect(
      await readUint32Vector(signed.table.gpuVectors.count),
      'signed histograms retain negative values and include the upper domain endpoint'
    ).toEqual([2, 0, 1, 1, 1]);
    expect(
      await readUint32Vector(unsigned.table.gpuVectors.count),
      'unsigned irregular histograms exclude explicit categorical nulls'
    ).toEqual([2, 2]);
    expect(
      await readUint32Vector(derived.table.gpuVectors.count),
      'histograms consume nullable derived floating-point vectors directly from the graph'
    ).toEqual([2, 1, 0, 1]);
  } finally {
    signed.destroy();
    unsigned.destroy();
    derived.destroy();
    fixture.frame.destroy();
  }

  void 0;
});

function createGPUAnalyticsFixture(device: Device): GPUAnalyticsFixture {
  const sourceBuffers: Buffer[] = [];
  const categories = [Uint32Array.from([0, 1]), new Uint32Array(0), Uint32Array.from([0, 2, 1])];
  const categoryValidity = [
    Uint32Array.from([1, 1]),
    new Uint32Array(0),
    Uint32Array.from([1, 0, 1])
  ];
  const fares = [Float32Array.from([10, 20]), new Float32Array(0), Float32Array.from([30, 99, 50])];
  const fareValidity = [Uint32Array.from([1, 1]), new Uint32Array(0), Uint32Array.from([1, 1, 0])];
  const distances = [Int32Array.from([-2, 3]), new Int32Array(0), Int32Array.from([-1, 4, 8])];
  const categoryValidityChunks: GPUData<'uint32'>[] = [];
  const fareValidityChunks: GPUData<'uint32'>[] = [];
  let sourceRowIndexOffset = 40;

  const batches = categories.map((values, batchIndex) => {
    const batch = new GPURecordBatch<GPUAnalyticsSourceSchema>({
      gpuData: {
        category: createGPUAnalyticsData(device, sourceBuffers, values, 'uint32'),
        fare: createGPUAnalyticsData(device, sourceBuffers, fares[batchIndex], 'float32'),
        distance: createGPUAnalyticsData(device, sourceBuffers, distances[batchIndex], 'sint32')
      },
      fields: [
        {name: 'category', format: 'uint32', nullable: true},
        {name: 'fare', format: 'float32', nullable: true},
        {name: 'distance', format: 'sint32', nullable: false}
      ],
      sourceInfo: {
        sourceBatchIndex: batchIndex + 4,
        sourceRowIndexOffset,
        sourceRowCount: values.length
      }
    });
    sourceRowIndexOffset += values.length;
    categoryValidityChunks.push(
      createGPUAnalyticsData(device, sourceBuffers, categoryValidity[batchIndex], 'uint32')
    );
    fareValidityChunks.push(
      createGPUAnalyticsData(device, sourceBuffers, fareValidity[batchIndex], 'uint32')
    );
    return batch;
  });

  return {
    frame: new GPUDataFrame<GPUAnalyticsSourceSchema>({
      table: new GPUTable<GPUAnalyticsSourceSchema>({batches}),
      validity: {
        category: new GPUVector<'uint32'>({
          type: 'data',
          name: 'gpu-dataframe-analytics-category-validity',
          format: 'uint32',
          data: categoryValidityChunks,
          ownsData: true
        }),
        fare: new GPUVector<'uint32'>({
          type: 'data',
          name: 'gpu-dataframe-analytics-fare-validity',
          format: 'uint32',
          data: fareValidityChunks,
          ownsData: true
        })
      },
      dictionaries: {
        category: {values: ['economy', 'standard', 'premium'], ordered: false}
      },
      ownership: 'owned'
    }),
    sourceBuffers
  };
}

function createGPUAnalyticsData<Format extends 'float32' | 'sint32' | 'uint32'>(
  device: Device,
  sourceBuffers: Buffer[],
  values: Float32Array | Int32Array | Uint32Array,
  format: Format
): GPUData<Format> {
  const buffer = device.createBuffer({
    byteLength: Math.max(values.byteLength, Uint32Array.BYTES_PER_ELEMENT),
    usage: Buffer.STORAGE | Buffer.VERTEX | Buffer.COPY_SRC | Buffer.COPY_DST,
    ...(values.byteLength > 0 ? {data: values} : {})
  });
  sourceBuffers.push(buffer);
  return new GPUData({buffer, format, length: values.length, ownsBuffer: true});
}

function getGPUAnalyticsBuffer(data: GPUData): Buffer {
  return data.buffer instanceof Buffer ? data.buffer : data.buffer.buffer;
}

async function readGPUUint32Buffer(buffer: Buffer, length: number): Promise<number[]> {
  const values = await buffer.readAsync(0, length * Uint32Array.BYTES_PER_ELEMENT);
  return Array.from(new Uint32Array(values.buffer, values.byteOffset, length));
}

async function readGPUFloat32Buffer(buffer: Buffer, length: number): Promise<number[]> {
  const values = await buffer.readAsync(0, length * Float32Array.BYTES_PER_ELEMENT);
  return Array.from(new Float32Array(values.buffer, values.byteOffset, length));
}

async function readUint32Vector(vector: GPUVector): Promise<number[]> {
  return readGPUUint32Buffer(getGPUAnalyticsBuffer(vector.data[0]), vector.length);
}

async function readUint32Scalar(vector: GPUVector): Promise<number> {
  return (await readUint32Vector(vector))[0];
}

async function readFloat32Scalar(vector: GPUVector): Promise<number> {
  return (await readGPUFloat32Buffer(getGPUAnalyticsBuffer(vector.data[0]), 1))[0];
}

async function readSignedScalar(vector: GPUVector): Promise<number> {
  const values = await getGPUAnalyticsBuffer(vector.data[0]).readAsync(
    0,
    Int32Array.BYTES_PER_ELEMENT
  );
  return new Int32Array(values.buffer, values.byteOffset, 1)[0];
}
