// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  expandArrowVector,
  getArrowFixedSizeListValues,
  getArrowMatrixVectorInfo,
  getArrowVectorBufferSource,
  getArrowVectorByteLength,
  isArrowFixedSizeListVector,
  makeArrowVectorFromArray,
  makeArrowMatrix4x4Vector,
  makeArrowMatrix3x3Vector,
  makeArrowMatrixVector,
  makeArrowFixedSizeListVector,
  makeGPUVectorFromArrow,
  readArrowGPUDataAsync,
  readArrowGPUVectorAsync
} from '@luma.gl/arrow';
import {DynamicBuffer} from '@luma.gl/engine';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

type ArrowUtf8Dictionary = arrow.Dictionary<arrow.Utf8, arrow.Int32>;

it('makeArrowFixedSizeListVector creates FixedSizeList vectors from typed arrays', () => {
  const vector = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([1, 2, 3, 4])
  );

  expect(
    Boolean(arrow.DataType.isFixedSizeList(vector.type)),
    'creates a FixedSizeList vector'
  ).toBe(true);
  expect(vector.type.listSize, 'sets the list size').toBe(2);
  expect(vector.length, 'sets the row count').toBe(2);
  expect(getArrowFixedSizeListValues(vector), 'exposes the child values').toEqual(
    new Float32Array([1, 2, 3, 4])
  );
  expect(
    getArrowVectorBufferSource(vector),
    'returns a buffer source for FixedSizeList vectors'
  ).toEqual(new Float32Array([1, 2, 3, 4]));

  void 0;
});

it('makeArrowVectorFromArray creates flat FixedSizeList rows from JS numeric arrays', () => {
  const vector = makeArrowVectorFromArray([1, 2, 3, 4], new arrow.Float32(), 2);

  expect(
    Boolean(arrow.DataType.isFixedSizeList(vector.type)),
    'creates a FixedSizeList vector'
  ).toBe(true);
  expect(vector.type.listSize, 'retains the requested row width').toBe(2);
  expect(getArrowFixedSizeListValues(vector), 'materializes typed child values').toEqual(
    new Float32Array([1, 2, 3, 4])
  );

  void 0;
});

it('makeArrowVectorFromArray mirrors scalar Apache Arrow array construction', () => {
  const vector = makeArrowVectorFromArray(['hello', 'luma.gl'], new arrow.Utf8());

  expect(vector.length, 'creates one Arrow row per string').toBe(2);
  expect(vector.get(0), 'retains scalar row values').toBe('hello');

  void 0;
});

it('isArrowFixedSizeListVector validates FixedSizeList vector shape', () => {
  const vector = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([1, 2, 3, 4])
  );
  const primitiveVector = arrow.makeVector(new Float32Array([1, 2, 3, 4]));

  expect(
    Boolean(isArrowFixedSizeListVector(vector, new arrow.Float32(), 2)),
    'accepts matching FixedSizeList vectors'
  ).toBe(true);
  expect(
    Boolean(isArrowFixedSizeListVector(vector, new arrow.Float32(), 3)),
    'rejects FixedSizeList vectors with the wrong list size'
  ).toBe(false);
  expect(
    Boolean(isArrowFixedSizeListVector(vector, new arrow.Uint8(), 2)),
    'rejects FixedSizeList vectors with the wrong child type'
  ).toBe(false);
  expect(
    Boolean(isArrowFixedSizeListVector(primitiveVector, new arrow.Float32(), 2)),
    'rejects primitive vectors'
  ).toBe(false);

  void 0;
});

it('getArrowVectorBufferSource returns primitive vector values', () => {
  const vector = arrow.makeVector(new Uint32Array([1, 2, 3]));

  expect(getArrowVectorBufferSource(vector), 'returns primitive vector values').toEqual(
    new Uint32Array([1, 2, 3])
  );

  void 0;
});

it('getArrowVectorByteLength sums Arrow data buffers and dictionary values', () => {
  const primitiveVector = arrow.makeVector(new Uint32Array([1, 2, 3]));
  const utf8Vector = arrow.vectorFromArray(['a', 'luma.gl'], new arrow.Utf8());
  const dictionary = arrow.vectorFromArray(['alpha', 'beta'], new arrow.Utf8());
  const dictionaryType = new arrow.Dictionary(new arrow.Utf8(), new arrow.Int32());
  const dictionaryVector = arrow.makeVector(
    arrow.makeData({
      type: dictionaryType,
      length: 3,
      data: new Int32Array([0, 1, 0]),
      dictionary
    })
  );

  expect(
    getArrowVectorByteLength(primitiveVector),
    'matches Vector.byteLength for primitive vectors'
  ).toBe(primitiveVector.byteLength);
  expect(
    getArrowVectorByteLength(utf8Vector),
    'matches Vector.byteLength for plain Utf8 vectors'
  ).toBe(utf8Vector.byteLength);
  expect(
    getArrowVectorByteLength(dictionaryVector),
    'includes dictionary value buffers for Dictionary vectors'
  ).toBe(dictionaryVector.byteLength + dictionary.byteLength);

  void 0;
});

it('makeArrowFixedSizeListVector validates typed array length', () => {
  expect(
    () => makeArrowFixedSizeListVector(new arrow.Uint8(), 4, new Uint8Array([1, 2, 3])),
    'throws if values cannot be divided into fixed-size rows'
  ).toThrow(/must be divisible/);

  void 0;
});

it('makeArrowMatrix3x3Vector emits WGSL-storage column-major rows', () => {
  const vector = makeArrowMatrix3x3Vector(new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]), {
    order: 'row-major'
  });

  expect(vector.type.listSize, 'pads each vec3 matrix column to four floats').toBe(12);
  expect(vector.length, 'creates one matrix row').toBe(1);
  expect(
    getArrowFixedSizeListValues(vector),
    'normalizes row-major logical values into WGSL-storage column-major layout'
  ).toEqual(new Float32Array([1, 4, 7, 0, 2, 5, 8, 0, 3, 6, 9, 0]));

  void 0;
});

it('makeArrowMatrixVector describes every supported WGSL floating-point matrix shape', () => {
  const matrixCases = [
    {shape: 'mat2x2', columns: 2, rows: 2, physicalComponentCount: 4},
    {shape: 'mat2x3', columns: 2, rows: 3, physicalComponentCount: 8},
    {shape: 'mat3x2', columns: 3, rows: 2, physicalComponentCount: 6},
    {shape: 'mat3x3', columns: 3, rows: 3, physicalComponentCount: 12},
    {shape: 'mat4x3', columns: 4, rows: 3, physicalComponentCount: 16},
    {shape: 'mat3x4', columns: 3, rows: 4, physicalComponentCount: 12},
    {shape: 'mat4x4', columns: 4, rows: 4, physicalComponentCount: 16}
  ] as const;

  for (const matrixCase of matrixCases) {
    const logicalComponentCount = matrixCase.columns * matrixCase.rows;
    const vector = makeArrowMatrixVector(
      matrixCase.shape,
      Float32Array.from({length: logicalComponentCount}, (_, index) => index + 1)
    );
    const matrixInfo = getArrowMatrixVectorInfo(vector);

    expect(
      matrixInfo,
      `${matrixCase.shape} retains explicit shape and physical layout metadata`
    ).toEqual({
      shape: matrixCase.shape,
      columns: matrixCase.columns,
      rows: matrixCase.rows,
      order: 'column-major',
      layout: 'wgsl-storage',
      valueType: 'float32',
      logicalComponentCount,
      physicalComponentCount: matrixCase.physicalComponentCount,
      columnStride: matrixCase.rows === 3 ? 4 : matrixCase.rows,
      byteStride: matrixCase.physicalComponentCount * Float32Array.BYTES_PER_ELEMENT
    });
    expect(
      vector.type.listSize,
      `${matrixCase.shape} materializes the expected FixedSizeList width`
    ).toBe(matrixCase.physicalComponentCount);
  }

  void 0;
});

it('makeArrowMatrixVector validates logical matrix lengths', () => {
  expect(
    () => makeArrowMatrixVector('mat4x4', new Float32Array(15)),
    'rejects incomplete matrix rows'
  ).toThrow(/must be divisible by 16/);

  void 0;
});

it('expandArrowVector gathers FixedSizeList rows from typed row mappings', () => {
  const sourceVector = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    4,
    new Float32Array([1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1])
  );

  const expandedVector = expandArrowVector(sourceVector, new Uint32Array([2, 0, 2, 1]));

  expect(
    Boolean(arrow.util.compareTypes(expandedVector.type, sourceVector.type)),
    'preserves FixedSizeList type'
  ).toBe(true);
  expect(expandedVector.length, 'creates one row per mapping entry').toBe(4);
  expect(
    getArrowFixedSizeListValues(expandedVector),
    'repeats source rows in mapping order'
  ).toEqual(new Float32Array([0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1]));

  void 0;
});

it('expandArrowVector accepts Arrow integer row mappings', () => {
  const sourceVector = makeArrowFixedSizeListVector(
    new arrow.Uint8(),
    2,
    new Uint8Array([10, 11, 20, 21, 30, 31])
  );
  const expandedVector = expandArrowVector(
    sourceVector,
    arrow.makeVector(new Int32Array([1, 2, 0]))
  );

  expect(
    getArrowFixedSizeListValues(expandedVector),
    'expands rows from Arrow mapping vectors'
  ).toEqual(new Uint8Array([20, 21, 30, 31, 10, 11]));

  void 0;
});

it('expandArrowVector gathers scalar numeric vectors', () => {
  const sourceVector = arrow.makeVector(new Int32Array([10, 20, 30]));
  const expandedVector = expandArrowVector(sourceVector, new Uint16Array([2, 2, 0]));

  expect(
    Boolean(arrow.util.compareTypes(expandedVector.type, sourceVector.type)),
    'preserves scalar numeric type'
  ).toBe(true);
  expect(Array.from(expandedVector.toArray()), 'gathers scalar rows').toEqual([30, 30, 10]);

  void 0;
});

it('expandArrowVector applies scalar nullValue to null source rows', () => {
  const sourceVector = arrow.vectorFromArray([10, null, 30], new arrow.Int32());
  const expandedVector = expandArrowVector(sourceVector, new Uint32Array([1, 2, 0, 1]), 99);

  expect(
    Array.from(expandedVector.toArray()),
    'uses scalar nullValue wherever mapped source rows are null'
  ).toEqual([99, 30, 10, 99]);

  void 0;
});

it('expandArrowVector applies FixedSizeList nullValue to null source rows', () => {
  const sourceVector = arrow.vectorFromArray(
    [[1, 2], null, [3, 4]],
    new arrow.FixedSizeList(2, new arrow.Field('value', new arrow.Float32(), false))
  ) as arrow.Vector<arrow.FixedSizeList<arrow.Float32>>;
  const expandedVector = expandArrowVector(sourceVector, new Uint32Array([1, 2, 0]), [9, 8]);

  expect(
    getArrowFixedSizeListValues(expandedVector),
    'uses vector nullValue wherever mapped source rows are null'
  ).toEqual(new Float32Array([9, 8, 3, 4, 1, 2]));

  void 0;
});

it('expandArrowVector checks null rows across chunked vectors', () => {
  const firstChunk = arrow.vectorFromArray([1, 2], new arrow.Int32());
  const secondChunk = arrow.vectorFromArray([null, 4], new arrow.Int32());
  const sourceVector = new arrow.Vector([firstChunk.data[0]!, secondChunk.data[0]!]);
  const expandedVector = expandArrowVector(sourceVector, new Uint32Array([0, 2, 3]), 99);

  expect(
    Array.from(expandedVector.toArray()),
    'uses nullValue for null rows in later chunks'
  ).toEqual([1, 99, 4]);

  void 0;
});

it('expandArrowVector validates nullValue shape and type', () => {
  const scalarVector = arrow.makeVector(new Float32Array([10, 20]));
  const listVector = makeArrowFixedSizeListVector(
    new arrow.Uint8(),
    4,
    new Uint8Array([10, 20, 30, 255])
  );

  expect(
    () => expandArrowVector(scalarVector, new Uint32Array([0]), [1]),
    'rejects array nullValue for scalar vectors'
  ).toThrow(/scalar nullValue must be a number/);
  expect(
    () => expandArrowVector(listVector, new Uint32Array([0]), 1),
    'rejects scalar nullValue for FixedSizeList vectors'
  ).toThrow(/FixedSizeList nullValue must be an array/);
  expect(
    () => expandArrowVector(listVector, new Uint32Array([0]), [1, 2, 3]),
    'rejects FixedSizeList nullValue with the wrong width'
  ).toThrow(/nullValue length 3 must match listSize 4/);

  void 0;
});

it('expandArrowVector preserves null-row values-buffer behavior without nullValue', () => {
  const sourceVector = arrow.vectorFromArray([10, null, 30], new arrow.Int32());
  const expandedVector = expandArrowVector(sourceVector, new Uint32Array([1]));

  expect(
    Array.from(expandedVector.toArray()),
    'omitted nullValue preserves existing values-buffer expansion behavior'
  ).toEqual([0]);

  void 0;
});

it('expandArrowVector rejects invalid mappings and unsupported vectors', () => {
  const sourceVector = arrow.makeVector(new Float32Array([10, 20]));

  expect(
    () => expandArrowVector(sourceVector, new Int32Array([-1])),
    'rejects negative row indices'
  ).toThrow(/cannot contain negative indices/);
  expect(
    () => expandArrowVector(sourceVector, new Uint32Array([2])),
    'rejects out-of-range row indices'
  ).toThrow(/outside vector length 2/);
  expect(
    () =>
      expandArrowVector(
        sourceVector,
        arrow.makeVector(new Float32Array([0])) as unknown as arrow.Vector<arrow.Int>
      ),
    'rejects non-integer Arrow row mappings'
  ).toThrow(/row mapping must use 8, 16, or 32-bit integers/);
  expect(
    () =>
      expandArrowVector(
        arrow.vectorFromArray(['alpha'], new arrow.Utf8()) as never,
        new Uint32Array([0])
      ),
    'rejects unsupported source vector types'
  ).toThrow(/does not support Arrow type/);

  void 0;
});

it('GPUVector creates a GPU buffer from an Arrow vector', () => {
  const device = new NullDevice({});
  const vector = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([1, 2, 3, 4])
  );
  const gpuVector = makeGPUVectorFromArrow(device, vector);

  expect(Boolean('vector' in gpuVector), 'does not retain the source Arrow vector').toBe(false);
  expect(gpuVector.dataType, 'exposes the Arrow vector type').toBe(vector.type);
  expect(gpuVector.format, 'maps FixedSizeList<Float32, 2> to float32x2').toBe('float32x2');
  expect(gpuVector.length, 'exposes the Arrow vector length').toBe(2);
  expect(gpuVector.stride, 'exposes the FixedSizeList stride').toBe(2);
  expect(gpuVector.data[0].buffer.byteLength, 'creates a buffer from the vector values').toBe(16);

  gpuVector.destroy();
  void 0;
});

it('GPUVector creates one packed GPU buffer from a canonical Arrow matrix vector', async () => {
  const device = new NullDevice({});
  const sourceVector = makeArrowMatrix4x4Vector(
    new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2, 3, 4, 1])
  );
  const gpuVector = makeGPUVectorFromArrow(device, sourceVector, {name: 'matrix'});
  const result = await readArrowGPUVectorAsync(gpuVector);

  expect(gpuVector.stride, 'preserves one mat4x4 scalar stride').toBe(16);
  expect(gpuVector.byteStride, 'preserves one mat4x4 row byte stride').toBe(64);
  expect(
    getArrowFixedSizeListValues(result as arrow.Vector<arrow.FixedSizeList<arrow.Float32>>),
    'round-trips canonical matrix storage rows'
  ).toEqual(getArrowFixedSizeListValues(sourceVector));

  gpuVector.destroy();
  void 0;
});

it('GPUVector readAsync round-trips scalar numeric vectors', async () => {
  const device = new NullDevice({});
  const sourceVector = arrow.makeVector(new Int32Array([1, -2, 3]));
  const gpuVector = makeGPUVectorFromArrow(device, sourceVector);

  const result = await readArrowGPUVectorAsync(gpuVector);

  expect(
    Boolean(arrow.util.compareTypes(result.type, sourceVector.type)),
    'preserves Arrow dynamic type'
  ).toBe(true);
  expect(result.length, 'preserves row count').toBe(sourceVector.length);
  expect(Array.from(result.toArray()), 'reads scalar values from GPU buffer').toEqual([1, -2, 3]);

  gpuVector.destroy();
  void 0;
});

it('GPUVector uploads Arrow Data chunks into separate GPUData buffers', async () => {
  const device = new NullDevice({});
  const type = new arrow.Float32();
  const sourceVector = new arrow.Vector([
    arrow.makeData({type, length: 2, data: new Float32Array([1, 2])}),
    arrow.makeData({type, length: 1, data: new Float32Array([3])})
  ]);
  const gpuVector = makeGPUVectorFromArrow(device, sourceVector);

  const vectorResult = await readArrowGPUVectorAsync(gpuVector);
  const firstChunkResult = await readArrowGPUDataAsync(gpuVector.data[0]);

  expect(gpuVector.data.length, 'exposes one GPUData chunk per source chunk').toBe(2);
  expect(Boolean(gpuVector.data[0] instanceof GPUData), 'uses GPUData chunks').toBe(true);
  expect(gpuVector.data[0].buffer, 'keeps each GPUData chunk on its own GPU buffer').not.toBe(
    gpuVector.data[1].buffer
  );
  expect(gpuVector.data[0].buffer.byteLength, 'uploads the first source chunk buffer').toBe(8);
  expect(gpuVector.data[1].buffer.byteLength, 'uploads the second source chunk buffer').toBe(4);
  expect(
    Boolean(gpuVector.data[0].readbackMetadata),
    'fixed-width chunks do not retain extra readback metadata'
  ).toBe(false);
  expect(gpuVector.data[1].byteOffset, 'later chunks start at their own GPUData buffer').toBe(0);
  expect(Array.from(vectorResult.toArray()), 'reads every chunk row').toEqual([1, 2, 3]);
  expect(
    Array.from(arrow.makeVector(firstChunkResult).toArray()),
    'reads one GPU data chunk'
  ).toEqual([1, 2]);

  gpuVector.destroy();
  void 0;
});

it('GPUVector preserves UTF-8 chunk boundaries and readAsync rows', async () => {
  const device = new NullDevice({});
  const firstChunk = arrow.vectorFromArray(['alpha', null], new arrow.Utf8());
  const secondChunk = arrow.vectorFromArray(['beta'], new arrow.Utf8());
  const sourceVector = new arrow.Vector([...firstChunk.data, ...secondChunk.data]);
  const gpuVector = makeGPUVectorFromArrow(device, sourceVector);

  const vectorResult = await readArrowGPUVectorAsync(gpuVector);
  const firstChunkResult = await readArrowGPUDataAsync(gpuVector.data[0]);

  expect(gpuVector.data.length, 'keeps one GPUData object per UTF-8 source chunk').toBe(2);
  expect(gpuVector.data[0].readbackMetadata?.kind, 'retains compact UTF-8 readback metadata').toBe(
    'utf8'
  );
  expect(
    Array.from(vectorResult.toArray()),
    'reads UTF-8 rows back across chunk boundaries'
  ).toEqual(['alpha', null, 'beta']);
  expect(
    Array.from(arrow.makeVector(firstChunkResult).toArray()),
    'reads an individual UTF-8 GPUData chunk'
  ).toEqual(['alpha', null]);

  gpuVector.destroy();
  void 0;
});

it('GPUVector UTF-8 readAsync normalizes sliced offsets without retaining source data', async () => {
  const device = new NullDevice({});
  const sourceVector = arrow.vectorFromArray(['skip', null, 'kept'], new arrow.Utf8());
  const slicedVector = sourceVector.slice(1) as arrow.Vector<arrow.Utf8>;
  const gpuVector = makeGPUVectorFromArrow(device, slicedVector);

  const result = await readArrowGPUVectorAsync(gpuVector);

  expect(Array.from(result.toArray()), 'reads sliced UTF-8 rows').toEqual([null, 'kept']);
  expect(
    Array.from(result.data[0].valueOffsets as Int32Array),
    'reconstructs local compact UTF-8 offsets'
  ).toEqual([0, 0, 4]);

  gpuVector.destroy();
  void 0;
});

it('GPUVector Dictionary<Utf8> upload uses sliced index rows', async () => {
  const device = new NullDevice({});
  const sourceVector = makeExplicitArrowDictionaryVector(
    ['skip', 'alpha', 'beta'],
    new Int32Array([0, 1, 2, 1]),
    1,
    2
  );
  const gpuVector = makeGPUVectorFromArrow(device, sourceVector);

  const indexBytes = await gpuVector.data[0].buffer.readAsync(
    gpuVector.data[0].byteOffset,
    gpuVector.data[0].length * gpuVector.data[0].byteStride
  );
  const uploadedIndices = new Int32Array(
    indexBytes.buffer,
    indexBytes.byteOffset,
    sourceVector.length
  );

  expect(Array.from(uploadedIndices), 'uploads the sliced logical dictionary index range').toEqual([
    1, 2
  ]);

  gpuVector.destroy();
  void 0;
});

it('GPUVector readAsync round-trips FixedSizeList vectors', async () => {
  const device = new NullDevice({});
  const sourceVector = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([1, 2, 3, 4])
  );
  const gpuVector = makeGPUVectorFromArrow(device, sourceVector);

  const result = await readArrowGPUVectorAsync(gpuVector);

  expect(
    Boolean(arrow.util.compareTypes(result.type, sourceVector.type)),
    'preserves FixedSizeList type'
  ).toBe(true);
  expect(result.length, 'preserves FixedSizeList row count').toBe(sourceVector.length);
  expect(getArrowFixedSizeListValues(result), 'reads child values from GPU buffer').toEqual(
    new Float32Array([1, 2, 3, 4])
  );

  gpuVector.destroy();
  void 0;
});

it('GPUVector infers Arrow-vector object construction from vector props', () => {
  const device = new NullDevice({});
  const vector = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([1, 2, 3, 4])
  );
  const gpuVector = makeGPUVectorFromArrow(device, vector, {name: 'positions'});

  expect(gpuVector.name, 'exposes vector name').toBe('positions');
  expect(gpuVector.dataType, 'exposes the Arrow vector type').toBe(vector.type);
  expect(gpuVector.length, 'exposes vector length').toBe(2);
  expect(gpuVector.stride, 'exposes scalar stride').toBe(2);
  expect(gpuVector.byteOffset, 'defaults byteOffset').toBe(0);
  expect(gpuVector.byteStride, 'deduces byteStride').toBe(8);
  expect(gpuVector.ownsBuffer, 'uploaded vectors own their buffers').toBe(true);

  gpuVector.destroy();
  void 0;
});

it('GPUVector wraps existing typed buffers', () => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({byteLength: 16});
  const gpuVector = new GPUVector({
    type: 'buffer',
    name: 'weights',
    buffer,
    dataType: new arrow.Float32(),
    length: 4,
    byteStride: 4,
    ownsBuffer: false
  });
  let destroyed = false;
  const destroy = buffer.destroy.bind(buffer);
  buffer.destroy = () => {
    destroyed = true;
    destroy();
  };

  expect(gpuVector.name, 'exposes vector name').toBe('weights');
  expect(gpuVector.dataType.typeId, 'exposes supplied Arrow type').toBe(new arrow.Float32().typeId);
  expect(gpuVector.length, 'exposes supplied length').toBe(4);
  expect(gpuVector.stride, 'deduces scalar stride').toBe(1);
  expect(gpuVector.byteStride, 'deduces byte stride').toBe(4);
  expect(gpuVector.data.length, 'exposes one GPUData chunk for the wrapped buffer').toBe(1);
  expect(gpuVector.data[0].buffer, 'GPUData keeps the wrapped buffer').toBe(buffer);

  gpuVector.destroy();
  expect(destroyed, 'does not destroy non-owned buffers').toBe(false);
  buffer.destroy();
  void 0;
});

it('GPUVector readAsync respects wrapped-buffer byteOffset and padded byteStride', async () => {
  const device = new NullDevice({});
  const bytes = new Uint8Array(20);
  new Float32Array(bytes.buffer, 4, 1)[0] = 1.5;
  new Float32Array(bytes.buffer, 12, 1)[0] = 2.5;
  const buffer = device.createBuffer({data: bytes});
  const gpuVector = new GPUVector({
    type: 'buffer',
    name: 'weights',
    buffer,
    dataType: new arrow.Float32(),
    length: 2,
    byteOffset: 4,
    byteStride: 8,
    ownsBuffer: false
  });

  const result = await readArrowGPUVectorAsync(gpuVector);

  expect(Array.from(result.toArray()), 'compacts padded rows').toEqual([1.5, 2.5]);

  gpuVector.destroy();
  buffer.destroy();
  void 0;
});

it('GPUVector wraps interleaved buffers', () => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({byteLength: 32});
  const gpuVector = new GPUVector({
    type: 'interleaved',
    name: 'instances',
    buffer,
    dataType: new arrow.Binary(),
    length: 2,
    byteStride: 16,
    attributes: [
      {attribute: 'positions', format: 'float32x3', byteOffset: 0},
      {attribute: 'colors', format: 'uint8x4', byteOffset: 12}
    ],
    ownsBuffer: true
  });

  expect(gpuVector.name, 'exposes vector name').toBe('instances');
  expect(
    Boolean(arrow.DataType.isBinary(gpuVector.dataType)),
    'uses Arrow Binary for interleaved storage'
  ).toBe(true);
  expect(gpuVector.length, 'exposes row count').toBe(2);
  expect(gpuVector.stride, 'uses byte stride as opaque row stride').toBe(16);
  expect(gpuVector.data.length, 'exposes one opaque GPUData chunk').toBe(1);
  expect(
    Boolean(arrow.DataType.isBinary(gpuVector.data[0].dataType)),
    'GPUData uses Arrow Binary'
  ).toBe(true);
  expect(gpuVector.data[0].buffer, 'GPUData keeps the interleaved buffer').toBe(buffer);
  expect(gpuVector.bufferLayout, 'exposes interleaved buffer layout').toEqual({
    name: 'instances',
    byteStride: 16,
    attributes: [
      {attribute: 'positions', format: 'float32x3', byteOffset: 0},
      {attribute: 'colors', format: 'uint8x4', byteOffset: 12}
    ]
  });

  gpuVector.destroy();
  void 0;
});

it('GPUVector readAsync rejects interleaved vectors', async () => {
  const device = new NullDevice({});
  const gpuVector = new GPUVector({
    type: 'interleaved',
    name: 'instances',
    buffer: device.createBuffer({byteLength: 32}),
    dataType: new arrow.Binary(),
    length: 2,
    byteStride: 16,
    attributes: [
      {attribute: 'positions', format: 'float32x3', byteOffset: 0},
      {attribute: 'colors', format: 'uint8x4', byteOffset: 12}
    ],
    ownsBuffer: true
  });

  try {
    await readArrowGPUVectorAsync(gpuVector);
    expect(false, 'readAsync should reject interleaved vectors').toBe(true);
  } catch (error) {
    expect(
      Boolean(error instanceof Error && /does not support interleaved vectors/.test(error.message)),
      'throws a clear unsupported error'
    ).toBe(true);
  }

  gpuVector.destroy();
  void 0;
});

it('GPUVector transfers buffer ownership between same-buffer views', () => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({byteLength: 16});
  const source = new GPUVector({
    type: 'buffer',
    name: 'source',
    buffer,
    dataType: new arrow.Float32(),
    length: 4,
    byteStride: 4,
    ownsBuffer: true
  });
  const target = new GPUVector({
    type: 'buffer',
    name: 'target',
    buffer,
    dataType: new arrow.Float32(),
    length: 4,
    byteStride: 4,
    ownsBuffer: false
  });

  source.transferBufferOwnership(target);

  expect(source.ownsBuffer, 'source no longer owns the buffer').toBe(false);
  expect(target.ownsBuffer, 'target now owns the buffer').toBe(true);

  source.destroy();
  target.destroy();
  void 0;
});

it('GPUVector addData aggregates GPU chunks without adopting their buffers', () => {
  const device = new NullDevice({});
  const firstBuffer = device.createBuffer({byteLength: 8});
  const secondBuffer = device.createBuffer({byteLength: 8});
  const firstData = new GPUData({
    buffer: new DynamicBuffer(device, {buffer: firstBuffer, ownsBuffer: false}),
    dataType: new arrow.Float32(),
    format: 'float32',
    length: 2,
    byteStride: 4
  });
  const secondData = new GPUData({
    buffer: new DynamicBuffer(device, {buffer: secondBuffer, ownsBuffer: false}),
    dataType: new arrow.Float32(),
    format: 'float32',
    length: 2,
    byteStride: 4
  });
  const gpuVector = new GPUVector({
    type: 'data',
    name: 'values',
    dataType: new arrow.Float32(),
    data: [firstData]
  });

  gpuVector.addData(secondData);

  expect(gpuVector.length, 'updates aggregate row count').toBe(4);
  expect(gpuVector.data.length, 'preserves each appended GPU data chunk').toBe(2);
  expect(gpuVector.data[0].buffer, 'keeps aggregate vector storage on its GPUData chunks').not.toBe(
    gpuVector.data[1].buffer
  );

  gpuVector.destroy();
  expect(Boolean(firstBuffer.destroyed), 'does not adopt ownership of the first data buffer').toBe(
    false
  );
  expect(
    Boolean(secondBuffer.destroyed),
    'does not adopt ownership of the appended data buffer'
  ).toBe(false);
  firstBuffer.destroy();
  secondBuffer.destroy();
  void 0;
});

it('GPUVector exposes primitive vector length and stride', () => {
  const device = new NullDevice({});
  const vector = arrow.makeVector(new Float32Array([1, 2, 3]));
  const gpuVector = makeGPUVectorFromArrow(device, vector);

  expect(gpuVector.length, 'exposes the primitive vector length').toBe(3);
  expect(gpuVector.stride, 'exposes primitive vector stride as 1').toBe(1);

  gpuVector.destroy();
  void 0;
});

function makeExplicitArrowDictionaryVector(
  dictionaryValues: readonly string[],
  indices: Int32Array,
  offset = 0,
  length = indices.length - offset
): arrow.Vector<ArrowUtf8Dictionary> {
  const dictionaryType = new arrow.Dictionary(new arrow.Utf8(), new arrow.Int32());
  const dictionary = arrow.vectorFromArray(
    dictionaryValues,
    new arrow.Utf8()
  ) as arrow.Vector<arrow.Utf8>;
  const data = arrow.makeData({
    type: dictionaryType,
    length,
    offset,
    data: indices,
    dictionary
  });
  return new arrow.Vector([data]) as arrow.Vector<ArrowUtf8Dictionary>;
}
