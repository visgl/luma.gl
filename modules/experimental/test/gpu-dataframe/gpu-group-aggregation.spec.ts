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

type GPUGroupedSourceSchema = {
  category: 'uint32';
  fare: 'float32';
  distance: 'sint32';
};

type GPUGroupedFixture = {
  frame: GPUDataFrame<GPUGroupedSourceSchema>;
  sourceBuffers: Buffer[];
};

it('GPUDataFrame groups nullable source batches into explicit dense GPU statistics', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const fixture = createGPUGroupedFixture(device);
  const createBufferSpy = vi.spyOn(device, 'createBuffer');
  const submitSpy = vi.spyOn(device, 'submit');

  const query = fixture.frame.groupBy('category').aggregate({
    count: 'count',
    totalFare: {sum: 'fare'},
    minimumFare: {min: 'fare'},
    maximumFare: {max: 'fare'},
    averageFare: {mean: 'fare'}
  });

  expect(
    createBufferSpy.mock.calls.length,
    'grouped aggregation planning never allocates GPU storage'
  ).toBe(0);
  expect(submitSpy.mock.calls.length, 'grouped aggregation planning never submits GPU work').toBe(
    0
  );

  const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-nullable-dense-group-aggregation'
  });
  const compiled = query.compile(graph);

  try {
    expect(compiled.groupCount, 'dictionary labels determine the dense group domain').toBe(4);
    expect(
      compiled.table.schema.fields.map(field => field.name),
      'grouped schema retains the dense key and requested metric ordering'
    ).toEqual(['category', 'count', 'totalFare', 'minimumFare', 'maximumFare', 'averageFare']);
    expect(
      compiled.table.batches.map(batch => batch.numRows),
      'all original source batches contribute to one dense GPU-owned result batch'
    ).toEqual([4]);
    expect(
      compiled.dictionaries.category,
      'grouped categorical keys retain their adapter-owned dictionary labels'
    ).toEqual({values: ['economy', 'standard', 'premium', 'unused'], ordered: false});
    expect(
      compiled.selectionMask.data.map(chunk => chunk.length),
      'source selection masks preserve every original record-batch boundary'
    ).toEqual([2, 0, 3]);

    fixture.frame.destroy();
    expect(
      Boolean(fixture.sourceBuffers.every(buffer => !buffer.destroyed)),
      'compiled grouped queries retain their owned source lease'
    ).toBe(true);

    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-dense-group-encode'});
    compiled.encode(commandEncoder);
    expect(
      submitSpy.mock.calls.length,
      'grouped aggregation encodes work into the caller-owned command encoder'
    ).toBe(0);
    device.submit(commandEncoder.finish());

    expect(
      await readUint32VectorChunks(compiled.table.gpuVectors.category),
      'dense grouped rows publish stable unsigned categorical keys'
    ).toEqual([[0, 1, 2, 3]]);
    expect(
      await readUint32VectorChunks(compiled.table.gpuVectors.count),
      'group counts reject null keys but include rows with null metric values'
    ).toEqual([[2, 2, 0, 0]]);
    expect(
      await readFloat32VectorChunks(compiled.table.gpuVectors.totalFare),
      'group sums exclude null keys and values across all source batches'
    ).toEqual([[40, 20, 0, 0]]);
    expect(
      await readFloat32VectorChunks(compiled.table.gpuVectors.minimumFare),
      'group minimums publish NaN payloads for empty categories'
    ).toEqual([[10, 20, NaN, NaN]]);
    expect(
      await readFloat32VectorChunks(compiled.table.gpuVectors.maximumFare),
      'group maximums publish NaN payloads for empty categories'
    ).toEqual([[30, 20, NaN, NaN]]);
    expect(
      await readFloat32VectorChunks(compiled.table.gpuVectors.averageFare),
      'group means divide only finite, non-null source values'
    ).toEqual([[20, 20, NaN, NaN]]);

    for (const metricName of ['totalFare', 'minimumFare', 'maximumFare', 'averageFare'] as const) {
      const validity = compiled.validity[metricName];
      if (!validity) {
        throw new Error(`Expected explicit GPU group validity for ${metricName}`);
      }
      expect(
        await readUint32VectorChunks(validity),
        `${metricName} distinguishes populated groups from empty or entirely null groups`
      ).toEqual([[1, 1, 0, 0]]);
    }
    expect(compiled.validity.count, 'dense count columns are never nullable').toBe(undefined);

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
    expect(
      Boolean(groupedBuffers.every(buffer => buffer.destroyed)),
      'grouped results release every owned dense value buffer'
    ).toBe(true);
    expect(
      Boolean(validityBuffers.every(buffer => buffer.destroyed)),
      'grouped results release shared statistic-validity buffers exactly once'
    ).toBe(true);
    expect(
      Boolean(fixture.sourceBuffers.every(buffer => buffer.destroyed)),
      'owned source buffers survive until the final grouped lease is destroyed'
    ).toBe(true);
  } finally {
    compiled.destroy();
    fixture.frame.destroy();
    createBufferSpy.mockRestore();
    submitSpy.mockRestore();
  }

  void 0;
});

it('GPUDataFrame reuses filtered grouped aggregations with encoder-ordered parameters', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const fixture = createGPUGroupedFixture(device);
  const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-parameterized-group-aggregation'
  });
  const compiled = fixture.frame
    .filter(column('fare').greaterThan(parameter('minimumFare', 0)))
    .groupBy('category')
    .aggregate({count: 'count', totalFare: {sum: 'fare'}})
    .compile(graph);

  const firstCount = device.createBuffer({
    id: 'gpu-dataframe-first-group-count',
    byteLength: 4 * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.COPY_DST | Buffer.COPY_SRC
  });
  const firstTotal = device.createBuffer({
    id: 'gpu-dataframe-first-group-total',
    byteLength: 4 * Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.COPY_DST | Buffer.COPY_SRC
  });

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-two-group-encodes'});
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

    expect(
      await readUint32Buffer(firstCount, 4),
      'the first encoding preserves its own filtered dense group counts'
    ).toEqual([1, 1, 0, 0]);
    expect(
      await readFloat32Buffer(firstTotal, 4),
      'the first encoding snapshots grouped sums before the parameter changes'
    ).toEqual([30, 20, 0, 0]);
    expect(
      await readUint32VectorChunks(compiled.table.gpuVectors.count),
      'the second encoding reuses the graph with a stricter selection threshold'
    ).toEqual([[1, 0, 0, 0]]);
    expect(
      await readFloat32VectorChunks(compiled.table.gpuVectors.totalFare),
      'grouped statistic kernels observe encoder-ordered parameter uploads'
    ).toEqual([[30, 0, 0, 0]]);

    const validity = compiled.validity.totalFare;
    if (!validity) {
      throw new Error('Expected nullable grouped total validity');
    }
    expect(
      await readUint32VectorChunks(validity),
      'group validity is recomputed when dynamic filter parameters change'
    ).toEqual([[1, 0, 0, 0]]);
  } finally {
    firstCount.destroy();
    firstTotal.destroy();
    compiled.destroy();
    fixture.frame.destroy();
  }

  void 0;
});

it('GPUDataFrame groups chained nullable derived values without materializing hidden sources', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const fixture = createGPUGroupedFixture(device);
  const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-derived-group-aggregation'
  });
  const compiled = fixture.frame
    .withColumn('doubleFare', column('fare').multiply(literal(2)), {format: 'float32'})
    .groupBy('category')
    .aggregate({count: 'count', totalFare: {sum: 'doubleFare'}, averageFare: {mean: 'doubleFare'}})
    .compile(graph);

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-derived-group-encode'});
    compiled.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    expect(
      compiled.table.schema.fields.map(field => field.name),
      'derived grouping publishes only the key and requested aggregate aliases'
    ).toEqual(['category', 'count', 'totalFare', 'averageFare']);
    expect(
      await readFloat32VectorChunks(compiled.table.gpuVectors.totalFare),
      'GPU grouping consumes nullable derived values across preserved source batches'
    ).toEqual([[80, 40, 0, 0]]);
    expect(
      await readFloat32VectorChunks(compiled.table.gpuVectors.averageFare),
      'derived group means retain empty-group payload semantics'
    ).toEqual([[40, 40, NaN, NaN]]);

    const validity = compiled.validity.totalFare;
    if (!validity) {
      throw new Error('Expected derived group validity');
    }
    expect(
      await readUint32VectorChunks(validity),
      'nullable derived source sidecars propagate into dense grouped validity'
    ).toEqual([[1, 1, 0, 0]]);
  } finally {
    compiled.destroy();
    fixture.frame.destroy();
  }

  void 0;
});

it('GPUDataFrame excludes nonfinite metric values without changing categorical row counts', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const fixture = createGPUGroupedFixture(device);
  const fare = fixture.frame.table.gpuVectors.fare;
  getGPUDataBuffer(fare.data[0]).write(Float32Array.from([10, Number.NaN]));
  getGPUDataBuffer(fare.data[2]).write(Float32Array.from([Number.POSITIVE_INFINITY, 99, 50]));

  const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-nonfinite-group-aggregation'
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
    const commandEncoder = device.createCommandEncoder({
      id: 'gpu-dataframe-nonfinite-group-encode'
    });
    compiled.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    expect(
      await readUint32VectorChunks(compiled.table.gpuVectors.count),
      'categorical count excludes only invalid group keys, not NaN or infinite metric values'
    ).toEqual([[2, 2, 0, 0]]);
    expect(
      await readFloat32VectorChunks(compiled.table.gpuVectors.totalFare),
      'floating-point group sums discard NaN, infinity, and explicit null values'
    ).toEqual([[10, 0, 0, 0]]);
    expect(
      await readFloat32VectorChunks(compiled.table.gpuVectors.minimumFare),
      'groups with only nonfinite contributions retain invalid minimum payloads'
    ).toEqual([[10, NaN, NaN, NaN]]);
    expect(
      await readFloat32VectorChunks(compiled.table.gpuVectors.averageFare),
      'floating-point means divide only finite and explicitly valid contributions'
    ).toEqual([[10, NaN, NaN, NaN]]);

    for (const name of ['totalFare', 'minimumFare', 'averageFare'] as const) {
      const validity = compiled.validity[name];
      if (!validity) {
        throw new Error(`Expected explicit finite-value group validity for ${name}`);
      }
      expect(
        await readUint32VectorChunks(validity),
        `${name} excludes categories populated only by NaN, infinity, or null values`
      ).toEqual([[1, 0, 0, 0]]);
    }
  } finally {
    compiled.destroy();
    fixture.frame.destroy();
  }

  void 0;
});

it('GPUDataFrame initializes dictionary groups when source tables have no record batches', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const frame = new GPUDataFrame<GPUGroupedSourceSchema>({
    table: new GPUTable<GPUGroupedSourceSchema>({
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
  const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-schema-only-group-aggregation'
  });
  const compiled = frame
    .groupBy('category')
    .aggregate({count: 'count', totalFare: {sum: 'fare'}, averageFare: {mean: 'fare'}})
    .compile(graph);

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-empty-group-encode'});
    compiled.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    expect(
      compiled.table.batches.map(batch => batch.numRows),
      'schema-only sources still publish one dense categorical result batch'
    ).toEqual([3]);
    expect(
      await readUint32VectorChunks(compiled.table.gpuVectors.category),
      'empty source tables initialize every dictionary group key'
    ).toEqual([[0, 1, 2]]);
    expect(
      await readUint32VectorChunks(compiled.table.gpuVectors.count),
      'empty source tables publish deterministic zero group counts'
    ).toEqual([[0, 0, 0]]);
    expect(
      await readFloat32VectorChunks(compiled.table.gpuVectors.totalFare),
      'empty source groups retain zero sum payloads'
    ).toEqual([[0, 0, 0]]);
    expect(
      await readFloat32VectorChunks(compiled.table.gpuVectors.averageFare),
      'empty source groups retain NaN mean payloads'
    ).toEqual([[NaN, NaN, NaN]]);
    for (const name of ['totalFare', 'averageFare'] as const) {
      const validity = compiled.validity[name];
      if (!validity) {
        throw new Error(`Expected explicit empty group validity for ${name}`);
      }
      expect(
        await readUint32VectorChunks(validity),
        `${name} marks every schema-only source group invalid`
      ).toEqual([[0, 0, 0]]);
    }
    expect(
      compiled.selectedCounts.data,
      'schema-only grouping does not invent source selection batches'
    ).toEqual([]);
    expect(
      compiled.table.schema.metadata.get('dataset'),
      'dense grouped schemas retain independent source metadata'
    ).toBe('empty-groups');
  } finally {
    compiled.destroy();
    frame.destroy();
  }

  void 0;
});

function createGPUGroupedFixture(device: Device): GPUGroupedFixture {
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
    const batch = new GPURecordBatch<GPUGroupedSourceSchema>({
      gpuData: {
        category: createGPUGroupedData(device, sourceBuffers, values, 'uint32'),
        fare: createGPUGroupedData(device, sourceBuffers, fareValues[batchIndex], 'float32'),
        distance: createGPUGroupedData(device, sourceBuffers, distanceValues[batchIndex], 'sint32')
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
      createGPUGroupedData(device, sourceBuffers, categoryValidityValues[batchIndex], 'uint32')
    );
    fareValidityChunks.push(
      createGPUGroupedData(device, sourceBuffers, fareValidityValues[batchIndex], 'uint32')
    );
    return batch;
  });

  return {
    frame: new GPUDataFrame<GPUGroupedSourceSchema>({
      table: new GPUTable<GPUGroupedSourceSchema>({batches}),
      validity: {
        category: new GPUVector<'uint32'>({
          type: 'data',
          name: 'gpu-dataframe-group-category-validity',
          format: 'uint32',
          data: categoryValidityChunks,
          ownsData: true
        }),
        fare: new GPUVector<'uint32'>({
          type: 'data',
          name: 'gpu-dataframe-group-fare-validity',
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

function createGPUGroupedData<Format extends 'float32' | 'sint32' | 'uint32'>(
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
