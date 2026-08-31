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
import {expect, it} from 'vitest';
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

it('GPUDataFrame filters nullable GPU batches while preserving stable source rows', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
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

    expect(
      createBufferSpy.mock.calls.length,
      'immutable query planning does not allocate GPU storage'
    ).toBe(0);
    expect(submitSpy.mock.calls.length, 'query planning does not submit GPU work').toBe(0);

    const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
      id: 'gpu-dataframe-nullable-batch-filter'
    });
    compiled = query.compile(graph);
    expect(
      compiled.table.schema.fields.map(field => field.name),
      'projection removes hidden predicate columns from the published table'
    ).toEqual(['category']);
    expect(
      compiled.table.batches.map(batch => batch.numRows),
      'published table preserves source batches instead of fabricating a CPU-selected row count'
    ).toEqual([2, 0, 3]);
    expect(
      compiled.selectionMask.data.map(chunk => chunk.length),
      'selection masks preserve source batch and chunk topology'
    ).toEqual([2, 0, 3]);
    expect(
      compiled.rowIndices.data.map(chunk => chunk.length),
      'selected row IDs retain independent per-batch capacity'
    ).toEqual([2, 0, 3]);
    expect(
      compiled.selectedCounts.data.map(chunk => chunk.length),
      'every source batch has an independent GPU-resident selection count'
    ).toEqual([1, 1, 1]);

    fixture.frame.destroy();
    expect(
      Boolean(fixture.sourceBuffers.every(buffer => !buffer.destroyed)),
      'compilation retains the owned source lease after the original dataframe is released'
    ).toBe(true);

    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-nullable-batch-filter'});
    compiled.encode(commandEncoder);
    expect(submitSpy.mock.calls.length, 'compiled queries only encode caller-owned commands').toBe(
      0
    );
    device.submit(commandEncoder.finish());

    expect(
      await readGPUVectorChunks(compiled.selectionMask),
      'nullable predicates exclude invalid rows without treating nulls as valid'
    ).toEqual([[0, 1], [], [1, 0, 0]]);
    expect(
      await readGPUVectorChunks(compiled.selectedCounts),
      'zero-row batches retain deterministic zero counts'
    ).toEqual([[1], [0], [1]]);
    expect(
      await readSelectedSourceRows(compiled.rowIndices, compiled.selectedCounts),
      'per-batch compaction publishes stable global source-row identities'
    ).toEqual([[41], [], [42]]);

    const outputBuffers = [
      ...compiled.selectionMask.data,
      ...compiled.rowIndices.data,
      ...compiled.selectedCounts.data
    ].map(chunk => getGPUDataBuffer(chunk));
    compiled.destroy();
    expect(
      Boolean(outputBuffers.every(buffer => buffer.destroyed)),
      'compiled queries destroy only their owned GPU output allocations'
    ).toBe(true);
    expect(
      Boolean(fixture.sourceBuffers.every(buffer => buffer.destroyed)),
      'owned source and validity buffers are released after the final compiled lease'
    ).toBe(true);
    compiled.destroy();
  } finally {
    compiled?.destroy();
    fixture.frame.destroy();
    createBufferSpy.mockRestore();
    submitSpy.mockRestore();
  }

  void 0;
});

it('GPUDataFrame expressions apply SQL-style nullable Boolean semantics and signed arithmetic', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
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

    expect(
      await readGPUVectorChunks(nullableQuery.selectionMask),
      'FALSE AND NULL remains FALSE, while TRUE AND NULL remains NULL before negation'
    ).toEqual([[1, 1], [], [0, 1, 0]]);
    expect(
      await readSelectedSourceRows(nullableQuery.rowIndices, nullableQuery.selectedCounts),
      'nullable Boolean expressions preserve source IDs and exclude unresolved rows'
    ).toEqual([[40, 41], [], [43]]);
    expect(
      await readGPUVectorChunks(signedQuery.selectionMask),
      'signed integer arithmetic and unsigned categorical validity share one fused predicate'
    ).toEqual([[0, 1], [], [1, 1, 0]]);
    expect(
      await readSelectedSourceRows(signedQuery.rowIndices, signedQuery.selectedCounts),
      'signed arithmetic filtering preserves independent source batches'
    ).toEqual([[41], [], [42, 43]]);
  } finally {
    nullableQuery.destroy();
    signedQuery.destroy();
    fixture.frame.destroy();
  }

  void 0;
});

it('GPUDataFrame reuses a compiled graph with ordered parameter updates in one encoder', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
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

    expect(
      await Promise.all(
        countSnapshots.map(async buffer => (await readGPUBufferValues(buffer, 1))[0])
      ),
      'the first encoded dispatch observes its own threshold even within a shared command encoder'
    ).toEqual([1, 0, 2]);
    expect(
      await Promise.all(
        maskSnapshots.map((buffer, batchIndex) =>
          buffer
            ? readGPUBufferValues(buffer, compiled.selectionMask.data[batchIndex].length)
            : Promise.resolve([])
        )
      ),
      'encoder-ordered parameter staging preserves the first dispatch result'
    ).toEqual([[0, 1], [], [1, 0, 1]]);
    expect(
      await readGPUVectorChunks(compiled.selectedCounts),
      'the second dispatch applies updated parameters without recompiling the graph'
    ).toEqual([[0], [0], [1]]);
    expect(
      await readSelectedSourceRows(compiled.rowIndices, compiled.selectedCounts),
      're-encoding preserves stable source IDs after parameter changes'
    ).toEqual([[], [], [44]]);
  } finally {
    for (const buffer of countSnapshots) buffer.destroy();
    for (const buffer of maskSnapshots) buffer?.destroy();
    compiled.destroy();
    fixture.frame.destroy();
  }

  void 0;
});

it('GPUDataFrame lowers scalar constant columns into safe GPU expression controls', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
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

    expect(
      await readGPUVectorChunks(constantOnly.selectionMask),
      'a uint32 constant-only predicate accepts every original source row'
    ).toEqual([[1, 1], [], [1, 1, 1]]);
    expect(
      constantOnly.table.gpuConstants.tier,
      'constant-only projections preserve the caller-owned immutable GPUConstant identity'
    ).toBe(constants.tier);
    expect(
      await readGPUVectorChunks(mixedFloat.selectionMask),
      'float32 constants combine with nullable GPU vector values without dropping validity'
    ).toEqual([[0, 0], [], [1, 0, 1]]);
    expect(
      await readGPUVectorChunks(mixedInteger.selectionMask),
      'signed and unsigned constant controls preserve exact native scalar types'
    ).toEqual([[0, 1], [], [1, 1, 0]]);
    expect(
      await readSelectedSourceRows(mixedInteger.rowIndices, mixedInteger.selectedCounts),
      'mixed constant/vector filtering retains source identities and nullable categorical rows'
    ).toEqual([[41], [], [42, 43]]);

    const invalidGraph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
      id: 'gpu-dataframe-unsupported-vector-constant'
    });
    expect(
      () => frame.filter(column('position').greaterThan(literal(0))).compile(invalidGraph),
      'non-scalar GPUConstant formats are rejected before shader generation'
    ).toThrow(/scalar|format|32-bit/i);
  } finally {
    constantOnly.destroy();
    mixedFloat.destroy();
    mixedInteger.destroy();
    frame.destroy();
    fixture.frame.destroy();
  }

  void 0;
});

it('GPUDataFrame compiles schema-only empty queries and rejects unresolved nonempty validity', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
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
    expect(
      emptyQuery.table.schema.fields.map(field => field.name),
      'schema-only queries retain typed projections without requiring nonexistent source vectors'
    ).toEqual(['category']);
    expect(emptyQuery.selectionMask.data, 'zero batches create no mask chunks').toEqual([]);
    expect(emptyQuery.rowIndices.data, 'zero batches create no row-index chunks').toEqual([]);
    expect(
      emptyQuery.selectedCounts.data,
      'zero batches create no synthetic GPU selection counts'
    ).toEqual([]);

    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-schema-only-encode'});
    emptyQuery.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    const unresolvedGraph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
      id: 'gpu-dataframe-unresolved-validity'
    });
    const createBufferSpy = vi.spyOn(device, 'createBuffer');
    try {
      expect(
        () =>
          unresolvedFrame.filter(column('fare').greaterThan(literal(10))).compile(unresolvedGraph),
        'nonempty nullable columns cannot be evaluated without an explicit GPU validity sidecar'
      ).toThrow(/validity/i);
      expect(
        createBufferSpy.mock.calls.length,
        'invalid nullable queries fail before allocating GPU output storage'
      ).toBe(0);
    } finally {
      createBufferSpy.mockRestore();
    }
  } finally {
    unresolvedFrame.destroy();
    fixture.frame.destroy();
    emptyQuery.destroy();
    schemaOnlyFrame.destroy();
  }

  void 0;
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
