// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  getArrowFixedSizeListValues,
  getArrowMatrixVectorInfo,
  MATRIX_LAYOUT_METADATA_KEY,
  MATRIX_ORDER_METADATA_KEY,
  MATRIX_SHAPE_METADATA_KEY,
  makeArrowMatrixVector,
  prepareArrowMatrixGPUVector,
  readArrowGPUVectorAsync
} from '@luma.gl/arrow';
import {NullDevice} from '@luma.gl/test-utils';
import {Data, Field, FixedSizeList, Float32, Float64, Vector, makeData} from 'apache-arrow';

test('prepareArrowMatrixGPUVector keeps canonical Float32 matrices GPU-ready', async t => {
  const device = new NullDevice({});
  const source = makeArrowMatrixVector('mat4x3', new Float32Array(12));
  const prepared = await prepareArrowMatrixGPUVector(device, source);
  const result = await readArrowGPUVectorAsync(prepared.matrix);

  t.deepEqual(
    getArrowMatrixVectorInfo(prepared.matrix),
    {
      shape: 'mat4x3',
      columns: 4,
      rows: 3,
      order: 'column-major',
      layout: 'wgsl-storage',
      valueType: 'float32',
      logicalComponentCount: 12,
      physicalComponentCount: 16,
      columnStride: 4,
      byteStride: 64
    },
    'exposes canonical Float32 WGSL-storage matrix metadata'
  );
  t.deepEqual(
    getArrowFixedSizeListValues(result as Vector<FixedSizeList<Float32>>),
    new Float32Array(16),
    'keeps canonical matrix values directly uploadable'
  );

  prepared.destroy();
  t.end();
});

test('prepareArrowMatrixGPUVector normalizes packed row-major Float64 matrices', async t => {
  const device = new NullDevice({});
  const source = makeRawMatrixVector(
    new Float64(),
    9,
    new Float64Array([1, 2, 3, 4, 5, 6, 7, 8, 9]),
    {
      shape: 'mat3x3',
      order: 'row-major',
      layout: 'packed'
    }
  );
  const prepared = await prepareArrowMatrixGPUVector(device, source);
  const result = await readArrowGPUVectorAsync(prepared.matrix);

  t.deepEqual(
    getArrowFixedSizeListValues(result as Vector<FixedSizeList<Float32>>),
    new Float32Array([1, 4, 7, 0, 2, 5, 8, 0, 3, 6, 9, 0]),
    'transposes, pads, and truncates Float64 values into canonical Float32 storage'
  );
  t.equal(prepared.sourceInfo.valueType, 'float64', 'retains Float64 source metadata');
  t.equal(prepared.matrixInfo.valueType, 'float32', 'emits Float32 GPU matrix metadata');

  prepared.destroy();
  t.end();
});

function makeRawMatrixVector<T extends Float32 | Float64>(
  childType: T,
  listSize: number,
  values: T['TArray'],
  metadata: {shape: string; order: string; layout: string}
): Vector<FixedSizeList<T>> {
  const childData = makeData({
    type: childType,
    length: values.length,
    data: values
  }) as Data<T>;
  const valueField = new Field(
    'value',
    childType,
    false,
    new Map([
      [MATRIX_SHAPE_METADATA_KEY, metadata.shape],
      [MATRIX_ORDER_METADATA_KEY, metadata.order],
      [MATRIX_LAYOUT_METADATA_KEY, metadata.layout]
    ])
  );
  const matrixType = new FixedSizeList(listSize, valueField);
  const matrixData = makeData({
    type: matrixType,
    length: values.length / listSize,
    nullCount: 0,
    nullBitmap: null,
    child: childData
  }) as Data<FixedSizeList<T>>;
  return new Vector([matrixData]);
}
