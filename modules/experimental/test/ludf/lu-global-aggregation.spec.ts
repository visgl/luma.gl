// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/experimental';
import {
  LuDataFrame,
  column,
  literal,
  parameter,
  type LuDataFrameQueryParameters
} from '@luma.gl/experimental/ludf';
import {GPUData, GPURecordBatch, GPUTable, GPUVector} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';
import {vi} from 'vitest';

type LuAnalyticsSourceSchema = {
  category: 'uint32';
  fare: 'float32';
  distance: 'sint32';
};

type LuAnalyticsFixture = {
  frame: LuDataFrame<LuAnalyticsSourceSchema>;
  sourceBuffers: Buffer[];
};

test('LuDataFrame reduces nullable scalar GPU vectors without flattening source batches', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuAnalyticsFixture(device);
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

  testContext.equal(
    createBufferSpy.mock.calls.length,
    0,
    'immutable global-aggregation planning allocates no GPU storage'
  );
  testContext.equal(
    submitSpy.mock.calls.length,
    0,
    'immutable global-aggregation planning submits no GPU commands'
  );

  const graph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-global-nullable-aggregation'
  });
  const compiled = query.compile(graph);

  try {
    testContext.deepEqual(
      compiled.table.batches.map(batch => batch.numRows),
      [1],
      'global GPU reductions publish exactly one owned result row'
    );
    testContext.deepEqual(
      compiled.table.schema.fields.map(field => ({name: field.name, format: field.format})),
      [
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
      ],
      'sum/min/max preserve scalar formats while means and counts use float32 and uint32'
    );
    testContext.deepEqual(
      compiled.selectionMask.data.map(chunk => chunk.length),
      [2, 0, 3],
      'global reductions retain independent source selection batches'
    );

    fixture.frame.destroy();
    testContext.ok(
      fixture.sourceBuffers.every(buffer => !buffer.destroyed),
      'global reductions retain their original owned source lease'
    );

    const commandEncoder = device.createCommandEncoder({id: 'ludf-global-reduction-encode'});
    compiled.encode(commandEncoder);
    testContext.equal(
      submitSpy.mock.calls.length,
      0,
      'global aggregation only records work into a caller-owned command encoder'
    );
    device.submit(commandEncoder.finish());

    testContext.equal(
      await readUint32Scalar(compiled.table.gpuVectors.rowCount),
      5,
      'global count includes every selected source row, independent of column nulls'
    );
    testContext.equal(
      await readFloat32Scalar(compiled.table.gpuVectors.totalFare),
      159,
      'floating-point sums exclude explicit nullable rows across preserved batches'
    );
    testContext.equal(
      await readFloat32Scalar(compiled.table.gpuVectors.minimumFare),
      10,
      'floating-point minimums exclude explicit null rows'
    );
    testContext.equal(
      await readFloat32Scalar(compiled.table.gpuVectors.maximumFare),
      99,
      'global maximums include valid rows regardless of other columns nullability'
    );
    testContext.equal(
      await readFloat32Scalar(compiled.table.gpuVectors.averageFare),
      39.75,
      'floating-point means divide only accepted non-null contributions'
    );
    testContext.equal(
      await readSignedScalar(compiled.table.gpuVectors.totalDistance),
      12,
      'signed integer sums preserve native 32-bit output formats'
    );
    testContext.equal(
      await readSignedScalar(compiled.table.gpuVectors.minimumDistance),
      -2,
      'signed minimums preserve negative input values'
    );
    testContext.ok(
      Math.abs((await readFloat32Scalar(compiled.table.gpuVectors.averageDistance)) - 2.4) <
        0.000001,
      'signed scalar means convert contributions to float32 before averaging'
    );
    testContext.equal(
      await readUint32Scalar(compiled.table.gpuVectors.maximumCategory),
      1,
      'unsigned maximums reject null category values'
    );
    testContext.equal(
      await readUint32Scalar(compiled.table.gpuVectors.totalCategory),
      2,
      'unsigned sums exclude the nullable category sidecar'
    );
    testContext.equal(
      await readFloat32Scalar(compiled.table.gpuVectors.averageCategory),
      0.5,
      'unsigned nullable scalar means divide only accepted categorical values'
    );
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
      testContext.equal(await readUint32Scalar(validity), 1, `${metric} has valid contributions`);
    }
    testContext.equal(compiled.validity.rowCount, undefined, 'global row counts are nonnullable');

    const outputBuffers = Object.values(compiled.table.gpuVectors).flatMap(vector =>
      vector.data.map(getLuAnalyticsBuffer)
    );
    compiled.destroy();
    testContext.ok(
      outputBuffers.every(buffer => buffer.destroyed),
      'compiled global reductions release their owned scalar result buffers'
    );
    testContext.ok(
      fixture.sourceBuffers.every(buffer => buffer.destroyed),
      'owned source resources release only after their final aggregation lease'
    );
  } finally {
    compiled.destroy();
    fixture.frame.destroy();
    createBufferSpy.mockRestore();
    submitSpy.mockRestore();
  }

  testContext.end();
});

test('LuDataFrame updates filtered and derived global statistics within one command encoder', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuAnalyticsFixture(device);
  const graph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-filtered-derived-reduction'
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
    id: 'ludf-global-first-count',
    byteLength: Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.COPY_SRC | Buffer.COPY_DST
  });
  const firstSum = device.createBuffer({
    id: 'ludf-global-first-sum',
    byteLength: Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.COPY_SRC | Buffer.COPY_DST
  });

  try {
    const commandEncoder = device.createCommandEncoder({id: 'ludf-global-two-encodes'});
    compiled.encode(commandEncoder, {minimumFare: 20});
    commandEncoder.copyBufferToBuffer({
      sourceBuffer: getLuAnalyticsBuffer(compiled.table.gpuVectors.rowCount.data[0]),
      destinationBuffer: firstCount,
      size: Uint32Array.BYTES_PER_ELEMENT
    });
    commandEncoder.copyBufferToBuffer({
      sourceBuffer: getLuAnalyticsBuffer(compiled.table.gpuVectors.totalFare.data[0]),
      destinationBuffer: firstSum,
      size: Float32Array.BYTES_PER_ELEMENT
    });
    compiled.encode(commandEncoder, {minimumFare: 40});
    device.submit(commandEncoder.finish());

    testContext.equal(
      (await readLuUint32Buffer(firstCount, 1))[0],
      3,
      'first filter accepts three rows'
    );
    testContext.equal(
      (await readLuFloat32Buffer(firstSum, 1))[0],
      164,
      'first derived sum is 25 + 35 + 104'
    );
    testContext.equal(
      await readUint32Scalar(compiled.table.gpuVectors.rowCount),
      1,
      'the second encoder state accepts only the valid fare above forty'
    );
    testContext.equal(
      await readFloat32Scalar(compiled.table.gpuVectors.totalFare),
      104,
      'global reductions observe encoder-ordered derived parameter updates'
    );
    testContext.equal(
      await readFloat32Scalar(compiled.table.gpuVectors.averageFare),
      104,
      'global mean follows the second filtered contribution count'
    );
  } finally {
    firstCount.destroy();
    firstSum.destroy();
    compiled.destroy();
    fixture.frame.destroy();
  }

  testContext.end();
});

test('LuDataFrame drops NaN and infinity from scalar statistics without dropping row counts', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuAnalyticsFixture(device);
  const fare = fixture.frame.table.gpuVectors.fare;
  getLuAnalyticsBuffer(fare.data[0]).write(Float32Array.from([10, Number.NaN]));
  getLuAnalyticsBuffer(fare.data[2]).write(Float32Array.from([Number.POSITIVE_INFINITY, 99, 50]));

  const graph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-nonfinite-reduction'
  });
  const compiled = fixture.frame
    .aggregate({rowCount: 'count', totalFare: {sum: 'fare'}, averageFare: {mean: 'fare'}})
    .compile(graph);

  try {
    const commandEncoder = device.createCommandEncoder({id: 'ludf-nonfinite-reduction-encode'});
    compiled.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    testContext.equal(
      await readUint32Scalar(compiled.table.gpuVectors.rowCount),
      5,
      'NaN rows remain counted'
    );
    testContext.equal(
      await readFloat32Scalar(compiled.table.gpuVectors.totalFare),
      109,
      'NaN and infinity do not poison floating sums'
    );
    testContext.equal(
      await readFloat32Scalar(compiled.table.gpuVectors.averageFare),
      54.5,
      'means count finite 10 and 99 only'
    );
  } finally {
    compiled.destroy();
    fixture.frame.destroy();
  }

  testContext.end();
});

test('LuDataFrame builds nullable, filtered numeric histograms with literal domains and edges', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuAnalyticsFixture(device);
  const createBufferSpy = vi.spyOn(device, 'createBuffer');
  const domainQuery = fixture.frame.histogram('fare', {bins: 4, domain: [0, 80]});
  testContext.equal(
    createBufferSpy.mock.calls.length,
    0,
    'histogram planning does not allocate buffers'
  );
  createBufferSpy.mockRestore();

  const domainGraph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-domain-histogram'
  });
  const domainHistogram = domainQuery.compile(domainGraph);
  const edgeGraph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-irregular-histogram'
  });
  const edgeHistogram = fixture.frame
    .histogram('fare', {edges: [0, 15, 25, 40, 100]})
    .compile(edgeGraph);
  const filteredGraph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-filtered-histogram'
  });
  const filteredHistogram = fixture.frame
    .filter(column('category').isValid())
    .histogram('fare', {bins: 4, domain: [0, 80]})
    .compile(filteredGraph);

  try {
    const commandEncoder = device.createCommandEncoder({id: 'ludf-histograms-encode'});
    domainHistogram.encode(commandEncoder);
    edgeHistogram.encode(commandEncoder);
    filteredHistogram.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    testContext.equal(domainHistogram.binCount, 4, 'equal-width histogram exposes its bin count');
    testContext.deepEqual(domainHistogram.domain, [0, 80], 'equal-width domain remains explicit');
    testContext.deepEqual(
      edgeHistogram.edges,
      [0, 15, 25, 40, 100],
      'irregular boundaries remain explicit'
    );
    testContext.deepEqual(
      await readUint32Vector(domainHistogram.table.gpuVectors.bin),
      [0, 1, 2, 3],
      'histogram output publishes dense GPU-written bin identities'
    );
    testContext.deepEqual(
      await readUint32Vector(domainHistogram.table.gpuVectors.count),
      [1, 2, 0, 0],
      'equal-width histogram excludes null and out-of-domain values'
    );
    testContext.deepEqual(
      await readUint32Vector(edgeHistogram.table.gpuVectors.count),
      [1, 1, 1, 1],
      'irregular histogram bins retain explicit nullable semantics'
    );
    testContext.deepEqual(
      await readUint32Vector(filteredHistogram.table.gpuVectors.count),
      [1, 2, 0, 0],
      'histogram selection masks combine filters with independent value validity'
    );
    testContext.deepEqual(
      filteredHistogram.selectionMask.data.map(chunk => chunk.length),
      [2, 0, 3],
      'histogram source masks retain every original batch boundary'
    );
  } finally {
    domainHistogram.destroy();
    edgeHistogram.destroy();
    filteredHistogram.destroy();
    fixture.frame.destroy();
  }

  testContext.end();
});

test('LuDataFrame retains explicit invalid scalar outputs and zero histograms for empty inputs', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const frame = new LuDataFrame<LuAnalyticsSourceSchema>({
    table: new GPUTable<LuAnalyticsSourceSchema>({
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

  const reductionGraph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-empty-reductions'
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
  const histogramGraph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-empty-histogram'
  });
  const histogram = frame.histogram('fare', {bins: 3, domain: [0, 60]}).compile(histogramGraph);

  try {
    const commandEncoder = device.createCommandEncoder({id: 'ludf-empty-analytics-encode'});
    reductions.encode(commandEncoder);
    histogram.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    testContext.equal(
      await readUint32Scalar(reductions.table.gpuVectors.rowCount),
      0,
      'empty count remains nonnullable zero'
    );
    testContext.equal(
      await readFloat32Scalar(reductions.table.gpuVectors.totalFare),
      0,
      'empty floating sums retain zero payloads'
    );
    testContext.ok(
      Number.isNaN(await readFloat32Scalar(reductions.table.gpuVectors.minimumFare)),
      'empty floating minimum uses a NaN payload'
    );
    testContext.ok(
      Number.isNaN(await readFloat32Scalar(reductions.table.gpuVectors.averageFare)),
      'empty floating mean uses a NaN payload'
    );
    testContext.equal(
      await readSignedScalar(reductions.table.gpuVectors.minimumDistance),
      0,
      'empty signed minimum uses zero payload'
    );
    for (const name of ['totalFare', 'minimumFare', 'averageFare', 'minimumDistance'] as const) {
      const validity = reductions.validity[name];
      if (!validity) {
        throw new Error(`Expected empty reduction validity for ${name}`);
      }
      testContext.equal(await readUint32Scalar(validity), 0, `${name} is explicitly invalid`);
    }
    testContext.deepEqual(
      await readUint32Vector(histogram.table.gpuVectors.count),
      [0, 0, 0],
      'empty source tables still publish deterministic zero-valued histogram bins'
    );
    testContext.deepEqual(
      histogram.selectedCounts.data,
      [],
      'empty sources retain no synthetic source batches'
    );
    testContext.equal(
      reductions.table.schema.metadata.get('dataset'),
      'empty-analytics',
      'scalar output schemas preserve original source metadata'
    );
  } finally {
    reductions.destroy();
    histogram.destroy();
    frame.destroy();
  }

  testContext.end();
});

test('LuDataFrame bins signed, unsigned, and derived scalar values using typed GPU domains', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuAnalyticsFixture(device);
  const signedGraph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-signed-histogram'
  });
  const signed = fixture.frame
    .histogram('distance', {bins: 5, domain: [-2, 8]})
    .compile(signedGraph);
  const unsignedGraph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-unsigned-histogram'
  });
  const unsigned = fixture.frame.histogram('category', {edges: [0, 1, 2]}).compile(unsignedGraph);
  const derivedGraph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-derived-histogram'
  });
  const derived = fixture.frame
    .withColumn('adjustedFare', column('fare').add(literal(5)), {format: 'float32'})
    .histogram('adjustedFare', {bins: 4, domain: [0, 120]})
    .compile(derivedGraph);

  try {
    const commandEncoder = device.createCommandEncoder({id: 'ludf-typed-histograms-encode'});
    signed.encode(commandEncoder);
    unsigned.encode(commandEncoder);
    derived.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    testContext.deepEqual(
      await readUint32Vector(signed.table.gpuVectors.count),
      [2, 0, 1, 1, 1],
      'signed histograms retain negative values and include the upper domain endpoint'
    );
    testContext.deepEqual(
      await readUint32Vector(unsigned.table.gpuVectors.count),
      [2, 2],
      'unsigned irregular histograms exclude explicit categorical nulls'
    );
    testContext.deepEqual(
      await readUint32Vector(derived.table.gpuVectors.count),
      [2, 1, 0, 1],
      'histograms consume nullable derived floating-point vectors directly from the graph'
    );
  } finally {
    signed.destroy();
    unsigned.destroy();
    derived.destroy();
    fixture.frame.destroy();
  }

  testContext.end();
});

function createLuAnalyticsFixture(device: Device): LuAnalyticsFixture {
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
    const batch = new GPURecordBatch<LuAnalyticsSourceSchema>({
      gpuData: {
        category: createLuAnalyticsData(device, sourceBuffers, values, 'uint32'),
        fare: createLuAnalyticsData(device, sourceBuffers, fares[batchIndex], 'float32'),
        distance: createLuAnalyticsData(device, sourceBuffers, distances[batchIndex], 'sint32')
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
      createLuAnalyticsData(device, sourceBuffers, categoryValidity[batchIndex], 'uint32')
    );
    fareValidityChunks.push(
      createLuAnalyticsData(device, sourceBuffers, fareValidity[batchIndex], 'uint32')
    );
    return batch;
  });

  return {
    frame: new LuDataFrame<LuAnalyticsSourceSchema>({
      table: new GPUTable<LuAnalyticsSourceSchema>({batches}),
      validity: {
        category: new GPUVector<'uint32'>({
          type: 'data',
          name: 'ludf-analytics-category-validity',
          format: 'uint32',
          data: categoryValidityChunks,
          ownsData: true
        }),
        fare: new GPUVector<'uint32'>({
          type: 'data',
          name: 'ludf-analytics-fare-validity',
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

function createLuAnalyticsData<Format extends 'float32' | 'sint32' | 'uint32'>(
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

function getLuAnalyticsBuffer(data: GPUData): Buffer {
  return data.buffer instanceof Buffer ? data.buffer : data.buffer.buffer;
}

async function readLuUint32Buffer(buffer: Buffer, length: number): Promise<number[]> {
  const values = await buffer.readAsync(0, length * Uint32Array.BYTES_PER_ELEMENT);
  return Array.from(new Uint32Array(values.buffer, values.byteOffset, length));
}

async function readLuFloat32Buffer(buffer: Buffer, length: number): Promise<number[]> {
  const values = await buffer.readAsync(0, length * Float32Array.BYTES_PER_ELEMENT);
  return Array.from(new Float32Array(values.buffer, values.byteOffset, length));
}

async function readUint32Vector(vector: GPUVector): Promise<number[]> {
  return readLuUint32Buffer(getLuAnalyticsBuffer(vector.data[0]), vector.length);
}

async function readUint32Scalar(vector: GPUVector): Promise<number> {
  return (await readUint32Vector(vector))[0];
}

async function readFloat32Scalar(vector: GPUVector): Promise<number> {
  return (await readLuFloat32Buffer(getLuAnalyticsBuffer(vector.data[0]), 1))[0];
}

async function readSignedScalar(vector: GPUVector): Promise<number> {
  const values = await getLuAnalyticsBuffer(vector.data[0]).readAsync(
    0,
    Int32Array.BYTES_PER_ELEMENT
  );
  return new Int32Array(values.buffer, values.byteOffset, 1)[0];
}
