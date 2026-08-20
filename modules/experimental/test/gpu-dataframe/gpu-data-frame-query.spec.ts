// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUDataFrame,
  and,
  column,
  literal,
  not,
  parameter,
  type GPUDataFrameQueryParameters
} from '@luma.gl/experimental/gpu-dataframe';
import {GPUConstant, GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {GPURecordBatch, GPUTable} from '@luma.gl/experimental/gpu-tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';
import {vi} from 'vitest';

type GPUDataFrameQuerySchema = {
  fare: 'float32';
  category: 'uint32';
  signed: 'sint32';
};

type GPUDataFrameConstantQuerySchema = GPUDataFrameQuerySchema & {
  tier: 'uint32';
  radius: 'float32';
  direction: 'sint32';
  position: 'float32x2';
};

type GPUDataFrameQueryFixture = {
  frame: GPUDataFrame<GPUDataFrameQuerySchema>;
  sourceBuffers: Buffer[];
};

test('GPUDataFrame filters nullable GPU batches while preserving stable source rows', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createGPUDataFrameQueryFixture(device);
  const createBufferSpy = vi.spyOn(device, 'createBuffer');
  const submitSpy = vi.spyOn(device, 'submit');
  let compiled:
    | ReturnType<ReturnType<GPUDataFrame<GPUDataFrameQuerySchema>['filter']>['compile']>
    | undefined;

  try {
    const query = fixture.frame
      .filter(and(column('fare').greaterThan(literal(10)), column('category').isValid()))
      .select(['category']);

    testContext.equal(
      createBufferSpy.mock.calls.length,
      0,
      'immutable query planning does not allocate GPU storage'
    );
    testContext.equal(submitSpy.mock.calls.length, 0, 'query planning does not submit GPU work');

    const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
      id: 'gpu-dataframe-nullable-batch-filter'
    });
    compiled = query.compile(graph);
    testContext.deepEqual(
      compiled.table.schema.fields.map(field => field.name),
      ['category'],
      'projection removes hidden predicate columns from the published table'
    );
    testContext.deepEqual(
      compiled.table.batches.map(batch => batch.numRows),
      [2, 0, 3],
      'published table preserves source batches instead of fabricating a CPU-selected row count'
    );
    testContext.deepEqual(
      compiled.selectionMask.data.map(chunk => chunk.length),
      [2, 0, 3],
      'selection masks preserve source batch and chunk topology'
    );
    testContext.deepEqual(
      compiled.rowIndices.data.map(chunk => chunk.length),
      [2, 0, 3],
      'selected row IDs retain independent per-batch capacity'
    );
    testContext.deepEqual(
      compiled.selectedCounts.data.map(chunk => chunk.length),
      [1, 1, 1],
      'every source batch has an independent GPU-resident selection count'
    );

    fixture.frame.destroy();
    testContext.ok(
      fixture.sourceBuffers.every(buffer => !buffer.destroyed),
      'compilation retains the owned source lease after the original dataframe is released'
    );

    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-nullable-batch-filter'});
    compiled.encode(commandEncoder);
    testContext.equal(
      submitSpy.mock.calls.length,
      0,
      'compiled queries only encode caller-owned commands'
    );
    device.submit(commandEncoder.finish());

    testContext.deepEqual(
      await readGPUVectorChunks(compiled.selectionMask),
      [[0, 1], [], [1, 0, 0]],
      'nullable predicates exclude invalid rows without treating nulls as valid'
    );
    testContext.deepEqual(
      await readGPUVectorChunks(compiled.selectedCounts),
      [[1], [0], [1]],
      'zero-row batches retain deterministic zero counts'
    );
    testContext.deepEqual(
      await readSelectedSourceRows(compiled.rowIndices, compiled.selectedCounts),
      [[41], [], [42]],
      'per-batch compaction publishes stable global source-row identities'
    );

    const outputBuffers = [
      ...compiled.selectionMask.data,
      ...compiled.rowIndices.data,
      ...compiled.selectedCounts.data
    ].map(chunk => getGPUDataBuffer(chunk));
    compiled.destroy();
    testContext.ok(
      outputBuffers.every(buffer => buffer.destroyed),
      'compiled queries destroy only their owned GPU output allocations'
    );
    testContext.ok(
      fixture.sourceBuffers.every(buffer => buffer.destroyed),
      'owned source and validity buffers are released after the final compiled lease'
    );
    compiled.destroy();
  } finally {
    compiled?.destroy();
    fixture.frame.destroy();
    createBufferSpy.mockRestore();
    submitSpy.mockRestore();
  }

  testContext.end();
});

test('GPUDataFrame expressions apply SQL-style nullable Boolean semantics and signed arithmetic', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createGPUDataFrameQueryFixture(device);

  const nullableGraph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-nullable-boolean-semantics'
  });
  const nullableQuery = fixture.frame
    .filter(
      not(and(column('fare').greaterThan(literal(20)), column('category').greaterThan(literal(0))))
    )
    .compile(nullableGraph);

  const signedGraph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-signed-arithmetic'
  });
  const signedQuery = fixture.frame
    .filter(
      and(column('signed').add(literal(2)).greaterThan(literal(0)), column('category').isValid())
    )
    .compile(signedGraph);

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-nullable-and-signed'});
    nullableQuery.encode(commandEncoder);
    signedQuery.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    testContext.deepEqual(
      await readGPUVectorChunks(nullableQuery.selectionMask),
      [[1, 1], [], [0, 1, 0]],
      'FALSE AND NULL remains FALSE, while TRUE AND NULL remains NULL before negation'
    );
    testContext.deepEqual(
      await readSelectedSourceRows(nullableQuery.rowIndices, nullableQuery.selectedCounts),
      [[40, 41], [], [43]],
      'nullable Boolean expressions preserve source IDs and exclude unresolved rows'
    );
    testContext.deepEqual(
      await readGPUVectorChunks(signedQuery.selectionMask),
      [[0, 1], [], [1, 1, 0]],
      'signed integer arithmetic and unsigned categorical validity share one fused predicate'
    );
    testContext.deepEqual(
      await readSelectedSourceRows(signedQuery.rowIndices, signedQuery.selectedCounts),
      [[41], [], [42, 43]],
      'signed arithmetic filtering preserves independent source batches'
    );
  } finally {
    nullableQuery.destroy();
    signedQuery.destroy();
    fixture.frame.destroy();
  }

  testContext.end();
});

test('GPUDataFrame reuses a compiled graph with ordered parameter updates in one encoder', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createGPUDataFrameQueryFixture(device);
  const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-ordered-parameters'
  });
  const compiled = fixture.frame
    .filter(column('fare').greaterThan(parameter('minimumFare', 0)))
    .compile(graph);
  const countSnapshots = compiled.selectedCounts.data.map((_, batchIndex) =>
    device.createBuffer({
      id: `gpu-dataframe-first-count-${batchIndex}`,
      byteLength: Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.COPY_DST | Buffer.COPY_SRC
    })
  );
  const maskSnapshots = compiled.selectionMask.data.map((chunk, batchIndex) =>
    chunk.length > 0
      ? device.createBuffer({
          id: `gpu-dataframe-first-mask-${batchIndex}`,
          byteLength: chunk.length * Uint32Array.BYTES_PER_ELEMENT,
          usage: Buffer.COPY_DST | Buffer.COPY_SRC
        })
      : undefined
  );

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-two-parameter-encodes'});
    compiled.encode(commandEncoder, {minimumFare: 10});

    for (const [batchIndex, count] of compiled.selectedCounts.data.entries()) {
      commandEncoder.copyBufferToBuffer({
        sourceBuffer: getGPUDataBuffer(count),
        destinationBuffer: countSnapshots[batchIndex],
        size: Uint32Array.BYTES_PER_ELEMENT
      });
      const snapshot = maskSnapshots[batchIndex];
      const mask = compiled.selectionMask.data[batchIndex];
      if (snapshot && mask.length > 0) {
        commandEncoder.copyBufferToBuffer({
          sourceBuffer: getGPUDataBuffer(mask),
          destinationBuffer: snapshot,
          size: mask.length * Uint32Array.BYTES_PER_ELEMENT
        });
      }
    }

    compiled.encode(commandEncoder, {minimumFare: 30});
    device.submit(commandEncoder.finish());

    testContext.deepEqual(
      await Promise.all(
        countSnapshots.map(async buffer => (await readGPUBufferValues(buffer, 1))[0])
      ),
      [1, 0, 2],
      'the first encoded dispatch observes its own threshold even within a shared command encoder'
    );
    testContext.deepEqual(
      await Promise.all(
        maskSnapshots.map((buffer, batchIndex) =>
          buffer
            ? readGPUBufferValues(buffer, compiled.selectionMask.data[batchIndex].length)
            : Promise.resolve([])
        )
      ),
      [[0, 1], [], [1, 0, 1]],
      'encoder-ordered parameter staging preserves the first dispatch result'
    );
    testContext.deepEqual(
      await readGPUVectorChunks(compiled.selectedCounts),
      [[0], [0], [1]],
      'the second dispatch applies updated parameters without recompiling the graph'
    );
    testContext.deepEqual(
      await readSelectedSourceRows(compiled.rowIndices, compiled.selectedCounts),
      [[], [], [44]],
      're-encoding preserves stable source IDs after parameter changes'
    );
  } finally {
    for (const buffer of countSnapshots) buffer.destroy();
    for (const buffer of maskSnapshots) buffer?.destroy();
    compiled.destroy();
    fixture.frame.destroy();
  }

  testContext.end();
});

test('GPUDataFrame lowers scalar constant columns into safe GPU expression controls', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createGPUDataFrameQueryFixture(device);
  const constants = {
    tier: new GPUConstant({format: 'uint32', value: Uint32Array.of(7)}),
    radius: new GPUConstant({format: 'float32', value: Float32Array.of(20)}),
    direction: new GPUConstant({format: 'sint32', value: Int32Array.of(-2)}),
    position: new GPUConstant({format: 'float32x2', value: Float32Array.of(1, 2)})
  };
  const frame = new GPUDataFrame<GPUDataFrameConstantQuerySchema>({
    table: new GPUTable<GPUDataFrameConstantQuerySchema>({
      batches: fixture.frame.table.batches,
      constants
    }),
    validity: fixture.frame.validity,
    ownership: 'borrowed'
  });

  const constantOnlyGraph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-constant-only-filter'
  });
  const constantOnly = frame
    .filter(column('tier').equal(literal(7)))
    .select(['tier'])
    .compile(constantOnlyGraph);
  const mixedFloatGraph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-mixed-float-constant-filter'
  });
  const mixedFloat = frame
    .filter(column('fare').greaterThan(column('radius')))
    .select(['fare'])
    .compile(mixedFloatGraph);
  const mixedIntegerGraph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-mixed-integer-constant-filter'
  });
  const mixedInteger = frame
    .filter(
      and(
        column('signed').greaterThan(column('direction')),
        column('category').lessThan(column('tier'))
      )
    )
    .select(['category'])
    .compile(mixedIntegerGraph);

  try {
    const commandEncoder = device.createCommandEncoder({
      id: 'gpu-dataframe-constant-expression-controls'
    });
    constantOnly.encode(commandEncoder);
    mixedFloat.encode(commandEncoder);
    mixedInteger.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    testContext.deepEqual(
      await readGPUVectorChunks(constantOnly.selectionMask),
      [[1, 1], [], [1, 1, 1]],
      'a uint32 constant-only predicate accepts every original source row'
    );
    testContext.equal(
      constantOnly.table.gpuConstants.tier,
      constants.tier,
      'constant-only projections preserve the caller-owned immutable GPUConstant identity'
    );
    testContext.deepEqual(
      await readGPUVectorChunks(mixedFloat.selectionMask),
      [[0, 0], [], [1, 0, 1]],
      'float32 constants combine with nullable GPU vector values without dropping validity'
    );
    testContext.deepEqual(
      await readGPUVectorChunks(mixedInteger.selectionMask),
      [[0, 1], [], [1, 1, 0]],
      'signed and unsigned constant controls preserve exact native scalar types'
    );
    testContext.deepEqual(
      await readSelectedSourceRows(mixedInteger.rowIndices, mixedInteger.selectedCounts),
      [[41], [], [42, 43]],
      'mixed constant/vector filtering retains source identities and nullable categorical rows'
    );

    const invalidGraph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
      id: 'gpu-dataframe-unsupported-vector-constant'
    });
    testContext.throws(
      () => frame.filter(column('position').greaterThan(literal(0))).compile(invalidGraph),
      /scalar|format|32-bit/i,
      'non-scalar GPUConstant formats are rejected before shader generation'
    );
  } finally {
    constantOnly.destroy();
    mixedFloat.destroy();
    mixedInteger.destroy();
    frame.destroy();
    fixture.frame.destroy();
  }

  testContext.end();
});

test('GPUDataFrame compiles schema-only empty queries and rejects unresolved nonempty validity', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const schemaOnlyFrame = new GPUDataFrame<GPUDataFrameQuerySchema>({
    table: new GPUTable<GPUDataFrameQuerySchema>({
      schema: {
        fields: [
          {name: 'fare', format: 'float32', nullable: true},
          {name: 'category', format: 'uint32', nullable: true},
          {name: 'signed', format: 'sint32', nullable: false}
        ],
        metadata: new Map()
      },
      bufferLayout: [
        {name: 'fare', format: 'float32', byteStride: 4},
        {name: 'category', format: 'uint32', byteStride: 4},
        {name: 'signed', format: 'sint32', byteStride: 4}
      ]
    }),
    ownership: 'owned'
  });
  const emptyGraph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-schema-only-query'
  });
  const emptyQuery = schemaOnlyFrame
    .filter(column('fare').greaterThan(literal(10)))
    .select(['category'])
    .compile(emptyGraph);
  const fixture = createGPUDataFrameQueryFixture(device);
  const unresolvedFrame = new GPUDataFrame<GPUDataFrameQuerySchema>({
    table: fixture.frame.table,
    ownership: 'borrowed'
  });

  try {
    testContext.deepEqual(
      emptyQuery.table.schema.fields.map(field => field.name),
      ['category'],
      'schema-only queries retain typed projections without requiring nonexistent source vectors'
    );
    testContext.deepEqual(emptyQuery.selectionMask.data, [], 'zero batches create no mask chunks');
    testContext.deepEqual(
      emptyQuery.rowIndices.data,
      [],
      'zero batches create no row-index chunks'
    );
    testContext.deepEqual(
      emptyQuery.selectedCounts.data,
      [],
      'zero batches create no synthetic GPU selection counts'
    );

    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-schema-only-encode'});
    emptyQuery.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    const unresolvedGraph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
      id: 'gpu-dataframe-unresolved-validity'
    });
    const createBufferSpy = vi.spyOn(device, 'createBuffer');
    try {
      testContext.throws(
        () =>
          unresolvedFrame.filter(column('fare').greaterThan(literal(10))).compile(unresolvedGraph),
        /validity/i,
        'nonempty nullable columns cannot be evaluated without an explicit GPU validity sidecar'
      );
      testContext.equal(
        createBufferSpy.mock.calls.length,
        0,
        'invalid nullable queries fail before allocating GPU output storage'
      );
    } finally {
      createBufferSpy.mockRestore();
    }
  } finally {
    unresolvedFrame.destroy();
    fixture.frame.destroy();
    emptyQuery.destroy();
    schemaOnlyFrame.destroy();
  }

  testContext.end();
});

function createGPUDataFrameQueryFixture(device: Device): GPUDataFrameQueryFixture {
  const sourceBuffers: Buffer[] = [];
  const fares = [Float32Array.from([5, 15]), new Float32Array(0), Float32Array.from([25, 99, 35])];
  const categories = [Uint32Array.from([0, 1]), new Uint32Array(0), Uint32Array.from([2, 0, 1])];
  const signedValues = [Int32Array.from([-2, 3]), new Int32Array(0), Int32Array.from([-1, 4, 8])];
  const fareValidity = [Uint32Array.from([1, 1]), new Uint32Array(0), Uint32Array.from([1, 0, 1])];
  const categoryValidity = [
    Uint32Array.from([1, 1]),
    new Uint32Array(0),
    Uint32Array.from([1, 1, 0])
  ];
  const fareValidityChunks: GPUData<'uint32'>[] = [];
  const categoryValidityChunks: GPUData<'uint32'>[] = [];
  let sourceRowIndexOffset = 40;

  const batches = fares.map((fareValues, batchIndex) => {
    const batch = new GPURecordBatch<GPUDataFrameQuerySchema>({
      gpuData: {
        fare: createOwnedGPUData(
          device,
          sourceBuffers,
          `gpu-dataframe-query-fare-${batchIndex}`,
          fareValues,
          'float32'
        ),
        category: createOwnedGPUData(
          device,
          sourceBuffers,
          `gpu-dataframe-query-category-${batchIndex}`,
          categories[batchIndex],
          'uint32'
        ),
        signed: createOwnedGPUData(
          device,
          sourceBuffers,
          `gpu-dataframe-query-signed-${batchIndex}`,
          signedValues[batchIndex],
          'sint32'
        )
      },
      fields: [
        {name: 'fare', format: 'float32', nullable: true},
        {name: 'category', format: 'uint32', nullable: true},
        {name: 'signed', format: 'sint32', nullable: false}
      ],
      sourceInfo: {
        sourceBatchIndex: batchIndex + 4,
        sourceRowIndexOffset,
        sourceRowCount: fareValues.length
      }
    });
    sourceRowIndexOffset += fareValues.length;
    fareValidityChunks.push(
      createOwnedGPUData(
        device,
        sourceBuffers,
        `gpu-dataframe-query-fare-validity-${batchIndex}`,
        fareValidity[batchIndex],
        'uint32'
      )
    );
    categoryValidityChunks.push(
      createOwnedGPUData(
        device,
        sourceBuffers,
        `gpu-dataframe-query-category-validity-${batchIndex}`,
        categoryValidity[batchIndex],
        'uint32'
      )
    );
    return batch;
  });

  return {
    frame: new GPUDataFrame<GPUDataFrameQuerySchema>({
      table: new GPUTable<GPUDataFrameQuerySchema>({batches}),
      validity: {
        fare: new GPUVector<'uint32'>({
          type: 'data',
          name: 'gpu-dataframe-query-fare-validity',
          format: 'uint32',
          data: fareValidityChunks,
          ownsData: true
        }),
        category: new GPUVector<'uint32'>({
          type: 'data',
          name: 'gpu-dataframe-query-category-validity',
          format: 'uint32',
          data: categoryValidityChunks,
          ownsData: true
        })
      },
      ownership: 'owned'
    }),
    sourceBuffers
  };
}

function createOwnedGPUData<Format extends 'float32' | 'sint32' | 'uint32'>(
  device: Device,
  sourceBuffers: Buffer[],
  identifier: string,
  values: Float32Array | Int32Array | Uint32Array,
  format: Format
): GPUData<Format> {
  const buffer = device.createBuffer({
    id: identifier,
    byteLength: Math.max(values.byteLength, Uint32Array.BYTES_PER_ELEMENT),
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST,
    ...(values.byteLength > 0 ? {data: values} : {})
  });
  sourceBuffers.push(buffer);
  return new GPUData({buffer, format, length: values.length, ownsBuffer: true});
}

function getGPUDataBuffer(data: GPUData<'uint32'>): Buffer {
  return data.buffer instanceof Buffer ? data.buffer : data.buffer.buffer;
}

async function readGPUBufferValues(buffer: Buffer, length: number): Promise<number[]> {
  if (length === 0) {
    return [];
  }
  const values = await buffer.readAsync(0, length * Uint32Array.BYTES_PER_ELEMENT);
  return Array.from(new Uint32Array(values.buffer, values.byteOffset, length));
}

async function readGPUVectorChunks(vector: GPUVector<'uint32'>): Promise<number[][]> {
  return Promise.all(
    vector.data.map(chunk => readGPUBufferValues(getGPUDataBuffer(chunk), chunk.length))
  );
}

async function readSelectedSourceRows(
  rowIndices: GPUVector<'uint32'>,
  selectedCounts: GPUVector<'uint32'>
): Promise<number[][]> {
  const counts = await readGPUVectorChunks(selectedCounts);
  return Promise.all(
    rowIndices.data.map((chunk, batchIndex) =>
      readGPUBufferValues(getGPUDataBuffer(chunk), counts[batchIndex][0] ?? 0)
    )
  );
}
