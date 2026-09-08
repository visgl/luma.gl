// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  convertArrowRecordBatchesToGPURecordBatches,
  convertArrowTableToGPUTable,
  convertArrowToGPUVector,
  getArrowFixedSizeListValues,
  makeArrowFixedSizeListVector,
  makeGPUVectorFromArrow,
  planArrowGPUConversion,
  planArrowTableGPUConversion,
  readArrowGPUVectorAsync
} from '@luma.gl/arrow';
import {backendRegistry} from '@luma.gl/gpgpu';
import * as cpuBackend from '@luma.gl/gpgpu/operations/cpu';
import {getWebGPUTestDevice, NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

backendRegistry.add('null', cpuBackend);

test('planArrowGPUConversion explains direct and byte-compatible uploads', t => {
  const device = new NullDevice({});
  const positions = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([1, 2, 3, 4])
  );
  const direct = planArrowGPUConversion(device, positions, {name: 'positions'});

  t.equal(direct.semantic, 'numeric', 'infers numeric semantics');
  t.equal(direct.strategy, 'upload', 'selects direct upload');
  t.equal(direct.backend, 'upload', 'reports the upload backend');
  t.equal(direct.targetFormat, 'float32x2', 'infers the physical GPU format');
  t.equal(direct.cost.targetByteLength, 16, 'estimates target payload bytes');
  t.equal(direct.cost.gpuPassCount, 0, 'does not schedule a transform pass');

  const colors = makeArrowFixedSizeListVector(new arrow.Uint8(), 4, new Uint8Array([1, 2, 3, 4]));
  const reinterpreted = planArrowGPUConversion(device, colors, {
    semantic: 'numeric',
    format: 'unorm8x4'
  });
  t.equal(reinterpreted.strategy, 'reinterpret-upload', 'reuses byte-compatible storage');
  t.equal(reinterpreted.targetFormat, 'unorm8x4', 'changes only GPU interpretation metadata');

  device.destroy();
  t.end();
});

test('convertArrowToGPUVector dispatches semantic color and temporal conversions', async t => {
  const device = new NullDevice({});
  const colors = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    3,
    new Float32Array([1, 0.5, 0])
  );
  const preparedColors = await convertArrowToGPUVector(device, colors, {
    name: 'colors',
    semantic: 'color'
  });
  const colorResult = await readArrowGPUVectorAsync(preparedColors.vector);

  t.equal(preparedColors.plan.strategy, 'convert-color', 'selects color conversion');
  t.equal(preparedColors.vector.format, 'unorm8x4', 'emits canonical normalized RGBA');
  t.deepEqual(
    getArrowFixedSizeListValues(colorResult),
    new Uint8Array([255, 128, 0, 255]),
    'executes the existing color conversion family'
  );

  const timestampType = new arrow.TimestampMillisecond();
  const timestampData = arrow.makeData({
    type: timestampType,
    length: 2,
    data: new BigInt64Array([1000n, 1010n])
  });
  const timestamps = arrow.makeVector(timestampData);
  const preparedTime = await convertArrowToGPUVector(device, timestamps, {
    name: 'timestamps',
    temporal: {preferGPU: false}
  });
  const timeResult = await readArrowGPUVectorAsync(preparedTime.vector);

  t.equal(preparedTime.plan.semantic, 'temporal', 'auto-detects Arrow temporal types');
  t.equal(preparedTime.plan.strategy, 'convert-temporal', 'selects temporal lowering');
  t.deepEqual(Array.from(timeResult.toArray()), [0, 10], 'emits relative Float32 values');
  t.equal(preparedTime.temporalInfo?.origin, 1000n, 'retains semantic origin metadata');

  preparedColors.destroy();
  preparedTime.destroy();
  device.destroy();
  t.end();
});

test('convertArrowToGPUVector borrows matching GPU vectors without taking ownership', async t => {
  const device = new NullDevice({});
  const source = makeGPUVectorFromArrow(device, arrow.makeVector(new Float32Array([1, 2, 3])), {
    name: 'values'
  });
  const buffer = source.data[0].buffer;
  const prepared = await convertArrowToGPUVector(device, source, {
    policy: 'require-zero-copy'
  });

  t.equal(prepared.vector, source, 'returns the caller-owned vector');
  t.equal(prepared.plan.strategy, 'borrow', 'reports a zero-copy borrow');
  t.notOk(prepared.ownsVector, 'does not claim caller-owned storage');
  prepared.destroy();
  t.notOk(buffer.destroyed, 'prepared handle leaves borrowed storage alive');
  source.destroy();
  t.ok(buffer.destroyed, 'caller remains responsible for its vector');

  device.destroy();
  t.end();
});

test('convertArrowToGPUVector lowers Boolean and Float64 chunks with nulls', async t => {
  const device = new NullDevice({});
  const booleanValues = arrow.vectorFromArray([true, null, false], new arrow.Bool());
  const preparedBooleans = await convertArrowToGPUVector(device, booleanValues, {
    name: 'flags'
  });
  const booleanResult = await readArrowGPUVectorAsync(preparedBooleans.vector);

  t.equal(preparedBooleans.plan.strategy, 'convert-numeric', 'repackages bit-packed booleans');
  t.equal(preparedBooleans.vector.format, 'uint8', 'uses byte-addressable Boolean storage');
  t.deepEqual(Array.from(booleanResult), [1, null, 0], 'preserves Boolean null rows');

  const firstFloat64Chunk = arrow.vectorFromArray(
    [[1.25, 2.5], null],
    new arrow.FixedSizeList(2, new arrow.Field('value', new arrow.Float64(), false))
  );
  const secondFloat64Chunk = arrow.vectorFromArray([[3.75, 4.5]], firstFloat64Chunk.type);
  const float64Values = new arrow.Vector([firstFloat64Chunk.data[0], secondFloat64Chunk.data[0]]);
  const preparedFloat64 = await convertArrowToGPUVector(device, float64Values, {
    name: 'coordinates'
  });
  const float64Result = await readArrowGPUVectorAsync(preparedFloat64.vector);

  t.equal(preparedFloat64.vector.format, 'float32x2', 'selects portable Float32 tuples');
  t.equal(preparedFloat64.vector.data.length, 2, 'preserves numeric source chunks');
  t.match(
    preparedFloat64.plan.warnings.join(' '),
    /64-bit source values are rounded/,
    'diagnoses precision loss'
  );
  t.deepEqual(
    Array.from(float64Result.get(0) as Iterable<number>),
    [1.25, 2.5],
    'converts Float64 tuple values'
  );
  t.equal(float64Result.get(1), null, 'preserves nullable Float64 rows');
  t.deepEqual(
    Array.from(float64Result.get(2) as Iterable<number>),
    [3.75, 4.5],
    'converts later chunks'
  );

  preparedBooleans.destroy();
  preparedFloat64.destroy();
  device.destroy();
  t.end();
});

test('convertArrowToGPUVector uploads Float64 unchanged and splits it with GPGPU', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('Skipping Arrow Float64 GPGPU conversion test without WebGPU');
    t.end();
    return;
  }

  const source = makeArrowFixedSizeListVector(
    new arrow.Float64(),
    2,
    new Float64Array([100000001, -100000001, 1.25, 2.5])
  );
  const prepared = await convertArrowToGPUVector(device, source, {name: 'positions'});
  const result = await readArrowGPUVectorAsync(prepared.vector);
  const residualResult = await readArrowGPUVectorAsync(prepared.residualVector!);
  const physicalBytes = await prepared.vector.data[0].buffer.readAsync(0, 32);
  const physicalValues = new Float32Array(
    physicalBytes.buffer,
    physicalBytes.byteOffset,
    physicalBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
  );

  t.equal(prepared.plan.backend, 'webgpu', 'planner selects the GPGPU backend');
  t.equal(prepared.plan.cost.cpuPassCount, 0, 'avoids a CPU value-conversion pass');
  t.equal(prepared.plan.cost.gpuPassCount, 1, 'schedules one GPU transform pass');
  t.equal(prepared.plan.cost.targetByteLength, 32, 'accounts for high and residual-low storage');
  t.deepEqual(
    Array.from(physicalValues),
    [100000000, -100000000, 1, -1, 1.25, 2.5, 0, 0],
    'fround stores high lanes followed by residual-low lanes in every row'
  );
  t.deepEqual(
    Array.from(result.get(0) as Iterable<number>),
    [100000000, -100000000],
    'the public Float32 vector exposes the strided high lanes'
  );
  t.deepEqual(
    Array.from(residualResult.get(0) as Iterable<number>),
    [1, -1],
    'the prepared result exposes residual-low lanes without another allocation'
  );

  prepared.destroy();
  device.destroy();
  t.end();
});

test('convertArrowToGPUVector performs explicit normalized numeric lowering', async t => {
  const device = new NullDevice({});
  const source = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([-1, 0.5, 0.25, 2])
  );
  const prepared = await convertArrowToGPUVector(device, source, {
    semantic: 'numeric',
    format: 'unorm8x2'
  });
  const result = await readArrowGPUVectorAsync(prepared.vector);

  t.equal(prepared.plan.strategy, 'convert-numeric', 'selects numeric materialization');
  t.match(prepared.plan.warnings.join(' '), /clamped/, 'diagnoses normalized clamping');
  t.deepEqual(
    getArrowFixedSizeListValues(result),
    new Uint8Array([0, 128, 64, 255]),
    'clamps, scales, and rounds normalized values'
  );

  prepared.destroy();
  device.destroy();
  t.end();
});

test('Arrow GPU table conversion is schema-driven and preserves source batches', async t => {
  const device = new NullDevice({});
  const first = makeBatch(new Float32Array([1, 2, 3, 4]), new Float32Array([1, 0, 0, 0, 1, 0]));
  const second = makeBatch(new Float32Array([5, 6]), new Float32Array([0, 0, 1]));
  const table = new arrow.Table([first, second]);
  const schema = {
    columns: [
      {name: 'instancePositions', source: 'positions'},
      {name: 'instanceColors', source: 'colors', semantic: 'color' as const}
    ]
  };
  const plan = planArrowTableGPUConversion(device, table, schema);

  t.equal(plan.length, 3, 'plans the shared table row count');
  t.equal(plan.columns.length, 2, 'plans selected columns only');
  t.equal(plan.cost.uploadCount, 4, 'counts uploads across both source batches and columns');
  t.equal(plan.cost.cpuPassCount, 1, 'counts one logical color transform family');

  const prepared = await convertArrowTableToGPUTable(device, table, schema);
  t.equal(prepared.table.numRows, 3, 'creates the complete GPU table');
  t.equal(prepared.table.batches.length, 2, 'preserves Arrow record batches');
  t.equal(
    prepared.table.batches[1].sourceInfo?.sourceRowIndexOffset,
    2,
    'retains source row identity'
  );
  t.equal(
    prepared.vectors.instancePositions.format,
    'float32x2',
    'direct column keeps its source layout'
  );
  t.equal(
    prepared.vectors.instanceColors.format,
    'unorm8x4',
    'semantic column receives canonical color layout'
  );
  t.deepEqual(
    getArrowFixedSizeListValues(await readArrowGPUVectorAsync(prepared.vectors.instanceColors)),
    new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]),
    'converts every batch without packing'
  );

  const buffers = Object.values(prepared.vectors).flatMap(vector =>
    vector.data.map(data => data.buffer)
  );
  prepared.destroy();
  t.ok(
    buffers.every(buffer => buffer.destroyed),
    'table destroy releases prepared storage'
  );
  device.destroy();
  t.end();
});

test('Arrow GPU streaming conversion preserves batch identity and one temporal origin', async t => {
  const device = new NullDevice({});
  const firstBatch = makeTimestampBatch([1000n, 1010n]);
  const secondBatch = makeTimestampBatch([1020n]);
  const values: number[][] = [];
  const sourceOffsets: number[] = [];

  for await (const prepared of convertArrowRecordBatchesToGPURecordBatches(
    device,
    [firstBatch, secondBatch],
    {columns: [{name: 'time'}]}
  )) {
    values.push(
      Array.from(await readArrowGPUVectorAsync(prepared.vectors.time), value => Number(value))
    );
    sourceOffsets.push(prepared.batch.sourceInfo?.sourceRowIndexOffset ?? -1);
    prepared.destroy();
  }

  t.deepEqual(values, [[0, 10], [20]], 'later batches reuse the first batch temporal origin');
  t.deepEqual(sourceOffsets, [0, 2], 'retains global source row offsets without combining batches');
  device.destroy();
  t.end();
});

test('Arrow GPU conversion rejects unsupported plans before allocating', t => {
  const device = new NullDevice({});
  const colors = makeArrowFixedSizeListVector(new arrow.Float32(), 3, new Float32Array([1, 0, 0]));

  t.throws(
    () => planArrowGPUConversion(device, colors, {semantic: 'color', policy: 'require-direct'}),
    /direct conversion was required/,
    'rejects semantic conversion under direct-only policy'
  );
  t.throws(
    () => planArrowGPUConversion(device, colors, {format: 'float32x4'}),
    /cannot lower/,
    'rejects incompatible physical reinterpretation'
  );

  device.destroy();
  t.end();
});

function makeBatch(positionValues: Float32Array, colorValues: Float32Array): arrow.RecordBatch {
  const positions = makeArrowFixedSizeListVector(new arrow.Float32(), 2, positionValues);
  const colors = makeArrowFixedSizeListVector(new arrow.Float32(), 3, colorValues);
  return new arrow.Table({positions, colors}).batches[0];
}

function makeTimestampBatch(values: bigint[]): arrow.RecordBatch {
  const type = new arrow.TimestampMillisecond();
  const vector = arrow.makeVector(
    arrow.makeData({type, length: values.length, data: new BigInt64Array(values)})
  );
  return new arrow.Table({time: vector}).batches[0];
}
