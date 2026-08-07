// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/experimental';
import {
  LuDataFrame,
  and,
  column,
  literal,
  parameter,
  type LuDataFrameQueryParameters
} from '@luma.gl/experimental/ludf';
import {GPUConstant, GPUData, GPURecordBatch, GPUTable, GPUVector} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';
import {vi} from 'vitest';

type LuDerivedSourceSchema = {
  fare: 'float32';
  category: 'uint32';
  distance: 'sint32';
};

type LuDerivedFixture = {
  frame: LuDataFrame<LuDerivedSourceSchema>;
  sourceBuffers: Buffer[];
};

type LuDerivedConstantSourceSchema = LuDerivedSourceSchema & {
  tip: 'float32';
  tier: 'uint32';
};

test('LuDataFrame materializes chained nullable GPU columns without disturbing source batches', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuDerivedFixture(device);
  const createBufferSpy = vi.spyOn(device, 'createBuffer');
  const submitSpy = vi.spyOn(device, 'submit');

  const query = fixture.frame
    .withColumn('fareWithTip', column('fare').add(literal(5)), {format: 'float32'})
    .withColumn('doubleFare', column('fareWithTip').multiply(literal(2)), {format: 'float32'})
    .filter(column('doubleFare').greaterThan(literal(30)))
    .select(['category', 'doubleFare']);

  testContext.equal(
    createBufferSpy.mock.calls.length,
    0,
    'chained derived-column planning never allocates GPU storage'
  );
  testContext.equal(
    submitSpy.mock.calls.length,
    0,
    'derived-column planning never submits GPU work'
  );
  testContext.deepEqual(
    fixture.frame.columnNames,
    ['fare', 'category', 'distance'],
    'source dataframe remains unchanged while new logical columns are planned'
  );

  const graph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-chained-derived-columns'
  });
  const compiled = query.compile(graph);

  try {
    testContext.deepEqual(
      compiled.table.schema.fields.map(field => field.name),
      ['category', 'doubleFare'],
      'hidden intermediate columns are not materialized in the selected result'
    );
    testContext.deepEqual(
      compiled.table.batches.map(batch => batch.numRows),
      [2, 0, 3],
      'derived outputs preserve original record-batch boundaries'
    );
    testContext.equal(
      compiled.table.schema.fields.find(field => field.name === 'doubleFare')?.nullable,
      true,
      'nullable arithmetic marks the resulting GPU field nullable'
    );
    testContext.deepEqual(
      compiled.dictionaries.category,
      {values: ['economy', 'standard', 'premium'], ordered: false},
      'selected categorical source metadata survives the derived projection'
    );

    fixture.frame.destroy();
    testContext.ok(
      fixture.sourceBuffers.every(buffer => !buffer.destroyed),
      'compiled derived queries retain the owned source lease'
    );

    const commandEncoder = device.createCommandEncoder({id: 'ludf-derived-first-encode'});
    compiled.encode(commandEncoder);
    testContext.equal(
      submitSpy.mock.calls.length,
      0,
      'derived-column compilation only records GPU work'
    );
    device.submit(commandEncoder.finish());

    const derivedVector = compiled.table.gpuVectors.doubleFare;
    const derivedValidity = compiled.validity.doubleFare;
    if (!derivedValidity) {
      throw new Error('Expected a GPU validity vector for the nullable derived column');
    }

    testContext.deepEqual(
      await readFloat32VectorChunks(derivedVector),
      [[20, 40], [], [60, 208, 80]],
      'chained GPU arithmetic materializes exact floating-point values in each source batch'
    );
    testContext.deepEqual(
      await readUint32VectorChunks(derivedValidity),
      [[1, 1], [], [1, 0, 1]],
      'derived GPU validity propagates source nulls through every arithmetic expression'
    );
    testContext.deepEqual(
      await readUint32VectorChunks(compiled.selectionMask),
      [[0, 1], [], [1, 0, 1]],
      'filters consume chained derived expressions without accepting null rows'
    );
    testContext.deepEqual(
      await readUint32VectorChunks(compiled.selectedCounts),
      [[1], [0], [2]],
      'derived filters publish independent selection counts for empty and nonempty batches'
    );
    testContext.deepEqual(
      await readSelectedSourceRows(compiled.rowIndices, compiled.selectedCounts),
      [[41], [], [42, 44]],
      'derived filtering preserves stable original source-row identities'
    );

    const derivedBuffers = [
      ...derivedVector.data.map(getGPUDataBuffer),
      ...derivedValidity.data.map(getGPUDataBuffer)
    ];
    compiled.destroy();
    testContext.ok(
      derivedBuffers.every(buffer => buffer.destroyed),
      'compiled queries own and release their materialized derived value and validity buffers'
    );
    testContext.ok(
      fixture.sourceBuffers.every(buffer => buffer.destroyed),
      'source allocations are released only after the compiled derived query is destroyed'
    );
  } finally {
    compiled.destroy();
    fixture.frame.destroy();
    createBufferSpy.mockRestore();
    submitSpy.mockRestore();
  }

  testContext.end();
});

test('LuDataFrame computes signed derived columns without requiring an explicit filter', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuDerivedFixture(device);
  const graph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-signed-derived-column'
  });
  const compiled = fixture.frame
    .withColumn('distanceOffset', column('distance').subtract(literal(2)), {format: 'sint32'})
    .select(['distanceOffset'])
    .compile(graph);

  try {
    const commandEncoder = device.createCommandEncoder({id: 'ludf-signed-derived-encode'});
    compiled.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    testContext.deepEqual(
      await readSignedVectorChunks(compiled.table.gpuVectors.distanceOffset),
      [[-4, 1], [], [-3, 2, 6]],
      'signed 32-bit derived arithmetic remains GPU-native and batch aligned'
    );
    testContext.equal(
      compiled.validity.distanceOffset,
      undefined,
      'non-nullable derived values do not allocate unnecessary GPU validity sidecars'
    );
    testContext.deepEqual(
      await readUint32VectorChunks(compiled.selectionMask),
      [[1, 1], [], [1, 1, 1]],
      'derived-only queries accept every source row without requiring a synthetic user filter'
    );
    testContext.deepEqual(
      await readUint32VectorChunks(compiled.selectedCounts),
      [[2], [0], [3]],
      'derived-only queries retain independent source-batch row counts'
    );
  } finally {
    compiled.destroy();
    fixture.frame.destroy();
  }

  testContext.end();
});

test('LuDataFrame evaluates derived expressions containing immutable GPUConstant columns', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuDerivedFixture(device);
  const constants = {
    tip: new GPUConstant({format: 'float32', value: Float32Array.of(5)}),
    tier: new GPUConstant({format: 'uint32', value: Uint32Array.of(2)})
  };
  const frame = new LuDataFrame<LuDerivedConstantSourceSchema>({
    table: new GPUTable<LuDerivedConstantSourceSchema>({
      batches: fixture.frame.table.batches,
      constants
    }),
    validity: fixture.frame.validity,
    ownership: 'borrowed'
  });
  const graph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-constant-derived-column'
  });
  const compiled = frame
    .withColumn('totalFare', column('fare').add(column('tip')), {format: 'float32'})
    .filter(
      and(column('totalFare').greaterThan(literal(20)), column('category').lessThan(column('tier')))
    )
    .select(['tip', 'totalFare'])
    .compile(graph);

  try {
    const commandEncoder = device.createCommandEncoder({id: 'ludf-constant-derived-encode'});
    compiled.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    const validity = compiled.validity.totalFare;
    if (!validity) {
      throw new Error('Expected nullable GPUConstant-derived validity');
    }

    testContext.deepEqual(
      await readFloat32VectorChunks(compiled.table.gpuVectors.totalFare),
      [[10, 20], [], [30, 104, 40]],
      'trusted float32 constant controls participate in derived GPU arithmetic'
    );
    testContext.deepEqual(
      await readUint32VectorChunks(validity),
      [[1, 1], [], [1, 0, 1]],
      'immutable GPU constants do not create false nulls in derived outputs'
    );
    testContext.deepEqual(
      await readUint32VectorChunks(compiled.selectionMask),
      [[0, 0], [], [0, 0, 1]],
      'hidden unsigned constants remain available to mixed derived predicates'
    );
    testContext.equal(
      compiled.table.gpuConstants.tip,
      constants.tip,
      'selected GPUConstant identities remain borrowed instead of being materialized'
    );
  } finally {
    compiled.destroy();
    frame.destroy();
    fixture.frame.destroy();
  }

  testContext.end();
});

test('LuDataFrame updates derived values and null validity in one caller-owned command encoder', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createLuDerivedFixture(device);
  const graph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-derived-ordered-parameters'
  });
  const compiled = fixture.frame
    .withColumn('adjustedFare', column('fare').add(parameter('adjustment', 0)), {
      format: 'float32'
    })
    .filter(column('adjustedFare').greaterThan(literal(10)))
    .select(['adjustedFare'])
    .compile(graph);
  const validity = compiled.validity.adjustedFare;
  if (!validity) {
    throw new Error('Expected nullable parameter-derived validity');
  }
  const firstCounts = compiled.selectedCounts.data.map((_, batchIndex) =>
    device.createBuffer({
      id: `ludf-derived-first-count-${batchIndex}`,
      byteLength: Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.COPY_DST | Buffer.COPY_SRC
    })
  );
  const firstValidity = validity.data.map((chunk, batchIndex) =>
    chunk.length > 0
      ? device.createBuffer({
          id: `ludf-derived-first-validity-${batchIndex}`,
          byteLength: chunk.length * Uint32Array.BYTES_PER_ELEMENT,
          usage: Buffer.COPY_DST | Buffer.COPY_SRC
        })
      : undefined
  );

  try {
    const commandEncoder = device.createCommandEncoder({id: 'ludf-derived-two-encodes'});
    compiled.encode(commandEncoder, {adjustment: 0});

    for (const [batchIndex, count] of compiled.selectedCounts.data.entries()) {
      commandEncoder.copyBufferToBuffer({
        sourceBuffer: getGPUDataBuffer(count),
        destinationBuffer: firstCounts[batchIndex],
        size: Uint32Array.BYTES_PER_ELEMENT
      });
      const snapshot = firstValidity[batchIndex];
      const chunk = validity.data[batchIndex];
      if (snapshot && chunk.length > 0) {
        commandEncoder.copyBufferToBuffer({
          sourceBuffer: getGPUDataBuffer(chunk),
          destinationBuffer: snapshot,
          size: chunk.length * Uint32Array.BYTES_PER_ELEMENT
        });
      }
    }

    compiled.encode(commandEncoder, {adjustment: null});
    device.submit(commandEncoder.finish());

    testContext.deepEqual(
      await Promise.all(firstCounts.map(async buffer => (await readUint32Buffer(buffer, 1))[0])),
      [1, 0, 2],
      'first encoded derived values use their own non-null parameter value'
    );
    testContext.deepEqual(
      await Promise.all(
        firstValidity.map((buffer, batchIndex) =>
          buffer ? readUint32Buffer(buffer, validity.data[batchIndex].length) : Promise.resolve([])
        )
      ),
      [[1, 1], [], [1, 0, 1]],
      'encoder-ordered staging snapshots the first derived validity state'
    );
    testContext.deepEqual(
      await readUint32VectorChunks(validity),
      [[0, 0], [], [0, 0, 0]],
      'a null parameter makes every derived value invalid on the second encoding'
    );
    testContext.deepEqual(
      await readUint32VectorChunks(compiled.selectedCounts),
      [[0], [0], [0]],
      'filters reject null derived values after parameter changes without recompiling'
    );
  } finally {
    for (const buffer of firstCounts) buffer.destroy();
    for (const buffer of firstValidity) buffer?.destroy();
    compiled.destroy();
    fixture.frame.destroy();
  }

  testContext.end();
});

test('LuDataFrame retains derived schemas for source tables without any record batches', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const frame = new LuDataFrame<LuDerivedSourceSchema>({
    table: new GPUTable<LuDerivedSourceSchema>({
      schema: {
        fields: [
          {name: 'fare', format: 'float32', nullable: true},
          {name: 'category', format: 'uint32', nullable: false},
          {name: 'distance', format: 'sint32', nullable: false}
        ],
        metadata: new Map([['dataset', 'empty-derived']])
      },
      bufferLayout: [
        {name: 'fare', format: 'float32', byteStride: 4},
        {name: 'category', format: 'uint32', byteStride: 4},
        {name: 'distance', format: 'sint32', byteStride: 4}
      ]
    }),
    ownership: 'owned'
  });
  const graph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-schema-only-derived'
  });
  const compiled = frame
    .withColumn('fareWithTip', column('fare').add(literal(5)), {format: 'float32'})
    .select(['fareWithTip'])
    .compile(graph);

  try {
    testContext.deepEqual(
      compiled.table.schema.fields,
      [{name: 'fareWithTip', format: 'float32', nullable: true, metadata: new Map()}],
      'schema-only derived columns preserve their inferred format and nullability'
    );
    testContext.equal(
      compiled.table.schema.metadata.get('dataset'),
      'empty-derived',
      'result schema retains source adapter metadata'
    );
    testContext.deepEqual(
      compiled.table.batches,
      [],
      'no source batches means no synthetic batches'
    );
    testContext.equal(
      compiled.validity.fareWithTip,
      undefined,
      'schema-only derived columns do not create synthetic validity chunks'
    );
    testContext.deepEqual(
      compiled.selectedCounts.data,
      [],
      'schema-only derived queries do not allocate selection counts'
    );

    const commandEncoder = device.createCommandEncoder({id: 'ludf-schema-only-derived-encode'});
    compiled.encode(commandEncoder);
    device.submit(commandEncoder.finish());
  } finally {
    compiled.destroy();
    frame.destroy();
  }

  testContext.end();
});

function createLuDerivedFixture(device: Device): LuDerivedFixture {
  const sourceBuffers: Buffer[] = [];
  const fareValues = [
    Float32Array.from([5, 15]),
    new Float32Array(0),
    Float32Array.from([25, 99, 35])
  ];
  const categoryValues = [
    Uint32Array.from([0, 1]),
    new Uint32Array(0),
    Uint32Array.from([2, 0, 1])
  ];
  const distanceValues = [Int32Array.from([-2, 3]), new Int32Array(0), Int32Array.from([-1, 4, 8])];
  const fareValidityValues = [
    Uint32Array.from([1, 1]),
    new Uint32Array(0),
    Uint32Array.from([1, 0, 1])
  ];
  const fareValidityChunks: GPUData<'uint32'>[] = [];
  let sourceRowIndexOffset = 40;

  const batches = fareValues.map((values, batchIndex) => {
    const batch = new GPURecordBatch<LuDerivedSourceSchema>({
      gpuData: {
        fare: createLuDerivedData(device, sourceBuffers, values, 'float32'),
        category: createLuDerivedData(device, sourceBuffers, categoryValues[batchIndex], 'uint32'),
        distance: createLuDerivedData(device, sourceBuffers, distanceValues[batchIndex], 'sint32')
      },
      fields: [
        {name: 'fare', format: 'float32', nullable: true},
        {name: 'category', format: 'uint32', nullable: false},
        {name: 'distance', format: 'sint32', nullable: false}
      ],
      sourceInfo: {
        sourceBatchIndex: batchIndex + 4,
        sourceRowIndexOffset,
        sourceRowCount: values.length
      }
    });
    sourceRowIndexOffset += values.length;
    fareValidityChunks.push(
      createLuDerivedData(device, sourceBuffers, fareValidityValues[batchIndex], 'uint32')
    );
    return batch;
  });

  return {
    frame: new LuDataFrame<LuDerivedSourceSchema>({
      table: new GPUTable<LuDerivedSourceSchema>({batches}),
      validity: {
        fare: new GPUVector<'uint32'>({
          type: 'data',
          name: 'ludf-derived-fare-validity',
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

function createLuDerivedData<Format extends 'float32' | 'sint32' | 'uint32'>(
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

async function readUint32VectorChunks(vector: GPUVector<'uint32'>): Promise<number[][]> {
  return Promise.all(
    vector.data.map(chunk => readUint32Buffer(getGPUDataBuffer(chunk), chunk.length))
  );
}

async function readFloat32VectorChunks(vector: GPUVector): Promise<number[][]> {
  return Promise.all(
    vector.data.map(async chunk => {
      if (chunk.length === 0) {
        return [];
      }
      const values = await getGPUDataBuffer(chunk).readAsync(
        0,
        chunk.length * Float32Array.BYTES_PER_ELEMENT
      );
      return Array.from(new Float32Array(values.buffer, values.byteOffset, chunk.length));
    })
  );
}

async function readSignedVectorChunks(vector: GPUVector): Promise<number[][]> {
  return Promise.all(
    vector.data.map(async chunk => {
      if (chunk.length === 0) {
        return [];
      }
      const values = await getGPUDataBuffer(chunk).readAsync(
        0,
        chunk.length * Int32Array.BYTES_PER_ELEMENT
      );
      return Array.from(new Int32Array(values.buffer, values.byteOffset, chunk.length));
    })
  );
}

async function readSelectedSourceRows(
  rowIndices: GPUVector<'uint32'>,
  selectedCounts: GPUVector<'uint32'>
): Promise<number[][]> {
  const counts = await readUint32VectorChunks(selectedCounts);
  return Promise.all(
    rowIndices.data.map((chunk, batchIndex) =>
      readUint32Buffer(getGPUDataBuffer(chunk), counts[batchIndex][0] ?? 0)
    )
  );
}
