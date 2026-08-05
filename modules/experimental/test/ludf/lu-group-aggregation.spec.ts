// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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

type LuGroupedSourceSchema = {
  category: 'uint32';
  fare: 'float32';
  distance: 'sint32';
};

type LuGroupedFixture = {
  frame: LuDataFrame<LuGroupedSourceSchema>;
  sourceBuffers: Buffer[];
};

test('LuDataFrame groups nullable source batches into explicit dense GPU statistics', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuGroupedFixture(device);
  const createBufferSpy = vi.spyOn(device, 'createBuffer');
  const submitSpy = vi.spyOn(device, 'submit');

  const query = fixture.frame.groupBy('category').aggregate({
    count: 'count',
    totalFare: {sum: 'fare'},
    minimumFare: {min: 'fare'},
    maximumFare: {max: 'fare'},
    averageFare: {mean: 'fare'}
  });

  testContext.equal(
    createBufferSpy.mock.calls.length,
    0,
    'grouped aggregation planning never allocates GPU storage'
  );
  testContext.equal(
    submitSpy.mock.calls.length,
    0,
    'grouped aggregation planning never submits GPU work'
  );

  const graph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-nullable-dense-group-aggregation'
  });
  const compiled = query.compile(graph);

  try {
    testContext.equal(compiled.groupCount, 4, 'dictionary labels determine the dense group domain');
    testContext.deepEqual(
      compiled.table.schema.fields.map(field => field.name),
      ['category', 'count', 'totalFare', 'minimumFare', 'maximumFare', 'averageFare'],
      'grouped schema retains the dense key and requested metric ordering'
    );
    testContext.deepEqual(
      compiled.table.batches.map(batch => batch.numRows),
      [4],
      'all original source batches contribute to one dense GPU-owned result batch'
    );
    testContext.deepEqual(
      compiled.dictionaries.category,
      {values: ['economy', 'standard', 'premium', 'unused'], ordered: false},
      'grouped categorical keys retain their adapter-owned dictionary labels'
    );
    testContext.deepEqual(
      compiled.selectionMask.data.map(chunk => chunk.length),
      [2, 0, 3],
      'source selection masks preserve every original record-batch boundary'
    );

    fixture.frame.destroy();
    testContext.ok(
      fixture.sourceBuffers.every(buffer => !buffer.destroyed),
      'compiled grouped queries retain their owned source lease'
    );

    const commandEncoder = device.createCommandEncoder({id: 'ludf-dense-group-encode'});
    compiled.encode(commandEncoder);
    testContext.equal(
      submitSpy.mock.calls.length,
      0,
      'grouped aggregation encodes work into the caller-owned command encoder'
    );
    device.submit(commandEncoder.finish());

    testContext.deepEqual(
      await readUint32VectorChunks(compiled.table.gpuVectors.category),
      [[0, 1, 2, 3]],
      'dense grouped rows publish stable unsigned categorical keys'
    );
    testContext.deepEqual(
      await readUint32VectorChunks(compiled.table.gpuVectors.count),
      [[2, 2, 0, 0]],
      'group counts reject null keys but include rows with null metric values'
    );
    testContext.deepEqual(
      await readFloat32VectorChunks(compiled.table.gpuVectors.totalFare),
      [[40, 20, 0, 0]],
      'group sums exclude null keys and values across all source batches'
    );
    testContext.deepEqual(
      await readFloat32VectorChunks(compiled.table.gpuVectors.minimumFare),
      [[10, 20, NaN, NaN]],
      'group minimums publish NaN payloads for empty categories'
    );
    testContext.deepEqual(
      await readFloat32VectorChunks(compiled.table.gpuVectors.maximumFare),
      [[30, 20, NaN, NaN]],
      'group maximums publish NaN payloads for empty categories'
    );
    testContext.deepEqual(
      await readFloat32VectorChunks(compiled.table.gpuVectors.averageFare),
      [[20, 20, NaN, NaN]],
      'group means divide only finite, non-null source values'
    );

    for (const metricName of ['totalFare', 'minimumFare', 'maximumFare', 'averageFare'] as const) {
      const validity = compiled.validity[metricName];
      if (!validity) {
        throw new Error(`Expected explicit GPU group validity for ${metricName}`);
      }
      testContext.deepEqual(
        await readUint32VectorChunks(validity),
        [[1, 1, 0, 0]],
        `${metricName} distinguishes populated groups from empty or entirely null groups`
      );
    }
    testContext.equal(compiled.validity.count, undefined, 'dense count columns are never nullable');

    const groupedBuffers = Object.values(compiled.table.gpuVectors).flatMap(vector =>
      vector.data.map(getGPUDataBuffer)
    );
    const validityBuffers = Array.from(
      new Set(
        Object.values(compiled.validity).flatMap(vector =>
          vector ? vector.data.map(getGPUDataBuffer) : []
        )
      )
    );
    compiled.destroy();
    testContext.ok(
      groupedBuffers.every(buffer => buffer.destroyed),
      'grouped results release every owned dense value buffer'
    );
    testContext.ok(
      validityBuffers.every(buffer => buffer.destroyed),
      'grouped results release shared statistic-validity buffers exactly once'
    );
    testContext.ok(
      fixture.sourceBuffers.every(buffer => buffer.destroyed),
      'owned source buffers survive until the final grouped lease is destroyed'
    );
  } finally {
    compiled.destroy();
    fixture.frame.destroy();
    createBufferSpy.mockRestore();
    submitSpy.mockRestore();
  }

  testContext.end();
});

test('LuDataFrame reuses filtered grouped aggregations with encoder-ordered parameters', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuGroupedFixture(device);
  const graph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-parameterized-group-aggregation'
  });
  const compiled = fixture.frame
    .filter(column('fare').greaterThan(parameter('minimumFare', 0)))
    .groupBy('category')
    .aggregate({count: 'count', totalFare: {sum: 'fare'}})
    .compile(graph);

  const firstCount = device.createBuffer({
    id: 'ludf-first-group-count',
    byteLength: 4 * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.COPY_DST | Buffer.COPY_SRC
  });
  const firstTotal = device.createBuffer({
    id: 'ludf-first-group-total',
    byteLength: 4 * Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.COPY_DST | Buffer.COPY_SRC
  });

  try {
    const commandEncoder = device.createCommandEncoder({id: 'ludf-two-group-encodes'});
    compiled.encode(commandEncoder, {minimumFare: 15});
    commandEncoder.copyBufferToBuffer({
      sourceBuffer: getGPUDataBuffer(compiled.table.gpuVectors.count.data[0]),
      destinationBuffer: firstCount,
      size: 4 * Uint32Array.BYTES_PER_ELEMENT
    });
    commandEncoder.copyBufferToBuffer({
      sourceBuffer: getGPUDataBuffer(compiled.table.gpuVectors.totalFare.data[0]),
      destinationBuffer: firstTotal,
      size: 4 * Float32Array.BYTES_PER_ELEMENT
    });
    compiled.encode(commandEncoder, {minimumFare: 25});
    device.submit(commandEncoder.finish());

    testContext.deepEqual(
      await readUint32Buffer(firstCount, 4),
      [1, 1, 0, 0],
      'the first encoding preserves its own filtered dense group counts'
    );
    testContext.deepEqual(
      await readFloat32Buffer(firstTotal, 4),
      [30, 20, 0, 0],
      'the first encoding snapshots grouped sums before the parameter changes'
    );
    testContext.deepEqual(
      await readUint32VectorChunks(compiled.table.gpuVectors.count),
      [[1, 0, 0, 0]],
      'the second encoding reuses the graph with a stricter selection threshold'
    );
    testContext.deepEqual(
      await readFloat32VectorChunks(compiled.table.gpuVectors.totalFare),
      [[30, 0, 0, 0]],
      'grouped statistic kernels observe encoder-ordered parameter uploads'
    );

    const validity = compiled.validity.totalFare;
    if (!validity) {
      throw new Error('Expected nullable grouped total validity');
    }
    testContext.deepEqual(
      await readUint32VectorChunks(validity),
      [[1, 0, 0, 0]],
      'group validity is recomputed when dynamic filter parameters change'
    );
  } finally {
    firstCount.destroy();
    firstTotal.destroy();
    compiled.destroy();
    fixture.frame.destroy();
  }

  testContext.end();
});

test('LuDataFrame groups chained nullable derived values without materializing hidden sources', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuGroupedFixture(device);
  const graph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-derived-group-aggregation'
  });
  const compiled = fixture.frame
    .withColumn('doubleFare', column('fare').multiply(literal(2)), {format: 'float32'})
    .groupBy('category')
    .aggregate({count: 'count', totalFare: {sum: 'doubleFare'}, averageFare: {mean: 'doubleFare'}})
    .compile(graph);

  try {
    const commandEncoder = device.createCommandEncoder({id: 'ludf-derived-group-encode'});
    compiled.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    testContext.deepEqual(
      compiled.table.schema.fields.map(field => field.name),
      ['category', 'count', 'totalFare', 'averageFare'],
      'derived grouping publishes only the key and requested aggregate aliases'
    );
    testContext.deepEqual(
      await readFloat32VectorChunks(compiled.table.gpuVectors.totalFare),
      [[80, 40, 0, 0]],
      'GPU grouping consumes nullable derived values across preserved source batches'
    );
    testContext.deepEqual(
      await readFloat32VectorChunks(compiled.table.gpuVectors.averageFare),
      [[40, 40, NaN, NaN]],
      'derived group means retain empty-group payload semantics'
    );

    const validity = compiled.validity.totalFare;
    if (!validity) {
      throw new Error('Expected derived group validity');
    }
    testContext.deepEqual(
      await readUint32VectorChunks(validity),
      [[1, 1, 0, 0]],
      'nullable derived source sidecars propagate into dense grouped validity'
    );
  } finally {
    compiled.destroy();
    fixture.frame.destroy();
  }

  testContext.end();
});

test('LuDataFrame excludes nonfinite metric values without changing categorical row counts', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuGroupedFixture(device);
  const fare = fixture.frame.table.gpuVectors.fare;
  getGPUDataBuffer(fare.data[0]).write(Float32Array.from([10, Number.NaN]));
  getGPUDataBuffer(fare.data[2]).write(Float32Array.from([Number.POSITIVE_INFINITY, 99, 50]));

  const graph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-nonfinite-group-aggregation'
  });
  const compiled = fixture.frame
    .groupBy('category')
    .aggregate({
      count: 'count',
      totalFare: {sum: 'fare'},
      minimumFare: {min: 'fare'},
      averageFare: {mean: 'fare'}
    })
    .compile(graph);

  try {
    const commandEncoder = device.createCommandEncoder({id: 'ludf-nonfinite-group-encode'});
    compiled.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    testContext.deepEqual(
      await readUint32VectorChunks(compiled.table.gpuVectors.count),
      [[2, 2, 0, 0]],
      'categorical count excludes only invalid group keys, not NaN or infinite metric values'
    );
    testContext.deepEqual(
      await readFloat32VectorChunks(compiled.table.gpuVectors.totalFare),
      [[10, 0, 0, 0]],
      'floating-point group sums discard NaN, infinity, and explicit null values'
    );
    testContext.deepEqual(
      await readFloat32VectorChunks(compiled.table.gpuVectors.minimumFare),
      [[10, NaN, NaN, NaN]],
      'groups with only nonfinite contributions retain invalid minimum payloads'
    );
    testContext.deepEqual(
      await readFloat32VectorChunks(compiled.table.gpuVectors.averageFare),
      [[10, NaN, NaN, NaN]],
      'floating-point means divide only finite and explicitly valid contributions'
    );

    for (const name of ['totalFare', 'minimumFare', 'averageFare'] as const) {
      const validity = compiled.validity[name];
      if (!validity) {
        throw new Error(`Expected explicit finite-value group validity for ${name}`);
      }
      testContext.deepEqual(
        await readUint32VectorChunks(validity),
        [[1, 0, 0, 0]],
        `${name} excludes categories populated only by NaN, infinity, or null values`
      );
    }
  } finally {
    compiled.destroy();
    fixture.frame.destroy();
  }

  testContext.end();
});

test('LuDataFrame initializes dictionary groups when source tables have no record batches', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const frame = new LuDataFrame<LuGroupedSourceSchema>({
    table: new GPUTable<LuGroupedSourceSchema>({
      schema: {
        fields: [
          {name: 'category', format: 'uint32', nullable: false},
          {name: 'fare', format: 'float32', nullable: true},
          {name: 'distance', format: 'sint32', nullable: false}
        ],
        metadata: new Map([['dataset', 'empty-groups']])
      },
      bufferLayout: [
        {name: 'category', format: 'uint32', byteStride: 4},
        {name: 'fare', format: 'float32', byteStride: 4},
        {name: 'distance', format: 'sint32', byteStride: 4}
      ]
    }),
    dictionaries: {
      category: {values: ['economy', 'standard', 'premium'], ordered: false}
    },
    ownership: 'owned'
  });
  const graph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-schema-only-group-aggregation'
  });
  const compiled = frame
    .groupBy('category')
    .aggregate({count: 'count', totalFare: {sum: 'fare'}, averageFare: {mean: 'fare'}})
    .compile(graph);

  try {
    const commandEncoder = device.createCommandEncoder({id: 'ludf-empty-group-encode'});
    compiled.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    testContext.deepEqual(
      compiled.table.batches.map(batch => batch.numRows),
      [3],
      'schema-only sources still publish one dense categorical result batch'
    );
    testContext.deepEqual(
      await readUint32VectorChunks(compiled.table.gpuVectors.category),
      [[0, 1, 2]],
      'empty source tables initialize every dictionary group key'
    );
    testContext.deepEqual(
      await readUint32VectorChunks(compiled.table.gpuVectors.count),
      [[0, 0, 0]],
      'empty source tables publish deterministic zero group counts'
    );
    testContext.deepEqual(
      await readFloat32VectorChunks(compiled.table.gpuVectors.totalFare),
      [[0, 0, 0]],
      'empty source groups retain zero sum payloads'
    );
    testContext.deepEqual(
      await readFloat32VectorChunks(compiled.table.gpuVectors.averageFare),
      [[NaN, NaN, NaN]],
      'empty source groups retain NaN mean payloads'
    );
    for (const name of ['totalFare', 'averageFare'] as const) {
      const validity = compiled.validity[name];
      if (!validity) {
        throw new Error(`Expected explicit empty group validity for ${name}`);
      }
      testContext.deepEqual(
        await readUint32VectorChunks(validity),
        [[0, 0, 0]],
        `${name} marks every schema-only source group invalid`
      );
    }
    testContext.deepEqual(
      compiled.selectedCounts.data,
      [],
      'schema-only grouping does not invent source selection batches'
    );
    testContext.equal(
      compiled.table.schema.metadata.get('dataset'),
      'empty-groups',
      'dense grouped schemas retain independent source metadata'
    );
  } finally {
    compiled.destroy();
    frame.destroy();
  }

  testContext.end();
});

function createLuGroupedFixture(device: Device): LuGroupedFixture {
  const sourceBuffers: Buffer[] = [];
  const categoryValues = [
    Uint32Array.from([0, 1]),
    new Uint32Array(0),
    Uint32Array.from([0, 2, 1])
  ];
  const categoryValidityValues = [
    Uint32Array.from([1, 1]),
    new Uint32Array(0),
    Uint32Array.from([1, 0, 1])
  ];
  const fareValues = [
    Float32Array.from([10, 20]),
    new Float32Array(0),
    Float32Array.from([30, 99, 50])
  ];
  const fareValidityValues = [
    Uint32Array.from([1, 1]),
    new Uint32Array(0),
    Uint32Array.from([1, 1, 0])
  ];
  const distanceValues = [Int32Array.from([-2, 3]), new Int32Array(0), Int32Array.from([-1, 4, 8])];
  const categoryValidityChunks: GPUData<'uint32'>[] = [];
  const fareValidityChunks: GPUData<'uint32'>[] = [];
  let sourceRowIndexOffset = 40;

  const batches = categoryValues.map((values, batchIndex) => {
    const batch = new GPURecordBatch<LuGroupedSourceSchema>({
      gpuData: {
        category: createLuGroupedData(device, sourceBuffers, values, 'uint32'),
        fare: createLuGroupedData(device, sourceBuffers, fareValues[batchIndex], 'float32'),
        distance: createLuGroupedData(device, sourceBuffers, distanceValues[batchIndex], 'sint32')
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
      createLuGroupedData(device, sourceBuffers, categoryValidityValues[batchIndex], 'uint32')
    );
    fareValidityChunks.push(
      createLuGroupedData(device, sourceBuffers, fareValidityValues[batchIndex], 'uint32')
    );
    return batch;
  });

  return {
    frame: new LuDataFrame<LuGroupedSourceSchema>({
      table: new GPUTable<LuGroupedSourceSchema>({batches}),
      validity: {
        category: new GPUVector<'uint32'>({
          type: 'data',
          name: 'ludf-group-category-validity',
          format: 'uint32',
          data: categoryValidityChunks,
          ownsData: true
        }),
        fare: new GPUVector<'uint32'>({
          type: 'data',
          name: 'ludf-group-fare-validity',
          format: 'uint32',
          data: fareValidityChunks,
          ownsData: true
        })
      },
      dictionaries: {
        category: {values: ['economy', 'standard', 'premium', 'unused'], ordered: false}
      },
      ownership: 'owned'
    }),
    sourceBuffers
  };
}

function createLuGroupedData<Format extends 'float32' | 'sint32' | 'uint32'>(
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

function getGPUDataBuffer(data: GPUData): Buffer {
  return data.buffer instanceof Buffer ? data.buffer : data.buffer.buffer;
}

async function readUint32Buffer(buffer: Buffer, length: number): Promise<number[]> {
  if (length === 0) {
    return [];
  }
  const values = await buffer.readAsync(0, length * Uint32Array.BYTES_PER_ELEMENT);
  return Array.from(new Uint32Array(values.buffer, values.byteOffset, length));
}

async function readFloat32Buffer(buffer: Buffer, length: number): Promise<number[]> {
  if (length === 0) {
    return [];
  }
  const values = await buffer.readAsync(0, length * Float32Array.BYTES_PER_ELEMENT);
  return Array.from(new Float32Array(values.buffer, values.byteOffset, length));
}

async function readUint32VectorChunks(vector: GPUVector): Promise<number[][]> {
  return Promise.all(
    vector.data.map(chunk => readUint32Buffer(getGPUDataBuffer(chunk), chunk.length))
  );
}

async function readFloat32VectorChunks(vector: GPUVector): Promise<number[][]> {
  return Promise.all(
    vector.data.map(chunk => readFloat32Buffer(getGPUDataBuffer(chunk), chunk.length))
  );
}
