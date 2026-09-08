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
  parameter,
  type GPUDataFrameQueryParameters
} from '@luma.gl/experimental/gpu-dataframe';
import {GPUConstant, GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {GPURecordBatch, GPUTable} from '@luma.gl/experimental/gpu-tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';
import {vi} from 'vitest';

type GPUDerivedSourceSchema = {
  fare: 'float32';
  category: 'uint32';
  distance: 'sint32';
};

type GPUDerivedFixture = {
  frame: GPUDataFrame<GPUDerivedSourceSchema>;
  sourceBuffers: Buffer[];
};

type GPUDerivedConstantSourceSchema = GPUDerivedSourceSchema & {
  tip: 'float32';
  tier: 'uint32';
};

it('GPUDataFrame materializes chained nullable GPU columns without disturbing source batches', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const fixture = createGPUDerivedFixture(device);
  const createBufferSpy = vi.spyOn(device, 'createBuffer');
  const submitSpy = vi.spyOn(device, 'submit');

  const query = fixture.frame
    .withColumn('fareWithTip', column('fare').add(literal(5)), {format: 'float32'})
    .withColumn('doubleFare', column('fareWithTip').multiply(literal(2)), {format: 'float32'})
    .filter(column('doubleFare').greaterThan(literal(30)))
    .select(['category', 'doubleFare']);

  expect(
    createBufferSpy.mock.calls.length,
    'chained derived-column planning never allocates GPU storage'
  ).toBe(0);
  expect(submitSpy.mock.calls.length, 'derived-column planning never submits GPU work').toBe(0);
  expect(
    fixture.frame.columnNames,
    'source dataframe remains unchanged while new logical columns are planned'
  ).toEqual(['fare', 'category', 'distance']);

  const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-chained-derived-columns'
  });
  const compiled = query.compile(graph);

  try {
    expect(
      compiled.table.schema.fields.map(field => field.name),
      'hidden intermediate columns are not materialized in the selected result'
    ).toEqual(['category', 'doubleFare']);
    expect(
      compiled.table.batches.map(batch => batch.numRows),
      'derived outputs preserve original record-batch boundaries'
    ).toEqual([2, 0, 3]);
    expect(
      compiled.table.schema.fields.find(field => field.name === 'doubleFare')?.nullable,
      'nullable arithmetic marks the resulting GPU field nullable'
    ).toBe(true);
    expect(
      compiled.dictionaries.category,
      'selected categorical source metadata survives the derived projection'
    ).toEqual({values: ['economy', 'standard', 'premium'], ordered: false});

    fixture.frame.destroy();
    expect(
      Boolean(fixture.sourceBuffers.every(buffer => !buffer.destroyed)),
      'compiled derived queries retain the owned source lease'
    ).toBe(true);

    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-derived-first-encode'});
    compiled.encode(commandEncoder);
    expect(submitSpy.mock.calls.length, 'derived-column compilation only records GPU work').toBe(0);
    device.submit(commandEncoder.finish());

    const derivedVector = compiled.table.gpuVectors.doubleFare;
    const derivedValidity = compiled.validity.doubleFare;
    if (!derivedValidity) {
      throw new Error('Expected a GPU validity vector for the nullable derived column');
    }

    expect(
      await readFloat32VectorChunks(derivedVector),
      'chained GPU arithmetic materializes exact floating-point values in each source batch'
    ).toEqual([[20, 40], [], [60, 208, 80]]);
    expect(
      await readUint32VectorChunks(derivedValidity),
      'derived GPU validity propagates source nulls through every arithmetic expression'
    ).toEqual([[1, 1], [], [1, 0, 1]]);
    expect(
      await readUint32VectorChunks(compiled.selectionMask),
      'filters consume chained derived expressions without accepting null rows'
    ).toEqual([[0, 1], [], [1, 0, 1]]);
    expect(
      await readUint32VectorChunks(compiled.selectedCounts),
      'derived filters publish independent selection counts for empty and nonempty batches'
    ).toEqual([[1], [0], [2]]);
    expect(
      await readSelectedSourceRows(compiled.rowIndices, compiled.selectedCounts),
      'derived filtering preserves stable original source-row identities'
    ).toEqual([[41], [], [42, 44]]);

    const derivedBuffers = [
      ...derivedVector.data.map(getGPUDataBuffer),
      ...derivedValidity.data.map(getGPUDataBuffer)
    ];
    compiled.destroy();
    expect(
      Boolean(derivedBuffers.every(buffer => buffer.destroyed)),
      'compiled queries own and release their materialized derived value and validity buffers'
    ).toBe(true);
    expect(
      Boolean(fixture.sourceBuffers.every(buffer => buffer.destroyed)),
      'source allocations are released only after the compiled derived query is destroyed'
    ).toBe(true);
  } finally {
    compiled.destroy();
    fixture.frame.destroy();
    createBufferSpy.mockRestore();
    submitSpy.mockRestore();
  }

  void 0;
});

it('GPUDataFrame computes signed derived columns without requiring an explicit filter', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const fixture = createGPUDerivedFixture(device);
  const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-signed-derived-column'
  });
  const compiled = fixture.frame
    .withColumn('distanceOffset', column('distance').subtract(literal(2)), {format: 'sint32'})
    .select(['distanceOffset'])
    .compile(graph);

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-signed-derived-encode'});
    compiled.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    expect(
      await readSignedVectorChunks(compiled.table.gpuVectors.distanceOffset),
      'signed 32-bit derived arithmetic remains GPU-native and batch aligned'
    ).toEqual([[-4, 1], [], [-3, 2, 6]]);
    expect(
      compiled.validity.distanceOffset,
      'non-nullable derived values do not allocate unnecessary GPU validity sidecars'
    ).toBe(undefined);
    expect(
      await readUint32VectorChunks(compiled.selectionMask),
      'derived-only queries accept every source row without requiring a synthetic user filter'
    ).toEqual([[1, 1], [], [1, 1, 1]]);
    expect(
      await readUint32VectorChunks(compiled.selectedCounts),
      'derived-only queries retain independent source-batch row counts'
    ).toEqual([[2], [0], [3]]);
  } finally {
    compiled.destroy();
    fixture.frame.destroy();
  }

  void 0;
});

it('GPUDataFrame evaluates derived expressions containing immutable GPUConstant columns', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const fixture = createGPUDerivedFixture(device);
  const constants = {
    tip: new GPUConstant({format: 'float32', value: Float32Array.of(5)}),
    tier: new GPUConstant({format: 'uint32', value: Uint32Array.of(2)})
  };
  const frame = new GPUDataFrame<GPUDerivedConstantSourceSchema>({
    table: new GPUTable<GPUDerivedConstantSourceSchema>({
      batches: fixture.frame.table.batches,
      constants
    }),
    validity: fixture.frame.validity,
    ownership: 'borrowed'
  });
  const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-constant-derived-column'
  });
  const compiled = frame
    .withColumn('totalFare', column('fare').add(column('tip')), {format: 'float32'})
    .filter(
      and(column('totalFare').greaterThan(literal(20)), column('category').lessThan(column('tier')))
    )
    .select(['tip', 'totalFare'])
    .compile(graph);

  try {
    const commandEncoder = device.createCommandEncoder({
      id: 'gpu-dataframe-constant-derived-encode'
    });
    compiled.encode(commandEncoder);
    device.submit(commandEncoder.finish());

    const validity = compiled.validity.totalFare;
    if (!validity) {
      throw new Error('Expected nullable GPUConstant-derived validity');
    }

    expect(
      await readFloat32VectorChunks(compiled.table.gpuVectors.totalFare),
      'trusted float32 constant controls participate in derived GPU arithmetic'
    ).toEqual([[10, 20], [], [30, 104, 40]]);
    expect(
      await readUint32VectorChunks(validity),
      'immutable GPU constants do not create false nulls in derived outputs'
    ).toEqual([[1, 1], [], [1, 0, 1]]);
    expect(
      await readUint32VectorChunks(compiled.selectionMask),
      'hidden unsigned constants remain available to mixed derived predicates'
    ).toEqual([[0, 0], [], [0, 0, 1]]);
    expect(
      compiled.table.gpuConstants.tip,
      'selected GPUConstant identities remain borrowed instead of being materialized'
    ).toBe(constants.tip);
  } finally {
    compiled.destroy();
    frame.destroy();
    fixture.frame.destroy();
  }

  void 0;
});

it('GPUDataFrame updates derived values and null validity in one caller-owned command encoder', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const fixture = createGPUDerivedFixture(device);
  const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-derived-ordered-parameters'
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
      id: `gpu-dataframe-derived-first-count-${batchIndex}`,
      byteLength: Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.COPY_DST | Buffer.COPY_SRC
    })
  );
  const firstValidity = validity.data.map((chunk, batchIndex) =>
    chunk.length > 0
      ? device.createBuffer({
          id: `gpu-dataframe-derived-first-validity-${batchIndex}`,
          byteLength: chunk.length * Uint32Array.BYTES_PER_ELEMENT,
          usage: Buffer.COPY_DST | Buffer.COPY_SRC
        })
      : undefined
  );

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-derived-two-encodes'});
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

    expect(
      await Promise.all(firstCounts.map(async buffer => (await readUint32Buffer(buffer, 1))[0])),
      'first encoded derived values use their own non-null parameter value'
    ).toEqual([1, 0, 2]);
    expect(
      await Promise.all(
        firstValidity.map((buffer, batchIndex) =>
          buffer ? readUint32Buffer(buffer, validity.data[batchIndex].length) : Promise.resolve([])
        )
      ),
      'encoder-ordered staging snapshots the first derived validity state'
    ).toEqual([[1, 1], [], [1, 0, 1]]);
    expect(
      await readUint32VectorChunks(validity),
      'a null parameter makes every derived value invalid on the second encoding'
    ).toEqual([[0, 0], [], [0, 0, 0]]);
    expect(
      await readUint32VectorChunks(compiled.selectedCounts),
      'filters reject null derived values after parameter changes without recompiling'
    ).toEqual([[0], [0], [0]]);
  } finally {
    for (const buffer of firstCounts) buffer.destroy();
    for (const buffer of firstValidity) buffer?.destroy();
    compiled.destroy();
    fixture.frame.destroy();
  }

  void 0;
});

it('GPUDataFrame retains derived schemas for source tables without any record batches', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const frame = new GPUDataFrame<GPUDerivedSourceSchema>({
    table: new GPUTable<GPUDerivedSourceSchema>({
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
  const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-schema-only-derived'
  });
  const compiled = frame
    .withColumn('fareWithTip', column('fare').add(literal(5)), {format: 'float32'})
    .select(['fareWithTip'])
    .compile(graph);

  try {
    expect(
      compiled.table.schema.fields,
      'schema-only derived columns preserve their inferred format and nullability'
    ).toEqual([{name: 'fareWithTip', format: 'float32', nullable: true, metadata: new Map()}]);
    expect(
      compiled.table.schema.metadata.get('dataset'),
      'result schema retains source adapter metadata'
    ).toBe('empty-derived');
    expect(compiled.table.batches, 'no source batches means no synthetic batches').toEqual([]);
    expect(
      compiled.validity.fareWithTip,
      'schema-only derived columns do not create synthetic validity chunks'
    ).toBe(undefined);
    expect(
      compiled.selectedCounts.data,
      'schema-only derived queries do not allocate selection counts'
    ).toEqual([]);

    const commandEncoder = device.createCommandEncoder({
      id: 'gpu-dataframe-schema-only-derived-encode'
    });
    compiled.encode(commandEncoder);
    device.submit(commandEncoder.finish());
  } finally {
    compiled.destroy();
    frame.destroy();
  }

  void 0;
});

function createGPUDerivedFixture(device: Device): GPUDerivedFixture {
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
    const batch = new GPURecordBatch<GPUDerivedSourceSchema>({
      gpuData: {
        fare: createGPUDerivedData(device, sourceBuffers, values, 'float32'),
        category: createGPUDerivedData(device, sourceBuffers, categoryValues[batchIndex], 'uint32'),
        distance: createGPUDerivedData(device, sourceBuffers, distanceValues[batchIndex], 'sint32')
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
      createGPUDerivedData(device, sourceBuffers, fareValidityValues[batchIndex], 'uint32')
    );
    return batch;
  });

  return {
    frame: new GPUDataFrame<GPUDerivedSourceSchema>({
      table: new GPUTable<GPUDerivedSourceSchema>({batches}),
      validity: {
        fare: new GPUVector<'uint32'>({
          type: 'data',
          name: 'gpu-dataframe-derived-fare-validity',
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

function createGPUDerivedData<Format extends 'float32' | 'sint32' | 'uint32'>(
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
